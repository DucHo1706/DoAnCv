import { Skeleton } from "antd";

function RouteLoading() {
  return (
    <main className="route-loading" aria-busy="true" aria-label="Đang tải nội dung">
      <div className="route-loading__header">
        <Skeleton.Input active size="small" style={{ width: 132 }} />
        <Skeleton.Input active style={{ width: 320, maxWidth: "72vw" }} />
      </div>
      <div className="route-loading__grid">
        {[0, 1, 2].map((item) => (
          <div className="route-loading__card" key={item}>
            <Skeleton active title={{ width: "42%" }} paragraph={{ rows: 3 }} />
          </div>
        ))}
      </div>
    </main>
  );
}

export default RouteLoading;
