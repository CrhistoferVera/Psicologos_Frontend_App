import apiClient from "../../../api/client";
import { Environment } from "../../../types/environment.type";

export async function getEnvironments(): Promise<Environment[]> {
  const response = await apiClient.get("/professionals/me/environments");
  return response.data;
}

export async function getEnvironmentsByProfessionalId(professionalId: string): Promise<Environment[]> {
  const response = await apiClient.get(`/professionals/public/${professionalId}/environments`);
  return response.data;
}

export async function addEnvironment(file: {
  uri: string;
  name: string;
  type: string;
}): Promise<Environment> {
  const formData = new FormData();
  formData.append("file", file as any);
  const response = await apiClient.post("/professionals/me/environments", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 300000,
  });
  return response.data;
}

export async function deleteEnvironment(id: string): Promise<Environment> {
  const response = await apiClient.delete(`/professionals/me/environments/${id}`);
  return response.data;
}
