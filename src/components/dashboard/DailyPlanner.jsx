import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useTheme } from "@/components/ThemeProvider";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Clock, X, FolderOpen, Users, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DailyPlanner({ user, greeting, activeCases, urgentCases }) {
  const { colors, getButtonStyle } = useTheme();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [isEditingDateTime, setIsEditingDateTime] = useState(false);
  const [editDate, setEditDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [editTime, setEditTime] = useState(format(new Date(), 'HH:mm'));

  useEffect(() => {
    const savedEvents = localStorage.getItem('daily-planner-events');
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents));
    }
  }, []);

  const saveEvents = (updatedEvents) => {
    setEvents(updatedEvents);
    localStorage.setItem('daily-planner-events', JSON.stringify(updatedEvents));
  };

  const handleAddEvent = () => {
    if (!newEventTitle.trim()) return;
    
    const newEvent = {
      id: Date.now(),
      title: newEventTitle,
      time: newEventTime || format(new Date(), 'HH:mm'),
      date: format(selectedDate, 'yyyy-MM-dd'),
      createdBy: user?.email
    };
    
    const updatedEvents = [...events, newEvent];
    saveEvents(updatedEvents);
    setNewEventTitle('');
    setNewEventTime('');
    setShowAddEvent(false);
  };

  const handleDeleteEvent = (eventId) => {
    const updatedEvents = events.filter(e => e.id !== eventId);
    saveEvents(updatedEvents);
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  };

  const getEventsForDate = (date) => {
    return events.filter(e => e.date === format(date, 'yyyy-MM-dd'));
  };

  const todayEvents = getEventsForDate(selectedDate).sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div>
      <div className="space-y-4">
        {/* Mobile Greeting Section */}
        <div className="lg:hidden mb-4">
          <div
            className="p-4 rounded-2xl"
            style={{
              background: colors.bg,
              boxShadow: `inset 4px 4px 8px ${colors.shadowDark}, inset -4px -4px 8px ${colors.shadowLight}`
            }}
          >
            <h2 className="text-base font-bold leading-tight mb-2" style={{ color: colors.text }}>
              {greeting}
            </h2>
            <p className="text-xs mb-3" style={{ color: colors.textSecondary }}>
              {activeCases > 0 ? `You have ${activeCases} active cases` : 'All caught up!'}
              {urgentCases > 0 && ` · ${urgentCases} urgent`}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <Link to={createPageUrl("Cases")}>
                <button
                  className="w-full rounded-xl h-9 px-2 font-medium text-xs flex items-center justify-center gap-1 transition-all"
                  style={getButtonStyle()}
                >
                  <FolderOpen className="w-3 h-3" />
                  Cases
                </button>
              </Link>
              <Link to={createPageUrl("Customers")}>
                <button
                  className="w-full rounded-xl h-9 px-2 font-medium text-xs flex items-center justify-center gap-1 transition-all"
                  style={getButtonStyle()}
                >
                  <Users className="w-3 h-3" />
                  Customers
                </button>
              </Link>
              <Link to={createPageUrl("Analytics")}>
                <button
                  className="w-full rounded-xl h-9 px-2 font-medium text-xs flex items-center justify-center gap-1 transition-all"
                  style={getButtonStyle()}
                >
                  <BarChart3 className="w-3 h-3" />
                  Analytics
                </button>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Mini Calendar */}
          <div className="lg:col-span-2">
            <div
              className="rounded-2xl p-3"
              style={{
                background: colors.bg,
                boxShadow: `inset 4px 4px 8px ${colors.shadowDark}, inset -4px -4px 8px ${colors.shadowLight}`
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="h-6 w-6 md:h-7 md:w-7 rounded-xl border-0"
                  style={getButtonStyle()}
                >
                  <ChevronLeft className="w-3 h-3" style={{ color: colors.textSecondary }} />
                </Button>
                <h3 className="font-bold text-[10px] md:text-xs" style={{ color: colors.text }}>
                  {format(currentMonth, 'MMMM yyyy')}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="h-6 w-6 md:h-7 md:w-7 rounded-xl border-0"
                  style={getButtonStyle()}
                >
                  <ChevronRight className="w-3 h-3" style={{ color: colors.textSecondary }} />
                </Button>
              </div>
              
              <div className="grid grid-cols-7 gap-1 text-[10px] mb-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <div key={i} className="text-center font-semibold p-1" style={{ color: colors.textSecondary }}>
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1 text-[10px]">
                {Array.from({ length: getDaysInMonth()[0].getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="p-1" />
                ))}
                {getDaysInMonth().map((day) => {
                  const isToday = isSameDay(day, new Date());
                  const isSelected = isSameDay(day, selectedDate);
                  const hasEvents = getEventsForDate(day).length > 0;
                  
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className="relative p-1 rounded-lg flex items-center justify-center h-6 w-6 md:h-7 md:w-7 mx-auto transition-all"
                      style={{
                        color: colors.text,
                        background: colors.bg,
                        fontWeight: isToday || isSelected ? 'bold' : 'normal',
                        boxShadow: isToday || isSelected 
                          ? `inset 3px 3px 6px ${colors.shadowDark}, inset -3px -3px 6px ${colors.shadowLight}`
                          : 'none'
                      }}
                    >
                      {format(day, 'd')}
                      {hasEvents && (
                        <div 
                          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full"
                          style={{ 
                            background: colors.textSecondary 
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Selected Date Events */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-xs md:text-sm" style={{ color: colors.text }}>
                {format(selectedDate, 'EEEE, MMMM d')}
              </h4>
              <Button
                size="sm"
                onClick={() => setShowAddEvent(!showAddEvent)}
                className="rounded-xl h-7 md:h-8 px-2 md:px-3 border-0"
                style={showAddEvent 
                  ? {
                      background: colors.bg,
                      boxShadow: `inset 3px 3px 6px ${colors.shadowDark}, inset -3px -3px 6px ${colors.shadowLight}`,
                      color: colors.textSecondary
                    }
                  : getButtonStyle()}
              >
                <Plus className="w-3 h-3 md:w-4 md:h-4" />
              </Button>
            </div>

            <AnimatePresence>
              {showAddEvent && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-3 space-y-2"
                >
                  <Input
                    placeholder="Event title..."
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    className="rounded-xl border-0 h-8 md:h-9 text-xs md:text-sm"
                    style={{
                      background: colors.bg,
                      boxShadow: `inset 3px 3px 6px ${colors.shadowDark}, inset -3px -3px 6px ${colors.shadowLight}`,
                      color: colors.text
                    }}
                  />
                  <div className="flex gap-2">
                    <Input
                      type="time"
                      value={newEventTime}
                      onChange={(e) => setNewEventTime(e.target.value)}
                      className="rounded-xl border-0 h-8 md:h-9 text-xs md:text-sm flex-1"
                      style={{
                        background: colors.bg,
                        boxShadow: `inset 3px 3px 6px ${colors.shadowDark}, inset -3px -3px 6px ${colors.shadowLight}`,
                        color: colors.text
                      }}
                    />
                    <Button
                      onClick={handleAddEvent}
                      disabled={!newEventTitle.trim()}
                      className="rounded-xl h-8 md:h-9 px-3 md:px-4 border-0 text-xs md:text-sm"
                      style={getButtonStyle()}
                    >
                      Add
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div 
              className="space-y-2 max-h-40 md:max-h-48 overflow-y-auto rounded-xl p-2 md:p-3"
              style={{
                background: colors.bg,
                boxShadow: `inset 3px 3px 6px ${colors.shadowDark}, inset -3px -3px 6px ${colors.shadowLight}`
              }}
            >
              {todayEvents.length === 0 ? (
                <p className="text-center text-[10px] md:text-xs py-3 md:py-4" style={{ color: colors.textSecondary }}>
                  No events scheduled
                </p>
              ) : (
                <AnimatePresence>
                  {todayEvents.map((event) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex items-center justify-between p-2 rounded-xl"
                      style={{
                        background: colors.bg,
                        boxShadow: `3px 3px 6px ${colors.shadowDark}, -3px -3px 6px ${colors.shadowLight}`
                      }}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-[10px] md:text-xs font-medium" style={{ color: colors.textSecondary }}>
                          {event.time}
                        </span>
                        <span className="text-[10px] md:text-xs truncate" style={{ color: colors.text }}>
                          {event.title}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteEvent(event.id)}
                        className="h-5 w-5 md:h-6 md:w-6 rounded-lg flex-shrink-0"
                      >
                        <X className="w-2 h-2 md:w-3 md:h-3" style={{ color: colors.textSecondary }} />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}