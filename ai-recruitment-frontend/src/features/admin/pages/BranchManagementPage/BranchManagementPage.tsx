import { EnvironmentOutlined } from "@ant-design/icons";
import SystemCategoryManager from "../../components/SystemCategoryManager";
import { branchService } from "../../../../services/jobService";

function BranchManagementPage() {
  return (
    <SystemCategoryManager
      title="Quản lý Chi Nhánh"
      subtitle=""
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
