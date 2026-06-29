"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Plus, Trash2, Clock, SkipForward, AlertCircle, RefreshCw, Trophy, FlameKindling, Flag, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Database } from "@/types/database";

type Task = Database["public"]["Tables"]["daily_tasks"]["Row"];

export function ExecutionBoard({ dayNumber, currentStreak }: { dayNumber: number, currentStreak: number }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingTask, setAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskNotes, setNewTaskNotes] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"Low"|"Medium"|"High">("Medium");
  const [newTaskDuration, setNewTaskDuration] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [streakProtected, setStreakProtected] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks?day=${dayNumber}`);
      const data = await res.json();
      if (data.tasks) {
        setTasks(data.tasks);
      }
    } catch (e) {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [dayNumber]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleToggle = async (id: string, currentStatus: boolean) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !currentStatus } : t));
    
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, completed: !currentStatus })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      if (!currentStatus) {
        toast.success("Task completed!", { icon: "🔥" });
      }

      if (data.streakProtected && !streakProtected) {
        setStreakProtected(true);
        toast.success("Streak Protected!", {
          description: "You've hit 80% completion for today.",
          icon: <ShieldCheck className="h-4 w-4 text-emerald-500" />
        });
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to update task");
      // Revert optimistic update
      setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: currentStatus } : t));
    }
  };

  const handleSkip = async (id: string) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, skipped: true })
      });
      if (!res.ok) throw new Error("Failed to skip");
      toast.success("Task moved to next day");
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Task removed");
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleUpdate = async (id: string, updates: Partial<Task>) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data.task } : t));
      toast.success("Task updated");
    } catch (e: any) {
      toast.error(e.message || "Failed to update task");
      throw e;
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    setSubmitting(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          day_number: dayNumber,
          title: newTaskTitle,
          notes: newTaskNotes,
          priority: newTaskPriority,
          duration: newTaskDuration
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setTasks(prev => [...prev, data.task]);
      setAddingTask(false);
      setNewTaskTitle("");
      setNewTaskNotes("");
      toast.success("Task added to execution list");
    } catch (e: any) {
      toast.error(e.message || "Failed to add task");
    } finally {
      setSubmitting(false);
    }
  };

  const aiTasks = useMemo(() => tasks.filter(t => t.type === 'ai'), [tasks]);
  const manualTasks = useMemo(() => tasks.filter(t => t.type === 'manual'), [tasks]);
  
  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  if (loading) {
    return <div className="h-32 grid place-items-center"><RefreshCw className="h-6 w-6 animate-spin text-blood-500" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HUD - Progress Tracker */}
      <div className="card p-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blood-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h3 className="text-xl font-bold uppercase tracking-widest text-white flex items-center gap-2">
              <Flag className="h-5 w-5 text-blood-500" /> Execution HUD
            </h3>
            <p className="text-sm text-white/50 mt-1">Day {dayNumber} Progress</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/5 rounded-md px-3 py-2 border border-white/10 text-center">
              <div className="text-[10px] uppercase text-white/50 tracking-wider">Completed</div>
              <div className="text-lg font-bold text-white">{completedCount} <span className="text-white/30">/ {totalCount}</span></div>
            </div>
            <div className="bg-white/5 rounded-md px-3 py-2 border border-white/10 text-center">
              <div className="text-[10px] uppercase text-white/50 tracking-wider">Streak</div>
              <div className="text-lg font-bold text-white flex items-center gap-1">
                <FlameKindling className="h-4 w-4 text-blood-500" /> {currentStreak}
              </div>
            </div>
          </div>
        </div>

        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden relative">
          <motion.div 
            className="absolute top-0 left-0 h-full bg-blood-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
          {/* 80% Threshold Marker */}
          <div className="absolute top-0 bottom-0 w-px bg-white/30 left-[80%]" />
        </div>
        <div className="mt-2 flex justify-between items-center text-xs">
          <span className="text-white/40">0%</span>
          <span className="text-white/60 font-mono">{progressPercent}%</span>
          <span className="text-white/40 relative">
            80% 
            {progressPercent >= 80 && (
              <span className="absolute -top-6 -right-2 text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/50 uppercase tracking-wider whitespace-nowrap">
                Streak Protected
              </span>
            )}
          </span>
        </div>
      </div>

      {/* AI Missions */}
      {aiTasks.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-xs uppercase tracking-widest text-white/40 font-semibold px-1">Today's Missions</h4>
          <div className="space-y-2">
            <AnimatePresence>
              {aiTasks.map(task => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  onToggle={() => handleToggle(task.id, task.completed)}
                  onSkip={() => handleSkip(task.id)}
                  onUpdate={handleUpdate}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Manual Add-ons */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs uppercase tracking-widest text-white/40 font-semibold">Today's Add-Ons</h4>
          <button 
            onClick={() => setAddingTask(true)}
            className="text-xs text-blood-400 hover:text-blood-300 uppercase tracking-widest font-semibold flex items-center gap-1 transition-colors"
          >
            <Plus className="h-3 w-3" /> Add Task
          </button>
        </div>

        <div className="space-y-2">
          <AnimatePresence>
            {manualTasks.map(task => (
              <TaskItem 
                key={task.id} 
                task={task} 
                onToggle={() => handleToggle(task.id, task.completed)}
                onDelete={() => handleDelete(task.id)}
                onUpdate={handleUpdate}
              />
            ))}
          </AnimatePresence>

          {manualTasks.length === 0 && !addingTask && (
            <div className="card border-dashed border-white/10 bg-transparent p-6 text-center text-white/30 text-sm">
              No manual add-ons yet. Add gym, reading, or specific work tasks to track them alongside your missions.
            </div>
          )}

          {/* Add Task Form */}
          {addingTask && (
            <motion.form 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleAddTask}
              className="card p-4 space-y-4 border-blood-500/30"
            >
              <div>
                <input 
                  type="text" 
                  placeholder="Task Name (e.g., Gym, Read 20 pages)" 
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  className="w-full bg-transparent border-b border-white/10 pb-2 text-white placeholder-white/30 focus:outline-none focus:border-blood-500 text-sm"
                  autoFocus
                />
              </div>
              <div>
                <input 
                  type="text" 
                  placeholder="Optional Notes" 
                  value={newTaskNotes}
                  onChange={e => setNewTaskNotes(e.target.value)}
                  className="w-full bg-transparent border-b border-white/10 pb-2 text-white/70 placeholder-white/20 focus:outline-none focus:border-blood-500 text-xs"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-[10px] uppercase text-white/40 block mb-1">Priority</label>
                  <select 
                    value={newTaskPriority} 
                    onChange={e => setNewTaskPriority(e.target.value as any)}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-[10px] uppercase text-white/40 block mb-1">Duration (min)</label>
                  <input 
                    type="number" 
                    value={newTaskDuration}
                    onChange={e => setNewTaskDuration(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded px-2 py-1 text-xs text-white outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setAddingTask(false)}
                  className="px-3 py-1.5 text-xs text-white/50 hover:text-white uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting || !newTaskTitle.trim()}
                  className="px-4 py-1.5 bg-blood-600 hover:bg-blood-500 text-white text-xs uppercase tracking-wider rounded font-bold transition-colors disabled:opacity-50"
                >
                  {submitting ? "Adding..." : "Add Task"}
                </button>
              </div>
            </motion.form>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskItem({ task, onToggle, onSkip, onDelete, onUpdate }: { task: Task, onToggle: () => void, onSkip?: () => void, onDelete?: () => void, onUpdate: (id: string, updates: Partial<Task>) => Promise<void> }) {
  const isAI = task.type === 'ai';
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editNotes, setEditNotes] = useState(task.notes || "");
  const [editDuration, setEditDuration] = useState(task.duration || 30);
  const [editPriority, setEditPriority] = useState(task.priority || "Medium");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      if (isAI) {
        await onUpdate(task.id, { notes: editNotes, duration: editDuration });
      } else {
        await onUpdate(task.id, { title: editTitle, notes: editNotes, duration: editDuration, priority: editPriority });
      }
      setEditing(false);
    } catch {
      // Error handled by parent
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <motion.form 
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onSubmit={handleSave}
        className="card p-4 space-y-4 border-white/20 bg-white/[0.02]"
      >
        {!isAI && (
          <div>
            <input 
              type="text" 
              placeholder="Task Name" 
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="w-full bg-transparent border-b border-white/10 pb-2 text-white placeholder-white/30 focus:outline-none focus:border-blood-500 text-sm font-semibold"
              required
            />
          </div>
        )}
        {isAI && (
          <h5 className="font-semibold text-sm text-white/70">{task.title}</h5>
        )}
        
        <div>
          <input 
            type="text" 
            placeholder="Notes (Optional)" 
            value={editNotes}
            onChange={e => setEditNotes(e.target.value)}
            className="w-full bg-transparent border-b border-white/10 pb-2 text-white/70 placeholder-white/20 focus:outline-none focus:border-blood-500 text-xs"
          />
        </div>
        
        <div className="flex gap-4">
          {!isAI && (
            <div className="flex-1">
              <label className="text-[10px] uppercase text-white/40 block mb-1">Priority</label>
              <select 
                value={editPriority} 
                onChange={e => setEditPriority(e.target.value as any)}
                className="w-full bg-[#0a0a0a] border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          )}
          <div className="flex-1">
            <label className="text-[10px] uppercase text-white/40 block mb-1">Duration (min)</label>
            <input 
              type="number" 
              value={editDuration}
              onChange={e => setEditDuration(parseInt(e.target.value) || 0)}
              className="w-full bg-[#0a0a0a] border border-white/10 rounded px-2 py-1.5 text-xs text-white outline-none"
              required
              min="1"
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2 pt-2">
          <button 
            type="button" 
            onClick={() => {
              setEditing(false);
              setEditTitle(task.title);
              setEditNotes(task.notes || "");
              setEditDuration(task.duration || 30);
              setEditPriority(task.priority as any || "Medium");
            }}
            className="px-3 py-1.5 text-xs text-white/50 hover:text-white uppercase tracking-wider"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={saving || (!isAI && !editTitle.trim())}
            className="px-4 py-1.5 bg-blood-600 hover:bg-blood-500 text-white text-xs uppercase tracking-wider rounded font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <RefreshCw className="h-3 w-3 animate-spin" /> : null}
            Save
          </button>
        </div>
      </motion.form>
    );
  }
  
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`group relative card p-4 flex gap-4 items-start transition-all duration-300 ${task.completed ? 'bg-white/[0.02] border-white/5' : 'hover:border-white/15'}`}
      onDoubleClick={() => !task.completed && setEditing(true)}
    >
      <button 
        onClick={onToggle}
        className={`mt-0.5 shrink-0 h-6 w-6 rounded flex items-center justify-center border transition-colors ${
          task.completed 
            ? 'bg-blood-500 border-blood-500 text-white' 
            : 'border-white/20 bg-black/50 text-transparent hover:border-blood-500/50'
        }`}
      >
        <Check className="h-4 w-4" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-4">
          <h5 className={`font-semibold text-sm transition-all duration-300 ${task.completed ? 'text-white/40 line-through' : 'text-white'}`}>
            {task.title}
          </h5>
          <div className="flex items-center gap-2 shrink-0">
            {isAI && (
              <span className="text-[9px] uppercase tracking-widest bg-blood-500/10 text-blood-500 px-1.5 py-0.5 rounded border border-blood-500/20">
                AI Mission
              </span>
            )}
            {!task.completed && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <button onClick={() => setEditing(true)} className="text-white/30 hover:text-white text-xs font-semibold mr-1" title="Edit Task">
                  EDIT
                </button>
                {isAI && onSkip && (
                  <button onClick={onSkip} className="text-white/30 hover:text-white" title="Skip Today">
                    <SkipForward className="h-4 w-4" />
                  </button>
                )}
                {!isAI && onDelete && (
                  <button onClick={onDelete} className="text-white/30 hover:text-blood-400" title="Delete Task">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {task.notes && (
          <p className={`text-xs mt-1 transition-colors ${task.completed ? 'text-white/20' : 'text-white/50'}`}>
            {task.notes}
          </p>
        )}

        <div className={`flex items-center gap-4 mt-3 text-[10px] uppercase tracking-wider font-semibold transition-colors ${task.completed ? 'text-white/20' : 'text-white/40'}`}>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {task.duration} MIN
          </span>
          {task.priority !== 'Medium' && (
            <span className={`flex items-center gap-1 ${task.priority === 'High' && !task.completed ? 'text-amber-500/70' : ''}`}>
              <AlertCircle className="h-3 w-3" /> {task.priority}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
