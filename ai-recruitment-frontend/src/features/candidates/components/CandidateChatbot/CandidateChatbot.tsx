import { useState, useRef, useEffect } from "react";
import {
  FloatButton,
  Input,
  Button,
  Typography,
  Spin,
  Space,
  Avatar,
  Upload,
  message,
  Popconfirm,
  Tag,
} from "antd";
import {
  SendOutlined,
  UserOutlined,
  CloseOutlined,
  DragOutlined,
  PaperClipOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../../../services/axiosClient";

const { Text } = Typography;

const AiSparkleIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
    <defs>
      <linearGradient id="aiSparkleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2563EB" />
        <stop offset="50%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#10B981" />
      </linearGradient>
    </defs>
    <path
      d="M12 2.5L4 7v10l8 4.5 8-4.5V7l-8-4.5z"
      stroke="url(#aiSparkleGrad)"
      strokeWidth="2"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M12 7.5L7.5 10v4l4.5 2.5 4.5-2.5v-4L12 7.5z"
      fill="url(#aiSparkleGrad)"
      opacity="0.15"
    />
    <path
      d="M12 7.5L7.5 10v4l4.5 2.5 4.5-2.5v-4L12 7.5z"
      stroke="url(#aiSparkleGrad)"
      strokeWidth="1.5"
      strokeLinejoin="round"
      fill="none"
    />
    <circle cx="12" cy="12" r="2" fill="url(#aiSparkleGrad)" />
  </svg>
);

