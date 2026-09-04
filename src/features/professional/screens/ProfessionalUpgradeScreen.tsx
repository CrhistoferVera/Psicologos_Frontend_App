import { Text, View } from "react-native";
import AppButton from "../../../components/ui/AppButton";
import AppScreen from "../../../components/ui/AppScreen";
import ProfessionalStepHeader from "../components/ProfessionalStepHeader";
import StepUpgradeData from "../components/registration/StepUpgradeData";
import StepSpecialties from "../components/registration/StepSpecialties";
import StepKyc from "../components/registration/StepKyc";
import StepUpgradeSummary from "../components/registration/StepUpgradeSummary";
import { UPGRADE_TOTAL_STEPS, useProfessionalUpgrade } from "../hooks/useProfessionalUpgrade";

export default function ProfessionalUpgradeScreen() {
  const reg = useProfessionalUpgrade();

  return (
    <AppScreen scroll>
      <View className="gap-[14px]">
        <ProfessionalStepHeader currentStep={reg.step} totalSteps={UPGRADE_TOTAL_STEPS} title={reg.currentStepTitle} />

        {reg.step === 1 ? <StepUpgradeData reg={reg} /> : null}
        {reg.step === 2 ? <StepSpecialties reg={reg} /> : null}
        {reg.step === 3 ? <StepKyc reg={reg} /> : null}
        {reg.step === 4 ? <StepUpgradeSummary reg={reg} /> : null}

        {reg.error ? <Text className="text-[#DC2626] font-body text-xs">{reg.error}</Text> : null}

        <View className="flex-row gap-2.5">
          <View className="flex-1">
            <AppButton title="Volver" variant="secondary" onPress={reg.handleBack} disabled={reg.loading} />
          </View>
          <View className="flex-1">
            {reg.step < UPGRADE_TOTAL_STEPS ? (
              <AppButton title="Continuar" onPress={reg.handleContinue} disabled={reg.loading} />
            ) : (
              <AppButton title="Enviar solicitud" onPress={reg.handleSubmit} loading={reg.loading} />
            )}
          </View>
        </View>
      </View>
    </AppScreen>
  );
}
