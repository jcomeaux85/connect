import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Search, Clock, AlertCircle, Sparkles, Send, FileText, Mic, Calendar, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import CreateCaseModal from "../components/cases/CreateCaseModal";

const STATUS_COLORS = {
  new: { bg: '#FEF3C7', text: '#92400E', label: 'Open' },
  in_progress: { bg: '#DBEAFE', text: '#1E40AF', label: 'In Progress' },
  pending: { bg: '#FEF9C3', text: '#713F12', label: 'Pending' },
  resolved: { bg: '#DCFCE7', text: '#065F46', label: 'Resolved' },
  closed: { bg: '#F3F4F6', text: '#6B7280', label: 'Closed' },
};

const PRIORITY_COLORS = {
  urgent: '#EF4444',
  high: '#F59E0B',
  medium: '#3B82F6',
  low: '#10B981',
};

const AI_ACTIONS = [
  { label: 'Summarize Case', icon: FileText },
  { label: 'Draft Email', icon: MessageSquare },
  { label: 'Find KB Article', icon: Search },
  { label: 'Summarize Transcript', icon: Mic },
  { label: 'Generate Action Items', icon: Calendar },
  { label: 'Draft SMS', icon: Send },
];

export default function Cases() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState([
    { role: 'assistant', content: "I'm your AI Case Assistant. I can summarize calls, draft emails, find knowledge base articles, and document case details. How can I help?" }
  ]);
  const [aiLoading, setAiLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: () => base44.entities.Case.list('-updated_date'),
  });

  const createCaseMutation = useMutation({
    mutationFn: (data) => base44.entities.Case.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cases'] }); setShowCreateModal(false); },
  });

  const filteredCases = cases.filter(c => {
    const matchSearch = !searchQuery ||
      c.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.case_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleAiSend = async () => {
    if (!aiInput.trim()) return;
    const msg = aiInput;
    setAiInput('');
    setAiMessages(prev => [...prev, { role: 'user', content: msg }]);
    setAiLoading(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({ prompt: `You are an AI Case Assistant for a benefits call center. The user asked: "${msg}". Respond helpfully and concisely.` });
      setAiMessages(prev => [...prev, { role: 'assistant', content: res }]);
    } catch {
      setAiMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    }
    setAiLoading(false);
  };

  return (
    <div className="flex h-full bg-gray-50">
      {/* Cases list */}
      <div className="flex-1 min-w-0 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Cases</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage and resolve customer cases</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 h-9 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Case
          </button>
        </div>

        {/* Search + filter tabs */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              className="w-full pl-9 pr-3 h-9 rounded-xl bg-white border border-gray-200 text-sm text-gray-700 placeholder-gray-400 outline-none focus:border-violet-400"
              placeholder="Search cases..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1">
            {['all', 'new', 'in_progress', 'resolved'].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className="px-3 h-7 rounded-lg text-xs font-semibold transition-all"
                style={filterStatus === s ? { background: '#7C3AED', color: '#fff' } : { color: '#6B7280' }}
              >
                {s === 'all' ? 'All' : s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Cases */}
        <div className="space-y-2">
          {isLoading && (
            <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto" /></div>
          )}
          {!isLoading && filteredCases.length === 0 && (
            <div className="text-center py-12 text-gray-400">No cases found</div>
          )}
          {filteredCases.map((c, i) => {
            const sc = STATUS_COLORS[c.status] || STATUS_COLORS.new;
            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Link to={createPageUrl(`Case?id=${c.id}`)}>
                  <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 hover:border-violet-200 hover:shadow-sm transition-all flex items-center gap-3">
                    <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: PRIORITY_COLORS[c.priority] || '#9CA3AF' }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-bold text-gray-400">{c.case_number || `CS-${c.id?.slice(-4)}`}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: sc.bg, color: sc.text }}>{sc.label}</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 truncate">{c.description || c.customer_name || 'Case'}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-xs text-gray-400">{c.customer_name}</span>
                        <span className="text-gray-200">·</span>
                        <Clock className="w-3 h-3 text-gray-300" />
                        <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(c.created_date), { addSuffix: true })}</span>
                      </div>
                    </div>
                    {c.priority === 'urgent' && <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* AI Assistant panel */}
      <div className="w-80 flex-shrink-0 p-4 border-l border-gray-100 flex flex-col bg-white">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800">AI Case Assistant</p>
            <p className="text-[10px] text-gray-400">Powered by Connect AI</p>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="grid grid-cols-2 gap-1.5 mb-4">
          {AI_ACTIONS.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => { setAiInput(label); }}
              className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-gray-50 hover:bg-violet-50 hover:border-violet-200 border border-gray-100 transition-colors text-center"
            >
              <Icon className="w-4 h-4 text-violet-500" />
              <span className="text-[10px] font-medium text-gray-600 leading-tight">{label}</span>
            </button>
          ))}
        </div>

        {/* Chat */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-3 min-h-0">
          {aiMessages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                m.role === 'user' ? 'bg-violet-600 text-white' : 'bg-gray-50 text-gray-700 border border-gray-100'
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {aiLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 bg-gray-50">
          <input
            className="flex-1 text-xs bg-transparent outline-none text-gray-700 placeholder-gray-400"
            placeholder="Ask the AI assistant..."
            value={aiInput}
            onChange={e => setAiInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAiSend()}
          />
          <button onClick={handleAiSend} className="text-violet-500 hover:text-violet-700 transition-colors">
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <CreateCaseModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onSubmit={d => createCaseMutation.mutate(d)} />
    </div>
  );
}