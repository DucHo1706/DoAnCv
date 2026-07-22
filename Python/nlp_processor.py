import re
import json
import os

try:
    import spacy
    try:
        nlp = spacy.load("en_core_web_sm")
    except Exception as e:
        print("Warning: Model en_core_web_sm not found. Using dummy function.")
        nlp = lambda x: str(x)
except ImportError:
    spacy = None
    nlp = lambda x: str(x)

SKILL_DB = set()

def load_skill_db(filename="skills.json"):
    if not os.path.exists(filename):
        return {"python", "java", "sql", "node.js", "react"}
    
    with open(filename, "r", encoding="utf-8") as f:
        data = json.load(f)
        return set(skill.lower() for skill in data)

def reload_knowledge_base():
    global SKILL_DB
    SKILL_DB = load_skill_db()
    return len(SKILL_DB)

reload_knowledge_base()

def extract_information(cv_text):
    extracted_data = {
        "email": None,
        "phone": None,
        "skills": []
    }

    email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    emails = re.findall(email_pattern, cv_text)
    if emails:
        extracted_data["email"] = emails[0]

    clean_text_for_phone = cv_text.replace(" ", "").replace("-", "").replace(".", "")
    phone_pattern = r'(?:0|\+84)(?:3|5|7|8|9)\d{8}\b'
    phones = re.findall(phone_pattern, clean_text_for_phone)
    if phones:
        extracted_data["phone"] = phones[0]

    text_lower = cv_text.lower()
    found_skills = set()
    
    for skill in SKILL_DB:
        pattern = r'(?:^|\W)' + re.escape(skill) + r'(?:$|\W)'
        if re.search(pattern, text_lower):
            found_skills.add(skill)

    extracted_data["skills"] = list(found_skills)
    
    return extracted_data

if __name__ == "__main__":
    sample_cv_text = "Test python react sql server"
    print(extract_information(sample_cv_text))