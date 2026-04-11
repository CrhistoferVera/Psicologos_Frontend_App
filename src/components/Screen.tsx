import { View } from "react-native";
import type { ReactNode } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ScreenProps = {
  children: ReactNode;
  className?: string;
  pad?: boolean;
};

export default function Screen({
  children,
  className = "",
  pad = true,
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className={`flex-1 ${pad ? "px-6" : ""} ${className} bg-black`}
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {children}
    </View>
  );
}
