import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import AppButton from "../../../components/ui/AppButton";
import AppScreen from "../../../components/ui/AppScreen";
import { appTheme } from "../../../theme/appTheme";

const slides = [
  {
    title: "Encuentra al profesional ideal",
    description: "Busca por especialidad y elige al profesional que mejor se adapte a tu situación.",
  },
  {
    title: "Habla por chat de forma segura",
    description: "Inicia conversaciones privadas con un flujo simple y transparente.",
  },
  {
    title: "Gestiona tus créditos con claridad",
    description: "Visualiza tu saldo y recargas en una experiencia clara y sin fricción.",
  },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const isLast = step === slides.length - 1;
  const current = useMemo(() => slides[step], [step]);

  return (
    <AppScreen>
      <View style={styles.container}>
        <Pressable onPress={() => router.replace("/(public)/auth")} style={styles.skipWrap}>
          <Text style={styles.skipText}>Omitir</Text>
        </Pressable>

        <View style={styles.hero} />
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.description}>{current.description}</Text>

        <View style={styles.dots}>
          {slides.map((_, index) => (
            <View key={index} style={[styles.dot, step === index && styles.dotActive]} />
          ))}
        </View>

        <AppButton
          title={isLast ? "Empezar" : "Continuar"}
          onPress={() => {
            if (isLast) {
              router.replace("/(public)/auth");
            } else {
              setStep((prev) => prev + 1);
            }
          }}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    gap: 18,
  },
  skipWrap: {
    alignSelf: "flex-end",
  },
  skipText: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    fontWeight: "600",
  },
  hero: {
    height: 220,
    borderRadius: appTheme.radius.xl,
    backgroundColor: "#E8F1FA",
  },
  title: {
    fontSize: 30,
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    lineHeight: 36,
  },
  description: {
    color: appTheme.colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: appTheme.fonts.body,
  },
  dots: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginVertical: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#CBD5E1",
  },
  dotActive: {
    width: 22,
    backgroundColor: appTheme.colors.primary,
  },
});

