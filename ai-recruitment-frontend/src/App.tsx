import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "./components/common/ScrollToTop";

// Auth
import LoginPage from "./features/auth/pages/LoginPage";
import RegisterPage from "./features/auth/pages/RegisterPage";
import ForgotPasswordPage from "./features/auth/pages/ForgotPasswordPage";

// Layout chung
import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";
import PublicLayout from "./layouts/PublicLayout";

// Recruiter pages
import JobManagementPage from "./features/jobs/pages/JobManagementPage";
import CreateJobPage from "./features/jobs/pages/CreateJobPage";
import RecruiterDashboardPage from "./features/dashboard/pages/RecruiterDashboardPage";
import CandidateDetailPage from "./features/candidates/pages/CandidateDetailPage";
import ApplicationManagementPage from "./features/applications/pages/ApplicationManagementPage";
import CandidateComparisonPage from "./features/cv-analysis/pages/CandidateComparisonPage";
import EmailCandidatePage from "./features/email/pages/EmailCandidatePage";
import TalentPoolPage from "./features/talent-pool/pages/TalentPoolPage";
import TalentPoolDetailPage from "./features/talent-pool/pages/TalentPoolDetailPage";
import InterviewSchedulePage from "./features/interviews/pages/InterviewSchedulePage";
import EmailLogsPage from "./features/email/pages/EmailLogsPage";
import HomePage from "./features/public/pages/HomePage";
import AboutPage from "./features/public/pages/AboutPage";
import RecruiterProfilePage from "./features/recruiter-profile/pages/RecruiterProfilePage";
import RecruiterJobDetailPage from "./features/jobs/pages/RecruiterJobDetailPage";

// Candidate pages
import CandidateJobPage from "./features/jobs/pages/CandidateJobPage";
import ApplicationStatusPage from "./features/applications/pages/ApplicationStatusPage";
import CandidateProfilePage from "./features/candidates/pages/CandidateProfilePage";
import CandidateJobDetailPage from "./features/jobs/pages/CandidateJobDetailPage";
import CvAnalysisResultPage from "./features/cv-analysis/pages/CvAnalysisResultPage";
import CandidateDashboardPage from "./features/candidates/pages/CandidateDashboardPage";
import SavedJobsPage from "./features/jobs/pages/SavedJobsPage";

// Admin pages
import AdminDashboardPage from "./features/dashboard/pages/AdminDashboardPage";
import JobApprovalPage from "./features/jobs/pages/JobApprovalPage";
import UserManagementPage from "./features/admin-settings/pages/UserManagementPage";
import AuditLogsPage from "./features/admin-settings/pages/AuditLogsPage";
import RolePermissionPage from "./features/admin-settings/pages/RolePermissionPage";
import BranchManagementPage from "./features/admin-settings/pages/BranchManagementPage";
import CategoryManagementPage from "./features/admin-settings/pages/CategoryManagementPage";
import JobPositionManagementPage from "./features/admin-settings/pages/JobPositionManagementPage";
import JobLevelManagementPage from "./features/admin-settings/pages/JobLevelManagementPage";

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
          <Route path="candidate/dashboard" element={<CandidateDashboardPage />} />
          <Route path="candidate/saved-jobs" element={<SavedJobsPage />} />
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
          <Route path="reports" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
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
