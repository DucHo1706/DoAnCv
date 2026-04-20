import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Auth
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";

// Layout chung
import MainLayout from "./pages/recruiter/MainLayout";

// Recruiter pages
import JobManagementPage from "./pages/recruiter/JobManagementPage";
import RecruiterDashboardPage from "./pages/recruiter/RecruiterDashboardPage";
import CandidateListPage from "./pages/recruiter/CandidateListPage";
import CandidateDetailPage from "./pages/recruiter/CandidateDetailPage";
import CVRankingPage from "./pages/recruiter/CVRankingPage";
import PublicLayout from "./pages/recruiter/PublicLayout";
import HomePage from "./pages/recruiter/HomePage";

// Candidate pages
import CandidateJobPage from "./pages/candidate/CandidateJobPage";

// Admin pages
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import JobApprovalPage from "./pages/admin/JobApprovalPage";
import UserManagementPage from "./pages/admin/UserManagementPage";
import ReportsPage from "./pages/admin/ReportsPage";
import RolePermissionPage from "./pages/admin/RolePermissionPage";
import BranchManagementPage from "./pages/admin/BranchManagementPage";
import CategoryManagementPage from "./pages/admin/CategoryManagementPage";
import JobPositionManagementPage from "./pages/admin/JobPositionManagementPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Public */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="jobs" element={<CandidateJobPage />} />
        </Route>

        {/* Recruiter */}
        <Route path="/recruiter" element={<MainLayout />}>
          <Route path="dashboard" element={<RecruiterDashboardPage />} />
          <Route path="jobs" element={<JobManagementPage />} />
          <Route path="candidates" element={<CandidateListPage />} />
          <Route path="candidates/:id" element={<CandidateDetailPage />} />
          <Route path="ranking" element={<CVRankingPage />} />
        </Route>

        {/* Admin */}
        <Route path="/admin" element={<MainLayout />}>
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="approval" element={<JobApprovalPage />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="roles" element={<RolePermissionPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="branches" element={<BranchManagementPage />} />
          <Route path="categories" element={<CategoryManagementPage />} />
          <Route path="job-positions" element={<JobPositionManagementPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;