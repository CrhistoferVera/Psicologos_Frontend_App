import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { COUNTRIES_LATAM, CountryLatam } from "../../constants/countriesLatam";

type Props = {
  label?: string;
  value: CountryLatam;
  onChange: (country: CountryLatam) => void;
};

export default function CountrySelect({ label = "País", value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <View className="mb-[14px]">
      {label ? (
        <Text className="text-[#020617] font-body text-[13px] font-semibold mb-[7px]">{label}</Text>
      ) : null}

      <Pressable
        className="flex-row items-center justify-between min-h-[50px] rounded-xl border-[1.5px] border-[#E2E8F0] bg-[#F8FAFF] px-[14px]"
        onPress={() => setOpen(true)}
      >
        <Text className="text-[#020617] font-body text-sm">{value.name}</Text>
        <Ionicons name="chevron-down" size={18} color="#475569" />
      </Pressable>

      <Modal visible={open} animationType="fade" transparent onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-[rgba(15,23,42,0.35)] justify-center px-5" onPress={() => setOpen(false)}>
          <View className="rounded-[18px] bg-white border border-[#CBD5E1] max-h-[70%] p-[14px]">
            <Text className="text-[#020617] font-heading text-lg font-bold mb-2.5">Selecciona país</Text>

            <ScrollView className="max-h-[380px]" showsVerticalScrollIndicator={false}>
              {COUNTRIES_LATAM.map((country) => {
                const active = country.code === value.code;

                return (
                  <Pressable
                    key={country.code}
                    className={`min-h-[44px] rounded-xl px-3 flex-row items-center justify-between ${active ? "bg-[#EEF5FF]" : ""}`}
                    onPress={() => {
                      onChange(country);
                      setOpen(false);
                    }}
                  >
                    <Text className={`font-body text-sm font-semibold ${active ? "text-[#5B9BD5]" : "text-[#020617]"}`}>
                      {country.name}
                    </Text>
                    <Text className={`font-body text-sm font-bold ${active ? "text-[#5B9BD5]" : "text-[#64748B]"}`}>
                      +{country.dialCode}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
