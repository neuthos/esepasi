import {
  DashboardOutlined,
  BankOutlined,
  UserOutlined,
  FileTextOutlined,
  TransactionOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import type {MenuProps} from "antd";
import React from "react";

export type MenuItem = Required<MenuProps>["items"][number];

export const MENU_ITEMS: MenuItem[] = [
  {
    key: "/dashboard",
    icon: <DashboardOutlined />,
    label: "Dashboard",
  },
  {
    key: "school",
    icon: <BankOutlined />,
    label: "Sekolah & Admin",
    children: [
      {
        key: "/dashboard/school",
        icon: <BankOutlined />,
        label: "Identitas Sekolah",
      },
      {key: "/dashboard/users", icon: <UserOutlined />, label: "Admin Users"}, // From "admin sekolah bisa melakukan register..."
    ],
  },
  {
    key: "/dashboard/students",
    icon: <TeamOutlined />,
    label: "Siswa",
  },
  {
    key: "/dashboard/bills",
    icon: <FileTextOutlined />,
    label: "Tagihan",
  },
  {
    key: "/dashboard/transactions",
    icon: <TransactionOutlined />,
    label: "Transaksi",
  },
];
