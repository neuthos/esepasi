import Head from "next/head";
import Link from "next/link";
import {
  Card,
  Row,
  Col,
  Typography,
  Statistic,
  DatePicker,
  Skeleton,
  theme,
} from "antd";
import {
  TeamOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WalletOutlined,
  CalendarOutlined,
  BookOutlined,
} from "@ant-design/icons";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import {useQuery} from "@tanstack/react-query";
import {dashboardService} from "@/services/dashboard.service";
import {useState} from "react";
import dayjs from "dayjs";

const {Title, Text} = Typography;

export default function DashboardPage() {
  const {token} = theme.useToken();
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
            <Title level={2} className="m-0!">
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
            />
          </div>
        </div>

        {isLoading ? (
          <>
            <Row gutter={[16, 16]}>
              {[1, 2, 3].map((i) => (
                <Col xs={24} sm={8} key={i}>
                  <Card className="shadow-sm h-full">
                    <Skeleton active paragraph={{rows: 1}} />
                  </Card>
                </Col>
              ))}
            </Row>
            <div className="mt-6">
              <Skeleton.Input
                active
                size="default"
                className="mb-4"
                style={{width: 200}}
              />
              <Row gutter={[16, 16]}>
                {[1, 2, 3].map((i) => (
                  <Col xs={24} sm={12} lg={8} key={i}>
                    <Card className="shadow-sm">
                      <Skeleton active paragraph={{rows: 2}} />
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          </>
        ) : (
          <>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Card
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

            <div>
              <Title level={4} className="mb-4 text-gray-700">
                Laporan SPP: {dayjs(period).format("MMMM YYYY")}
              </Title>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={8}>
                  <Card className="shadow-sm bg-red-50 border-red-100">
                    <div className="mb-4">
                      <Text type="secondary" className="block mb-1">
                        Total Belum Bayar (SPP)
                      </Text>
                      <Title level={3} type="danger" className="m-0!">
                        {formatCurrency(stats?.period.spp.unpaid.amount || 0)}
                      </Title>
                    </div>
                    <div className="flex items-center gap-2 text-red-600 bg-red-100 p-2 rounded w-fit">
                      <TeamOutlined />
                      <span className="font-medium">
                        {stats?.period.spp.unpaid.student_count} Siswa Belum
                        Bayar
                      </span>
                    </div>
                  </Card>
                </Col>

                <Col xs={24} sm={12} lg={8}>
                  <Card className="shadow-sm bg-green-50 border-green-100">
                    <div className="mb-4">
                      <Text type="secondary" className="block mb-1">
                        Total Sudah Bayar (SPP)
                      </Text>
                      <Title level={3} type="success" className="m-0!">
                        {formatCurrency(stats?.period.spp.paid.amount || 0)}
                      </Title>
                    </div>
                    <div className="flex items-center gap-2 text-green-600 bg-green-100 p-2 rounded w-fit">
                      <TeamOutlined />
                      <span className="font-medium">
                        {stats?.period.spp.paid.student_count} Siswa Sudah Bayar
                      </span>
                    </div>
                  </Card>
                </Col>

                <Col xs={24} sm={24} lg={8}>
                  <Card className="shadow-sm border-blue-100 h-full">
                    <Statistic
                      title="Estimasi Total SPP (Periode Ini)"
                      value={stats?.period.spp.expected_total}
                      prefix={<WalletOutlined />}
                      formatter={(val) => formatCurrency(val as number)}
                      valueStyle={{
                        color: token.colorPrimaryText,
                        fontWeight: "bold",
                      }}
                    />
                    <div className="mt-4 text-xs text-gray-500">
                      *Total potensi SPP jika semua siswa membayar
                    </div>
                  </Card>
                </Col>
              </Row>
            </div>

            <div className="mt-6">
              <Title level={4} className="mb-4 text-gray-700">
                Laporan Non-SPP
              </Title>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={8}>
                  <Card className="shadow-sm bg-orange-50 border-orange-100">
                    <div className="mb-4">
                      <Text type="secondary" className="block mb-1">
                        Total Belum Bayar (Non-SPP)
                      </Text>
                      <Title level={3} type="warning" className="m-0!">
                        {formatCurrency(
                          stats?.period.non_spp.unpaid.amount || 0
                        )}
                      </Title>
                    </div>
                    <div className="flex items-center gap-2 text-orange-600 bg-orange-100 p-2 rounded w-fit">
                      <BookOutlined />
                      <span className="font-medium">
                        {stats?.period.non_spp.unpaid.student_count} Siswa Belum
                        Lunas
                      </span>
                    </div>
                  </Card>
                </Col>

                <Col xs={24} sm={12} lg={8}>
                  <Card className="shadow-sm bg-teal-50 border-teal-100">
                    <div className="mb-4">
                      <Text type="secondary" className="block mb-1">
                        Total Sudah Bayar (Non-SPP)
                      </Text>
                      <Title level={3} className="m-0! text-teal-600">
                        {formatCurrency(stats?.period.non_spp.paid.amount || 0)}
                      </Title>
                    </div>
                    <div className="flex items-center gap-2 text-teal-600 bg-teal-100 p-2 rounded w-fit">
                      <BookOutlined />
                      <span className="font-medium">
                        {stats?.period.non_spp.paid.student_count} Siswa Sudah
                        Lunas
                      </span>
                    </div>
                  </Card>
                </Col>

                <Col xs={24} sm={24} lg={8}>
                  <Card className="shadow-sm border-gray-100 h-full">
                    <Statistic
                      title="Estimasi Total Non-SPP"
                      value={stats?.period.non_spp.expected_total}
                      prefix={<WalletOutlined />}
                      formatter={(val) => formatCurrency(val as number)}
                      valueStyle={{
                        color: token.colorWarning,
                        fontWeight: "bold",
                      }}
                    />
                    <div className="mt-4 text-xs text-gray-500">
                      *Buku, Seragam, Uang Pangkal, dll (Dibuat bulan ini)
                    </div>
                  </Card>
                </Col>
              </Row>
            </div>

            <Card title="Aksi Cepat" className="shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  href="/dashboard/bills"
                  className="block text-inherit hover:text-inherit"
                >
                  <div className="p-4 border rounded-lg hover:border-blue-500 cursor-pointer transition-all h-full">
                    <Title level={5}>Upload Tagihan</Title>
                    <Text type="secondary">
                      Upload tagihan massal untuk siswa
                    </Text>
                  </div>
                </Link>
                <Link
                  href="/dashboard/students"
                  className="block text-inherit hover:text-inherit"
                >
                  <div className="p-4 border rounded-lg hover:border-blue-500 cursor-pointer transition-all h-full">
                    <Title level={5}>Registrasi Siswa</Title>
                    <Text type="secondary">Tambah data siswa baru</Text>
                  </div>
                </Link>
                <Link
                  href="/dashboard/transactions"
                  className="block text-inherit hover:text-inherit"
                >
                  <div className="p-4 border rounded-lg hover:border-blue-500 cursor-pointer transition-all h-full">
                    <Title level={5}>Laporan Transaksi</Title>
                    <Text type="secondary">
                      Download laporan transaksi harian
                    </Text>
                  </div>
                </Link>
              </div>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
