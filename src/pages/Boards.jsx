
import { useState, useEffect } from "react";
import { Board } from "@/entities/Board";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Plus, 
  Search, 
  Filter, 
  Grid3X3, 
  LayoutList,
  Folder,
  BarChart // Added BarChart for Analytics button
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import CreateBoardModal from "../components/boards/CreateBoardModal";
import EditBoardModal from "../components/boards/EditBoardModal";
import BoardCard from "../components/boards/BoardCard";

export default function Boards() {
  const [boards, setBoards] = useState([]);
  const [filteredBoards, setFilteredBoards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBoard, setEditingBoard] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid");

  useEffect(() => {
    loadBoards();
  }, []);

  useEffect(() => {
    filterBoards();
  }, [searchQuery, boards]);

  const loadBoards = async () => {
    setIsLoading(true);
    const data = await Board.list("-updated_date");
    setBoards(data);
    setIsLoading(false);
  };

  const filterBoards = () => {
    if (!searchQuery) {
      setFilteredBoards(boards);
      return;
    }

    const lowercasedQuery = searchQuery.toLowerCase();
    const filtered = boards.filter(board =>
      board.title.toLowerCase().includes(lowercasedQuery) ||
      board.description?.toLowerCase().includes(lowercasedQuery)
    );
    setFilteredBoards(filtered);
  };

  const handleCreateBoard = async (boardData) => {
    const newBoard = await Board.create(boardData);
    setBoards(prev => [newBoard, ...prev].sort((a,b) => new Date(b.updated_date) - new Date(a.updated_date)));
    setShowCreateModal(false);
  };

  const handleOpenEditModal = (board) => {
    setEditingBoard(board);
    setShowEditModal(true);
  };

  const handleUpdateBoard = async (boardId, updatedData) => {
    try {
      await Board.update(boardId, updatedData);
      setBoards(prevBoards => 
        prevBoards.map(b => 
          b.id === boardId ? { ...b, ...updatedData, updated_date: new Date().toISOString() } : b
        ).sort((a,b) => new Date(b.updated_date) - new Date(a.updated_date))
      );
      setShowEditModal(false);
      setEditingBoard(null);
    } catch (error) {
      console.error("Error updating board:", error);
      loadBoards(); 
    }
  };

  const handleDeleteBoard = async (boardId) => {
    try {
      await Board.delete(boardId);
      setBoards(prev => prev.filter(board => board.id !== boardId));
    } catch (error) {
      console.error("Error deleting board:", error);
    }
  };

  return (
    <div className="p-4 md:p-6 min-h-screen" style={{ background: '#E0E5EC' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: '#374151' }}>
              My Boards
            </h1>
            <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
              Manage your projects and workflows
            </p>
          </div>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="rounded-2xl h-12 px-6 font-medium text-sm border-0"
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

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <div 
              className="rounded-2xl"
              style={{
                background: '#E0E5EC',
                boxShadow: 'inset 4px 4px 8px #a3b1c6, inset -4px -4px 8px #ffffff'
              }}
            >
              <Search className="w-4 h-4 absolute left-4 top-1/2 transform -translate-y-1/2" style={{ color: '#9CA3AF' }} />
              <Input
                placeholder="Search boards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 border-0 rounded-2xl h-12 text-sm"
                style={{ background: 'transparent', color: '#4B5563' }}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setViewMode("grid")}
              className={`rounded-2xl h-12 px-4 border-0`}
              style={viewMode === "grid" ? {
                background: '#E0E5EC',
                boxShadow: 'inset 4px 4px 8px #a3b1c6, inset -4px -4px 8px #ffffff',
                color: '#4B5563'
              } : {
                background: '#E0E5EC',
                boxShadow: '4px 4px 8px #a3b1c6, -4px -4px 8px #ffffff',
                color: '#6B7280'
              }}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setViewMode("list")}
              className={`rounded-2xl h-12 px-4 border-0`}
              style={viewMode === "list" ? {
                background: '#E0E5EC',
                boxShadow: 'inset 4px 4px 8px #a3b1c6, inset -4px -4px 8px #ffffff',
                color: '#4B5563'
              } : {
                background: '#E0E5EC',
                boxShadow: '4px 4px 8px #a3b1c6, -4px -4px 8px #ffffff',
                color: '#6B7280'
              }}
            >
              <LayoutList className="w-4 h-4" />
            </Button>
            <Link to={createPageUrl("/analytics")}>
              <Button 
                className="rounded-2xl h-12 px-4 text-sm border-0"
                style={{
                  background: '#E0E5EC',
                  boxShadow: '4px 4px 8px #a3b1c6, -4px -4px 8px #ffffff',
                  color: '#6B7280'
                }}
              >
                <BarChart className="w-4 h-4 mr-1.5" />
                Analytics
              </Button>
            </Link>
            <Button 
              className="rounded-2xl h-12 px-4 text-sm border-0"
              style={{
                background: '#E0E5EC',
                boxShadow: '4px 4px 8px #a3b1c6, -4px -4px 8px #ffffff',
                color: '#6B7280'
              }}
            >
              <Filter className="w-4 h-4 mr-1.5" />
              Filter
            </Button>
          </div>
        </div>

        {/* Boards Display */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <div className={`gap-6 ${viewMode === "grid" ? "grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "space-y-3"}`}>
              {Array(viewMode === "grid" ? 8 : 5).fill(0).map((_, i) => (
                 viewMode === "grid" ? (
                    <Card key={i} className="animate-pulse bg-white/50 rounded-xl shadow-md h-[220px]">
                      <CardContent className="p-5 space-y-3 h-full flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start">
                              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                              <div className="w-14 h-5 bg-gray-200 rounded-full"></div>
                          </div>
                          <div className="h-5 bg-gray-200 rounded w-3/4 mt-3"></div>
                          <div className="h-3 bg-gray-200 rounded w-full mt-1.5"></div>
                          <div className="h-3 bg-gray-200 rounded w-2/3 mt-1"></div>
                        </div>
                        <div className="flex justify-between items-center pt-2.5 border-t border-gray-200/50 mt-2.5">
                            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                        </div>
                      </CardContent>
                    </Card>
                 ) : (
                    <Card key={i} className="animate-pulse bg-white/50 rounded-lg shadow-sm h-[60px]">
                        <CardContent className="p-3 flex items-center justify-between h-full">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-full bg-gray-200 rounded-l-lg"></div>
                                <div className="w-8 h-8 bg-gray-200 rounded-md"></div>
                                <div>
                                    <div className="h-3.5 bg-gray-200 rounded w-28 mb-1"></div>
                                    <div className="h-2.5 bg-gray-200 rounded w-20"></div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-12 bg-gray-200 rounded-full"></div>
                                <div className="h-3 w-20 bg-gray-200 rounded-md hidden sm:block"></div>
                                <div className="h-7 w-7 bg-gray-200 rounded-md"></div>
                            </div>
                        </CardContent>
                    </Card>
                 )
              ))}
            </div>
          ) : filteredBoards.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Folder className="w-12 h-12 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-[#323338] mb-2">
                {searchQuery ? "No boards found" : "No boards yet"}
              </h3>
              <p className="text-[#676879] mb-6">
                {searchQuery 
                  ? "Try adjusting your search query or filters." 
                  : "Get started by creating your first project board!"
                }
              </p>
              {!searchQuery && (
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-[#0073EA] to-[#0056B3] hover:from-[#0056B3] hover:to-[#0073EA] text-white rounded-xl h-12 px-6 font-medium shadow-md hover:shadow-lg transition-all"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Board
                </Button>
              )}
            </motion.div>
          ) : (
            <div className={viewMode === "grid" 
              ? "grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
              : "space-y-3"
            }>
              {filteredBoards.map((board, index) => (
                <BoardCard
                  key={board.id}
                  board={board}
                  viewMode={viewMode}
                  index={index}
                  onDelete={handleDeleteBoard}
                  onEdit={handleOpenEditModal}
                />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Create Board Modal */}
        <CreateBoardModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateBoard}
        />
        {/* Edit Board Modal */}
        {editingBoard && (
          <EditBoardModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setEditingBoard(null);
            }}
            onSubmit={handleUpdateBoard}
            board={editingBoard}
          />
        )}
      </div>
    </div>
  );
}
