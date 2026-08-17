import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Alert } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as VideoThumbnails from "expo-video-thumbnails";
import { GoogleSignin, isErrorWithCode, statusCodes } from "@react-native-google-signin/google-signin";
import { useAuth } from "../../../context/AuthContext";
import {
  completeProfessionalRegistration,
  getProfessionalSpecialtiesCatalog,
  sendProfessionalVerificationOtp,
  updateMyProfessionalSpecialties,
  verifyProfessionalGoogle,
  verifyProfessionalOtp,
} from "../api/professionalApi";

export const TOTAL_STEPS = 5;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type FileAsset = { uri: string; name: string; type: string };

export function useProfessionalRegister() {
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
  const [dateOfBirth, setDateOfBirth] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [verifiedVia, setVerifiedVia] = useState<"otp" | "google" | null>(null);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [cedula, setCedula] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [bio, setBio] = useState("");
  const [referralCode, setReferralCode] = useState("");

  const [specialtiesCatalog, setSpecialtiesCatalog] = useState<{ id: string; name: string }[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

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
    if (step === 1) return "Verificación y datos personales";
    if (step === 2) return "Cuenta profesional";
    if (step === 3) return "Especialidades";
    if (step === 4) return "Verificación de identidad (KYC)";
    return "Revisar y enviar";
  }, [step]);

  const selectedSpecialtyNames = useMemo(
    () =>
      selectedSpecialties
        .map((id) => specialtiesCatalog.find((item) => item.id === id)?.name)
        .filter(Boolean) as string[],
    [selectedSpecialties, specialtiesCatalog],
  );

  function toggleSpecialty(id: string) {
    setSelectedSpecialties((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  function onChangeEmail(value: string) {
    setEmail(value);
    setTempToken(null);
    setVerifiedVia(null);
    setOtpSent(false);
    setOtpCode("");
  }

  function validateStep(currentStep = step): string | null {
    if (currentStep === 1) {
      if (!tempToken) return "Verifica tu correo para continuar.";
      if (!firstName.trim()) return "Completa tu nombre.";
      if (!lastName.trim()) return "Completa tu apellido.";
      if (!EMAIL_REGEX.test(email.trim())) return "El email no tiene un formato válido.";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth.trim())) return "Usa formato YYYY-MM-DD para la fecha de nacimiento.";
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
      setVerifiedVia("otp");
      Alert.alert("Correo verificado", "Ya puedes completar tus datos.");
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
      setVerifiedVia("google");
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

  async function pickDocument(setter: (asset: FileAsset) => void, errorMsg: string, fallbackName: string) {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;
      setter({ uri: asset.uri, name: asset.name ?? fallbackName, type: asset.mimeType ?? "application/octet-stream" });
    } catch {
      setError(errorMsg);
    }
  }

  const handlePickIdDoc = () => pickDocument(setIdDoc, "No se pudo seleccionar el documento.", "id-doc");
  const handlePickMatricula = () => pickDocument(setMatricula, "No se pudo seleccionar la matrícula.", "matricula");
  const handlePickTitulo = () => pickDocument(setTituloProfesional, "No se pudo seleccionar el título.", "titulo");

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

  function handleContinue() {
    const validationError = validateStep(step);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStep((prev) => Math.min(TOTAL_STEPS, prev + 1));
  }

  function handleBack() {
    setError(null);
    if (step === 1) {
      if (router.canGoBack()) router.back();
      else router.replace("/(public)/auth");
      return;
    }
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

  return {
    router,
    step,
    loading,
    error,
    catalogLoading,
    acceptedTerms,
    setAcceptedTerms,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    professionalCountry,
    setProfessionalCountry,
    dateOfBirth,
    setDateOfBirth,
    otpSent,
    otpCode,
    setOtpCode,
    tempToken,
    verifiedVia,
    email,
    onChangeEmail,
    username,
    setUsername,
    cedula,
    setCedula,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    bio,
    setBio,
    referralCode,
    setReferralCode,
    specialtiesCatalog,
    selectedSpecialties,
    toggleSpecialty,
    idDoc,
    kycVideo,
    matricula,
    tituloProfesional,
    currentStepTitle,
    selectedSpecialtyNames,
    handleSendOtp,
    handleVerifyOtp,
    handleGoogleVerify,
    handlePickIdDoc,
    handleRecordFaceVideo,
    handlePickMatricula,
    handlePickTitulo,
    handleContinue,
    handleBack,
    handleSubmit,
  };
}

export type ProfessionalRegister = ReturnType<typeof useProfessionalRegister>;
