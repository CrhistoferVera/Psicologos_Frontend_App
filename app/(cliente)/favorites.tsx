import React, { useEffect, useRef, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, RefreshControl, Image, TouchableOpacity } from "react-native";
import { Bookmark } from "lucide-react-native";
import { useRouter } from "expo-router";
import ScreenHeader from "@/src/components/Menu/ScreenHeader";
import { apiGetSavedAnfitrionas, apiToggleSavedAnfitriona } from "@/src/api/savedAnfitriona";
import { SavedAnfitriona } from "@/src/types/savedAnfitriona";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function Favorites() {
    const router = useRouter();
    const [anfitrionas, setAnfitrionas] = useState<SavedAnfitriona[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const nextCursor = useRef<string | null>(null);
    const hasMore = useRef(true);

    const load = async (reset = false) => {
        if (!reset && !hasMore.current) return;
        try {
            const cursor = reset ? undefined : (nextCursor.current ?? undefined);
            const res = await apiGetSavedAnfitrionas(cursor);
            setAnfitrionas((prev) => reset ? res.data : [...prev, ...res.data]);
            nextCursor.current = res.nextCursor;
            hasMore.current = !!res.nextCursor;
        } catch {
            // silencioso
        }
    };

    useEffect(() => {
        load(true).finally(() => setLoading(false));
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        hasMore.current = true;
        await load(true);
        setRefreshing(false);
    };

    const onEndReached = async () => {
        if (loadingMore || !hasMore.current) return;
        setLoadingMore(true);
        await load();
        setLoadingMore(false);
    };

    const handleUnsave = async (id: string) => {
        setAnfitrionas((prev) => prev.filter((a) => a.id !== id));
        try {
            await apiToggleSavedAnfitriona(id);
        } catch {
            await load(true);
        }
    };

    const renderItem = ({ item }: { item: SavedAnfitriona }) => (
        <TouchableOpacity
            onPress={() => router.push(`/(cliente)/anfitrionas/${item.id}/verperfil` as any)}
            activeOpacity={0.8}
            className="flex-row items-center bg-[#141414] rounded-[22px] border border-zinc-800/60 p-3 mb-3 gap-4"
            style={{ shadowColor: "#9d174d", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 }}
        >
            <View className="relative">
                <Image
                    source={{ uri: item.avatar ?? undefined }}
                    className="w-16 h-16 rounded-full"
                    style={{ borderWidth: 2, borderColor: item.isOnline ? "#9d174d" : "#A11B1B" }}
                />
                {item.isOnline && (
                    <View className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-500"
                        style={{ borderWidth: 2, borderColor: "#141414" }}
                    />
                )}
            </View>

            <View className="flex-1">
                <Text className="text-white font-bold text-[15px] tracking-wide">{item.name}</Text>
                <View className="flex-row items-center gap-2 mt-1">
                    <View className={`w-1.5 h-1.5 rounded-full ${item.isOnline ? "bg-green-500" : "bg-zinc-600"}`} />
                    <Text className={`text-xs ${item.isOnline ? "text-green-400" : "text-zinc-500"}`}>
                        {item.isOnline ? "En línea" : "Desconectada"}
                    </Text>
                    {item.rateCredits != null && (
                        <Text className="text-zinc-500 text-xs">·  {item.rateCredits} creditos/min</Text>
                    )}
                </View>
            </View>

            <TouchableOpacity onPress={() => handleUnsave(item.id)} className="items-center gap-1">
                <Bookmark size={28} color="#facc15" fill="#facc15" />
                <Text className="text-yellow-500 text-[10px] font-bold tracking-widest">SAVED</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-[#0f0f0f]">
            <ScreenHeader title="Favoritas" role="cliente" showBackButton />

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#A11B1B" />
                </View>
            ) : (
                <FlatList
                    data={anfitrionas}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100 }}
                    onEndReached={onEndReached}
                    onEndReachedThreshold={0.4}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A11B1B" />}
                    ListHeaderComponent={
                        <View className="mb-5">
                            <Text className="text-white text-[20px] font-black tracking-wide">Tus favoritas</Text>
                            <Text className="text-zinc-500 text-xs mt-1 tracking-widest uppercase">Oprime para ver el perfil</Text>
                        </View>
                    }
                    ListFooterComponent={
                        anfitrionas.length > 0 ? (
                            <View className="items-center opacity-40">
                                <MaterialCommunityIcons name="check-decagram-outline" size={16} color="#52525b" />
                                <Text className="text-zinc-500 text-[11px] uppercase tracking-[2px] mt-2">
                                    Faboritas completado
                                </Text>
                            </View>
                        ) : null
                    }

                    ListEmptyComponent={
                        <View className="items-center justify-center mt-20">
                            <Bookmark size={64} color="#27272a" />
                            <Text className="text-zinc-500 text-base mt-4 text-center px-10">
                                Aún no tienes anfitrionas guardadas.
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}
