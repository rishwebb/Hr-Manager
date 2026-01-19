
import React from 'react';
import { CheckCircle, Clock, Send, FileText, Copy, Download, Trash2, Type, Edit3 } from 'lucide-react';
import { Task, TaskStatus } from '../types';
import { isTimePassed } from '../utils/time';

interface TaskCardProps {
  task: Task;
  onMarkSent: (taskId: string) => void;
  onCopy: (text: string) => void;
  onDownload: (fileName: string) => void;
  onDelete?: (taskId: string) => void;
  onEdit?: (task: Task) => void;
  isTemplateMode?: boolean;
  viewingDay: number;
  currentDay: number;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onMarkSent, 
  onCopy, 
  onDownload, 
  onDelete,
  onEdit,
  isTemplateMode, 
  viewingDay, 
  currentDay 
}) => {
  const timePassed = isTimePassed(task.time);
  
  // Strict Universal Day-Tracking Logic
  let status: TaskStatus;
  if (task.isDone) {
    status = TaskStatus.COMPLETED; // GREEN
  } else if (viewingDay < currentDay) {
    status = TaskStatus.OVERDUE; // RED (Past day undone)
  } else if (viewingDay > currentDay) {
    status = TaskStatus.UPCOMING; // YELLOW (Future day)
  } else {
    // Current Day logic: hour-by-hour
    status = timePassed ? TaskStatus.OVERDUE : TaskStatus.UPCOMING;
  }

  // Visual Styling Mapping
  const getStyles = () => {
    if (isTemplateMode) return { bg: 'bg-white border-slate-200', text: 'text-slate-800', subText: 'text-slate-500', icon: 'text-slate-400' };
    
    switch (status) {
      case TaskStatus.COMPLETED: 
        return { bg: 'bg-emerald-500 border-emerald-600', text: 'text-black', subText: 'text-black/70', icon: 'text-black' };
      case TaskStatus.OVERDUE: 
        return { bg: 'bg-rose-600 border-rose-700', text: 'text-white', subText: 'text-white/80', icon: 'text-white' };
      case TaskStatus.UPCOMING: 
        return { bg: 'bg-amber-400 border-amber-500', text: 'text-black', subText: 'text-black/70', icon: 'text-black' };
      default:
        return { bg: 'bg-white border-slate-200', text: 'text-slate-800', subText: 'text-slate-500', icon: 'text-slate-400' };
    }
  };

  const styles = getStyles();

  return (
    <div className={`p-5 rounded-2xl border-2 transition-all duration-300 shadow-lg ${styles.bg} mb-5 group relative overflow-hidden`}>
      {/* Background decoration for Overdue */}
      {status === TaskStatus.OVERDUE && !task.isDone && !isTemplateMode && (
        <div className="absolute top-0 right-0 p-1 bg-white/20 rounded-bl-xl">
           <span className="text-[10px] font-black px-2">ALERT</span>
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <Clock className={`w-4 h-4 ${styles.icon}`} />
          <span className={`text-sm font-black tracking-tight ${styles.text}`}>{task.time}</span>
        </div>
        <div className="flex items-center gap-2">
          {onEdit && (
            <button 
              onClick={() => onEdit(task)}
              className={`p-1 hover:bg-black/10 rounded transition-colors ${styles.icon}`}
              title="Edit Task"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
          {!isTemplateMode && (
            <div className="flex items-center gap-1">
               {task.isDone ? (
                 <div className="flex items-center gap-1 px-2 py-0.5 bg-black/10 rounded-full">
                    <CheckCircle className={`w-4 h-4 ${styles.icon}`} />
                    <span className={`text-[10px] font-bold ${styles.text}`}>SENT</span>
                 </div>
               ) : (
                 <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/10 ${styles.text}`}>
                   {status === TaskStatus.OVERDUE ? 'OVERDUE' : 'UPCOMING'}
                 </span>
               )}
            </div>
          )}
        </div>
      </div>

      <h3 className={`font-bold text-base mb-4 leading-snug ${styles.text}`}>
        {task.message}
      </h3>

      <div className="flex flex-col gap-3">
        <div className={`flex items-center justify-between p-3 rounded-xl bg-black/5 border border-black/5`}>
          <div className="flex items-center gap-2 overflow-hidden flex-1">
            {task.type === 'media' ? (
              <FileText className={`w-4 h-4 flex-shrink-0 ${styles.icon}`} />
            ) : (
              <Type className={`w-4 h-4 flex-shrink-0 ${styles.icon}`} />
            )}
            <span className={`text-xs font-medium truncate ${styles.subText}`}>
              {task.type === 'media' ? task.mediaName : 'Instructional Text'}
            </span>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => onCopy(task.message)}
              className="p-2 hover:bg-black/10 rounded-lg transition-colors"
              title="Copy Message"
            >
              <Copy className={`w-4 h-4 ${styles.icon}`} />
            </button>
            {task.type === 'media' && !isTemplateMode && (
              <button 
                onClick={() => onDownload(task.mediaName)}
                className="p-2 hover:bg-black/10 rounded-lg transition-colors"
                title="Download Attachment"
              >
                <Download className={`w-4 h-4 ${styles.icon}`} />
              </button>
            )}
          </div>
        </div>

        {!isTemplateMode && status === TaskStatus.OVERDUE && !task.isDone && (
          <button
            onClick={() => onMarkSent(task.id)}
            className="w-full flex items-center justify-center gap-2 bg-indigo-700 hover:bg-indigo-800 text-white py-3.5 rounded-xl text-sm font-black transition-all active:scale-95 shadow-xl"
          >
            <Send className="w-4 h-4" />
            MARK AS SENT
          </button>
        )}
      </div>

      {(isTemplateMode || !task.isDone) && onDelete && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          className="absolute top-2 right-2 p-1.5 bg-rose-500/80 hover:bg-rose-600 text-white rounded-lg transition-all shadow-md active:scale-90"
          title="Delete Task"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default TaskCard;
