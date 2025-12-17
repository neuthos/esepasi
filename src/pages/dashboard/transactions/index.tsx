/* eslint-disable @typescript-eslint/no-explicit-any */
import Head from "next/head";
import {useQuery, useMutation} from "@tanstack/react-query";
import {
  Table,
  Card,
  Input,
  Tag,
  Typography,
  Select,
  Button,
  DatePicker,
  Row,
  Col,
  message,
  Tabs,
} from "antd";
import {
  HistoryOutlined,
  SearchOutlined,
  DownloadOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import {transactionService, Transaction} from "@/services/transaction.service";
import {useRouter} from "next/router";
import {useState} from "react";
import type {ColumnsType} from "antd/es/table";
import dayjs from "dayjs";
import StudentSelect from "@/components/dashboard/StudentSelect";

const {Title, Text} = Typography;
const {RangePicker} = DatePicker;

export default function TransactionsPage() {
  const router = useRouter();
  const {
    page = "1",
    search = "",
    status = null,
    student_nis = "",
    start_date = "",
    end_date = "",
  } = router.query;

  const studentNisArray = student_nis ? (student_nis as string).split(",") : [];

  const [filters, setFilters] = useState({
    search: search as string,
    status: status as string,
    student_nis: studentNisArray,
    date_range:
      start_date && end_date
        ? ([dayjs(start_date as string), dayjs(end_date as string)] as [
            dayjs.Dayjs,
            dayjs.Dayjs
          ])
        : null,
  });

  const [activeTab, setActiveTab] = useState("transactions");

  const {data, isLoading} = useQuery({
    queryKey: [
      "transactions",
      page,
      search,
      status,
      studentNisArray,
      start_date,
      end_date,
    ],
    queryFn: () =>
      transactionService.getTransactions({
        page: Number(page),
        limit: 10,
        search: search as string,
        status: status as string,
        student_nis: studentNisArray,
        start_date: start_date as string,
        end_date: end_date as string,
      }),
    placeholderData: (prev) => prev,
  });

  const {data: inquiryData, isLoading: isLoadingInquiry} = useQuery({
    queryKey: ["inquiries", page, search, status, studentNisArray],
    queryFn: () =>
      transactionService.getInquiries({
        page: Number(page),
        limit: 10,
        search: search as string,
        status: status as string,
        student_nis: studentNisArray,
      }),
    enabled: activeTab === "inquiries",
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
      date_range: undefined,
    };

    if (Array.isArray(query.student_nis)) {
      if (query.student_nis.length === 0) delete query.student_nis;
      else query.student_nis = query.student_nis.join(",");
    }

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
    const query = {...router.query, page: pagination.current};
    router.replace({pathname: router.pathname, query});
  };

  const handleExport = () => {
    exportMutation.mutate({
      search: search as string,
      status: status as string,
      student_nis: studentNisArray,
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
      render: (val) => (
        <Tag color={methodColors[val] || "default"}>{val?.toUpperCase()}</Tag>
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
      render: (val) => {
        const name: any = {
          success: "Sukses",
          pending: "Pending",
          failed: "Gagal",
        };

        return <Tag color={statusColors[val]}>{name[val]}</Tag>;
      },
    },
  ];

  const inquiryColumns: ColumnsType<any> = [
    {
      title: "Kode Inquiry",
      dataIndex: "code",
      key: "code",
      render: (text) => (
        <span className="font-mono text-xs font-semibold">{text}</span>
      ),
    },
    {
      title: "Siswa",
      dataIndex: "student_name",
      key: "student",
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-400">{record.student_nis}</div>
        </div>
      ),
    },
    {
      title: "Total Tagihan",
      dataIndex: "total_amount",
      key: "total",
      align: "right",
      render: (val) => (
        <span className="font-semibold">
          Rp {Number(val).toLocaleString("id-ID")}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (val) => {
        const color =
          val === "paid" ? "success" : val === "pending" ? "orange" : "default";
        return <Tag color={color}>{val?.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Expired At",
      dataIndex: "expired_at",
      key: "expired",
      render: (val) => (
        <span className="text-gray-500 text-xs">
          {dayjs(val).format("DD/MM/YYYY HH:mm")}
        </span>
      ),
    },
    {
      title: "Dibuat",
      dataIndex: "created_at",
      key: "created",
      render: (val) => (
        <span className="text-gray-500 text-xs">
          {dayjs(val).format("DD/MM/YYYY HH:mm")}
        </span>
      ),
    },
  ];

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
            <Col xs={24} md={6}>
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
                placeholder="Status"
                allowClear
                onChange={(val) => handleFilterChange("status", val)}
                options={[
                  {value: "success", label: "Sukses"},
                  {value: "pending", label: "Pending"},
                  {value: "failed", label: "Gagal"},
                ]}
              />
            </Col>

            <Col xs={24} md={6}>
              <RangePicker
                style={{width: "100%"}}
                size="large"
                value={filters.date_range}
                onChange={(dates) => handleFilterChange("date_range", dates)}
                placeholder={["Mulai", "Selesai"]}
              />
            </Col>

            {/* New Row for remaining filters if needed or compact */}
            <Col xs={24} md={6}>
              <StudentSelect
                mode="multiple"
                value={filters.student_nis}
                placeholder="Filter Siswa"
                onChange={(newValue: any) => {
                  handleFilterChange("student_nis", newValue);
                }}
                style={{width: "100%"}}
              />
            </Col>
            <Col
              xs={24}
              md={2}
              className="text-right flex items-center justify-end"
            >
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

          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: "transactions",
                label: "Riwayat Pembayaran",
                children: (
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
                ),
              },
              {
                key: "inquiries",
                label: "Riwayat Inquiry",
                children: (
                  <Table
                    columns={inquiryColumns}
                    dataSource={inquiryData?.data}
                    rowKey="id"
                    loading={isLoadingInquiry}
                    pagination={{
                      current: Number(page),
                      total: inquiryData?.total,
                      pageSize: 10,
                      showSizeChanger: false,
                    }}
                    onChange={handleTableChange}
                  />
                ),
              },
            ]}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}
