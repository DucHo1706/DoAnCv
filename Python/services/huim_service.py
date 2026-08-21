import os
from typing import List, Dict, Set, Tuple, Any
from utils.logger import logger
from services.skill_mining_guard import (
    canonicalize_skill_values,
    canonicalize_transactions_with_indices,
    rarity_label,
    write_metadata,
)
from services.runtime_paths import runtime_file
from services.mining_model_store import flatten_results, save_domain_model

LAST_TRAINING_METADATA: Dict[str, Any] = {}

class TwoPhaseHUIM:
    def __init__(self, min_utility: float, max_itemset_size: int = 3):
        self.min_utility = min_utility
        # Các tập quá lớn vừa khó giải thích cho HR vừa làm số lượng ứng viên
        # tăng theo cấp số nhân. Ba kỹ năng là đủ cho mục tiêu gợi ý học tập.
        self.max_itemset_size = max(1, max_itemset_size)

    def run(self, transactions: List[Dict[str, Any]], external_utilities: Dict[str, float]) -> List[Dict[str, Any]]:
        """
        Chạy thuật toán Two-Phase HUIM (Liu et al., 2005)
        - transactions: Danh sách tập giao dịch CV, mỗi giao dịch là:
          { "items": set(kỹ năng), "quantities": {kỹ năng: mức độ thành thạo 1-5} }
        - external_utilities: Bảng trọng số/lợi nhuận (lương trung bình vị trí yêu cầu kỹ năng đó)
        """
        if not transactions:
            return []

        # 1. Tính toán Transaction Utility (TU) cho mỗi giao dịch CV
        for t in transactions:
            tu = 0.0
            for item in t["items"]:
                q = t["quantities"].get(item, 1.0)
                p = external_utilities.get(item, 1.0)
                tu += q * p
            t["tu"] = tu

        # 2. Phase I: Tìm High Transaction-Weighted Utilization Itemsets (HTWUIs)
        # Bắt đầu với tập 1-itemset HTWUIs
        item_twu = {}
        for t in transactions:
            for item in t["items"]:
                item_twu[item] = item_twu.get(item, 0.0) + t["tu"]

        # Lọc các 1-itemset thỏa mãn min_utility
        h1 = []
        for item, twu in item_twu.items():
            if twu >= self.min_utility:
                h1.append((item,))

        htwuis = {}
        for itemset in h1:
            twu = item_twu[itemset[0]]
            htwuis[itemset] = twu

        current_htwui = list(h1)
        k = 2

        # Tạo level-wise candidates giống Apriori nhưng cắt tỉa theo TWU
        while len(current_htwui) > 0 and k <= self.max_itemset_size:
            candidates = []
            n = len(current_htwui)
            for i in range(n):
                for j in range(i + 1, n):
                    l1, l2 = list(current_htwui[i]), list(current_htwui[j])
                    l1.sort()
                    l2.sort()
                    if l1[:k-2] == l2[:k-2]:
                        new_itemset = tuple(sorted(list(set(l1) | set(l2))))
                        if len(new_itemset) == k:
                            candidates.append(new_itemset)
            
            candidates = list(set(candidates))
            if not candidates:
                break

            # Tính toán TWU của các candidate k-itemset
            cand_twu = {}
            for t in transactions:
                t_items = t["items"]
                for cand in candidates:
                    if set(cand).issubset(t_items):
                        cand_twu[cand] = cand_twu.get(cand, 0.0) + t["tu"]

            # Lọc candidate có twu >= min_utility
            fk = []
            for cand, twu in cand_twu.items():
                if twu >= self.min_utility:
                    fk.append(cand)
                    htwuis[cand] = twu

            current_htwui = fk
            k += 1

        # 3. Phase II: Quét cơ sở dữ liệu thực tế để tính toán chính xác Utility của các HTWUIs
        high_utility_itemsets = []
        for itemset in htwuis.keys():
            exact_utility = 0.0
            count = 0
            for t in transactions:
                if set(itemset).issubset(t["items"]):
                    count += 1
                    itemset_utility = 0.0
                    for item in itemset:
                        q = t["quantities"].get(item, 1.0)
                        p = external_utilities.get(item, 1.0)
                        itemset_utility += q * p
                    exact_utility += itemset_utility

            if exact_utility >= self.min_utility:
                high_utility_itemsets.append({
                    "itemset": list(itemset),
                    "utility": round(exact_utility, 2),
                    "support_count": count
                })

        # Sắp xếp các tập kỹ năng có lợi ích lớn nhất giảm dần
        high_utility_itemsets.sort(key=lambda x: x["utility"], reverse=True)
        return high_utility_itemsets

HUIM_FILE = runtime_file("high_utility_itemsets.json")
HUIM_METADATA_FILE = runtime_file("high_utility_itemsets_metadata.json")

