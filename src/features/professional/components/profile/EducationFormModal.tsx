import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Image, Modal, Pressable, Text, TextInput, View } from "react-native";

const inputClass =
  "border border-[#D5DFEB] bg-[#F8FBFF] rounded-xl min-h-[44px] px-3 text-[#020617] font-body text-sm";

type Props = {
  visible: boolean;
  isEditing: boolean;
  degree: string;
  onDegree: (v: string) => void;
  institution: string;
  onInstitution: (v: string) => void;
  year: string;
  onYear: (v: string) => void;
  description: string;
  onDescription: (v: string) => void;
  photoUri: string | null;
  uploading: boolean;
  onPickPhoto: () => void;
  onCancel: () => void;
  onSave: () => void;
};

export default function EducationFormModal({
  visible,
  isEditing,
  degree,
  onDegree,
  institution,
  onInstitution,
  year,
  onYear,
  description,
  onDescription,
  photoUri,
  uploading,
  onPickPhoto,
  onCancel,
  onSave,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 bg-black/55 items-center justify-center p-5">
        <View className="w-full bg-white rounded-[20px] p-5 gap-2.5">
          <Text className="text-[#172B46] font-heading text-[17px] font-bold mb-1">
            {isEditing ? "Editar formación" : "Agregar formación"}
          </Text>

          <TextInput
            value={degree}
            onChangeText={onDegree}
            placeholder="Grado o título (ej. Licenciatura en Psicología)"
            placeholderTextColor="#7A8EA8"
            className={inputClass}
          />
          <TextInput
            value={institution}
            onChangeText={onInstitution}
            placeholder="Institución (ej. Universidad Mayor de San Andrés)"
            placeholderTextColor="#7A8EA8"
            className={inputClass}
          />
          <TextInput
            value={year}
            onChangeText={onYear}
            placeholder="Año (ej. 2018)"
            placeholderTextColor="#7A8EA8"
            keyboardType="numeric"
            maxLength={4}
            className={inputClass}
          />
          <TextInput
            value={description}
            onChangeText={onDescription}
            placeholder="Descripción breve (opcional)"
            placeholderTextColor="#7A8EA8"
            multiline
            className="border border-[#D5DFEB] bg-[#F8FBFF] rounded-xl min-h-[100px] px-3 py-2.5 text-[#020617] font-body text-sm"
            style={{ textAlignVertical: "top" }}
          />

          <Pressable
            className="rounded-xl border border-dashed border-[#D5DFEB] overflow-hidden min-h-[80px]"
            onPress={onPickPhoto}
            disabled={uploading}
          >
            {photoUri ? (
              <Image source={{ uri: photoUri }} className="w-full h-[120px]" resizeMode="cover" />
            ) : (
              <View className="flex-1 flex-row items-center justify-center gap-2 p-4">
                <Ionicons name="image-outline" size={22} color="#4F7BAE" />
                <Text className="text-[#4F7BAE] font-body text-[13px] font-semibold">
                  Agregar foto (título, diploma...)
                </Text>
              </View>
            )}
            {uploading ? (
              <View className="absolute inset-0 bg-black/45 items-center justify-center">
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            ) : null}
          </Pressable>

          <View className="flex-row gap-2.5 mt-1">
            <Pressable
              className="flex-1 h-11 rounded-xl border border-[#D5DFEB] items-center justify-center active:bg-[#F1F5F9]"
              onPress={onCancel}
            >
              <Text className="text-[#5F7896] font-body text-sm font-semibold">Cancelar</Text>
            </Pressable>
            <Pressable
              className="flex-1 h-11 rounded-xl bg-[#5B9BD5] items-center justify-center active:opacity-90"
              onPress={onSave}
            >
              <Text className="text-white font-body text-sm font-bold">Guardar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
