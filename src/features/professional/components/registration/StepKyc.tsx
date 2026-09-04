import { Text, View } from "react-native";
import type { KycStepData } from "./stepProps";
import UploadCard from "./UploadCard";

export default function StepKyc({ reg }: { reg: KycStepData }) {
  return (
    <View className="gap-3">
      <Text className="text-[#020617] font-heading text-lg font-bold">Verificación de identidad</Text>
      <Text className="text-[#475569] font-body text-[13px]">
        Sube tus documentos para que el equipo pueda verificar tu identidad profesional.
      </Text>

      <UploadCard
        label="Video de rostro *"
        hint="Graba un video corto (máx. 10 seg) mirando de frente a la cámara. Se cotejarán automáticamente con tu documento."
        done={!!reg.kycVideo}
        title={reg.kycVideo ? "Video grabado" : "Grabar video de rostro"}
        meta={reg.kycVideo ? reg.kycVideo.name : "Toca para abrir la cámara"}
        onPress={() => void reg.handleRecordFaceVideo()}
      />

      <UploadCard
        label="Documento de identidad *"
        hint="Licencia de conducir o pasaporte (imagen o PDF)."
        done={!!reg.idDoc}
        title={reg.idDoc ? "Documento seleccionado" : "Seleccionar archivo"}
        meta={reg.idDoc?.name ?? "Imagen o PDF"}
        onPress={() => void reg.handlePickIdDoc()}
      />

      <UploadCard
        label="Matrícula profesional vigente *"
        hint="Registro que acredita tu habilitación profesional."
        done={!!reg.matricula}
        title={reg.matricula ? "Matrícula seleccionada" : "Seleccionar archivo"}
        meta={reg.matricula?.name ?? "Imagen o PDF"}
        onPress={() => void reg.handlePickMatricula()}
      />

      <UploadCard
        label="Título profesional (opcional)"
        hint="Si aplica, sube tu título o diploma universitario."
        done={!!reg.tituloProfesional}
        title={reg.tituloProfesional ? "Título seleccionado" : "Seleccionar archivo (opcional)"}
        meta={reg.tituloProfesional?.name ?? "Imagen o PDF"}
        onPress={() => void reg.handlePickTitulo()}
      />

      <Text className="text-[#475569] font-body text-xs leading-[18px]">
        Los documentos marcados con * son obligatorios para la aprobación.
      </Text>
    </View>
  );
}
