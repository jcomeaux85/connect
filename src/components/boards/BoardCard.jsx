
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Folder, Lock, Globe, MoreHorizontal, Calendar, Trash2, Edit3 } from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function BoardCard({ board, viewMode, index, onDelete, onEdit }) {
  const handleDelete = (e) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    if (window.confirm(`Are you sure you want to delete the board "${board.title}"? This cannot be undone.`)) {
      onDelete(board.id);
    }
  };

  const handleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit(board);
  };

  const boardColor = board.color || '#0073EA';

  if (viewMode === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <Card 
          className="border-0 overflow-hidden"
          style={{
            background: '#E0E5EC',
            boxShadow: '6px 6px 12px #a3b1c6, -6px -6px 12px #ffffff'
          }}
        >
          <div className="flex items-center">
            <div
              className="w-1.5 h-16 flex-shrink-0" 
              style={{ backgroundColor: boardColor }}
            />
            <CardContent className="p-3 flex-1">
              <div className="flex items-center justify-between">
                <Link to={createPageUrl(`Board?id=${board.id}`)} className="flex items-center gap-3 flex-grow min-w-0">
                  <div 
                    className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ 
                      background: 'linear-gradient(145deg, #f0f2f5, #cad3df)', 
                      boxShadow: '4px 4px 8px #a3b1c6, -4px -4px 8px #ffffff' 
                    }} 
                  >
                    <Folder 
                      className="w-4 h-4"
                      style={{ color: boardColor }}
                    />
                  </div>
                  <div className="flex-grow min-w-0">
                    <h3 
                      className="font-semibold text-sm truncate"
                      style={{ color: '#374151' }}
                    >
                      {board.title}
                    </h3>
                    <p 
                      className="text-xs mt-0.5 truncate"
                      style={{ color: '#6B7280' }}
                    >
                      {board.description || 'No description'}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  <Badge 
                    className="border-0 text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: board.visibility === 'private' 
                        ? 'linear-gradient(145deg, #fce4ec, #f8bbd0)' 
                        : 'linear-gradient(145deg, #e8f5e9, #c8e6c9)',
                      boxShadow: '2px 2px 4px #a3b1c6, -2px -2px 4px #ffffff',
                      color: board.visibility === 'private' ? '#c2185b' : '#2e7d32'
                    }}
                  >
                    {board.visibility === 'private' ? (
                      <Lock className="w-2.5 h-2.5 mr-1" />
                    ) : (
                      <Globe className="w-2.5 h-2.5 mr-1" />
                    )}
                    {board.visibility}
                  </Badge>
                  <div className="text-right hidden sm:block">
                    <p 
                      className="text-xs"
                      style={{ color: '#9CA3AF' }}
                    >
                      {formatDistanceToNow(new Date(board.updated_date), { addSuffix: true })}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 rounded-full border-0" 
                        style={{ 
                          background: '#E0E5EC', 
                          boxShadow: '3px 3px 6px #a3b1c6, -3px -3px 6px #ffffff',
                          color: '#6B7280'
                        }}
                        onClick={(e) => {e.preventDefault(); e.stopPropagation();}}
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="end" 
                      className="border-0 rounded-2xl"
                      style={{
                        background: '#E0E5EC',
                        boxShadow: '8px 8px 16px #a3b1c6, -8px -8px 16px #ffffff'
                      }}
                    >
                      <DropdownMenuItem onClick={handleEdit}>
                        <Edit3 className="w-3.5 h-3.5 mr-2" />
                        Edit Board
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                        <Trash2 className="w-3.5 h-3.5 mr-2" />
                        Delete Board
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
      </motion.div>
    );
  }

  // Grid View
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="h-full"
    >
      <Card 
        className="border-0 h-full flex flex-col rounded-3xl overflow-hidden"
        style={{
          background: '#E0E5EC',
          boxShadow: '10px 10px 20px #a3b1c6, -10px -10px 20px #ffffff'
        }}
      >
        <div 
            className="h-3 w-full"
            style={{ background: `linear-gradient(135deg, ${boardColor}40, ${boardColor}80)` }}
        />
        <Link to={createPageUrl(`Board?id=${board.id}`)} className="flex-grow block p-6">
          <div className="flex items-start justify-between mb-4">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: '#E0E5EC',
                boxShadow: '6px 6px 12px #a3b1c6, -6px -6px 12px #ffffff'
              }}
            >
              <Folder className="w-6 h-6" style={{ color: boardColor }} />
            </div>
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
              {board.visibility === 'private' ? <Lock className="w-3 h-3 mr-1.5" /> : <Globe className="w-3 h-3 mr-1.5" />}
              {board.visibility}
            </Badge>
          </div>
          
          <h3 
            className="font-semibold text-lg mb-2" 
            style={{ color: '#374151' }}
          >
            {board.title}
          </h3>
          
          <p 
            className="text-sm mb-5 line-clamp-2 flex-grow" 
            style={{ color: '#6B7280' }}
          >
            {board.description || 'No description provided.'}
          </p>
          
          <div 
            className="flex items-center justify-between text-xs mt-auto pt-4" 
            style={{ 
              color: '#9CA3AF',
              borderTop: '1px solid #D1D9E6'
            }}
          >
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDistanceToNow(new Date(board.updated_date), { addSuffix: true })}</span>
            </div>
          </div>
        </Link>
        <div 
          className="p-2"
          style={{ 
            borderTop: '1px solid #D1D9E6',
            background: '#E0E5EC'
          }}
        >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-center text-xs rounded-xl border-0"
                  style={{
                    background: '#E0E5EC',
                    boxShadow: '3px 3px 6px #a3b1c6, -3px -3px 6px #ffffff',
                    color: '#6B7280'
                  }}
                >
                  <MoreHorizontal className="w-4 h-4 mr-1.5" /> Options
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-56 border-0 rounded-2xl"
                style={{
                  background: '#E0E5EC',
                  boxShadow: '8px 8px 16px #a3b1c6, -8px -8px 16px #ffffff'
                }}
              >
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit3 className="w-3.5 h-3.5 mr-2" />
                  Edit Board
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  Delete Board
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </Card>
    </motion.div>
  );
}
