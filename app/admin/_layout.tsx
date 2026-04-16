import { Redirect, Stack, usePathname, useRouter } from "expo-router";
import { View } from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import AdminLayout from "../../src/features/admin/components/AdminLayout";
import { appTheme } from "../../src/theme/appTheme";

const routeMeta: Record<string, { title: string; subtitle: string }> = {
  "/admin/overview": {
    title: "Admin Overview",
    subtitle: "Vista ejecutiva de negocio, operacion y pendientes.",
  },
  "/admin/users": {
    title: "Admin Users",
    subtitle: "Gestion de clientes, estado de cuentas y creditos.",
  },
  "/admin/professionals": {
    title: "Admin Professionals",
    subtitle: "Revision, aprobacion y gestion de especialidades.",
  },
  "/admin/finance": {
    title: "Admin Finance",
    subtitle: "Depositos, retiros y resumen financiero del sistema.",
  },
  "/admin/referrals": {
    title: "Admin Referrals",
    subtitle: "Programa de referidos, estados y recompensas.",
  },
  "/admin/sections": {
    title: "Admin Sections",
    subtitle: "Catalogo de especialidades y estructura de categorias.",
  },
  "/admin/config": {
    title: "Admin Config",
    subtitle: "Parametros del sistema, reglas y creditos promocionales.",
  },
};

export default function AdminRoutesLayout() {
  const { user, isHydrated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (!isHydrated) {
    return <View style={{ flex: 1, backgroundColor: appTheme.colors.background }} />;
  }

  if (!user) return <Redirect href="/(public)/auth" />;

  if (user.role !== "ADMIN") {
    const isProfessional = user.role === "PROFESSIONAL" || user.role === "ANFITRIONA";
    if (isProfessional) return <Redirect href="/(professional)/dashboard" />;
    return <Redirect href="/(user)/home" />;
  }

  const meta = routeMeta[pathname] ?? routeMeta["/admin/overview"];

  return (
    <AdminLayout title={meta.title} subtitle={meta.subtitle} onRefresh={() => router.replace(pathname as any)}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: appTheme.colors.background },
        }}
      />
    </AdminLayout>
  );
}
