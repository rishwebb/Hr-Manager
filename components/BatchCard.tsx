
import React from 'react';
import { Calendar, MoreVertical, ExternalLink, RefreshCcw, Trash2, Edit2, Settings } from 'lucide-react';
import { Batch } from '../types';
import { getCurrentDay } from '../utils/time';

interface BatchCardProps {
  batch: Batch;
  onView: (id: string) => void;
  onEdit: (batch: Batch) => void;
  onDelete: (id: string) => void;
  onReset: (id: string) => void;
  onManageTemplates?: () => void;
}

const BatchCard: React.FC<BatchCardProps> = ({ batch, onView, onEdit, onDelete, onReset, onManageTemplates }) => {
  const currentDay = getCurrentDay(batch.startDate);
  const [showMenu, setShowMenu] = React.useState(false);

  return (
    <div className="relative bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group">
      <div className="p-5" onClick={() => onView(batch.id)}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{batch.name}</h2>
              {batch.isRecording && (
                <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-[10px] font-bold rounded-full animate-pulse uppercase">Recording</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-slate-500 text-xs">
              <Calendar className="w-3.5 h-3.5" />
              <span>Started {new Date(batch.startDate).toLocaleDateString()}</span>
            </div>
          </div>
          <button 
            className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-xs font-semibold mb-1.5">
            <span className="text-indigo-600 uppercase tracking-wider">Day {currentDay} of 14</span>
            <span className="text-slate-400">{Math.min(100, Math.round((currentDay / 14) * 100))}% Complete</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-indigo-500 h-full transition-all duration-500" 
              style={{ width: `${Math.min(100, (currentDay / 14) * 100)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a 
            href={batch.whatsappLink} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 text-sm font-semibold py-2 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Join WhatsApp
          </a>
        </div>
      </div>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
          <div className="absolute right-4 top-14 bg-white border border-slate-200 rounded-xl shadow-xl z-20 w-48 py-2 overflow-hidden">
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(batch); setShowMenu(false); }}
              className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Edit Batch
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onReset(batch.id); setShowMenu(false); }}
              className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-amber-600 hover:bg-slate-50 transition-colors"
            >
              <RefreshCcw className="w-4 h-4" />
              Reset to Day 1
            </button>
            {onManageTemplates && (
               <button 
                onClick={(e) => { e.stopPropagation(); onManageTemplates(); setShowMenu(false); }}
                className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Manage Templates
              </button>
            )}
            <div className="h-px bg-slate-100 mx-2 my-1"></div>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(batch.id); setShowMenu(false); }}
              className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-rose-600 hover:bg-slate-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Batch
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default BatchCard;
