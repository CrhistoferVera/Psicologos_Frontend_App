import type { FileAsset } from "../../hooks/useKycAssets";

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
  idDoc: FileAsset | null;
  matricula: FileAsset | null;
  tituloProfesional: FileAsset | null;
  handleRecordFaceVideo: () => void | Promise<void>;
  handlePickIdDoc: () => void | Promise<void>;
  handlePickMatricula: () => void | Promise<void>;
  handlePickTitulo: () => void | Promise<void>;
};
