import json
import os
from typing import List, Dict, Set, Tuple, Any
from utils.logger import logger

class AprioriAlgorithm:
    def __init__(self, min_support: float = 0.05, min_confidence: float = 0.3):
        self.min_support = min_support
        self.min_confidence = min_confidence

    def _get_frequent_1_itemsets(self, transactions: List[Set[str]]) -> Dict[Tuple[str], int]:
        item_counts = {}
        for transaction in transactions:
            for item in transaction:
                item_counts[(item,)] = item_counts.get((item,), 0) + 1
        
        num_transactions = len(transactions)
        frequent_1 = {
            itemset: count for itemset, count in item_counts.items()
            if (count / num_transactions) >= self.min_support
        }
        return frequent_1

    def _join_itemsets(self, itemsets: List[Tuple[str]], k: int) -> List[Tuple[str]]:
        joined = []
        n = len(itemsets)
        for i in range(n):
            for j in range(i + 1, n):
                # Join itemsets if their first k-2 elements are identical
                l1, l2 = list(itemsets[i]), list(itemsets[j])
                l1.sort()
                l2.sort()
                if l1[:k-2] == l2[:k-2]:
                    new_itemset = tuple(sorted(list(set(l1) | set(l2))))
                    if len(new_itemset) == k:
                        joined.append(new_itemset)
        return list(set(joined))

    def _get_frequent_k_itemsets(self, transactions: List[Set[str]], candidates: List[Tuple[str]]) -> Dict[Tuple[str], int]:
        counts = {}
        for transaction in transactions:
            transaction_set = set(transaction)
            for candidate in candidates:
                if set(candidate).issubset(transaction_set):
                    counts[candidate] = counts.get(candidate, 0) + 1
                    
        num_transactions = len(transactions)
        frequent_k = {
            itemset: count for itemset, count in counts.items()
            if (count / num_transactions) >= self.min_support
        }
        return frequent_k

    def run(self, transactions: List[Set[str]]) -> Tuple[Dict[Tuple[str], float], List[Dict[str, Any]]]:
        if not transactions:
            return {}, []
            
        num_transactions = len(transactions)
        frequent_itemsets = {}
        
        # 1. Mine size-1 frequent itemsets
        f1 = self._get_frequent_1_itemsets(transactions)
        for itemset, count in f1.items():
            frequent_itemsets[itemset] = count / num_transactions
            
        current_frequent = list(f1.keys())
        k = 2
        
        # 2. Iteratively mine larger frequent itemsets
        while len(current_frequent) > 0:
            candidates = self._join_itemsets(current_frequent, k)
            if not candidates:
                break
                
            fk = self._get_frequent_k_itemsets(transactions, candidates)
            if not fk:
                break
                
            for itemset, count in fk.items():
                frequent_itemsets[itemset] = count / num_transactions
                
            current_frequent = list(fk.keys())
            k += 1
            
        # 3. Generate Association Rules
        rules = []
        for itemset, support in frequent_itemsets.items():
            if len(itemset) < 2:
                continue
                
            # For each frequent itemset, generate rules
            # E.g., for {A, B}, rules are A -> B and B -> A
            for i in range(len(itemset)):
                antecedent = (itemset[i],)
                consequent = tuple(x for x in itemset if x != itemset[i])
                
                # Check confidence: support(A U B) / support(A)
                support_a = frequent_itemsets.get(antecedent, 0)
                if support_a > 0:
                    confidence = support / support_a
                    if confidence >= self.min_confidence:
                        rules.append({
                            "antecedent": list(antecedent),
                            "consequent": list(consequent),
                            "support": round(support, 3),
                            "confidence": round(confidence, 3)
                        })
                        
                # Also generate Consequent (size > 1) -> Antecedent if k > 2
                if len(consequent) > 1:
                    support_c = frequent_itemsets.get(consequent, 0)
                    if support_c > 0:
                        confidence_c = support / support_c
                        if confidence_c >= self.min_confidence:
                            rules.append({
                                "antecedent": list(consequent),
                                "consequent": list(antecedent),
                                "support": round(support, 3),
                                "confidence": round(confidence_c, 3)
                            })
                            
        # De-duplicate rules
        unique_rules = []
        seen = set()
        for r in rules:
            rule_key = (tuple(sorted(r["antecedent"])), tuple(sorted(r["consequent"])))
            if rule_key not in seen:
                seen.add(rule_key)
                unique_rules.append(r)
                
        return frequent_itemsets, unique_rules

# Thư mục lưu trữ kết quả luật kết hợp
RULES_FILE = "association_rules.json"

def train_and_save_rules(transactions_list: List[List[str]], min_support: float = 0.05, min_confidence: float = 0.3) -> List[Dict[str, Any]]:
    """
    Huấn luyện thuật toán Apriori và lưu kết quả vào file JSON.
    """
    try:
        transactions = [set(t) for t in transactions_list if t]
        apriori = AprioriAlgorithm(min_support, min_confidence)
        _, rules = apriori.run(transactions)
        
        # Sắp xếp luật theo độ tin cậy (Confidence) giảm dần
        rules.sort(key=lambda x: x["confidence"], reverse=True)
        
        with open(RULES_FILE, "w", encoding="utf-8") as f:
            json.dump(rules, f, ensure_ascii=False, indent=2)
            
        logger.info(f"Đã huấn luyện xong Apriori. Khai phá được {len(rules)} luật kết hợp và lưu vào file.")
        return rules
    except Exception as e:
        logger.error(f"Lỗi khi chạy huấn luyện Apriori: {e}")
        return []

def get_recommended_skills(current_skills: List[str], top_n: int = 5) -> List[str]:
    """
    Gợi ý các kỹ năng đi kèm dựa trên các luật kết hợp đã khai phá.
    """
    if not current_skills:
        return []
        
    current_skills_set = set(s.lower().strip() for s in current_skills)
    
    if not os.path.exists(RULES_FILE):
        logger.warning("Không tìm thấy file luật kết hợp. Hãy chạy huấn luyện trước.")
        return []
        
    try:
        with open(RULES_FILE, "r", encoding="utf-8") as f:
            rules = json.load(f)
            
        recommendations = {}
        for rule in rules:
            antecedent = set(s.lower().strip() for s in rule["antecedent"])
            consequent = rule["consequent"]
            
            # Nếu bộ kỹ năng hiện tại chứa toàn bộ antecedent của luật
            if antecedent.issubset(current_skills_set):
                for skill in consequent:
                    skill_clean = skill.strip()
                    if skill_clean.lower() not in current_skills_set:
                        # Cộng dồn điểm tự tin
                        recommendations[skill_clean] = max(
                            recommendations.get(skill_clean, 0),
                            rule["confidence"]
                        )
                        
        # Sắp xếp các kỹ năng gợi ý theo confidence giảm dần
        sorted_recs = sorted(recommendations.items(), key=lambda x: x[1], reverse=True)
        return [skill for skill, conf in sorted_recs[:top_n]]
    except Exception as e:
        logger.error(f"Lỗi gợi ý kỹ năng bằng Apriori: {e}")
        return []
