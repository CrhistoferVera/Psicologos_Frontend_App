import { Pressable, Text } from "react-native";

type Props = {
  label: string;
  hint: string;
  done: boolean;
  title: string;
  meta: string;
  onPress: () => void;
};

export default function UploadCard({ label, hint, done, title, meta, onPress }: Props) {
  return (
    <>
      <Text className="text-[#020617] font-heading text-sm font-bold mt-1">{label}</Text>
      <Text className="text-[#475569] font-body text-[13px]">{hint}</Text>
      <Pressable
        className={`rounded-2xl border p-[14px] gap-1 ${done ? "border-[#6BAF8A] bg-[rgba(107,175,138,0.08)]" : "border-[#CBD5E1] bg-white"}`}
        onPress={onPress}
      >
        <Text className="text-[#020617] font-heading font-bold text-[15px]">{title}</Text>
        <Text className="text-[#475569] font-body text-xs">{meta}</Text>
      </Pressable>
    </>
  );
}
