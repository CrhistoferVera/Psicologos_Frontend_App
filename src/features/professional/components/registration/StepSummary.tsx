import { Pressable, Text, View } from "react-native";
import type { ProfessionalRegister } from "../../hooks/useProfessionalRegister";

export default function StepSummary({ reg }: { reg: ProfessionalRegister }) {
  return (
    <View className="gap-3">
      <View className="rounded-2xl border border-[#CBD5E1] bg-white p-[14px] gap-2">
        <Text className="text-[#6BAF8A] font-heading text-[17px] font-bold">Resumen del envío</Text>
        <Text className="text-[#020617] font-body text-[13px]">Profesional: {reg.firstName} {reg.lastName}</Text>
        <Text className="text-[#020617] font-body text-[13px]">Username: {reg.username}</Text>
        <Text className="text-[#020617] font-body text-[13px]">
          Especialidades: {reg.selectedSpecialtyNames.join(", ") || "Sin seleccionar"}
        </Text>
        <Text className="text-[#020617] font-body text-[13px]">Video de rostro: {reg.kycVideo ? "Grabado" : "Pendiente"}</Text>
        <Text className="text-[#020617] font-body text-[13px]">Documento de identidad: {reg.idDoc ? "Adjunto" : "Pendiente"}</Text>
        <Text className="text-[#020617] font-body text-[13px]">Matrícula profesional: {reg.matricula ? "Adjunta" : "Pendiente"}</Text>
        <Text className="text-[#020617] font-body text-[13px]">Título profesional: {reg.tituloProfesional ? "Adjunto" : "No adjuntado"}</Text>
        {reg.referralCode.trim() ? (
          <Text className="text-[#020617] font-body text-[13px]">Código de referido: {reg.referralCode.trim()}</Text>
        ) : null}
      </View>

      <Pressable className="flex-row items-start gap-2" onPress={() => reg.setAcceptedTerms((prev) => !prev)}>
        <View className={`w-[18px] h-[18px] rounded-[5px] border-[1.5px] mt-px ${reg.acceptedTerms ? "border-[#5B9BD5] bg-[#5B9BD5]" : "border-[#CBD5E1] bg-white"}`} />
        <Text className="flex-1 text-[#475569] font-body text-xs leading-[18px]">
          Acepto los{" "}
          <Text className="text-[#5B9BD5] font-bold" onPress={() => reg.router.push("/terms" as any)}>
            Términos y Condiciones
          </Text>
          .
        </Text>
      </Pressable>

      <Text className="text-[#475569] font-body text-xs leading-[18px]">
        Al enviar, tu perfil quedará en revisión KYC. El equipo cotejará el video con tu documento antes de aprobar tu cuenta.
      </Text>
    </View>
  );
}
