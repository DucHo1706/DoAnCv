import os
import json
import requests
import nlp_processor

def get_csharp_api_url():
    return os.getenv("CSHARP_API_URL", "http://localhost:5286/api")

def sync_skills_to_db(new_skills: list):
    """Dong bo ky nang moi sang C# backend de luu SQL Server"""
    csharp_url = get_csharp_api_url()
    try:
        url = f"{csharp_url}/skills/sync"
        response = requests.post(url, json=new_skills, verify=False, timeout=5)
        if response.status_code == 200:
            res_data = response.json()
            print(f"[DB SYNC] Dong bo thanh cong sang SQL Server: {res_data.get('message')}")
        else:
            print(f"[DB SYNC WARNING] Khong the dong bo sang SQL Server. Status code: {response.status_code}")
    except Exception as e:
        print(f"[DB SYNC WARNING] Loi ket noi toi C# backend: {e}")

def fetch_skills_from_db_on_startup():
    """Lay toan bo ky nang tu SQL Server ve file local tai startup"""
    csharp_url = get_csharp_api_url()
    try:
        url = f"{csharp_url}/skills"
        response = requests.get(url, verify=False, timeout=5)
        if response.status_code == 200:
            skills_data = response.json()
            skills_list = [s["name"] for s in skills_data if isinstance(s, dict) and "name" in s]
            if skills_list:
                existing_skills = set()
                if os.path.exists("skills.json"):
                    with open("skills.json", "r", encoding="utf-8") as f:
                        try:
                            data = json.load(f)
                            if isinstance(data, list):
                                existing_skills = set(s.lower().strip() for s in data if s.strip())
                        except Exception:
                            pass
                
                new_added = set(s.lower().strip() for s in skills_list if s.strip()) - existing_skills
                if new_added:
                    merged = sorted(existing_skills | new_added)
                    with open("skills.json", "w", encoding="utf-8") as f:
                        json.dump(merged, f, ensure_ascii=False, indent=2)
                    nlp_processor.reload_knowledge_base()
                    print(f"[DB STARTUP] Da dong bo {len(new_added)} ky nang moi tu SQL Server database vao skills.json")
                else:
                    print("[DB STARTUP] Danh sach ky nang local da dong bo trung khop voi SQL Server database.")
            else:
                if os.path.exists("skills.json"):
                    with open("skills.json", "r", encoding="utf-8") as f:
                        try:
                            local_skills = json.load(f)
                            if isinstance(local_skills, list) and local_skills:
                                print(f"[DB STARTUP] Database SQL Server rong. Dang seed {len(local_skills)} ky nang tu skills.json...")
                                sync_skills_to_db(local_skills)
                        except Exception as e:
                            print(f"[DB STARTUP ERROR] Khong the seed du lieu: {e}")
            return True
        else:
            print(f"[DB STARTUP WARNING] Khong the lay ky nang tu SQL Server. Status code: {response.status_code}")
    except Exception as e:
        print(f"[DB STARTUP WARNING] Loi ket noi toi C# backend tai startup: {e}")
    return False
