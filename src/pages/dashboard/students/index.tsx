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
  Tooltip,
} from "antd";
import type {UploadFile} from "antd/es/upload/interface";
import {
  UserOutlined,
  EyeOutlined,
  UserAddOutlined,
  CloudUploadOutlined,
  InboxOutlined,
  SearchOutlined,
  EditOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import {studentService, Student} from "@/services/student.service";
import {useRouter} from "next/router";
import Link from "next/link";
import {useState, useEffect} from "react";
import type {ColumnsType} from "antd/es/table";

const {Title, Text} = Typography;
const {Dragger} = Upload;

export default function StudentsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    page = "1",
    search = "",
    status = "",
    payment_status = "",
  } = router.query;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const [form] = Form.useForm();

  const {data, isLoading} = useQuery({
    queryKey: ["students", page, search, status, payment_status],
    queryFn: () =>
      studentService.getStudents({
        page: Number(page),
        limit: 10,
        search: search as string,
        status: status as string,
        payment_status: payment_status as string,
      }),
    placeholderData: (prev) => prev,
  });

  const createMutation = useMutation({
    mutationFn: studentService.createStudent,
    onSuccess: () => {
      message.success("Siswa berhasil ditambahkan");
      handleCloseModal();
      queryClient.invalidateQueries({queryKey: ["students"]});
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || "Gagal menambahkan siswa");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: any) =>
      studentService.updateStudent(editingId!, values),
    onSuccess: () => {
      message.success("Data siswa berhasil diperbarui");
      handleCloseModal();
      queryClient.invalidateQueries({queryKey: ["students"]});
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || "Gagal memperbarui siswa");
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: studentService.bulkCreateStudents,
    onSuccess: (response: any) => {
      message.success(
        response?.data?.message || `Berhasil mengimport data siswa!`
      );
      setIsBulkModalOpen(false);
      setFileList([]);
      queryClient.invalidateQueries({queryKey: ["students"]});
    },
  });

  const [filters, setFilters] = useState({
    search: search as string,
    status: status as string,
    payment_status: payment_status as string,
  });

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({...prev, [key]: value}));
  };

  const applyFilters = () => {
    const query: Record<string, any> = {...filters, page: 1};
    Object.keys(query).forEach((key) => {
      if (!query[key] || query[key] === "all") delete query[key];
    });
    router.replace({pathname: router.pathname, query});
  };

  useEffect(() => {
    if (router.isReady) {
      // eslint-disable-next-line
      setFilters({
        search: (router.query.search as string) || "",
        status: (router.query.status as string) || "",
        payment_status: (router.query.payment_status as string) || "",
      });
    }
  }, [router.isReady, router.query]);

  const handleTableChange = (pagination: any) => {
    const query: Record<string, any> = {...filters, page: pagination.current};
    Object.keys(query).forEach((key) => {
      if (!query[key] || query[key] === "all") delete query[key];
    });
    router.replace({
      pathname: router.pathname,
      query,
    });
  };

  const handleEdit = (record: Student) => {
    setIsEditMode(true);
    setEditingId(record.id);
    form.setFieldsValue({
      name: record.name,
      nis: record.nis,
      status: record.status,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingId(null);
    form.resetFields();
  };

  const handleSubmit = (values: any) => {
    if (isEditMode) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate({...values, status: "active"});
    }
  };

  const handleBeforeUpload = (file: UploadFile) => {
    setFileList([file]);
    return false; // Prevent automatic upload
  };

  const handleProcessImport = () => {
    if (fileList.length === 0) {
      message.error("Silakan upload file terlebih dahulu");
      return;
    }

    const file = fileList[0] as unknown as File;
    setUploadLoading(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) throw new Error("File kosong");

        const rows = text.split(/\r?\n/);
        const students = [];

        let startIndex = 0;
        // Check header
        if (rows.length > 0 && rows[0].toLowerCase().includes("nis")) {
          startIndex = 1;
        }

        for (let i = startIndex; i < rows.length; i++) {
          const row = rows[i].trim();
          if (!row) continue;

          const cols = row.split(/[,;]/);
          if (cols.length < 2) continue;

          const nis = cols[0].trim().replace(/['"]/g, "");
          const name = cols[1].trim().replace(/['"]/g, "");

          if (nis && name) {
            students.push({nis, name});
          }
        }

        if (students.length === 0) {
          throw new Error("Tidak ada data valid yang ditemukan dalam file");
        }

        if (students.length > 1000) {
          throw new Error("Maksimal 1000 data. Mohon split file Anda.");
        }

        bulkCreateMutation.mutate({students});
      } catch (err: any) {
        message.error(err.message || "Gagal memproses file");
      } finally {
        setUploadLoading(false);
      }
    };

    reader.onerror = () => {
      message.error("Gagal membaca file");
      setUploadLoading(false);
    };

    reader.readAsText(file);
  };

  const columns: ColumnsType<Student> = [
    {
      title: "Siswa",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Space>
          <Avatar style={{backgroundColor: "#1677ff"}}>
            {text?.charAt(0).toUpperCase()}
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
          Rp {val?.toLocaleString("id-ID") || 0}
        </Text>
      ),
    },
    {
      title: "Total Terbayar",
      dataIndex: ["summary", "total_paid"],
      key: "paid",
      render: (val) => `Rp ${val?.toLocaleString("id-ID") || 0}`,
    },
    {
      title: "Status Akun",
      dataIndex: "status",
      key: "status",
      render: (val) => (
        <Tag color={val === "active" ? "success" : "default"}>
          {val?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Aksi",
      key: "action",
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit Siswa">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Link href={`/dashboard/students/${record.id}`}>
            <Tooltip title="Lihat Detail">
              <Button size="small" icon={<EyeOutlined />} />
            </Tooltip>
          </Link>
        </Space>
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
              onClick={() => {
                setFileList([]);
                setIsBulkModalOpen(true);
              }}
            >
              Import Bulk
            </Button>
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              onClick={() => {
                setIsEditMode(false);
                form.resetFields();
                setIsModalOpen(true);
              }}
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
                prefix={<SearchOutlined />}
              />
            </Col>
            <Col xs={12} md={5}>
              <Select
                value={filters.status || undefined}
                style={{width: "100%"}}
                size="large"
                onChange={(val) => handleFilterChange("status", val)}
                placeholder="Status"
                allowClear
                options={[
                  {value: "active", label: "Active"},
                  {value: "inactive", label: "Inactive"},
                ]}
              />
            </Col>
            <Col xs={12} md={5}>
              <Select
                value={filters.payment_status || undefined}
                style={{width: "100%"}}
                size="large"
                allowClear
                onChange={(val) => handleFilterChange("payment_status", val)}
                placeholder="Status Tagihan"
                options={[
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
              total: data?.total || 0,
              pageSize: 10,
              showSizeChanger: false,
            }}
            onChange={handleTableChange}
          />
        </Card>

        <Modal
          title={isEditMode ? "Edit Data Siswa" : "Tambah Siswa Baru"}
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
              <Input placeholder="Nama Siswa" />
            </Form.Item>
            <Form.Item
              name="nis"
              label="NIS"
              rules={[{required: true, message: "NIS wajib diisi"}]}
            >
              <Input placeholder="Nomor Induk Siswa" />
            </Form.Item>

            {isEditMode && (
              <Form.Item name="status" label="Status Akun">
                <Select>
                  <Select.Option value="active">Active</Select.Option>
                  <Select.Option value="inactive">Inactive</Select.Option>
                </Select>
              </Form.Item>
            )}

            <Button
              type="primary"
              htmlType="submit"
              block
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {isEditMode ? "Simpan Perubahan" : "Simpan"}
            </Button>
          </Form>
        </Modal>

        <Modal
          title="Import Data Siswa (Bulk)"
          open={isBulkModalOpen}
          onCancel={() => setIsBulkModalOpen(false)}
          footer={[
            <Button key="cancel" onClick={() => setIsBulkModalOpen(false)}>
              Batal
            </Button>,
            <Button
              key="submit"
              type="primary"
              onClick={handleProcessImport}
              loading={uploadLoading || bulkCreateMutation.isPending}
              disabled={fileList.length === 0}
            >
              Proses Import
            </Button>,
          ]}
        >
          <div className="flex justify-between mb-4">
            <Button
              icon={<DownloadOutlined />}
              onClick={() => {
                // Create dummy CSV for download
                const csvContent =
                  "data:text/csv;charset=utf-8,NIS,Nama Lengkap\n2024001,Siswa Contoh 1\n2024002,Siswa Contoh 2";
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", "template_siswa.csv");
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
            >
              Download Template CSV
            </Button>
          </div>

          <div className="p-4 rounded-md mb-4">
            <Text type="secondary" className="text-xs">
              Unggah file <b>CSV</b> dengan kolom urutan: <b>NIS</b>,{" "}
              <b>Nama Lengkap</b>.
              <br />
              Maksimal 1000 baris per upload.
            </Text>
          </div>
          <Dragger
            beforeUpload={handleBeforeUpload}
            onRemove={() => setFileList([])}
            fileList={fileList}
            multiple={false}
            accept=".csv"
            disabled={uploadLoading || bulkCreateMutation.isPending}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              Klik atau tarik file CSV ke area ini
            </p>
            <p className="ant-upload-hint">
              {fileList.length > 0 ? "File siap diproses" : "Upload file .csv"}
            </p>
          </Dragger>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
