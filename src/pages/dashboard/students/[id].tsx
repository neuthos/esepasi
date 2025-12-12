import Head from "next/head";
import {useQuery} from "@tanstack/react-query";
import {
  Card,
  Descriptions,
  Avatar,
  Typography,
  Tabs,
  Tag,
  List,
  Skeleton,
  Row,
  Col,
  Divider,
} from "antd";
import {
  FileTextOutlined,
  HistoryOutlined,
  ArrowLeftOutlined,
  BankOutlined,
} from "@ant-design/icons";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import {studentService} from "@/services/student.service";
import {useRouter} from "next/router";
import Link from "next/link";

export default function StudentDetailPage() {
  const router = useRouter();
  const {id} = router.query;

  const {data, isLoading} = useQuery({
    queryKey: ["student", id],
    queryFn: () => studentService.getStudentDetail(id as string),
    enabled: !!id,
  });

  if (isLoading || !data) {
    return (
      <DashboardLayout>
        <Skeleton active avatar paragraph={{rows: 4}} />
      </DashboardLayout>
    );
  }

  const {student, history} = data;

  const bills = history.filter((h) => h.type === "bill");
  const payments = history.filter((h) => h.type === "payment");

  const items = [
    {
      key: "billing",
      label: (
        <span className="flex items-center gap-2">
          <FileTextOutlined /> Tagihan
        </span>
      ),
      children: (
        <List
          itemLayout="horizontal"
          dataSource={bills}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <Avatar
                    icon={<FileTextOutlined />}
                    className="bg-orange-100 text-orange-600"
                  />
                }
                title={item.description}
                description={item.date}
              />
              <div className="text-right">
                <div className="font-semibold">
                  Rp {item.amount.toLocaleString("id-ID")}
                </div>
                <Tag color={item.status === "paid" ? "success" : "warning"}>
                  {item.status?.toUpperCase()}
                </Tag>
              </div>
            </List.Item>
          )}
        />
      ),
    },
    {
      key: "transactions",
      label: (
        <span className="flex items-center gap-2">
          <HistoryOutlined /> Riwayat Pembayaran
        </span>
      ),
      children: (
        <List
          itemLayout="horizontal"
          dataSource={payments}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <Avatar
                    icon={<BankOutlined />}
                    className="bg-green-100 text-green-600"
                  />
                }
                title={item.description}
                description={`${item.date} • ${item.method?.toUpperCase()}`}
              />
              <div className="text-right">
                <div className="font-semibold text-green-600">
                  + Rp {item.amount.toLocaleString("id-ID")}
                </div>
                <Tag color="success">SUCCESS</Tag>
              </div>
            </List.Item>
          )}
        />
      ),
    },
  ];

  return (
    <DashboardLayout>
      <Head>
        <title>{student.name} | SchoolPay</title>
      </Head>

      <div className="space-y-6">
        <Link
          href="/dashboard/students"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600"
        >
          <ArrowLeftOutlined /> Kembali ke Daftar Siswa
        </Link>

        <Card className="shadow-sm">
          <Row gutter={[32, 32]}>
            <Col
              xs={24}
              md={6}
              lg={4}
              className="flex flex-col items-center justify-center border-r-0 md:border-r border-gray-100"
            >
              <Avatar
                size={120}
                shape="square"
                className="bg-blue-600 text-5xl font-bold rounded-xl mb-4"
              >
                {student.name.charAt(0).toUpperCase()}
              </Avatar>
            </Col>
            <Col xs={24} md={18} lg={20}>
              <Descriptions
                title="Informasi Siswa"
                layout="vertical"
                column={{xs: 1, sm: 2, md: 3}}
                bordered={false}
              >
                <Descriptions.Item label="Nama Lengkap">
                  <span className="font-semibold text-lg">{student.name}</span>
                </Descriptions.Item>
                <Descriptions.Item label="Nomor Induk Siswa (NIS)">
                  <span className="font-mono text-lg">{student.nis}</span>
                </Descriptions.Item>
                <Descriptions.Item label="Status Akun">
                  {student.status === "active" ? "Aktif" : "Non-Aktif"}
                </Descriptions.Item>
                <Descriptions.Item label="Bergabung Sejak">
                  {student.created_at
                    ? new Date(student.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "-"}
                </Descriptions.Item>
              </Descriptions>
            </Col>
          </Row>
        </Card>
        <Divider />

        <Card className="shadow-sm">
          <Tabs defaultActiveKey="billing" items={items} />
        </Card>
      </div>
    </DashboardLayout>
  );
}
