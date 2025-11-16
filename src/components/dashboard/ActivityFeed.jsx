
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle2, AlertCircle, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function ActivityFeed({ items, isLoading }) {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'done': return CheckCircle2;
      case 'working': return Clock;
      case 'stuck': return AlertCircle;
      default: return Clock;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'done': return 'text-white bg-gradient-to-r from-green-500 to-emerald-500';
      case 'working': return 'text-white bg-gradient-to-r from-amber-500 to-orange-500';
      case 'stuck': return 'text-white bg-gradient-to-r from-red-500 to-pink-500';
      default: return 'text-white bg-gradient-to-r from-gray-500 to-slate-500';
    }
  };

  return (
    <Card 
      className="border-0"
      style={{
        background: '#E0E5EC',
        boxShadow: '10px 10px 20px #a3b1c6, -10px -10px 20px #ffffff'
      }}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(145deg, #f0f4f8, #d1d9e6)',
              boxShadow: '6px 6px 12px #a3b1c6, -6px -6px 12px #ffffff'
            }}
          >
            <Activity className="w-7 h-7" style={{ color: '#6B7280' }} />
          </div>
          <div>
            <CardTitle className="text-lg font-bold" style={{ color: '#374151' }}>
              Recent Activity
            </CardTitle>
            <p className="text-sm" style={{ color: '#6B7280' }}>Latest updates</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-3 w-full mb-2" />
                  <Skeleton className="h-2 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{
                background: '#E0E5EC',
                boxShadow: 'inset 6px 6px 12px #a3b1c6, inset -6px -6px 12px #ffffff'
              }}
            >
              <Activity className="w-7 h-7" style={{ color: '#9CA3AF' }} />
            </div>
            <p className="text-sm" style={{ color: '#6B7280' }}>No recent activity</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => {
              const StatusIcon = getStatusIcon(item.data?.status);
              // const statusColor = getStatusColor(item.data?.status); // No longer used for neumorphic background
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 cursor-pointer"
                  style={{
                    background: '#E0E5EC',
                    boxShadow: '4px 4px 8px #a3b1c6, -4px -4px 8px #ffffff'
                  }}
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(145deg, #f0f4f8, #d1d9e6)',
                      boxShadow: '3px 3px 6px #a3b1c6, -3px -3px 6px #ffffff'
                    }}
                  >
                    <StatusIcon className="w-5 h-5" style={{ color: '#6B7280' }} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#374151' }}>
                      {item.title}
                    </p>
                    <p className="text-xs" style={{ color: '#6B7280' }}>
                      {format(new Date(item.updated_date), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
