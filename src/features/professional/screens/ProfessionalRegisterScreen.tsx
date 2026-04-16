import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import AppButton from "../../../components/ui/AppButton";
import AppChip from "../../../components/ui/AppChip";
import AppInput from "../../../components/ui/AppInput";
import AppScreen from "../../../components/ui/AppScreen";
import { useAuth } from "../../../context/AuthContext";
import { appTheme } from "../../../theme/appTheme";
import ProfessionalStepHeader from "../components/ProfessionalStepHeader";
import {
  completeProfessionalRegistration,
  getProfessionalSpecialtiesCatalog,
  sendProfessionalVerificationOtp,
  upsertProfessionalPrices,
  verifyProfessionalOtp,
} from "../api/professionalApi";

const totalSteps = 5;

export default function ProfessionalRegisterScreen() {
  const router = useRouter();
  const { setSession } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [tempToken, setTempToken] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [cedula, setCedula] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [bio, setBio] = useState("");

  const [specialtiesCatalog, setSpecialtiesCatalog] = useState<string[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [chatPrice, setChatPrice] = useState("20");
  const [callPrice, setCallPrice] = useState("35");
  const [videoPrice, setVideoPrice] = useState("50");

  const [idDoc, setIdDoc] = useState<{ uri: string; name: string; type: string } | null>(null);

  useEffect(() => {
    if (step !== 3 || specialtiesCatalog.length > 0) return;
    void (async () => {
      try {
        setCatalogLoading(true);
        const data = await getProfessionalSpecialtiesCatalog();
        setSpecialtiesCatalog(data.slice(0, 24));
      } catch {
        setSpecialtiesCatalog(["Ansiedad", "Depresion", "Terapia de pareja", "Autoestima"]);
      } finally {
        setCatalogLoading(false);
      }
    })();
  }, [step, specialtiesCatalog.length]);

  const currentStepTitle = useMemo(() => {
    if (step === 1) return "Datos personales y verificacion";
    if (step === 2) return "Cuenta profesional";
    if (step === 3) return "Especialidades y tarifas";
    if (step === 4) return "Documentos";
    return "Revisar y enviar";
  }, [step]);

  function toggleSpecialty(tag: string) {
    setSelectedSpecialties((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
    );
  }

  function validateStep(nextStep = step): string | null {
    if (nextStep === 1) {
      if (!firstName.trim()) return "Completa tu nombre.";
      if (!lastName.trim()) return "Completa tu apellido.";
      if (!phone.trim() || phone.trim().length < 8) return "Ingresa un telefono valido.";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth.trim())) return "Usa fecha de nacimiento YYYY-MM-DD.";
      if (!tempToken) return "Verifica tu telefono con OTP para continuar.";
    }
    if (nextStep === 2) {
      if (!email.trim()) return "Ingresa un email.";
      if (!username.trim()) return "Ingresa un username profesional.";
      if (!cedula.trim()) return "Ingresa tu documento/carnet.";
      if (password.length < 6) return "La contrasena debe tener al menos 6 caracteres.";
      if (password !== confirmPassword) return "Las contrasenas no coinciden.";
    }
    if (nextStep === 3) {
      if (selectedSpecialties.length === 0) return "Selecciona al menos una especialidad.";
      if (Number(chatPrice || 0) < 0 || Number(callPrice || 0) < 0 || Number(videoPrice || 0) < 0) {
        return "Las tarifas deben ser numeros validos.";
      }
    }
    return null;
  }

  async function handleSendOtp() {
    try {
      setLoading(true);
      setError(null);
      await sendProfessionalVerificationOtp(phone.trim());
      setOtpSent(true);
      Alert.alert("Codigo enviado", "Te enviamos un codigo OTP por WhatsApp.");
    } catch (err: any) {
      setError(err?.message ?? "No pudimos enviar el codigo OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    try {
      setLoading(true);
      setError(null);
      const token = await verifyProfessionalOtp(phone.trim(), otpCode.trim());
      setTempToken(token);
      Alert.alert("Telefono verificado", "Ya puedes continuar con el registro profesional.");
    } catch (err: any) {
      setError(err?.message ?? "No pudimos verificar el codigo.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePickIdDoc() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;
      setIdDoc({
        uri: asset.uri,
        name: asset.name ?? "id-doc",
        type: asset.mimeType ?? "application/octet-stream",
      });
    } catch {
      setError("No se pudo seleccionar el documento.");
    }
  }

  function handleContinue() {
    const validationError = validateStep(step);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStep((prev) => Math.min(totalSteps, prev + 1));
  }

  function handleBack() {
    setError(null);
    setStep((prev) => Math.max(1, prev - 1));
  }

  async function handleSubmit() {
    const validationError = validateStep(3);
    if (validationError) {
      setError(validationError);
      setStep(3);
      return;
    }

    if (!tempToken) {
      setError("No hay token de verificacion. Repite la verificacion OTP.");
      setStep(1);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const registration = await completeProfessionalRegistration({
        tempToken,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
        confirmPassword,
        username: username.trim(),
        dateOfBirth: dateOfBirth.trim(),
        cedula: cedula.trim(),
        idDoc: idDoc ?? undefined,
      });

      await setSession(registration.access_token, registration.user);

      try {
        await upsertProfessionalPrices({
          chat: Number(chatPrice || 0),
          call: Number(callPrice || 0),
          video: Number(videoPrice || 0),
        });
      } catch {
        // Registration should continue even if price sync fails.
      }

      // TODO(backend): add self-service endpoint to persist professional specialties.
      router.replace({
        pathname: "/(public)/professional-review-status",
        params: {
          name: `${firstName.trim()} ${lastName.trim()}`,
          specialties: selectedSpecialties.join(", "),
        },
      } as any);
    } catch (err: any) {
      const raw = err?.response?.data?.message ?? err?.message;
      const message = Array.isArray(raw) ? raw.join(", ") : raw || "No se pudo completar el registro profesional.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppScreen scroll>
      <View style={styles.container}>
        <ProfessionalStepHeader currentStep={step} totalSteps={totalSteps} title={currentStepTitle} />

        {step === 1 ? (
          <View style={styles.form}>
            <AppInput label="Nombre" value={firstName} onChangeText={setFirstName} placeholder="Camila" />
            <AppInput label="Apellido" value={lastName} onChangeText={setLastName} placeholder="Rojas" />
            <AppInput
              label="Telefono"
              value={phone}
              onChangeText={setPhone}
              placeholder="+59170000000"
              keyboardType="phone-pad"
            />
            <AppInput
              label="Fecha de nacimiento"
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              placeholder="1994-08-18"
            />

            <View style={styles.otpRow}>
              <AppButton
                title={otpSent ? "Reenviar OTP" : "Enviar OTP"}
                onPress={handleSendOtp}
                loading={loading}
                variant="secondary"
                style={styles.otpAction}
              />
              <Text style={styles.badge}>{tempToken ? "Verificado" : "Pendiente"}</Text>
            </View>

            {otpSent ? (
              <View style={styles.otpBox}>
                <AppInput
                  label="Codigo OTP"
                  value={otpCode}
                  onChangeText={setOtpCode}
                  placeholder="123456"
                  keyboardType="number-pad"
                />
                <AppButton
                  title="Verificar codigo"
                  onPress={handleVerifyOtp}
                  disabled={otpCode.trim().length < 4 || loading}
                  loading={loading}
                />
              </View>
            ) : null}
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.form}>
            <AppInput label="Email" value={email} onChangeText={setEmail} placeholder="profesional@email.com" keyboardType="email-address" />
            <AppInput label="Username profesional" value={username} onChangeText={setUsername} placeholder="camila.psicologa" />
            <AppInput label="Documento/Cedula" value={cedula} onChangeText={setCedula} placeholder="12345678" />
            <AppInput label="Contrasena" value={password} onChangeText={setPassword} secureTextEntry />
            <AppInput label="Confirmar contrasena" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
            <AppInput
              label="Bio profesional"
              value={bio}
              onChangeText={setBio}
              placeholder="Psicologa clinica con enfoque cognitivo-conductual"
            />
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Especialidades</Text>
            <Text style={styles.sectionHint}>Selecciona tus principales areas de atencion.</Text>
            {catalogLoading ? <Text style={styles.hint}>Cargando especialidades...</Text> : null}
            <View style={styles.tagsWrap}>
              {specialtiesCatalog.map((tag) => (
                <AppChip key={tag} label={tag} active={selectedSpecialties.includes(tag)} onPress={() => toggleSpecialty(tag)} />
              ))}
            </View>

            <Text style={styles.sectionTitle}>Tarifas base (creditos)</Text>
            <View style={styles.priceRow}>
              <AppInput label="Chat" value={chatPrice} onChangeText={setChatPrice} keyboardType="number-pad" />
              <AppInput label="Llamada" value={callPrice} onChangeText={setCallPrice} keyboardType="number-pad" />
              <AppInput label="Video" value={videoPrice} onChangeText={setVideoPrice} keyboardType="number-pad" />
            </View>
          </View>
        ) : null}

        {step === 4 ? (
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Documento de identidad</Text>
            <Text style={styles.sectionHint}>Sube una imagen o PDF de tu documento para validacion.</Text>
            <Pressable style={styles.uploadCard} onPress={handlePickIdDoc}>
              <Text style={styles.uploadTitle}>{idDoc ? "Documento seleccionado" : "Seleccionar archivo"}</Text>
              <Text style={styles.uploadMeta}>{idDoc?.name ?? "Formato permitido: imagen o PDF"}</Text>
            </Pressable>
            <Text style={styles.hint}>Puedes continuar sin archivo y completarlo despues en perfil.</Text>
          </View>
        ) : null}

        {step === 5 ? (
          <View style={styles.form}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Resumen del envio</Text>
              <Text style={styles.summaryText}>Profesional: {firstName} {lastName}</Text>
              <Text style={styles.summaryText}>Username: {username}</Text>
              <Text style={styles.summaryText}>Especialidades: {selectedSpecialties.join(", ") || "Sin seleccionar"}</Text>
              <Text style={styles.summaryText}>Tarifas: Chat {chatPrice} / Llamada {callPrice} / Video {videoPrice}</Text>
              <Text style={styles.summaryText}>Documento: {idDoc ? "Adjunto" : "Pendiente"}</Text>
            </View>
            <Text style={styles.hint}>Al enviar, tu perfil quedara en revision y podras usar el panel profesional.</Text>
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.actions}>
          <AppButton title="Volver" variant="secondary" onPress={handleBack} disabled={step === 1 || loading} style={styles.actionBtn} />
          {step < totalSteps ? (
            <AppButton title="Continuar" onPress={handleContinue} disabled={loading} style={styles.actionBtn} />
          ) : (
            <AppButton title="Enviar registro" onPress={handleSubmit} loading={loading} style={styles.actionBtn} />
          )}
        </View>

        <Pressable onPress={() => router.replace("/(public)/auth")}>
          <Text style={styles.loginLink}>Ya tengo una cuenta, iniciar sesion</Text>
        </Pressable>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  form: {
    gap: 12,
  },
  otpRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  otpAction: {
    flex: 1,
  },
  badge: {
    backgroundColor: "rgba(107, 175, 138, 0.16)",
    color: appTheme.colors.success,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "700",
  },
  otpBox: {
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    padding: 12,
    gap: 10,
  },
  sectionTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 18,
    fontWeight: "700",
  },
  sectionHint: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  priceRow: {
    gap: 8,
  },
  uploadCard: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.lg,
    backgroundColor: appTheme.colors.surface,
    padding: 14,
    gap: 4,
  },
  uploadTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    fontSize: 15,
  },
  uploadMeta: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
  summaryCard: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.lg,
    backgroundColor: appTheme.colors.surface,
    padding: 14,
    gap: 8,
  },
  summaryTitle: {
    color: appTheme.colors.success,
    fontFamily: appTheme.fonts.heading,
    fontSize: 17,
    fontWeight: "700",
  },
  summaryText: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
  },
  hint: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    lineHeight: 18,
  },
  error: {
    color: appTheme.colors.danger,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
  },
  loginLink: {
    textAlign: "center",
    color: appTheme.colors.success,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 6,
  },
});
