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
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed right-0 top-0 h-full w-96 z-50 shadow-2xl"
          style={{
            background: colors.bg,
            boxShadow: `-20px 0 60px ${colors.shadowDark}`,
          }}
        >
          <Card className="h-full border-0 rounded-none" style={{ background: colors.bg }}>
            <CardHeader className="border-b" style={{ borderColor: colors.border }}>
              <div className="flex items-center justify-between">
                <CardTitle style={{ color: colors.text }}>Calls</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="rounded-xl h-9 w-9"
                  style={getButtonStyle()}
                >
                  <X className="w-4 h-4" style={{ color: colors.iconColor }} />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0 h-[calc(100%-80px)] overflow-hidden">
              <Tabs defaultValue="log" className="h-full">
                <TabsList className="w-full justify-start rounded-none border-b px-4" style={{ 
                  background: colors.bg,
                  borderColor: colors.border 
                }}>
                  <TabsTrigger value="log" style={{ color: colors.text }}>Call Log</TabsTrigger>
                  <TabsTrigger value="dial" style={{ color: colors.text }}>Dial</TabsTrigger>
                </TabsList>

                <TabsContent value="log" className="h-[calc(100%-48px)] overflow-y-auto p-4 space-y-3">
                  <div className="mb-3">
                    <div className="relative" style={getInsetStyle()}>
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.textTertiary }} />
                      <Input
                        placeholder="Search calls..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 border-0 rounded-xl"
                        style={{ background: 'transparent', color: colors.text }}
                      />
                    </div>
                  </div>

                  {filteredCalls.length === 0 ? (
                    <p className="text-center py-8" style={{ color: colors.textSecondary }}>
                      No calls found
                    </p>
                  ) : (
                    filteredCalls.map((call, index) => {
                      const caseData = cases.find(c => c.id === call.case_id);
                      const CallIcon = getCallIcon(call.direction, call.status);
                      const callColor = getCallColor(call.direction, call.status);
                      
                      return (
                        <motion.div
                          key={call.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                        >
                          <Link to={call.case_id ? createPageUrl(`Case?id=${call.case_id}`) : '#'}>
                            <div
                              className="p-3 rounded-xl hover:scale-[1.02] transition-all cursor-pointer"
                              style={{
                                background: colors.bg,
                                boxShadow: `4px 4px 8px ${colors.shadowDark}, -4px -4px 8px ${colors.shadowLight}`,
                              }}
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                  style={{
                                    background: `${callColor}20`,
                                    boxShadow: `inset 2px 2px 4px ${colors.shadowDark}`,
                                  }}
                                >
                                  <CallIcon className="w-5 h-5" style={{ color: callColor }} />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold truncate" style={{ color: colors.text }}>
                                        {caseData?.customer_name || 'Unknown'}
                                      </p>
                                      <p className="text-sm truncate" style={{ color: colors.textSecondary }}>
                                        {call.customer_phone}
                                      </p>
                                    </div>
                                    <Badge 
                                      className="text-xs border-0 flex-shrink-0"
                                      style={{
                                        background: call.status === 'completed' ? 'linear-gradient(145deg, #dcfce7, #bbf7d0)' : 'linear-gradient(145deg, #fee2e2, #fecaca)',
                                        color: call.status === 'completed' ? '#065f46' : '#991b1b'
                                      }}
                                    >
                                      {call.status}
                                    </Badge>
                                  </div>
                                  
                                  <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: colors.textTertiary }}>
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {format(new Date(call.created_date), 'MMM d, h:mm a')}
                                    </span>
                                    {call.duration && (
                                      <span>{Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      );
                    })
                  )}
                </TabsContent>

                <TabsContent value="dial" className="h-[calc(100%-48px)] p-4">
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl text-center" style={getInsetStyle()}>
                      <input
                        type="tel"
                        value={dialNumber}
                        onChange={(e) => setDialNumber(e.target.value)}
                        placeholder="Enter number"
                        className="w-full bg-transparent border-0 text-2xl text-center outline-none"
                        style={{ color: colors.text }}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => (
                        <button
                          key={digit}
                          onClick={() => handleDialPad(digit)}
                          className="h-16 rounded-xl text-xl font-semibold transition-all hover:scale-105"
                          style={{
                            ...getButtonStyle(),
                            color: colors.text,
                          }}
                        >
                          {digit}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <button
                        onClick={handleCall}
                        disabled={!dialNumber}
                        className="col-span-2 h-14 rounded-xl font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          ...getButtonStyle(),
                          background: dialNumber ? 'linear-gradient(145deg, #dcfce7, #bbf7d0)' : getButtonStyle().background,
                          color: dialNumber ? '#065f46' : colors.text,
                        }}
                      >
                        <Phone className="w-5 h-5 inline mr-2" />
                        Call
                      </button>
                      <button
                        onClick={() => setDialNumber(prev => prev.slice(0, -1))}
                        className="h-12 rounded-xl transition-all hover:scale-105"
                        style={{
                          ...getButtonStyle(),
                          color: colors.textSecondary,
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}