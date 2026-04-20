import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as VideoThumbnails from "expo-video-thumbnails";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
  updateMyProfessionalSpecialties,
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

  const [specialtiesCatalog, setSpecialtiesCatalog] = useState<{ id: string; name: string }[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [chatPrice, setChatPrice] = useState("20");
  const [callPrice, setCallPrice] = useState("35");
  const [videoPrice, setVideoPrice] = useState("50");

  type FileAsset = { uri: string; name: string; type: string };

  const [idDoc, setIdDoc] = useState<FileAsset | null>(null);
  const [kycVideo, setKycVideo] = useState<FileAsset | null>(null);
  const [kycSelfie, setKycSelfie] = useState<FileAsset | null>(null);
  const [matricula, setMatricula] = useState<FileAsset | null>(null);
  const [tituloProfesional, setTituloProfesional] = useState<FileAsset | null>(null);

  useEffect(() => {
    if (step !== 3 || specialtiesCatalog.length > 0) return;
    void (async () => {
      try {
        setCatalogLoading(true);
        const data = await getProfessionalSpecialtiesCatalog();
        setSpecialtiesCatalog(data.slice(0, 48).map((item) => ({ id: item.id, name: item.name })));
      } catch {
        setSpecialtiesCatalog([
          { id: "fallback-anxiety", name: "Ansiedad" },
          { id: "fallback-depression", name: "Depresión" },
          { id: "fallback-couple", name: "Terapia de pareja" },
          { id: "fallback-self", name: "Autoestima" },
        ]);
      } finally {
        setCatalogLoading(false);
      }
    })();
  }, [step, specialtiesCatalog.length]);

  const currentStepTitle = useMemo(() => {
    if (step === 1) return "Datos personales y verificación";
    if (step === 2) return "Cuenta profesional";
    if (step === 3) return "Especialidades y tarifas";
    if (step === 4) return "Verificación de identidad (KYC)";
    return "Revisar y enviar";
  }, [step]);

  const selectedSpecialtyNames = useMemo(
    () => selectedSpecialties
      .map((id) => specialtiesCatalog.find((item) => item.id === id)?.name)
      .filter(Boolean) as string[],
    [selectedSpecialties, specialtiesCatalog],
  );

  function toggleSpecialty(id: string) {
    setSelectedSpecialties((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  function validateStep(nextStep = step): string | null {
    if (nextStep === 1) {
      if (!firstName.trim()) return "Completa tu nombre.";
      if (!lastName.trim()) return "Completa tu apellido.";
      if (!phone.trim() || phone.trim().length < 8) return "Ingresa un teléfono válido.";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth.trim())) return "Usa fecha de nacimiento YYYY-MM-DD.";
      if (!tempToken) return "Verifica tu teléfono con OTP para continuar.";
    }
    if (nextStep === 2) {
      if (!email.trim()) return "Ingresa un email.";
      if (!username.trim()) return "Ingresa un username profesional.";
      if (!cedula.trim()) return "Ingresa tu documento/carnet.";
      if (password.length < 6) return "La contraseña debe tener al menos 6 caracteres.";
      if (password !== confirmPassword) return "Las contraseñas no coinciden.";
    }
    if (nextStep === 3) {
      if (selectedSpecialties.length === 0) return "Selecciona al menos una especialidad.";
      if (Number(chatPrice || 0) < 0 || Number(callPrice || 0) < 0 || Number(videoPrice || 0) < 0) {
        return "Las tarifas deben ser números válidos.";
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
      Alert.alert("Código enviado", "Te enviamos un código OTP por WhatsApp.");
    } catch (err: any) {
      setError(err?.message ?? "No pudimos enviar el código OTP.");
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
      Alert.alert("Teléfono verificado", "Ya puedes continuar con el registro profesional.");
    } catch (err: any) {
      setError(err?.message ?? "No pudimos verificar el código.");
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
      setIdDoc({ uri: asset.uri, name: asset.name ?? "id-doc", type: asset.mimeType ?? "application/octet-stream" });
    } catch {
      setError("No se pudo seleccionar el documento.");
    }
  }

  async function handleRecordFaceVideo() {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permiso requerido", "Necesitamos acceso a tu cámara para grabar el video.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: "videos",
        videoMaxDuration: 10,
        quality: 0.7,
        allowsEditing: false,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri) return;

      setKycVideo({ uri: asset.uri, name: "kyc_video.mp4", type: "video/mp4" });

      // Extract a thumbnail frame for automated face comparison
      try {
        const thumb = await VideoThumbnails.getThumbnailAsync(asset.uri, { time: 500 });
        setKycSelfie({ uri: thumb.uri, name: "kyc_selfie.jpg", type: "image/jpeg" });
      } catch {
        // Thumbnail extraction failed — face comparison will be SKIPPED on backend
      }

      Alert.alert("Video grabado", "Video de rostro registrado correctamente.");
    } catch {
      setError("No se pudo grabar el video.");
    }
  }

  async function handlePickMatricula() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;
      setMatricula({ uri: asset.uri, name: asset.name ?? "matricula", type: asset.mimeType ?? "application/octet-stream" });
    } catch {
      setError("No se pudo seleccionar la matrícula.");
    }
  }

  async function handlePickTitulo() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;
      setTituloProfesional({ uri: asset.uri, name: asset.name ?? "titulo", type: asset.mimeType ?? "application/octet-stream" });
    } catch {
      setError("No se pudo seleccionar el título.");
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
      setError("No hay token de verificación. Repite la verificación OTP.");
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
        kycVideo: kycVideo ?? undefined,
        kycSelfie: kycSelfie ?? undefined,
        matricula: matricula ?? undefined,
        tituloProfesional: tituloProfesional ?? undefined,
      });

      await setSession(registration.access_token, registration.user);

      try {
        await Promise.all([
          upsertProfessionalPrices({
            chat: Number(chatPrice || 0),
            call: Number(callPrice || 0),
            video: Number(videoPrice || 0),
          }),
          updateMyProfessionalSpecialties(selectedSpecialties),
        ]);
      } catch {
        // Si falla esta sincronización, el registro base se mantiene y se podrá completar desde perfil.
      }

      router.replace("/(public)/professional-review-status");
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
              label="Teléfono"
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
                  label="Código OTP"
                  value={otpCode}
                  onChangeText={setOtpCode}
                  placeholder="123456"
                  keyboardType="number-pad"
                />
                <AppButton
                  title="Verificar código"
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
            <AppInput label="Documento/Cédula" value={cedula} onChangeText={setCedula} placeholder="12345678" />
            <AppInput label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry />
            <AppInput label="Confirmar contraseña" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
            <AppInput
              label="Bio profesional"
              value={bio}
              onChangeText={setBio}
              placeholder="Psicóloga clínica con enfoque cognitivo-conductual"
            />
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Especialidades</Text>
            <Text style={styles.sectionHint}>Selecciona tus principales áreas de atención.</Text>
            {catalogLoading ? <Text style={styles.hint}>Cargando especialidades...</Text> : null}
            <View style={styles.tagsWrap}>
              {specialtiesCatalog.map((tag) => (
                <AppChip key={tag.id} label={tag.name} active={selectedSpecialties.includes(tag.id)} onPress={() => toggleSpecialty(tag.id)} />
              ))}
            </View>

            <Text style={styles.sectionTitle}>Tarifas (créditos)</Text>
            <View style={styles.priceRow}>
              {([
                { label: "Chat", value: chatPrice, icon: "chatbubble-ellipses-outline" },
                { label: "Llamada", value: callPrice, icon: "call-outline" },
                { label: "Video", value: videoPrice, icon: "videocam-outline" },
              ] as const).map((item) => (
                <Pressable
                  key={item.label}
                  style={styles.priceCard}
                  onPress={() => Alert.alert("Campo bloqueado", "Este campo no es editable.")}
                >
                  <Ionicons name={item.icon} size={22} color={appTheme.colors.primary} />
                  <Text style={styles.priceAmount}>{item.value}</Text>
                  <Text style={styles.priceLabel}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {step === 4 ? (
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Verificación de identidad</Text>
            <Text style={styles.sectionHint}>
              Sube tus documentos para que el equipo pueda verificar tu identidad profesional.
            </Text>

            {/* Face video */}
            <Text style={styles.docLabel}>Video de rostro *</Text>
            <Text style={styles.sectionHint}>
              Graba un video corto (máx. 10 seg) mirando de frente a la cámara. Se cotejarán automáticamente con tu documento.
            </Text>
            <Pressable style={[styles.uploadCard, kycVideo && styles.uploadCardDone]} onPress={() => void handleRecordFaceVideo()}>
              <Text style={styles.uploadTitle}>{kycVideo ? "Video grabado" : "Grabar video de rostro"}</Text>
              <Text style={styles.uploadMeta}>{kycVideo ? kycVideo.name : "Toca para abrir la cámara"}</Text>
            </Pressable>

            {/* ID document */}
            <Text style={styles.docLabel}>Documento de identidad *</Text>
            <Text style={styles.sectionHint}>Licencia de conducir o pasaporte (imagen o PDF).</Text>
            <Pressable style={[styles.uploadCard, idDoc && styles.uploadCardDone]} onPress={() => void handlePickIdDoc()}>
              <Text style={styles.uploadTitle}>{idDoc ? "Documento seleccionado" : "Seleccionar archivo"}</Text>
              <Text style={styles.uploadMeta}>{idDoc?.name ?? "Imagen o PDF"}</Text>
            </Pressable>

            {/* Matrícula profesional */}
            <Text style={styles.docLabel}>Matrícula profesional vigente *</Text>
            <Text style={styles.sectionHint}>Registro que acredita tu habilitación profesional.</Text>
            <Pressable style={[styles.uploadCard, matricula && styles.uploadCardDone]} onPress={() => void handlePickMatricula()}>
              <Text style={styles.uploadTitle}>{matricula ? "Matrícula seleccionada" : "Seleccionar archivo"}</Text>
              <Text style={styles.uploadMeta}>{matricula?.name ?? "Imagen o PDF"}</Text>
            </Pressable>

            {/* Título profesional */}
            <Text style={styles.docLabel}>Título profesional (opcional)</Text>
            <Text style={styles.sectionHint}>Si aplica, sube tu título o diploma universitario.</Text>
            <Pressable style={[styles.uploadCard, tituloProfesional && styles.uploadCardDone]} onPress={() => void handlePickTitulo()}>
              <Text style={styles.uploadTitle}>{tituloProfesional ? "Título seleccionado" : "Seleccionar archivo (opcional)"}</Text>
              <Text style={styles.uploadMeta}>{tituloProfesional?.name ?? "Imagen o PDF"}</Text>
            </Pressable>

            <Text style={styles.hint}>Los documentos marcados con * son obligatorios para la aprobación.</Text>
          </View>
        ) : null}

        {step === 5 ? (
          <View style={styles.form}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Resumen del envío</Text>
              <Text style={styles.summaryText}>Profesional: {firstName} {lastName}</Text>
              <Text style={styles.summaryText}>Username: {username}</Text>
              <Text style={styles.summaryText}>Especialidades: {selectedSpecialtyNames.join(", ") || "Sin seleccionar"}</Text>
              <Text style={styles.summaryText}>Tarifas: Chat {chatPrice} / Llamada {callPrice} / Video {videoPrice}</Text>
              <Text style={styles.summaryText}>Video de rostro: {kycVideo ? "Grabado" : "Pendiente"}</Text>
              <Text style={styles.summaryText}>Documento de identidad: {idDoc ? "Adjunto" : "Pendiente"}</Text>
              <Text style={styles.summaryText}>Matrícula profesional: {matricula ? "Adjunta" : "Pendiente"}</Text>
              <Text style={styles.summaryText}>Título profesional: {tituloProfesional ? "Adjunto" : "No adjuntado"}</Text>
            </View>
            <Text style={styles.hint}>Al enviar, tu perfil quedará en revisión KYC. El equipo cotejará el video con tu documento antes de aprobar tu cuenta.</Text>
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
          <Text style={styles.loginLink}>Ya tengo una cuenta, iniciar sesión</Text>
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
    flexDirection: "row",
    gap: 8,
  },
  priceCard: {
    flex: 1,
    backgroundColor: appTheme.colors.surface,
    borderRadius: appTheme.radius.lg,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    paddingVertical: 14,
    alignItems: "center",
    gap: 4,
  },
  priceAmount: {
    color: "#000000",
    fontFamily: appTheme.fonts.heading,
    fontSize: 20,
    fontWeight: "800",
  },
  priceLabel: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
  },
  uploadCard: {
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    borderRadius: appTheme.radius.lg,
    backgroundColor: appTheme.colors.surface,
    padding: 14,
    gap: 4,
  },
  uploadCardDone: {
    borderColor: appTheme.colors.success,
    backgroundColor: "rgba(107, 175, 138, 0.08)",
  },
  docLabel: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
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
