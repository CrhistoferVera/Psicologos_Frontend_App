import { Anfitriona } from "@/src/types/anfitriona";
import { toggleAnfitrianaLike } from "@/src/services/hostesses";
import { apiToggleSavedAnfitriona } from "@/src/api/savedAnfitriona";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Bookmark, Diamond, Flame, Heart, MessageCircle } from "lucide-react-native";
import { useRef, useState } from "react";
import { Image, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";

type Props = {
  anfitriona: Anfitriona;
  height?: number;
};

export default function PostCard({ anfitriona, height }: Props) {
  const router = useRouter();
  const [liked, setLiked] = useState(anfitriona.isLiked ?? false);
  const [saved, setSaved] = useState(anfitriona.isFavorite ?? false);
  const isSaving = useRef(false);
  const [likes, setLikes] = useState(anfitriona.likesCount ?? 0);
  const { width: W, height: H } = useWindowDimensions();
  const cardHeight = height && height > 0 ? height : H;
  const isLiking = useRef(false);

  const handleLike = async () => {
    if (isLiking.current) return;
    isLiking.current = true;

    // Actualización optimista
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikes((c) => (wasLiked ? c - 1 : c + 1));

    try {
      const result = await toggleAnfitrianaLike(anfitriona.id);
      // Sincronizar con la respuesta real del servidor
      setLiked(result.liked);
      setLikes(result.likesCount);
    } catch {
      // Revertir si falla
      setLiked(wasLiked);
      setLikes((c) => (wasLiked ? c + 1 : c - 1));
    } finally {
      isLiking.current = false;
    }
  };

  const handleSave = async () => {
    if (isSaving.current) return;
    isSaving.current = true;

    const wasSaved = saved;
    setSaved(!wasSaved);

    try {
      const result = await apiToggleSavedAnfitriona(anfitriona.id);
      setSaved(result.saved);
    } catch {
      setSaved(wasSaved);
    } finally {
      isSaving.current = false;
    }
  };

  const handleProfilePress = () => {
    router.push(`/(cliente)/anfitrionas/${anfitriona.id}/verperfil` as any);
  };

  const handleChat = () => {
    router.push({
      pathname: "/(cliente)/chat/[conversationId]" as any,
      params: {
        conversationId: "new",
        otherUserId: anfitriona.id,
        otherUserName: anfitriona.username ?? anfitriona.name,
        otherUserAvatar: anfitriona.avatar ?? "",
      },
    });
  };

  const featuredImage = anfitriona.images?.[0] || null;

  return (
    <View style={{ width: W, height: cardHeight }}>
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={handleProfilePress}
        style={{ flex: 1 }}
      >
        {featuredImage ? (
          <Image
            source={{ uri: featuredImage }}
            style={{ position: "absolute", width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ position: "absolute", width: "100%", height: "100%", backgroundColor: "#1a0505" }} />
        )}
      </TouchableOpacity>

      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.85)"]}
        style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 220 }}
        pointerEvents="none"
      />


      <View style={{ position: "absolute", right: 10, bottom: 80, alignItems: "center" }}>


        <TouchableOpacity onPress={handleProfilePress} style={{ alignItems: "center", marginBottom: 22 }}>
          <View style={{ position: "relative" }}>
            <View style={{
              width: 50, height: 50, borderRadius: 25,
              borderWidth: 2, borderColor: "white", overflow: "hidden",
            }}>
              <Image
                source={anfitriona.avatar ? { uri: anfitriona.avatar } : require('../../../assets/no_image.jpg')}
                style={{ width: "100%", height: "100%" }}
              />
            </View>

            {anfitriona.isOnline && (
              <View style={{
                position: "absolute", bottom: 0, right: 0,
                width: 14, height: 14, borderRadius: 7,
                backgroundColor: "#ef4444",
                borderWidth: 2, borderColor: "#111",
              }} />
            )}
          </View>

          {anfitriona.isOnline && (
            <Text style={{ color: "#ef4444", fontSize: 10, marginTop: 3, fontWeight: "600" }}>
              En línea
            </Text>
          )}
        </TouchableOpacity>


        <TouchableOpacity onPress={() => { void handleLike(); }} style={{ alignItems: "center", marginBottom: 22 }}>
          <Heart
            size={34}
            color={liked ? "#ec4899" : "white"}
            fill={liked ? "#ec4899" : "transparent"}
          />
          <Text style={{ color: "white", fontSize: 12, marginTop: 3 }}>{likes}</Text>
        </TouchableOpacity>


        {anfitriona.isPopular && (
          <View style={{ alignItems: "center", marginBottom: 22 }}>
            <Flame size={32} color="#f97316" fill="#f97316" />
            <Text style={{ color: "white", fontSize: 12, marginTop: 3 }}>Popular</Text>
          </View>
        )}


        <TouchableOpacity onPress={() => { void handleSave(); }} style={{ alignItems: "center" }}>
          <Bookmark
            size={32}
            color={saved ? "#facc15" : "white"}
            fill={saved ? "#facc15" : "transparent"}
          />
          <Text style={{ color: "white", fontSize: 12, marginTop: 3 }}>Favoritos</Text>
        </TouchableOpacity>
      </View>


      <View style={{ position: "absolute", bottom: 76, left: 12, right: 80 }}>
        <Text style={{ color: "white", fontWeight: "bold", fontSize: 18 }}>
          @{anfitriona.username ?? anfitriona.name}
        </Text>
        <Text style={{ color: "#e5e7eb", fontSize: 13, marginTop: 4 }}>
          {anfitriona.shortDescription}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, gap: 12 }}>
          <Text style={{ color: "#9ca3af", fontSize: 12 }}>Desde</Text>
          <Text style={{ color: "white", fontSize: 13 }}>
            {anfitriona.solPrice != null ? `${anfitriona.solPrice} sol / ` : ""}{anfitriona.credits} cred
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Diamond size={12} color="#38bdf8" fill="#38bdf8" />
            <Text style={{ color: "white", fontSize: 13 }}>{anfitriona.credits}</Text>
          </View>
        </View>
      </View>

      {/* Botón Chatear ahora — ancho completo */}
      <TouchableOpacity
        onPress={handleChat}
        activeOpacity={0.85}
        style={{
          position: "absolute",
          bottom: 20,
          left: 12,
          right: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#D11B1B",
          borderRadius: 999,
          paddingVertical: 12,
          gap: 7,
          shadowColor: "#D11B1B",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.45,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        <MessageCircle size={17} color="white" fill="white" />
        <Text style={{ color: "white", fontWeight: "800", fontSize: 15, letterSpacing: 0.3 }}>
          Chatear ahora
        </Text>
      </TouchableOpacity>
    </View>
  );
}
