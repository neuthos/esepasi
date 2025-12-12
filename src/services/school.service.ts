export interface School {
  id: string;
  name: string;
  code: string;
  address: string;
  logo_url: string;
}

export interface UpdateSchoolPayload {
  name: string;
  code: string;
  address: string;
  logo_url?: string;
}

// Mock Data Removed

import {apiClient} from "./api.client";
import axios from "axios";

export const schoolService = {
  getSchoolDetailsQuery: "GET_SCHOOL_DETAILS",

  getSchoolDetails: async (): Promise<School> => {
    const response = await apiClient.get("/school");
    return response.data.data;
  },

  updateSchoolDetails: async (
    payload: UpdateSchoolPayload
  ): Promise<{success: boolean; message: string}> => {
    const response = await apiClient.put("/school", payload);
    return response.data;
  },

  uploadLogo: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const url = process.env.NEXT_PUBLIC_CDN_URL || "";
    const response = await axios.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (response.data && response.data.imageurl) {
      return response.data.imageurl;
    }
    return response.data;
  },
};
