import type { ReactNode } from "react";
import { Text, View } from "react-native";
import AppCard from "../../../../components/ui/AppCard";

type Props = {
  title?: string;
  titleLeft?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
};

export default function SectionCard({ title, titleLeft, action, children }: Props) {
  const hasHead = Boolean(title || titleLeft || action);

  return (
    <AppCard style={{ marginHorizontal: 14, borderRadius: 16, gap: 10 }}>
      {hasHead ? (
        <View className="flex-row items-center justify-between">
          {titleLeft ?? (
            <Text className="text-[#2A405B] font-heading text-base font-bold">{title}</Text>
          )}
          {action}
        </View>
      ) : null}
      {children}
    </AppCard>
  );
}
