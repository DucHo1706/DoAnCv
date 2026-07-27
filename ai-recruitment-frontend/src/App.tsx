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
import JobManagementPage from "./features/recruiter/pages/JobManagementPage";
import CreateJobPage from "./features/recruiter/pages/CreateJobPage";
import RecruiterDashboardPage from "./features/recruiter/pages/RecruiterDashboardPage";
import CandidateDetailPage from "./features/recruiter/pages/CandidateDetailPage";
import JobCampaignListPage from "./features/recruiter/pages/JobCampaignListPage";
import CampaignApplicationsPage from "./features/recruiter/pages/CampaignApplicationsPage";
import CandidateComparisonPage from "./features/recruiter/pages/CandidateComparisonPage";
import EmailCandidatePage from "./features/recruiter/pages/EmailCandidatePage";
import TalentPoolPage from "./features/recruiter/pages/TalentPoolPage";
import TalentPoolDetailPage from "./features/recruiter/pages/TalentPoolDetailPage";
import InterviewSchedulePage from "./features/recruiter/pages/InterviewSchedulePage";
import EmailLogsPage from "./features/recruiter/pages/EmailLogsPage";
import HomePage from "./features/public/pages/HomePage";
import AboutPage from "./features/public/pages/AboutPage";
import RecruiterProfilePage from "./features/recruiter/pages/RecruiterProfilePage";
import RecruiterJobDetailPage from "./features/recruiter/pages/RecruiterJobDetailPage";

// Candidate pages
import CandidateJobPage from "./features/candidate-portal/pages/CandidateJobPage";
import ApplicationStatusPage from "./features/candidate-portal/pages/ApplicationStatusPage";
import CandidateProfilePage from "./features/candidate-portal/pages/CandidateProfilePage";
import CandidateJobDetailPage from "./features/candidate-portal/pages/CandidateJobDetailPage";
import CvAnalysisResultPage from "./features/candidate-portal/pages/CvAnalysisResultPage";
import CandidateDashboardPage from "./features/candidate-portal/pages/CandidateDashboardPage";
import SavedJobsPage from "./features/candidate-portal/pages/SavedJobsPage";

// Admin pages
import AdminDashboardPage from "./features/admin/pages/AdminDashboardPage";
import JobApprovalPage from "./features/admin/pages/JobApprovalPage";
import UserManagementPage from "./features/admin/pages/UserManagementPage";
import AuditLogsPage from "./features/admin/pages/AuditLogsPage";
import RolePermissionPage from "./features/admin/pages/RolePermissionPage";
import BranchManagementPage from "./features/admin/pages/BranchManagementPage";
import CategoryManagementPage from "./features/admin/pages/CategoryManagementPage";
import JobPositionManagementPage from "./features/admin/pages/JobPositionManagementPage";
import JobLevelManagementPage from "./features/admin/pages/JobLevelManagementPage";
import RecruiterPerformancePage from "./features/admin/pages/RecruiterPerformancePage/RecruiterPerformancePage";
import SystemSettingsPage from "./features/admin/pages/SystemSettingsPage/SystemSettingsPage";
import OrganizationManagementPage from "./features/admin/pages/OrganizationManagementPage/OrganizationManagementPage";
import AdminProfilePage from "./features/admin/pages/AdminProfilePage/AdminProfilePage";

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
          <Route path="jobs/create" element={<CreateJobPage />} />
          <Route path="jobs/:id" element={<RecruiterJobDetailPage />} />
          <Route path="applications" element={<JobCampaignListPage />} />
          <Route path="applications/:jobId" element={<CampaignApplicationsPage />} />
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
          <Route path="recruiter-performance" element={<RecruiterPerformancePage />} />
          <Route path="roles" element={<RolePermissionPage />} />
          <Route path="reports" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
          <Route path="organization" element={<OrganizationManagementPage />} />
          <Route path="branches" element={<Navigate to="/admin/organization?tab=branches" replace />} />
          <Route path="categories" element={<Navigate to="/admin/organization?tab=categories" replace />} />
          <Route path="job-levels" element={<Navigate to="/admin/organization?tab=job-levels" replace />} />
          <Route path="job-positions" element={<Navigate to="/admin/organization?tab=job-positions" replace />} />
          <Route path="settings" element={<SystemSettingsPage />} />
          <Route path="profile" element={<AdminProfilePage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
