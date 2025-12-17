/* eslint-disable @typescript-eslint/no-explicit-any */
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
  EditOutlined,
} from "@ant-design/icons";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import {userService, AdminUser} from "@/services/user.service";
import {useState} from "react";
import type {ColumnsType} from "antd/es/table";
import {useAuth} from "@/context/AuthContext";

const {Title, Text} = Typography;

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const {user: currentUser} = useAuth();
  const isSuperAdmin = currentUser?.is_admin;

  const {data: users, isLoading} = useQuery({
    queryKey: ["users"],
    queryFn: userService.getUsers,
  });

  const createMutation = useMutation({
    mutationFn: userService.createUser,
    onSuccess: () => {
      message.success("Admin berhasil ditambahkan");
      handleCloseModal();
      queryClient.invalidateQueries({queryKey: ["users"]});
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || "Gagal membuat admin");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: any) => userService.updateUser(editingId!, values),
    onSuccess: () => {
      message.success("Data admin berhasil diperbarui");
      handleCloseModal();
      queryClient.invalidateQueries({queryKey: ["users"]});
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || "Gagal update admin");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: userService.deleteUser,
    onSuccess: () => {
      message.success("Admin berhasil dihapus");
      queryClient.invalidateQueries({queryKey: ["users"]});
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || "Gagal menghapus admin");
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

  const handleSubmit = (values: any) => {
    if (isEditMode) {
      if (!values.password) delete values.password;
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  const handleEdit = (record: AdminUser) => {
    setIsEditMode(true);
    setEditingId(record.id);
    form.setFieldsValue({
      name: record.name,
      email: record.email,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingId(null);
    form.resetFields();
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
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-blue-600 font-bold">
            {text.charAt(0).toUpperCase()}
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
        if (!isSuperAdmin) return <Text type="secondary">-</Text>;

        const isSelf = record.id === currentUser?.id;

        const isTargetSuperAdmin = record.is_super_admin;
        const canModify = !isSelf && !isTargetSuperAdmin;

        return (
          <Space>
            <Tooltip title="Edit">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>

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
                disabled={!canModify}
              />
            </Tooltip>
            <Tooltip title="Hapus">
              <Button
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record.id)}
                disabled={!canModify}
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
        <title>Kelola Admin | ESepasi</title>
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
          {isSuperAdmin && (
            <Button
              type="primary"
              size="large"
              icon={<UserAddOutlined />}
              onClick={() => {
                setIsEditMode(false);
                form.resetFields();
                setIsModalOpen(true);
              }}
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
          title={isEditMode ? "Edit Admin" : "Tambah Admin Baru"}
          open={isModalOpen}
          onCancel={handleCloseModal}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
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
              label={isEditMode ? "Password Baru (Opsional)" : "Password"}
              rules={[
                {required: !isEditMode, message: "Password wajib diisi"},
                {min: 8, message: "Minimal 8 karakter"},
              ]}
            >
              <Input.Password
                placeholder={isEditMode ? "Password baru" : "Password login"}
              />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {isEditMode ? "Simpan Perubahan" : "Buat Admin"}
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
