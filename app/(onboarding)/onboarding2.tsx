import { router } from "expo-router";
import OnboardingFrame from "../../src/components/OnboardingFrame";
import { ShieldCheck } from "lucide-react-native";

export default function Onboarding2() {
  return (
    <OnboardingFrame
      step={1}
      title="Seguridad Total"
      description="Tus conversaciones están protegidas con encriptación de extremo a extremo."
      descriptionClassName="text-lg"
      icon={<ShieldCheck size={150} color="white" />}
      onSkip={() => router.replace("/(auth)/choose-access")}
      onNext={() => router.push("/(onboarding)/onboarding3")}
    />
  );
}
