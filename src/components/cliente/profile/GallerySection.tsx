import { useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  StatusBar,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PremiumOverlay from "./PremiumOverlay";
import { useUnlockImage } from "@/src/hooks/useUnlockImage";
import type { GalleryItemPublic } from "../../../types/gallery";

type Props = {
  images: GalleryItemPublic[];
  anfitrionaId?: string;
  onImageUnlocked?: (imageId: string) => void;
  readOnly?: boolean;
};

const ITEM_GAP = 12;
const SIDE_PEEK = 28;

// ─── Card individual del carrusel ────────────────────────────────────────────

function GalleryCarouselItem({
  item,
  itemWidth,
  onPress,
  onUnlock,
  isUnlocking,
  readOnly,
}: {
  item: GalleryItemPublic;
  itemWidth: number;
  onPress: () => void;
  onUnlock: () => void;
  isUnlocking: boolean;
  readOnly: boolean;
}) {
  const itemHeight = itemWidth * 1.35;
  const isLocked = item.isPremium && !item.isUnlockedByViewer;

  return (
    <TouchableOpacity
      activeOpacity={isLocked ? 1 : 0.9}
      onPress={isLocked ? undefined : onPress}
      style={{
        width: itemWidth,
        height: itemHeight,
        marginHorizontal: ITEM_GAP / 2,
        borderRadius: 20,
        overflow: "hidden",
        backgroundColor: "#111",
      }}
    >
      {isLocked ? (
        // ── Imagen premium bloqueada: overlay con botón de desbloqueo ─────────
        <PremiumOverlay
          unlockCredits={item.unlockCredits}
          isUnlocking={isUnlocking}
          onUnlock={onUnlock}
          readOnly={readOnly}
        />
      ) : (
        // ── Imagen visible (normal o premium ya desbloqueada) ─────────────────
        <Image
          source={{ uri: item.imageUrl }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      )}
    </TouchableOpacity>
  );
}

// ─── Visor fullscreen (solo para imágenes visibles) ───────────────────────────

function GalleryViewer({
  item,
  onClose,
}: {
  item: GalleryItemPublic;
  onClose: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible transparent={false} animationType="fade" statusBarTranslucent>
      <StatusBar hidden />
      <View
        style={{
          flex: 1,
          backgroundColor: "black",
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        <TouchableOpacity
          onPress={onClose}
          style={{
            position: "absolute",
            top: insets.top + 10,
            right: 16,
            zIndex: 10,
            backgroundColor: "rgba(0,0,0,0.5)",
            padding: 8,
            borderRadius: 25,
          }}
        >
          <MaterialCommunityIcons name="close" size={26} color="white" />
        </TouchableOpacity>

        <TouchableWithoutFeedback onPress={onClose}>
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Image
              source={{ uri: item.imageUrl }}
              style={{ width, height: height * 0.85 }}
              resizeMode="contain"
            />
          </View>
        </TouchableWithoutFeedback>

        <View
          style={{
            paddingHorizontal: 20,
            paddingVertical: 14,
            backgroundColor: "rgba(0,0,0,0.85)",
            borderTopWidth: 1,
            borderTopColor: "#27272a",
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <MaterialCommunityIcons name="image-outline" size={16} color="#a1a1aa" />
          <Text style={{ color: "#a1a1aa", fontSize: 13 }}>Toca para cerrar</Text>
        </View>
      </View>
    </Modal>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function GallerySection({
  images,
  anfitrionaId = '',
  onImageUnlocked,
  readOnly = false,
}: Props) {
  const [selected, setSelected] = useState<GalleryItemPublic | null>(null);
  const { width } = useWindowDimensions();
  const { unlockImage, unlockingImageId } = useUnlockImage();

  if (images.length === 0) return null;

  const itemWidth = width - SIDE_PEEK * 2 - ITEM_GAP * 2;
  const snapInterval = itemWidth + ITEM_GAP;

  const premiumLockedCount = images.filter(
    (i) => i.isPremium && !i.isUnlockedByViewer,
  ).length;

  const handlePress = (item: GalleryItemPublic) => {
    // Solo abrir visor si la imagen es visible
    if (!item.isPremium || item.isUnlockedByViewer) setSelected(item);
  };

  return (
    <View style={{ marginTop: 28 }}>
      {/* Encabezado */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
          paddingHorizontal: 16,
        }}
      >
        <Text
          style={{
            color: "#9ca3af",
            fontSize: 12,
            fontWeight: "700",
            letterSpacing: 1.2,
          }}
        >
          MI GALERÍA
        </Text>

        {premiumLockedCount > 0 && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              backgroundColor: "#1c1c1c",
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: "#3f3f46",
            }}
          >
            <MaterialCommunityIcons name="lock" size={11} color="#ef4444" />
            <Text style={{ color: "#a1a1aa", fontSize: 11 }}>
              {premiumLockedCount} exclusiva
              {premiumLockedCount > 1 ? "s" : ""}
            </Text>
          </View>
        )}
      </View>

      {/* Carrusel */}
      <FlatList
        data={images}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        snapToInterval={snapInterval}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: SIDE_PEEK }}
        renderItem={({ item }) => (
          <GalleryCarouselItem
            item={item}
            itemWidth={itemWidth}
            onPress={() => handlePress(item)}
            onUnlock={() =>
              unlockImage(anfitrionaId, item.id, () =>
                onImageUnlocked?.(item.id),
              )
            }
            isUnlocking={unlockingImageId === item.id}
            readOnly={readOnly}
          />
        )}
      />

      {/* Visor fullscreen — solo imágenes visibles */}
      {selected && (
        <GalleryViewer item={selected} onClose={() => setSelected(null)} />
      )}
    </View>
  );
}
