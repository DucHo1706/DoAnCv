import sys
import zipfile
import xml.etree.ElementTree as ET
import os

def docx_to_markdown(docx_path, output_path):
    namespaces = {
        'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
    }
    
    if not os.path.exists(docx_path):
        print(f"Error: File {docx_path} does not exist.")
        return False
        
    try:
        with zipfile.ZipFile(docx_path) as docx:
            xml_content = docx.read('word/document.xml')
            
        root = ET.fromstring(xml_content)
        body = root.find('w:body', namespaces)
        if body is None:
            print("Error: Could not find body in document.xml")
            return False
            
        out_lines = []
        
        for p in body.findall('.//w:p', namespaces):
            # Check paragraph style for headings
            style_elem = p.find('.//w:pPr/w:pStyle', namespaces)
            is_heading = False
            heading_level = 0
            if style_elem is not None:
                style_val = style_elem.get(f'{{{namespaces["w"]}}}val')
                if style_val and style_val.startswith('Heading'):
                    try:
                        heading_level = int(style_val.replace('Heading', ''))
                        is_heading = True
                    except ValueError:
                        pass
            
            # Check list items
            num_elem = p.find('.//w:pPr/w:numPr', namespaces)
            is_list = num_elem is not None
            
            # Extract text from runs
            p_text = []
            for r in p.findall('w:r', namespaces):
                # Text
                t_elems = r.findall('w:t', namespaces)
                for t in t_elems:
                    p_text.append(t.text or '')
                # Line breaks
                if r.find('w:br', namespaces) is not None:
                    p_text.append('\n')
            
            text_content = "".join(p_text).strip()
            if not text_content:
                continue
                
            if is_heading:
                out_lines.append(f"\n{'#' * heading_level} {text_content}\n")
            elif is_list:
                out_lines.append(f"- {text_content}")
            else:
                out_lines.append(text_content + "\n")
                
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write("\n".join(out_lines))
            
        print(f"Successfully converted {docx_path} to {output_path}")
        return True
    except Exception as e:
        print(f"Error parsing {docx_path}: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python parse_docx.py <input.docx> <output.md>")
        sys.exit(1)
    docx_to_markdown(sys.argv[1], sys.argv[2])
