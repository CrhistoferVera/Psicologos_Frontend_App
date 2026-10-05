import { Pressable, Text, View } from "react-native";
import type { KycStepData } from "./stepProps";
import type { VerificationDocType } from "../../types";
import UploadCard from "./UploadCard";

const OPTIONS: { type: VerificationDocType; label: string; hint: string; canCharge: boolean }[] = [
  {
    type: "TITULO",
    label: "Título en provisión nacional",
    hint: "Una vez pases nuestra revisión, podrás cobrar y hacer todo dentro de la app.",
    canCharge: true,
  },
  {
    type: "MATRICULA",
    label: "Matrícula profesional",
    hint: "Una vez pases nuestra revisión, podrás cobrar y hacer todo dentro de la app.",
    canCharge: true,
  },
  {
    type: "CI",
    label: "Carnet de identidad (CI)",
    hint: "Para estudiantes o quienes aún no tienen título: solo podrás practicar (sesiones gratuitas), sin cobrar. Luego podrás subir tu título desde tu perfil para habilitar el cobro.",
    canCharge: false,
  },
];

export default function StepKyc({ reg }: { reg: KycStepData }) {
  return (
    <View className="gap-3">
      <Text className="text-[#020617] font-heading text-lg font-bold">Verificación de identidad</Text>
      <Text className="text-[#475569] font-body text-[13px]">
        Graba un video de rostro y elige UN documento. El equipo validará ambos. El documento
        que elijas define si podrás cobrar dentro de la app.
      </Text>

      <UploadCard
        label="Video de rostro *"
        hint="Graba un video corto (máx. 10 seg) mirando de frente a la cámara."
        done={!!reg.kycVideo}
        title={reg.kycVideo ? "Video grabado" : "Grabar video de rostro"}
        meta={reg.kycVideo ? reg.kycVideo.name : "Toca para abrir la cámara"}
        onPress={() => void reg.handleRecordFaceVideo()}
      />

      <Text className="text-[#020617] font-body text-[13px] font-semibold mt-1">Documento (elige 1) *</Text>
      <View className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-3">
        <Text className="text-[#92400E] font-body text-xs leading-[18px]">
          Si eliges <Text className="font-bold">Carnet (CI)</Text> es porque eres estudiante o aún no tienes título:
          podrás practicar gratis pero <Text className="font-bold">no cobrar</Text> hasta que envíes tu título y lo
          verifiquemos. Con <Text className="font-bold">Título</Text> o <Text className="font-bold">Matrícula</Text>,
          podrás cobrar en cuanto pases la revisión.
        </Text>
      </View>

      {OPTIONS.map((opt) => {
        const selected = reg.verificationDocType === opt.type;
        return (
          <Pressable
            key={opt.type}
            onPress={() => reg.setVerificationDocType(opt.type)}
            className={`rounded-2xl border p-[14px] gap-1 ${
              selected ? "border-[#5B9BD5] bg-[rgba(91,155,213,0.08)]" : "border-[#CBD5E1] bg-white"
            }`}
          >
            <View className="flex-row items-center gap-2">
              <View
                className={`w-[18px] h-[18px] rounded-full border-[1.5px] ${
                  selected ? "border-[#5B9BD5] bg-[#5B9BD5]" : "border-[#CBD5E1] bg-white"
                }`}
              />
              <Text className="text-[#020617] font-body text-[14px] font-semibold">{opt.label}</Text>
            </View>
            <Text className={`font-body text-xs leading-[18px] ${opt.canCharge ? "text-[#6BAF8A]" : "text-[#B45309]"}`}>
              {opt.hint}
            </Text>
          </Pressable>
        );
      })}

      {reg.verificationDocType ? (
        <UploadCard
          label="Documento seleccionado *"
          hint="Imagen o PDF del documento elegido."
          done={!!reg.verificationDoc}
          title={reg.verificationDoc ? "Documento adjunto" : "Seleccionar archivo"}
          meta={reg.verificationDoc?.name ?? "Imagen o PDF"}
          onPress={() => void reg.handlePickVerificationDoc()}
        />
      ) : null}

      <Text className="text-[#475569] font-body text-xs leading-[18px]">
        Debes grabar el video, seleccionar un tipo de documento y adjuntar el archivo para continuar.
      </Text>
    </View>
  );
}
