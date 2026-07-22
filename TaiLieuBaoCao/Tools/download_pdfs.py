import os
import urllib.request
import ssl

ssl._create_default_https_context = ssl._create_unverified_context

download_dir = r"d:\KhoaLuan\TaiLieuThamKhao"
os.makedirs(download_dir, exist_ok=True)

# Cac link tai truc tiep on dinh nhat
urls = {
    "McClelland_1973_Testing_for_Competence.pdf": "https://www.gwern.net/docs/iq/1973-mcclelland.pdf",
    "Harvard_Resume_and_Cover_Letter_Guide.pdf": "https://cdn-careerservices.fas.harvard.edu/wp-content/uploads/sites/161/2023/08/hes-resume-cover-letter-guide.pdf",
    "Shannon_1948_Mathematical_Theory_of_Communication.pdf": "https://www.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf",
    "SHRM_Selection_Assessment_Methods_Guidelines.pdf": "http://www.gmashrm.org/files/selection_assessment.pdf"
}

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

for filename, url in urls.items():
    dest_path = os.path.join(download_dir, filename)
    print(f"Dang tai {filename}...")
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=30) as response:
            with open(dest_path, "wb") as f:
                f.write(response.read())
        print(f"-> Tai thanh cong: {filename}")
    except Exception as e:
        print(f"-> LOI tai {filename}: {e}")

print("Hoan thanh tai toan bo tai lieu!")
