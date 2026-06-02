import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import AppButton from "../../../components/ui/AppButton";
import AppScreen from "../../../components/ui/AppScreen";
import { appTheme } from "../../../theme/appTheme";

const slides = [
  {
    title: "Encuentra al profesional ideal",
    description:
      "Busca por especialidad y elige al profesional que mejor se adapte a tu situación.",
      image: require("../../../../assets/onboarding-1.jpeg"),
  },
  {
    title: "Habla por chat de forma segura",
    description:
      "Inicia conversaciones privadas con un flujo simple y transparente.",
      image: require("../../../../assets/onboarding-2.jpeg"),
  },
  {
    title: "Gestiona tu saldo con claridad",
    description:
      "Visualiza tu saldo y pagos en una experiencia clara y sin friccin.",
      image: require("../../../../assets/onboarding-3.jpeg"),
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

        <View style={styles.imageContainer}>
          <Image source={current.image} style={styles.hero} resizeMode="contain" />
        </View>

        <View style={styles.textContent}>
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.description}>{current.description}</Text>
        </View>

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
    gap: 20,
  },

  skipWrap: {
    alignSelf: "flex-end",
  },

  skipText: {
    color: "#475569",
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    fontWeight: "600",
  },

  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: appTheme.radius.xl,
    overflow: "hidden",
    backgroundColor: "#EEF4FB",
  },

  hero: {
    width: "100%",
    height: "100%",
  },

  textContent: {
    gap: 8,
  },

  title: {
    fontSize: 30,
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontWeight: "700",
    lineHeight: 36,
  },

  description: {
    color: "#475569",
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


