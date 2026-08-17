import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  label?: string;
  value: string; // "YYYY-MM-DD"
  onChange: (date: string) => void;
  placeholder?: string;
};

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const WEEKDAYS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];

const pad = (n: number) => String(n).padStart(2, "0");
const format = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

function parse(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]) - 1, d: Number(match[3]) };
}

export default function BirthDatePicker({ label, value, onChange, placeholder = "Selecciona tu fecha" }: Props) {
  const parsed = parse(value);
  const today = new Date();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"days" | "years">("days");
  const [viewYear, setViewYear] = useState(parsed?.y ?? 2000);
  const [viewMonth, setViewMonth] = useState(parsed?.m ?? 0);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const years = Array.from({ length: 101 }, (_, i) => today.getFullYear() - i);

  function moveMonth(delta: number) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewMonth(m);
    setViewYear(y);
  }

  function selectDay(day: number) {
    onChange(format(viewYear, viewMonth, day));
    setOpen(false);
    setMode("days");
  }

  return (
    <View>
      {label ? <Text className="text-[#020617] font-body text-[13px] font-semibold mb-[7px]">{label}</Text> : null}

      <Pressable
        className="flex-row items-center justify-between min-h-[50px] rounded-xl border-[1.5px] border-[#E2E8F0] bg-[#F8FAFF] px-[14px]"
        onPress={() => setOpen(true)}
      >
        <Text className={`font-body text-sm ${value ? "text-[#020617]" : "text-[#A0AEC0]"}`}>
          {value || placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={18} color="#475569" />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-[rgba(15,23,42,0.35)] justify-center px-5" onPress={() => setOpen(false)}>
          <Pressable className="rounded-[18px] bg-white border border-[#CBD5E1] p-4" onPress={(e) => e.stopPropagation()}>
            <View className="flex-row items-center justify-between mb-3">
              <Pressable hitSlop={10} onPress={() => moveMonth(-1)} disabled={mode === "years"}>
                <Ionicons name="chevron-back" size={22} color={mode === "years" ? "#CBD5E1" : "#020617"} />
              </Pressable>

              <Pressable onPress={() => setMode(mode === "days" ? "years" : "days")}>
                <Text className="text-[#020617] font-heading text-base font-bold">
                  {MONTHS[viewMonth]} {viewYear}
                </Text>
              </Pressable>

              <Pressable hitSlop={10} onPress={() => moveMonth(1)} disabled={mode === "years"}>
                <Ionicons name="chevron-forward" size={22} color={mode === "years" ? "#CBD5E1" : "#020617"} />
              </Pressable>
            </View>

            {mode === "years" ? (
              <ScrollView className="max-h-[320px]" showsVerticalScrollIndicator={false}>
                <View className="flex-row flex-wrap">
                  {years.map((year) => {
                    const active = year === viewYear;
                    return (
                      <Pressable
                        key={year}
                        className={`w-1/3 py-3 items-center rounded-lg ${active ? "bg-[#EEF5FF]" : ""}`}
                        onPress={() => {
                          setViewYear(year);
                          setMode("days");
                        }}
                      >
                        <Text className={`font-body text-sm ${active ? "text-[#5B9BD5] font-bold" : "text-[#020617]"}`}>
                          {year}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            ) : (
              <>
                <View className="flex-row">
                  {WEEKDAYS.map((wd) => (
                    <Text key={wd} className="flex-1 text-center text-[#64748B] font-body text-xs font-semibold">
                      {wd}
                    </Text>
                  ))}
                </View>

                <View className="flex-row flex-wrap mt-1">
                  {cells.map((day, index) => {
                    const selected = !!parsed && day === parsed.d && viewMonth === parsed.m && viewYear === parsed.y;
                    const isFuture =
                      day != null &&
                      new Date(viewYear, viewMonth, day).getTime() > today.getTime();
                    return (
                      <View key={index} className="w-[14.28%] items-center py-1">
                        {day == null ? (
                          <View className="w-9 h-9" />
                        ) : (
                          <Pressable
                            className={`w-9 h-9 items-center justify-center rounded-full ${selected ? "bg-[#5B9BD5]" : ""}`}
                            disabled={isFuture}
                            onPress={() => selectDay(day)}
                          >
                            <Text
                              className={`font-body text-sm ${
                                selected ? "text-white font-bold" : isFuture ? "text-[#CBD5E1]" : "text-[#020617]"
                              }`}
                            >
                              {day}
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
