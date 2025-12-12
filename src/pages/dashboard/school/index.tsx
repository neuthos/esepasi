import Head from "next/head";
import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {
  Card,
  Form,
  Input,
  Button,
  Upload,
  Typography,
  message,
  Skeleton,
  Image,
  Avatar,
} from "antd";
import {UploadOutlined, SaveOutlined, BankOutlined} from "@ant-design/icons";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import {schoolService, UpdateSchoolPayload} from "@/services/school.service";
import {useState, useEffect} from "react";

const {Title, Text} = Typography;
const {TextArea} = Input;

export default function SchoolIdentityPage() {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const {data: school, isLoading} = useQuery({
    queryKey: [schoolService.getSchoolDetailsQuery],
    queryFn: schoolService.getSchoolDetails,
  });

  const mutation = useMutation({
    mutationFn: schoolService.updateSchoolDetails,
    onSuccess: () => {
      message.success("Identitas sekolah berhasil diperbarui");
      queryClient.invalidateQueries({queryKey: ["school"]});
      setIsEditing(false);
    },
    onError: () => {
      message.error("Gagal memperbarui identitas sekolah");
    },
  });

  useEffect(() => {
    if (school) {
      form.setFieldsValue({
        name: school.name,
        code: school.code,
        address: school.address,
      });
    }
  }, [school, form]);

  const onFinish = (values: UpdateSchoolPayload) => {
    mutation.mutate({
      ...values,
      logo_url: school?.logo_url,
    });
  };

  return (
    <DashboardLayout>
      <Head>
        <title>Identitas Sekolah | SchoolPay</title>
      </Head>

      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <Title level={2} className="!m-0 flex items-center gap-2">
            <BankOutlined /> Identitas Sekolah
          </Title>
          <Text type="secondary">
            Kelola informasi dasar dan identitas sekolah Anda di sini.
          </Text>
        </div>

        <Card className="shadow-sm">
          {isLoading ? (
            <Skeleton active avatar paragraph={{rows: 4}} />
          ) : (
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              disabled={!isEditing && !mutation.isPending}
              initialValues={school}
            >
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex flex-col items-center gap-4 min-w-[200px]">
                  <div className="rounded-lg flex items-center justify-center">
                    {school?.logo_url ? (
                      <Image
                        width={150}
                        src={school.logo_url}
                        alt="School Logo"
                        preview={false} // Disable preview if not needed or add fallback
                        className="rounded-md object-contain"
                      />
                    ) : (
                      <Avatar
                        shape="square"
                        size={150}
                        className="bg-blue-600 text-5xl font-bold rounded-md"
                      >
                        {school?.name?.charAt(0).toUpperCase() || "SA"}
                      </Avatar>
                    )}
                  </div>
                  {isEditing && (
                    <Upload showUploadList={false} maxCount={1}>
                      <Button icon={<UploadOutlined />}>Ganti Logo</Button>
                    </Upload>
                  )}
                </div>

                {/* Form Fields Section */}
                <div className="flex-1 space-y-4">
                  <Form.Item
                    label="Nama Sekolah"
                    name="name"
                    rules={[
                      {required: true, message: "Nama sekolah wajib diisi"},
                    ]}
                  >
                    <Input
                      size="large"
                      placeholder="Contoh: SMA Negeri 1 Jakarta"
                    />
                  </Form.Item>

                  <Form.Item
                    label="Kode Sekolah"
                    name="code"
                    tooltip="Kode unik untuk identifikasi sekolah (misal: SMAN1JKT)"
                    rules={[
                      {required: true, message: "Kode sekolah wajib diisi"},
                    ]}
                  >
                    <Input size="large" placeholder="SMAN1JKT" />
                  </Form.Item>

                  <Form.Item
                    label="Alamat Lengkap"
                    name="address"
                    rules={[{required: true, message: "Alamat wajib diisi"}]}
                  >
                    <TextArea
                      rows={4}
                      placeholder="Jalan, Kelurahan, Kecamatan, Kota"
                      className="!resize-none"
                    />
                  </Form.Item>

                  <div className="flex justify-end gap-3 pt-4">
                    {!isEditing ? (
                      <Button
                        type="primary"
                        size="large"
                        onClick={() => setIsEditing(true)}
                        disabled={false}
                      >
                        Edit Identitas
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="large"
                          onClick={() => {
                            setIsEditing(false);
                            form.resetFields();
                          }}
                        >
                          Batal
                        </Button>
                        <Button
                          type="primary"
                          size="large"
                          htmlType="submit"
                          loading={mutation.isPending}
                          icon={<SaveOutlined />}
                        >
                          Simpan Perubahan
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Form>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