export default function CandidateChatbot() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Khởi tạo Session ID để lưu lịch sử
  const [sessionId] = useState(() => {
    let sid = localStorage.getItem("chatSessionId");
    if (!sid) {
      sid = "session_" + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("chatSessionId", sid);
    }
    return sid;
  });

  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [fileList, setFileList] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragInfo = useRef({ startX: 0, startY: 0 });

  const [size, setSize] = useState({ width: 380, height: 600 });
  const [isResizing, setIsResizing] = useState(false);
  const resizeInfo = useRef({
    startWidth: 0,
    startHeight: 0,
    startX: 0,
    startY: 0,
    startPosX: 0,
    startPosY: 0,
  });

  // Load lịch sử từ LocalStorage để không bị xoá khi người dùng F5 tải lại trang
  useEffect(() => {
    const savedMsgs = localStorage.getItem(`chat_history_${sessionId}`);
    if (savedMsgs) {
      setMessages(JSON.parse(savedMsgs));
    } else {
      setMessages([
        {
          role: "ai",
          text: "Chào bạn! Mình có thể hỗ trợ tìm việc, đọc yêu cầu tuyển dụng và góp ý CV. Bạn cần hỗ trợ nội dung nào?",
        },
      ]);
    }
  }, [sessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (open) scrollToBottom();
    // Cập nhật lại kho lưu trữ trình duyệt mỗi khi có tin nhắn mới
    if (messages.length > 0) {
      localStorage.setItem(`chat_history_${sessionId}`, JSON.stringify(messages));
    }
  }, [messages, open]);



  const handleClearChat = () => {
    localStorage.removeItem(`chat_history_${sessionId}`);
    setMessages([
      {
        role: "ai",
        text: "Chào bạn! Mình có thể hỗ trợ tìm việc, đọc yêu cầu tuyển dụng và góp ý CV. Bạn cần hỗ trợ nội dung nào?",
      },
    ]);
    message.success("Đã xóa lịch sử trò chuyện!");
  };

  // Lắng nghe sự kiện mở chatbot từ các trang khác
  useEffect(() => {
    const handleOpenChatbot = (event: any) => {
      setOpen(true);
      if (event.detail?.jobId) {
        setSelectedJobId(event.detail.jobId);
        setInput(
          `Hãy đánh giá mức độ phù hợp của CV đính kèm với vị trí ${event.detail.jobTitle || "này"}. Điểm mạnh, điểm yếu là gì và tôi nên cải thiện thế nào để trúng tuyển?`
        );
      }
    };

    window.addEventListener("open-chatbot", handleOpenChatbot);
    return () => window.removeEventListener("open-chatbot", handleOpenChatbot);
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragInfo.current.startX,
          y: e.clientY - dragInfo.current.startY,
        });
      } else if (isResizing) {
        const deltaX = e.clientX - resizeInfo.current.startX;
        const deltaY = e.clientY - resizeInfo.current.startY;

        const newWidth = Math.max(300, resizeInfo.current.startWidth + deltaX);
        const newHeight = Math.max(400, resizeInfo.current.startHeight + deltaY);

        const actualDeltaX = newWidth - resizeInfo.current.startWidth;
        const actualDeltaY = newHeight - resizeInfo.current.startHeight;

        setSize({ width: newWidth, height: newHeight });
        setPosition({
          x: resizeInfo.current.startPosX + actualDeltaX,
          y: resizeInfo.current.startPosY + actualDeltaY,
        });
      }
    };

    const onMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging, isResizing]);

  const handleSend = async () => {
    if (!input.trim() && fileList.length === 0) return;

    const userMsg = input.trim() || "Hãy xem xét CV đính kèm của tôi.";
    const currentHistory = messages.filter((m) => m.role !== "system");

    const displayMsg =
      userMsg + (fileList.length > 0 ? `\n📎 [Đã đính kèm file: ${fileList[0].name}]` : "");
    setMessages((prev) => [...prev, { role: "user", text: displayMsg }]);

    setInput("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("SessionId", sessionId);
      formData.append("Prompt", userMsg);
      formData.append("HistoryJson", JSON.stringify(currentHistory));

      if (selectedJobId) formData.append("JobId", selectedJobId);

      if (fileList.length > 0) {
        const fileToUpload = fileList[0].originFileObj || fileList[0];
        formData.append("File", fileToUpload);
      }

      const res = await axiosClient.post("/Chatbot/chat", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
      });
      const aiText = res.data.reply;

      setMessages((prev) => [...prev, { role: "ai", text: aiText }]);
      setLoading(false);
      setFileList([]); // Xoá file sau khi gửi xong
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Chưa thể kết nối với trợ lý. Vui lòng thử lại sau." },
      ]);
      setLoading(false);
    }
  };

  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragInfo.current = {
      startX: e.clientX - position.x,
      startY: e.clientY - position.y,
    };
  };

  const onResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    resizeInfo.current = {
      startWidth: size.width,
      startHeight: size.height,
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y,
    };
  };

  const uploadProps = {
    onRemove: () => setFileList([]),
    beforeUpload: (file: any) => {
      const extension = file.name.split(".").pop()?.toLowerCase();
      const supportedExtensions = ["pdf", "docx", "png", "jpg", "jpeg", "webp"];
      if (!extension || !supportedExtensions.includes(extension)) {
        message.error("Chỉ hỗ trợ CV dạng PDF, DOCX, PNG, JPG, JPEG hoặc WEBP.");
        return Upload.LIST_IGNORE;
      }
      if (file.size > 10 * 1024 * 1024) {
        message.error("Tệp CV không được vượt quá 10 MB.");
        return Upload.LIST_IGNORE;
      }
      setFileList([file]);
      return false; // Chặn upload tự động
    },
    fileList,
    accept: ".pdf,.docx,.png,.jpg,.jpeg,.webp",
    showUploadList: false, // Ẩn list file mặc định
  };

  return (
    <>
      <FloatButton
        icon={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AiSparkleIcon size={24} /></div>}
        style={{ right: 24, bottom: 24, width: 60, height: 60, background: "#FFFFFF", border: "1px solid #E2E8F0", boxShadow: "0 8px 32px rgba(15, 23, 42, 0.08)" }}
        onClick={() => setOpen(true)}
        tooltip="Mở trợ lý nghề nghiệp"
        badge={{ dot: true }}
      />

      {open && (
        <div
          style={{
            position: "fixed",
            bottom: 100,
            right: 24,
            width: size.width,
            height: size.height,
            maxWidth: "calc(100vw - 32px)",
            maxHeight: "calc(100vh - 128px)",
            backgroundColor: "#fff",
            borderRadius: 16,
            border: "1px solid #E2E8F0",
            boxShadow: "0 16px 40px rgba(15, 23, 42, 0.14)",
            display: "flex",
            flexDirection: "column",
            zIndex: 1000,
            transform: `translate(${position.x}px, ${position.y}px)`,
            overflow: "hidden",
          }}
        >
          <div
            onMouseDown={onMouseDown}
            style={{
              padding: "16px",
              backgroundColor: "#FFFFFF",
              color: "#0F172A",
              borderBottom: "1px solid #E2E8F0",
              cursor: isDragging ? "grabbing" : "grab",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              userSelect: "none",
            }}
          >
            <Space>
              <div style={{ background: "#ffffff", padding: 6, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <AiSparkleIcon size={16} />
              </div>
              <Text strong style={{ fontSize: 16, color: "#0F172A" }}>
                Trợ lý nghề nghiệp
              </Text>
            </Space>
            <Space>
              <DragOutlined style={{ fontSize: 18, color: "#94A3B8" }} />
              <Button
                type="text"
                icon={<CloseOutlined style={{ color: "#475569" }} />}
                onClick={() => setOpen(false)}
              />
            </Space>
          </div>

          <div style={{ flex: 1, padding: 16, overflowY: "auto", background: "#F8FAFC" }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: 16,
                  display: "flex",
                  flexDirection: msg.role === "user" ? "row-reverse" : "row",
                  gap: 8,
                }}
              >
                {msg.role === "user" ? (
                  <Avatar
                    icon={<UserOutlined />}
                    style={{ backgroundColor: "#87d068", flexShrink: 0 }}
                  />
                ) : (
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#EFF6FF", border: "1px solid #BFDBFE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <AiSparkleIcon size={16} />
                  </div>
                )}
                <div
                  style={{
                    display: "inline-block",
                    padding: "10px 14px",
                    borderRadius: 12,
                    background: msg.role === "user" ? "#2563EB" : "#ffffff",
                    color: msg.role === "user" ? "#fff" : "#0f172a",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                    maxWidth: "80%",
                    borderTopRightRadius: msg.role === "user" ? 2 : 12,
                    borderTopLeftRadius: msg.role === "ai" ? 2 : 12,
                  }}
                >
                  <div style={{ color: "inherit", wordBreak: "break-word", lineHeight: 1.6 }}>
                    {msg.text.split("\n").map((line, lineIdx) => {
                      if (!line.trim()) return <div key={lineIdx} style={{ height: 8 }} />;

                      if (line.includes("[RECOMMEND_JOB:")) {
                        const match = line.match(/\[RECOMMEND_JOB:\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\]/);
                        if (match) {
                          const jobId = match[1];
                          const jobTitle = match[2];
                          const location = match[3];
                          const salary = match[4];
                          return (
                            <div
                              key={lineIdx}
                              style={{
                                background: "#EFF6FF",
                                border: "1px solid #BFDBFE",
                                borderRadius: 12,
                                padding: 12,
                                marginTop: 8,
                                marginBottom: 8,
                                color: "#1E293B",
                                boxShadow: "0 2px 4px rgba(37,99,235,0.03)",
                              }}
                            >
                              <Text strong style={{ fontSize: 13, color: "#1E293B", display: "block", marginBottom: 4 }}>
                                {jobTitle}
                              </Text>
                              <div style={{ fontSize: 11, color: "#64748B", marginBottom: 8 }}>
                                <span>📍 {location}</span>
                                <span style={{ margin: "0 6px" }}>•</span>
                                <span style={{ color: "#10B981", fontWeight: 600 }}>💰 {salary}</span>
                              </div>
                              <Button
                                type="primary"
                                size="small"
                                style={{ borderRadius: 8, width: "100%", fontSize: 12, height: 28, background: "#2563EB", border: "none" }}
                                onClick={() => {
                                  navigate(`/jobs/${jobId}`);
                                  setOpen(false);
                                }}
                              >
                                Xem việc làm
                              </Button>
                            </div>
                          );
                        }
                      }

                      const parseInline = (text: string) => {
                        return text.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g).map((part, i) => {
                          if (part.startsWith("**") && part.endsWith("**")) {
                            return (
                              <strong
                                key={i}
                                style={{ color: msg.role === "ai" ? "#0f172a" : "inherit" }}
                              >
                                {part.slice(2, -2)}
                              </strong>
                            );
                          }
                          const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
                          if (linkMatch) {
                            const linkText = linkMatch[1];
                            const url = linkMatch[2];
                            const isInternal = url.startsWith("/");
                            const isSafeExternal = /^https?:\/\//i.test(url);
                            if (!isInternal && !isSafeExternal) {
                              return <span key={i}>{linkText}</span>;
                            }
                            return (
                              <a
                                key={i}
                                href={url}
                                onClick={(e) => {
                                  if (isInternal) {
                                    e.preventDefault();
                                    navigate(url);
                                    setOpen(false);
                                  }
                                }}
                                target={isInternal ? "_self" : "_blank"}
                                rel={isInternal ? "" : "noopener noreferrer"}
                                style={{
                                  color: msg.role === "ai" ? "#2563EB" : "#fff",
                                  textDecoration: "none",
                                  fontWeight: 600,
                                  background:
                                    msg.role === "ai" ? "#EFF6FF" : "rgba(255,255,255,0.2)",
                                  padding: "4px 12px",
                                  borderRadius: 8,
                                  display: "inline-block",
                                  marginTop: 6,
                                  marginBottom: 2,
                                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                                  border: msg.role === "ai" ? "1px solid #91caff" : "none",
                                }}
                              >
                                {linkText}
                              </a>
                            );
                          }
                          return <span key={i}>{part}</span>;
                        });
                      };

                      const numberedMatch = line.match(/^(\d+\.)\s+(.*)/);
                      if (numberedMatch) {
                        return (
                          <div
                            key={lineIdx}
                            style={{
                              display: "flex",
                              marginTop: 12,
                              marginBottom: 4,
                              padding: "8px 12px",
                              background: msg.role === "ai" ? "#f8fafc" : "transparent",
                              borderRadius: 8,
                              border: msg.role === "ai" ? "1px solid #e2e8f0" : "none",
                            }}
                          >
                            <span
                              style={{
                                fontWeight: "bold",
                                marginRight: 12,
                                color: msg.role === "ai" ? "#2563EB" : "#fff",
                                fontSize: 16,
                              }}
                            >
                              {numberedMatch[1]}
                            </span>
                            <span style={{ fontWeight: 500 }}>{parseInline(numberedMatch[2])}</span>
                          </div>
                        );
                      }

                      const bulletMatch = line.match(/^[\*\-]\s+(.*)/);
                      if (bulletMatch) {
                        return (
                          <div
                            key={lineIdx}
                            style={{
                              display: "flex",
                              marginLeft: 16,
                              marginBottom: 6,
                              opacity: 0.9,
                            }}
                          >
                            <span
                              style={{
                                marginRight: 12,
                                color: msg.role === "ai" ? "#2563EB" : "#fff",
                              }}
                            >
                              •
                            </span>
                            <span>{parseInline(bulletMatch[1])}</span>
                          </div>
                        );
                      }

                      return (
                        <div key={lineIdx} style={{ marginBottom: 6 }}>
                          {parseInline(line)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#EFF6FF", border: "1px solid #BFDBFE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <AiSparkleIcon size={16} />
                </div>
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 12,
                    background: "#ffffff",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                    borderTopLeftRadius: 2,
                  }}
                >
                  <Spin size="small" />{" "}
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    Đang tìm câu trả lời...
                  </Text>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ padding: 16, borderTop: "1px solid #f0f0f0", background: "#fff" }}>
            <div
              style={{
                marginBottom: 8,
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {fileList.length > 0 && (
                <Tag closable onClose={() => setFileList([])} color="blue" style={{ margin: 0 }}>
                  📎 {fileList[0].name}
                </Tag>
              )}
            </div>
            <Space.Compact style={{ width: "100%" }}>
              <Popconfirm
                title="Bạn có chắc muốn xóa lịch sử?"
                onConfirm={handleClearChat}
                okText="Xóa"
                cancelText="Hủy"
              >
                <Button size="large" icon={<DeleteOutlined />} title="Xóa lịch sử trò chuyện" />
              </Popconfirm>
              <Upload {...uploadProps}>
                <Button size="large" icon={<PaperClipOutlined />} title="Đính kèm CV" />
              </Upload>
              <Input
                size="large"
                placeholder="Hỏi về việc làm hoặc đính kèm CV..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onPressEnter={handleSend}
                disabled={loading}
              />
              <Button
                size="large"
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSend}
                loading={loading}
              />
            </Space.Compact>
          </div>

          {/* Nút Resize ở góc dưới cùng bên phải */}
          <div
            onMouseDown={onResizeMouseDown}
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 16,
              height: 16,
              cursor: "se-resize",
              background: "linear-gradient(135deg, transparent 50%, #bfbfbf 50%)",
              zIndex: 10,
            }}
          />
        </div>
      )}
    </>
  );
}
