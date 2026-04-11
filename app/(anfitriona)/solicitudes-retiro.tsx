import ScreenHeader from "@/src/components/Menu/ScreenHeader";
import { apiGetWithdrawalRequests, WithdrawalRequest } from "@/src/api/wallet";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { Clock, CheckCircle, XCircle, Banknote } from "lucide-react-native";

const RATE = 0.90;

function statusConfig(status: WithdrawalRequest["status"]) {
  switch (status) {
    case "PENDING":
      return { label: "Pendiente", color: "#f59e0b", Icon: Clock };
    case "APPROVED":
      return { label: "Aprobado", color: "#22c55e", Icon: CheckCircle };
    case "REJECTED":
      return { label: "Rechazado", color: "#ef4444", Icon: XCircle };
  }
}

function RequestCard({ req }: { req: WithdrawalRequest }) {
  const { label, color, Icon } = statusConfig(req.status);
  const date = new Date(req.createdAt).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <View className="bg-[#1a1a1a] rounded-2xl px-4 py-4 mb-3">
      {/* Top row */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <View className="w-9 h-9 rounded-xl bg-[#D11B1B] items-center justify-center">
            <Banknote size={18} color="#fff" />
          </View>
          <View>
            <Text className="text-white font-semibold text-sm">{req.bankName}</Text>
            <Text className="text-gray-400 text-xs">{req.accountNumber}</Text>
          </View>
        </View>
        {/* Status badge */}
        <View
          className="flex-row items-center rounded-full px-3 py-1 gap-1"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon size={12} color={color} />
          <Text style={{ color, fontSize: 11, fontWeight: "600" }}>{label}</Text>
        </View>
      </View>

      {/* Amounts */}
      <View className="flex-row justify-between items-end">
        <View>
          <Text className="text-gray-400 text-xs mb-0.5">Créditos</Text>
          <Text className="text-white font-bold">Cred/ {req.credits}</Text>
        </View>
        <View className="items-end">
          <Text className="text-gray-400 text-xs mb-0.5">A recibir</Text>
          <Text className="text-green-400 font-black text-lg">S/ {req.soles.toFixed(2)}</Text>
        </View>
      </View>

      <Text className="text-gray-500 text-xs mt-3">{date}</Text>
    </View>
  );
}

export default function SolicitudesRetiro() {
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const data = await apiGetWithdrawalRequests();
      setRequests(data);
    } catch {
      Alert.alert("Error", "No se pudieron cargar las solicitudes");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const pending = requests.filter((r) => r.status === "PENDING");
  const rest = requests.filter((r) => r.status !== "PENDING");

  return (
    <View className="flex-1 bg-black">
      <ScreenHeader title="Mis solicitudes" role="anfitriona" showBackButton />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#D11B1B" size="large" />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor="#D11B1B"
            />
          }
        >
          {requests.length === 0 ? (
            <View className="flex-1 items-center justify-center py-24">
              <Banknote size={52} color="#333" />
              <Text className="text-gray-500 mt-4 text-center">
                Aún no has hecho solicitudes de retiro.
              </Text>
            </View>
          ) : (
            <>
              {pending.length > 0 && (
                <>
                  <Text className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-3">
                    En proceso
                  </Text>
                  {pending.map((r) => <RequestCard key={r.id} req={r} />)}
                </>
              )}

              {rest.length > 0 && (
                <>
                  <Text className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-3 mt-4">
                    Historial
                  </Text>
                  {rest.map((r) => <RequestCard key={r.id} req={r} />)}
                </>
              )}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}
