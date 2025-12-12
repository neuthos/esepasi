/* eslint-disable @typescript-eslint/no-explicit-any */
import Head from "next/head";
import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {
  Table,
  Card,
  Input,
  Tag,
  Space,
  Typography,
  Select,
  Avatar,
  Row,
  Col,
  Button,
  Modal,
  Form,
  message,
  Upload,
} from "antd";
import {
  UserOutlined,
  EyeOutlined,
  UserAddOutlined,
  CloudUploadOutlined,
  InboxOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import {studentService, Student} from "@/services/student.service";
import {useRouter} from "next/router";
import Link from "next/link";
import {useState} from "react";
import type {ColumnsType} from "antd/es/table";

const {Title, Text} = Typography;
const {Dragger} = Upload;

export default function StudentsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    page = "1",
    search = "",
    status = "all",
    payment_status = "all",
  } = router.query;

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [form] = Form.useForm();

  const {data, isLoading} = useQuery({
    queryKey: ["students", page, search, status, payment_status],
    queryFn: () =>
      studentService.getStudents({
        page: Number(page),
        limit: 10,
        search: search as string,
        // Map URL 'status' to account status, default all
        status: status as string,
        payment_status: payment_status as string,
      }),
    placeholderData: (prev) => prev,
  });

  const createMutation = useMutation({
    mutationFn: studentService.createStudent,
    onSuccess: () => {
      message.success("Siswa berhasil ditambahkan");
      setIsCreateModalOpen(false);
      form.resetFields();
      queryClient.invalidateQueries({queryKey: ["students"]});
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: studentService.bulkCreateStudents,
    onSuccess: () => {
      message.success("Import siswa berhasil");
      setIsBulkModalOpen(false);
      queryClient.invalidateQueries({queryKey: ["students"]});
    },
  });

  // Local state for filters
  const [filters, setFilters] = useState({
    search: search as string,
    status: status as string,
    payment_status: payment_status as string,
  });

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({...prev, [key]: value}));
  };

  const applyFilters = () => {
    // Clean filters
    const query: Record<string, any> = {...filters, page: 1};
    Object.keys(query).forEach((key) => {
      if (!query[key] || query[key] === "all") delete query[key];
    });
    router.replace({pathname: router.pathname, query});
  };

  // Sync state with URL when page loads/URL changes directly (optional, but good for back button)
  // For MVP, we initial state from router is enough, but deep sync might need useEffect.
  // We'll stick to initial state for simplicity as per request "click search first".

  // ... existing mutations ...

  const handleTableChange = (pagination: any) => {
    // Keep pagination sync with URL immediately or wait?
    // Pagination usually should happen immediately as it's navigation, not filtering.
    // So we keep it as is, but it needs to include current filters.
    const query: Record<string, any> = {...filters, page: pagination.current};
    Object.keys(query).forEach((key) => {
      if (!query[key] || query[key] === "all") delete query[key];
    });
    router.replace({
      pathname: router.pathname,
      query,
    });
  };

  const handleCreate = (values: any) => {
    createMutation.mutate({...values, status: "active"});
  };

  // Mock Bulk Upload Logic
  const handleBulkUpload = () => {
    // Simulate reading file and sending data
    bulkCreateMutation.mutate({
      students: [
        {name: "Siswa Import A", nis: "2024901"},
        {name: "Siswa Import B", nis: "2024902"},
        {name: "Siswa Import C", nis: "2024903"},
      ],
    });
  };

  const columns: ColumnsType<Student> = [
    {
      title: "Siswa",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Space>
          <Avatar style={{backgroundColor: "#1677ff"}}>
            {record.name.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <div className="font-medium">{text}</div>
            <div className="text-xs text-gray-400">{record.nis}</div>
          </div>
        </Space>
      ),
    },
    {
      title: "Tagihan Belum Lunas",
      dataIndex: ["summary", "total_unpaid"],
      key: "unpaid",
      render: (val) => (
        <Text type={val > 0 ? "danger" : "secondary"}>
          Rp {val.toLocaleString("id-ID")}
        </Text>
      ),
    },
    {
      title: "Total Terbayar",
      dataIndex: ["summary", "total_paid"],
      key: "paid",
      render: (val) => `Rp ${val.toLocaleString("id-ID")}`,
    },
    {
      title: "Status Akun",
      dataIndex: "status",
      key: "status",
      render: (val) => (
        <Tag color={val === "active" ? "success" : "default"}>
          {val.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Aksi",
      key: "action",
      render: (_, record) => (
        <Link href={`/dashboard/students/${record.id}`}>
          <Tag color="processing" className="cursor-pointer hover:opacity-80">
            <EyeOutlined /> Detail
          </Tag>
        </Link>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <Head>
        <title>Data Siswa | SchoolPay</title>
      </Head>

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          {/* ... Header Title ... */}
          <div>
            <Title level={2} className="!m-0 flex items-center gap-2">
              <UserOutlined /> Data Siswa
            </Title>
            <Text type="secondary">
              Kelola data siswa dan pantau status tagihan
            </Text>
          </div>
          <Space>
            <Button
              icon={<CloudUploadOutlined />}
              onClick={() => setIsBulkModalOpen(true)}
            >
              Import Bulk
            </Button>
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Tambah Siswa
            </Button>
          </Space>
        </div>

        <Card bordered={false} className="shadow-sm">
          <Row gutter={[16, 16]} className="mb-6" align="middle">
            <Col xs={24} md={8}>
              <Input
                placeholder="Cari Nama / NIS..."
                allowClear
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                onPressEnter={applyFilters}
                size="large"
                prefix={<SearchOutlined />} // Add search icon for better UI
              />
            </Col>
            <Col xs={12} md={5}>
              <Select
                value={filters.status}
                style={{width: "100%"}}
                size="large"
                onChange={(val) => handleFilterChange("status", val)}
                placeholder="Status Akun"
                options={[
                  {value: "all", label: "Semua Status Akun"},
                  {value: "active", label: "Active"},
                  {value: "inactive", label: "Inactive"},
                ]}
              />
            </Col>
            <Col xs={12} md={5}>
              <Select
                value={filters.payment_status}
                style={{width: "100%"}}
                size="large"
                onChange={(val) => handleFilterChange("payment_status", val)}
                placeholder="Status Tagihan"
                options={[
                  {value: "all", label: "Semua Status Tagihan"},
                  {value: "lunas", label: "Lunas"},
                  {value: "belum_lunas", label: "Belum Lunas"},
                ]}
              />
            </Col>
            <Col xs={24} md={4}>
              <Button
                type="primary"
                size="large"
                onClick={applyFilters}
                icon={<SearchOutlined />}
              >
                Cari
              </Button>
            </Col>
          </Row>

          <Table
            columns={columns}
            dataSource={data?.data}
            rowKey="id"
            loading={isLoading}
            pagination={{
              current: Number(page),
              total: data?.total,
              pageSize: 10,
              showSizeChanger: false,
            }}
            onChange={handleTableChange}
          />
        </Card>

        {/* Create Modal */}
        <Modal
          title="Tambah Siswa Baru"
          open={isCreateModalOpen}
          onCancel={() => setIsCreateModalOpen(false)}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleCreate}>
            <Form.Item
              name="name"
              label="Nama Lengkap"
              rules={[{required: true}]}
            >
              <Input placeholder="Nama Siswa" />
            </Form.Item>
            <Form.Item name="nis" label="NIS" rules={[{required: true}]}>
              <Input placeholder="Nomor Induk Siswa" />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={createMutation.isPending}
            >
              Simpan
            </Button>
          </Form>
        </Modal>

        {/* Bulk Upload Modal */}
        <Modal
          title="Import Data Siswa (Bulk)"
          open={isBulkModalOpen}
          onCancel={() => setIsBulkModalOpen(false)}
          footer={[
            <Button
              key="download"
              onClick={() =>
                window.open("/templates/student_template.csv", "_blank")
              }
              style={{float: "left"}}
            >
              Download Template
            </Button>,
            <Button key="cancel" onClick={() => setIsBulkModalOpen(false)}>
              Batal
            </Button>,
            <Button
              key="upload"
              type="primary"
              onClick={handleBulkUpload}
              loading={bulkCreateMutation.isPending}
            >
              Proses Import
            </Button>,
          ]}
        >
          <div className="bg-blue-50 p-4 rounded-md mb-4">
            <Text type="secondary" className="text-xs">
              Unggah file Excel/CSV dengan kolom: <b>NIS</b>,{" "}
              <b>Nama Lengkap</b>.
            </Text>
          </div>
          <Dragger>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Klik atau tarik file ke area ini</p>
            <p className="ant-upload-hint">
              Support only single upload. Excel/CSV only.
            </p>
          </Dragger>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
