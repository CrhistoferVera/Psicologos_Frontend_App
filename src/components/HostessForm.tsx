import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import type { HostessForm, IdentityFile } from "../types/hostess";
import PrimaryButton from "@/src/components/PrimaryButton";
import HeaderBack from "./HeaderBack";

type HostessFormProps = {
  form: HostessForm;
  onChange: (key: keyof HostessForm, value: string) => void;
  onPickIdDoc: () => void;
  idDocFile: IdentityFile | null;
  error: string;
  success: string;
  loading: boolean;
  onSubmit: () => void;
};

export default function HostessFormComponent({
  form,
  onChange,
  onPickIdDoc,
  idDocFile,
  error,
  success,
  loading,
  onSubmit,
}: HostessFormProps) {
  return (
    <View className="pt-10">
      <HeaderBack href="/admin" title="Crear anfitriona" />
      <View className="mt-4">
        <Text className="text-white text-3xl font-bold">
          Crear anfitriona
        </Text>
        <Text className="text-white/70 text-base mt-2">
          Completa los datos para habilitar el perfil y acceso en la plataforma.
        </Text>
      </View>

      <View className="mt-4 rounded-full self-start bg-white/10 px-3 py-1">
        <Text className="text-white/80 text-xs uppercase tracking-widest">
          Campos obligatorios
        </Text>
      </View>

      <View className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-4">
        <Text className="text-white/70 text-xs uppercase tracking-widest">
          Datos personales
        </Text>

        <Text className="text-white mt-4">Nombre</Text>
        <TextInput
          className="bg-white/10 rounded-2xl p-3 mt-2 text-white"
          placeholder="Nombre"
          placeholderTextColor="#c9c9c9"
          value={form.firstName}
          onChangeText={(text) => onChange("firstName", text)}
        />

        <Text className="text-white mt-4">Apellidos</Text>
        <TextInput
          className="bg-white/10 rounded-2xl p-3 mt-2 text-white"
          placeholder="Apellidos"
          placeholderTextColor="#c9c9c9"
          value={form.lastName}
          onChangeText={(text) => onChange("lastName", text)}
        />

        <View className="flex-row gap-3 mt-4">
          <View className="flex-1">
            <Text className="text-white">Telefono</Text>
            <TextInput
              className="bg-white/10 rounded-2xl p-3 mt-2 text-white"
              placeholder="Telefono"
              placeholderTextColor="#c9c9c9"
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(text) => onChange("phone", text)}
            />
          </View>

          <View className="flex-1">
            <Text className="text-white">Fecha de nacimiento</Text>
            <TextInput
              className="bg-white/10 rounded-2xl p-3 mt-2 text-white"
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#c9c9c9"
              value={form.dateOfBirth}
              onChangeText={(text) => onChange("dateOfBirth", text)}
            />
          </View>
        </View>
        <Text className="text-white/50 text-xs mt-2">
          Usa el formato YYYY-MM-DD.
        </Text>
      </View>

      <View className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4">
        <Text className="text-white/70 text-xs uppercase tracking-widest">
          Identidad y acceso
        </Text>

        <Text className="text-white mt-4">Nombre de usuario</Text>
        <TextInput
          className="bg-white/10 rounded-2xl p-3 mt-2 text-white"
          placeholder="Nombre de usuario"
          placeholderTextColor="#c9c9c9"
          value={form.username}
          onChangeText={(text) => onChange("username", text)}
        />

        <Text className="text-white mt-4">Correo electrónico</Text>
        <TextInput
          className="bg-white/10 rounded-2xl p-3 mt-2 text-white"
          placeholder="correo@ejemplo.com"
          placeholderTextColor="#c9c9c9"
          keyboardType="email-address"
          autoCapitalize="none"
          value={form.email}
          onChangeText={(text) => onChange("email", text)}
        />

        <Text className="text-white mt-4">Contraseña</Text>
        <TextInput
          className="bg-white/10 rounded-2xl p-3 mt-2 text-white"
          placeholder="Mínimo 6 caracteres"
          placeholderTextColor="#c9c9c9"
          secureTextEntry
          value={form.password}
          onChangeText={(text) => onChange("password", text)}
        />

        <Text className="text-white mt-4">Documento de identidad</Text>
        <TextInput
          className="bg-white/10 rounded-2xl p-3 mt-2 text-white"
          placeholder="DNI o cedula"
          placeholderTextColor="#c9c9c9"
          value={form.identityNumber}
          onChangeText={(text) => onChange("identityNumber", text)}
        />

        <Pressable
          className="bg-[#8B0000] rounded-2xl p-3 mt-4"
          onPress={onPickIdDoc}
        >
          <Text className="text-white text-center font-bold">Subir DNI</Text>
        </Pressable>

        {idDocFile ? (
          <View className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
            <Text className="text-white/80 text-xs">
              Archivo seleccionado
            </Text>
            <Text className="text-white text-sm mt-1">{idDocFile.name}</Text>
          </View>
        ) : null}
      </View>

      {error ? (
        <View className="mt-4 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3">
          <Text className="text-red-300 text-sm">{error}</Text>
        </View>
      ) : null}

      {success ? (
        <View className="mt-4 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3">
          <Text className="text-emerald-300 text-sm">{success}</Text>
        </View>
      ) : null}

      <PrimaryButton
        title={loading ? "Creando..." : "Crear anfitriona"}
        onPress={onSubmit}
        disabled={loading}
        className="mt-5"
      />
    </View>
  );
}
