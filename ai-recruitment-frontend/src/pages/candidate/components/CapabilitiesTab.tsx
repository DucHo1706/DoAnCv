import React, { useState, useEffect } from "react";
import { Card, Tag, Input, Button, Space, Row, Col, Typography, message, Divider } from "antd";
import { 
  BookOutlined, 
  ThunderboltOutlined, 
  PlusOutlined, 
  SaveOutlined
} from "@ant-design/icons";
import axiosClient from "../../../services/axiosClient";

const { Text } = Typography;

interface CapabilitiesTabProps {
  profile: any;
  onRefreshProfile: () => void;
}

export const CapabilitiesTab: React.FC<CapabilitiesTabProps> = ({
  profile,
  onRefreshProfile,
}) => {
  const [skills, setSkills] = useState<string[]>([]);
  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.skills) {
      try {
        const skillList = typeof profile.skills === "string" 
          ? JSON.parse(profile.skills) 
          : profile.skills;
        
        if (Array.isArray(skillList)) {
          setSkills(skillList);
        } else if (Array.isArray(skillList?.$values)) {
          setSkills(skillList.$values);
        } else {
          setSkills([]);
        }
      } catch (e) {
        setSkills([]);
      }
    } else {
      setSkills([]);
    }
  }, [profile]);

  const handleClose = (removedSkill: string) => {
    const newSkills = skills.filter((skill) => skill !== removedSkill);
    setSkills(newSkills);
  };

  const showInput = () => {
    setInputVisible(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputConfirm = () => {
    if (inputValue && skills.indexOf(inputValue) === -1) {
      setSkills([...skills, inputValue]);
    }
    setInputVisible(false);
    setInputValue("");
  };

  const handleSaveSkills = async () => {
    if (!profile?.defaultCvUrl) {
      message.warning("Vui lòng tải lên CV mẫu trước khi cập nhật kỹ năng.");
      return;
    }

    try {
      setSaving(true);
      await axiosClient.put("/profile/skills", { skills });
      message.success("Cập nhật danh sách kỹ năng thành công!");
      onRefreshProfile();
    } catch (err: any) {
      message.error("Lỗi khi lưu kỹ năng: " + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ marginTop: 8 }}>
      <Row gutter={[20, 20]}>
        {/* Left column: Academic Credentials & Experience */}
        <Col xs={24} md={10}>
          <Card 
            title={
              <Space>
                <BookOutlined style={{ color: "#2563EB" }} />
                <span style={{ fontWeight: 600 }}>Học vấn & Kinh nghiệm (Từ CV)</span>
              </Space>
            }
            style={{ borderRadius: 16, border: "1px solid #E2E8F0", height: "100%" }}
          >
            <div style={{ marginBottom: 20 }}>
              <Text type="secondary" style={{ fontSize: 12, display: "block" }}>HỌC VẤN CAO NHẤT</Text>
              <Text strong style={{ fontSize: 15, color: "#1E293B" }}>
                {profile?.degree || "Chưa cập nhật"}
              </Text>
            </div>

            <div style={{ marginBottom: 20 }}>
              <Text type="secondary" style={{ fontSize: 12, display: "block" }}>CHUYÊN NGÀNH</Text>
              <Text strong style={{ fontSize: 15, color: "#1E293B" }}>
                {profile?.major || "Chưa cập nhật"}
              </Text>
            </div>

            <div style={{ marginBottom: 20 }}>
              <Text type="secondary" style={{ fontSize: 12, display: "block" }}>TRƯỜNG ĐẠI HỌC</Text>
              <Text strong style={{ fontSize: 15, color: "#1E293B" }}>
                {profile?.university || "Chưa cập nhật"}
              </Text>
            </div>

            <div style={{ marginBottom: 12 }}>
              <Text type="secondary" style={{ fontSize: 12, display: "block" }}>THỜI GIAN KINH NGHIỆM</Text>
              <Text strong style={{ fontSize: 15, color: "#1E293B" }}>
                {profile?.yearsOfExperience > 0 ? `${profile.yearsOfExperience} năm làm việc` : "Dưới 1 năm hoặc mới tốt nghiệp"}
              </Text>
            </div>
          </Card>
        </Col>

        {/* Right column: Extracted Skills Tag Cloud & Editor */}
        <Col xs={24} md={14}>
          <Card
            title={
              <Space>
                <ThunderboltOutlined style={{ color: "#2563EB" }} />
                <span style={{ fontWeight: 600 }}>Kỹ năng & Chuyên môn kỹ thuật</span>
              </Space>
            }
            extra={
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={saving}
                onClick={handleSaveSkills}
                style={{ borderRadius: 8, background: "#2563EB" }}
              >
                Lưu kỹ năng
              </Button>
            }
            style={{ borderRadius: 16, border: "1px solid #E2E8F0" }}
          >
            <div style={{ minHeight: 180, display: "flex", flexWrap: "wrap", gap: 8, alignContent: "flex-start" }}>
              {skills.map((skill) => (
                <Tag
                  key={skill}
                  closable
                  onClose={() => handleClose(skill)}
                  color="blue"
                  style={{
                    padding: "4px 10px",
                    fontSize: 13,
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                    gap: 4
                  }}
                >
                  {skill}
                </Tag>
              ))}

              {inputVisible ? (
                <Input
                  type="text"
                  size="small"
                  style={{ width: 100, borderRadius: 6 }}
                  value={inputValue}
                  onChange={handleInputChange}
                  onBlur={handleInputConfirm}
                  onPressEnter={handleInputConfirm}
                  autoFocus
                />
              ) : (
                <Tag 
                  onClick={showInput} 
                  style={{ 
                    padding: "4px 10px", 
                    fontSize: 13, 
                    borderRadius: 6, 
                    borderStyle: "dashed", 
                    cursor: "pointer", 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 4 
                  }}
                >
                  <PlusOutlined /> Thêm kỹ năng
                </Tag>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
