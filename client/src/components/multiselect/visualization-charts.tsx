'use client';

import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Treemap,
} from 'recharts';

import { Card } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { MultiSelect } from '@/components/multiselect/multi-select';

const salesData = [
  {
    name: 'Jan',
    engineering: 4000,
    design: 2400,
    product: 2400,
    marketing: 3200,
    sales: 5000,
  },
  {
    name: 'Feb',
    engineering: 3000,
    design: 1398,
    product: 2210,
    marketing: 2800,
    sales: 4500,
  },
  {
    name: 'Mar',
    engineering: 2000,
    design: 9800,
    product: 2290,
    marketing: 3900,
    sales: 6000,
  },
  {
    name: 'Apr',
    engineering: 2780,
    design: 3908,
    product: 2000,
    marketing: 4100,
    sales: 5500,
  },
  {
    name: 'May',
    engineering: 1890,
    design: 4800,
    product: 2181,
    marketing: 3700,
    sales: 7000,
  },
  {
    name: 'Jun',
    engineering: 2390,
    design: 3800,
    product: 2500,
    marketing: 4200,
    sales: 6500,
  },
];

const revenueData = [
  {
    quarter: 'Q1',
    engineering: 85000,
    design: 45000,
    product: 55000,
    marketing: 35000,
    sales: 95000,
    hr: 25000,
    finance: 40000,
    operations: 50000,
    support: 30000,
    security: 35000,
  },
  {
    quarter: 'Q2',
    engineering: 92000,
    design: 52000,
    product: 61000,
    marketing: 42000,
    sales: 103000,
    hr: 28000,
    finance: 45000,
    operations: 55000,
    support: 35000,
    security: 40000,
  },
  {
    quarter: 'Q3',
    engineering: 98000,
    design: 58000,
    product: 67000,
    marketing: 48000,
    sales: 110000,
    hr: 32000,
    finance: 50000,
    operations: 62000,
    support: 40000,
    security: 45000,
  },
  {
    quarter: 'Q4',
    engineering: 105000,
    design: 65000,
    product: 74000,
    marketing: 55000,
    sales: 125000,
    hr: 38000,
    finance: 58000,
    operations: 70000,
    support: 48000,
    security: 52000,
  },
];

const productMetrics = [
  {
    metric: 'User Engagement',
    engineering: 85,
    design: 92,
    product: 78,
    marketing: 88,
  },
  {
    metric: 'Feature Adoption',
    engineering: 72,
    design: 85,
    product: 90,
    marketing: 65,
  },
  {
    metric: 'Customer Satisfaction',
    engineering: 88,
    design: 94,
    product: 92,
    marketing: 89,
  },
  {
    metric: 'Performance Score',
    engineering: 95,
    design: 78,
    product: 85,
    marketing: 82,
  },
  {
    metric: 'Innovation Index',
    engineering: 90,
    design: 88,
    product: 85,
    marketing: 75,
  },
];

const chartColors = {
  engineering: '#3b82f6',
  design: '#10b981',
  product: '#f59e0b',
  marketing: '#ef4444',
  sales: '#8b5cf6',
  hr: '#06b6d4',
  finance: '#84cc16',
  operations: '#f97316',
  support: '#ec4899',
  security: '#6366f1',
};

const companyDepartments = [
  { value: 'engineering', label: 'Engineering', icon: Icons.code },
  { value: 'design', label: 'Design', icon: Icons.wand },
  { value: 'product', label: 'Product', icon: Icons.target },
  { value: 'marketing', label: 'Marketing', icon: Icons.trendingUp },
  { value: 'sales', label: 'Sales', icon: Icons.dollarSign },
  { value: 'hr', label: 'HR', icon: Icons.users },
  { value: 'finance', label: 'Finance', icon: Icons.pieChart },
  { value: 'operations', label: 'Operations', icon: Icons.activity },
  { value: 'support', label: 'Support', icon: Icons.mail },
  { value: 'security', label: 'Security', icon: Icons.shield },
];

const metricsOptions = [
  { value: 'revenue', label: 'Revenue', icon: Icons.dollarSign },
  { value: 'users', label: 'Active Users', icon: Icons.users },
  { value: 'performance', label: 'Performance', icon: Icons.activity },
  { value: 'satisfaction', label: 'Satisfaction', icon: Icons.heart },
  { value: 'growth', label: 'Growth Rate', icon: Icons.trendingUp },
];

const timePeriodsOptions = [
  { value: 'daily', label: 'Daily', icon: Icons.calendar },
  { value: 'weekly', label: 'Weekly', icon: Icons.calendar },
  { value: 'monthly', label: 'Monthly', icon: Icons.calendar },
  { value: 'quarterly', label: 'Quarterly', icon: Icons.calendar },
  { value: 'yearly', label: 'Yearly', icon: Icons.calendar },
];

