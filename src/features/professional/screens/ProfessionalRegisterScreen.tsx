import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as VideoThumbnails from "expo-video-thumbnails";
import { GoogleSignin, isErrorWithCode, statusCodes } from "@react-native-google-signin/google-signin";
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from "../../../config";
import AppButton from "../../../components/ui/AppButton";
import AppChip from "../../../components/ui/AppChip";
import GoogleButton from "../../../components/ui/GoogleButton";
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
  verifyProfessionalGoogle,
  verifyProfessionalOtp,
} from "../api/professionalApi";

GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID || undefined,
  iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
});

const totalSteps = 5;

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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ProfessionalRegisterScreen() {
  const router = useRouter();
  const { setSession } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [professionalCountry, setProfessionalCountry] = useState("BO");
  const [showProfessionalCountryPicker, setShowProfessionalCountryPicker] = useState(false);
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
  const [referralCode, setReferralCode] = useState("");

  const [specialtiesCatalog, setSpecialtiesCatalog] = useState<{ id: string; name: string }[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

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
    if (step === 3) return "Especialidades";
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

  function validateStep(currentStep = step): string | null {
    if (currentStep === 1) {
      if (!firstName.trim()) return "Completa tu nombre.";
      if (!lastName.trim()) return "Completa tu apellido.";
      if (!email.trim()) return "Ingresa tu email.";
      if (!EMAIL_REGEX.test(email.trim())) return "El email no tiene un formato válido.";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth.trim())) return "Usa formato YYYY-MM-DD para la fecha de nacimiento.";
      if (!tempToken) return "Verifica tu correo con el código OTP para continuar.";
    }
    if (currentStep === 2) {
      if (!username.trim()) return "Ingresa un username profesional.";
      if (!cedula.trim()) return "Ingresa tu documento / carnet de identidad.";
      if (password.length < 6) return "La contraseña debe tener al menos 6 caracteres.";
      if (password !== confirmPassword) return "Las contraseñas no coinciden.";
    }
    if (currentStep === 3) {
      if (selectedSpecialties.length === 0) return "Selecciona al menos una especialidad.";
    }
    return null;
  }

  async function handleSendOtp() {
    if (!email.trim() || !EMAIL_REGEX.test(email.trim())) {
      setError("Ingresa un email válido antes de enviar el OTP.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await sendProfessionalVerificationOtp(email.trim().toLowerCase());
      setOtpSent(true);
      Alert.alert("Código enviado", "Te enviamos un código OTP a tu correo.");
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
      const token = await verifyProfessionalOtp(email.trim().toLowerCase(), otpCode.trim());
      setTempToken(token);
      Alert.alert("Correo verificado", "Ya puedes continuar con el registro profesional.");
    } catch (err: any) {
      setError(err?.message ?? "No pudimos verificar el código.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleVerify() {
    try {
      setLoading(true);
      setError(null);
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      await GoogleSignin.signOut();
      const response = await GoogleSignin.signIn();
      if (response.type === "cancelled") return;
      const idToken = response.data?.idToken;
      if (!idToken) throw new Error("Google no devolvió id_token.");

      const token = await verifyProfessionalGoogle(idToken);

      const googleUser = response.data?.user;
      if (googleUser?.email) setEmail(googleUser.email);
      if (googleUser?.givenName && !firstName.trim()) setFirstName(googleUser.givenName);
      if (googleUser?.familyName && !lastName.trim()) setLastName(googleUser.familyName);

      setOtpSent(false);
      setOtpCode("");
      setTempToken(token);
      Alert.alert("Correo verificado con Google", "Ya puedes continuar con el registro profesional.");
    } catch (err: any) {
      if (isErrorWithCode(err)) {
        if (err.code === statusCodes.SIGN_IN_CANCELLED || err.code === statusCodes.IN_PROGRESS) return;
        if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          setError("Google Play Services no disponible en este dispositivo.");
          return;
        }
      }
      setError(err?.message ?? "No pudimos verificar con Google.");
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

    if (!acceptedTerms) {
      setError("Debes aceptar los Términos y Condiciones para enviar el registro.");
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
        bio: bio.trim() || undefined,
        dateOfBirth: dateOfBirth.trim(),
        cedula: cedula.trim(),
        country: professionalCountry,
        referralCode: referralCode.trim() || undefined,
        idDoc: idDoc ?? undefined,
        kycVideo: kycVideo ?? undefined,
        kycSelfie: kycSelfie ?? undefined,
        matricula: matricula ?? undefined,
        tituloProfesional: tituloProfesional ?? undefined,
      });

      await setSession(registration.access_token, registration.user);

      try {
        await updateMyProfessionalSpecialties(selectedSpecialties);
      } catch {
        // Registro base completado; especialidades se pueden actualizar desde perfil.
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

        {/* ── PASO 1: Datos personales ── */}
        {step === 1 ? (
          <View style={styles.form}>
            <AppInput label="Nombre" value={firstName} onChangeText={setFirstName} placeholder="Camila" />
            <AppInput label="Apellido" value={lastName} onChangeText={setLastName} placeholder="Rojas" />

            <AppInput
              label="Email"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                setTempToken(null);
                setOtpSent(false);
                setOtpCode("");
              }}
              placeholder="profesional@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
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
              <Text style={[styles.badge, tempToken && styles.badgeVerified]}>
                {tempToken ? "Verificado ✓" : "Pendiente"}
              </Text>
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

            {GOOGLE_WEB_CLIENT_ID ? (
              <>
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>o</Text>
                  <View style={styles.dividerLine} />
                </View>
                <GoogleButton
                  label="Verificar con Google"
                  onPress={handleGoogleVerify}
                  loading={loading}
                />
                <Text style={styles.hint}>
                  Con Google verificamos tu correo al instante, sin código OTP.
                </Text>
              </>
            ) : null}
          </View>
        ) : null}

        {/* ── PASO 2: Cuenta ── */}
        {step === 2 ? (
          <View style={styles.form}>
            <AppInput
              label="Username profesional"
              value={username}
              onChangeText={setUsername}
              placeholder="camila.psicologa"
            />
            <AppInput
              label="Documento / Cédula"
              value={cedula}
              onChangeText={setCedula}
              placeholder="12345678"
            />
            <AppInput
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              showPasswordToggle
            />
            <AppInput
              label="Confirmar contraseña"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              showPasswordToggle
            />
            <AppInput
              label="Bio profesional"
              value={bio}
              onChangeText={setBio}
              placeholder="Psicóloga clínica con enfoque cognitivo-conductual"
            />
            <Text style={styles.fieldLabel}>País de residencia profesional</Text>
            <Text style={[styles.hint, { marginTop: -8 }]}>Selecciona el país donde actualmente ejerces tu carrera profesional.</Text>
            <Pressable style={styles.countryCodeBtn} onPress={() => setShowProfessionalCountryPicker(true)}>
              <Text style={styles.countryCodeText}>
                {COUNTRY_CODES.find((c) => c.flag === professionalCountry)?.flag ?? "BO"}{" "}
                {COUNTRY_CODES.find((c) => c.flag === professionalCountry)?.country ?? "Bolivia"}
              </Text>
              <Ionicons name="chevron-down" size={14} color={appTheme.colors.textMuted} />
            </Pressable>

            <AppInput
              label="Código de referido (opcional)"
              value={referralCode}
              onChangeText={(v) => setReferralCode(v.toUpperCase())}
              placeholder="Ej: CAMILA4X2B"
              autoCapitalize="characters"
            />
          </View>
        ) : null}

        {/* ── PASO 3: Especialidades y tarifas ── */}
        {step === 3 ? (
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Especialidades</Text>
            <Text style={styles.sectionHint}>Selecciona tus principales áreas de atención.</Text>
            {catalogLoading ? <Text style={styles.hint}>Cargando especialidades...</Text> : null}
            <View style={styles.tagsWrap}>
              {specialtiesCatalog.map((tag) => (
                <AppChip
                  key={tag.id}
                  label={tag.name}
                  active={selectedSpecialties.includes(tag.id)}
                  onPress={() => toggleSpecialty(tag.id)}
                />
              ))}
            </View>

          </View>
        ) : null}

        {/* ── PASO 4: KYC ── */}
        {step === 4 ? (
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Verificación de identidad</Text>
            <Text style={styles.sectionHint}>
              Sube tus documentos para que el equipo pueda verificar tu identidad profesional.
            </Text>

            <Text style={styles.docLabel}>Video de rostro *</Text>
            <Text style={styles.sectionHint}>
              Graba un video corto (máx. 10 seg) mirando de frente a la cámara. Se cotejarán automáticamente con tu documento.
            </Text>
            <Pressable style={[styles.uploadCard, kycVideo && styles.uploadCardDone]} onPress={() => void handleRecordFaceVideo()}>
              <Text style={styles.uploadTitle}>{kycVideo ? "Video grabado" : "Grabar video de rostro"}</Text>
              <Text style={styles.uploadMeta}>{kycVideo ? kycVideo.name : "Toca para abrir la cámara"}</Text>
            </Pressable>

            <Text style={styles.docLabel}>Documento de identidad *</Text>
            <Text style={styles.sectionHint}>Licencia de conducir o pasaporte (imagen o PDF).</Text>
            <Pressable style={[styles.uploadCard, idDoc && styles.uploadCardDone]} onPress={() => void handlePickIdDoc()}>
              <Text style={styles.uploadTitle}>{idDoc ? "Documento seleccionado" : "Seleccionar archivo"}</Text>
              <Text style={styles.uploadMeta}>{idDoc?.name ?? "Imagen o PDF"}</Text>
            </Pressable>

            <Text style={styles.docLabel}>Matrícula profesional vigente *</Text>
            <Text style={styles.sectionHint}>Registro que acredita tu habilitación profesional.</Text>
            <Pressable style={[styles.uploadCard, matricula && styles.uploadCardDone]} onPress={() => void handlePickMatricula()}>
              <Text style={styles.uploadTitle}>{matricula ? "Matrícula seleccionada" : "Seleccionar archivo"}</Text>
              <Text style={styles.uploadMeta}>{matricula?.name ?? "Imagen o PDF"}</Text>
            </Pressable>

            <Text style={styles.docLabel}>Título profesional (opcional)</Text>
            <Text style={styles.sectionHint}>Si aplica, sube tu título o diploma universitario.</Text>
            <Pressable style={[styles.uploadCard, tituloProfesional && styles.uploadCardDone]} onPress={() => void handlePickTitulo()}>
              <Text style={styles.uploadTitle}>{tituloProfesional ? "Título seleccionado" : "Seleccionar archivo (opcional)"}</Text>
              <Text style={styles.uploadMeta}>{tituloProfesional?.name ?? "Imagen o PDF"}</Text>
            </Pressable>

            <Text style={styles.hint}>Los documentos marcados con * son obligatorios para la aprobación.</Text>
          </View>
        ) : null}

        {/* ── PASO 5: Resumen ── */}
        {step === 5 ? (
          <View style={styles.form}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Resumen del envío</Text>
              <Text style={styles.summaryText}>Profesional: {firstName} {lastName}</Text>
              <Text style={styles.summaryText}>Username: {username}</Text>
              <Text style={styles.summaryText}>Especialidades: {selectedSpecialtyNames.join(", ") || "Sin seleccionar"}</Text>
              <Text style={styles.summaryText}>Video de rostro: {kycVideo ? "Grabado" : "Pendiente"}</Text>
              <Text style={styles.summaryText}>Documento de identidad: {idDoc ? "Adjunto" : "Pendiente"}</Text>
              <Text style={styles.summaryText}>Matrícula profesional: {matricula ? "Adjunta" : "Pendiente"}</Text>
              <Text style={styles.summaryText}>Título profesional: {tituloProfesional ? "Adjunto" : "No adjuntado"}</Text>
              {referralCode.trim() ? <Text style={styles.summaryText}>Código de referido: {referralCode.trim()}</Text> : null}
            </View>
            <Pressable style={styles.termsRow} onPress={() => setAcceptedTerms((prev) => !prev)}>
              <View style={[styles.checkbox, acceptedTerms && styles.checkboxActive]} />
              <Text style={styles.termsText}>
                Acepto los{" "}
                <Text style={styles.termsLink} onPress={() => router.push("/terms" as any)}>
                  Términos y Condiciones
                </Text>
                .
              </Text>
            </Pressable>
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

      {/* ── Modal selector de país de residencia profesional ── */}
      <Modal
        visible={showProfessionalCountryPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProfessionalCountryPicker(false)}
      >
        <Pressable style={styles.pickerBackdrop} onPress={() => setShowProfessionalCountryPicker(false)}>
          <Pressable style={styles.pickerBox} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.pickerTitle}>País de residencia</Text>
            <FlatList
              data={COUNTRY_CODES}
              keyExtractor={(item) => `prof-${item.flag}-${item.code}`}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.pickerItem, item.flag === professionalCountry && styles.pickerItemActive]}
                  onPress={() => {
                    setProfessionalCountry(item.flag);
                    setShowProfessionalCountryPicker(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>{item.flag}  {item.country}</Text>
                  <Text style={styles.pickerItemCode}>{item.code}</Text>
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>

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
  fieldLabel: {
    color: appTheme.colors.text,
    fontSize: 13,
    fontFamily: appTheme.fonts.body,
    fontWeight: "600",
    marginBottom: -4,
  },
  phoneRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-end",
  },
  countryCodeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F8FAFC",
    borderRadius: appTheme.radius.lg,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  countryCodeText: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 15,
    fontWeight: "600",
  },
  phoneInputWrap: {
    flex: 1,
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
    backgroundColor: "#F1F5F9",
    color: appTheme.colors.textMuted,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "700",
    overflow: "hidden",
  },
  badgeVerified: {
    backgroundColor: "rgba(107, 175, 138, 0.16)",
    color: appTheme.colors.success,
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
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: appTheme.colors.border,
    marginTop: 1,
    backgroundColor: "#FFFFFF",
  },
  checkboxActive: {
    borderColor: appTheme.colors.primary,
    backgroundColor: appTheme.colors.primary,
  },
  termsText: {
    flex: 1,
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    lineHeight: 18,
  },
  termsLink: {
    color: appTheme.colors.primary,
    fontWeight: "700",
  },
  hint: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    lineHeight: 18,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: appTheme.colors.border,
  },
  dividerText: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    fontWeight: "600",
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

  // Country code picker modal
  pickerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  pickerBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 360,
    maxHeight: 480,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  pickerTitle: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 12,
  },
  pickerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  pickerItemActive: {
    backgroundColor: "rgba(107, 175, 138, 0.12)",
  },
  pickerItemText: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 15,
  },
  pickerItemCode: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    fontWeight: "600",
  },
});

