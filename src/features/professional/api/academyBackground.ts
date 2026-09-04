import apiClient from "../../../api/client";
import { AcademyBackground } from "../../../types/academyBackground.type";
import { AddAcademyBackground } from "../../../types/addAcademyBackground.type";
import { UpdateAcademyBackground } from "../../../types/updateAcademyBackground.type";

// API PARA OBTENER LOS ANTECEDENTES ACADEMICOS DE UN PROFESIONAL
export async function getAcademyBackgrounds(): Promise<AcademyBackground[]> {
    const response = await apiClient.get("/professionals/me/academy-background");
    return response.data;
}

// API PARA AGREGAR UN NUEVO ANTECEDENTE ACADEMICO DE UN PROFESIONAL
export async function addAcademyBackground(data: AddAcademyBackground): Promise<AcademyBackground> {
    const response = await apiClient.post("/professionals/me/academy-background", data);
    return response.data;
}

// API PARA ACTUALIZAR UN ANTECEDENTE ACADEMICO DE UN PROFESIONAL
export async function updateAcademyBackground(id: string, data: UpdateAcademyBackground): Promise<AcademyBackground> {
    const response = await apiClient.patch(`/professionals/me/academy-background/${id}`, data);
    return response.data;
}

// API PARA ELIMINAR UN ANTECEDENTE ACADEMICO DE UN PROFESIONAL
export async function deleteAcademyBackground(id: string): Promise<AcademyBackground> {
    const response = await apiClient.delete(`/professionals/me/academy-background/${id}`);
    return response.data;
}
