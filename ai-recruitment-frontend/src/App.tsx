import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Import các trang
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import MainLayout from "./pages/recruiter/MainLayout";
import JobManagementPage from "./pages/recruiter/JobManagementPage";
import RecruiterDashboardPage from "./pages/recruiter/RecruiterDashboardPage";
import CandidateListPage from "./pages/recruiter/CandidateListPage";
import CandidateDetailPage from "./pages/recruiter/CandidateDetailPage";
import CVRankingPage from "./pages/recruiter/CVRankingPage";

import PublicLayout from "./pages/recruiter/PublicLayout";
import HomePage from "./pages/recruiter/HomePage";
import CandidateJobPage from "./pages/candidate/CandidateJobPage";

// Import Admin Pages
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import JobApprovalPage from "./pages/admin/JobApprovalPage";
import UserManagementPage from "./pages/admin/UserManagementPage";
import ReportsPage from "./pages/admin/ReportsPage";
import BranchManagementPage from "./pages/admin/BranchManagementPage";
import RolePermissionPage from "./pages/admin/RolePermissionPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Tuyến đường Public (Dành cho Ứng viên - Không cần đăng nhập) */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="jobs" element={<CandidateJobPage />} />
        </Route>

        {/* 2. Đăng nhập */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* 3. Tuyến đường Internal (Dành cho HR / Admin - Có thanh Menu) */}
        <Route path="/recruiter" element={<MainLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<RecruiterDashboardPage />} />
          <Route path="jobs" element={<JobManagementPage />} />
          <Route path="candidates" element={<CandidateListPage />} />
          <Route path="candidates/:id" element={<CandidateDetailPage />} />
          <Route path="ranking" element={<CVRankingPage />} />
        </Route>

        {/* 4. Tuyến đường Internal (Dành cho Admin) */}
        <Route path="/admin" element={<MainLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="approval" element={<JobApprovalPage />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="branches" element={<BranchManagementPage />} />
          <Route path="roles" element={<RolePermissionPage />} />
        </Route>

        {/* Nếu người dùng nhập URL linh tinh, tự động đá về Trang chủ Public */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;