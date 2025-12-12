/* eslint-disable @typescript-eslint/no-explicit-any */
import Head from "next/head";
import {Form, Input, Button, Card, Typography, message, Steps} from "antd";
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  BankOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import {useRouter} from "next/router";
import {useMutation} from "@tanstack/react-query";
import {authService} from "@/services/auth.service";
import {useAuth} from "@/context/AuthContext";
import {useState, useEffect} from "react";

const {Title, Text} = Typography;

export default function RegisterPage() {
  const router = useRouter();
  const {isAuthenticated, user, loading} = useAuth();
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!loading && isAuthenticated && user?.school_id) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, user, loading, router]);

  useEffect(() => {
    if (router.isReady && router.query.step) {
      const step = Number(router.query.step);
      if (currentStep !== step) {
        setCurrentStep(step);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.query]);

  const registerUserMutation = useMutation({
    mutationFn: (values: any) =>
      authService.register(values.name, values.email, values.password),
    onSuccess: (data) => {
      message.success("Akun berhasil dibuat! Silakan lengkapi data sekolah.");
      localStorage.setItem("token", data.token);
      setCurrentStep(1);
    },
  });

  // Step 2: Register School
  const registerSchoolMutation = useMutation({
    mutationFn: (values: any) =>
      authService.registerSchool(
        values.schoolName,
        values.address,
        values.phone
      ),
    onSuccess: () => {
      message.success("Sekolah berhasil didaftarkan!");
      router.push("/dashboard");
    },
  });

  const onFinishUser = (values: any) => {
    registerUserMutation.mutate(values);
  };

  const onFinishSchool = (values: any) => {
    registerSchoolMutation.mutate(values);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <Head>
        <title>Daftar | ESepasi</title>
      </Head>

      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-600 text-white font-bold text-xl mb-4">
            E
          </div>
          <Title level={2} className="!mb-2">
            Mulai dengan ESepasi
          </Title>
          <Text type="secondary">
            Digitalisasi pembayaran sekolah dengan mudah
          </Text>
        </div>

        <Card bordered={false} className="shadow-lg">
          <Steps
            current={currentStep}
            className="mb-8"
            items={[
              {title: "Buat Akun", icon: <UserOutlined />},
              {title: "Data Sekolah", icon: <BankOutlined />},
            ]}
          />

          <div className="my-10" />
          {currentStep === 0 && (
            <Form
              name="register_user"
              onFinish={onFinishUser}
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="name"
                rules={[{required: true, message: "Masukkan Nama Lengkap!"}]}
              >
                <Input
                  prefix={<UserOutlined className="text-gray-400" />}
                  placeholder="Nama Lengkap Admin"
                />
              </Form.Item>

              <Form.Item
                name="email"
                rules={[
                  {required: true, message: "Masukkan Email!"},
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
                rules={[
                  {required: true, message: "Masukkan Password!"},
                  {min: 8, message: "Password minimal 8 karakter!"},
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-gray-400" />}
                  placeholder="Password"
                />
              </Form.Item>

              <Form.Item className="!mb-4">
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={registerUserMutation.isPending}
                >
                  Lanjut
                </Button>
              </Form.Item>

              <div className="text-center">
                <Text type="secondary">Sudah punya akun? </Text>
                <Link href="/auth/login">
                  <Text className="text-blue-600 font-medium hover:underline">
                    Masuk
                  </Text>
                </Link>
              </div>
            </Form>
          )}

          {currentStep === 1 && (
            <Form
              name="register_school"
              onFinish={onFinishSchool}
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="schoolName"
                label="Nama Sekolah"
                rules={[{required: true, message: "Masukkan Nama Sekolah!"}]}
              >
                <Input
                  prefix={<BankOutlined className="text-gray-400" />}
                  placeholder="Contoh: SMA Negeri 1 Jakarta"
                />
              </Form.Item>

              <Form.Item
                name="phone"
                label="Nomor Telepon Sekolah"
                rules={[{required: true, message: "Masukkan No. Telepon!"}]}
              >
                <Input
                  prefix={<PhoneOutlined className="text-gray-400" />}
                  placeholder="021-xxxxxx"
                />
              </Form.Item>

              <Form.Item
                name="address"
                label="Alamat Lengkap"
                rules={[{required: true, message: "Masukkan Alamat Sekolah!"}]}
              >
                <Input.TextArea placeholder="Jln. Raya..." rows={3} />
              </Form.Item>

              <Form.Item className="!mb-0">
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={registerSchoolMutation.isPending}
                >
                  Selesai & Masuk Dashboard
                </Button>
              </Form.Item>
            </Form>
          )}
        </Card>
      </div>
    </div>
  );
}
