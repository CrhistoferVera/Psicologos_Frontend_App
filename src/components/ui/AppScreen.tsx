import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { appTheme } from "../../theme/appTheme";

type Props = {
  children: ReactNode;
  scroll?: boolean;
  contentPadding?: number;
};

export default function AppScreen({ children, scroll = false, contentPadding = 16 }: Props) {
  const insets = useSafeAreaInsets();

  if (scroll) {
    return (
      <SafeAreaView edges={["top", "left", "right"]} style={styles.safe}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              {
                padding: contentPadding,
                paddingBottom: Math.max(24, insets.bottom + 12),
              },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={[styles.content, { padding: contentPadding }]}>
          {children}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
