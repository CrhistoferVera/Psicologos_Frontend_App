import { useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, Text, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";
import { submitChargeVerification } from "../../api/professionalApi";

type Props = {
  canCharge: boolean;
  chargeVerificationPending: boolean;
  verificationDocType: string | null;
  onSubmitted: () => void | Promise<void>;
};

type Picked = { uri: string; name: string; type: string };

// Tarjeta visible SOLO para profesionales verificados con CI que aún no pueden cobrar.
// Les permite subir su título y/o matrícula para habilitar el cobro; mientras el admin
// los revisa, se muestra el estado "en revisión". Quien se registró con título o
// matrícula no la ve: su cobro se habilita al aprobarlo el admin.
export default function ChargeVerificationCard({
  canCharge,
  chargeVerificationPending,
  verificationDocType,
  onSubmitted,
}: Props) {
  if (canCharge || verificationDocType !== "CI") return null;

  return (
    <View className="rounded-2xl border border-[#FDE68A] bg-[#FFFBEB] p-4 gap-2">
      <View className="flex-row items-center gap-2">
        <Ionicons name="school-outline" size={18} color="#B45309" />
        <Text className="text-[#92400E] font-heading text-[15px] font-bold">Habilitar cobro</Text>
      </View>

      <Text className="text-[#92400E] font-body text-xs leading-[18px]">
        Tu cuenta está verificada con carnet (CI), así que por ahora solo puedes practicar con
        sesiones gratuitas. Para cobrar por tus sesiones, sube tu título profesional y/o tu
        matrícula y los verificaremos.
      </Text>

      {chargeVerificationPending ? (
        <View className="flex-row items-center gap-2 rounded-xl bg-[#FEF3C7] px-3 py-2">
          <Ionicons name="time-outline" size={16} color="#B45309" />
          <Text className="text-[#92400E] font-body text-xs flex-1">
            Documentación en revisión. Te avisaremos cuando habilitemos tu cobro.
          </Text>
        </View>
      ) : (
        <View className="gap-3">
          <DocUploader kind="titulo" label="título" onSubmitted={onSubmitted} />
          <DocUploader kind="matricula" label="matrícula" onSubmitted={onSubmitted} />
        </View>
      )}
    </View>
  );
}

// Selecciona un documento, muestra un preview (miniatura si es imagen, o ícono + nombre
// si es PDF) y recién al confirmar lo envía al backend.
function DocUploader({
  kind,
  label,
  onSubmitted,
}: {
  kind: "titulo" | "matricula";
  label: string;
  onSubmitted: () => void | Promise<void>;
}) {
  const [picked, setPicked] = useState<Picked | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function pick() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;
      setPicked({
        uri: asset.uri,
        name: asset.name ?? kind,
        type: asset.mimeType ?? "application/octet-stream",
      });
    } catch {
      Alert.alert("Error", "No se pudo seleccionar el documento.");
    }
  }

  async function send() {
    if (!picked) return;
    try {
      setSubmitting(true);
      await submitChargeVerification(picked, kind);
      Alert.alert(
        kind === "matricula" ? "Matrícula enviada" : "Título enviado",
        "Lo revisaremos para habilitar tu cobro.",
      );
      setPicked(null);
      await onSubmitted();
    } catch {
      Alert.alert("Error", "No se pudo enviar tu documento. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  const isImage = picked?.type.startsWith("image/");

  if (!picked) {
    return (
      <Pressable
        onPress={() => void pick()}
        className="flex-row items-center justify-center gap-2 rounded-xl border border-[#D9A441] bg-white px-4 py-3 active:opacity-70"
      >
        <Ionicons name="document-attach-outline" size={18} color="#B45309" />
        <Text className="text-[#B45309] font-body text-sm font-semibold">Seleccionar mi {label}</Text>
      </Pressable>
    );
  }

  return (
    <View className="rounded-xl border border-[#D9A441] bg-white p-2 gap-2">
      <View className="flex-row items-center gap-3">
        {isImage ? (
          <Image source={{ uri: picked.uri }} className="h-14 w-14 rounded-lg" resizeMode="cover" />
        ) : (
          <View className="h-14 w-14 rounded-lg bg-[#FEF3C7] items-center justify-center">
            <Ionicons name="document-text-outline" size={26} color="#B45309" />
          </View>
        )}
        <View className="flex-1">
          <Text className="text-[#92400E] font-body text-xs font-semibold" numberOfLines={1}>
            Tu {label}
          </Text>
          <Text className="text-[#A16207] font-body text-[11px]" numberOfLines={1}>
            {picked.name}
          </Text>
        </View>
        {!submitting ? (
          <Pressable onPress={() => void pick()} hitSlop={8} className="p-1 active:opacity-70">
            <Ionicons name="swap-horizontal-outline" size={20} color="#B45309" />
          </Pressable>
        ) : null}
      </View>

      <View className="flex-row gap-2">
        {!submitting ? (
          <Pressable
            onPress={() => setPicked(null)}
            className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-[#E5B65B] bg-white px-3 py-2.5 active:opacity-70"
          >
            <Ionicons name="close-outline" size={16} color="#B45309" />
            <Text className="text-[#B45309] font-body text-xs font-semibold">Cancelar</Text>
          </Pressable>
        ) : null}
        <Pressable
          disabled={submitting}
          onPress={() => void send()}
          className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-[#B45309] px-3 py-2.5 ${submitting ? "opacity-60" : ""}`}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="cloud-upload-outline" size={16} color="#FFFFFF" />
          )}
          <Text className="text-white font-body text-xs font-semibold">
            {submitting ? "Enviando..." : "Confirmar y enviar"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
