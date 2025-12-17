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
  Button,
  DatePicker,
  Row,
  Col,
  Modal,
  Form,
  Radio,
  Upload,
  message,
  Divider,
  Popconfirm,
  Tooltip,
} from "antd";
import {
  FileTextOutlined,
  PlusOutlined,
  CloudUploadOutlined,
  SearchOutlined,
  InboxOutlined,
  DownloadOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import {billService, Bill} from "@/services/bill.service";
import {studentService} from "@/services/student.service";
import {useRouter} from "next/router";
import {useState, useEffect} from "react";
import type {ColumnsType} from "antd/es/table";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import type {UploadFile} from "antd/es/upload/interface";

dayjs.extend(customParseFormat);
import StudentSelect from "@/components/dashboard/StudentSelect";

const {Title, Text} = Typography;
const {Dragger} = Upload;

export default function BillsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    page = "1",
    search = "",
    status = null,
    period = "",
    student_nis = "",
  } = router.query;

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [createForm] = Form.useForm();

  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Parsing Filters
  const studentNisArray = student_nis ? (student_nis as string).split(",") : [];

  const [filters, setFilters] = useState({
    search: search as string,
    status: status as any,
    period: period as string,
    student_nis: studentNisArray,
  });

  useEffect(() => {
    if (router.isReady) {
      setFilters({
        search: (router.query.search as string) || "",
        status: (router.query.status as any) || null,
        period: (router.query.period as string) || "",
        student_nis: router.query.student_nis
          ? (router.query.student_nis as string).split(",")
          : [],
      });
    }
  }, [router.isReady, router.query]);

  const {data, isLoading} = useQuery({
    queryKey: ["bills", page, search, status, period, studentNisArray],
    queryFn: () =>
      billService.getBills({
        page: Number(page),
        limit: 10,
        search: search as string,
        status: status as string,
        period: period as string,
        student_nis: studentNisArray,
      }),
    placeholderData: (prev) => prev,
  });

  const createMutation = useMutation({
    mutationFn: billService.createBill,
    onSuccess: () => {
      message.success("Tagihan berhasil dibuat");
      setIsCreateModalOpen(false);
      createForm.resetFields();
      queryClient.invalidateQueries({queryKey: ["bills"]});
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || "Gagal membuat tagihan");
    },
  });

  const bulkMutation = useMutation({
    mutationFn: billService.uploadBulkBills,
    onSuccess: (res: any) => {
      message.success(res?.message || "Import tagihan berhasil");
      setIsBulkModalOpen(false);
      setFileList([]);
      queryClient.invalidateQueries({queryKey: ["bills"]});
    },
    onError: (err: any) => {
      if (err.response?.data?.errors) {
        message.error(`Validasi gagal: ${err.response.data.errors[0]}`);
      } else {
        message.error(err.response?.data?.message || "Gagal import tagihan");
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: billService.deleteBill,
    onSuccess: () => {
      message.success("Tagihan berhasil dihapus");
      queryClient.invalidateQueries({queryKey: ["bills"]});
    },
    onError: (err: any) => {
      message.error(err.response?.data?.message || "Gagal menghapus tagihan");
    },
  });

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({...prev, [key]: value}));
  };

  const applyFilters = () => {
    const query: Record<string, any> = {...filters, page: 1};
    if (Array.isArray(query.student_nis)) {
      if (query.student_nis.length === 0) delete query.student_nis;
      else query.student_nis = query.student_nis.join(",");
    }
    Object.keys(query).forEach((key) => {
      if (!query[key] || query[key] === "all") delete query[key];
    });
    router.replace({pathname: router.pathname, query});
  };

  const handleTableChange = (pagination: any) => {
    const query: Record<string, any> = {...filters, page: pagination.current};
    if (Array.isArray(query.student_nis)) {
      if (query.student_nis.length === 0) delete query.student_nis;
      else query.student_nis = query.student_nis.join(",");
    }
    Object.keys(query).forEach((key) => {
      if (!query[key] || query[key] === "all") delete query[key];
    });
    router.replace({
      pathname: router.pathname,
      query,
    });
  };

  const handleDownloadStudentList = async () => {
    try {
      message.loading("Mengunduh data siswa...", 1);
      const res = await studentService.getStudents({
        page: 1,
        limit: 10000,
        status: "active",
      });

      let csvContent = "data:text/csv;charset=utf-8,ID,NIS,Nama Lengkap\n";
      res.data.forEach((s) => {
        csvContent += `${s.id},"${s.nis}","${s.name}"\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "daftar_referensi_siswa.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      message.error("Gagal mengunduh data siswa");
    }
  };

  const handleDownloadTemplate = (type: "spp" | "nonspp") => {
    let csvContent = "";
    let filename = "";
    if (type === "spp") {
      csvContent =
        "data:text/csv;charset=utf-8,NIS,Billing Period (YYYY/MM),Amount,Due Date (YYYY/MM/DD)\n2024001,2024/03,500000,2024/03/20";
      filename = "template_tagihan_spp.csv";
    } else {
      csvContent =
        "data:text/csv;charset=utf-8,NIS,Description,Amount,Due Date (YYYY/MM/DD)\n2024001,Uang Buku,150000,2024/03/20";
      filename = "template_tagihan_nonspp.csv";
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleProcessImport = () => {
    if (fileList.length === 0) {
      message.error("Pilih file terlebih dahulu");
      return;
    }

    setUploadLoading(true);
    const file = fileList[0] as unknown as File;
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) throw new Error("File kosong");
        const rows = text.split(/\r?\n/);
        const header = rows[0]?.toLowerCase();
        const isSpp = header?.includes("billing period");
        const data = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i].trim();
          if (!row) continue;
          const cols = row.split(/[,;]/);

          if (cols.length < 4) continue;

          const clean = (s: string) => s?.trim().replace(/^['"]|['"]$/g, "");
          const parseDate = (s: string) => {
            if (!s) throw new Error("Tanggal kosong");
            const cleanS = clean(s);
            // Support multiple formats: ISO, ID/UK (DD/MM), US (MM/DD)
            const formats = [
              "YYYY-MM-DD",
              "YYYY/MM/DD",
              "DD/MM/YYYY",
              "DD-MM-YYYY",
              "M/D/YYYY",
              "D/M/YYYY",
              "MM/DD/YYYY",
            ];
            const d = dayjs(cleanS, formats, true);
            if (d.isValid()) return d.format("YYYY-MM-DD");

            // Fallback
            const loose = dayjs(cleanS);
            if (loose.isValid()) return loose.format("YYYY-MM-DD");

            throw new Error(`Tanggal tidak valid: ${s}`);
          };
          const parsePeriod = (s: string) => {
            if (!s) throw new Error("Periode kosong");
            const cleanS = clean(s);
            // Try strict Period format
            const d = dayjs(cleanS, ["YYYY-MM", "YYYY/MM"], true);
            if (d.isValid()) return d.format("YYYY-MM");

            // Try full date format and extract period
            const fullDate = dayjs(cleanS);
            if (fullDate.isValid()) return fullDate.format("YYYY-MM");

            throw new Error(`Periode tidak valid: ${s}`);
          };
          const parseAmount = (s: string) => {
            const val = s?.replace(/[^0-9]/g, "");
            if (!val) throw new Error(`Nominal tidak valid: ${s}`);
            return val;
          };

          if (isSpp) {
            data.push({
              type: "spp",
              nis: clean(cols[0]),
              billing_period: parsePeriod(clean(cols[1])),
              amount: parseAmount(clean(cols[2])),
              due_date: parseDate(clean(cols[3])),
            });
          } else {
            data.push({
              type: "non_spp",
              nis: clean(cols[0]),
              description: clean(cols[1]),
              amount: parseAmount(clean(cols[2])),
              due_date: parseDate(clean(cols[3])),
            });
          }
        }

        if (data.length === 0) throw new Error("Tidak ada data valid");
        bulkMutation.mutate({data});
      } catch (err: any) {
        message.error(err.message || "Gagal memproses file");
      } finally {
        setUploadLoading(false);
      }
    };

    reader.readAsText(file);
  };

  const columns: ColumnsType<Bill> = [
    {
      title: "Kode Invoice",
      dataIndex: "code",
      key: "code",
      render: (text) => <span className="font-mono text-xs">{text}</span>,
    },
    {
      title: "Siswa",
      dataIndex: ["student", "name"],
      key: "student",
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-400">{record.student.nis}</div>
        </div>
      ),
    },
    {
      title: "Periode / Keterangan",
      key: "desc",
      render: (_, record) => (
        <div>
          {record.type === "spp" ? (
            <Tag color="geekblue">{record.billing_period}</Tag>
          ) : (
            <Text>{record.description}</Text>
          )}
          <div className="text-xs text-gray-400 mt-1">
            Jatuh Tempo: {dayjs(record.due_date).format("DD MMM YYYY")}
          </div>
        </div>
      ),
    },
    {
      title: "Nominal",
      dataIndex: "amount",
      key: "amount",
      align: "right",
      render: (val) => (
        <span className="font-semibold">Rp {val.toLocaleString("id-ID")}</span>
      ),
    },
    {
      title: "Dibuat Oleh",
      dataIndex: "created_by_name",
      key: "created_by",
      render: (text) => (
        <span className="text-xs text-gray-500">{text || "-"}</span>
      ),
    },
    {
      title: "Diperbarui Oleh",
      dataIndex: "updated_by_name",
      key: "updated_by",
      render: (text) => (
        <span className="text-xs text-gray-500">{text || "-"}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (val, record) => {
        console.log({val, record});
        if (val === "paid") return <Tag color="success">Sudah Bayar</Tag>;
        if (val === "overdue") return <Tag color="error">Jatuh Tempo</Tag>;
        if (val === "pending") return <Tag color="default">Belum Bayar</Tag>;
        if (val === "deleted") return <Tag color="error">Dihapus</Tag>;
        return <Tag>{val.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Aksi",
      key: "action",
      align: "center",
      render: (_, record) => {
        const isPaid = record.status === "paid";
        const isDeleted = !!record.deleted_at;

        if (isDeleted)
          return <span className="text-gray-400 text-xs">Dihapus</span>;

        return (
          <Popconfirm
            title="Hapus Tagihan?"
            description="Tindakan ini tidak dapat dibatalkan."
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="Ya, Hapus"
            cancelText="Batal"
            disabled={isPaid}
          >
            <Tooltip
              title={
                isPaid ? "Tagihan Lunas tidak bisa dihapus" : "Hapus Tagihan"
              }
            >
              <Button
                danger
                type="text"
                icon={<DeleteOutlined />}
                disabled={isPaid}
              />
            </Tooltip>
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <DashboardLayout>
      <Head>
        <title>Data Tagihan | SchoolPay</title>
      </Head>

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Title level={2} className="m-0! flex items-center gap-2">
              <FileTextOutlined /> Tagihan
            </Title>
            <Text type="secondary">
              Kelola tagihan SPP dan pembayaran lainnya
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
              Import Tagihan
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Buat Tagihan
            </Button>
          </Space>
        </div>

        <Card className="shadow-sm">
          <Row gutter={[16, 16]} className="mb-6" align="middle">
            <Col xs={24} md={6}>
              <Input
                placeholder="Cari Invoice..."
                allowClear
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                onPressEnter={applyFilters}
                size="large"
                prefix={<SearchOutlined />}
              />
            </Col>
            <Col xs={12} md={4}>
              <Select
                value={filters.status}
                style={{width: "100%"}}
                size="large"
                onChange={(val) => handleFilterChange("status", val)}
                allowClear
                placeholder="Filter Status"
                options={[
                  {value: "pending", label: "Pending"},
                  {value: "paid", label: "Lunas"},
                  {value: "overdue", label: "Jatuh Tempo"},
                  {value: "deleted", label: "Dihapus"},
                ]}
              />
            </Col>
            <Col xs={12} md={5}>
              <DatePicker.MonthPicker
                style={{width: "100%"}}
                size="large"
                placeholder="Filter Periode"
                onChange={(date, dateString) =>
                  handleFilterChange("period", dateString)
                }
                value={filters.period ? dayjs(filters.period) : null}
              />
            </Col>
            <Col xs={24} md={7}>
              <StudentSelect
                mode="multiple"
                value={filters.student_nis}
                placeholder="Cari & Filter Siswa (NIS)"
                onChange={(newValue: any) => {
                  handleFilterChange("student_nis", newValue);
                }}
                style={{width: "100%"}}
              />
            </Col>
            <Col xs={24} md={2}>
              <Button
                type="primary"
                size="large"
                onClick={applyFilters}
                icon={<SearchOutlined />}
                className="w-full"
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
          title="Buat Tagihan Baru"
          open={isCreateModalOpen}
          onCancel={() => setIsCreateModalOpen(false)}
          footer={null}
        >
          <Form
            form={createForm}
            layout="vertical"
            onFinish={(vals) => {
              const payload = {
                ...vals,
                billing_period: vals.billing_period?.format("YYYY-MM"),
                due_date: vals.due_date?.format("YYYY-MM-DD"),
              };
              createMutation.mutate(payload);
            }}
          >
            <Form.Item name="type" label="Tipe Tagihan" initialValue="spp">
              <Radio.Group buttonStyle="solid">
                <Radio.Button value="spp">SPP Bulanan</Radio.Button>
                <Radio.Button value="non_spp">Tagihan Lainnya</Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              name="student_nis"
              label="Siswa"
              rules={[{required: true, message: "Pilih siswa"}]}
            >
              <StudentSelect
                placeholder="Cari Siswa (Ketik Nama/NIS)"
                style={{width: "100%"}}
              />
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prev, curr) => prev.type !== curr.type}
            >
              {({getFieldValue}) => {
                const type = getFieldValue("type");
                return type === "spp" ? (
                  <Form.Item
                    name="billing_period"
                    label="Periode Tagihan (Bulan)"
                    rules={[{required: true, message: "Pilih periode"}]}
                  >
                    <DatePicker.MonthPicker
                      style={{width: "100%"}}
                      format="MMMM YYYY"
                      placeholder="Pilih Bulan"
                    />
                  </Form.Item>
                ) : (
                  <Form.Item
                    name="description"
                    label="Keterangan Tagihan"
                    rules={[{required: true, message: "Isi keterangan"}]}
                  >
                    <Input placeholder="Contoh: Uang Buku, Seragam, dll" />
                  </Form.Item>
                );
              }}
            </Form.Item>

            <Form.Item
              name="amount"
              label="Nominal (Rp)"
              rules={[{required: true, message: "Isi nominal"}]}
            >
              <Input
                type="number"
                prefix="Rp"
                style={{width: "100%"}}
                placeholder="0"
              />
            </Form.Item>

            <Form.Item
              name="due_date"
              label="Jatuh Tempo"
              rules={[{required: true, message: "Pilih tanggal jatuh tempo"}]}
            >
              <DatePicker
                size="large"
                style={{width: "100%"}}
                format="DD MMMM YYYY"
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              block
              loading={createMutation.isPending}
            >
              Simpan Tagihan
            </Button>
          </Form>
        </Modal>

        {/* Bulk Upload Modal */}
        <Modal
          title="Import Tagihan (Bulk)"
          open={isBulkModalOpen}
          onCancel={() => setIsBulkModalOpen(false)}
          footer={null}
          width={600}
        >
          <div className="space-y-4">
            <div className="p-4 text-blue-700 rounded-md">
              <Text type="secondary" className="text-xs">
                <b>Langkah 1:</b> Unduh referensi siswa (jika butuh NIS).
                <br />
                <b>Langkah 2:</b> Unduh template tagihan.
                <br />
                <b>Langkah 3:</b> Isi template dan upload di bawah.
              </Text>

              <div className="flex flex-col gap-2 mt-3">
                <Button
                  icon={<DownloadOutlined />}
                  onClick={handleDownloadStudentList}
                >
                  Unduh Referensi Siswa (CSV)
                </Button>
                <div className="flex gap-2">
                  <Button
                    className="w-full"
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownloadTemplate("spp")}
                  >
                    Template SPP
                  </Button>
                  <Button
                    className="w-full"
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownloadTemplate("nonspp")}
                  >
                    Template Non-SPP
                  </Button>
                </div>
              </div>
            </div>

            <Divider />

            <Dragger
              fileList={fileList}
              onRemove={() => setFileList([])}
              beforeUpload={(file) => {
                setFileList([file]);
                return false;
              }}
              maxCount={1}
              accept=".csv"
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                Klik atau tarik file CSV ke sini
              </p>
            </Dragger>

            <Button
              type="primary"
              block
              onClick={handleProcessImport}
              loading={uploadLoading || bulkMutation.isPending}
              disabled={fileList.length === 0}
              className="mt-3"
            >
              Proses Import
            </Button>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
