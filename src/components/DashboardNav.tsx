import React, { useState } from 'react';
import {
  LayoutDashboard,
  Plus,
  Trash2,
  Edit3,
  Check,
  BookOpen,
  Layers,
  Database,
} from 'lucide-react';
import type { Dashboard } from '../types';

interface Props {
  dashboards: Dashboard[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  activePanel: string;
  onSetPanel: (p: 'chat' | 'metrics' | 'templates') => void;
}

const DashboardNav: React.FC<Props> = ({
  dashboards,
  activeId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  activePanel,
  onSetPanel,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');

  const handleCreate = () => {
    if (newName.trim()) {
      onCreate(newName.trim());
      setNewName('');
      setShowNew(false);
    }
  };

  const handleRename = (id: string) => {
    if (editName.trim()) {
      onRename(id, editName.trim());
      setEditingId(null);
    }
  };

  return (
    <div className="w-[240px] bg-bg2 border-r border-border flex flex-col shrink-0 h-full">
      {/* Logo */}
      <div className="px-4 py-3 border-b border-border">
        <h1 className="text-sm font-bold text-text flex items-center gap-2">
          <LayoutDashboard size={16} className="text-accent" />
          Dashboard Hub
        </h1>
        <p className="text-[10px] text-muted mt-0.5">Analytics 2.0 Prototype</p>
      </div>

      {/* Dashboards */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        <div className="flex items-center justify-between px-2 mb-2">
          <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">
            Dashboards
          </span>
          <button
            onClick={() => setShowNew(true)}
            className="text-muted hover:text-accent transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>

        {showNew && (
          <div className="mx-1 mb-2">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Dashboard name..."
              className="w-full bg-bg3 border border-border rounded-lg px-3 py-1.5 text-xs text-text outline-none focus:border-accent"
            />
            <div className="flex gap-1 mt-1">
              <button
                onClick={handleCreate}
                className="flex-1 text-[10px] bg-accent text-white rounded py-1 hover:bg-accent/80"
              >
                Create
              </button>
              <button
                onClick={() => setShowNew(false)}
                className="flex-1 text-[10px] bg-bg3 text-muted rounded py-1 hover:text-text"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {dashboards.length === 0 && !showNew && (
          <p className="text-[11px] text-muted px-2 py-4 text-center">
            No dashboards yet. Create one or use the chatbot.
          </p>
        )}

        {dashboards.map((d) => (
          <div
            key={d.id}
            className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer mb-0.5 transition-all ${
              activeId === d.id
                ? 'bg-accent/10 border border-accent/30 text-text'
                : 'hover:bg-bg3 text-muted hover:text-text border border-transparent'
            }`}
            onClick={() => onSelect(d.id)}
          >
            <LayoutDashboard
              size={13}
              className={activeId === d.id ? 'text-accent' : 'text-muted'}
            />
            {editingId === d.id ? (
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRename(d.id)}
                onBlur={() => handleRename(d.id)}
                className="flex-1 bg-bg3 border border-accent rounded px-2 py-0.5 text-xs text-text outline-none"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="flex-1 text-xs truncate">{d.name}</span>
            )}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {editingId === d.id ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRename(d.id);
                  }}
                  className="text-green-400 hover:text-green-300"
                >
                  <Check size={12} />
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingId(d.id);
                    setEditName(d.name);
                  }}
                  className="text-muted hover:text-text"
                >
                  <Edit3 size={12} />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(d.id);
                }}
                className="text-muted hover:text-red-400"
              >
                <Trash2 size={12} />
              </button>
            </div>
            {d.shared && (
              <span className="text-[9px] text-accent">shared</span>
            )}
          </div>
        ))}
      </div>

      {/* Bottom nav */}
      <div className="border-t border-border p-2 space-y-0.5">
        <button
          onClick={() => onSetPanel('metrics')}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
            activePanel === 'metrics'
              ? 'bg-accent/10 text-accent'
              : 'text-muted hover:bg-bg3 hover:text-text'
          }`}
        >
          <Database size={13} />
          Metric Explorer
        </button>
        <button
          onClick={() => onSetPanel('templates')}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
            activePanel === 'templates'
              ? 'bg-accent/10 text-accent'
              : 'text-muted hover:bg-bg3 hover:text-text'
          }`}
        >
          <Layers size={13} />
          Template Library
        </button>
        <button
          onClick={() => onSetPanel('chat')}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
            activePanel === 'chat'
              ? 'bg-accent/10 text-accent'
              : 'text-muted hover:bg-bg3 hover:text-text'
          }`}
        >
          <BookOpen size={13} />
          AI Chatbot
        </button>
      </div>
    </div>
  );
};

export default DashboardNav;
