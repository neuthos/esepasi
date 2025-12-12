/* eslint-disable @typescript-eslint/no-explicit-any */
import Head from "next/head";
import {Form, Input, Button, Card, Typography, message} from "antd";
import {LockOutlined, MailOutlined} from "@ant-design/icons";
import Link from "next/link";
import {useMutation} from "@tanstack/react-query";
import {authService} from "@/services/auth.service";
import {useAuth} from "@/context/AuthContext";

const {Title, Text} = Typography;

export default function LoginPage() {
  const {login} = useAuth();

  const loginMutation = useMutation({
    mutationFn: (values: any) =>
      authService.login(values.email, values.password),
    onSuccess: (data) => {
      message.success("Login Berhasil!");
      login(data.token, data.user);
    },
  });

  const onFinish = (values: any) => {
    loginMutation.mutate(values);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Head>
        <title>Login | ESepasi</title>
      </Head>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-600 text-white font-bold text-xl mb-4">
            E
          </div>
          <Title level={2} className="mb-2">
            Selamat Datang
          </Title>
          <Text type="secondary">Masuk untuk mengelola sekolah Anda</Text>
        </div>

        <Card className="shadow-lg">
          <Form name="login" onFinish={onFinish} layout="vertical" size="large">
            <Form.Item
              name="email"
              rules={[
                {required: true, message: "Masukkan Email Anda!"},
                {type: "email", message: "Email tidak valid!"},
              ]}
            >
              <Input
                prefix={<MailOutlined className="text-gray-400" />}
                placeholder="Email"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{required: true, message: "Masukkan Password Anda!"}]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="Password"
              />
            </Form.Item>

            <div className="flex justify-between items-center mb-6">
              <Link href="/auth/forgot-password">
                <Text className="text-blue-600 hover:underline text-sm">
                  Lupa Password?
                </Text>
              </Link>
            </div>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loginMutation.isPending}
              >
                Masuk
              </Button>
            </Form.Item>

            <div className="text-center">
              <Text type="secondary">Belum punya akun? </Text>
              <Link href="/auth/register">
                <Text className="text-blue-600 font-medium hover:underline">
                  Daftar Sekarang
                </Text>
              </Link>
            </div>
          </Form>
        </Card>

        <div className="text-center mt-8 text-gray-400 text-sm">
          &copy; 2024 ESepasi. All rights reserved.
        </div>
      </div>
    </div>
  );
}
