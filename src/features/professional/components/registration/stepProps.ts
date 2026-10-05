import type { FileAsset } from "../../hooks/useKycAssets";
import type { VerificationDocType } from "../../types";

// Subconjuntos de datos que consumen los steps presentacionales reutilizables.
// Tanto el flujo de registro (useProfessionalRegister) como el de upgrade
// (useProfessionalUpgrade) satisfacen estas formas estructuralmente.
export type SpecialtiesStepData = {
  catalogLoading: boolean;
  specialtiesCatalog: { id: string; name: string }[];
  selectedSpecialties: string[];
  toggleSpecialty: (id: string) => void;
};

export type KycStepData = {
  kycVideo: FileAsset | null;
  handleRecordFaceVideo: () => void | Promise<void>;
  verificationDocType: VerificationDocType | null;
  setVerificationDocType: (type: VerificationDocType) => void;
  verificationDoc: FileAsset | null;
  handlePickVerificationDoc: () => void | Promise<void>;
};
