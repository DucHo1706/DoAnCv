import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "./components/common/ScrollToTop";

// Auth
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";

// Layout chung
import MainLayout from "./pages/recruiter/MainLayout";
import AuthLayout from "./layouts/AuthLayout";

// Recruiter pages
import JobManagementPage from "./pages/recruiter/JobManagementPage";
import CreateJobPage from "./pages/recruiter/CreateJobPage";
import RecruiterDashboardPage from "./pages/recruiter/RecruiterDashboardPage";
import CandidateDetailPage from "./pages/recruiter/CandidateDetailPage";
import ApplicationManagementPage from "./pages/recruiter/ApplicationManagementPage";
import CandidateComparisonPage from "./pages/recruiter/CandidateComparisonPage";
import EmailCandidatePage from "./pages/recruiter/EmailCandidatePage";
import TalentPoolPage from "./pages/recruiter/TalentPoolPage";
import TalentPoolDetailPage from "./pages/recruiter/TalentPoolDetailPage";
import InterviewSchedulePage from "./pages/recruiter/InterviewSchedulePage/InterviewSchedulePage";
import EmailLogsPage from "./pages/recruiter/EmailLogsPage/EmailLogsPage";
import PublicLayout from "./pages/recruiter/PublicLayout";
import HomePage from "./pages/recruiter/HomePage";
import AboutPage from "./pages/candidate/AboutPage";
import RecruiterProfilePage from "./pages/recruiter/RecruiterProfilePage";
import RecruiterJobDetailPage from "./pages/recruiter/RecruiterJobDetailPage";

// Candidate pages
import CandidateJobPage from "./pages/candidate/CandidateJobPage";
import ApplicationStatusPage from "./pages/candidate/ApplicationStatusPage";
import CandidateProfilePage from "./pages/candidate/CandidateProfilePage";
import CandidateJobDetailPage from "./pages/candidate/CandidateJobDetailPage";
import CvAnalysisResultPage from "./pages/candidate/CvAnalysisResultPage";

// Admin pages
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import JobApprovalPage from "./pages/admin/JobApprovalPage";
import UserManagementPage from "./pages/admin/UserManagementPage";
import ReportsPage from "./pages/admin/ReportsPage";
import RolePermissionPage from "./pages/admin/RolePermissionPage";
import BranchManagementPage from "./pages/admin/BranchManagementPage";
import CategoryManagementPage from "./pages/admin/CategoryManagementPage";
import JobPositionManagementPage from "./pages/admin/JobPositionManagementPage";
import JobLevelManagementPage from "./pages/admin/JobLevelManagementPage";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Auth */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        {/* Public */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="jobs" element={<CandidateJobPage />} />
          <Route path="jobs/:id" element={<CandidateJobDetailPage />} />
          <Route path="jobs/:id/cv-analysis" element={<CvAnalysisResultPage />} />
          <Route path="my-applications" element={<ApplicationStatusPage />} />
          <Route path="profile" element={<CandidateProfilePage />} />
        </Route>

        {/* Recruiter */}
        <Route path="/recruiter" element={<MainLayout />}>
          <Route path="dashboard" element={<RecruiterDashboardPage />} />
          <Route path="jobs" element={<JobManagementPage />} />
          <Route path="jobs/create" element={<CreateJobPage />} /> {/* <--- Thêm dòng này */}
          <Route path="jobs/:id" element={<RecruiterJobDetailPage />} />
          <Route path="applications" element={<ApplicationManagementPage />} />
          <Route path="schedules" element={<InterviewSchedulePage />} />
          <Route path="candidates/:id" element={<CandidateDetailPage />} />
          <Route path="candidates/:id/email" element={<EmailCandidatePage />} />
          <Route path="ranking" element={<Navigate to="/recruiter/applications" replace />} />
          <Route path="ranking/compare" element={<CandidateComparisonPage />} />
          <Route path="talent-pool" element={<TalentPoolPage />} />
          <Route path="talent-pool/:id" element={<TalentPoolDetailPage />} />
          <Route path="email-logs" element={<EmailLogsPage />} />
          <Route path="profile" element={<RecruiterProfilePage />} />
          <Route path="compare" element={<CandidateComparisonPage />} />
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
          <Route path="job-levels" element={<JobLevelManagementPage />} />
          <Route path="job-positions" element={<JobPositionManagementPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
