import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

type Props = {
  reviewStatus: string | null;
  canCharge: boolean;
  verificationDocType: string | null;
};

const DOC_LABEL: Record<string, string> = {
  CI: "Carnet de identidad (CI)",
  TITULO: "Título profesional",
  MATRICULA: "Matrícula profesional",
};

// Tarjeta de estado: aparece cuando el admin revisó y aprobó la cuenta.
// Muestra con check verde lo ya completado; el cobro es un paso aparte y
// refleja su estado real (habilitado / gratuito para CI / aún no habilitado).
export default function VerificationStatusCard({ reviewStatus, canCharge, verificationDocType }: Props) {
  if (reviewStatus !== "APPROVED") return null;

  const docLabel = (verificationDocType && DOC_LABEL[verificationDocType]) || "Documento de verificación";
  const isCI = verificationDocType === "CI";

  // Para CI, "sesiones gratuitas" es el estado válido. Para título/matrícula,
  // si canCharge es false el cobro aún no fue habilitado por el admin.
  const chargeItem = canCharge
    ? { label: "Cobro habilitado", done: true }
    : isCI
      ? { label: "Sesiones gratuitas habilitadas", done: true }
      : { label: "Cobro no habilitado todavía", done: false };

  const items = [
    { label: "Documentación enviada", done: true },
    { label: `${docLabel} verificado`, done: true },
    { label: "Perfil revisado y aprobado", done: true },
    chargeItem,
  ];

  return (
    <View className="rounded-2xl border border-[#A7F3D0] bg-[#ECFDF5] p-4 gap-2">
      <View className="flex-row items-center gap-2">
        <Ionicons name="shield-checkmark" size={20} color="#059669" />
        <Text className="text-[#065F46] font-heading text-[15px] font-bold">Verificación completa</Text>
      </View>

      <Text className="text-[#047857] font-body text-xs leading-[18px]">
        ¡Felicitaciones! Tu cuenta fue revisada y aprobada. Esto es lo que ya completaste:
      </Text>

      <View className="gap-1.5 mt-1">
        {items.map((item) => (
          <View key={item.label} className="flex-row items-center gap-2">
            <Ionicons
              name={item.done ? "checkmark-circle" : "time-outline"}
              size={18}
              color={item.done ? "#10B981" : "#D97706"}
            />
            <Text className={`font-body text-sm flex-1 ${item.done ? "text-[#065F46]" : "text-[#B45309]"}`}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>

      {!canCharge && !isCI ? (
        <View className="flex-row items-center gap-2 rounded-xl bg-[#FEF3C7] px-3 py-2 mt-1">
          <Ionicons name="information-circle-outline" size={16} color="#B45309" />
          <Text className="text-[#92400E] font-body text-xs flex-1">
            Tu cobro aún no está habilitado. Te avisaremos cuando lo activemos.
          </Text>
        </View>
      ) : null}
    </View>
  );
}
