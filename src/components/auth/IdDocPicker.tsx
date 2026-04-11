import { View, Text, Pressable, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { IdDoc } from "../../hooks/useAnfitrioneRegister";

type Props = {
  idDoc: IdDoc | null;
  onPick: () => void;
  onClear: () => void;
};

export default function IdDocPicker({ idDoc, onPick, onClear }: Props) {
  return (
    <View className="mb-4">
      <Text className="text-white text-xl font-bold mb-2">Documento de identidad</Text>
      <Pressable
        onPress={onPick}
        className="h-14 rounded-xl border border-white/20 bg-white/5 flex-row items-center px-4"
      >
        <Ionicons name="document-outline" size={20} color="rgba(255,255,255,0.6)" />
        <Text className="text-white/60 ml-3 flex-1" numberOfLines={1}>
          {idDoc ? idDoc.name : "Seleccionar imagen del DNI"}
        </Text>
        {idDoc && (
          <Pressable onPress={onClear} hitSlop={8}>
            <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.4)" />
          </Pressable>
        )}
      </Pressable>

      {idDoc && (
        <Image
          source={{ uri: idDoc.uri }}
          style={{ width: "100%", height: 160, borderRadius: 12, marginTop: 10 }}
          resizeMode="cover"
        />
      )}
    </View>
  );
}
