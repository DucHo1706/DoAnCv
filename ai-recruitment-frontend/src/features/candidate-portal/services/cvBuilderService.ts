import axiosClient from "../../../services/axiosClient";

export interface CvBuilderDocumentSummary {
  id: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CvBuilderDocumentDetail<TContent = Record<string, unknown>, TSettings = Record<string, unknown>>
  extends CvBuilderDocumentSummary {
  content: TContent;
  settings: TSettings;
}

export const cvBuilderService = {
  async getAll(): Promise<CvBuilderDocumentSummary[]> {
    const response = await axiosClient.get<CvBuilderDocumentSummary[]>("/cv-builder-documents");
    return response.data;
  },

  async getById<TContent, TSettings>(id: string): Promise<CvBuilderDocumentDetail<TContent, TSettings>> {
    const response = await axiosClient.get<CvBuilderDocumentDetail<TContent, TSettings>>(`/cv-builder-documents/${id}`);
    return response.data;
  },

  async create<TContent, TSettings>(name: string, content: TContent, settings: TSettings) {
    const response = await axiosClient.post("/cv-builder-documents", { name, content, settings });
    return response.data as CvBuilderDocumentDetail<TContent, TSettings>;
  },

  async update<TContent, TSettings>(id: string, name: string, content: TContent, settings: TSettings) {
    const response = await axiosClient.put(`/cv-builder-documents/${id}`, { name, content, settings });
    return response.data as CvBuilderDocumentDetail<TContent, TSettings>;
  },

  async setDefault(id: string): Promise<void> {
    await axiosClient.put(`/cv-builder-documents/${id}/default`);
  },

  async remove(id: string): Promise<void> {
    await axiosClient.delete(`/cv-builder-documents/${id}`);
  },
};
