import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  RadialBar,
  RadialBarChart,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartCard } from './chart-card';
import {
  campaigns,
  channels,
  devices,
  monthly,
  palette,
  performance,
  targets,
} from './chart-data';

const axis = {
  tickLine: false,
  axisLine: false,
  tick: { fill: '#64748b', fontSize: 11 },
};
const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  fontSize: 12,
  boxShadow: '0 8px 24px #0f172a12',
};
const compareLegend = [
  { name: 'Năm 2026', color: palette.indigo },
  { name: 'Năm 2025', color: palette.teal },
];

export function OverviewCharts() {
  return (
    <div className="grid grid-cols-1 gap-5 @[640px]:grid-cols-2 @[920px]:grid-cols-3">
      <ChartCard
        title="Tổng quan doanh thu"
        type="AREA CHART"
        description="Xu hướng doanh thu 6 tháng đầu năm · Triệu đồng"
        footer="Tháng 6 đạt 268 triệu đồng, tăng 19,6% so với tháng 5."
        legend={compareLegend}
        className="@[920px]:col-span-2"
      >
        <AreaChart
          data={monthly}
          margin={{ top: 15, right: 12, left: -22, bottom: 0 }}
        >
          <defs>
            <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.indigo} stopOpacity={0.28} />
              <stop
                offset="100%"
                stopColor={palette.indigo}
                stopOpacity={0.02}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="#e2e8f0"
            strokeDasharray="3 4"
          />
          <XAxis dataKey="month" {...axis} dy={6} />
          <YAxis {...axis} />
          <Tooltip contentStyle={tooltipStyle} />
          <Area
            type="monotone"
            dataKey="previous"
            name="Năm 2025"
            unit=" triệu đ"
            stroke={palette.teal}
            strokeWidth={2}
            strokeDasharray="5 5"
            fill="transparent"
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            name="Năm 2026"
            unit=" triệu đ"
            stroke={palette.indigo}
            strokeWidth={3}
            fill="url(#revenue-fill)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ChartCard>
      <ChartCard
        title="Đơn hàng theo tháng"
        type="BAR CHART"
        description="Số đơn hàng hoàn tất trong mỗi tháng"
        footer="Tháng 6 có số đơn hàng cao nhất: 670 đơn."
        legend={[{ name: 'Đơn hàng', color: palette.indigo }]}
      >
        <BarChart
          data={monthly}
          margin={{ top: 15, right: 4, left: -22, bottom: 0 }}
        >
          <CartesianGrid
            vertical={false}
            stroke="#e2e8f0"
            strokeDasharray="3 4"
          />
          <XAxis dataKey="month" {...axis} dy={6} />
          <YAxis {...axis} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f1f5f9' }} />
          <Bar
            dataKey="orders"
            name="Đơn hàng"
            fill={palette.indigo}
            radius={[5, 5, 0, 0]}
            maxBarSize={30}
            isAnimationActive={false}
          />
        </BarChart>
      </ChartCard>
      <ChartCard
        title="Nguồn truy cập"
        type="PIE CHART"
        description="Tỷ trọng người dùng theo kênh tiếp cận"
        footer="Tìm kiếm đóng góp 42% tổng lượt truy cập."
        legend={channels.map((d) => ({
          name: d.name,
          color: d.fill,
          value: `${d.value}%`,
        }))}
      >
        <PieChart>
          <Pie
            data={channels}
            dataKey="value"
            nameKey="name"
            outerRadius="83%"
            paddingAngle={3}
            strokeWidth={0}
            isAnimationActive={false}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => `${value}%`}
          />
        </PieChart>
      </ChartCard>
      <ChartCard
        title="Thiết bị sử dụng"
        type="DONUT CHART"
        description="Phân bố phiên truy cập theo thiết bị"
        footer="Điện thoại là thiết bị phổ biến nhất với 58%."
        legend={devices.map((d) => ({
          name: d.name,
          color: d.fill,
          value: `${d.value}%`,
        }))}
      >
        <PieChart>
          <Pie
            data={devices}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="83%"
            paddingAngle={4}
            cornerRadius={5}
            strokeWidth={0}
            isAnimationActive={false}
          />
          <text
            x="50%"
            y="47%"
            textAnchor="middle"
            fill="#0f172a"
            fontSize={30}
            fontWeight={650}
          >
            58%
          </text>
          <text
            x="50%"
            y="58%"
            textAnchor="middle"
            fill="#64748b"
            fontSize={12}
          >
            Điện thoại
          </text>
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => `${value}%`}
          />
        </PieChart>
      </ChartCard>
      <ChartCard
        title="Hiệu suất tổng thể"
        type="RADAR CHART"
        description="So sánh 6 chỉ số · Thang điểm 100"
        footer="Giữ chân khách hàng dẫn đầu với 92/100 điểm."
        legend={[
          { name: 'Kỳ này', color: palette.indigo },
          { name: 'Kỳ trước', color: palette.teal },
        ]}
      >
        <RadarChart data={performance} outerRadius="65%">
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: '#64748b', fontSize: 10 }}
          />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Kỳ trước"
            dataKey="previous"
            stroke={palette.teal}
            fill={palette.teal}
            fillOpacity={0.08}
            strokeWidth={2}
            isAnimationActive={false}
          />
          <Radar
            name="Kỳ này"
            dataKey="current"
            stroke={palette.indigo}
            fill={palette.indigo}
            fillOpacity={0.2}
            strokeWidth={2}
            isAnimationActive={false}
          />
          <Tooltip contentStyle={tooltipStyle} />
        </RadarChart>
      </ChartCard>
      <ChartCard
        title="Khách hàng quay lại"
        type="LINE CHART"
        description="Số khách quay lại mua hàng theo tháng"
        footer="380 khách quay lại trong tháng 6, tăng 22,6%."
        legend={[{ name: 'Khách hàng', color: palette.teal }]}
      >
        <LineChart
          data={monthly}
          margin={{ top: 15, right: 12, left: -22, bottom: 0 }}
        >
          <CartesianGrid
            vertical={false}
            stroke="#e2e8f0"
            strokeDasharray="3 4"
          />
          <XAxis dataKey="month" {...axis} dy={6} />
          <YAxis {...axis} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line
            type="monotone"
            dataKey="returning"
            name="Khách hàng"
            stroke={palette.teal}
            strokeWidth={3}
            dot={{ r: 4, fill: '#fff', strokeWidth: 2 }}
            activeDot={{ r: 6 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ChartCard>
      <ChartCard
        title="Tiến độ mục tiêu"
        type="RADIAL BAR CHART"
        description="Tỷ lệ hoàn thành mục tiêu 6 tháng đầu năm"
        footer="Doanh thu đã hoàn thành 89% mục tiêu đề ra."
        legend={targets.map((d) => ({
          name: d.name,
          color: d.fill,
          value: `${d.value}%`,
        }))}
      >
        <RadialBarChart
          data={targets}
          innerRadius="35%"
          outerRadius="95%"
          startAngle={90}
          endAngle={-270}
          barSize={16}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar
            dataKey="value"
            background={{ fill: '#f1f5f9' }}
            cornerRadius={10}
            isAnimationActive={false}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => `${value}%`}
          />
        </RadialBarChart>
      </ChartCard>
      <ChartCard
        title="Hiệu quả chiến dịch"
        type="SCATTER CHART"
        description="Chi phí (trục X) và doanh thu (trục Y) · Triệu đ"
        footer="Mỗi điểm thể hiện kết quả của một chiến dịch."
        legend={[{ name: 'Chiến dịch', color: palette.violet }]}
      >
        <ScatterChart margin={{ top: 15, right: 12, left: -22, bottom: 0 }}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 4" />
          <XAxis
            type="number"
            dataKey="cost"
            name="Chi phí"
            unit=" tr"
            {...axis}
            dy={6}
          />
          <YAxis
            type="number"
            dataKey="revenue"
            name="Doanh thu"
            unit=" tr"
            {...axis}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ strokeDasharray: '3 3' }}
          />
          <Scatter
            name="Chiến dịch"
            data={campaigns}
            fill={palette.violet}
            isAnimationActive={false}
          />
        </ScatterChart>
      </ChartCard>
    </div>
  );
}
