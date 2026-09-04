import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../../../context/AuthContext";
import {
  getProfessionalSpecialtiesCatalog,
  updateMyProfessionalSpecialties,
  upgradeToProfessional,
} from "../api/professionalApi";
import { useKycAssets } from "./useKycAssets";

export const UPGRADE_TOTAL_STEPS = 4;

// Flujo para una cuenta YA autenticada que quiere activar su modo profesional.
// A diferencia del registro, NO pide email/nombre/contraseña (ya existen): solo
// los datos profesionales, especialidades y KYC.
export function useProfessionalUpgrade() {
  const router = useRouter();
  const { refreshMode } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [username, setUsername] = useState("");
  const [cedula, setCedula] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [bio, setBio] = useState("");

  const [specialtiesCatalog, setSpecialtiesCatalog] = useState<{ id: string; name: string }[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);

  const kyc = useKycAssets(setError);

  useEffect(() => {
    if (step !== 2 || specialtiesCatalog.length > 0) return;
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
    if (step === 1) return "Datos profesionales";
    if (step === 2) return "Especialidades";
    if (step === 3) return "Verificación de identidad (KYC)";
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

  function validateStep(currentStep = step): string | null {
    if (currentStep === 1) {
      if (!username.trim()) return "Ingresa un username profesional.";
      if (!cedula.trim()) return "Ingresa tu documento / carnet de identidad.";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth.trim())) return "Usa formato YYYY-MM-DD para la fecha de nacimiento.";
    }
    if (currentStep === 2) {
      if (selectedSpecialties.length === 0) return "Selecciona al menos una especialidad.";
    }
    return null;
  }

  function handleContinue() {
    const validationError = validateStep(step);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setStep((prev) => Math.min(UPGRADE_TOTAL_STEPS, prev + 1));
  }

  function handleBack() {
    setError(null);
    if (step === 1) {
      if (router.canGoBack()) router.back();
      else router.replace("/(user)/home");
      return;
    }
    setStep((prev) => Math.max(1, prev - 1));
  }

  async function handleSubmit() {
    for (const s of [1, 2] as const) {
      const validationError = validateStep(s);
      if (validationError) {
        setError(validationError);
        setStep(s);
        return;
      }
    }
    if (!acceptedTerms) {
      setError("Debes aceptar los Términos y Condiciones para enviar la solicitud.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await upgradeToProfessional({
        username: username.trim(),
        bio: bio.trim() || undefined,
        dateOfBirth: dateOfBirth.trim(),
        cedula: cedula.trim(),
        idDoc: kyc.idDoc ?? undefined,
        kycVideo: kyc.kycVideo ?? undefined,
        kycSelfie: kyc.kycSelfie ?? undefined,
        matricula: kyc.matricula ?? undefined,
        tituloProfesional: kyc.tituloProfesional ?? undefined,
      });

      try {
        await updateMyProfessionalSpecialties(selectedSpecialties);
      } catch {
        // Upgrade completado; las especialidades se pueden ajustar desde el perfil.
      }

      // Refresca capacidades/modo para que la app reconozca la nueva capacidad profesional.
      await refreshMode();

      router.replace("/(public)/professional-review-status");
    } catch (err: any) {
      const raw = err?.response?.data?.message ?? err?.message;
      const message = Array.isArray(raw) ? raw.join(", ") : raw || "No se pudo activar tu modo profesional.";
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
    username,
    setUsername,
    cedula,
    setCedula,
    dateOfBirth,
    setDateOfBirth,
    bio,
    setBio,
    specialtiesCatalog,
    selectedSpecialties,
    toggleSpecialty,
    selectedSpecialtyNames,
    currentStepTitle,
    // KYC (para reutilizar StepKyc / resumen)
    kycVideo: kyc.kycVideo,
    idDoc: kyc.idDoc,
    matricula: kyc.matricula,
    tituloProfesional: kyc.tituloProfesional,
    handleRecordFaceVideo: kyc.handleRecordFaceVideo,
    handlePickIdDoc: kyc.handlePickIdDoc,
    handlePickMatricula: kyc.handlePickMatricula,
    handlePickTitulo: kyc.handlePickTitulo,
    handleContinue,
    handleBack,
    handleSubmit,
  };
}

export type ProfessionalUpgrade = ReturnType<typeof useProfessionalUpgrade>;
