export interface AdminUser {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  is_super_admin: boolean;
  role: string;
}

import {apiClient} from "./api.client";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  is_super_admin: boolean;
  role: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password?: string;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  password?: string;
  is_active?: boolean;
}

export const userService = {
  getUsers: async (): Promise<AdminUser[]> => {
    const response = await apiClient.get("/users");
    // Transform or map if necessary, but backend should return compatible structure
    // Backend returns `is_super_admin`, frontend expects it. `role` might need derivation if not in DB.
    // Our userService backend returns flat user object. We might need to map `role` manually or just use `is_super_admin`.
    return response.data.data.map((u: any) => ({
      ...u,
      role: u.is_super_admin ? "Super Admin" : "Admin",
    }));
  },

  createUser: async (payload: CreateUserPayload): Promise<void> => {
    await apiClient.post("/users", payload);
  },

  updateUser: async (id: string, payload: UpdateUserPayload): Promise<void> => {
    await apiClient.put(`/users/${id}`, payload);
  },

  updateUserStatus: async (id: string, isActive: boolean): Promise<void> => {
    await apiClient.put(`/users/${id}`, {is_active: isActive});
  },

  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};
