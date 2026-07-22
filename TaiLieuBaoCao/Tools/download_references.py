import os
import requests
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

download_dir = r"d:\KhoaLuan\TaiLieuThamKhao"
os.makedirs(download_dir, exist_ok=True)

# Cac guong tai truc tiep (Direct Mirrors) on dinh va khong chan bot
pdfs = {
    "McClelland_1973_Testing_for_Competence.pdf": "https://www.gwern.net/docs/iq/1973-mcclelland.pdf",
    "Harvard_Resume_and_Cover_Letter_Guide.pdf": "https://cdn-careerservices.fas.harvard.edu/wp-content/uploads/sites/161/2023/08/hes-resume-cover-letter-guide.pdf",
    "Shannon_1948_Mathematical_Theory_of_Communication.pdf": "https://www.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf",
    "SHRM_Selection_Assessment_Methods_Guidelines.pdf": "http://www.gmashrm.org/files/selection_assessment.pdf"
}

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

print("Bat dau tai cac tai lieu tham khao...")
for filename, url in pdfs.items():
    dest_path = os.path.join(download_dir, filename)
    print(f"Dang tai {filename} tu: {url} ...")
    try:
        response = requests.get(url, headers=headers, verify=False, timeout=20)
        if response.status_code == 200:
            with open(dest_path, "wb") as f:
                f.write(response.content)
            print(f"-> Tai thanh cong: {filename} ({len(response.content)} bytes)")
        else:
            print(f"-> LOI: Status code {response.status_code} khi tai {filename}")
    except Exception as e:
        print(f"-> LOI: Khong the tai {filename}. Chi tiet: {e}")

print("Hoan tat qua trinh tai tai lieu!")
