import { Grid } from "antd";

const { useBreakpoint } = Grid;

/**
 * Hook dùng chung xác định loại màn hình theo token breakpoint của AntD.
 * - isMobile: dưới 768px (điện thoại)
 * - isTablet: từ 768px đến dưới 992px
 * - isDesktop: từ 992px trở lên
 */
export function useResponsive() {
  const screens = useBreakpoint();

  const isMobile = !screens.md;
  const isTablet = !!screens.md && !screens.lg;
  const isDesktop = !!screens.lg;

  return { screens, isMobile, isTablet, isDesktop };
}

export default useResponsive;
