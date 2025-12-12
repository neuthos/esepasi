import Head from "next/head";
import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {
  Table,
  Card,
  Button,
  Tag,
  Space,
  Tooltip,
  Modal,
  Form,
  Input,
  message,
  Typography,
} from "antd";
import {
  UserAddOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  StopOutlined,
  UserOutlined,
} from "@ant-design/icons";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import {userService, AdminUser} from "@/services/user.service";
import {useState} from "react";
import type {ColumnsType} from "antd/es/table";

const {Title, Text} = Typography;

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  // CURRENT LOGGED IN USER (Mocked)
  // In real app, this comes from auth context
  const currentUser = {is_super_admin: true, id: "user-1"};

  // Queries
  const {data: users, isLoading} = useQuery({
    queryKey: ["users"],
    queryFn: userService.getUsers,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: userService.createUser,
    onSuccess: () => {
      message.success("Admin berhasil ditambahkan");
      setIsModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({queryKey: ["users"]});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: userService.deleteUser,
    onSuccess: () => {
      message.success("Admin berhasil dihapus");
      queryClient.invalidateQueries({queryKey: ["users"]});
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({id, status}: {id: string; status: boolean}) =>
      userService.updateUserStatus(id, status),
    onSuccess: () => {
      message.success("Status user diperbarui");
      queryClient.invalidateQueries({queryKey: ["users"]});
    },
  });

  const handleCreate = (values: {name: string; email: string}) => {
    createMutation.mutate(values);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: "Hapus Admin?",
      content: "Tindakan ini tidak dapat dibatalkan.",
      okText: "Hapus",
      okType: "danger",
      cancelText: "Batal",
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const columns: ColumnsType<AdminUser> = [
    {
      title: "Nama",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Space>
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
            {text.charAt(0)}
          </div>
          <div>
            <div className="font-medium">{text}</div>
            {record.is_super_admin && (
              <Tag color="gold" className="text-[10px] m-0">
                Super Admin
              </Tag>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Status",
      dataIndex: "is_active",
      key: "is_active",
      render: (active) => (
        <Tag color={active ? "success" : "default"}>
          {active ? "Aktif" : "Non-Aktif"}
        </Tag>
      ),
    },
    {
      title: "Aksi",
      key: "action",
      render: (_, record) => {
        // Only Super Admin can edit/delete, but cannot delete themselves
        if (!currentUser.is_super_admin) return <Text type="secondary">-</Text>;

        const isSelf = record.id === currentUser.id;

        return (
          <Space>
            <Tooltip title={record.is_active ? "Non-aktifkan" : "Aktifkan"}>
              <Button
                size="small"
                icon={
                  record.is_active ? <StopOutlined /> : <CheckCircleOutlined />
                }
                onClick={() =>
                  statusMutation.mutate({
                    id: record.id,
                    status: !record.is_active,
                  })
                }
                disabled={isSelf}
              />
            </Tooltip>
            <Tooltip title="Hapus">
              <Button
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record.id)}
                disabled={isSelf}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <DashboardLayout>
      <Head>
        <title>Kelola Admin | SchoolPay</title>
      </Head>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Title level={2} className="!m-0 flex items-center gap-2">
              <UserOutlined /> Kelola Admin
            </Title>
            <Text type="secondary">
              Daftar pengguna yang memiliki akses dashboard
            </Text>
          </div>
          {currentUser.is_super_admin && (
            <Button
              type="primary"
              size="large"
              icon={<UserAddOutlined />}
              onClick={() => setIsModalOpen(true)}
            >
              Tambah Admin
            </Button>
          )}
        </div>

        <Card bordered={false} className="shadow-sm">
          <Table
            columns={columns}
            dataSource={users}
            rowKey="id"
            loading={isLoading}
            pagination={{pageSize: 5}}
          />
        </Card>

        <Modal
          title="Tambah Admin Baru"
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleCreate}>
            <Form.Item
              name="name"
              label="Nama Lengkap"
              rules={[{required: true, message: "Nama wajib diisi"}]}
            >
              <Input placeholder="Nama Admin" />
            </Form.Item>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                {required: true, type: "email", message: "Email tidak valid"},
              ]}
            >
              <Input placeholder="admin@sekolah.com" />
            </Form.Item>
            <Form.Item
              name="password"
              label="Password"
              rules={[
                {required: true, message: "Password wajib diisi"},
                {min: 6, message: "Minimal 6 karakter"},
              ]}
            >
              <Input.Password placeholder="Password login" />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={createMutation.isPending}
              >
                Simpan
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
