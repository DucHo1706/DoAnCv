import requests
import urllib3
urllib3.disable_warnings()

links = {
    "McClelland_1973": "https://www.gwern.net/docs/iq/1973-mcclelland.pdf",
    "Harvard_Guide_New": "https://hwpi.harvard.edu/files/ocs/files/hes-resume-cover-letter-guide.pdf",
    "Shannon_1948": "https://www.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf",
    "SHRM_Guidelines_New": "https://www.shrm.org/hr-today/trends-and-forecasting/special-reports-and-expert-views/Documents/Selection-Assessment-Methods.pdf"
}

for name, link in links.items():
    try:
        res = requests.get(link, verify=False, headers={"User-Agent": "Mozilla/5.0"}, timeout=15)
        content_type = res.headers.get("Content-Type", "Unknown")
        print(f"{name} -> Status: {res.status_code}, Length: {len(res.content)} bytes, Type: {content_type}")
        if res.status_code == 200 and len(res.content) > 1000 and "pdf" in content_type.lower():
            print(f"   [SUCCESS] {name} is a valid PDF!")
        else:
            print(f"   [FAILED] {name} is not a valid PDF.")
    except Exception as e:
        print(name, "-> ERROR:", e)
