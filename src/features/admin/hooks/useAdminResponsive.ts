import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

export function useAdminResponsive() {
  const { width } = useWindowDimensions();

  return useMemo(() => {
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1200;
    const isDesktop = width >= 1200;
    const contentPadding = isMobile ? 12 : isTablet ? 18 : 30;

    return {
      width,
      isMobile,
      isTablet,
      isDesktop,
      isCompactLayout: width < 1100,
      contentPadding,
    };
  }, [width]);
}
