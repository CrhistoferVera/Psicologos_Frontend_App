import { Ionicons } from "@expo/vector-icons";
import { Dimensions, Keyboard, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useEffect, useState } from "react";
import { appTheme } from "../../../theme/appTheme";
import { LANGUAGE_GROUPS } from "../constants/languages";

type Props = {
  visible: boolean;
  selected: string[];
  onToggle: (lang: string) => void;
  onClose: () => void;
};

export function LanguageSelectorModal({ visible, selected, onToggle, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", (e) =>
      setKeyboardHeight(e.endCoordinates.height),
    );
    const hide = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardHeight(0),
    );
    return () => { show.remove(); hide.remove(); };
  }, []);

  const filtered = query.trim()
    ? LANGUAGE_GROUPS.map((g) => ({
        ...g,
        languages: g.languages.filter((l) =>
          l.name.toLowerCase().includes(query.toLowerCase()),
        ),
      })).filter((g) => g.languages.length > 0)
    : LANGUAGE_GROUPS;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIconWrap}>
              <Ionicons name="language" size={20} color={appTheme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Idiomas</Text>
              <Text style={styles.subtitle}>
                {selected.length === 0
                  ? "Selecciona los idiomas en los que atiendes"
                  : `${selected.length} idioma${selected.length > 1 ? "s" : ""} seleccionado${selected.length > 1 ? "s" : ""}`}
              </Text>
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={18} color="#5F7896" />
            </Pressable>
          </View>

          <View style={styles.separator} />

          {/* Buscador */}
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={16} color="#8EA5BE" style={styles.searchIcon} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar idioma..."
              placeholderTextColor="#A0B4C8"
              style={styles.searchInput}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")} style={styles.searchClear}>
                <Ionicons name="close-circle" size={16} color="#A0B4C8" />
              </Pressable>
            )}
          </View>

          {/* Groups */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {filtered.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>No se encontró "{query}"</Text>
              </View>
            ) : null}
            {filtered.map((group) => (
              <View key={group.region} style={styles.group}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupIcon}>{group.icon}</Text>
                  <Text style={styles.groupLabel}>{group.region}</Text>
                </View>

                <View style={styles.grid}>
                  {group.languages.map((item) => {
                    const isSelected = selected.includes(item.name);
                    return (
                      <Pressable
                        key={item.name}
                        style={[
                          styles.card,
                          {
                            backgroundColor: isSelected ? item.accent : item.color,
                            borderColor: isSelected ? item.accent : item.border,
                          },
                        ]}
                        onPress={() => onToggle(item.name)}
                      >
                        {/* Flag + check */}
                        <View style={styles.cardTop}>
                          <Text style={styles.flag}>{item.flag}</Text>
                          {isSelected && (
                            <View style={styles.checkBadge}>
                              <Ionicons name="checkmark" size={9} color={item.accent} />
                            </View>
                          )}
                        </View>

                        <Text
                          style={[
                            styles.cardName,
                            { color: isSelected ? "#FFFFFF" : "#2A405B" },
                          ]}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 8 : 34 }]}>
            <Pressable style={styles.confirmBtn} onPress={onClose}>
              <Text style={styles.confirmText}>Confirmar selección</Text>
              {selected.length > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{selected.length}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const COLUMNS = 4;
const HORIZONTAL_PADDING = 40; // 20px cada lado
const GAP = 10;
const CARD_SIZE = (Dimensions.get("window").width - HORIZONTAL_PADDING - GAP * (COLUMNS - 1)) / COLUMNS;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 20, 40, 0.55)",
  },
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: "85%",
    paddingBottom: 34,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 24,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#D5DFEB",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: `${appTheme.colors.primary}15`,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#172B46",
    fontFamily: appTheme.fonts.heading,
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    color: "#8EA5BE",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#F1F5FA",
    alignItems: "center",
    justifyContent: "center",
  },
  separator: {
    height: 1,
    backgroundColor: "#EEF3FA",
    marginHorizontal: 20,
  },
  scroll: {
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    gap: 24,
  },
  group: {
    gap: 12,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  groupIcon: {
    fontSize: 14,
  },
  groupLabel: {
    color: "#5F7896",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTop: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  flag: {
    fontSize: 28,
    lineHeight: 34,
  },
  checkBadge: {
    position: "absolute",
    bottom: -3,
    right: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  cardName: {
    fontFamily: appTheme.fonts.body,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 52,
    borderRadius: 16,
    backgroundColor: appTheme.colors.primary,
    shadowColor: appTheme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  confirmText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.body,
    fontSize: 15,
    fontWeight: "700",
  },
  countBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  countBadgeText: {
    color: "#FFFFFF",
    fontFamily: appTheme.fonts.body,
    fontSize: 12,
    fontWeight: "700",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 4,
    backgroundColor: "#F1F5FA",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchIcon: {
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    color: "#172B46",
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
    paddingVertical: 0,
  },
  searchClear: {
    padding: 2,
  },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    color: "#8EA5BE",
    fontFamily: appTheme.fonts.body,
    fontSize: 14,
  },
});
