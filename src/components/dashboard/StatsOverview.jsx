import { Card, CardContent } from "@/components/ui/card";
import { Folder, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export default function StatsOverview({ boards, items, isLoading }) {
  const completedItems = items.filter(item => item.data?.status === 'done').length;
  const pendingItems = items.filter(item => !item.data?.status || item.data?.status !== 'done').length;
  const completionRate = items.length > 0 ? Math.round((completedItems / items.length) * 100) : 0;

  const stats = [
    {
      title: "Total Boards",
      value: boards.length,
      icon: Folder,
      gradient: "linear-gradient(145deg, #f0f4f8, #d1d9e6)"
    },
    {
      title: "Completed Tasks",
      value: completedItems,
      icon: CheckCircle2,
      gradient: "linear-gradient(145deg, #f0f4f8, #d1d9e6)"
    },
    {
      title: "Pending Tasks",
      value: pendingItems,
      icon: Clock,
      gradient: "linear-gradient(145deg, #f0f4f8, #d1d9e6)"
    },
    {
      title: "Completion Rate",
      value: `${completionRate}%`,
      icon: TrendingUp,
      gradient: "linear-gradient(145deg, #f0f4f8, #d1d9e6)"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ y: -8 }}
          className="group"
        >
          <Card 
            className="border-0 overflow-hidden"
            style={{
              background: '#E0E5EC',
              boxShadow: '10px 10px 20px #a3b1c6, -10px -10px 20px #ffffff'
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <motion.div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{
                    background: stat.gradient,
                    boxShadow: 'inset 4px 4px 8px #a3b1c6, inset -4px -4px 8px #ffffff'
                  }}
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <stat.icon className="w-7 h-7" style={{ color: '#6B7280' }} />
                </motion.div>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium" style={{ color: '#6B7280' }}>
                  {stat.title}
                </p>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" style={{ background: '#D1D9E6' }} />
                ) : (
                  <motion.p 
                    className="text-3xl font-bold"
                    style={{ color: '#374151' }}
                    whileHover={{ scale: 1.05 }}
                  >
                    {stat.value}
                  </motion.p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}