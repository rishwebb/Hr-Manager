
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, ChevronLeft, Save, Bell, FolderOpen, Info, Settings, Trash2, FileText, Type, Edit2, Copy, Check, MessageCircle, ExternalLink, Clock, X, Upload } from 'lucide-react';
import { Batch, AppState, Task, Template } from './types';
import { DEFAULT_SCHEDULE, INITIAL_TEMPLATES } from './constants';
import { loadState, saveState } from './services/storage';
import BatchCard from './components/BatchCard';
import TaskCard from './components/TaskCard';
import { getCurrentDay } from './utils/time';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({ batches: [], templates: INITIAL_TEMPLATES, downloadDirectory: null });
  const [view, setView] = useState<'home' | 'schedule' | 'create' | 'templateManager' | 'templateEdit'>('home');
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [showPermissions, setShowPermissions] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [snackbar, setSnackbar] = useState<{ message: string; show: boolean }>({ message: '', show: false });

  // Refs for file upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaNameInputRef = useRef<HTMLInputElement>(null);

  // Task Modal State
  const [taskModal, setTaskModal] = useState<{
    show: boolean;
    day: number;
    editingTask?: Task;
    selectedType: 'text' | 'media';
  }>({ show: false, day: 1, selectedType: 'text' });

  // 1. Initial Load
  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setState(saved);
    } else {
      setShowPermissions(true);
    }
  }, []);

  // 2. Persistence & Auto-Scheduling Trigger
  useEffect(() => {
    saveState(state);
    if (view === 'home' || view === 'schedule') {
      scheduleAllNotifications();
    }
    checkAutoFinalize();
  }, [state, view]);

  const showToast = (message: string) => {
    setSnackbar({ message, show: true });
    setTimeout(() => setSnackbar({ message: '', show: false }), 3000);
  };

  const scheduleAllNotifications = useCallback(() => {
    console.log("SYSTEM: Auto-scheduling all future task reminders...");
    state.batches.forEach(batch => {
      const curDay = getCurrentDay(batch.startDate);
      (Object.entries(batch.schedule) as [string, Task[]][]).forEach(([day, tasks]) => {
        const dNum = parseInt(day);
        if (dNum >= curDay) {
          tasks.forEach(t => {
            if (!t.isDone) {
              // Register logic here
            }
          });
        }
      });
    });
  }, [state.batches]);

  const checkAutoFinalize = () => {
    state.batches.forEach(batch => {
      if (batch.isRecording && getCurrentDay(batch.startDate) >= 14) {
        const exists = state.templates.some(t => t.name === batch.templateName);
        if (!exists && batch.templateName) {
          finalizeRecording(batch.id);
        }
      }
    });
  };

  const handleRequestPermissions = async () => {
    if ("Notification" in window) {
      const status = await Notification.requestPermission();
      if (status === 'granted') showToast("Notifications Allowed");
    }
    setShowPermissions(false);
  };

  const handleCreateBatch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const templateId = formData.get('templateId') as string;
    const isRecording = formData.get('recordNew') === 'on';
    const templateName = formData.get('templateName') as string;

    const sourceTemplate = state.templates.find(t => t.id === templateId) || { schedule: DEFAULT_SCHEDULE };
    
    const newBatch: Batch = {
      id: editingBatch?.id || Date.now().toString(),
      name: (formData.get('name') as string) || 'Batch Alpha',
      whatsappLink: (formData.get('link') as string) || 'https://chat.whatsapp.com/demo',
      startDate: new Date(formData.get('date') as string).toISOString(),
      schedule: editingBatch?.schedule || JSON.parse(JSON.stringify(sourceTemplate.schedule)),
      isRecording,
      templateName: isRecording ? (templateName || `Batch_${Date.now()}`) : undefined
    };

    setState(prev => ({
      ...prev,
      batches: editingBatch 
        ? prev.batches.map(b => b.id === editingBatch.id ? newBatch : b)
        : [...prev.batches, newBatch]
    }));

    showToast(editingBatch ? "Batch Updated" : "Batch Launched Successfully");
    setEditingBatch(null);
    setView('home');
  };

  const handleSaveTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const message = formData.get('message') as string;
    const time = formData.get('time') as string;
    const type = formData.get('type') as 'text' | 'media';
    const mediaName = formData.get('mediaName') as string;

    const taskData: Task = {
      id: taskModal.editingTask?.id || `task-${Date.now()}`,
      message,
      time,
      type,
      mediaName: type === 'media' ? mediaName : '',
      isDone: taskModal.editingTask?.isDone || false,
    };

    setState(prev => {
      const newState = { ...prev };
      if (view === 'schedule' && activeBatchId) {
        newState.batches = prev.batches.map(b => {
          if (b.id === activeBatchId) {
            const newSched = { ...b.schedule };
            const dayTasks = [...(newSched[taskModal.day] || [])];
            if (taskModal.editingTask) {
              newSched[taskModal.day] = dayTasks.map(t => t.id === taskData.id ? taskData : t);
            } else {
              newSched[taskModal.day] = [...dayTasks, taskData];
            }
            return { ...b, schedule: newSched };
          }
          return b;
        });
      } else if (view === 'templateEdit' && activeTemplateId) {
        newState.templates = prev.templates.map(t => {
          if (t.id === activeTemplateId) {
            const newSched = { ...t.schedule };
            const dayTasks = [...(newSched[taskModal.day] || [])];
            if (taskModal.editingTask) {
              newSched[taskModal.day] = dayTasks.map(tk => tk.id === taskData.id ? taskData : tk);
            } else {
              newSched[taskModal.day] = [...dayTasks, taskData];
            }
            return { ...t, schedule: newSched };
          }
          return t;
        });
      }
      return newState;
    });

    setTaskModal({ show: false, day: 1, selectedType: 'text' });
    showToast(taskModal.editingTask ? "Task Updated" : "Task Added");
  };

  const markTaskDone = (taskId: string) => {
    if (!activeBatchId) return;
    setState(prev => ({
      ...prev,
      batches: prev.batches.map(batch => {
        if (batch.id !== activeBatchId) return batch;
        const newSchedule = { ...batch.schedule };
        newSchedule[selectedDay] = (newSchedule[selectedDay] || []).map(task => 
          task.id === taskId ? { ...task, isDone: true } : task
        );
        return { ...batch, schedule: newSchedule };
      })
    }));
    showToast("Marked as Sent. Action Locked.");
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Message Copied to Clipboard");
  };

  const handleDownloadMedia = (fileName: string) => {
    if (!state.downloadDirectory) {
      const dir = prompt("First Media Action: Select permanent download directory path (Simulation):", "/Internal/InternTrack/Media");
      if (dir) setState(prev => ({ ...prev, downloadDirectory: dir }));
    }
    showToast(`Downloading ${fileName} to gallery...`);
    setTimeout(() => showToast("Saved to Photo Library"), 1200);
  };

  const deleteTask = (day: number, taskId: string) => {
    if (!confirm("Remove this task from schedule?")) return;
    setState(prev => {
      const newState = { ...prev };
      if (view === 'schedule' && activeBatchId) {
        newState.batches = prev.batches.map(b => {
          if (b.id === activeBatchId) {
            const newSched = { ...b.schedule };
            newSched[day] = (newSched[day] || []).filter(t => t.id !== taskId);
            return { ...b, schedule: newSched };
          }
          return b;
        });
      } else if (view === 'templateEdit' && activeTemplateId) {
        newState.templates = prev.templates.map(t => {
          if (t.id === activeTemplateId) {
            const newSched = { ...t.schedule };
            newSched[day] = (newSched[day] || []).filter(tk => tk.id !== taskId);
            return { ...t, schedule: newSched };
          }
          return t;
        });
      }
      return newState;
    });
    showToast("Task Deleted");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && mediaNameInputRef.current) {
      mediaNameInputRef.current.value = file.name;
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleCreateBlankTemplate = () => {
    const name = prompt("Template Name:");
    if (!name) return;
    const blankSchedule: Record<number, Task[]> = {};
    for (let i = 1; i <= 14; i++) blankSchedule[i] = [];
    const nt: Template = { id: `tmpl-${Date.now()}`, name, schedule: blankSchedule };
    setState(p => ({ ...p, templates: [...p.templates, nt] }));
    showToast(`Template "${name}" Created`);
  };

  const finalizeRecording = (batchId: string) => {
    const batch = state.batches.find(b => b.id === batchId);
    if (!batch || !batch.templateName) return;
    const newTemplate: Template = {
      id: `tmpl-${Date.now()}`,
      name: batch.templateName,
      schedule: JSON.parse(JSON.stringify(batch.schedule))
    };
    setState(prev => ({
      ...prev,
      templates: [...prev.templates, newTemplate],
      batches: prev.batches.map(b => b.id === batchId ? { ...b, isRecording: false } : b)
    }));
    showToast(`Auto-Recording Saved: ${batch.templateName}`);
  };

  const activeBatch = state.batches.find(b => b.id === activeBatchId);
  const activeTemplate = state.templates.find(t => t.id === activeTemplateId);
  const currentDay = activeBatch ? getCurrentDay(activeBatch.startDate) : 1;

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col relative bg-slate-100 shadow-2xl font-sans select-none overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-indigo-700 text-white p-6 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3 overflow-hidden flex-1 mr-2">
          {view !== 'home' && (
            <button onClick={() => setView(view === 'templateEdit' ? 'templateManager' : 'home')} className="p-2 hover:bg-white/10 rounded-xl transition-all">
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <h1 className="text-xl font-black tracking-tighter uppercase truncate">
            {view === 'home' ? 'InternTrack' : view === 'templateManager' ? 'Templates' : view === 'templateEdit' ? activeTemplate?.name : (activeBatch?.name || 'Batch')}
          </h1>
        </div>
        <div className="flex gap-2 items-center flex-shrink-0">
          {view === 'schedule' && activeBatch && (
            <a 
              href={activeBatch.whatsappLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center border border-emerald-400"
              title="Open WhatsApp Group"
            >
              <MessageCircle className="w-6 h-6 text-white" />
            </a>
          )}
          {view === 'home' && (
             <button onClick={() => setView('templateManager')} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                <Settings className="w-6 h-6" />
             </button>
          )}
          {view === 'schedule' && activeBatch?.isRecording && (
            <button 
              onClick={() => finalizeRecording(activeBatch.id)}
              className="text-[10px] bg-emerald-600 px-3 py-2 rounded-xl font-black flex items-center gap-1 shadow-lg animate-pulse"
            >
              <Save className="w-4 h-4" /> FINALIZE
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 p-6 overflow-y-auto pb-32">
        {view === 'home' && (
          <div className="space-y-6">
            {state.batches.length === 0 ? (
              <div className="pt-24 text-center text-slate-400">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-sm font-bold uppercase tracking-widest">No Active Batches</p>
              </div>
            ) : (
              state.batches.map(batch => (
                <BatchCard 
                  key={batch.id} 
                  batch={batch} 
                  onView={(id) => { setActiveBatchId(id); setView('schedule'); setSelectedDay(getCurrentDay(batch.startDate)); }}
                  onEdit={(b) => { setEditingBatch(b); setView('create'); }}
                  onDelete={(id) => {
                    if(confirm("Delete this batch and all its progress?")) {
                      setState(p => ({ ...p, batches: p.batches.filter(b => b.id !== id) }));
                    }
                  }}
                  onReset={(id) => setState(p => ({ ...p, batches: p.batches.map(b => b.id === id ? { ...b, startDate: new Date().toISOString() } : b) }))}
                  onManageTemplates={() => setView('templateManager')}
                />
              ))
            )}
          </div>
        )}

        {view === 'templateManager' && (
          <div className="space-y-4">
            <button onClick={handleCreateBlankTemplate} className="w-full flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 py-4 rounded-2xl border-2 border-dashed border-indigo-200 font-black mb-6 hover:bg-indigo-100">
              <Plus className="w-5 h-5" /> CREATE BLANK TEMPLATE
            </button>
            {state.templates.map(tmpl => (
              <div key={tmpl.id} className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between shadow-sm">
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 text-lg">{tmpl.name}</h3>
                  <span className="text-[10px] bg-indigo-50 text-indigo-500 font-black px-2 py-0.5 rounded-full uppercase">14-Day Cycle</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setActiveTemplateId(tmpl.id); setView('templateEdit'); setSelectedDay(1); }} className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Edit2 className="w-5 h-5" /></button>
                  <button onClick={() => {
                    if(confirm("Delete this master template?")) {
                      setState(p => ({ ...p, templates: p.templates.filter(t => t.id !== tmpl.id) }));
                    }
                  }} className="p-3 bg-rose-50 text-rose-600 rounded-xl"><Trash2 className="w-5 h-5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {view === 'create' && (
          <form onSubmit={handleCreateBatch} className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-5 shadow-sm">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Batch Identity</h2>
              <input name="name" required placeholder="Batch Name" defaultValue={editingBatch?.name} className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 text-sm font-bold" />
              <input name="link" type="url" required placeholder="WhatsApp Group URL" defaultValue={editingBatch?.whatsappLink} className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200 text-sm font-bold" />
              <input name="date" type="date" required defaultValue={editingBatch ? new Date(editingBatch.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200 text-sm font-bold" />
            </div>

            <div className="bg-indigo-600 p-6 rounded-3xl text-white space-y-5 shadow-xl">
              <h2 className="text-[10px] font-black text-white/50 uppercase tracking-widest">Schedule Setup</h2>
              <select name="templateId" className="w-full p-4 bg-white/10 rounded-2xl border-none ring-1 ring-white/20 text-sm font-bold text-white focus:bg-indigo-700">
                {state.templates.map(t => <option key={t.id} value={t.id} className="text-slate-800">{t.name}</option>)}
              </select>
              <div className="flex items-center gap-3 bg-white/10 p-4 rounded-2xl border border-white/10">
                <input type="checkbox" name="recordNew" id="rec" className="w-5 h-5 accent-emerald-400" />
                <label htmlFor="rec" className="text-sm font-black cursor-pointer">RECORD AS NEW MASTER TEMPLATE</label>
              </div>
              <input name="templateName" placeholder="Template Name for Save" className="w-full p-4 bg-white/10 rounded-2xl border-none ring-1 ring-white/20 text-sm font-bold text-white placeholder-white/30" />
            </div>

            <button type="submit" className="w-full bg-indigo-700 text-white font-black py-5 rounded-3xl shadow-2xl hover:bg-indigo-800 transition-all active:scale-95 uppercase tracking-widest text-sm">
              {editingBatch ? 'Update Cycle' : 'Initialize Batch Cycle'}
            </button>
          </form>
        )}

        {(view === 'schedule' || view === 'templateEdit') && (
          <div className="space-y-6">
             <div className="flex items-center gap-3 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2">
              {Array.from({ length: 14 }, (_, i) => i + 1).map(day => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`flex-shrink-0 w-16 h-16 rounded-2xl text-xs font-black flex flex-col items-center justify-center transition-all border-2 ${
                    selectedDay === day 
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-xl scale-110' 
                    : (view === 'schedule' && day === currentDay) 
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                      : 'bg-white text-slate-400 border-slate-200'
                  }`}
                >
                  <span className="opacity-40 text-[7px] uppercase">Day</span>
                  <span className="text-lg leading-none">{day}</span>
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <h2 className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                  {view === 'schedule' ? `Status: Day ${currentDay} View` : 'Master Schedule Edit'}
                </h2>
                <button 
                  onClick={() => setTaskModal({ show: true, day: selectedDay, selectedType: 'text' })} 
                  className="flex items-center gap-1.5 bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full text-[10px] font-black hover:bg-indigo-200"
                >
                  <Plus className="w-3.5 h-3.5" /> ADD TASK
                </button>
              </div>

              <div className="animate-in fade-in duration-500">
                {((view === 'schedule' ? activeBatch?.schedule : activeTemplate?.schedule)?.[selectedDay] || []).length === 0 ? (
                  <div className="py-20 text-center opacity-20">
                    <Clock className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-xs font-bold">EMPTY SCHEDULE</p>
                  </div>
                ) : (
                  ((view === 'schedule' ? activeBatch?.schedule : activeTemplate?.schedule)?.[selectedDay] || []).map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      viewingDay={selectedDay}
                      currentDay={currentDay}
                      onMarkSent={markTaskDone} 
                      onCopy={handleCopyText}
                      onDownload={handleDownloadMedia}
                      onEdit={(t) => setTaskModal({ show: true, day: selectedDay, editingTask: t, selectedType: t.type })}
                      onDelete={(tid) => deleteTask(selectedDay, tid)}
                      isTemplateMode={view === 'templateEdit'}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Task Modal Overlay */}
      {taskModal.show && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <form 
            onSubmit={handleSaveTask}
            className="bg-white w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-8 shadow-2xl animate-in slide-in-from-bottom-10 duration-300"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-800">
                {taskModal.editingTask ? 'Edit Task' : 'New Task'} (Day {taskModal.day})
              </h2>
              <button 
                type="button" 
                onClick={() => setTaskModal({ show: false, day: 1, selectedType: 'text' })}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Task Name / Message</label>
                <textarea 
                  name="message" 
                  required 
                  defaultValue={taskModal.editingTask?.message}
                  placeholder="Enter message for interns..." 
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 text-sm font-bold h-24 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Scheduled Time</label>
                  <input 
                    name="time" 
                    type="text" 
                    required 
                    defaultValue={taskModal.editingTask?.time || "09:00 AM"}
                    placeholder="09:00 AM" 
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Task Type</label>
                  <select 
                    name="type" 
                    value={taskModal.selectedType}
                    onChange={(e) => setTaskModal({ ...taskModal, selectedType: e.target.value as 'text' | 'media' })}
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 text-sm font-bold appearance-none"
                  >
                    <option value="text">TEXT ONLY</option>
                    <option value="media">MEDIA FILE</option>
                  </select>
                </div>
              </div>

              {taskModal.selectedType === 'media' && (
                <div className="animate-in fade-in duration-300">
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Media Content (PDF/IMG/VID)</label>
                  <div className="flex gap-2">
                    <input 
                      ref={mediaNameInputRef}
                      name="mediaName" 
                      defaultValue={taskModal.editingTask?.mediaName}
                      placeholder="e.g. guide.pdf, intro.mp4" 
                      className="flex-1 p-4 bg-slate-50 rounded-2xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-500 text-sm font-bold"
                    />
                    <button 
                      type="button" 
                      onClick={triggerFileUpload}
                      className="bg-indigo-50 text-indigo-700 p-4 rounded-2xl hover:bg-indigo-100 transition-colors flex items-center justify-center shadow-sm"
                      title="Upload from Device"
                    >
                      <Upload className="w-5 h-5" />
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      className="hidden" 
                      accept="image/*,video/*,application/pdf"
                    />
                  </div>
                </div>
              )}
            </div>

            <button 
              type="submit"
              className="w-full bg-indigo-700 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-indigo-800 transition-all active:scale-95 uppercase tracking-widest text-sm mt-8"
            >
              Save Task
            </button>
          </form>
        </div>
      )}

      {view === 'home' && (
        <button onClick={() => { setEditingBatch(null); setView('create'); }} className="fixed bottom-10 right-8 w-20 h-20 bg-indigo-600 text-white rounded-3xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-40 group">
          <Plus className="w-10 h-10 group-hover:rotate-90 transition-transform duration-300" />
        </button>
      )}

      {snackbar.show && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-[110] animate-in slide-in-from-bottom-10">
          <Check className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-black uppercase tracking-tight">{snackbar.message}</span>
        </div>
      )}

      {showPermissions && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-8 bg-slate-900/90 backdrop-blur-md">
          <div className="bg-white rounded-[40px] p-10 max-w-sm w-full shadow-2xl text-center">
            <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-8">
               <Bell className="w-12 h-12 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-black mb-4 tracking-tighter uppercase">Initialize Automation</h2>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed font-medium">Allow InternTrack to manage <b>Notifications</b> and <b>Storage</b> for automated task scheduling.</p>
            <button onClick={handleRequestPermissions} className="w-full bg-indigo-600 text-white font-black py-5 rounded-[24px] shadow-2xl shadow-indigo-100 uppercase tracking-widest text-xs">Authorize Access</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
