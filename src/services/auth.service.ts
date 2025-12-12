import {apiClient} from "./api.client";

export interface User {
  id: string;
  name: string;
  email: string;
  school_id: string | null;
  is_admin: boolean;
}

export interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    user: User;
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

export const authService = {
  login: async (
    email: string,
    password: string
  ): Promise<LoginResponse["data"]> => {
    const response = await apiClient.post<LoginResponse>("/auth/login", {
      email,
      password,
    });
    return response.data.data;
  },

  register: async (
    name: string,
    email: string,
    password: string
  ): Promise<RegisterResponse["data"]> => {
    const response = await apiClient.post<RegisterResponse>("/auth/register", {
      name,
      email,
      password,
    });
    return response.data.data;
  },

  registerSchool: async (
    schoolName: string,
    address: string,
    phone: string
  ) => {
    const response = await apiClient.post("/school/register", {
      school_name: schoolName,
      address,
      phone,
    });
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await apiClient.post("/auth/forgot-password", {
      email,
    });
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<{data: User}>("/auth/me");
    return response.data.data;
  },

  resetPassword: async (token: string, password: string) => {
    const response = await apiClient.post("/auth/reset-password", {
      token,
      password,
    });
    return response.data;
  },

  verifyResetToken: async (token: string) => {
    const response = await apiClient.get(`/auth/reset-password?token=${token}`);
    return response.data;
  },
};
