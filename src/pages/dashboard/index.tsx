import Head from "next/head";
import {
  Card,
  Row,
  Col,
  Typography,
  Statistic,
  DatePicker,
  Spin,
  theme,
} from "antd";
import {
  TeamOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WalletOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import {useQuery} from "@tanstack/react-query";
import {dashboardService} from "@/services/dashboard.service";
import {useState} from "react";
import dayjs from "dayjs";

const {Title, Text} = Typography;

export default function DashboardPage() {
  const {token} = theme.useToken();
  // Default to current month
  const [period, setPeriod] = useState(dayjs().format("YYYY-MM"));

  const {data: stats, isLoading} = useQuery({
    queryKey: ["dashboard-stats", period],
    queryFn: () => dashboardService.getStats(period),
  });

  const formatCurrency = (val: number) => `Rp ${val.toLocaleString("id-ID")}`;

  return (
    <DashboardLayout>
      <Head>
        <title>Dashboard | ESepasi</title>
      </Head>

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Title level={2} className="!m-0">
              Dashboard
            </Title>
            <Text type="secondary">
              Ringkasan keuangan dan status pembayaran
            </Text>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg shadow-sm border">
            <CalendarOutlined className="text-gray-400" />
            <span className="text-gray-500 mr-2">Filter Periode:</span>
            <DatePicker.MonthPicker
              allowClear={false}
              value={dayjs(period)}
              onChange={(date) =>
                setPeriod(
                  date ? date.format("YYYY-MM") : dayjs().format("YYYY-MM")
                )
              }
              placeholder="Pilih Bulan"
              className="w-40"
              bordered={false}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="h-64 flex justify-center items-center">
            <Spin size="large" />
          </div>
        ) : (
          <>
            {/* GLOBAL STATS */}
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Card
                  bordered={false}
                  className="shadow-sm h-full"
                  style={{borderLeft: `4px solid ${token.colorPrimary}`}}
                >
                  <Statistic
                    title="Total Siswa Aktif"
                    value={stats?.total_active_students}
                    prefix={<TeamOutlined />}
                    valueStyle={{fontWeight: "bold"}}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card
                  bordered={false}
                  className="shadow-sm h-full"
                  style={{borderLeft: `4px solid ${token.colorSuccess}`}}
                >
                  <Statistic
                    title="Total Pendapatan (All Time)"
                    value={stats?.all_time.total_paid}
                    prefix={<CheckCircleOutlined />}
                    formatter={(val) => formatCurrency(val as number)}
                    valueStyle={{
                      color: token.colorSuccess,
                      fontWeight: "bold",
                      fontSize: "1.2rem",
                    }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card
                  bordered={false}
                  className="shadow-sm h-full"
                  style={{borderLeft: `4px solid ${token.colorError}`}}
                >
                  <Statistic
                    title="Total Piutang (All Time)"
                    value={stats?.all_time.total_unpaid}
                    prefix={<CloseCircleOutlined />}
                    formatter={(val) => formatCurrency(val as number)}
                    valueStyle={{
                      color: token.colorError,
                      fontWeight: "bold",
                      fontSize: "1.2rem",
                    }}
                  />
                </Card>
              </Col>
            </Row>

            {/* PERIOD STATS */}
            <div>
              <Title level={4} className="mb-4 text-gray-700">
                Laporan Periode: {dayjs(period).format("MMMM YYYY")}
              </Title>
              <Row gutter={[16, 16]}>
                {/* UNPAID PERIOD */}
                <Col xs={24} sm={12} lg={8}>
                  <Card
                    bordered={false}
                    className="shadow-sm bg-red-50 border-red-100"
                  >
                    <div className="mb-4">
                      <Text type="secondary" className="block mb-1">
                        Total Belum Bayar (Periode Ini)
                      </Text>
                      <Title level={3} type="danger" className="!m-0">
                        {formatCurrency(stats?.period.unpaid.amount || 0)}
                      </Title>
                    </div>
                    <div className="flex items-center gap-2 text-red-600 bg-red-100 p-2 rounded w-fit">
                      <TeamOutlined />
                      <span className="font-medium">
                        {stats?.period.unpaid.student_count} Siswa Belum Bayar
                      </span>
                    </div>
                  </Card>
                </Col>

                {/* PAID PERIOD */}
                <Col xs={24} sm={12} lg={8}>
                  <Card
                    bordered={false}
                    className="shadow-sm bg-green-50 border-green-100"
                  >
                    <div className="mb-4">
                      <Text type="secondary" className="block mb-1">
                        Total Sudah Bayar (Periode Ini)
                      </Text>
                      <Title level={3} type="success" className="!m-0">
                        {formatCurrency(stats?.period.paid.amount || 0)}
                      </Title>
                    </div>
                    <div className="flex items-center gap-2 text-green-600 bg-green-100 p-2 rounded w-fit">
                      <TeamOutlined />
                      <span className="font-medium">
                        {stats?.period.paid.student_count} Siswa Sudah Bayar
                      </span>
                    </div>
                  </Card>
                </Col>

                {/* EXPECTED TOTAL */}
                <Col xs={24} sm={24} lg={8}>
                  <Card
                    bordered={false}
                    className="shadow-sm bg-blue-50 border-blue-100 h-full"
                  >
                    <Statistic
                      title="Estimasi Total Pendapatan (Periode Ini)"
                      value={stats?.period.expected_total}
                      prefix={<WalletOutlined />}
                      formatter={(val) => formatCurrency(val as number)}
                      valueStyle={{
                        color: token.colorPrimaryText,
                        fontWeight: "bold",
                      }}
                    />
                    <div className="mt-4 text-xs text-gray-500">
                      *Total potensi pendapatan jika semua siswa membayar
                    </div>
                  </Card>
                </Col>
              </Row>
            </div>

            {/* QUICK ACTIONS */}
            <Card title="Aksi Cepat" className="shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  className="p-4 border rounded-lg hover:border-blue-500 cursor-pointer transition-all"
                  onClick={() => (window.location.href = "/dashboard/bills")}
                >
                  <Title level={5}>Upload Tagihan</Title>
                  <Text type="secondary">
                    Upload tagihan massal untuk siswa
                  </Text>
                </div>
                <div
                  className="p-4 border rounded-lg hover:border-blue-500 cursor-pointer transition-all"
                  onClick={() => (window.location.href = "/dashboard/students")}
                >
                  <Title level={5}>Registrasi Siswa</Title>
                  <Text type="secondary">Tambah data siswa baru</Text>
                </div>
                <div
                  className="p-4 border rounded-lg hover:border-blue-500 cursor-pointer transition-all"
                  onClick={() =>
                    (window.location.href = "/dashboard/transactions")
                  }
                >
                  <Title level={5}>Laporan Transaksi</Title>
                  <Text type="secondary">
                    Download laporan transaksi harian
                  </Text>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
