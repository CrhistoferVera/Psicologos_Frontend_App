import { Text, View } from "react-native";
import AppInput from "../../../../components/ui/AppInput";
import BirthDatePicker from "../../../../components/ui/BirthDatePicker";
import type { ProfessionalUpgrade } from "../../hooks/useProfessionalUpgrade";

export default function StepUpgradeData({ reg }: { reg: ProfessionalUpgrade }) {
  return (
    <View className="gap-3">
      <View className="rounded-2xl border border-[rgba(107,175,138,0.4)] bg-[rgba(107,175,138,0.1)] p-[14px] gap-1">
        <Text className="text-[#020617] font-body text-[13px] font-semibold">Tu cuenta ya está verificada ✓</Text>
        <Text className="text-[#475569] font-body text-xs leading-[18px]">
          Solo necesitamos tus datos profesionales. No pedimos otra vez tu nombre ni tu correo.
        </Text>
      </View>

      <AppInput
        label="Username profesional"
        value={reg.username}
        onChangeText={reg.setUsername}
        placeholder="camila.psicologa"
        autoCapitalize="none"
      />
      <AppInput
        label="Documento / Cédula"
        value={reg.cedula}
        onChangeText={reg.setCedula}
        placeholder="12345678"
      />
      <BirthDatePicker
        label="Fecha de nacimiento"
        value={reg.dateOfBirth}
        onChange={reg.setDateOfBirth}
      />
      <AppInput
        label="Bio profesional (opcional)"
        value={reg.bio}
        onChangeText={reg.setBio}
        placeholder="Psicóloga clínica con enfoque cognitivo-conductual"
      />
    </View>
  );
}
