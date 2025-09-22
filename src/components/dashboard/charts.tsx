import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function CompanyMetricsDashboard() {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  // Mock company data
  const company = {
    name: 'TechInnovate',
    logo: '/api/placeholder/200/200',
    registeredEntity: 'John Doe',
    revenue: [350000, 780000, 1450000],
    growth: 42,
    employees: [12, 35, 78],
    marketShare: [
      { name: 'TechInnovate', value: 32 },
      { name: 'Competitor A', value: 28 },
      { name: 'Competitor B', value: 18 },
      { name: 'Others', value: 22 },
    ],
    investors: [
      { name: 'Venture Capital A', amount: 3500000 },
      { name: 'Angel Investor', amount: 850000 },
      { name: 'Seed Fund', amount: 320000 },
    ],
    founders: [
      { name: 'John Doe', role: 'CEO & Founder', image: '/api/placeholder/100/100' },
      { name: 'Jane Smith', role: 'CTO', image: '/api/placeholder/100/100' },
    ],
  };

  const renderRevenueChart = () => {
    if (!company?.revenue) return null;

    const currentYear = new Date().getFullYear();
    const data = company.revenue.map((value, index) => ({
      year: (currentYear - 2 + index).toString(),
      revenue: value,
    }));

    return (
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
          <XAxis dataKey="year" stroke="#6b7280" />
          <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} stroke="#6b7280" />
          <Tooltip
            formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
            labelFormatter={(label) => `Year: ${label}`}
          />
          <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderMarketShareChart = () => {
    if (!company?.marketShare) return null;

    const COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

    return (
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={company.marketShare}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {company.marketShare.map((entry, index) => (
              <Cell key={`cell-${index}-${entry}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value}%`} />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderEmployeeGrowthChart = () => {
    if (!company?.employees) return null;

    const currentYear = new Date().getFullYear();
    const data = company.employees.map((value, index) => ({
      year: (currentYear - 2 + index).toString(),
      employees: value,
    }));

    return (
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
          <XAxis dataKey="year" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip />
          <Bar dataKey="employees" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderInvestorsChart = () => {
    if (!company?.investors) return null;

    const data = company.investors.map((investor) => ({
      name: investor.name,
      amount: investor.amount,
    }));

    return (
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <XAxis type="number" tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
          <YAxis dataKey="name" type="category" width={100} />
          <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Investment']} />
          <Bar dataKey="amount" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // Main render
  return (
    <div className="p-6 bg-gray-50">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Market Share Chart */}
        <motion.section variants={itemVariants} className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            Market Share
            <span className="ml-2 h-1 w-10 bg-blue-500 rounded"></span>
          </h2>
          {renderMarketShareChart()}
        </motion.section>

        {/* Revenue Chart */}
        <motion.section variants={itemVariants} className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            Revenue Growth
            <span className="ml-2 h-1 w-10 bg-blue-500 rounded"></span>
          </h2>
          {renderRevenueChart()}
        </motion.section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Employee Growth */}
          <motion.section variants={itemVariants} className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              Employee Growth
              <span className="ml-2 h-1 w-10 bg-blue-500 rounded"></span>
            </h2>
            {renderEmployeeGrowthChart()}
          </motion.section>

          {/* Investors */}
          <motion.section variants={itemVariants} className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              Key Investors
              <span className="ml-2 h-1 w-10 bg-blue-500 rounded"></span>
            </h2>
            {renderInvestorsChart()}
          </motion.section>
        </div>
      </motion.div>
    </div>
  );
}
