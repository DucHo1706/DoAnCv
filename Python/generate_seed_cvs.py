import zipfile, xml.etree.ElementTree as ET

path = 'd:/KhoaLuan/TaiLieuBaoCao/Documents/BAOCAOKHOALUAN_IEEE.docx'
with zipfile.ZipFile(path) as z:
    xml_content = z.read('word/document.xml')
    tree = ET.fromstring(xml_content)
    texts = [ ''.join([n.text for n in p.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if n.text]) for p in tree.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p') ]

full = '\n'.join([t for t in texts if t])
pos = full.find('4.3')
print('=== CURRENT SECTION 4.3 IN BAOCAOKHOALUAN_IEEE.docx ===')
print(full[pos:pos+3500])
