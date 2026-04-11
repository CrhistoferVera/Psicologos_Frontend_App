import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ScreenHeader from "@/src/components/Menu/ScreenHeader";
import { apiGetExpenseHistory } from "@/src/api/userProfile"; // Ajusta la ruta según tu proyecto
import { ExpenseHistoryItem } from "@/src/types/userProfile";

export default function Historial() {
  const [history, setHistory] = useState<ExpenseHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    const response = await apiGetExpenseHistory();
    if (response.success) {
      setHistory(response.data);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const tipoConfig: Record<string, { icon: string; bg: string; color: string }> = {
    DEPOSIT: { icon: 'wallet-plus-outline', bg: 'bg-emerald-500/10', color: '#10b981' },
    MESSAGE_UNLOCK: { icon: 'message-text-outline', bg: 'bg-blue-500/10', color: '#3b82f6' },
    IMAGE_UNLOCK: { icon: 'image-outline', bg: 'bg-purple-500/10', color: '#a855f7' },
    CALL_PAYMENT: { icon: 'phone-outline', bg: 'bg-orange-500/10', color: '#f97316' },
    EARNING: { icon: 'cash-plus', bg: 'bg-yellow-500/10', color: '#eab308' },
  };

  const renderItem = ({ item }: { item: ExpenseHistoryItem }) => {
    const isDeposit = item.tipo === 'DEPOSIT';
    const rawMonto = item.monto as any;
    const monto = typeof rawMonto === 'object' && rawMonto?.d ? rawMonto.d[0] : parseFloat(String(rawMonto ?? 0));
    const config = tipoConfig[item.tipo] ?? { icon: 'swap-horizontal', bg: 'bg-zinc-800', color: '#a1a1aa' };

    return (
      <View
        style={{ backgroundColor: '#1A0A0A', shadowColor: '#A11B1B', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 8, borderWidth: 1, borderColor: 'rgba(161,27,27,0.4)' }}
        className="flex-row items-center justify-between p-5 mb-3 rounded-[22px]"
      >
        <View className="flex-row items-center flex-1">
          <View className={`w-12 h-12 rounded-full items-center justify-center ${config.bg}`}>
            <MaterialCommunityIcons
              name={config.icon as any}
              size={24}
              color={config.color}
            />
          </View>

          <View className="ml-4 flex-1">
            <Text className="text-white font-semibold text-sm" numberOfLines={1}>
              {item.detalle}
            </Text>
            <Text className="text-zinc-500 text-xs mt-1">
              {new Date(item.fecha).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        </View>

        <View className="items-end ml-3">
          <Text className={`font-black text-lg ${isDeposit ? 'text-emerald-400' : 'text-red-500'}`}>
            {isDeposit ? '+' : '-'}{isNaN(monto) ? '0.00' : monto.toFixed(2)}
          </Text>
          <Text className="text-[10px] text-green-700 uppercase font-bold tracking-widest">
            créditos
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0f0f0f" }}>
      <ScreenHeader title="Historial" role="cliente" showBackButton />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 12, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
          }
          ListHeaderComponent={
            history.length > 0 ? (
              <Text className="text-white text-[20px] font-black tracking-wide mb-4">Historial de entradas y salidas</Text>
            ) : null
          }
          ListFooterComponent={
            history.length > 0 ? (
              <View className="items-center  opacity-40">
                <MaterialCommunityIcons name="check-decagram-outline" size={16} color="#52525b" />
                <Text className="text-zinc-500 text-[11px] uppercase tracking-[2px] mt-2">
                  Historial completado
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center justify-center mt-20">
              <MaterialCommunityIcons name="history" size={64} color="#27272a" />
              <Text className="text-zinc-500 text-lg mt-4 text-center px-10">
                Aún no tienes movimientos en tu cuenta.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}