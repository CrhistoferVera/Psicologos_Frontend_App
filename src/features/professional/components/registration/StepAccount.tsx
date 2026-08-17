import { useState } from "react";
import { FlatList, Modal, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppInput from "../../../../components/ui/AppInput";
import type { ProfessionalRegister } from "../../hooks/useProfessionalRegister";

const COUNTRY_CODES = [
  { code: "+591", flag: "BO", country: "Bolivia" },
  { code: "+54", flag: "AR", country: "Argentina" },
  { code: "+55", flag: "BR", country: "Brasil" },
  { code: "+56", flag: "CL", country: "Chile" },
  { code: "+57", flag: "CO", country: "Colombia" },
  { code: "+593", flag: "EC", country: "Ecuador" },
  { code: "+595", flag: "PY", country: "Paraguay" },
  { code: "+51", flag: "PE", country: "Peru" },
  { code: "+598", flag: "UY", country: "Uruguay" },
  { code: "+58", flag: "VE", country: "Venezuela" },
  { code: "+52", flag: "MX", country: "Mexico" },
  { code: "+1", flag: "US", country: "Estados Unidos" },
  { code: "+1", flag: "CA", country: "Canada" },
  { code: "+34", flag: "ES", country: "Espana" },
];

export default function StepAccount({ reg }: { reg: ProfessionalRegister }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const selected = COUNTRY_CODES.find((c) => c.flag === reg.professionalCountry);

  return (
    <View className="gap-3">
      <AppInput label="Username profesional" value={reg.username} onChangeText={reg.setUsername} placeholder="camila.psicologa" />
      <AppInput label="Documento / Cédula" value={reg.cedula} onChangeText={reg.setCedula} placeholder="12345678" />
      <AppInput label="Contraseña" value={reg.password} onChangeText={reg.setPassword} secureTextEntry showPasswordToggle />
      <AppInput label="Confirmar contraseña" value={reg.confirmPassword} onChangeText={reg.setConfirmPassword} secureTextEntry showPasswordToggle />
      <AppInput label="Bio profesional" value={reg.bio} onChangeText={reg.setBio} placeholder="Psicóloga clínica con enfoque cognitivo-conductual" />

      <Text className="text-[#020617] font-body text-[13px] font-semibold -mb-1">País de residencia profesional</Text>
      <Text className="text-[#475569] font-body text-xs leading-[18px]">
        Selecciona el país donde actualmente ejerces tu carrera profesional.
      </Text>
      <Pressable
        className="flex-row items-center gap-1.5 bg-[#F8FAFC] rounded-2xl border border-[#CBD5E1] min-h-[48px] px-3"
        onPress={() => setPickerOpen(true)}
      >
        <Text className="text-[#020617] font-body text-[15px] font-semibold">
          {selected?.flag ?? "BO"} {selected?.country ?? "Bolivia"}
        </Text>
        <Ionicons name="chevron-down" size={14} color="#475569" />
      </Pressable>

      <AppInput
        label="Código de referido (opcional)"
        value={reg.referralCode}
        onChangeText={(v) => reg.setReferralCode(v.toUpperCase())}
        placeholder="Ej: CAMILA4X2B"
        autoCapitalize="characters"
      />

      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <Pressable className="flex-1 bg-[rgba(0,0,0,0.45)] justify-center items-center p-6" onPress={() => setPickerOpen(false)}>
          <Pressable className="bg-white rounded-2xl p-5 w-full max-w-[360px] max-h-[480px]" onPress={(e) => e.stopPropagation()}>
            <Text className="text-[#020617] font-heading text-[17px] font-bold mb-3">País de residencia</Text>
            <FlatList
              data={COUNTRY_CODES}
              keyExtractor={(item) => `prof-${item.flag}-${item.code}`}
              renderItem={({ item }) => {
                const active = item.flag === reg.professionalCountry;
                return (
                  <Pressable
                    className={`flex-row justify-between items-center py-3 px-2 rounded-[10px] ${active ? "bg-[rgba(107,175,138,0.12)]" : ""}`}
                    onPress={() => {
                      reg.setProfessionalCountry(item.flag);
                      setPickerOpen(false);
                    }}
                  >
                    <Text className="text-[#020617] font-body text-[15px]">{item.flag}  {item.country}</Text>
                    <Text className="text-[#475569] font-body text-sm font-semibold">{item.code}</Text>
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