const GradientDefs = () => (
  <defs>
    <linearGradient id="colorEngineering" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
    </linearGradient>
    <linearGradient id="colorDesign" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
    </linearGradient>
    <linearGradient id="colorProduct" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
    </linearGradient>
    <linearGradient id="colorMarketing" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
    </linearGradient>
    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
    </linearGradient>
    <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1} />
    </linearGradient>
  </defs>
);

const getGradientId = (dept: string) => `color${dept.charAt(0).toUpperCase() + dept.slice(1)}`;

const CustomTooltip = ({ active, payload, label, type = 'default' }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="chart-tooltip bg-background/99 border-border/60 animate-in fade-in-0 zoom-in-95 max-w-xs rounded-lg border p-4 shadow-2xl backdrop-blur-md duration-200"
        style={{
          zIndex: 999999,
          pointerEvents: 'none',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        }}>
        <div className="mb-3 flex items-center gap-2">
          <div className="bg-primary h-2 w-2 animate-pulse rounded-full"></div>
          <p className="text-foreground text-sm font-semibold">{label}</p>
        </div>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="group flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-sm border border-white/20 transition-all duration-200 group-hover:scale-110"
                  style={{ backgroundColor: entry.color }}></div>
                <span className="text-muted-foreground group-hover:text-foreground text-sm transition-colors duration-200">
                  {type === 'department'
                    ? companyDepartments.find((d) => d.value === entry.dataKey)?.label || entry.dataKey
                    : entry.name || entry.dataKey}
                </span>
              </div>
              <span className="text-foreground group-hover:text-primary text-sm font-medium transition-colors duration-200">
                {type === 'currency'
                  ? new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 0,
                    }).format(Number(entry.value))
                  : type === 'percentage'
                    ? `${Number(entry.value).toFixed(1)}%`
                    : type === 'number'
                      ? new Intl.NumberFormat().format(Number(entry.value))
                      : entry.value}
              </span>
            </div>
          ))}
        </div>
        {type === 'pie' && (
          <div className="border-border/30 mt-3 border-t pt-2">
            <div className="text-muted-foreground text-xs">
              Total:{' '}
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
              }).format(payload.reduce((sum: number, entry: any) => sum + Number(entry.value), 0))}
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const total = data.payload.total || payload.reduce((sum: number, p: any) => sum + p.value, 0);
    return (
      <div
        className="chart-tooltip bg-background/98 border-border/60 animate-in fade-in-0 zoom-in-95 rounded-lg border p-4 shadow-2xl backdrop-blur-md duration-200"
        style={{
          zIndex: 999999,
          pointerEvents: 'none',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        }}>
        <div className="mb-3 flex items-center gap-3">
          <div
            className="h-4 w-4 rounded-full border-2 border-white/30 transition-all duration-200 hover:scale-110"
            style={{ backgroundColor: data.payload.color }}></div>
          <span className="text-foreground font-semibold">{data.payload.name}</span>
        </div>
        <div className="space-y-2">
          <div className="group flex items-center justify-between gap-4">
            <span className="text-muted-foreground group-hover:text-foreground text-sm transition-colors duration-200">Revenue:</span>
            <span className="group-hover:text-primary font-medium transition-colors duration-200">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
              }).format(Number(data.value))}
            </span>
          </div>
          <div className="group flex items-center justify-between gap-4">
            <span className="text-muted-foreground group-hover:text-foreground text-sm transition-colors duration-200">Share:</span>
            <span className="text-primary font-medium transition-colors duration-200">{((data.value / total) * 100).toFixed(1)}%</span>
          </div>
        </div>
        <div className="border-border/30 mt-3 border-t pt-2">
          <div className="bg-secondary h-2 w-full overflow-hidden rounded-full">
            <div
              className="from-primary to-primary/70 h-full rounded-full bg-gradient-to-r transition-all duration-500 ease-out"
              style={{ width: `${(data.value / total) * 100}%` }}></div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

interface VisualizationChartsProps {
  className?: string;
}

