import apiClient from "../../../api/client";
import type { Professional, ProfessionalPriceMap } from "../types";

type ListResponse = {
  data?: any[];
  total?: number;
};

const fallbackProfessionals: Professional[] = [
  {
    id: "mock-1",
    name: "Dra. Camila Ríos",
    username: "camilarios",
    avatar: "",
    bio: "Psicóloga clínica enfocada en ansiedad y gestión emocional.",
    specialties: ["Ansiedad", "Autoestima"],
    isOnline: true,
    rating: 4.9,
    prices: { chat: 25, call: 40, video: 55 },
  },
  {
    id: "mock-2",
    name: "Lic. José Méndez",
    username: "josemendez",
    avatar: "",
    bio: "Especialista en terapia de pareja y comunicación saludable.",
    specialties: ["Terapia de pareja", "Comunicación"],
    isOnline: false,
    rating: 4.7,
    prices: { chat: 22, call: 35, video: 50 },
  },
];

function parseSpecialties(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (typeof item === "string") return item;
        if (typeof item?.name === "string") return item.name;
        if (typeof item?.label === "string") return item.label;
        return null;
      })
      .filter(Boolean) as string[];
  }
  if (typeof raw === "string") return [raw];
  return [];
}

function parsePricesFromServicePrices(servicePrices: any[] | undefined): ProfessionalPriceMap {
  if (!Array.isArray(servicePrices)) return {};
  const prices: ProfessionalPriceMap = {};
  for (const item of servicePrices) {
    const type = String(item?.serviceType ?? "").toUpperCase();
    const price = Number(item?.price ?? 0);
    if (!Number.isFinite(price)) continue;
    if (type === "MESSAGE" || type === "MESSAGE_SEND" || type === "CHAT") prices.chat = price;
    if (type === "CALL") prices.call = price;
    if (type === "VIDEO_CALL" || type === "VIDEO") prices.video = price;
  }
  return prices;
}

function mapRawProfessional(item: any): Professional {
  const basePrice = Number(item?.rateCredits ?? item?.credits ?? 0);
  return {
    id: String(item?.id ?? ""),
    name: String(item?.name ?? item?.fullName ?? "Professional"),
    username: item?.username ?? undefined,
    avatar: item?.avatar ?? item?.avatarUrl ?? "",
    bio: String(item?.bio ?? item?.shortDescription ?? "Perfil profesional disponible."),
    specialties: parseSpecialties(item?.specialties ?? item?.tags ?? item?.specialty),
    isOnline: Boolean(item?.isOnline ?? false),
    rating: typeof item?.rating === "number" ? item.rating : undefined,
    prices: {
      chat: basePrice > 0 ? basePrice : undefined,
    },
  };
}

async function tryGet<T>(url: string, params?: Record<string, unknown>): Promise<T | null> {
  try {
    const response = await apiClient.get(url, { params });
    return response.data as T;
  } catch (error: any) {
    if (error?.response?.status === 404) return null;
    throw error;
  }
}

export async function getProfessionals(search?: string): Promise<Professional[]> {
  const params = search ? { search, q: search } : undefined;
  const response =
    (await tryGet<ListResponse>("/professionals/public", params)) ??
    (await tryGet<ListResponse>("/anfitrionas/public", params));

  if (!response) return fallbackProfessionals;

  const list = Array.isArray(response?.data) ? response.data : Array.isArray(response as any) ? (response as any) : [];
  const normalized = list.map(mapRawProfessional).filter((item) => item.id);
  return normalized.length > 0 ? normalized : fallbackProfessionals;
}

export async function getProfessionalById(id: string): Promise<Professional> {
  const response =
    (await tryGet<any>(`/professionals/public/${id}`)) ??
    (await tryGet<any>(`/professionals/${id}`)) ??
    (await tryGet<any>(`/anfitrionas/public/${id}`));

  if (!response) {
    const fallback = fallbackProfessionals.find((item) => item.id === id);
    if (fallback) return fallback;
    return { ...fallbackProfessionals[0], id };
  }

  const professional = mapRawProfessional(response);
  const servicePrices = await tryGet<any[]>(`/service-prices/public/${professional.id}`);
  const mergedPrices = {
    ...professional.prices,
    ...parsePricesFromServicePrices(servicePrices ?? undefined),
  };
  return { ...professional, prices: mergedPrices };
}

export async function getSpecialtiesCatalog(): Promise<string[]> {
  const specialtiesResponse =
    (await tryGet<any[]>("/specialties/public")) ??
    (await tryGet<any[]>("/specialties"));

  if (specialtiesResponse && Array.isArray(specialtiesResponse) && specialtiesResponse.length > 0) {
    const names = specialtiesResponse
      .map((item) => (typeof item === "string" ? item : item?.name ?? item?.label))
      .filter(Boolean) as string[];
    return Array.from(new Set(names));
  }

  const fromProfessionals = await getProfessionals();
  const combined = fromProfessionals.flatMap((item) => item.specialties);
  const unique = Array.from(new Set(combined));
  return unique.length > 0 ? unique : ["Ansiedad", "Depresión", "Terapia de pareja", "Autoestima"];
}

