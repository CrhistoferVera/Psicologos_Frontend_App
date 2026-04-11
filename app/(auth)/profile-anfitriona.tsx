import { useRef } from "react";
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable, TextInput } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import TextField from "../../src/components/TextField";
import PrimaryButton from "../../src/components/PrimaryButton";
import IdDocPicker from "../../src/components/auth/IdDocPicker";
import TermsCheckbox from "../../src/components/auth/TermsCheckbox";
import { useAnfitrioneRegister } from "../../src/hooks/useAnfitrioneRegister";

export default function ProfileAnfitriona() {
  const {
    tempToken, checkingToken,
    firstName, setFirstName,
    lastName, setLastName,
    email, setEmail,
    password, setPassword,
    confirm, setConfirm,
    username, setUsername,
    dateOfBirth, setDateOfBirth,
    cedula, setCedula,
    idDoc, handlePickIdDoc, clearIdDoc,
    accepted, setAccepted,
    loading, error,
    handleSubmit,
  } = useAnfitrioneRegister();

  const insets = useSafeAreaInsets();

  const monthRef = useRef<TextInput>(null);
  const dayRef = useRef<TextInput>(null);

  const dobParts = dateOfBirth.split("-");
  const dobYear = dobParts[0] ?? "";
  const dobMonth = dobParts[1] ?? "";
  const dobDay = dobParts[2] ?? "";

  const handleYearChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, "").slice(0, 4);
    setDateOfBirth([digits, dobMonth, dobDay].filter(Boolean).join("-"));
    if (digits.length === 4) monthRef.current?.focus();
  };

  const handleMonthChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, "").slice(0, 2);
    setDateOfBirth([dobYear, digits, dobDay].filter(Boolean).join("-"));
    if (digits.length === 2) dayRef.current?.focus();
  };

  const handleDayChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, "").slice(0, 2);
    setDateOfBirth([dobYear, dobMonth, digits].filter(Boolean).join("-"));
  };

  if (!checkingToken && !tempToken) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000", paddingHorizontal: 24, paddingTop: 40 }}>
        <Text className="text-white text-2xl font-semibold mt-8">
          Token temporal no encontrado
        </Text>
        <Text className="text-white/70 text-base mt-4">
          Vuelve a iniciar sesión para solicitar un nuevo código.
        </Text>
        <PrimaryButton
          title="Volver"
          onPress={() => router.replace("/(auth)/register-anfitriona")}
          className="mt-6"
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: "#000" }}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 40, paddingBottom: insets.bottom + 24 }}
      >
        <Text className="text-white text-3xl font-semibold mt-8">Tu perfil</Text>
        <Text className="text-white/70 text-lg mt-2 mb-6">
          Completa tu información para registrarte como anfitriona.
        </Text>

        <TextField label="Nombre" placeholder="Camila" value={firstName} onChangeText={setFirstName} autoCapitalize="words" textContentType="givenName" />
        <TextField label="Apellido" placeholder="Sanches" value={lastName} onChangeText={setLastName} autoCapitalize="words" textContentType="familyName" />
        <TextField label="Nombre de usuario" placeholder="camila_princ" value={username} onChangeText={setUsername} />
        <TextField label="Cédula" placeholder="12345678" value={cedula} onChangeText={setCedula} keyboardType="numeric" maxLength={15} />

        {/* Fecha de nacimiento: 3 campos con auto-foco */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginBottom: 6 }}>
            Fecha de nacimiento
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ flex: 2 }}>
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 4, textAlign: "center" }}>
                Año
              </Text>
              <TextInput
                value={dobYear}
                onChangeText={handleYearChange}
                placeholder="AAAA"
                placeholderTextColor="rgba(255,255,255,0.25)"
                keyboardType="number-pad"
                maxLength={4}
                style={{
                  backgroundColor: "#1a1a1a",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.15)",
                  borderRadius: 10,
                  color: "#fff",
                  fontSize: 16,
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  textAlign: "center",
                }}
              />
            </View>

            <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 20, marginTop: 18 }}>-</Text>

            <View style={{ flex: 1 }}>
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 4, textAlign: "center" }}>
                Mes
              </Text>
              <TextInput
                ref={monthRef}
                value={dobMonth}
                onChangeText={handleMonthChange}
                placeholder="MM"
                placeholderTextColor="rgba(255,255,255,0.25)"
                keyboardType="number-pad"
                maxLength={2}
                style={{
                  backgroundColor: "#1a1a1a",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.15)",
                  borderRadius: 10,
                  color: "#fff",
                  fontSize: 16,
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  textAlign: "center",
                }}
              />
            </View>

            <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 20, marginTop: 18 }}>-</Text>

            <View style={{ flex: 1 }}>
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 4, textAlign: "center" }}>
                Día
              </Text>
              <TextInput
                ref={dayRef}
                value={dobDay}
                onChangeText={handleDayChange}
                placeholder="DD"
                placeholderTextColor="rgba(255,255,255,0.25)"
                keyboardType="number-pad"
                maxLength={2}
                style={{
                  backgroundColor: "#1a1a1a",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.15)",
                  borderRadius: 10,
                  color: "#fff",
                  fontSize: 16,
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  textAlign: "center",
                }}
              />
            </View>
          </View>
        </View>

        <TextField label="Email" placeholder="camila@gmail.com" value={email} onChangeText={setEmail} keyboardType="email-address" textContentType="emailAddress" />
        <TextField label="Contraseña" placeholder="********" value={password} onChangeText={setPassword} secureTextEntry textContentType="newPassword" />
        <TextField label="Confirmar contraseña" placeholder="********" value={confirm} onChangeText={setConfirm} secureTextEntry textContentType="newPassword" />

        <IdDocPicker idDoc={idDoc} onPick={handlePickIdDoc} onClear={clearIdDoc} />

        {error ? <Text className="text-red-400 text-sm mb-2">{error}</Text> : null}

        <TermsCheckbox accepted={accepted} onToggle={() => setAccepted((p) => !p)} />

        <PrimaryButton
          title={loading ? "Creando..." : "Crear cuenta"}
          onPress={handleSubmit}
          disabled={!accepted || loading}
          className="mt-2"
        />

        <Pressable onPress={() => router.replace("/(auth)/register-anfitriona")} className="mt-4">
          <Text className="text-white/60 text-center underline">Volver al inicio</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