export function VisualizationCharts({ className }: VisualizationChartsProps) {
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>(['engineering', 'design', 'product']);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['revenue', 'users', 'performance']);
  const [selectedTimePeriods, setSelectedTimePeriods] = useState<string[]>(['monthly', 'quarterly']);

  const filteredSalesData = useMemo(() => {
    if (!selectedTimePeriods.includes('monthly')) {
      return [];
    }
    return salesData.map((item) => {
      const filtered: any = { name: item.name };
      selectedDepartments.forEach((dept) => {
        if (item[dept as keyof typeof item] !== undefined) {
          filtered[dept] = item[dept as keyof typeof item];
        }
      });
      return filtered;
    });
  }, [selectedDepartments, selectedTimePeriods]);

  const pieChartData = useMemo(() => {
    if (!selectedMetrics.includes('revenue')) {
      return [];
    }
    const q4Data = revenueData[3];
    return selectedDepartments.map((dept) => ({
      name: companyDepartments.find((d) => d.value === dept)?.label || dept,
      value: q4Data[dept as keyof typeof q4Data] || 0,
      color: chartColors[dept as keyof typeof chartColors] || '#8884d8',
    }));
  }, [selectedDepartments, selectedMetrics]);

  const areaChartData = useMemo(() => {
    if (!selectedTimePeriods.includes('quarterly')) {
      return [];
    }
    return revenueData.map((item) => {
      const filtered: any = { quarter: item.quarter };
      selectedDepartments.forEach((dept) => {
        if (item[dept as keyof typeof item] !== undefined) {
          filtered[dept] = item[dept as keyof typeof item];
        }
      });
      return filtered;
    });
  }, [selectedDepartments, selectedTimePeriods]);

  const lineChartData = useMemo(() => {
    const metricsToShow = selectedMetrics.includes('performance') ? productMetrics : [];
    return metricsToShow;
  }, [selectedMetrics]);

  const radarChartData = useMemo(() => {
    if (!selectedMetrics.includes('performance')) return [];
    return [
      {
        subject: 'Quality',
        engineering: 85,
        design: 90,
        product: 75,
        marketing: 70,
        fullMark: 100,
      },
      {
        subject: 'Speed',
        engineering: 95,
        design: 70,
        product: 80,
        marketing: 85,
        fullMark: 100,
      },
      {
        subject: 'Innovation',
        engineering: 80,
        design: 95,
        product: 90,
        marketing: 75,
        fullMark: 100,
      },
      {
        subject: 'Collaboration',
        engineering: 75,
        design: 85,
        product: 95,
        marketing: 90,
        fullMark: 100,
      },
      {
        subject: 'Efficiency',
        engineering: 90,
        design: 80,
        product: 85,
        marketing: 80,
        fullMark: 100,
      },
      {
        subject: 'Customer Focus',
        engineering: 70,
        design: 75,
        product: 90,
        marketing: 95,
        fullMark: 100,
      },
    ];
  }, [selectedMetrics]);

  const treemapData = useMemo(() => {
    if (!selectedMetrics.includes('revenue') || selectedDepartments.length === 0) return [];
    const q4Data = revenueData[3];

    return selectedDepartments.map((dept) => ({
      name: companyDepartments.find((d) => d.value === dept)?.label || dept,
      size: q4Data[dept as keyof typeof q4Data] || 0,
      fill: chartColors[dept as keyof typeof chartColors] || '#8884d8',
    }));
  }, [selectedMetrics, selectedDepartments]);

  return (
    <div className="space-y-8 p-0">
      <Card className="border-orange-200 bg-white/80 p-6 dark:border-orange-800 dark:bg-gray-900/80">
        <div className="mb-8 grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Departments</label>
            <MultiSelect
              options={companyDepartments}
              onValueChange={setSelectedDepartments}
              defaultValue={['engineering', 'design', 'product']}
              placeholder="Choose departments"
              variant="default"
              maxCount={4}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Metrics</label>
            <MultiSelect
              options={metricsOptions}
              onValueChange={setSelectedMetrics}
              defaultValue={['revenue', 'users', 'performance']}
              placeholder="Choose metrics"
              variant="secondary"
              maxCount={3}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Time Periods</label>
            <MultiSelect
              options={timePeriodsOptions}
              onValueChange={setSelectedTimePeriods}
              defaultValue={['monthly', 'quarterly']}
              placeholder="Select periods"
              variant="inverted"
              maxCount={2}
              className="w-full"
            />
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:gap-6 lg:grid-cols-2">
          {/* Bar Chart */}
          <Card className="w-full min-w-0 p-2 sm:p-4">
            <h4 className="mb-4 text-lg font-medium">
              Monthly Sales by Department
              {!selectedTimePeriods.includes('monthly') && (
                <span className="text-muted-foreground ml-2 text-sm">(Select &ldquo;Monthly&rdquo; to view)</span>
              )}
            </h4>
            <div className="h-80">
              {selectedTimePeriods.includes('monthly') && filteredSalesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredSalesData}>
                    <XAxis
                      dataKey="name"
                      className="text-sm"
                      tick={{ fontSize: 12 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis
                      className="text-sm"
                      tick={{ fontSize: 12 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={{ stroke: 'hsl(var(--border))' }}
                      tickFormatter={(value) =>
                        new Intl.NumberFormat('en-US', {
                          notation: 'compact',
                          compactDisplay: 'short',
                        }).format(value)
                      }
                    />
                    <Tooltip content={<CustomTooltip type="currency" />} />
                    <Legend
                      wrapperStyle={{ fontSize: '14px' }}
                      iconType="rect"
                      formatter={(value: string) => (
                        <span className="text-sm font-medium">{companyDepartments.find((d) => d.value === value)?.label || value}</span>
                      )}
                    />
                    {selectedDepartments.map((dept, index) => (
                      <Bar
                        key={dept}
                        dataKey={dept}
                        fill={chartColors[dept as keyof typeof chartColors]}
                        name={dept}
                        radius={[2, 2, 0, 0]}
                        className="transition-all duration-200 hover:opacity-80"
                        isAnimationActive={false}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-muted-foreground flex h-full items-center justify-center">
                  <div className="text-center">
                    <Icons.calendar className="mx-auto mb-2 h-12 w-12 opacity-50" />
                    <p>Select &ldquo;Monthly&rdquo; period to view sales data</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Pie Chart */}
          <Card className="w-full min-w-0 p-4">
            <h4 className="mb-4 text-lg font-medium">
              Q4 Revenue Distribution
              {!selectedMetrics.includes('revenue') && (
                <span className="text-muted-foreground ml-2 text-sm">(Select &ldquo;Revenue&rdquo; metric to view)</span>
              )}
            </h4>
            <div className="h-80">
              {selectedMetrics.includes('revenue') && pieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      labelLine={true}
                      className="text-xs outline-none">
                      {pieChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="rgba(255,255,255,0.1)"
                          strokeWidth={2}
                          className="transition-all duration-200 hover:opacity-80"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: '14px' }}
                      iconType="circle"
                      formatter={(value: string, entry: any) => (
                        <span className="text-sm font-medium" style={{ color: entry.color }}>
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-muted-foreground flex h-full items-center justify-center">
                  <div className="text-center">
                    <Icons.dollarSign className="mx-auto mb-2 h-12 w-12 opacity-50" />
                    <p>Select &ldquo;Revenue&rdquo; metric to view distribution</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Area Chart */}
          <Card className="w-full min-w-0 p-4">
            <h4 className="mb-4 text-lg font-medium">
              Quarterly Revenue Trends
              {!selectedTimePeriods.includes('quarterly') && (
                <span className="text-muted-foreground ml-2 text-sm">(Select &ldquo;Quarterly&rdquo; to view)</span>
              )}
            </h4>
            <div className="relative h-80 overflow-visible" style={{ zIndex: 1 }}>
              {selectedTimePeriods.includes('quarterly') && areaChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={areaChartData}>
                    <GradientDefs />
                    <XAxis
                      dataKey="quarter"
                      className="text-sm"
                      tick={{ fontSize: 12 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis
                      className="text-sm"
                      tick={{ fontSize: 12 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={{ stroke: 'hsl(var(--border))' }}
                      tickFormatter={(value) =>
                        new Intl.NumberFormat('en-US', {
                          notation: 'compact',
                          compactDisplay: 'short',
                        }).format(value)
                      }
                    />
                    <Tooltip content={<CustomTooltip type="currency" />} />
                    <Legend
                      wrapperStyle={{ fontSize: '14px', zIndex: 1 }}
                      iconType="rect"
                      formatter={(value: string) => (
                        <span className="text-sm font-medium">{companyDepartments.find((d) => d.value === value)?.label || value}</span>
                      )}
                    />
                    {selectedDepartments.map((dept, index) => (
                      <Area
                        key={dept}
                        type="monotone"
                        dataKey={dept}
                        stackId="1"
                        stroke={chartColors[dept as keyof typeof chartColors]}
                        fill={`url(#${getGradientId(dept)})`}
                        strokeWidth={2}
                        className="transition-all duration-200"
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-muted-foreground flex h-full items-center justify-center">
                  <div className="text-center">
                    <Icons.calendar className="mx-auto mb-2 h-12 w-12 opacity-50" />
                    <p>Select &ldquo;Quarterly&rdquo; period to view trends</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Line Chart */}
          <Card className="w-full min-w-0 p-4">
            <h4 className="mb-4 text-lg font-medium">
              Performance Metrics Comparison
              {!selectedMetrics.includes('performance') && (
                <span className="text-muted-foreground ml-2 text-sm">(Select &ldquo;Performance&rdquo; metric to view)</span>
              )}
            </h4>
            <div className="h-80">
              {selectedMetrics.includes('performance') && lineChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineChartData}>
                    <YAxis
                      className="text-sm"
                      tick={{ fontSize: 12 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={{ stroke: 'hsl(var(--border))' }}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip content={<CustomTooltip type="percentage" />} />
                    <Legend
                      wrapperStyle={{ fontSize: '14px' }}
                      iconType="line"
                      formatter={(value: string) => (
                        <span className="text-sm font-medium">{companyDepartments.find((d) => d.value === value)?.label || value}</span>
                      )}
                    />
                    {selectedDepartments
                      .filter((dept) => ['engineering', 'design', 'product', 'marketing'].includes(dept))
                      .map((dept, index) => (
                        <Line
                          key={dept}
                          type="monotone"
                          dataKey={dept}
                          stroke={chartColors[dept as keyof typeof chartColors]}
                          strokeWidth={3}
                          dot={{
                            fill: chartColors[dept as keyof typeof chartColors],
                            strokeWidth: 2,
                            r: 5,
                            className: 'transition-all duration-200 hover:r-7',
                          }}
                          activeDot={{
                            r: 8,
                            stroke: chartColors[dept as keyof typeof chartColors],
                            strokeWidth: 2,
                            fill: chartColors[dept as keyof typeof chartColors],
                          }}
                          name={companyDepartments.find((d) => d.value === dept)?.label || dept}
                          className="transition-all duration-200"
                        />
                      ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-muted-foreground flex h-full items-center justify-center">
                  <div className="text-center">
                    <Icons.activity className="mx-auto mb-2 h-12 w-12 opacity-50" />
                    <p>Select &ldquo;Performance&rdquo; metric to view comparison</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Radar Chart */}
          <Card className="w-full min-w-0 p-4">
            <h4 className="mb-4 text-lg font-medium">
              Team Skills Radar
              {!selectedMetrics.includes('performance') && (
                <span className="text-muted-foreground ml-2 text-sm">(Select &ldquo;Performance&rdquo; metric to view)</span>
              )}
            </h4>
            <div className="h-80">
              {selectedMetrics.includes('performance') && radarChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarChartData}>
                    <PolarGrid gridType="polygon" className="opacity-30" />
                    <PolarAngleAxis dataKey="subject" className="text-sm" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} className="text-sm" tick={{ fontSize: 10 }} tickCount={6} />
                    <Tooltip content={<CustomTooltip type="percentage" />} />
                    <Legend
                      wrapperStyle={{ fontSize: '14px' }}
                      iconType="line"
                      formatter={(value: string) => (
                        <span className="text-sm font-medium">{companyDepartments.find((d) => d.value === value)?.label || value}</span>
                      )}
                    />
                    {selectedDepartments
                      .filter((dept) => ['engineering', 'design', 'product', 'marketing'].includes(dept))
                      .map((dept, index) => (
                        <Radar
                          key={dept}
                          name={companyDepartments.find((d) => d.value === dept)?.label || dept}
                          dataKey={dept}
                          stroke={chartColors[dept as keyof typeof chartColors]}
                          fill={chartColors[dept as keyof typeof chartColors]}
                          fillOpacity={0.1}
                          strokeWidth={2}
                          dot={{
                            fill: chartColors[dept as keyof typeof chartColors],
                            strokeWidth: 2,
                            r: 4,
                          }}
                        />
                      ))}
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-muted-foreground flex h-full items-center justify-center">
                  <div className="text-center">
                    <Icons.target className="mx-auto mb-2 h-12 w-12 opacity-50" />
                    <p>Select &ldquo;Performance&rdquo; metric to view skills radar</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Treemap Chart */}
          <Card className="w-full min-w-0 p-4">
            <h4 className="mb-4 text-lg font-medium">
              Revenue Distribution by Teams
              {!selectedMetrics.includes('revenue') && (
                <span className="text-muted-foreground ml-2 text-sm">(Select &ldquo;Revenue&rdquo; metric to view)</span>
              )}
            </h4>
            <div className="h-80">
              {selectedMetrics.includes('revenue') && treemapData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <Treemap data={treemapData} dataKey="size" stroke="#fff" fill="#8884d8" />
                </ResponsiveContainer>
              ) : (
                <div className="text-muted-foreground flex h-full items-center justify-center">
                  <div className="text-center">
                    <Icons.pieChart className="mx-auto mb-2 h-12 w-12 opacity-50" />
                    <p>Select &ldquo;Revenue&rdquo; metric to view team distribution</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </Card>
    </div>
  );
}
