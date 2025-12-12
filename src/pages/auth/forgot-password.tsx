/* eslint-disable @typescript-eslint/no-explicit-any */
import Head from "next/head";
import {Form, Input, Button, Card, Typography, message} from "antd";
import {MailOutlined} from "@ant-design/icons";
import Link from "next/link";
import {useMutation} from "@tanstack/react-query";
import {authService} from "@/services/auth.service";
import {useState} from "react";

const {Title, Text} = Typography;

export default function ForgotPasswordPage() {
  const [success, setSuccess] = useState(false);

  const forgotPasswordMutation = useMutation({
    mutationFn: (values: any) => authService.forgotPassword(values.email),
    onSuccess: () => {
      setSuccess(true);
      message.success("Link reset password telah dikirim ke email Anda.");
    },
  });

  const onFinish = (values: any) => {
    forgotPasswordMutation.mutate(values);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 ">
      <Head>
        <title>Lupa Password | ESepasi</title>
      </Head>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-600 text-white font-bold text-xl mb-4">
            E
          </div>
          <Title level={2} className="mb-2">
            Lupa Password
          </Title>
          <Text type="secondary">
            Masukkan email Anda untuk menerima link reset password
          </Text>
        </div>

        <Card className="shadow-sm border-0">
          {!success ? (
            <Form
              name="forgot_password"
              onFinish={onFinish}
              layout="vertical"
              size="large"
            >
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

              <Form.Item className="mb-4!">
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={forgotPasswordMutation.isPending}
                >
                  Kirim Link Reset
                </Button>
              </Form.Item>

              <div className="text-center">
                <Link href="/auth/login">
                  <Text className="text-blue-600 font-medium hover:underline">
                    Kembali ke Login
                  </Text>
                </Link>
              </div>
            </Form>
          ) : (
            <div className="text-center py-8">
              <div className="mb-4 text-green-500 text-5xl">
                <MailOutlined />
              </div>
              <Title level={4}>Cek Email Anda</Title>
              <Text type="secondary" className="block mb-6">
                Kami telah mengirimkan link reset password ke alamat email yang
                Anda masukkan.
              </Text>
              <Button href="/auth/login" type="primary" block>
                Kembali ke Login
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
