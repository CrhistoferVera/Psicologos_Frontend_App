import { Text, View } from "react-native";

type Props = {
  message: string;
};

export default function IntroCard({ message }: Props) {
  if (!message) return null;

  return (
    <View
      style={{
        marginTop: 24,
        marginHorizontal: 16,
        backgroundColor: "#1a1a1a",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#2a2a2a",
      }}
    >
      <Text style={{ fontSize: 20, marginBottom: 8 }}>❤️</Text>
      <Text style={{ color: "#e5e7eb", fontSize: 14, lineHeight: 22 }}>
        {message}
      </Text>
    </View>
  );
}
