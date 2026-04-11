import { Stack } from "expo-router";
import HeaderTitle from "@/src/components/Menu/HeaderTitle";
import { ReactNode } from "react";

type Role = "anfitriona" | "cliente";

type Props = {
  title: string;
  role: Role;

  showBackButton?: boolean;

  backgroundColor?: string;
  renderHeaderTitle?: () => ReactNode;
  renderHeaderRight?: () => ReactNode;
};

export default function ScreenHeader({
  title,
  role,
  showBackButton = false,
  backgroundColor = "black",
  renderHeaderTitle,
  renderHeaderRight,
}: Props) {
  return (
    <Stack.Screen
      options={{
        headerShown: true,
        headerBackVisible: showBackButton,
        headerTitleAlign: "left",

        headerTitle:
          renderHeaderTitle ??
          (() => (
            <HeaderTitle
              title={title}
              role={role}
            />
          )),

        headerRight: renderHeaderRight,

        headerStyle: {
          backgroundColor,
        },

        headerTintColor: "white",
        headerShadowVisible: false,
      }}
    />
  );
}
