import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import AuthLayout from "../layouts/AuthLayout";
import CandidateLayout from "../layouts/CandidateLayout";
import RecruiterLayout from "../layouts/RecruiterLayout";

import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";

import ApplicationStatusPage from "../pages/candidate/ApplicationStatusPage";
import JobSuggestionsPage from "../pages/candidate/JobSuggestionsPage";
import ProfilePage from "../pages/candidate/ProfilePage";
import UploadCVPage from "../pages/candidate/UploadCVPage";

import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import ReportsPage from "../pages/admin/ReportsPage";
import RolePermissionPage from "../pages/admin/RolePermissionPage";
import UserManagementPage from "../pages/admin/UserManagementPage";
import JobApprovalPage from "../pages/admin/JobApprovalPage";
import BranchManagementPage from "../pages/admin/BranchManagementPage";
import CategoryManagementPage from "../pages/admin/CategoryManagementPage";
import JobPositionManagementPage from "../pages/admin/JobPositionManagementPage";

import CandidateListPage from "../pages/recruiter/CandidateListPage";
import CVRankingPage from "../pages/recruiter/CVRankingPage";
import JobManagementPage from "../pages/recruiter/JobManagementPage";
import RecruiterDashboardPage from "../pages/recruiter/RecruiterDashboardPage";
import CandidateDetailPage from "../pages/recruiter/CandidateDetailPage";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        <Route path="/recruiter" element={<RecruiterLayout />}>
          <Route path="dashboard" element={<RecruiterDashboardPage />} />
          <Route path="jobs" element={<JobManagementPage />} />
          <Route path="candidates" element={<CandidateListPage />} />
          <Route path="cv-ranking" element={<CVRankingPage />} />
          <Route path="candidates/:id" element={<CandidateDetailPage />} />
        </Route>

        <Route path="/candidate" element={<CandidateLayout />}>
          <Route path="profile" element={<ProfilePage />} />
          <Route path="upload-cv" element={<UploadCVPage />} />
          <Route path="job-suggestions" element={<JobSuggestionsPage />} />
          <Route path="application-status" element={<ApplicationStatusPage />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="roles" element={<RolePermissionPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="job-approvals" element={<JobApprovalPage />} />
          <Route path="branches"       element={<BranchManagementPage />} />
          <Route path="categories"     element={<CategoryManagementPage />} />
          <Route path="job-positions"  element={<JobPositionManagementPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;