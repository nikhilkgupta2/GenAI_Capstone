import { AIAssistantWidget } from '../../components/dashboard/AIAssistantWidget';
import { AIDailyBrief } from '../../components/dashboard/AIDailyBrief';
import { AIPrioritiesPanel } from '../../components/dashboard/AIPrioritiesPanel';
import { DashboardSkeleton } from '../../components/dashboard/DashboardSkeleton';
import { DemandTrendsPanel } from '../../components/dashboard/DemandTrendsPanel';
import { InventoryRiskChart } from '../../components/dashboard/InventoryRiskChart';
import { KPICard } from '../../components/dashboard/KPICard';
import { RecommendedActions } from '../../components/dashboard/RecommendedActions';
import { SmartReorderPanel } from '../../components/dashboard/SmartReorderPanel';
import { SupplierHealthPanel } from '../../components/dashboard/SupplierHealthPanel';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowLeftRight, Package, ShieldCheck } from 'lucide-react';
import { useAIBrief } from '../../hooks/dashboard/useAIBrief';
import { useDemandTrends } from '../../hooks/dashboard/useDemandTrends';
import { useKPIs } from '../../hooks/dashboard/useKPIs';
import { usePriorities } from '../../hooks/dashboard/usePriorities';
import { useRecommendations } from '../../hooks/dashboard/useRecommendations';
import { useRiskOverview } from '../../hooks/dashboard/useRiskOverview';
import { useSupplierHealth } from '../../hooks/dashboard/useSupplierHealth';

const rowVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const panelVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const sparklineData = [
  [{ v: 32 }, { v: 40 }, { v: 36 }, { v: 42 }, { v: 48 }],
  [{ v: 22 }, { v: 18 }, { v: 16 }, { v: 14 }, { v: 12 }],
  [{ v: 28 }, { v: 32 }, { v: 34 }, { v: 38 }, { v: 43 }],
  [{ v: 80 }, { v: 84 }, { v: 88 }, { v: 90 }, { v: 92 }],
];

export default function DashboardPage() {
  const { isLoading: loadingKPIs } = useKPIs();
  const { isLoading: loadingPriorities } = usePriorities();
  const { isLoading: loadingRecommendations } = useRecommendations();
  const { isLoading: loadingSupplierHealth } = useSupplierHealth();
  const { isLoading: loadingDemandTrends } = useDemandTrends();
  const { isLoading: loadingRiskOverview } = useRiskOverview();
  const { isLoading: loadingAIBrief } = useAIBrief();

  const isLoading =
    loadingKPIs ||
    loadingPriorities ||
    loadingRecommendations ||
    loadingSupplierHealth ||
    loadingDemandTrends ||
    loadingRiskOverview ||
    loadingAIBrief;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F6FA] px-4 py-6 sm:px-6 lg:px-8">
        <DashboardSkeleton />
        <AIAssistantWidget />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6FA] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <motion.div
          variants={rowVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
        >
          <KPICard
            title="Total Products"
            value={248}
            subtitle="3 added today"
            trend="up"
            trendValue="+3"
            sparklineData={sparklineData[0]}
            icon={Package}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
            delay={0}
          />
          <KPICard
            title="Low Stock"
            value={12}
            subtitle="4 critical alerts"
            trend="down"
            trendValue="-2"
            sparklineData={sparklineData[1]}
            icon={AlertTriangle}
            iconColor="text-red-500"
            iconBg="bg-red-50"
            delay={0.05}
          />
          <KPICard
            title="Transactions (7d)"
            value={43}
            subtitle="+12% vs last week"
            trend="up"
            trendValue="+12%"
            sparklineData={sparklineData[2]}
            icon={ArrowLeftRight}
            iconColor="text-green-600"
            iconBg="bg-green-50"
            delay={0.1}
          />
          <KPICard
            title="Inventory Health"
            value="92%"
            subtitle="Excellent"
            trend="up"
            trendValue="+1%"
            sparklineData={sparklineData[3]}
            icon={ShieldCheck}
            iconColor="text-purple-600"
            iconBg="bg-purple-50"
            delay={0.15}
          />
        </motion.div>

        <motion.div
          variants={rowVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
        >
          <motion.div variants={panelVariants}><AIPrioritiesPanel /></motion.div>
          <motion.div variants={panelVariants}><SmartReorderPanel /></motion.div>
          <motion.div variants={panelVariants}><SupplierHealthPanel /></motion.div>
          <motion.div variants={panelVariants}><DemandTrendsPanel /></motion.div>
        </motion.div>

        <motion.div
          variants={rowVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          <motion.div variants={panelVariants}><InventoryRiskChart /></motion.div>
          <motion.div variants={panelVariants}><RecommendedActions /></motion.div>
          <motion.div variants={panelVariants}><AIDailyBrief /></motion.div>
        </motion.div>
      </div>

      <AIAssistantWidget />
    </div>
  );
}
