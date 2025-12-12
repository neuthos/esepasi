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
  InputNumber,
  Radio,
  Upload,
  message,
  Divider,
} from "antd";
import {
  FileTextOutlined,
  PlusOutlined,
  CloudUploadOutlined,
  SearchOutlined,
  InboxOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import {billService, Bill, CreateBillPayload} from "@/services/bill.service";
import {studentService} from "@/services/student.service"; // For student select
import {useRouter} from "next/router";
import {useState} from "react";
import type {ColumnsType} from "antd/es/table";
import dayjs from "dayjs";
import DebounceSelect from "@/components/common/DebounceSelect"; // Need to create this

const {Title, Text} = Typography;
const {Dragger} = Upload;

export default function BillsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    page = "1",
    search = "",
    status = "all",
    period = "",
    student_ids = "",
  } = router.query;

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [createForm] = Form.useForm();

  // Parsing Filters (Initial only)
  const studentIdsArray = student_ids ? (student_ids as string).split(",") : [];

  // Local state for filters
  const [filters, setFilters] = useState({
    search: search as string,
    status: status as string,
    period: period as string,
    student_ids: studentIdsArray,
  });

  const studentSelectValue = (filters.student_ids || []).map((id) => ({
    label: `ID: ${id}`,
    value: id,
  }));

  // Fetch Bills
  const {data, isLoading} = useQuery({
    queryKey: ["bills", page, search, status, period, studentIdsArray],
    queryFn: () =>
      billService.getBills({
        page: Number(page),
        limit: 10,
        search: search as string,
        status: status as string,
        period: period as string,
        student_ids: studentIdsArray,
      }),
    placeholderData: (prev) => prev,
  });

  // Create Bill Mutation
  const createMutation = useMutation({
    mutationFn: billService.createBill,
    onSuccess: () => {
      message.success("Tagihan berhasil dibuat");
      setIsCreateModalOpen(false);
      createForm.resetFields();
      queryClient.invalidateQueries({queryKey: ["bills"]});
    },
  });

  // Bulk Upload Mutation
  const bulkMutation = useMutation({
    mutationFn: billService.uploadBulkBills,
    onSuccess: () => {
      message.success("Import tagihan berhasil");
      setIsBulkModalOpen(false);
      queryClient.invalidateQueries({queryKey: ["bills"]});
    },
  });

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({...prev, [key]: value}));
  };

  const applyFilters = () => {
    const query: Record<string, any> = {...filters, page: 1};

    // Convert arrays to comma strings if needed
    if (Array.isArray(query.student_ids)) {
      if (query.student_ids.length === 0) delete query.student_ids;
      else query.student_ids = query.student_ids.join(",");
    }

    Object.keys(query).forEach((key) => {
      if (!query[key] || query[key] === "all") delete query[key];
    });
    router.replace({pathname: router.pathname, query});
  };

  const handleTableChange = (pagination: any) => {
    // Apply current filters + new page
    const query: Record<string, any> = {...filters, page: pagination.current};
    if (Array.isArray(query.student_ids)) {
      if (query.student_ids.length === 0) delete query.student_ids;
      else query.student_ids = query.student_ids.join(",");
    }
    Object.keys(query).forEach((key) => {
      if (!query[key] || query[key] === "all") delete query[key];
    });
    router.replace({
      pathname: router.pathname,
      query,
    });
  };

  const statusColors: any = {
    pending: "orange",
    paid: "success",
    overdue: "error",
    cancelled: "default",
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
            Due: {record.due_date}
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
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (val) => <Tag color={statusColors[val]}>{val.toUpperCase()}</Tag>,
    },
  ];

  // Fetch Students for Select (Debounced)
  const fetchStudentList = async (searchText: string) => {
    const res = await studentService.getStudents({
      search: searchText,
      limit: 20,
    });
    return res.data.map((s) => ({label: `${s.name} (${s.nis})`, value: s.id}));
  };

  return (
    <DashboardLayout>
      <Head>
        <title>Data Tagihan | SchoolPay</title>
      </Head>

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Title level={2} className="!m-0 flex items-center gap-2">
              <FileTextOutlined /> Tagihan
            </Title>
            <Text type="secondary">
              Kelola tagihan SPP dan pembayaran lainnya
            </Text>
          </div>
          <Space>
            <Button
              icon={<CloudUploadOutlined />}
              onClick={() => setIsBulkModalOpen(true)}
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
                options={[
                  {value: "all", label: "Semua Status"},
                  {value: "pending", label: "Pending"},
                  {value: "paid", label: "Lunas"},
                  {value: "overdue", label: "Jatuh Tempo"},
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
              <DebounceSelect
                mode="multiple"
                value={studentSelectValue}
                placeholder="Cari & Filter Siswa"
                fetchOptions={fetchStudentList}
                onChange={(newValue) => {
                  const ids = (newValue as any[]).map((v) => v.value);
                  handleFilterChange("student_ids", ids);
                }}
                style={{width: "100%"}}
                size="large"
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
              name="student_id"
              label="Siswa"
              rules={[{required: true}]}
            >
              <Select
                showSearch
                placeholder="Pilih Siswa"
                // Mock options for MVP
                options={[
                  {label: "Budi Santoso (2024001)", value: "student-1"},
                  {label: "Siti Aminah (2024002)", value: "student-2"},
                ]}
              />
            </Form.Item>

            <Form.Item noStyle shouldUpdate>
              {(form) =>
                form.getFieldValue("type") === "spp" ? (
                  <Form.Item
                    name="billing_period"
                    label="Periode Tagihan"
                    rules={[{required: true}]}
                  >
                    <DatePicker.MonthPicker
                      className="w-full"
                      placeholder="Pilih Bulan"
                    />
                  </Form.Item>
                ) : (
                  <Form.Item
                    name="description"
                    label="Keterangan Tagihan"
                    rules={[{required: true}]}
                  >
                    <Input placeholder="Contoh: Uang Gedung, Buku, dll" />
                  </Form.Item>
                )
              }
            </Form.Item>

            <Form.Item
              name="amount"
              label="Nominal (Rp)"
              rules={[{required: true}]}
            >
              <InputNumber
                style={{width: "100%"}}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) =>
                  value?.replace(/\$\s?|(,*)/g, "") as unknown as number
                }
              />
            </Form.Item>

            <Form.Item
              name="due_date"
              label="Jatuh Tempo"
              rules={[{required: true}]}
            >
              <DatePicker className="w-full" />
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
          title="Import Tagihan Bulk"
          open={isBulkModalOpen}
          onCancel={() => setIsBulkModalOpen(false)}
          footer={null}
        >
          <div className="space-y-4">
            <div>
              <Text strong>Download Template</Text>
              <div className="flex gap-2 mt-2">
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() =>
                    window.open("/templates/bill_spp_template.csv")
                  }
                >
                  Template SPP
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() =>
                    window.open("/templates/bill_nonspp_template.csv")
                  }
                >
                  Template Non-SPP
                </Button>
              </div>
            </div>
            <Divider />
            <Dragger
              customRequest={({onSuccess}) =>
                setTimeout(() => onSuccess && onSuccess("ok"), 1000)
              }
              onChange={(info) => {
                if (info.file.status === "done") {
                  bulkMutation.mutate({file: info.file});
                }
              }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Upload file CSV/Excel di sini</p>
            </Dragger>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
