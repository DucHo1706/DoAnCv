import { EnvironmentOutlined } from "@ant-design/icons";
import SystemCategoryManager from "./SystemCategoryManager";
import { branchService } from "../../services/jobService";

function BranchManagementPage() {
  return (
    <SystemCategoryManager
      title="Quản lý Chi Nhánh"
      subtitle="Thêm, sửa, khóa thông tin các chi nhánh để HR chọn khi tạo tin tuyển dụng."
      entityName="Chi nhánh"
      icon={<EnvironmentOutlined />}
      fetchApi={branchService.getBranches}
      createApi={branchService.createBranch}
      updateApi={branchService.updateBranch}
      toggleStatusApi={branchService.toggleBranchStatus}
    />
  );
}

export default BranchManagementPage;
