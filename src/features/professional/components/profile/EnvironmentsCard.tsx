import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  LayoutChangeEvent,
  Modal,
  Pressable,
  StatusBar,
  Text,
  View,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { Environment } from "../../../../types/environment.type";
import { addEnvironment, deleteEnvironment, getEnvironments } from "../../api/environments";
import SectionCard from "./SectionCard";

const PREVIEW_LIMIT = 6;
const GAP = 8;
const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;

function ImageViewer({
  images,
  initialIndex,
  onClose,
}: {
  images: Environment[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index: initialIndex, animated: false });
    }, 50);
  }, []);

  function handleClose() {
    Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(onClose);
  }

  return (
    <Modal visible transparent animationType="none" onRequestClose={handleClose}>
      <StatusBar hidden />
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: "#000",
          opacity: fadeAnim,
        }}
      >
        {/* Header */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingTop: 52,
            paddingBottom: 12,
          }}
        >
          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
            {currentIndex + 1} / {images.length}
          </Text>
          <Pressable
            onPress={handleClose}
            hitSlop={12}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(255,255,255,0.12)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="close" size={20} color="#fff" />
          </Pressable>
        </View>

        {/* Images */}
        <FlatList
          ref={flatListRef}
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setCurrentIndex(index);
          }}
          renderItem={({ item, index }) => (
            <View style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT, justifyContent: "center" }}>
              {item.resourceType === 'video' ? (
                <Video
                  source={{ uri: item.ImageUrl }}
                  style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.75 }}
                  resizeMode={ResizeMode.CONTAIN}
                  useNativeControls
                  shouldPlay={index === currentIndex}
                />
              ) : (
                <Image
                  source={{ uri: item.ImageUrl }}
                  style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.75 }}
                  resizeMode="contain"
                />
              )}
            </View>
          )}
        />

        {/* Dots */}
        {images.length > 1 && (
          <View
            style={{
              position: "absolute",
              bottom: 40,
              left: 0,
              right: 0,
              flexDirection: "row",
              justifyContent: "center",
              gap: 6,
            }}
          >
            {images.map((_, i) => (
              <View
                key={i}
                style={{
                  width: i === currentIndex ? 18 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: i === currentIndex ? "#fff" : "rgba(255,255,255,0.35)",
                }}
              />
            ))}
          </View>
        )}
      </Animated.View>
    </Modal>
  );
}

export default function EnvironmentsCard() {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const imgSize = containerWidth > 0 ? (containerWidth - GAP * 2) / 3 : 0;
  const visible = expanded ? environments : environments.slice(0, PREVIEW_LIMIT);
  const hasMore = environments.length > PREVIEW_LIMIT;

  useEffect(() => {
    getEnvironments()
      .then(setEnvironments)
      .catch(() => setEnvironments([]))
      .finally(() => setLoading(false));
  }, []);

  function onLayout(e: LayoutChangeEvent) {
    setContainerWidth(e.nativeEvent.layout.width);
  }

  async function pickAndUpload() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    const isVideo = asset.type === 'video';
    const ext = asset.uri.split(".").pop() ?? (isVideo ? 'mp4' : 'jpg');
    const mimeType = isVideo ? `video/${ext}` : `image/${ext}`;

    setUploading(true);
    try {
      const created = await addEnvironment({
        uri: asset.uri,
        name: `env_${Date.now()}.${ext}`,
        type: mimeType,
      });
      setEnvironments((prev) => [...prev, created]);
    } catch {
      Alert.alert("Error", "No se pudo subir el archivo.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    Alert.alert("Eliminar imagen", "¿Estás seguro?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteEnvironment(id);
            setEnvironments((prev) => prev.filter((e) => e.id !== id));
            setViewerIndex(null);
          } catch {
            Alert.alert("Error", "No se pudo eliminar la imagen.");
          }
        },
      },
    ]);
  }

  return (
    <>
      <SectionCard
        title="Ambiente de trabajo"
        action={
          uploading ? (
            <ActivityIndicator size="small" color="#5B9BD5" />
          ) : (
            <Pressable hitSlop={6} onPress={() => void pickAndUpload()}>
              <Text className="text-[#5B9BD5] font-body text-[13px] font-semibold">+ Agregar</Text>
            </Pressable>
          )
        }
      >
        {loading ? (
          <ActivityIndicator size="small" color="#5B9BD5" />
        ) : environments.length === 0 ? (
          <Text className="text-[#5F7896] font-body text-sm leading-[22px]">
            Agrega fotos de tu espacio de trabajo para que los clientes conozcan tu ambiente.
          </Text>
        ) : (
          <View onLayout={onLayout}>
            {imgSize > 0 && (
              <>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: GAP }}>
                  {visible.map((env, index) => (
                    <Pressable
                      key={env.id}
                      style={{ position: "relative", width: imgSize, height: imgSize }}
                      onPress={() => setViewerIndex(index)}
                    >
                      {env.resourceType === 'video' ? (
                        <Video
                          source={{ uri: env.ImageUrl }}
                          style={{ width: imgSize, height: imgSize, borderRadius: 10 }}
                          resizeMode={ResizeMode.COVER}
                          isMuted
                        />
                      ) : (
                        <Image
                          source={{ uri: env.ImageUrl }}
                          style={{ width: imgSize, height: imgSize, borderRadius: 10 }}
                          resizeMode="cover"
                        />
                      )}
                      {env.resourceType === 'video' && (
                        <View style={{
                          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                          alignItems: 'center', justifyContent: 'center', borderRadius: 10,
                        }}>
                          <Ionicons name="play-circle" size={28} color="rgba(255,255,255,0.85)" />
                        </View>
                      )}
                      <Pressable
                        style={{
                          position: "absolute",
                          top: 5,
                          right: 5,
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          backgroundColor: "rgba(0,0,0,0.45)",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        accessibilityRole="button"
                        onPress={() => void handleDelete(env.id)}
                      >
                        <Ionicons name="close" size={13} color="#fff" />
                      </Pressable>
                    </Pressable>
                  ))}
                </View>

                {hasMore && (
                  <Pressable
                    onPress={() => setExpanded((prev) => !prev)}
                    style={{
                      marginTop: 12,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                      paddingVertical: 8,
                      borderRadius: 10,
                      backgroundColor: "#F0F6FF",
                    }}
                  >
                    <Text style={{ color: "#5B9BD5", fontSize: 13, fontWeight: "600" }}>
                      {expanded ? "Ver menos" : `Ver más · ${environments.length - PREVIEW_LIMIT} fotos`}
                    </Text>
                    <Ionicons
                      name={expanded ? "chevron-up" : "chevron-down"}
                      size={14}
                      color="#5B9BD5"
                    />
                  </Pressable>
                )}
              </>
            )}
          </View>
        )}
      </SectionCard>

      {viewerIndex !== null && (
        <ImageViewer
          images={environments}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </>
  );
}
