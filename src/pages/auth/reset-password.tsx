/* eslint-disable @typescript-eslint/no-explicit-any */
import Head from "next/head";
import {Form, Input, Button, Card, Typography, message, Alert} from "antd";
import {LockOutlined} from "@ant-design/icons";
import {useRouter} from "next/router";
import Link from "next/link";
import {useMutation, useQuery} from "@tanstack/react-query";
import {authService} from "@/services/auth.service";

const {Title, Text} = Typography;

export default function ResetPasswordPage() {
  const router = useRouter();
  const {token} = router.query;

  const {isError, isLoading} = useQuery({
    queryKey: ["verifyResetToken", token],
    queryFn: () => authService.verifyResetToken(token as string),
    enabled: !!token,
    retry: false,
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (values: any) =>
      authService.resetPassword(token as string, values.password),
    onSuccess: () => {
      message.success("Password berhasil diubah! Silakan login.");
      router.push("/auth/login");
    },
    onError: (error: any) => {
      console.log(error);
      const msg =
        error?.response?.data?.message ||
        error.message ||
        "Gagal mereset password";
      message.error(msg);
    },
  });

  const onFinish = (values: any) => {
    if (!token) {
      message.error("Token tidak valid!");
      return;
    }
    resetPasswordMutation.mutate(values);
  };

  if (!router.isReady) return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 ">
      <Head>
        <title>Reset Password | ESepasi</title>
      </Head>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-600 text-white font-bold text-xl mb-4">
            E
          </div>
          <Title level={2} className="mb-2">
            Reset Password
          </Title>
          <Text type="secondary">Masukkan password baru Anda</Text>
        </div>

        <Card className="shadow-sm border-0">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto" />
              <p className="mt-4 text-gray-500">Memverifikasi token...</p>
            </div>
          ) : !token || isError ? (
            <div className="mb-6">
              <Alert
                message="Link Tidak Valid"
                description="Token reset password tidak ditemukan, tidak valid, atau sudah kadaluarsa. Silakan request reset password ulang."
                type="error"
                showIcon
              />
              <Link
                href="/auth/forgot-password"
                className="block mt-4 text-center"
              >
                <Button type="primary">Request Ulang</Button>
              </Link>
            </div>
          ) : (
            <Form
              name="reset_password"
              onFinish={onFinish}
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="password"
                rules={[
                  {required: true, message: "Masukkan Password Baru!"},
                  {min: 8, message: "Password minimal 8 karakter!"},
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-gray-400" />}
                  placeholder="Password Baru"
                />
              </Form.Item>

              <Form.Item
                name="confirm"
                dependencies={["password"]}
                rules={[
                  {required: true, message: "Konfirmasi Password Anda!"},
                  ({getFieldValue}) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error("Password tidak cocok!"));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-gray-400" />}
                  placeholder="Konfirmasi Password Baru"
                />
              </Form.Item>

              <Form.Item className="mb-4!">
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={resetPasswordMutation.isPending}
                >
                  Ubah Password
                </Button>
              </Form.Item>
            </Form>
          )}
        </Card>
      </div>
    </div>
  );
}
