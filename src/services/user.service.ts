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
}

// Mock Data
const MOCK_USERS: AdminUser[] = [
  {
    id: "user-1",
    name: "Galang Keda (You)",
    email: "admin@sekolah.com",
    is_active: true,
    is_super_admin: true,
    role: "Super Admin",
  },
  {
    id: "user-2",
    name: "Staff TU",
    email: "tu@sekolah.com",
    is_active: true,
    is_super_admin: false,
    role: "Admin",
  },
  {
    id: "user-3",
    name: "Kepala Sekolah",
    email: "kepsek@sekolah.com",
    is_active: true,
    is_super_admin: false,
    role: "Admin",
  },
];

export const userService = {
  getUsers: async (): Promise<AdminUser[]> => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return MOCK_USERS;
  },

  createUser: async (payload: CreateUserPayload): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Create User:", payload);
  },

  updateUserStatus: async (id: string, isActive: boolean): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    console.log(`Update user ${id} status to ${isActive}`);
  },

  deleteUser: async (id: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    console.log(`Delete user ${id}`);
  },
};
