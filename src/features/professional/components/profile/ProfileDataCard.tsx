import { Pressable, Text, TextInput, View } from "react-native";
import AppChip from "../../../../components/ui/AppChip";
import { PROFESSIONAL_TITLES } from "../../constants/titles";
import SectionCard from "./SectionCard";

const inputClass =
  "border border-[#D5DFEB] bg-[#F8FBFF] rounded-xl min-h-[44px] px-3 text-[#020617] font-body text-sm";

type Props = {
  editing: boolean;
  onToggleEdit: () => void;
  firstName: string;
  onFirstName: (v: string) => void;
  lastName: string;
  onLastName: (v: string) => void;
  username: string;
  onUsername: (v: string) => void;
  bio: string;
  onBio: (v: string) => void;
  title: string | null;
  onTitle: (v: string | null) => void;
};

export default function ProfileDataCard({
  editing,
  onToggleEdit,
  firstName,
  onFirstName,
  lastName,
  onLastName,
  username,
  onUsername,
  bio,
  onBio,
  title,
  onTitle,
}: Props) {
  return (
    <SectionCard
      title="Datos del perfil"
      action={
        <Pressable hitSlop={6} onPress={onToggleEdit}>
          <Text className="text-[#5B9BD5] font-body text-[13px] font-semibold">
            {editing ? "Listo" : "Editar"}
          </Text>
        </Pressable>
      }
    >
      {editing ? (
        <View className="gap-2">
          <Text className="text-[#394F67] font-body text-[13px] font-semibold mb-0.5">
            Título profesional
          </Text>
          <View className="flex-row flex-wrap gap-1.5 mb-1">
            <AppChip label="Sin título" active={!title} onPress={() => onTitle(null)} />
            {PROFESSIONAL_TITLES.map((option) => (
              <AppChip
                key={option}
                label={option}
                active={title === option}
                onPress={() => onTitle(option)}
              />
            ))}
          </View>

          <TextInput
            value={firstName}
            onChangeText={onFirstName}
            placeholder="Nombre"
            placeholderTextColor="#7A8EA8"
            className={inputClass}
          />
          <TextInput
            value={lastName}
            onChangeText={onLastName}
            placeholder="Apellido"
            placeholderTextColor="#7A8EA8"
            className={inputClass}
          />
          <TextInput
            value={username}
            onChangeText={onUsername}
            placeholder="Username"
            placeholderTextColor="#7A8EA8"
            autoCapitalize="none"
            className={inputClass}
          />
          <TextInput
            value={bio}
            onChangeText={onBio}
            multiline
            placeholder="Describe tu enfoque terapéutico"
            placeholderTextColor="#7A8EA8"
            className="border border-[#D5DFEB] bg-[#F8FBFF] rounded-xl min-h-[100px] px-3 py-2.5 text-[#020617] font-body text-sm"
            style={{ textAlignVertical: "top" }}
          />
        </View>
      ) : (
        <View className="gap-2">
          <Text className="text-[#5F7896] font-body text-sm leading-[22px]">
            Nombre: {`${firstName} ${lastName}`.trim() || "Sin definir"}
          </Text>
          <Text className="text-[#5F7896] font-body text-sm leading-[22px]">
            Username: {username ? `@${username}` : "Sin definir"}
          </Text>
          <Text className="text-[#5F7896] font-body text-sm leading-[22px]" numberOfLines={4}>
            {bio ||
              "Agrega una descripción profesional para que los clientes conozcan tu enfoque terapéutico."}
          </Text>
        </View>
      )}
    </SectionCard>
  );
}
