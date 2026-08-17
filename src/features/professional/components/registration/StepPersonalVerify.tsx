import { Text, View } from "react-native";
import AppButton from "../../../../components/ui/AppButton";
import AppInput from "../../../../components/ui/AppInput";
import BirthDatePicker from "../../../../components/ui/BirthDatePicker";
import GoogleButton from "../../../../components/ui/GoogleButton";
import { GOOGLE_WEB_CLIENT_ID } from "../../../../config";
import type { ProfessionalRegister } from "../../hooks/useProfessionalRegister";

export default function StepPersonalVerify({ reg }: { reg: ProfessionalRegister }) {
  if (!reg.tempToken) {
    return (
      <View className="gap-3">
        <Text className="text-[#475569] font-body text-[13px]">
          Primero verifica tu correo. Luego completarás tus datos personales.
        </Text>

        <AppInput
          label="Email"
          value={reg.email}
          onChangeText={reg.onChangeEmail}
          placeholder="profesional@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View className="flex-row items-center gap-2.5">
          <View className="flex-1">
            <AppButton
              title={reg.otpSent ? "Reenviar OTP" : "Enviar OTP"}
              onPress={reg.handleSendOtp}
              loading={reg.loading}
              variant="secondary"
            />
          </View>
          <Text className="bg-[#F1F5F9] text-[#475569] px-2.5 py-[7px] rounded-full font-body text-xs font-bold overflow-hidden">
            Pendiente
          </Text>
        </View>

        {reg.otpSent ? (
          <View className="rounded-2xl border border-[#CBD5E1] bg-white p-3 gap-2.5">
            <AppInput
              label="Código OTP"
              value={reg.otpCode}
              onChangeText={reg.setOtpCode}
              placeholder="123456"
              keyboardType="number-pad"
            />
            <AppButton
              title="Verificar código"
              onPress={reg.handleVerifyOtp}
              disabled={reg.otpCode.trim().length < 4 || reg.loading}
              loading={reg.loading}
            />
          </View>
        ) : null}

        {GOOGLE_WEB_CLIENT_ID ? (
          <>
            <View className="flex-row items-center gap-2.5 my-0.5">
              <View className="flex-1 h-px bg-[#CBD5E1]" />
              <Text className="text-[#475569] font-body text-sm font-semibold">o</Text>
              <View className="flex-1 h-px bg-[#CBD5E1]" />
            </View>
            <GoogleButton label="Verificar con Google" onPress={reg.handleGoogleVerify} loading={reg.loading} />
            <Text className="text-[#475569] font-body text-xs leading-[18px]">
              Con Google verificamos tu correo al instante, sin código OTP.
            </Text>
          </>
        ) : null}
      </View>
    );
  }

  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-2.5">
        <Text className="text-[#020617] font-body text-[13px]">Correo verificado: {reg.email}</Text>
        <Text className="bg-[rgba(107,175,138,0.16)] text-[#6BAF8A] px-2.5 py-[7px] rounded-full font-body text-xs font-bold overflow-hidden">
          Verificado ✓
        </Text>
      </View>

      {reg.verifiedVia === "google" ? (
        <View className="rounded-2xl border border-[#CBD5E1] bg-white p-[14px] gap-2">
          <Text className="text-[#020617] font-body text-[13px]">Nombre: {reg.firstName} {reg.lastName}</Text>
          <Text className="text-[#020617] font-body text-[13px]">Correo: {reg.email}</Text>
          <Text className="text-[#475569] font-body text-xs leading-[18px]">Estos datos vienen de tu cuenta de Google.</Text>
        </View>
      ) : (
        <>
          <AppInput label="Nombre" value={reg.firstName} onChangeText={reg.setFirstName} placeholder="Camila" />
          <AppInput label="Apellido" value={reg.lastName} onChangeText={reg.setLastName} placeholder="Rojas" />
        </>
      )}

      <BirthDatePicker
        label="Fecha de nacimiento"
        value={reg.dateOfBirth}
        onChange={reg.setDateOfBirth}
      />
    </View>
  );
}
