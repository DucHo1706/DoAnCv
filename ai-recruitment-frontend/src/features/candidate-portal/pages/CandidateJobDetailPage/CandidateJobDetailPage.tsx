import { Breadcrumb, Spin } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import { useJobDetail } from "./hooks/useJobDetail";
import JobDetailContent from "./components/JobDetailContent";
import JobApplyModal from "./components/JobApplyModal";
import ApplySuccessModal from "./components/ApplySuccessModal";
import CvAiPreviewModal from "../../../../components/candidate/CvAiPreviewModal";
import { appTheme } from "../../../../constants/theme";

export default function CandidateJobDetailPage() {
  const {
    job,
    loading,
    isApplyModalOpen,
    isApplySuccessModalOpen,
    setIsApplySuccessModalOpen,
    appliedApplication,
    isAiPreviewModalOpen,
    setIsAiPreviewModalOpen,
    handleApplyWithAI,
    handleViewAppliedAiEvaluation,
    showApplyModal,
    handleCancelApplyModal,
    handleDirectApply,
    uploadProps,
    navigate,
    isSubmitting,
    relatedJobs,
    hasDefaultCv,
    defaultCvName,
    useDefaultCv,
    setUseDefaultCv,
    savedCvs,
    selectedSavedCvId,
    setSelectedSavedCvId,
    builderDocuments,
    selectedBuilderDocumentId,
    setSelectedBuilderDocumentId,
  } = useJobDetail();

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "100px 0" }}>
        <Spin size="large" tip="Đang tải chi tiết công việc..." />
      </div>
    );
  }

  if (!job) return null;

  return (
    <div style={{ background: appTheme.colors.background, minHeight: "100vh", paddingBottom: 60, paddingTop: 24 }}>
      <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "0 20px" }}>
        {/* Breadcrumb */}
        <Breadcrumb style={{ marginBottom: 16 }}>
          <Breadcrumb.Item
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate("/");
            }}
          >
            <HomeOutlined /> Trang chủ
          </Breadcrumb.Item>
          <Breadcrumb.Item
            href="/jobs"
            onClick={(e) => {
              e.preventDefault();
              navigate("/jobs");
            }}
          >
            Việc làm IT
          </Breadcrumb.Item>
          <Breadcrumb.Item>{job.title}</Breadcrumb.Item>
        </Breadcrumb>

        {/* 1. Chi tiết công việc & công ty */}
        <JobDetailContent
          job={job}
          appliedApplication={appliedApplication}
          showApplyModal={showApplyModal}
          handleApplyWithAI={handleApplyWithAI}
          handleViewAppliedAiEvaluation={handleViewAppliedAiEvaluation}
          relatedJobs={relatedJobs}
        />

        {/* 2. Modal nộp hồ sơ */}
        <JobApplyModal
          open={isApplyModalOpen}
          title={job.title || ""}
          onOk={handleDirectApply}
          onCancel={handleCancelApplyModal}
          confirmLoading={isSubmitting}
          uploadProps={uploadProps}
          hasDefaultCv={hasDefaultCv}
          defaultCvName={defaultCvName}
          useDefaultCv={useDefaultCv}
          setUseDefaultCv={setUseDefaultCv}
          savedCvs={savedCvs}
          selectedSavedCvId={selectedSavedCvId}
          setSelectedSavedCvId={setSelectedSavedCvId}
          builderDocuments={builderDocuments}
          selectedBuilderDocumentId={selectedBuilderDocumentId}
          setSelectedBuilderDocumentId={setSelectedBuilderDocumentId}
        />

        {/* 3. Modal thông báo thành công */}
        <ApplySuccessModal
          open={isApplySuccessModalOpen}
          onCancel={() => setIsApplySuccessModalOpen(false)}
          onContinueBrowsing={() => {
            setIsApplySuccessModalOpen(false);
            navigate("/jobs");
          }}
        />

        {/* 4. AI CV Analysis & Preview Modal */}
        <CvAiPreviewModal
          open={isAiPreviewModalOpen}
          onClose={() => setIsAiPreviewModalOpen(false)}
          jobId={job.id || ""}
          jobTitle={job.title || ""}
          jobDescription={(job.description || "") + "\n" + (job.requirements || "")}
          companyName={job.company || "AI Recruitment"}
        />
      </div>
    </div>
  );
}
