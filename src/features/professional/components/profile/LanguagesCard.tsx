import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { appTheme } from "../../../../theme/appTheme";
import { getLangInfo } from "../../constants/languages";
import SectionCard from "./SectionCard";

type Props = {
  languages: string[];
  onAdd: () => void;
  onRemove: (lang: string) => void;
};

export default function LanguagesCard({ languages, onAdd, onRemove }: Props) {
  return (
    <SectionCard
      titleLeft={
        <View className="flex-row items-center gap-2">
          <View className="w-7 h-7 rounded-lg items-center justify-center bg-[#5B9BD5]/10">
            <Ionicons name="language" size={15} color={appTheme.colors.primary} />
          </View>
          <Text className="text-[#2A405B] font-heading text-base font-bold">Idiomas que hablo</Text>
        </View>
      }
      action={
        <Pressable
          className="flex-row items-center gap-1 border-[1.5px] border-[#5B9BD5] rounded-full px-2.5 py-1 active:bg-[#EAF2FB]"
          accessibilityRole="button"
          hitSlop={6}
          onPress={onAdd}
        >
          <Ionicons name="add" size={14} color={appTheme.colors.primary} />
          <Text className="text-[#5B9BD5] font-body text-xs font-bold">Agregar</Text>
        </Pressable>
      }
    >
      {languages.length === 0 ? (
        <Pressable
          className="items-center justify-center gap-2 border-[1.5px] border-dashed border-[#D5DFEB] rounded-2xl py-[18px] active:bg-[#F5F9FD]"
          accessibilityRole="button"
          onPress={onAdd}
        >
          <Ionicons name="language-outline" size={20} color="#A0B4C8" />
          <Text className="text-[#A0B4C8] font-body text-[13px] text-center leading-[19px]">
            Toca para agregar los idiomas{"\n"}en los que atiendes
          </Text>
        </Pressable>
      ) : (
        <View className="flex-row flex-wrap gap-2">
          {languages.map((lang) => {
            const info = getLangInfo(lang);
            return (
              <View
                key={lang}
                className="flex-row items-center gap-1.5 rounded-full border-[1.5px] px-2.5 py-1.5"
                style={
                  info
                    ? { backgroundColor: info.color, borderColor: info.border }
                    : { backgroundColor: "#EDF4FB", borderColor: "#BDD5EE" }
                }
              >
                {info ? <Text className="text-[15px] leading-[18px]">{info.flag}</Text> : null}
                <Text
                  className="font-body text-[13px] font-bold"
                  style={{ color: info?.accent ?? "#2A405B" }}
                >
                  {lang}
                </Text>
                <Pressable hitSlop={6} onPress={() => onRemove(lang)}>
                  <Ionicons name="close-circle" size={15} color={info?.accent ?? "#4F7BAE"} />
                </Pressable>
              </View>
            );
          })}
        </View>
      )}
    </SectionCard>
  );
}
