/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {ConfigProvider, theme as antTheme} from "antd";
import {AntdRegistry} from "@ant-design/nextjs-registry";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {ThemeProvider, useTheme} from "@/context/ThemeContext";
import {AuthProvider} from "@/context/AuthContext";
import {message} from "antd";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      onError: (error: any) => {
        console.log({error});
        const msg =
          error?.response?.data?.message ||
          error.message ||
          "Terjadi kesalahan sistem";
        message.error(msg);
      },
    },
  },
});

function AntdConfigProvider({children}: {children: React.ReactNode}) {
  const {mode} = useTheme();

  return (
    <ConfigProvider
      theme={{
        algorithm:
          mode === "dark" ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: {
          fontSize: 16,
          fontFamily: "var(--font-outfit)",
          borderRadius: 8,
          colorPrimary: "#1677ff",
          ...(mode === "dark"
            ? {
                colorBgBase: "#141414",
                colorBgContainer: "#1f1f1f", // Slightly lighter for cards
                colorBgLayout: "#141414", // Match body background
                colorTextBase: "#fafafa",
                colorBorder: "#303030", // Subtle border
              }
            : {}),
        },
        components: {
          Button: {controlHeight: 44},
          Input: {controlHeight: 44},
          Select: {controlHeight: 44},
          Layout: {
            siderBg: mode === "dark" ? "#141414" : "#ffffff",
            triggerBg: mode === "dark" ? "#1f1f1f" : "#002140",
            bodyBg: mode === "dark" ? "#141414" : "#f5f5f5",
            headerBg: mode === "dark" ? "#141414" : "#ffffff",
          },
          Menu: {
            darkItemBg: "#141414",
            darkSubMenuItemBg: "#141414",
            itemBg: mode === "dark" ? "#141414" : "#ffffff",
            groupTitleColor:
              mode === "dark" ? "#9ca3af" : "rgba(0, 0, 0, 0.45)", // Gray for headers
          },
          Card: {
            headerFontSize: 18,
            bodyPadding: 24, // More breathing room
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}

export function AppProviders({children}: {children: React.ReactNode}) {
  return (
    <AntdRegistry>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AntdConfigProvider>
            <AuthProvider>{children}</AuthProvider>
          </AntdConfigProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </AntdRegistry>
  );
}
