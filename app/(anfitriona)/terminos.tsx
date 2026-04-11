import { View, Text, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenHeader from "@/src/components/Menu/ScreenHeader";

const terms = [
  {
    title: "1. Naturaleza del servicio",
    content:
      "Pachamama es una plataforma social de entretenimiento digital que permite a los creadores interactuar con usuarios mediante mensajes, contenido multimedia y experiencias en vivo.\n\nLa plataforma no ofrece ni promueve servicios sexuales de ningún tipo.",
  },
  {
    title: "2. Requisitos para ser anfitriona",
    content:
      "Para registrarte como anfitriona debes:\n\n• Ser mayor de 18 años\n• Presentar un documento de identidad válido\n• Proporcionar información verídica durante el registro\n\nEl registro está sujeto a revisión y aprobación por parte de la plataforma.",
  },
  {
    title: "3. Verificación de identidad",
    content:
      "Al registrarte proporcionas una copia de tu documento de identidad.\n\nEsta información es utilizada únicamente para verificar tu identidad y cumplir con las políticas de la plataforma.\n\nNo será compartida con terceros sin tu consentimiento.",
  },
  {
    title: "4. Sistema de ganancias",
    content:
      "Las anfitrionas generan ganancias a través de:\n\n• Interacciones mediante mensajes\n• Contenido exclusivo\n• Experiencias en vivo (llamadas y videollamadas)\n\nLas ganancias se acumulan en tu wallet dentro de la plataforma y pueden ser retiradas según las políticas de retiro vigentes.",
  },
  {
    title: "5. Retiros",
    content:
      "Los retiros están sujetos a:\n\n• Montos mínimos establecidos por la plataforma\n• Verificación de identidad completada\n• Revisión y aprobación por parte del equipo de la plataforma\n\nLa plataforma se reserva el derecho de retener pagos en caso de incumplimiento de los términos.",
  },
  {
    title: "6. Conducta de la anfitriona",
    content:
      "Está estrictamente prohibido:\n\n• Compartir contenido ilegal o explícito no autorizado\n• Solicitar u ofrecer servicios sexuales\n• Compartir datos personales de usuarios\n• Grabar o distribuir contenido sin autorización\n• Acosar o amenazar a otros usuarios",
  },
  {
    title: "7. Contenido",
    content:
      "Eres responsable del contenido que compartes en la plataforma.\n\nLa plataforma podrá eliminar contenido que incumpla las normas o políticas sin previo aviso.",
  },
  {
    title: "8. Suspensión de cuenta",
    content:
      "La plataforma podrá suspender o eliminar tu cuenta sin previo aviso en caso de:\n\n• Incumplimiento de estos términos\n• Comportamiento fraudulento\n• Información falsa en el registro",
  },
  {
    title: "9. Privacidad",
    content:
      "La información personal será tratada conforme a la política de privacidad de la plataforma.",
  },
  {
    title: "10. Modificaciones",
    content:
      "Los términos pueden ser modificados en cualquier momento.\n\nEl uso continuo de la plataforma implica la aceptación de dichos cambios.",
  },
];

export default function TerminosAnfitriona() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: "#0f0f0f" }}>
      <ScreenHeader title="Términos y condiciones" role="anfitriona" showBackButton />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: insets.bottom + 40,
        }}
      >
        <View style={{ marginBottom: 24, borderLeftWidth: 3, borderLeftColor: "#A11B1B", paddingLeft: 12 }}>
          <Text style={{ color: "white", fontSize: 20, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" }}>
            Términos y Condiciones
          </Text>
          <Text style={{ color: "#6b7280", fontSize: 12, marginTop: 4 }}>
            Pachamama — Anfitrionas
          </Text>
        </View>

        {terms.map((term, i) => (
          <View
            key={i}
            style={{
              backgroundColor: "#141414",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#27272a",
              padding: 16,
              marginBottom: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <View style={{ backgroundColor: "#A11B1B", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text style={{ color: "white", fontSize: 10, fontWeight: "800", letterSpacing: 1 }}>
                  {String(i + 1).padStart(2, "0")}
                </Text>
              </View>
              <Text style={{ color: "white", fontSize: 14, fontWeight: "800", flex: 1 }}>
                {term.title.replace(/^\d+\.\s/, "")}
              </Text>
            </View>
            <Text style={{ color: "#9ca3af", fontSize: 13, lineHeight: 22 }}>{term.content}</Text>
          </View>
        ))}

        <View style={{ alignItems: "center", marginTop: 8, opacity: 0.4 }}>
          <Text style={{ color: "#6b7280", fontSize: 11, letterSpacing: 2, textTransform: "uppercase" }}>
            © Pachamama — Todos los derechos reservados
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
