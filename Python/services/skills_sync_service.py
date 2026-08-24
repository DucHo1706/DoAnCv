import os
import json
import requests
from pathlib import Path
from datetime import datetime, timedelta, timezone
import nlp_processor
from services.runtime_paths import runtime_file
from services.skill_mining_guard import is_suspicious_skill, normalize_skill

def get_csharp_api_url():
    return os.getenv("CSHARP_API_URL", "http://localhost:5286/api")


VIETNAM_TIMEZONE = timezone(timedelta(hours=7))


def seconds_until_next_sync(now_utc: datetime | None = None) -> float:
    """Khoảng chờ tới 02:00 giờ Việt Nam tiếp theo."""
    current_utc = now_utc or datetime.now(timezone.utc)
    if current_utc.tzinfo is None:
        current_utc = current_utc.replace(tzinfo=timezone.utc)
    current_vietnam = current_utc.astimezone(VIETNAM_TIMEZONE)
    next_sync = current_vietnam.replace(hour=2, minute=0, second=0, microsecond=0)
    if next_sync <= current_vietnam:
        next_sync += timedelta(days=1)
    return max(1.0, (next_sync - current_vietnam).total_seconds())

def sync_skills_to_db(new_skills: list):
    """Không tự ghi skill do AI phát hiện vào taxonomy đã duyệt."""
    return False

def _write_json_atomic(target: str, payload) -> None:
    """Thay file taxonomy theo một thao tác để request đang chạy không đọc file dở."""
    destination = Path(target)
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_suffix(destination.suffix + ".tmp")
    with temporary.open("w", encoding="utf-8") as stream:
        json.dump(payload, stream, ensure_ascii=False, indent=2)
    os.replace(temporary, destination)


def fetch_skills_from_db_on_startup():
    """Đồng bộ taxonomy đã duyệt từ backend và reload bộ nhận diện trong tiến trình."""
    csharp_url = get_csharp_api_url()
    try:
        url = f"{csharp_url}/skills"
        response = requests.get(url, verify=False, timeout=5)
        if response.status_code == 200:
            skills_data = response.json()
            taxonomy = []
            for skill in skills_data:
                if not isinstance(skill, dict):
                    continue
                canonical = normalize_skill(skill.get("name"))
                if not canonical or is_suspicious_skill(canonical):
                    continue
                aliases = []
                for alias_entry in skill.get("aliases", []) or []:
                    alias = alias_entry.get("alias") if isinstance(alias_entry, dict) else alias_entry
                    alias_text = str(alias or "").strip()
                    if alias_text and not is_suspicious_skill(alias_text):
                        aliases.append(alias_text)
                taxonomy.append({"name": canonical, "aliases": sorted(set(aliases), key=str.casefold)})

            if taxonomy:
                taxonomy.sort(key=lambda item: item["name"])
                _write_json_atomic(runtime_file("approved_skill_taxonomy.json"), taxonomy)
                _write_json_atomic(
                    runtime_file("approved_skills.json"),
                    [item["name"] for item in taxonomy],
                )
                count = nlp_processor.reload_knowledge_base()
                alias_count = sum(len(item["aliases"]) for item in taxonomy)
                print(f"[TAXONOMY SYNC] Da nap taxonomy da duyet tu SQL Server. Tong ky nang hop le: {count}; bi danh: {alias_count}.")
            else:
                print("[TAXONOMY SYNC] SQL Server chua co taxonomy da duyet; giu danh muc cuc bo, khong tu seed nguoc.")
            return True
        else:
            print(f"[TAXONOMY SYNC WARNING] Khong the lay ky nang tu SQL Server. Status code: {response.status_code}")
    except Exception as e:
        print(f"[TAXONOMY SYNC WARNING] Loi ket noi toi C# backend: {e}")
    return False
