import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, PhoneCall, PhoneIncoming, PhoneOutgoing, PhoneMissed, Clock, User, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/components/ThemeProvider';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function CallsPanel({ user, isOpen, onClose }) {
  const { colors, getButtonStyle, getInsetStyle, getTransitionDuration } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [dialNumber, setDialNumber] = useState('');

  const { data: calls = [] } = useQuery({
    queryKey: ['calls-panel'],
    queryFn: () => base44.entities.Call.list('-created_date', 50),
    enabled: !!user && isOpen,
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['cases-for-calls'],
    queryFn: () => base44.entities.Case.list('-updated_date', 100),
    enabled: !!user && isOpen,
  });

  const filteredCalls = calls.filter(call => {
    const caseData = cases.find(c => c.id === call.case_id);
    const searchLower = searchQuery.toLowerCase();
    return (
      call.customer_phone?.toLowerCase().includes(searchLower) ||
      caseData?.customer_name?.toLowerCase().includes(searchLower) ||
      caseData?.case_number?.toLowerCase().includes(searchLower)
    );
  });

  const getCallIcon = (direction, status) => {
    if (status === 'missed') return PhoneMissed;
    if (direction === 'inbound') return PhoneIncoming;
    return PhoneOutgoing;
  };

  const getCallColor = (direction, status) => {
    if (status === 'missed') return '#EF4444';
    if (direction === 'inbound') return '#10B981';
    return '#3B82F6';
  };

  const handleDialPad = (digit) => {
    setDialNumber(prev => prev + digit);
  };

  const handleCall = () => {
    if (dialNumber) {
      // TODO: Initiate call
      console.log('Calling:', dialNumber);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="w-full h-14 flex-shrink-0 border-b"
          style={{
            background: colors.bg,
            borderColor: colors.border,
          }}
        >
          <div className="h-full flex items-center justify-between px-4 gap-4">
            {/* Call Status Section */}
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: colors.bg,
                  boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`,
                }}
              >
                <PhoneCall className="w-5 h-5" style={{ color: '#10B981' }} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold" style={{ color: colors.text }}>
                  Active Call
                </span>
                <span className="text-xs" style={{ color: colors.textSecondary }}>
                  {dialNumber || 'Ready to dial'}
                </span>
              </div>
            </div>

            {/* Call Controls */}
            <div className="flex items-center gap-2">
              {/* Quick dial input */}
              <div className="hidden md:block">
                <input
                  type="tel"
                  value={dialNumber}
                  onChange={(e) => setDialNumber(e.target.value)}
                  placeholder="Enter number"
                  className="w-48 h-9 px-3 border-0 rounded-xl text-sm outline-none"
                  style={{
                    background: colors.bg,
                    boxShadow: `inset 2px 2px 4px ${colors.shadowDark}, inset -2px -2px 4px ${colors.shadowLight}`,
                    color: colors.text
                  }}
                />
              </div>

              <button
                onClick={handleCall}
                disabled={!dialNumber}
                className="h-9 px-4 rounded-xl text-sm font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  ...getButtonStyle(),
                  background: dialNumber ? 'linear-gradient(145deg, #dcfce7, #bbf7d0)' : getButtonStyle().background,
                  color: dialNumber ? '#065f46' : colors.text,
                }}
              >
                <Phone className="w-4 h-4 inline mr-1" />
                <span className="hidden sm:inline">Call</span>
              </button>

              <button
                onClick={onClose}
                className="h-9 px-4 rounded-xl text-sm font-medium transition-all hover:scale-105"
                style={{
                  ...getButtonStyle(),
                  background: 'linear-gradient(145deg, #fee2e2, #fecaca)',
                  color: '#991b1b',
                }}
              >
                End
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}