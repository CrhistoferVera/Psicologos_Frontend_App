import "../global.css";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Alert, BackHandler, Platform, View } from "react-native";
import * as ScreenCapture from "expo-screen-capture";
import { AuthProvider } from "../src/context/AuthContext";
import { ActiveChatProvider } from "../src/context/ActiveChatContext";
import Toast from "react-native-toast-message";
import { toastConfig } from "../src/components/ToastConfig";
import { useEffect } from "react";
import VersionGuard from "../src/components/VersionGuard";
import { appTheme } from "../src/theme/appTheme";

function BackHandlerGuard() {
  const router = useRouter();

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (router.canGoBack()) {
        // Allow native back navigation when there is navigation history.
        return false;
      }

      Alert.alert(
        "¿Salir de la app?",
        "¿Seguro que quieres salir de la aplicación?",
        [
          { text: "Cancelar", style: "cancel", onPress: () => {} },
          { text: "Salir", style: "destructive", onPress: () => BackHandler.exitApp() },
        ],
        { cancelable: true },
      );
      return true;
    });
    return () => subscription.remove();
  }, [router]);

  return null;
}

function ScreenCaptureGuard() {
  useEffect(() => {
    if (Platform.OS === "web") return;

    void ScreenCapture.preventScreenCaptureAsync().catch(() => {});

    return () => {
      void ScreenCapture.allowScreenCaptureAsync().catch(() => {});
    };
  }, []);

  return null;
}

export default function Layout() {
  return (
    <VersionGuard>
      <AuthProvider>
        <ActiveChatProvider>
          <ScreenCaptureGuard />
          <BackHandlerGuard />
          <View className="flex-1" style={{ backgroundColor: appTheme.colors.background }}>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }} />
            <Toast config={toastConfig} />
          </View>
        </ActiveChatProvider>
      </AuthProvider>
    </VersionGuard>
  );
}
