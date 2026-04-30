import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity, Linking } from "react-native";
import Constants from "expo-constants";
import { API_URL, APP_DOWNLOAD_URL } from "../config";

function parseVersion(v: string): number[] {
  return v.split(".").map((n) => parseInt(n, 10) || 0);
}

function isVersionSupported(appVersion: string, minVersion: string): boolean {
  const app = parseVersion(appVersion);
  const min = parseVersion(minVersion);
  const len = Math.max(app.length, min.length);
  for (let i = 0; i < len; i++) {
    const a = app[i] ?? 0;
    const m = min[i] ?? 0;
    if (a > m) return true;
    if (a < m) return false;
  }
  return true;
}

interface Props {
  children: React.ReactNode;
}

export default function VersionGuard({ children }: Props) {
  const [status, setStatus] = useState<"loading" | "ok" | "outdated">("loading");
  const appVersion = Constants.expoConfig?.version ?? "0.0";

  useEffect(() => {
    let cancelled = false;
    async function checkVersion() {
      try {
        const res = await fetch(`${API_URL}/users/config`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const minVersion: string = data.minVersion ?? "1.0";
        if (!cancelled) setStatus(isVersionSupported(appVersion, minVersion) ? "ok" : "outdated");
      } catch {
        if (!cancelled) setStatus("ok");
      }
    }
    void checkVersion();
    return () => {
      cancelled = true;
    };
  }, [appVersion]);

  if (status === "loading") {
    return (
      <View style={{ flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  if (status === "outdated") {
    return (
      <View style={{ flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }}>
        <Text style={{ color: "#fff", fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 16 }}>
          Actualización requerida
        </Text>
        <Text style={{ color: "#aaa", fontSize: 16, textAlign: "center", lineHeight: 26, marginBottom: 40 }}>
          Esta versión de la app ya no está disponible.{"\n"}
          Descarga la última versión para seguir disfrutando de SanaMente.
        </Text>
        <TouchableOpacity
          onPress={() => Linking.openURL(APP_DOWNLOAD_URL)}
          style={{
            backgroundColor: "#fff",
            paddingVertical: 14,
            paddingHorizontal: 32,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: "#000", fontSize: 16, fontWeight: "bold" }}>
            Descargar actualización
          </Text>
        </TouchableOpacity>
        <Text style={{ color: "#444", fontSize: 12, marginTop: 32 }}>
          Versión actual: {appVersion}
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}
