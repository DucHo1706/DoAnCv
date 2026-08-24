import { useEffect, useRef } from "react";
import { Space, Button } from "antd";
import { LinkOutlined } from "@ant-design/icons";

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

export default function RichTextEditor({
  value,
  onChange,
  disabled = false,
  placeholder = "Nội dung Email...",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleCommand = (command: string, commandValue?: string) => {
    if (disabled) return;
    document.execCommand(command, false, commandValue);
    editorRef.current?.focus();
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInsertLink = () => {
    const url = window.prompt("Nhập link cần chèn:");
    if (!url) return;
    handleCommand("createLink", url);
  };

  return (
    <div
      style={{
        border: "1px solid #d9d9d9",
        borderRadius: 8,
        overflow: "hidden",
        background: disabled ? "#f5f5f5" : "#ffffff",
      }}
    >
      <div
        style={{
          padding: "8px 12px",
          borderBottom: "1px solid #f0f0f0",
          background: "#fafafa",
        }}
      >
        <Space wrap>
          <Button size="small" onClick={() => handleCommand("bold")} disabled={disabled}>
            <strong>B</strong>
          </Button>
          <Button size="small" onClick={() => handleCommand("italic")} disabled={disabled}>
            <em>I</em>
          </Button>
          <Button size="small" onClick={() => handleCommand("underline")} disabled={disabled}>
            <u>U</u>
          </Button>
          <Button size="small" onClick={() => handleCommand("insertUnorderedList")} disabled={disabled}>
            Bullet
          </Button>
          <Button size="small" onClick={() => handleCommand("insertOrderedList")} disabled={disabled}>
            Number
          </Button>
          <Button size="small" icon={<LinkOutlined />} onClick={handleInsertLink} disabled={disabled}>
            Link
          </Button>
          <Button size="small" onClick={() => handleCommand("removeFormat")} disabled={disabled}>
            Clear
          </Button>
        </Space>
      </div>

      <div
        ref={editorRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        data-placeholder={placeholder}
        style={{
          minHeight: 310,
          padding: 12,
          outline: "none",
          lineHeight: 1.7,
          fontSize: 14,
          color: "#111827",
        }}
      />

      <style>
        {`
          [contenteditable="true"]:empty:before {
            content: attr(data-placeholder);
            color: #bfbfbf;
          }
          [contenteditable="true"] p {
            margin: 0 0 12px;
          }
          [contenteditable="true"] ul,
          [contenteditable="true"] ol {
            padding-left: 24px;
          }
          [contenteditable="true"] a {
            color: #2563EB;
            text-decoration: underline;
          }
        `}
      </style>
    </div>
  );
}
