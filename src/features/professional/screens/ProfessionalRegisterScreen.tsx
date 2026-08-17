import { Pressable, Text, View } from "react-native";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from "../../../config";
import AppButton from "../../../components/ui/AppButton";
import AppScreen from "../../../components/ui/AppScreen";
import ProfessionalStepHeader from "../components/ProfessionalStepHeader";
import StepPersonalVerify from "../components/registration/StepPersonalVerify";
import StepAccount from "../components/registration/StepAccount";
import StepSpecialties from "../components/registration/StepSpecialties";
import StepKyc from "../components/registration/StepKyc";
import StepSummary from "../components/registration/StepSummary";
import { TOTAL_STEPS, useProfessionalRegister } from "../hooks/useProfessionalRegister";

GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID || undefined,
  iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
});

export default function ProfessionalRegisterScreen() {
  const reg = useProfessionalRegister();

  return (
    <AppScreen scroll>
      <View className="gap-[14px]">
        <ProfessionalStepHeader currentStep={reg.step} totalSteps={TOTAL_STEPS} title={reg.currentStepTitle} />

        {reg.step === 1 ? <StepPersonalVerify reg={reg} /> : null}
        {reg.step === 2 ? <StepAccount reg={reg} /> : null}
        {reg.step === 3 ? <StepSpecialties reg={reg} /> : null}
        {reg.step === 4 ? <StepKyc reg={reg} /> : null}
        {reg.step === 5 ? <StepSummary reg={reg} /> : null}

        {reg.error ? <Text className="text-[#DC2626] font-body text-xs">{reg.error}</Text> : null}

        <View className="flex-row gap-2.5">
          <View className="flex-1">
            <AppButton title="Volver" variant="secondary" onPress={reg.handleBack} disabled={reg.loading} />
          </View>
          <View className="flex-1">
            {reg.step < TOTAL_STEPS ? (
              <AppButton title="Continuar" onPress={reg.handleContinue} disabled={reg.loading} />
            ) : (
              <AppButton title="Enviar registro" onPress={reg.handleSubmit} loading={reg.loading} />
            )}
          </View>
        </View>

      </View>
    </AppScreen>
  );
}