def train_and_save_huim(transactions_input: List[Dict[str, Any]], external_utilities: Dict[str, float], min_utility: float,
                        domain: str | None = None, taxonomy_skills: List[str] | None = None,
                        taxonomy_aliases: Dict[str, str] | None = None,
                        dataset_id: str | None = None, min_support_count: int = 2,
                        reset_models: bool = False) -> List[Dict[str, Any]]:
    """
    Chạy thuật toán Two-Phase HUIM và lưu kết quả vào file JSON.
    """
    try:
        global LAST_TRAINING_METADATA
        if not domain and not taxonomy_skills:
            LAST_TRAINING_METADATA = {"status": "skipped", "reason": "Thiếu domain hoặc taxonomy đã duyệt; không ghi đè kết quả cũ."}
            write_metadata(HUIM_METADATA_FILE, LAST_TRAINING_METADATA)
            logger.warning(LAST_TRAINING_METADATA["reason"])
            return []
        raw_items = []
        raw_quantities = []
        for t in transactions_input:
            items_list = t.get("items", [])
            quantities_dict = t.get("quantities", {})
            raw_items.append(items_list)
            raw_quantities.append(quantities_dict)

        clean_items, source_indices, metadata = canonicalize_transactions_with_indices(
            raw_items, domain, taxonomy_skills, taxonomy_aliases
        )
        transactions = []
        for items_set, source_index in zip(clean_items, source_indices):
            quantities_dict = raw_quantities[source_index]
            quant_clean = {}
            for raw_skill, quantity in quantities_dict.items():
                canonical = canonicalize_skill_values(
                    [raw_skill], taxonomy_skills, taxonomy_aliases
                )
                if canonical:
                    quant_clean[canonical[0]] = quantity
            transactions.append({"items": items_set, "quantities": quant_clean})
        metadata.update({"status": "success", "algorithm": "HUIM-Two-Phase", "dataset_id": dataset_id,
                         "total_transactions": len(transactions), "min_utility": min_utility,
                         "min_support_count": min_support_count,
                         "utility_definition": "sum(quantity * external_utility); external_utility phải có nguồn nghiệp vụ"})
        if len(transactions) < max(1, min_support_count):
            metadata["status"] = "skipped"
            metadata["reason"] = "Không đủ giao dịch sau khi chuẩn hóa taxonomy."
            LAST_TRAINING_METADATA = metadata
            write_metadata(HUIM_METADATA_FILE, metadata)
            return []

        ext_util_clean = {}
        for raw_skill, utility in external_utilities.items():
            canonical = canonicalize_skill_values(
                [raw_skill], taxonomy_skills, taxonomy_aliases
            )
            if canonical:
                ext_util_clean[canonical[0]] = utility
        
        huim = TwoPhaseHUIM(min_utility)
        results = huim.run(transactions, ext_util_clean)

        total = len(transactions)
        filtered = []
        for result in results:
            count = int(result.get("support_count", 0))
            if count < max(1, min_support_count):
                continue
            rate = count / total if total else 0.0
            result["support_rate"] = round(rate, 4)
            result["rarity_label"] = rarity_label(rate)
            filtered.append(result)
        results = filtered
        metadata["itemsets_count"] = len(results)
        LAST_TRAINING_METADATA = metadata
        write_metadata(HUIM_METADATA_FILE, metadata)

        save_domain_model(
            HUIM_FILE, HUIM_METADATA_FILE, domain or "unknown", "itemsets", results, metadata, reset_models
        )

        logger.info(f"Đã huấn luyện xong HUIM. Tìm được {len(results)} tập kỹ năng lợi ích cao.")
        return results
    except Exception as e:
        logger.error(f"Lỗi khi huấn luyện HUIM: {e}")
        return []

def get_last_training_metadata() -> Dict[str, Any]:
    return dict(LAST_TRAINING_METADATA)

def get_recommended_huim_skills(current_skills: List[str], top_n: int = 5) -> List[Dict[str, Any]]:
    """
    Đề xuất kỹ năng đi kèm có GIÁ TRỊ LỢI ÍCH (Salary/Urgency) cao nhất dựa trên kết quả HUIM đã khai phá.
    """
    if not current_skills:
        return []
        
    import nlp_processor
    current_skills_set = set(nlp_processor.canonicalize_skill_values(current_skills))
    if not current_skills_set:
        return []
    
    if not os.path.exists(HUIM_FILE):
        logger.warning("Không tìm thấy file kết quả HUIM. Hãy huấn luyện trước.")
        return []
    try:
        itemsets = flatten_results(HUIM_FILE, HUIM_METADATA_FILE, "itemsets")
        recommendations = {}
        for itemset_obj in itemsets:
            itemset = itemset_obj["itemset"]
            utility = itemset_obj["utility"]
            
            itemset_set = set(s.lower().strip() for s in itemset)
            
            # Nếu bộ kỹ năng hiện tại giao nhau với tập lợi ích cao này,
            # gợi ý các kỹ năng còn thiếu trong tập này
            intersection = itemset_set.intersection(current_skills_set)
            if len(intersection) > 0 and len(intersection) < len(itemset_set):
                difference = itemset_set - current_skills_set
                for skill in difference:
                    skill_clean = skill.strip()
                    # Lấy độ đo lợi ích (utility) cao nhất làm trọng số gợi ý
                    recommendations[skill_clean] = max(
                        recommendations.get(skill_clean, 0.0),
                        utility
                    )
                    
        sorted_recs = sorted(recommendations.items(), key=lambda x: x[1], reverse=True)
        return [{"skill": skill, "utility": conf} for skill, conf in sorted_recs[:top_n]]
    except Exception as e:
        logger.error(f"Lỗi khi gợi ý kỹ năng HUIM: {e}")
        return []


def get_all_itemsets() -> List[Dict[str, Any]]:
    return flatten_results(HUIM_FILE, HUIM_METADATA_FILE, "itemsets")
