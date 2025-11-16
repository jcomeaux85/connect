
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Folder, Lock, Globe, ArrowRight, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import CreateBoardModal from '@/components/boards/CreateBoardModal';

export default function RecentBoards({ boards, isLoading, onCreateBoard }) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreateBoard = async (boardData) => {
    if (onCreateBoard) {
      await onCreateBoard(boardData);
    }
    setShowCreateModal(false);
  };

  return (
    <>
      <Card 
        className="border-0 overflow-hidden"
        style={{
          background: '#E0E5EC',
          boxShadow: '12px 12px 24px #a3b1c6, -12px -12px 24px #ffffff'
        }}
      >
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(145deg, #f0f4f8, #d1d9e6)',
                  boxShadow: '6px 6px 12px #a3b1c6, -6px -6px 12px #ffffff'
                }}
              >
                <Folder className="w-7 h-7" style={{ color: '#6B7280' }} />
              </div>
              <div>
                <CardTitle className="text-xl font-bold" style={{ color: '#374151' }}>
                  Recent Boards
                </CardTitle>
                <p className="text-sm mt-1" style={{ color: '#6B7280' }}>Your latest project boards</p>
              </div>
            </div>
            <Link to={createPageUrl("Boards")}>
              <Button 
                variant="ghost" 
                className="rounded-2xl font-medium border-0"
                style={{
                  background: '#E0E5EC',
                  boxShadow: '4px 4px 8px #a3b1c6, -4px -4px 8px #ffffff',
                  color: '#6B7280'
                }}
              >
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="space-y-4">
              {Array(4).fill(0).map((_, i) => (
                <div 
                  key={i} 
                  className="flex items-center gap-4 p-4 rounded-2xl"
                  style={{
                    background: '#E0E5EC',
                    boxShadow: 'inset 4px 4px 8px #a3b1c6, inset -4px -4px 8px #ffffff'
                  }}
                >
                  <Skeleton className="w-12 h-12 rounded-2xl" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-48 mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : boards.length === 0 ? (
            <div className="text-center py-12">
              <div 
                className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4"
                style={{
                  background: '#E0E5EC',
                  boxShadow: 'inset 8px 8px 16px #a3b1c6, inset -8px -8px 16px #ffffff'
                }}
              >
                <Folder className="w-10 h-10" style={{ color: '#9CA3AF' }} />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#374151' }}>No boards yet</h3>
              <p className="mb-6" style={{ color: '#6B7280' }}>Create your first board to get started</p>
              <Button 
                className="rounded-2xl border-0"
                onClick={() => setShowCreateModal(true)}
                style={{
                  background: '#E0E5EC',
                  boxShadow: '6px 6px 12px #a3b1c6, -6px -6px 12px #ffffff',
                  color: '#4B5563'
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Board
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {boards.slice(0, 6).map((board, index) => (
                <motion.div
                  key={board.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ x: 4 }}
                  className="group"
                >
                  <Link to={createPageUrl(`Board?id=${board.id}`)}>
                    <div 
                      className="flex items-center gap-4 p-4 rounded-2xl transition-all duration-200"
                      style={{
                        background: '#E0E5EC',
                        boxShadow: '6px 6px 12px #a3b1c6, -6px -6px 12px #ffffff'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = 'inset 3px 3px 6px #a3b1c6, inset -3px -3px 6px #ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '6px 6px 12px #a3b1c6, -6px -6px 12px #ffffff';
                      }}
                    >
                      <div 
                        className="w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{ 
                          background: 'linear-gradient(145deg, #f0f4f8, #d1d9e6)',
                          boxShadow: '4px 4px 8px #a3b1c6, -4px -4px 8px #ffffff'
                        }}
                      >
                        <Folder className="w-6 h-6" style={{ color: board.color || '#6B7280' }} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold transition-colors truncate" style={{ color: '#374151' }}>
                          {board.title}
                        </h4>
                        <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
                          Updated {format(new Date(board.updated_date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Badge 
                          className="border-0 text-xs px-3 py-1 rounded-full"
                          style={{
                            background: board.visibility === 'private' 
                              ? 'linear-gradient(145deg, #fce4ec, #f8bbd0)' 
                              : 'linear-gradient(145deg, #e8f5e9, #c8e6c9)',
                            boxShadow: '2px 2px 4px #a3b1c6, -2px -2px 4px #ffffff',
                            color: board.visibility === 'private' ? '#c2185b' : '#2e7d32'
                          }}
                        >
                          {board.visibility === 'private' ? (
                            <Lock className="w-3 h-3 mr-1" />
                          ) : (
                            <Globe className="w-3 h-3 mr-1" />
                          )}
                          {board.visibility}
                        </Badge>
                        
                        <motion.div whileHover={{ x: 4 }}>
                          <ArrowRight className="w-4 h-4" style={{ color: '#9CA3AF' }} />
                        </motion.div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Board Modal */}
      <CreateBoardModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateBoard}
      />
    </>
  );
}
