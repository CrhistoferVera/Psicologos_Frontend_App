import { router } from "expo-router";
import OnboardingFrame from "../../src/components/OnboardingFrame";
import { WalletIcon } from "lucide-react-native";

export default function Onboarding3() {
  return (
    <OnboardingFrame
      step={2}
      title="Sistema de Creditos"
      description="Adquiere creditos fácilmente para acceder a contenido exclusivo."
      descriptionClassName="text-lg"
      icon={<WalletIcon size={150} color="white" />}
      onSkip={() => router.replace("/(auth)/choose-access")}
      onNext={() => router.replace("/(auth)/choose-access")}
    />
  );
}
