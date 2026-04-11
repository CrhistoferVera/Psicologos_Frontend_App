import { View, Text, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenHeader from "@/src/components/Menu/ScreenHeader";

const terms = [
    {
        title: "1. Naturaleza del servicio",
        content: "Pachamama es una plataforma social de entretenimiento digital que permite a los usuarios interactuar con creadores mediante mensajes, contenido multimedia y experiencias en vivo dentro de la aplicación.\n\nLa plataforma no ofrece ni promueve servicios sexuales de ningún tipo.",
    },
    {
        title: "2. Edad mínima",
        content: "El uso de la aplicación está permitido únicamente para personas mayores de 18 años.\n\nAl registrarse, el usuario declara cumplir este requisito.",
    },
    {
        title: "3. Sistema de créditos",
        content: "La plataforma utiliza un sistema de créditos para acceder a funciones premium como:\n\n• Interacción mediante mensajes\n• Contenido exclusivo\n• Experiencias en vivo\n\nLos créditos no constituyen dinero real y no son reembolsables.",
    },
    {
        title: "4. Pagos",
        content: "Los pagos se procesan mediante proveedores externos (ej: Culqi).\n\nLa plataforma no almacena información financiera sensible del usuario.\n\nEl usuario es responsable de verificar sus compras antes de confirmarlas.",
    },
    {
        title: "5. Interacciones dentro de la plataforma",
        content: "Las interacciones entre usuarios y creadores son de carácter:\n\n✔ Social\n✔ Recreativo\n✔ Digital\n\nLa plataforma no garantiza resultados específicos ni establece relaciones fuera del entorno digital.",
    },
    {
        title: "6. Conducta del usuario",
        content: "Está estrictamente prohibido:\n\n• Compartir contenido ilegal\n• Solicitar o ofrecer servicios sexuales\n• Compartir datos personales (teléfono, dirección, etc.)\n• Grabar, reproducir o distribuir contenido sin autorización\n• Acosar o amenazar a otros usuarios",
    },
    {
        title: "7. Contenido",
        content: "Los creadores son responsables del contenido que comparten.\n\nLa plataforma podrá eliminar contenido que incumpla las normas o políticas.",
    },
    {
        title: "8. Cuentas de creadores (anfitrionas)",
        content: "El registro como creador está sujeto a revisión y aprobación por parte de la plataforma.\n\nLa plataforma se reserva el derecho de:\n\n• Aprobar o rechazar perfiles\n• Suspender cuentas\n• Eliminar contenido",
    },
    {
        title: "9. Moderación",
        content: "La plataforma cuenta con herramientas de:\n\n• Reporte\n• Bloqueo\n• Revisión de contenido\n\nEl incumplimiento de normas puede resultar en suspensión o eliminación de la cuenta.",
    },
    {
        title: "10. Privacidad",
        content: "La información del usuario será tratada conforme a la política de privacidad de la plataforma.",
    },
    {
        title: "11. Suspensión de cuentas",
        content: "La plataforma podrá suspender cuentas sin previo aviso en caso de incumplimiento de los términos.",
    },
    {
        title: "12. Limitación de responsabilidad",
        content: "La plataforma actúa como intermediario digital y no es responsable por el comportamiento de los usuarios.",
    },
    {
        title: "13. Modificaciones",
        content: "Los términos pueden ser modificados en cualquier momento.\n\nEl uso continuo implica aceptación de dichos cambios.",
    },
];

export default function Terminos() {
    const insets = useSafeAreaInsets();

    return (
        <View style={{ flex: 1, backgroundColor: "#0f0f0f" }}>
            <ScreenHeader title="Términos y condiciones" role="cliente" showBackButton />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingHorizontal: 20,
                    paddingTop: 24,
                    paddingBottom: insets.bottom + 40,
                }}
            >
                {/* TÍTULO PRINCIPAL */}
                <View style={{ marginBottom: 24, borderLeftWidth: 3, borderLeftColor: "#A11B1B", paddingLeft: 12 }}>
                    <Text style={{ color: "white", fontSize: 20, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" }}>
                        Términos y Condiciones
                    </Text>
                    <Text style={{ color: "#6b7280", fontSize: 12, marginTop: 4 }}>Pachamama — Plataforma de entretenimiento digital</Text>
                </View>

                {/* SECCIONES */}
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
                            <Text style={{ color: "white", fontSize: 14, fontWeight: "800", flex: 1 }}>{term.title.replace(/^\d+\.\s/, "")}</Text>
                        </View>
                        <Text style={{ color: "#9ca3af", fontSize: 13, lineHeight: 22 }}>{term.content}</Text>
                    </View>
                ))}

                {/* FOOTER */}
                <View style={{ alignItems: "center", marginTop: 8, opacity: 0.4 }}>
                    <Text style={{ color: "#6b7280", fontSize: 11, letterSpacing: 2, textTransform: "uppercase" }}>
                        © Pachamama — Todos los derechos reservados
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}
