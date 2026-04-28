import { Redirect, Stack, usePathname, useRouter } from "expo-router";
import { View } from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import AdminLayout from "../../src/features/admin/components/AdminLayout";
import { appTheme } from "../../src/theme/appTheme";

const routeMeta: Record<string, { title: string; subtitle: string }> = {
  "/admin/overview": {
    title: "Dashboard principal",
    subtitle: "Abril 2026 · Datos en tiempo real",
  },
  "/admin/users": {
    title: "Gestión de Usuarios",
    subtitle: "Total de cuentas registradas y estado operativo",
  },
  "/admin/professionals": {
    title: "Gestión de Profesionales",
    subtitle: "Revisión, aprobación y seguimiento de profesionales",
  },
  "/admin/finance": {
    title: "Finanzas",
    subtitle: "Ingresos, retiros y movimientos de caja",
  },
  "/admin/referrals": {
    title: "Referidos",
    subtitle: "Programa, recompensas y trazabilidad",
  },
  "/admin/packages": {
    title: "Paquetes",
    subtitle: "CRUD de paquetes de créditos para recargas",
  },
  "/admin/sections": {
    title: "Secciones y Subsecciones",
    subtitle: "Taxonomía de especialidades de la plataforma",
  },
  "/admin/config": {
    title: "Configuración",
    subtitle: "Parámetros del sistema y créditos promocionales",
  },
};

export default function AdminRoutesLayout() {
  const { user, isHydrated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (!isHydrated) {
    return <View style={{ flex: 1, backgroundColor: appTheme.colors.background }} />;
  }

  if (!user) return <Redirect href="/admin-login" />;

  if (user.role !== "ADMIN") {
    return <Redirect href="/admin-login" />;
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
