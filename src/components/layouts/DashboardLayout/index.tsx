import React, {useState} from "react";
import {
  Layout,
  Menu,
  Button,
  theme,
  Input,
  Dropdown,
  Avatar,
  Space,
} from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SearchOutlined,
  MoonOutlined,
  SunOutlined,
  BellOutlined,
  AppstoreOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {useRouter} from "next/router";
import {MENU_ITEMS} from "@/config/menu";
import {useTheme} from "@/context/ThemeContext";
import {ProtectedRoute} from "@/components/layout/ProtectedRoute";
import {useAuth} from "@/context/AuthContext";

const {Header, Sider, Content, Footer} = Layout;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({children}: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const {mode, toggleTheme} = useTheme();
  const {
    token: {colorBgContainer},
  } = theme.useToken();
  const router = useRouter();
  const {logout, user} = useAuth();

  // Handle Menu Click
  const handleMenuClick = ({key}: {key: string}) => {
    if (key === "logout") {
      logout();
      return;
    }
    router.push(key);
  };

  // User Dropdown
  const userMenu = {
    items: [
      {key: "profile", label: "Profile"},
      {key: "settings", label: "Settings"},
      {type: "divider" as const},
      {key: "logout", label: "Logout", danger: true},
    ],
    onClick: handleMenuClick,
  };

  return (
    <ProtectedRoute>
      <Layout style={{minHeight: "100vh"}}>
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          theme={mode}
          width={250}
          // Override AntD default dark sider bg
          style={{
            overflow: "auto",
            height: "100vh",
            position: "fixed",
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 100,
            backgroundColor: mode === "dark" ? "#141414" : "#ffffff",
            borderRight: mode === "dark" ? "1px solid #303030" : "none",
          }}
          className={mode === "light" ? "shadow-md" : ""}
        >
          <div className="flex items-center justify-center p-4 gap-2 h-16">
            {/* Placeholder Logo */}
            <div className="w-8 h-8  rounded-lg flex items-center justify-center text-white font-bold">
              E
            </div>
            {!collapsed && (
              <h1
                className={`text-lg font-bold ${
                  mode === "dark" ? "text-white" : "text-gray-800"
                }`}
              >
                ESepasi
              </h1>
            )}
          </div>

          <Menu
            theme={mode}
            mode="inline"
            defaultSelectedKeys={[router.pathname]}
            items={MENU_ITEMS}
            onClick={handleMenuClick}
            className="border-none"
            style={{background: mode === "dark" ? "#141414" : "#ffffff"}}
          />
        </Sider>

        <Layout
          style={{marginLeft: collapsed ? 80 : 250, transition: "all 0.2s"}}
          className="min-h-screen"
        >
          <Header
            style={{
              padding: "0 24px",
              background: colorBgContainer,
              position: "sticky",
              top: 0,
              zIndex: 99,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
            className="shadow-sm"
          >
            {/* Left Section: Toggle & Search */}
            <div className="flex items-center gap-4">
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{fontSize: "16px", width: 44, height: 44}}
              />
              <Input
                prefix={<SearchOutlined className="text-gray-400" />}
                placeholder="Search..."
                className="w-64 hidden md:flex"
                variant="filled"
              />
            </div>

            {/* Right Section: Actions & Profile */}
            <div className="flex items-center gap-2">
              <Button type="text" icon={<AppstoreOutlined />} size="large" />
              <Button type="text" icon={<BellOutlined />} size="large" />
              <Button
                type="text"
                icon={mode === "dark" ? <SunOutlined /> : <MoonOutlined />}
                onClick={toggleTheme}
                size="large"
              />

              <Dropdown
                menu={userMenu}
                placement="bottomRight"
                trigger={["click"]}
              >
                <Space className="cursor-pointer ml-2 p-1  rounded-lg transition-colors">
                  <Avatar size="large" icon={<UserOutlined />} />
                  <div className="hidden md:block leading-tight">
                    <div className="font-semibold text-sm">
                      {user?.name || "Admin Sekolah"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user?.email || "admin@school.com"}
                    </div>
                  </div>
                </Space>
              </Dropdown>
            </div>
          </Header>

          <Content
            style={{
              margin: "24px 24px",
              minHeight: 280,
            }}
          >
            {children}
          </Content>

          <Footer style={{textAlign: "center", background: "transparent"}}>
            School Payment System ©{new Date().getFullYear()} Created by EPadi
          </Footer>
        </Layout>
      </Layout>
    </ProtectedRoute>
  );
}
