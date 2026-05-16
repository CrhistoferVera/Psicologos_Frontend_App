import { Pressable, StyleSheet, Text, View } from "react-native";
import { appTheme } from "../../../theme/appTheme";

interface Tab {
  key: string;
  label: string;
  count?: number;
}

interface Props {
  tabs: Tab[];
  activeKey: string;
  onPress: (key: string) => void;
}

export default function HistoryTabBar({ tabs, activeKey, onPress }: Props) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <Pressable
            key={tab.key}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onPress(tab.key)}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
            {tab.count !== undefined ? (
              <View style={[styles.countBadge, isActive && styles.countBadgeActive]}>
                <Text style={[styles.countText, isActive && styles.countTextActive]}>
                  {tab.count}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#EEF2F7",
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: "600",
    color: appTheme.colors.textMuted,
  },
  labelActive: {
    color: appTheme.colors.primary,
    fontFamily: appTheme.fonts.heading,
  },
  countBadge: {
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 1,
    backgroundColor: "#CBD5E1",
    minWidth: 20,
    alignItems: "center",
  },
  countBadgeActive: {
    backgroundColor: appTheme.colors.primary,
  },
  countText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.body,
  },
  countTextActive: {
    color: "#FFFFFF",
  },
});
