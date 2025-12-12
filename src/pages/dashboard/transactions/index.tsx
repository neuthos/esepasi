/* eslint-disable @typescript-eslint/no-explicit-any */
import Head from "next/head";
import {useQuery, useMutation} from "@tanstack/react-query";
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
  message,
} from "antd";
import {
  HistoryOutlined,
  SearchOutlined,
  DownloadOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import {transactionService, Transaction} from "@/services/transaction.service";
import {studentService} from "@/services/student.service";
import {useRouter} from "next/router";
import {useState} from "react";
import type {ColumnsType} from "antd/es/table";
import dayjs from "dayjs";
import DebounceSelect from "@/components/common/DebounceSelect";

const {Title, Text} = Typography;
const {RangePicker} = DatePicker;

export default function TransactionsPage() {
  const router = useRouter();
  const {
    page = "1",
    search = "",
    status = "all",
    payment_method = "all",
    student_ids = "",
    start_date = "",
    end_date = "",
  } = router.query;

  // Parsing Filters (Initial only)
  const studentIdsArray = student_ids ? (student_ids as string).split(",") : [];

  // Local state for filters
  const [filters, setFilters] = useState({
    search: search as string,
    status: status as string,
    payment_method: payment_method as string,
    student_ids: studentIdsArray,
    date_range:
      start_date && end_date
        ? [dayjs(start_date as string), dayjs(end_date as string)]
        : null,
  });

  const studentSelectValue = (filters.student_ids || []).map((id) => ({
    label: `ID: ${id}`,
    value: id,
  }));

  // Fetch Transactions
  const {data, isLoading} = useQuery({
    queryKey: [
      "transactions",
      page,
      search,
      status,
      payment_method,
      studentIdsArray,
      start_date,
      end_date,
    ],
    queryFn: () =>
      transactionService.getTransactions({
        page: Number(page),
        limit: 10,
        search: search as string,
        status: status as string,
        payment_method: payment_method as string,
        student_ids: studentIdsArray,
        start_date: start_date as string,
        end_date: end_date as string,
      }),
    placeholderData: (prev) => prev,
  });

  const exportMutation = useMutation({
    mutationFn: transactionService.exportTransactions,
    onSuccess: () => {
      message.success("Laporan transaksi berhasil diunduh");
    },
  });

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({...prev, [key]: value}));
  };

  const applyFilters = () => {
    const query: Record<string, any> = {
      ...filters,
      page: 1,
      date_range: undefined, // Don't put object in URL
    };

    // Convert arrays to comma strings
    if (Array.isArray(query.student_ids)) {
      if (query.student_ids.length === 0) delete query.student_ids;
      else query.student_ids = query.student_ids.join(",");
    }

    // Handle Date Range
    if (filters.date_range && Array.isArray(filters.date_range)) {
      query.start_date = filters.date_range[0]?.format("YYYY-MM-DD");
      query.end_date = filters.date_range[1]?.format("YYYY-MM-DD");
    } else {
      delete query.start_date;
      delete query.end_date;
    }

    Object.keys(query).forEach((key) => {
      if (!query[key] || query[key] === "all") delete query[key];
    });

    router.replace({pathname: router.pathname, query});
  };

  const handleTableChange = (pagination: any) => {
    // Apply current filters + new page
    // Need to reconstruct query from URL params or consistent local state?
    // Ideally consistent with applyFilters logic but with updated page.

    // To safe, we use current router query and just update page
    const query = {...router.query, page: pagination.current};
    router.replace({pathname: router.pathname, query});
  };

  const handleExport = () => {
    exportMutation.mutate({
      search: search as string,
      status: status as string,
      payment_method: payment_method as string,
      student_ids: studentIdsArray,
      start_date: start_date as string,
      end_date: end_date as string,
    });
  };

  const statusColors: any = {
    pending: "orange",
    success: "success",
    failed: "error",
  };

  const methodColors: any = {
    transfer: "blue",
    cash: "green",
    manual: "default",
  };

  const columns: ColumnsType<Transaction> = [
    {
      title: "Kode Transaksi",
      dataIndex: "code",
      key: "code",
      render: (text) => (
        <span className="font-mono text-xs font-semibold">{text}</span>
      ),
    },
    {
      title: "Tanggal",
      dataIndex: "date",
      key: "date",
      render: (val) => dayjs(val).format("DD/MM/YYYY HH:mm"),
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
      title: "Keterangan",
      dataIndex: "description",
      key: "desc",
      render: (text, record) => (
        <div>
          <div>{text}</div>
          <div className="text-xs text-gray-400 font-mono">
            {record.bill_code}
          </div>
        </div>
      ),
    },
    {
      title: "Metode",
      dataIndex: "payment_method",
      key: "method",
      render: (val) => val?.toUpperCase(),
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
      render: (val) => (
        <Tag color={statusColors[val]}>{val?.toUpperCase()}</Tag>
      ),
    },
    {
      title: "Aksi",
      key: "action",
      render: () => (
        <Button
          size="small"
          icon={<PrinterOutlined />}
          title="Cetak Kuitansi"
        />
      ),
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
        <title>Riwayat Transaksi | ESepasi</title>
      </Head>

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Title level={2} className="!m-0 flex items-center gap-2">
              <HistoryOutlined /> Riwayat Transaksi
            </Title>
            <Text type="secondary">
              Pantau semua transaksi masuk secara real-time
            </Text>
          </div>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExport}
            loading={exportMutation.isPending}
          >
            Export Laporan
          </Button>
        </div>

        <Card className="shadow-sm">
          <Row gutter={[16, 16]} className="mb-6" align="middle">
            <Col xs={24} md={4}>
              <Input
                placeholder="Cari No. TRX / Invoice..."
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
                  {value: "success", label: "Berhasil"},
                  {value: "pending", label: "Pending"},
                  {value: "failed", label: "Gagal"},
                ]}
              />
            </Col>

            <Col xs={24} md={4}>
              <RangePicker
                style={{width: "100%"}}
                size="large"
                value={filters.date_range}
                onChange={(dates) => handleFilterChange("date_range", dates)}
                placeholder={["Mulai", "Selesai"]}
              />
            </Col>

            {/* New Row for remaining filters if needed or compact */}
            <Col xs={24} md={4}>
              <DebounceSelect
                mode="multiple"
                value={studentSelectValue}
                placeholder="Filter Siswa"
                fetchOptions={fetchStudentList}
                onChange={(newValue) => {
                  const ids = (newValue as any[]).map((v) => v.value);
                  handleFilterChange("student_ids", ids);
                }}
                style={{width: "100%"}}
                size="large"
              />
            </Col>
            <Col
              xs={24}
              md={8}
              className="text-right flex items-center justify-end"
            >
              <Button
                type="primary"
                size="large"
                onClick={applyFilters}
                icon={<SearchOutlined />}
              >
                Terapkan Filter
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
      </div>
    </DashboardLayout>
  );
}
