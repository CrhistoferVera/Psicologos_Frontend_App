import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { User } from "@/src/services/auth";

type Props = {
  user: User;
};

export default function ProfileSummary({ user }: Props) {
  const displayName = [user.firstName, user.lastName]
    .filter(Boolean)
    .join(" ") || null;

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <View style={styles.avatarRing}>
        <View style={styles.avatarInner}>
          <MaterialCommunityIcons name="account" size={34} color="#F6C16A" />
        </View>
      </View>

      {/* Datos */}
      <View style={{ flex: 1 }}>
        <Text style={styles.phone}>{user.phoneNumber}</Text>
        {displayName && (
          <Text style={styles.name}>{displayName}</Text>
        )}
        {user.email && (
          <Text style={styles.email}>{user.email}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#1a0208",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(246,193,106,0.3)",
    paddingHorizontal: 20,
    paddingVertical: 18,
    shadowColor: "#F6C16A",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1.5,
    borderColor: "#F6C16A",
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
  },
  avatarInner: {
    flex: 1,
    width: "100%",
    borderRadius: 24,
    backgroundColor: "#2a0810",
    alignItems: "center",
    justifyContent: "center",
  },
  phone: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
  },
  name: {
    color: "rgba(246,193,106,0.8)",
    fontSize: 13,
    marginTop: 2,
  },
  email: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    marginTop: 1,
  },
});
