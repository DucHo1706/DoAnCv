import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import ScrollToTop from "./components/common/ScrollToTop";
import RouteLoading from "./components/common/RouteLoading";

// Auth
const LoginPage = lazy(() => import("./features/auth/pages/LoginPage"));
const RegisterPage = lazy(() => import("./features/auth/pages/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("./features/auth/pages/ForgotPasswordPage"));

// Layout chung
import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";
import PublicLayout from "./layouts/PublicLayout";

// Recruiter pages
const JobManagementPage = lazy(() => import("./features/recruiter/pages/JobManagementPage"));
const CreateJobPage = lazy(() => import("./features/recruiter/pages/CreateJobPage"));
const RecruiterDashboardPage = lazy(() => import("./features/recruiter/pages/RecruiterDashboardPage"));
const CandidateDetailPage = lazy(() => import("./features/recruiter/pages/CandidateDetailPage"));
const JobCampaignListPage = lazy(() => import("./features/recruiter/pages/JobCampaignListPage"));
const CampaignApplicationsPage = lazy(() => import("./features/recruiter/pages/CampaignApplicationsPage"));
const CandidateComparisonPage = lazy(() => import("./features/recruiter/pages/CandidateComparisonPage"));
const EmailCandidatePage = lazy(() => import("./features/recruiter/pages/EmailCandidatePage"));
const TalentPoolPage = lazy(() => import("./features/recruiter/pages/TalentPoolPage"));
const TalentPoolDetailPage = lazy(() => import("./features/recruiter/pages/TalentPoolDetailPage"));
const InterviewSchedulePage = lazy(() => import("./features/recruiter/pages/InterviewSchedulePage"));
const EmailLogsPage = lazy(() => import("./features/recruiter/pages/EmailLogsPage"));
const HomePage = lazy(() => import("./features/public/pages/HomePage"));
const AboutPage = lazy(() => import("./features/public/pages/AboutPage"));
const RecruiterProfilePage = lazy(() => import("./features/recruiter/pages/RecruiterProfilePage"));
const RecruiterJobDetailPage = lazy(() => import("./features/recruiter/pages/RecruiterJobDetailPage"));

// Candidate pages
const CandidateJobPage = lazy(() => import("./features/candidate-portal/pages/CandidateJobPage"));
const ApplicationStatusPage = lazy(() => import("./features/candidate-portal/pages/ApplicationStatusPage"));
const CandidateProfilePage = lazy(() => import("./features/candidate-portal/pages/CandidateProfilePage"));
const CandidateJobDetailPage = lazy(() => import("./features/candidate-portal/pages/CandidateJobDetailPage"));
const CvAnalysisResultPage = lazy(() => import("./features/candidate-portal/pages/CvAnalysisResultPage"));
const CandidateDashboardPage = lazy(() => import("./features/candidate-portal/pages/CandidateDashboardPage"));
const SavedJobsPage = lazy(() => import("./features/candidate-portal/pages/SavedJobsPage"));
const CvBuilderPage = lazy(() => import("./features/candidate-portal/pages/CvBuilderPage"));

// Admin pages
const AdminDashboardPage = lazy(() => import("./features/admin/pages/AdminDashboardPage"));
const JobApprovalPage = lazy(() => import("./features/admin/pages/JobApprovalPage"));
const AdminJobDetailPage = lazy(() => import("./features/admin/pages/AdminJobDetailPage/AdminJobDetailPage"));
const UserManagementPage = lazy(() => import("./features/admin/pages/UserManagementPage"));
const AuditLogsPage = lazy(() => import("./features/admin/pages/AuditLogsPage"));
const RolePermissionPage = lazy(() => import("./features/admin/pages/RolePermissionPage"));
const RecruiterPerformancePage = lazy(() => import("./features/admin/pages/RecruiterPerformancePage/RecruiterPerformancePage"));
const SystemSettingsPage = lazy(() => import("./features/admin/pages/SystemSettingsPage/SystemSettingsPage"));
const OrganizationManagementPage = lazy(() => import("./features/admin/pages/OrganizationManagementPage/OrganizationManagementPage"));
const AdminProfilePage = lazy(() => import("./features/admin/pages/AdminProfilePage/AdminProfilePage"));

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<RouteLoading />}>
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
          <Route path="candidate/cv-builder" element={<CvBuilderPage />} />
        </Route>

        {/* Recruiter */}
        <Route path="/recruiter" element={<MainLayout />}>
          <Route path="dashboard" element={<RecruiterDashboardPage />} />
          <Route path="jobs" element={<JobManagementPage />} />
          <Route path="jobs/create" element={<CreateJobPage />} />
          <Route path="jobs/:id/edit" element={<CreateJobPage />} />
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
          <Route path="jobs/:id" element={<AdminJobDetailPage />} />
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
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
