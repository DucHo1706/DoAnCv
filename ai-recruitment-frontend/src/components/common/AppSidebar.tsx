import { Layout, Menu } from "antd";
import type { ItemType } from "antd/es/menu/interface";
import { useLocation, useNavigate } from "react-router-dom";

const { Sider } = Layout;

type AppSidebarProps = {
  brand: string;
  items: ItemType[];
};

function AppSidebar({ brand, items }: AppSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Sider width={240} theme="dark">
      <div
        style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#FFFFFF",
          fontSize: 18,
          fontWeight: 700,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          padding: "0 16px",
          textAlign: "center",
        }}
      >
        {brand}
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={items}
        onClick={({ key }) => navigate(String(key))}
        style={{ borderRight: 0, paddingTop: 8 }}
      />
    </Sider>
  );
}

export default AppSidebar;