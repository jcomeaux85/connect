
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Users, Calendar, BarChart3, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import CreateBoardModal from "../boards/CreateBoardModal";
import InviteTeamModal from "./InviteTeamModal";
import CalendarModal from "./CalendarModal";

export default function QuickActions({ onCreateBoard }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  const handleCreateBoard = async (boardData) => {
    if (onCreateBoard) {
      await onCreateBoard(boardData);
    }
    setShowCreateModal(false);
  };

  const actions = [
    {
      title: "Create Board",
      description: "Start new project",
      icon: Plus,
      gradient: "from-blue-500 to-cyan-500", // These gradients are no longer used in the neumorphic style, but kept in the data structure
      hoverGradient: "hover:from-blue-600 hover:to-cyan-600",
      onClick: () => setShowCreateModal(true)
    },
    {
      title: "Invite Team",
      description: "Add collaborators",
      icon: Users,
      gradient: "from-green-500 to-emerald-500",
      hoverGradient: "hover:from-green-600 hover:to-emerald-600",
      onClick: () => setShowInviteModal(true)
    },
    {
      title: "Calendar",
      description: "View deadlines",
      icon: Calendar,
      gradient: "from-amber-500 to-orange-500",
      hoverGradient: "hover:from-amber-600 hover:to-orange-600",
      onClick: () => setShowCalendarModal(true)
    },
    {
      title: "Analytics",
      description: "View insights",
      icon: BarChart3,
      gradient: "from-purple-500 to-pink-500",
      hoverGradient: "hover:from-purple-600 hover:to-pink-600",
      link: createPageUrl("Analytics")
    }
  ];

  return (
    <>
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
              <Zap className="w-7 h-7" style={{ color: '#6B7280' }} />
            </div>
            <div>
              <CardTitle className="text-lg font-bold" style={{ color: '#374151' }}>
                Quick Actions
              </CardTitle>
              <p className="text-sm" style={{ color: '#6B7280' }}>Get things done faster</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {actions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group"
            >
              {action.link ? (
                <Link to={action.link}>
                  <div 
                    className="flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 cursor-pointer"
                    style={{
                      background: '#E0E5EC',
                      boxShadow: '6px 6px 12px #a3b1c6, -6px -6px 12px #ffffff'
                    }}
                  >
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(145deg, #f0f4f8, #d1d9e6)',
                        boxShadow: 'inset 3px 3px 6px #a3b1c6, inset -3px -3px 6px #ffffff'
                      }}
                    >
                      <action.icon className="w-5 h-5" style={{ color: '#6B7280' }} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium" style={{ color: '#374151' }}>
                        {action.title}
                      </p>
                      <p className="text-sm" style={{ color: '#6B7280' }}>{action.description}</p>
                    </div>
                  </div>
                </Link>
              ) : (
                <div 
                  className="flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 cursor-pointer"
                  onClick={action.onClick}
                  style={{
                    background: '#E0E5EC',
                    boxShadow: '6px 6px 12px #a3b1c6, -6px -6px 12px #ffffff'
                  }}
                >
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(145deg, #f0f4f8, #d1d9e6)',
                      boxShadow: 'inset 3px 3px 6px #a3b1c6, inset -3px -3px 6px #ffffff'
                    }}
                  >
                    <action.icon className="w-5 h-5" style={{ color: '#6B7280' }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium" style={{ color: '#374151' }}>
                      {action.title}
                    </p>
                    <p className="text-sm" style={{ color: '#6B7280' }}>{action.description}</p>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateBoardModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateBoard}
      />

      <InviteTeamModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />

      <CalendarModal
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
      />
    </>
  );
}
