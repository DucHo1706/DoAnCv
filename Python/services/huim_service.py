import json
import os
from typing import List, Dict, Set, Tuple, Any
from utils.logger import logger

class TwoPhaseHUIM:
    def __init__(self, min_utility: float):
        self.min_utility = min_utility

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
        while len(current_htwui) > 0:
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

HUIM_FILE = "high_utility_itemsets.json"

def train_and_save_huim(transactions_input: List[Dict[str, Any]], external_utilities: Dict[str, float], min_utility: float) -> List[Dict[str, Any]]:
    """
    Chạy thuật toán Two-Phase HUIM và lưu kết quả vào file JSON.
    """
    try:
        transactions = []
        for t in transactions_input:
            items_list = t.get("items", [])
            quantities_dict = t.get("quantities", {})
            # Chuẩn hóa về chữ thường và cắt khoảng trắng
            items_set = set(item.lower().strip() for item in items_list if item.strip())
            quant_clean = {k.lower().strip(): v for k, v in quantities_dict.items()}
            transactions.append({
                "items": items_set,
                "quantities": quant_clean
            })

        ext_util_clean = {k.lower().strip(): v for k, v in external_utilities.items()}
        
        huim = TwoPhaseHUIM(min_utility)
        results = huim.run(transactions, ext_util_clean)

        with open(HUIM_FILE, "w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False, indent=2)

        logger.info(f"Đã huấn luyện xong HUIM. Tìm được {len(results)} tập kỹ năng lợi ích cao.")
        return results
    except Exception as e:
        logger.error(f"Lỗi khi huấn luyện HUIM: {e}")
        return []

def get_recommended_huim_skills(current_skills: List[str], top_n: int = 5) -> List[Dict[str, Any]]:
    """
    Đề xuất kỹ năng đi kèm có GIÁ TRỊ LỢI ÍCH (Salary/Urgency) cao nhất dựa trên kết quả HUIM đã khai phá.
    """
    if not current_skills:
        return []
        
    current_skills_set = set(s.lower().strip() for s in current_skills)
    
    if not os.path.exists(HUIM_FILE):
        logger.warning("Không tìm thấy file kết quả HUIM. Hãy huấn luyện trước.")
        return []

    try:
        with open(HUIM_FILE, "r", encoding="utf-8") as f:
            itemsets = json.load(f)
            
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
