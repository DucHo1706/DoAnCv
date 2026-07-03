export type CandidateStatus = "New" | "Reviewed" | "Interview" | "Shortlisted" | "Rejected";

export type RecruiterCandidate = {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  experience: number;
  location: string;
  status: CandidateStatus;
  fitScore: number;
  skills: string[];
  appliedDate: string;
  aiSummary: string;
  strengths: string[];
  gaps: string[];
};

export type RecruiterJob = {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  status: "Open" | "Draft" | "Closed";
  applications: number;
  postedDate: string;
};

export const recruiterJobs: RecruiterJob[] = [
  {
    id: "job-01",
    title: "Frontend Developer",
    department: "Engineering",
    location: "Ho Chi Minh City",
    type: "Full-time",
    status: "Open",
    applications: 34,
    postedDate: "2026-03-01",
  },
  {
    id: "job-02",
    title: "Backend Developer",
    department: "Engineering",
    location: "Da Nang",
    type: "Full-time",
    status: "Open",
    applications: 27,
    postedDate: "2026-02-28",
  },
  {
    id: "job-03",
    title: "Business Analyst",
    department: "Product",
    location: "Ho Chi Minh City",
    type: "Hybrid",
    status: "Draft",
    applications: 0,
    postedDate: "2026-03-05",
  },
  {
    id: "job-04",
    title: "UI/UX Designer",
    department: "Design",
    location: "Remote",
    type: "Contract",
    status: "Closed",
    applications: 19,
    postedDate: "2026-02-15",
  },
];

export const recruiterCandidates: RecruiterCandidate[] = [
  {
    id: "cand-01",
    name: "Nguyễn Minh Anh",
    email: "minhanh@gmail.com",
    phone: "0901234567",
    position: "Frontend Developer",
    experience: 3,
    location: "Ho Chi Minh City",
    status: "Shortlisted",
    fitScore: 92,
    skills: ["ReactJS", "TypeScript", "Ant Design", "REST API"],
    appliedDate: "2026-03-08",
    aiSummary:
      "Ứng viên phù hợp cao với vị trí Frontend Developer nhờ kinh nghiệm ReactJS tốt, làm việc với TypeScript và UI framework thành thạo.",
    strengths: ["Kinh nghiệm ReactJS tốt", "Có TypeScript", "Phù hợp stack UI hiện tại"],
    gaps: ["Thiếu kinh nghiệm testing automation"],
  },
  {
    id: "cand-02",
    name: "Trần Quốc Bảo",
    email: "quocbao@gmail.com",
    phone: "0912345678",
    position: "Backend Developer",
    experience: 4,
    location: "Da Nang",
    status: "Interview",
    fitScore: 88,
    skills: ["ASP.NET Core", "SQL Server", "Docker", "Swagger"],
    appliedDate: "2026-03-07",
    aiSummary:
      "Ứng viên có nền tảng backend tốt, phù hợp với hệ thống sử dụng ASP.NET Core và cơ sở dữ liệu quan hệ.",
    strengths: ["ASP.NET Core tốt", "Có kinh nghiệm database", "Quen API design"],
    gaps: ["Thiếu kinh nghiệm AI integration"],
  },
  {
    id: "cand-03",
    name: "Lê Thu Hà",
    email: "thuha@gmail.com",
    phone: "0988888888",
    position: "Frontend Developer",
    experience: 2,
    location: "Can Tho",
    status: "Reviewed",
    fitScore: 81,
    skills: ["ReactJS", "JavaScript", "TailwindCSS", "Figma"],
    appliedDate: "2026-03-06",
    aiSummary:
      "Ứng viên có nền tảng frontend khá tốt, phù hợp với phần giao diện nhưng còn thiếu chiều sâu về TypeScript.",
    strengths: ["ReactJS ổn", "UI tốt", "Có tư duy thiết kế"],
    gaps: ["TypeScript chưa mạnh", "Chưa thấy kinh nghiệm Ant Design rõ"],
  },
  {
    id: "cand-04",
    name: "Phạm Gia Huy",
    email: "giahuy@gmail.com",
    phone: "0933333333",
    position: "Business Analyst",
    experience: 3,
    location: "Ho Chi Minh City",
    status: "New",
    fitScore: 76,
    skills: ["Requirement Analysis", "SQL", "UML", "Agile"],
    appliedDate: "2026-03-09",
    aiSummary:
      "Ứng viên có nền tảng BA phù hợp, cần đánh giá thêm khả năng phối hợp đa nhóm và kỹ năng tài liệu hóa.",
    strengths: ["Kỹ năng phân tích tốt", "Có SQL", "Hiểu Agile"],
    gaps: ["Chưa có domain HR rõ ràng"],
  },
  {
    id: "cand-05",
    name: "Võ Khánh Linh",
    email: "khanhlinh@gmail.com",
    phone: "0977777777",
    position: "UI/UX Designer",
    experience: 2,
    location: "Remote",
    status: "Rejected",
    fitScore: 63,
    skills: ["Figma", "Design System", "Prototyping"],
    appliedDate: "2026-03-04",
    aiSummary:
      "Ứng viên có kỹ năng thiết kế nhưng chưa phù hợp hoàn toàn với yêu cầu sản phẩm hiện tại.",
    strengths: ["Thiết kế giao diện ổn", "Có design system"],
    gaps: ["Thiếu kinh nghiệm sản phẩm enterprise", "Portfolio chưa đủ rộng"],
  },
];
