
import React, { useEffect, useState } from 'react';
import { Calendar, CheckSquare, Loader2, Save, WifiOff, Users, FileText, ChevronDown, ChevronUp, Edit3, Settings, Clock, AlertTriangle, Zap, RefreshCw, Type, Trash2, Plus, ArrowRightLeft, Sparkles, CheckCircle, Layers, Link as LinkIcon, Split, BrainCircuit, GripVertical } from 'lucide-react';
import { INITIAL_PLAN } from '../constants';
import { DayPlan, Task, TeamMember, UserStory } from '../types';
import { db, TASKS_COLLECTION, USER_STORIES_COLLECTION, seedInitialData, ensureAuth, getProjectSettings, updateLastSaved, formatDateTime } from '../services/firebase';
import { collection, getDocs, doc, updateDoc, query, where, writeBatch, addDoc, deleteDoc } from 'firebase/firestore';

export const ExecutionPlan: React.FC = () => {
  const [days, setDays] = useState<DayPlan[]>([]);
  const [stories, setStories] = useState<UserStory[]>([]); // Confirmed Stories
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [savingDetails, setSavingDetails] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | undefined>();
  const [savingGlobal, setSavingGlobal] = useState(false);
  
  // Drag & Drop State
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  
  // AI Generation State
  const [generatingForStoryId, setGeneratingForStoryId] = useState<string | null>(null);

  // State to track which task is expanded for editing details
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);

  // Local state for form inputs
  const [editForm, setEditForm] = useState<{
    description: string;
    completedAt: string;
    attendees: string;
    notes: string;
    duration: number;
    definitionOfDone: string;
    dayId: number;
  }>({ description: '', completedAt: '', attendees: '', notes: '', duration: 1, definitionOfDone: '', dayId: 1 });

  // Load Data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        await ensureAuth();

        const settings = await getProjectSettings();
        if (settings) {
            if (settings.team) setTeamMembers(settings.team);
            if (settings.lastUpdated) setLastUpdated(settings.lastUpdated);
        }

        // Fetch Tasks
        const taskSnap = await getDocs(collection(db, TASKS_COLLECTION));
        
        // Fetch User Stories (for the backlog panel)
        const storySnap = await getDocs(query(collection(db, USER_STORIES_COLLECTION), where('status', 'in', ['CONFIRMED', 'INTEGRATED'])));
        const loadedStories = storySnap.docs.map(d => ({id: d.id, ...d.data()} as UserStory));
        setStories(loadedStories);

        if (taskSnap.empty) {
            // Initial Seed fallback only if DB is truly empty
             try {
                await seedInitialData(INITIAL_PLAN);
                setDays(INITIAL_PLAN);
              } catch (seedErr) {
                setDays(INITIAL_PLAN);
                setIsOffline(true);
              }
        } else {
            // DATABASE IS SOURCE OF TRUTH
            const dbTasks = taskSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task & { dayId: number }));
            
            // We only use INITIAL_PLAN to get Day Titles and Focus areas
            const builtDays = INITIAL_PLAN.map(planDay => ({
                ...planDay,
                tasks: dbTasks.filter(t => t.dayId === planDay.day).map(t => ({
                     ...t,
                     // Ensure fields exist
                     definitionOfDone: t.definitionOfDone || '',
                     duration: t.duration || 1,
                     notes: t.notes || '',
                     attendees: t.attendees || '',
                     completedAt: t.completedAt || ''
                }))
            }));
            setDays(builtDays);
        }

      } catch (err: any) {
        console.error("Firebase error", err);
        setIsOffline(true);
        setError("Modalità Offline (Lettura).");
      } finally {
        setLoading(false);
      }
    };

  const handleGlobalSave = async () => {
    setSavingGlobal(true);
    try {
        const savedTime = await updateLastSaved();
        setLastUpdated(savedTime);
    } catch(e) {
        console.error("Failed to save global", e);
    } finally {
        setSavingGlobal(false);
    }
  };

  // --- DRAG AND DROP HANDLERS ---
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
      e.dataTransfer.setData("text/plain", taskId);
      e.dataTransfer.effectAllowed = "move";
      setDraggedTaskId(taskId);
      e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnd = (e: React.DragEvent) => {
      e.currentTarget.classList.remove('opacity-50');
      setDraggedTaskId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault(); 
      e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetDayId: number) => {
      e.preventDefault();
      const taskId = e.dataTransfer.getData("text/plain");
      if(!taskId) return;

      // Find the task and its source to validate move
      let movedTask: Task | null = null;
      let sourceDayId = -1;
      
      for (const day of days) {
          const t = day.tasks.find(x => x.id === taskId);
          if (t) {
              movedTask = { ...t, dayId: targetDayId };
              sourceDayId = day.day;
              break;
          }
      }

      if (!movedTask || sourceDayId === -1 || sourceDayId === targetDayId) return;

      // Immutable Update
      const nextDays = days.map(day => {
          if (day.day === sourceDayId) {
              return { ...day, tasks: day.tasks.filter(t => t.id !== taskId) };
          }
          if (day.day === targetDayId) {
              return { ...day, tasks: [...day.tasks, movedTask!] };
          }
          return day;
      });

      setDays(nextDays);

      // DB Update
      if (!isOffline) {
          try {
              await updateDoc(doc(db, TASKS_COLLECTION, taskId), { dayId: targetDayId });
              await updateLastSaved();
          } catch (err) {
              console.error("DnD Save failed", err);
              // Revert/Reload on error only
              fetchData();
          }
      }
      setDraggedTaskId(null);
  };

  // --- TASK DELETION LOGIC (FIXED) ---
  const handleDeleteTask = async (taskId: string, dayIndex: number) => {
      if(!window.confirm("Eliminare definitivamente questa attività?")) return;
      
      // 1. OPTIMISTIC UI UPDATE
      // Remove the task immediately from local state
      setDays(prevDays => prevDays.map((day, idx) => {
          if (idx === dayIndex) {
              return { ...day, tasks: day.tasks.filter(t => t.id !== taskId) };
          }
          return day;
      }));
      
      // Close details if open
      if (expandedTask === taskId) setExpandedTask(null);

      if (isOffline) return;

      // 2. FIREBASE UPDATE
      // We do NOT call fetchData() here to avoid race conditions causing the task to reappear
      try {
          await deleteDoc(doc(db, TASKS_COLLECTION, taskId));
          await updateLastSaved();
      } catch (e) {
          console.error("Error deleting task", e);
          alert("Errore durante l'eliminazione dal database. Ricarica la pagina.");
      }
  };

  // --- CRUD OPERATIONS ---
  const handleAddTask = async (dayId: number) => {
      const newTask = {
          description: "Nuova Attività Manuale",
          completed: false,
          dayId: dayId,
          duration: 1,
          notes: "",
          definitionOfDone: ""
      };

      try {
          const docRef = await addDoc(collection(db, TASKS_COLLECTION), newTask);
          
          setDays(prevDays => prevDays.map(day => {
              if (day.day === dayId) {
                  return { ...day, tasks: [...day.tasks, { ...newTask, id: docRef.id }] };
              }
              return day;
          }));

          setExpandedTask(docRef.id); 
          setEditForm({
              description: newTask.description,
              completedAt: '',
              attendees: '',
              notes: '',
              duration: 1,
              definitionOfDone: '',
              dayId: dayId
          });
          
          await updateLastSaved();
      } catch (e) {
          console.error("Error adding task", e);
      }
  };

  const toggleTask = async (dayIndex: number, taskIndex: number, taskId: string, currentStatus: boolean) => {
    const newDays = [...days];
    const task = newDays[dayIndex].tasks[taskIndex];
    task.completed = !currentStatus;
    if (task.completed && !task.completedAt) task.completedAt = new Date().toISOString().split('T')[0];

    setDays(newDays);
    setUpdating(taskId);

    if (!isOffline) {
        try {
           await updateDoc(doc(db, TASKS_COLLECTION, taskId), {
             completed: !currentStatus,
             completedAt: task.completedAt
           });
        } catch (err) { console.error(err); } 
        finally { setUpdating(null); }
    } else {
        setUpdating(null);
    }
  };

  // --- AI GENERATION ---
  const generateTasksFromStory = async (story: UserStory) => {
      setGeneratingForStoryId(story.id);

      const dayLoads: Record<number, number> = {};
      for(let i=1; i<=10; i++) dayLoads[i] = 0;
      days.forEach(d => {
          d.tasks.forEach(t => dayLoads[d.day] += (t.duration || 0));
      });

      const findBestDay = (duration: number): number => {
          for(let d=1; d<=10; d++) {
              if (dayLoads[d] + duration <= 6) {
                  dayLoads[d] += duration; 
                  return d;
              }
          }
          return 10;
      };

      setTimeout(async () => {
          try {
            const newTasksPayload: any[] = [];
            const storyDescLower = story.action.toLowerCase();
            
            if (storyDescLower.includes('feedback') || storyDescLower.includes('segnalare')) {
                newTasksPayload.push(
                    { desc: `[US] Configurazione Modulo Feedback (${story.role})`, dur: 1.5, role: "IT/Process" },
                    { desc: `[US] Formazione Operativa su Feedback`, dur: 1, role: "Responsabile" },
                    { desc: `[US] Test flusso e verifica log`, dur: 1, role: "Qualità" }
                );
            } else if (storyDescLower.includes('nadcap') || storyDescLower.includes('checklist')) {
                 newTasksPayload.push(
                    { desc: `[US] Revisione Bozza Checklist NADCAP`, dur: 2, role: "Qualità" },
                    { desc: `[US] Validazione Checklist in linea`, dur: 2, role: "Produzione" },
                    { desc: `[US] Rilascio documento ufficiale`, dur: 1, role: "Ufficio Tecnico" }
                );
            } else if (storyDescLower.includes('board') || storyDescLower.includes('visual')) {
                 newTasksPayload.push(
                    { desc: `[US] Installazione Board Fisica`, dur: 1, role: "Team" },
                    { desc: `[US] Definizione card e colonne`, dur: 1, role: "Scrum Master" },
                    { desc: `[US] Prima sessione Stand-up`, dur: 0.5, role: "Tutti" }
                );
            } else {
                 newTasksPayload.push(
                    { desc: `[US] Analisi e Design: ${story.action}`, dur: 2, role: "Tecnico" },
                    { desc: `[US] Implementazione: ${story.action}`, dur: 2, role: "Operativo" },
                    { desc: `[US] Verifica (DoD): ${story.benefit}`, dur: 1, role: "Qualità" }
                );
            }

            const batch = writeBatch(db);
            const createdTasks: Task[] = [];

            newTasksPayload.forEach(template => {
                const dayId = findBestDay(template.dur);
                const taskRef = doc(collection(db, TASKS_COLLECTION));
                const newTaskData = {
                    description: template.desc,
                    completed: false,
                    dayId: dayId,
                    duration: template.dur,
                    generatedFromStoryId: story.id, 
                    generatedFromNeedId: story.needId, 
                    assignedTo: template.role,
                    notes: `Generato da User Story: ${story.action}.\nBeneficio atteso: ${story.benefit}`,
                    definitionOfDone: story.definitionOfDone,
                    attendees: story.assignedTo.join(', ')
                };
                
                batch.set(taskRef, newTaskData);
                createdTasks.push({ id: taskRef.id, ...newTaskData });
            });

            const storyRef = doc(db, USER_STORIES_COLLECTION, story.id);
            batch.update(storyRef, { status: 'INTEGRATED' });

            await batch.commit();

            setDays(prevDays => prevDays.map(d => {
                 const tasksForThisDay = createdTasks.filter(ct => (ct as any).dayId === d.day);
                 if (tasksForThisDay.length > 0) {
                     return { ...d, tasks: [...d.tasks, ...tasksForThisDay] };
                 }
                 return d;
            }));
            
            setStories(prev => prev.map(s => s.id === story.id ? { ...s, status: 'INTEGRATED' } : s));
            await updateLastSaved();

          } catch (e) {
              console.error("AI Generation failed", e);
              alert("Errore generazione task.");
          } finally {
              setGeneratingForStoryId(null);
          }
      }, 1500); 
  };

  const handleExpand = (task: Task, dayId: number) => {
    if (expandedTask === task.id) {
      setExpandedTask(null);
    } else {
      setExpandedTask(task.id);
      setEditForm({
        description: task.description,
        completedAt: task.completedAt || '',
        attendees: task.attendees || '',
        notes: task.notes || '',
        duration: task.duration || 1,
        definitionOfDone: task.definitionOfDone || '',
        dayId: dayId
      });
    }
  };

  const saveDetails = async (dayIndex: number, taskIndex: number, taskId: string) => {
    setSavingDetails(taskId);
    const originalDayId = days[dayIndex].day;
    const newDayId = Number(editForm.dayId);
    const dayChanged = originalDayId !== newDayId;

    if (!isOffline) {
      try {
        await updateDoc(doc(db, TASKS_COLLECTION, taskId), {
          description: editForm.description,
          completedAt: editForm.completedAt,
          attendees: editForm.attendees,
          notes: editForm.notes,
          duration: Number(editForm.duration),
          definitionOfDone: editForm.definitionOfDone,
          dayId: newDayId
        });
        await updateLastSaved();
      } catch (err) { console.error(err); }
    }
    
    if (dayChanged) {
        await fetchData(); 
    } else {
        const newDays = [...days];
        newDays[dayIndex].tasks[taskIndex] = { ...newDays[dayIndex].tasks[taskIndex], ...editForm, dayId: newDayId };
        setDays(newDays);
    }
    setSavingDetails(null);
    setExpandedTask(null);
  };

  const generateAiContent = () => {
      if(!editForm.description) return;
      setIsAiSuggesting(true);
      setTimeout(() => {
          setEditForm(prev => ({
              ...prev,
              description: `${prev.description} (Ottimizzato)`,
              definitionOfDone: "- Output validato\n- Documentazione caricata"
          }));
          setIsAiSuggesting(false);
      }, 1000);
  };

  const toggleAttendee = (name: string) => {
    const currentList = editForm.attendees ? editForm.attendees.split(',').map(s => s.trim()).filter(s => s) : [];
    if (currentList.includes(name)) {
        const newList = currentList.filter(s => s !== name);
        setEditForm({...editForm, attendees: newList.join(', ')});
    } else {
        const newList = [...currentList, name];
        setEditForm({...editForm, attendees: newList.join(', ')});
    }
  };

  const calculateProgress = () => {
    if (!days.length) return 0;
    const totalTasks = days.reduce((acc, day) => acc + day.tasks.length, 0);
    const completedTasks = days.reduce((acc, day) => acc + day.tasks.filter(t => t.completed).length, 0);
    return totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Piano Esecutivo (10 Giornate)</h2>
          <p className="text-slate-500 mt-1">Scomposizione e pianificazione temporale dei task operativi.</p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <Clock size={12} /> Ultimo agg: {formatDateTime(lastUpdated)}
            </span>
            <button 
                onClick={handleGlobalSave}
                disabled={savingGlobal}
                className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg font-bold shadow-sm flex items-center gap-2 text-xs transition-all disabled:opacity-50"
            >
                {savingGlobal ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                Salva & Aggiorna
            </button>
        </div>
      </div>

      {error && (
        <div className="bg-orange-50 text-orange-800 p-4 rounded-lg border border-orange-200 text-sm flex items-center gap-3">
          <WifiOff size={18} /> {error}
        </div>
      )}

      {/* SPRINT BACKLOG & WORKBENCH */}
      <div className="bg-slate-900 rounded-xl p-6 shadow-xl border border-slate-700 overflow-hidden relative">
          <div className="flex items-center gap-3 text-white mb-4">
              <BrainCircuit className="text-purple-400" />
              <h3 className="text-lg font-bold">Sprint Backlog & AI Workbench</h3>
              <span className="bg-slate-700 text-xs px-2 py-0.5 rounded-full text-slate-300">
                  {stories.filter(s => s.status === 'CONFIRMED').length} Storie da pianificare
              </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-[300px] pr-2 scrollbar-thin scrollbar-thumb-slate-600">
              {stories.filter(s => s.status === 'CONFIRMED' || s.status === 'INTEGRATED').map(story => {
                  const isIntegrated = story.status === 'INTEGRATED';
                  return (
                      <div key={story.id} className={`p-4 rounded-lg border flex flex-col justify-between gap-3 transition-all ${isIntegrated ? 'bg-slate-800/50 border-emerald-900/50 opacity-60' : 'bg-slate-800 border-slate-600 hover:border-purple-500'}`}>
                          <div>
                              <div className="flex justify-between items-start mb-2">
                                  <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded border border-slate-600 font-mono">
                                      {story.complexity} • {story.duration}h
                                  </span>
                                  {isIntegrated && <CheckCircle size={14} className="text-emerald-500"/>}
                              </div>
                              <p className="text-white font-bold text-sm leading-snug mb-1">{story.action}</p>
                              <p className="text-xs text-slate-400 italic">"{story.benefit}"</p>
                          </div>
                          
                          <button 
                             onClick={() => generateTasksFromStory(story)}
                             disabled={!!generatingForStoryId || isIntegrated}
                             className={`w-full py-2 rounded text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                                 isIntegrated 
                                 ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                                 : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg hover:shadow-purple-500/20'
                             }`}
                          >
                             {generatingForStoryId === story.id ? <Loader2 size={14} className="animate-spin"/> : <Split size={14} className="rotate-90"/>}
                             {isIntegrated ? "Già Pianificata" : "Scomponi & Pianifica"}
                          </button>
                      </div>
                  );
              })}
              {stories.length === 0 && (
                  <div className="col-span-3 text-center py-8 text-slate-500 border border-dashed border-slate-700 rounded-lg">
                      Nessuna User Story confermata. Vai alla sezione "User Stories" per definire il backlog.
                  </div>
              )}
          </div>
      </div>

      {/* PROGRESS BAR */}
      <div className="flex justify-end">
        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
            <span className="text-sm font-medium text-slate-600">Avanzamento Sprint</span>
            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${calculateProgress()}%` }}></div>
            </div>
            <span className="font-bold text-blue-600">{calculateProgress()}%</span>
        </div>
      </div>

      {/* DAYS GRID (DROP TARGETS) */}
      <div className="grid grid-cols-1 gap-6">
        {days.map((day, dIdx) => {
          const totalHours = day.tasks.reduce((acc, t) => acc + (t.duration || 0), 0);
          const isOverloaded = totalHours > 6;
          const loadPercentage = Math.min((totalHours / 6) * 100, 100);

          return (
            <div 
                key={day.day} 
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, day.day)}
                className={`rounded-xl shadow-sm border overflow-hidden transition-all ${isOverloaded ? 'border-amber-300 ring-1 ring-amber-300' : 'border-slate-200 bg-white hover:border-blue-400'}`}
            >
                {/* Day Header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className={`text-white font-bold rounded-lg w-10 h-10 flex items-center justify-center text-lg shadow-sm ${isOverloaded ? 'bg-amber-500' : 'bg-blue-600'}`}>
                        {day.day}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                {day.title}
                                {isOverloaded && <AlertTriangle size={16} className="text-amber-500" />}
                            </h3>
                            <span className="text-xs font-semibold uppercase text-blue-500 tracking-wider">
                                Focus: {day.focus}
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                            <Clock size={16} className={isOverloaded ? "text-amber-500" : "text-slate-400"} />
                            <div className="flex flex-col items-end w-24">
                                <span className={`text-xs font-bold ${isOverloaded ? 'text-amber-600' : 'text-slate-700'}`}>
                                    {totalHours}h / 6h
                                </span>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                                    <div className={`h-full ${isOverloaded ? 'bg-amber-500' : totalHours >= 6 ? 'bg-emerald-500' : 'bg-blue-400'}`} style={{ width: `${loadPercentage}%` }}></div>
                                </div>
                            </div>
                        </div>
                         <button onClick={() => handleAddTask(day.day)} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 p-2 rounded-lg transition-colors border border-indigo-200" title="Aggiungi Attività Manuale"><Plus size={20} /></button>
                    </div>
                </div>
                
                <div className="p-4 sm:p-6 bg-slate-50/30 min-h-[100px]">
                <div className="space-y-3">
                    {day.tasks.map((task, tIdx) => {
                    const isExpanded = expandedTask === task.id;
                    const linkedStory = stories.find(s => s.id === task.generatedFromStoryId);
                    
                    return (
                        <div 
                            key={task.id} 
                            draggable={!isExpanded} // Disable drag if editing
                            onDragStart={(e) => handleDragStart(e, task.id)}
                            onDragEnd={handleDragEnd}
                            className={`rounded-lg border transition-all duration-200 overflow-hidden cursor-move hover:shadow-md ${
                            task.completed 
                                ? 'bg-emerald-50/50 border-emerald-100' 
                                : 'bg-white border-slate-200 shadow-sm'
                            }`}
                        >
                        <div className="p-3 sm:p-4 flex items-start gap-4">
                            <div className="pt-0.5 cursor-auto" onMouseDown={e => e.stopPropagation()}>
                                <input 
                                    type="checkbox" 
                                    checked={task.completed}
                                    onChange={() => toggleTask(dIdx, tIdx, task.id, task.completed)}
                                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    disabled={!!updating || isOffline}
                                />
                            </div>
                            
                            <div className="flex-1">
                                {/* Traceability Badge */}
                                {linkedStory && (
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <span className="text-[9px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 px-1.5 py-0.5 rounded flex items-center gap-1" title={linkedStory.needDescription}>
                                            <Layers size={8} /> US: {linkedStory.action.substring(0, 40)}...
                                        </span>
                                    </div>
                                )}
                                
                                <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-2">
                                         <GripVertical size={16} className="text-slate-300 mt-0.5" />
                                         <div>
                                            <p className={`text-sm font-medium transition-colors ${
                                            task.completed ? 'text-emerald-900 line-through decoration-emerald-300' : 'text-slate-800'
                                            }`}>
                                            {task.description}
                                            </p>
                                            
                                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200 flex items-center gap-1 font-semibold">
                                                    <Clock size={10} /> {task.duration}h
                                                </span>
                                                {task.assignedTo && (
                                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200 uppercase tracking-wide font-semibold">
                                                    {task.assignedTo}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 cursor-auto" onMouseDown={e => e.stopPropagation()}>
                                        <button onClick={() => handleExpand(task, day.day)} className={`ml-2 p-1.5 rounded-md transition-colors ${isExpanded ? 'bg-blue-100 text-blue-700' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}>
                                            {isExpanded ? <ChevronUp size={18} /> : <Edit3 size={18} />}
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id, dIdx); }} className="ml-1 p-1.5 rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            {updating === task.id && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                        </div>

                        {/* Expandable Details Form */}
                        {isExpanded && (
                            <div className="px-4 pb-4 pt-0 sm:px-12 cursor-auto" onMouseDown={e => e.stopPropagation()}>
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                <div className="col-span-1 md:col-span-2">
                                     <div className="flex justify-between items-center mb-1">
                                         <label className="text-xs font-semibold text-slate-500 flex items-center gap-1"><Type size={12} /> Descrizione</label>
                                         <button onClick={generateAiContent} disabled={isAiSuggesting} className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-700 font-bold bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded border border-purple-200 transition-colors">
                                             {isAiSuggesting ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12} />} AI Refine
                                         </button>
                                     </div>
                                    <input type="text" value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} className="w-full text-sm font-bold border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1"><Calendar size={12} /> Data Esecuzione</label>
                                        <input type="date" value={editForm.completedAt} onChange={(e) => setEditForm({...editForm, completedAt: e.target.value})} className="w-full text-sm border-slate-300 rounded-md" />
                                    </div>
                                     <div className="flex gap-2">
                                         <div className="flex-1">
                                            <label className="block text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1"><Clock size={12} /> Durata (h)</label>
                                            <input type="number" min="0.5" step="0.5" value={editForm.duration} onChange={(e) => setEditForm({...editForm, duration: parseFloat(e.target.value)})} className="w-full text-sm border-slate-300 rounded-md" />
                                        </div>
                                        <div className="flex-1">
                                             <label className="block text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1"><ArrowRightLeft size={12} /> Sposta a</label>
                                            <select value={editForm.dayId} onChange={(e) => setEditForm({...editForm, dayId: parseInt(e.target.value)})} className="w-full text-sm border-slate-300 rounded-md bg-white">
                                                {Array.from({length: 10}, (_, i) => i + 1).map(d => (<option key={d} value={d}>Giorno {d}</option>))}
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1"><Users size={12} /> Assegnatari</label>
                                        {teamMembers.length > 0 ? (
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {teamMembers.map(member => {
                                                    const isSelected = editForm.attendees?.includes(member.name);
                                                    return (
                                                        <button key={member.id} onClick={() => toggleAttendee(member.name)} className={`text-xs px-2.5 py-1 rounded-full border transition-all ${isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}>
                                                            {member.name}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-orange-500 mb-2 flex items-center gap-1"><Settings size={10} /> Configura il Team nella Dashboard.</div>
                                        )}
                                        <input type="text" placeholder="Nomi manuali..." value={editForm.attendees} onChange={(e) => setEditForm({...editForm, attendees: e.target.value})} className="w-full text-sm border-slate-300 rounded-md" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1"><CheckCircle size={12} className="text-emerald-500"/> Definition of Done</label>
                                    <textarea placeholder="- Output validato..." value={editForm.definitionOfDone} onChange={(e) => setEditForm({...editForm, definitionOfDone: e.target.value})} rows={2} className="w-full text-sm border-slate-700 rounded-md bg-slate-900 text-white placeholder-slate-400 font-mono" />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1"><FileText size={12} /> Note</label>
                                    <textarea placeholder="Dettagli..." value={editForm.notes} onChange={(e) => setEditForm({...editForm, notes: e.target.value})} rows={3} className="w-full text-sm border-slate-300 rounded-md" />
                                </div>

                                <div className="flex justify-end pt-2 border-t border-slate-200">
                                    <button onClick={() => saveDetails(dIdx, tIdx, task.id)} disabled={!!savingDetails || isOffline} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50">
                                        {savingDetails === task.id ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salva Modifiche
                                    </button>
                                </div>
                            </div>
                            </div>
                        )}
                        </div>
                    );
                    })}
                </div>
                </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
