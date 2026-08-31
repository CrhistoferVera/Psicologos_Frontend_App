import { Ionicons } from "@expo/vector-icons";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { appTheme } from "../../../theme/appTheme";

type Props = {
  visible: boolean;
  onClose: () => void;
  professionalName: string;
  avatarUrl?: string;
  specialties: string[];
};

const NO_IMAGE = require("../../../../assets/no_image.jpg");

export default function SpecialtiesModal({
  visible,
  onClose,
  professionalName,
  avatarUrl,
  specialties,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={[styles.sheet, { paddingBottom: Math.max(20, insets.bottom + 12) }]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Image
              source={avatarUrl ? { uri: avatarUrl } : NO_IMAGE}
              style={styles.avatar}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>
                {professionalName}
              </Text>
              <Text style={styles.subtitle}>
                {specialties.length}{" "}
                {specialties.length === 1 ? "especialidad" : "especialidades"}
              </Text>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={18} color={appTheme.colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.divider} />

          <ScrollView
            style={styles.list}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          >
            {specialties.map((item) => (
              <View key={item} style={styles.row}>
                <View style={styles.rowIcon}>
                  <Ionicons name="checkmark" size={13} color={appTheme.colors.primary} />
                </View>
                <Text style={styles.rowText}>{item}</Text>
              </View>
            ))}
          </ScrollView>

          <Pressable style={styles.primaryBtn} onPress={onClose}>
            <Text style={styles.primaryBtnText}>Entendido</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(5,10,20,0.55)",
  },

  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    maxHeight: "78%",
  },

  handle: {
    alignSelf: "center",
    width: 38,
    height: 4,
    borderRadius: 99,
    backgroundColor: "#E2E8F0",
    marginBottom: 16,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#E2E8F0",
  },

  name: {
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.heading,
    fontSize: 17,
    fontWeight: "700",
  },

  subtitle: {
    color: appTheme.colors.textMuted,
    fontFamily: appTheme.fonts.body,
    fontSize: 13,
    marginTop: 1,
  },

  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },

  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 16,
  },

  list: {
    flexGrow: 0,
  },

  listContent: {
    gap: 8,
    paddingBottom: 4,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#EEF2F7",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },

  rowIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: "rgba(91,155,213,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },

  rowText: {
    flex: 1,
    color: appTheme.colors.text,
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    fontWeight: "600",
  },

  primaryBtn: {
    marginTop: 18,
    height: 52,
    borderRadius: 16,
    backgroundColor: appTheme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryBtnText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.heading,
    fontSize: 15,
    fontWeight: "700",
  },
});
