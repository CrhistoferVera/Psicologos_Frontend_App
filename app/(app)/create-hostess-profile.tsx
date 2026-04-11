import React, { useEffect, useState } from "react";
import { Alert, Modal, Text, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import Screen from "@/src/components/Screen";
import { useAuth } from "../../src/context/AuthContext";
import { createAnfitriona } from "../../src/services/anfitrionas";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { HostessForm, IdentityFile } from "../../src/types/hostess";
import { validateHostessForm } from "../../src/utils/hostessValidation";
import HostessFormComponent from "../../src/components/HostessForm";
import { router } from "expo-router";

export default function CreateHostessProfile() {
  const { accessToken } = useAuth();
  const [form, setForm] = useState<HostessForm>({
    firstName: "",
    lastName: "",
    phone: "",
    dateOfBirth: "",
    identityNumber: "",
    email: "",
    password: "",
    username: "",
  });
  const [idDocFile, setIdDocFile] = useState<IdentityFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (!showSuccessModal) return;

    const timeout = setTimeout(() => {
      setShowSuccessModal(false);
      router.replace("/admin");
    }, 1500);

    return () => clearTimeout(timeout);
  }, [showSuccessModal]);

  const handleChange = (key: keyof HostessForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handlePickIdDoc = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/*", "application/pdf"],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled) return;

    const asset = result.assets?.[0];
    if (!asset?.uri) return;

    setIdDocFile({
      uri: asset.uri,
      name: asset.name ?? "id_doc",
      type: asset.mimeType ?? "application/octet-stream",
    });
  };

  const handleSubmit = async () => {
    const validation = validateHostessForm(form);

    if (!validation.ok) {
      Alert.alert("Formulario incompleto", validation.message);
      return;
    }

    if (!accessToken) {
      setError("No hay sesion admin activa.");
      setSuccess("");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await createAnfitriona(
        {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phoneNumber: form.phone.trim(),
          dateOfBirth: form.dateOfBirth.trim(),
          cedula: form.identityNumber.trim(),
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password.trim(),
          idDoc: idDocFile ?? undefined,
        },
        accessToken,
      );
      setSuccess("Anfitriona creada correctamente.");
      setShowSuccessModal(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo crear la anfitriona.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAwareScrollView
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={24}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <HostessFormComponent
          form={form}
          onChange={handleChange}
          onPickIdDoc={handlePickIdDoc}
          idDocFile={idDocFile}
          error={error}
          success={success}
          loading={loading}
          onSubmit={handleSubmit}
        />
      </KeyboardAwareScrollView>

      <Modal transparent visible={showSuccessModal} animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/60">
          <View className="bg-white rounded-2xl px-6 py-4">
            <Text className="text-black text-base font-semibold text-center">
              Anfitriona creada correctamente
            </Text>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
