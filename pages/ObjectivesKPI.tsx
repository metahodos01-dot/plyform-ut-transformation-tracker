
import React, { useState, useEffect } from 'react';
import { Target, ArrowRight, Save, Plus, Trash2, CheckCircle2, XCircle, LayoutList, Loader2, Link as LinkIcon, AlertTriangle, Clock, Edit2, Sparkles, Bot, RefreshCw, Users, Wand2, Calculator, ChevronDown, ChevronUp, Pencil, BookOpen, Layers, CheckSquare } from 'lucide-react';
import { db, NEEDS_COLLECTION, USER_STORIES_COLLECTION, TASKS_COLLECTION, ensureAuth, getProjectSettings, updateLastSaved, formatDateTime } from '../services/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, writeBatch } from 'firebase/firestore';
import { EmergingNeed, UserStory, StoryStatus, TeamMember, Complexity, Task } from '../types';
import { INITIAL_PLAN } from '../constants';

export const ObjectivesKPI: React.FC = () => {
    const [needs, setNeeds] = useState<EmergingNeed[]>([]);
    const [stories, setStories] = useState<UserStory[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(false);
    const [integrating, setIntegrating] = useState(false);
    const [savingGlobal, setSavingGlobal] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string | undefined>();

    // AI / Copilot States
    const [isGenerating, setIsGenerating] = useState(false);
    const [draftStories, setDraftStories] = useState<any[]>([]);

    // View Mode
    const [viewMode, setViewMode] = useState<'cards' | 'tree'>('cards');

    // Manual Entry / Edit State
    const [isManualAdding, setIsManualAdding] = useState(false);
    const [editingStoryId, setEditingStoryId] = useState<string | null>(null);

    const [manualForm, setManualForm] = useState<{
        role: string;
        action: string;
        benefit: string;
        complexity: Complexity;
        definitionOfReady: string;
        definitionOfDone: string;
        duration: number;
        assignedTo: string[];
        needId: string;
        solution: { description: string; date: string; assignees: string[] };
        verification: { description: string; date: string; assignees: string[] };
    }>({
        role: '',
        action: '',
        benefit: '',
        complexity: 'M',
        definitionOfReady: '',
        definitionOfDone: '',
        duration: 2,
        assignedTo: [],
        needId: '',
        solution: { description: '', date: '', assignees: [] },
        verification: { description: '', date: '', assignees: [] }
    });

    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        setLoading(true);
        await ensureAuth();
        await refreshData();
        setLoading(false);
    };

    const refreshData = async () => {
        try {
            const settings = await getProjectSettings();
            if (settings?.team) setTeamMembers(settings.team);
            if (settings?.lastUpdated) setLastUpdated(settings.lastUpdated);

            // Load Confirmed Needs (The Backlog)
            const needsQuery = query(collection(db, NEEDS_COLLECTION), where('status', '==', 'CONFIRMED'));
            const needsSnap = await getDocs(needsQuery);
            setNeeds(needsSnap.docs.map(d => ({ id: d.id, ...d.data() } as EmergingNeed)));

            // Load Existing Stories
            const storySnap = await getDocs(collection(db, USER_STORIES_COLLECTION));
            setStories(storySnap.docs.map(d => ({ id: d.id, ...d.data() } as UserStory)));

            // Load Tasks for Traceability
            const taskSnap = await getDocs(collection(db, TASKS_COLLECTION));
            setTasks(taskSnap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
        } catch (e) {
            console.error("Error refreshing data", e);
        }
    };

    const handleGlobalSave = async () => {
        setSavingGlobal(true);
        try {
            const savedTime = await updateLastSaved();
            setLastUpdated(savedTime);
        } catch (e) {
            console.error("Error global save", e);
        } finally {
            setSavingGlobal(false);
        }
    };

    // --- MANUAL ENTRY / EDIT LOGIC ---
    const toggleManualAssignee = (name: string) => {
        setManualForm(prev => {
            const current = prev.assignedTo;
            if (current.includes(name)) {
                return { ...prev, assignedTo: current.filter(n => n !== name) };
            } else {
                return { ...prev, assignedTo: [...current, name] };
            }
        });
    };

    const resetForm = () => {
        setManualForm({
            role: '', action: '', benefit: '',
            complexity: 'M', definitionOfReady: '', definitionOfDone: '',
            duration: 2, assignedTo: [], needId: '',
            solution: { description: '', date: '', assignees: [] },
            verification: { description: '', date: '', assignees: [] }
        });
        setEditingStoryId(null);
        setIsManualAdding(false);
    };

    const handleEditClick = (story: UserStory) => {
        setManualForm({
            role: story.role,
            action: story.action,
            benefit: story.benefit,
            complexity: story.complexity,
            definitionOfReady: story.definitionOfReady,
            definitionOfDone: story.definitionOfDone,
            duration: story.duration,
            assignedTo: story.assignedTo,
            needId: story.needId,
            solution: story.solution || { description: '', date: '', assignees: [] },
            verification: story.verification || { description: '', date: '', assignees: [] }
        });
        setEditingStoryId(story.id);
        setIsManualAdding(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const saveManualStory = async () => {
        if (!manualForm.role || !manualForm.action) return;
        setLoading(true);
        try {
            const needDesc = needs.find(n => n.id === manualForm.needId)?.description || 'Inserimento Manuale';

            const payload = {
                ...manualForm,
                needDescription: needDesc
            };

            if (editingStoryId) {
                await updateDoc(doc(db, USER_STORIES_COLLECTION, editingStoryId), payload);
                setStories(stories.map(s => s.id === editingStoryId ? { ...s, ...payload } : s));
            } else {
                const newStory = {
                    ...payload,
                    status: 'CONFIRMED' as StoryStatus
                };
                const docRef = await addDoc(collection(db, USER_STORIES_COLLECTION), newStory);
                setStories([...stories, { ...newStory, id: docRef.id } as UserStory]);
            }

            await updateLastSaved();
            resetForm();
        } catch (e) {
            console.error("Error saving story", e);
        } finally {
            setLoading(false);
        }
    };


    // --- MISSING FUNCTIONS RESTORED ---
    const handleDelete = async (id: string) => {
        if (!window.confirm("Sei sicuro di voler eliminare questa User Story?")) return;
        setLoading(true);
        try {
            await deleteDoc(doc(db, USER_STORIES_COLLECTION, id));
            setStories(stories.filter(s => s.id !== id));
            await updateLastSaved();
        } catch (e) {
            console.error("Error deleting", e);
        } finally {
            setLoading(false);
        }
    };

    const confirmedCount = stories.filter(s => s.status === 'CONFIRMED').length;

    const integrateStoriesToPlan = async () => {
        if (!window.confirm(`Vuoi pianificare ${confirmedCount} storie confermate nello Sprint?`)) return;
        setIntegrating(true);
        // This is mostly a visual feedback in this view, the actual planning happens in ExecutionPlan
        // But we can mark them as "Ready to Plan" or similar if we wanted.
        // For now we just wait a bit to simulate the hand-off
        setTimeout(() => {
            setIntegrating(false);
            alert("Le storie sono pronte per essere importate nel Piano Esecutivo.");
        }, 1000);
    };

    // --- COPILOT MOCK LOGIC ---
    const runCopilotGenerator = async () => {
        setIsGenerating(true);
        // Simulate AI generation based on empty needs
        const emptyNeeds = needs;

        setTimeout(() => {
            const newDrafts: any[] = [];
            emptyNeeds.forEach(need => {
                if (!stories.some(s => s.needId === need.id)) {
                    // Generate a draft for this need
                    newDrafts.push({
                        tempId: Math.random().toString(),
                        needId: need.id,
                        needDescription: need.description,
                        role: "Utente",
                        action: `soddisfare l'esigenza: ${need.description}`,
                        benefit: `migliorare il processo di ${need.originator}`,
                        complexity: 'M',
                        duration: 4
                    });
                }
            });

            if (newDrafts.length === 0) {
                alert("Tutte le esigenze hanno già delle storie!");
            } else {
                setDraftStories(newDrafts);
            }
            setIsGenerating(false);
        }, 1500);
    };

    const saveAllDrafts = async () => {
        setLoading(true);
        const batch = writeBatch(db);
        const newLocalStories: UserStory[] = [];

        draftStories.forEach(draft => {
            const ref = doc(collection(db, USER_STORIES_COLLECTION));
            const storyData = {
                needId: draft.needId,
                needDescription: draft.needDescription,
                role: draft.role,
                action: draft.action,
                benefit: draft.benefit,
                complexity: draft.complexity || 'M',
                definitionOfReady: '',
                definitionOfDone: '',
                duration: draft.duration || 2,
                assignedTo: [],
                status: 'CONFIRMED'
            };
            batch.set(ref, storyData);
            newLocalStories.push({ ...storyData, id: ref.id } as UserStory);
        });

        await batch.commit();
        setStories([...stories, ...newLocalStories]);
        setDraftStories([]);
        setLoading(false);
    };

    const removeDraft = (tempId: string) => {
        setDraftStories(draftStories.filter(d => d.tempId !== tempId));
    };

    const updateDraft = (tempId: string, field: string, value: string) => {
        setDraftStories(draftStories.map(d => d.tempId === tempId ? { ...d, [field]: value } : d));
    };

    const saveDraftToDB = async (draft: any) => {
        const { tempId, ...data } = draft;
        const newStory = { ...data, status: 'CONFIRMED', assignedTo: [], definitionOfReady: '', definitionOfDone: '' };
        await addDoc(collection(db, USER_STORIES_COLLECTION), newStory);
        await refreshData();
        removeDraft(tempId);
    };

    // --- UI HELPERS ---
    const getGroupedStories = () => {
        const grouped: Record<string, UserStory[]> = {};
        const orphans: UserStory[] = [];

        stories.forEach(s => {
            if (s.needId && needs.some(n => n.id === s.needId)) {
                if (!grouped[s.needId]) grouped[s.needId] = [];
                grouped[s.needId].push(s);
            } else {
                orphans.push(s);
            }
        });
        return { grouped, orphans };
    };

    const { grouped, orphans } = getGroupedStories();

    const handleAddStoryToNeed = (needId: string) => {
        resetForm();
        setManualForm(prev => ({ ...prev, needId }));
        setIsManualAdding(true);
        // Optional: scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* HEADER */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="flex-1">
                        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                            <Layers className="text-indigo-600" /> User Stories (Agile)
                            <button onClick={refreshData} title="Sincronizza Backlog Esigenze" className="text-slate-400 hover:text-blue-600 transition-colors">
                                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                            </button>
                        </h2>
                        <p className="text-slate-500 mt-2 text-sm">
                            Traduzione delle esigenze in storie utente concrete, pronte per lo Sprint.
                            <br />Visualizzazione gerarchica: <strong>Esigenza (Padre) → User Stories (Figli)</strong>.
                        </p>
                        <div className="flex flex-wrap gap-3 mt-4">
                            <button
                                onClick={() => { resetForm(); setIsManualAdding(!isManualAdding); }}
                                className="bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 px-4 py-2.5 rounded-xl font-bold shadow-sm flex items-center gap-2 transition-all text-sm"
                            >
                                {isManualAdding && !editingStoryId ? <ChevronUp size={18} /> : <Plus size={18} />}
                                Nuova User Story (Generica)
                            </button>

                            {confirmedCount > 0 && (
                                <button
                                    onClick={integrateStoriesToPlan}
                                    disabled={integrating}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all text-sm"
                                >
                                    {integrating ? <Loader2 className="animate-spin" /> : <LayoutList size={18} />}
                                    Pianifica Stories Confermate
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                            <button
                                onClick={() => setViewMode('cards')}
                                className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'cards' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <LayoutList size={14} /> Schede
                            </button>
                            <button
                                onClick={() => setViewMode('tree')}
                                className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition-all ${viewMode === 'tree' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Layers size={14} /> Distinta Base
                            </button>
                        </div>
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
            </div>

            {/* MANUAL ENTRY / EDIT FORM CARD */}
            {isManualAdding && (
                <div className="bg-white rounded-xl p-6 shadow-lg border border-indigo-100 animate-in slide-in-from-top-4 relative ring-2 ring-indigo-500/20">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            {editingStoryId ? <Pencil size={18} className="text-indigo-500" /> : <Edit2 size={18} className="text-indigo-500" />}
                            {editingStoryId ? "Modifica User Story" : "Nuova User Story Manuale"}
                        </h3>
                        <button onClick={resetForm} className="text-slate-400 hover:text-slate-600"><XCircle size={18} /></button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Collega a Esigenza (Backlog)</label>
                            <select
                                value={manualForm.needId}
                                onChange={e => setManualForm({ ...manualForm, needId: e.target.value })}
                                className="w-full border-slate-300 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">-- Nessun collegamento (Generica) --</option>
                                {needs.map(n => (
                                    <option key={n.id} value={n.id}>[{n.priority}] {n.description}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Come (Role)</label>
                                <input type="text" placeholder="es. Tecnico UT" value={manualForm.role} onChange={e => setManualForm({ ...manualForm, role: e.target.value })} className="w-full border-slate-300 rounded text-sm font-medium" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Voglio (Action)</label>
                                <input type="text" placeholder="es. accedere ai dati storici" value={manualForm.action} onChange={e => setManualForm({ ...manualForm, action: e.target.value })} className="w-full border-slate-300 rounded text-sm font-medium" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Affinché (Benefit)</label>
                                <input type="text" placeholder="es. non ripetere errori" value={manualForm.benefit} onChange={e => setManualForm({ ...manualForm, benefit: e.target.value })} className="w-full border-slate-300 rounded text-sm font-medium" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Definition of Ready (DoR)</label>
                                <textarea rows={2} placeholder="- Input disponibili..." value={manualForm.definitionOfReady} onChange={e => setManualForm({ ...manualForm, definitionOfReady: e.target.value })} className="w-full border-slate-300 rounded text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Definition of Done (DoD)</label>
                                <textarea rows={2} placeholder="- Output validato..." value={manualForm.definitionOfDone} onChange={e => setManualForm({ ...manualForm, definitionOfDone: e.target.value })} className="w-full border-slate-300 rounded text-sm" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Complessità</label>
                                <div className="flex gap-2">
                                    {['XS', 'S', 'M', 'L', 'XL'].map((c) => (
                                        <button key={c} onClick={() => setManualForm({ ...manualForm, complexity: c as Complexity })} className={`px-3 py-1 rounded border text-xs font-bold ${manualForm.complexity === c ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500'}`}>{c}</button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Durata (h)</label>
                                <input type="number" step="0.5" value={manualForm.duration} onChange={e => setManualForm({ ...manualForm, duration: parseFloat(e.target.value) })} className="w-24 border-slate-300 rounded text-sm" />
                            </div>
                        </div>

                        {/* SOLUTION & VERIFICATION SECTION */}
                        <div className="border-t border-slate-100 pt-4 mt-2">
                            <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><Wand2 size={16} /> Soluzione & Verifica</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* SOLUTION FIELD */}
                                <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Soluzione Tecnica</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Descrivi la soluzione tecnica..."
                                        value={manualForm.solution.description}
                                        onChange={e => setManualForm({ ...manualForm, solution: { ...manualForm.solution, description: e.target.value } })}
                                        className="w-full border-slate-300 rounded text-sm mb-3"
                                    />
                                    <div className="flex gap-2 mb-2">
                                        <div className="flex-1">
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Data Soluzione</label>
                                            <input
                                                type="date"
                                                value={manualForm.solution.date}
                                                onChange={e => setManualForm({ ...manualForm, solution: { ...manualForm.solution, date: e.target.value } })}
                                                className="w-full border-slate-300 rounded text-xs"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Esecutori Soluzione</label>
                                        <div className="flex flex-wrap gap-1">
                                            {teamMembers.map(member => (
                                                <button
                                                    key={member.id}
                                                    onClick={() => {
                                                        const current = manualForm.solution.assignees;
                                                        const newAssignees = current.includes(member.name)
                                                            ? current.filter(n => n !== member.name)
                                                            : [...current, member.name];
                                                        setManualForm({ ...manualForm, solution: { ...manualForm.solution, assignees: newAssignees } });
                                                    }}
                                                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${manualForm.solution.assignees.includes(member.name) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'}`}
                                                >
                                                    {member.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* VERIFICATION FIELD */}
                                <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-100">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Verifica & Validazione</label>
                                    <textarea
                                        rows={3}
                                        placeholder="Note di verifica..."
                                        value={manualForm.verification.description}
                                        onChange={e => setManualForm({ ...manualForm, verification: { ...manualForm.verification, description: e.target.value } })}
                                        className="w-full border-slate-300 rounded text-sm mb-3"
                                    />
                                    <div className="flex gap-2 mb-2">
                                        <div className="flex-1">
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Data Verifica</label>
                                            <input
                                                type="date"
                                                value={manualForm.verification.date}
                                                onChange={e => setManualForm({ ...manualForm, verification: { ...manualForm.verification, date: e.target.value } })}
                                                className="w-full border-slate-300 rounded text-xs"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Esecutori Verifica</label>
                                        <div className="flex flex-wrap gap-1">
                                            {teamMembers.map(member => (
                                                <button
                                                    key={member.id}
                                                    onClick={() => {
                                                        const current = manualForm.verification.assignees;
                                                        const newAssignees = current.includes(member.name)
                                                            ? current.filter(n => n !== member.name)
                                                            : [...current, member.name];
                                                        setManualForm({ ...manualForm, verification: { ...manualForm.verification, assignees: newAssignees } });
                                                    }}
                                                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${manualForm.verification.assignees.includes(member.name) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-500 border-slate-200'}`}
                                                >
                                                    {member.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-2 border-t pt-4">
                        <button onClick={resetForm} className="text-slate-500 hover:text-slate-700 text-sm font-medium px-4">Annulla</button>
                        <button onClick={saveManualStory} disabled={!manualForm.action} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50">
                            <Save size={18} /> {editingStoryId ? "Aggiorna Story" : "Salva Story"}
                        </button>
                    </div>
                </div>
            )}

            {/* COPILOT AGENT MINI-BAR */}
            {!isManualAdding && (
                <div className="bg-slate-900 rounded-xl p-4 flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-600 p-2 rounded-lg">
                            <Bot size={20} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-sm">Agile Copilot sta analizzando...</h3>
                            <p className="text-slate-400 text-xs">Usa l'IA per completare le storie mancanti per ogni esigenza.</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {draftStories.length > 0 ? (
                            <button onClick={saveAllDrafts} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2">
                                <Save size={14} /> Salva Bozze ({draftStories.length})
                            </button>
                        ) : (
                            <button onClick={runCopilotGenerator} disabled={isGenerating} className="bg-slate-700 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50">
                                {isGenerating ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                                Genera Storie per Backlog
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* COPILOT DRAFTS PREVIEW */}
            {draftStories.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {draftStories.map((draft, idx) => (
                        <div key={idx} className="bg-purple-900/10 border border-purple-500/30 rounded-lg p-4 relative group">
                            <button onClick={() => removeDraft(draft.tempId)} className="absolute top-2 right-2 text-slate-500 hover:text-red-400"><XCircle size={16} /></button>
                            <div className="text-[10px] text-purple-600 font-bold mb-2 uppercase flex items-center gap-1"><Sparkles size={10} /> Draft per: {draft.needDescription.substring(0, 30)}...</div>
                            <div className="space-y-2">
                                <div className="flex gap-1"><span className="text-slate-500 text-xs font-bold w-12">Come</span><input value={draft.role} onChange={e => updateDraft(draft.tempId, 'role', e.target.value)} className="bg-white border-slate-200 text-xs text-slate-700 rounded w-full" /></div>
                                <div className="flex gap-1"><span className="text-slate-500 text-xs font-bold w-12">Voglio</span><input value={draft.action} onChange={e => updateDraft(draft.tempId, 'action', e.target.value)} className="bg-white border-slate-200 text-xs text-slate-700 rounded w-full" /></div>
                                <div className="flex gap-1"><span className="text-slate-500 text-xs font-bold w-12">Per</span><input value={draft.benefit} onChange={e => updateDraft(draft.tempId, 'benefit', e.target.value)} className="bg-white border-slate-200 text-xs text-slate-700 rounded w-full" /></div>
                            </div>
                            <button onClick={() => saveDraftToDB(draft)} className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-1.5 rounded font-bold">Conferma Draft</button>
                        </div>
                    ))}
                </div>
            )}

            {/* PARENT-CHILD VIEW: NEEDS -> USER STORIES */}
            {viewMode === 'cards' ? (
                <div className="space-y-6">

                    {/* SECTION 1: NEEDS WITH STORIES */}
                    {needs.map(need => (
                        <div key={need.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            {/* Need Header */}
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex gap-4 items-start">
                                    <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border ${need.priority === 'URGENT' ? 'bg-red-100 text-red-700 border-red-200' :
                                        need.priority === 'HIGH' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                            'bg-blue-100 text-blue-700 border-blue-200'
                                        }`}>
                                        {Array.isArray(grouped[need.id]) ? grouped[need.id].length : 0}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Esigenza {need.priority}</span>
                                            <span className="text-slate-300">•</span>
                                            <span className="text-[10px] font-bold text-slate-500">{need.originator}</span>
                                        </div>
                                        <h3 className="font-bold text-slate-800 text-lg">{need.description}</h3>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleAddStoryToNeed(need.id)}
                                    className="text-xs bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-slate-600 px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 transition-all shadow-sm"
                                >
                                    <Plus size={14} /> Aggiungi Story
                                </button>
                            </div>

                            {/* Stories Grid for this Need */}
                            <div className="p-6 bg-white min-h-[100px]">
                                {(!grouped[need.id] || grouped[need.id].length === 0) ? (
                                    <div className="text-center py-4 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                                        <p className="text-slate-400 text-sm mb-2">Nessuna User Story collegata a questa esigenza.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                        {grouped[need.id].map(story => (
                                            <div key={story.id} className={`p-4 rounded-xl border relative group transition-all ${story.status === 'INTEGRATED' ? 'bg-emerald-50/50 border-emerald-100 opacity-80' : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-md'}`}>
                                                {/* Action Buttons */}
                                                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                    <button onClick={() => handleEditClick(story)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded bg-white border border-slate-200 shadow-sm"><Pencil size={12} /></button>
                                                    <button onClick={() => handleDelete(story.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded bg-white border border-slate-200 shadow-sm"><Trash2 size={12} /></button>
                                                </div>

                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${story.complexity === 'XL' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                                        {story.complexity}
                                                    </span>
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${story.status === 'CONFIRMED' ? 'bg-indigo-50 text-indigo-600' :
                                                        story.status === 'INTEGRATED' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
                                                        }`}>
                                                        {story.status}
                                                    </span>
                                                </div>

                                                <div className="pr-8">
                                                    <p className="text-sm text-slate-800"><span className="font-bold text-slate-400 text-xs uppercase mr-2">Come</span> {story.role}</p>
                                                    <p className="text-base font-bold text-indigo-900 leading-snug my-1"><span className="font-normal text-slate-400 text-xs uppercase mr-2">Voglio</span> {story.action}</p>
                                                    <p className="text-sm text-slate-600 italic"><span className="font-bold text-slate-400 not-italic text-xs uppercase mr-2">Per</span> {story.benefit}</p>
                                                </div>

                                                <div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-2">
                                                    {story.definitionOfDone && (
                                                        <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium" title={story.definitionOfDone}>
                                                            <CheckSquare size={12} /> DoD definita
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-1 text-[10px] text-slate-400 ml-auto">
                                                        <Clock size={12} /> {story.duration}h
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* SECTION 2: ORPHANS */}
                    {orphans.length > 0 && (
                        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 opacity-80 hover:opacity-100 transition-opacity">
                            <div className="flex items-center gap-3 mb-4">
                                <AlertTriangle className="text-amber-500" />
                                <h3 className="font-bold text-slate-700">User Stories Non Collegate (Orfane)</h3>
                                <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">{orphans.length}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {orphans.map(story => (
                                    <div key={story.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm relative group">
                                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEditClick(story)} className="p-1 hover:bg-slate-100 rounded"><Pencil size={14} /></button>
                                            <button onClick={() => handleDelete(story.id)} className="p-1 hover:bg-slate-100 rounded text-red-500"><Trash2 size={14} /></button>
                                        </div>
                                        <div className="text-xs font-bold text-slate-400 mb-1">Come {story.role}</div>
                                        <div className="font-bold text-slate-800 text-sm mb-1">{story.action}</div>
                                        <div className="text-xs text-amber-600 flex items-center gap-1 mt-2">
                                            <AlertTriangle size={12} /> Manca Link Esigenza
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4 font-mono text-sm">
                    {needs.map(need => (
                        <div key={need.id} className="relative pl-6 pb-4 border-l-2 border-indigo-200 last:border-0">
                            {/* Node Connector */}
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-500 border-2 border-white shadow-sm z-10"></div>

                            {/* NEED CARD */}
                            <div className="ml-4 bg-white border border-indigo-200 rounded-lg p-3 shadow-sm inline-block min-w-[300px] mb-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 rounded">ESIGENZA</span>
                                    <span className="text-xs text-slate-500">{need.originator}</span>
                                </div>
                                <div className="font-bold text-slate-800">{need.description}</div>
                            </div>

                            {/* USER STORIES */}
                            {grouped[need.id]?.map(story => (
                                <div key={story.id} className="relative ml-12 mt-4 pl-6 pb-2 border-l-2 border-slate-200 last:border-0">
                                    <div className="absolute -left-[9px] top-4 w-4 h-0.5 bg-slate-200"></div>

                                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 inline-block min-w-[300px] hover:border-indigo-300 transition-colors">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-1.5 rounded">USER STORY</span>
                                            <span className="text-[10px] text-slate-400">{story.complexity}</span>
                                        </div>
                                        <div className="font-medium text-slate-700 text-sm">{story.action}</div>

                                        {/* TASKS */}
                                        {tasks.filter(t => t.generatedFromStoryId === story.id).length > 0 && (
                                            <div className="mt-3 pl-4 border-l-2 border-emerald-100 space-y-2">
                                                {tasks.filter(t => t.generatedFromStoryId === story.id).map(task => (
                                                    <div key={task.id} className="text-xs flex items-center gap-2 text-slate-600">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                                        <span className="truncate max-w-[250px]">{task.description}</span>
                                                        <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1 rounded">{task.duration}h</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {/* Extended Traceability Info in Tree View */}
                                    {(story.solution?.description || story.verification?.description) && (
                                        <div className="ml-4 mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 max-w-4xl">
                                            {story.solution?.description && (
                                                <div className="text-xs bg-blue-50 p-2 rounded border border-blue-100">
                                                    <div className="font-bold text-blue-800 mb-1 flex items-center gap-2"><Wand2 size={10} /> Soluzione:</div>
                                                    <div className="text-slate-700">{story.solution.description}</div>
                                                    <div className="mt-1 text-[10px] text-slate-400 flex items-center gap-2">
                                                        <span>{story.solution.date}</span>
                                                        <span>•</span>
                                                        <span>{story.solution.assignees.join(', ')}</span>
                                                    </div>
                                                </div>
                                            )}
                                            {story.verification?.description && (
                                                <div className="text-xs bg-emerald-50 p-2 rounded border border-emerald-100">
                                                    <div className="font-bold text-emerald-800 mb-1 flex items-center gap-2"><CheckCircle2 size={10} /> Verifica:</div>
                                                    <div className="text-slate-700">{story.verification.description}</div>
                                                    <div className="mt-1 text-[10px] text-slate-400 flex items-center gap-2">
                                                        <span>{story.verification.date}</span>
                                                        <span>•</span>
                                                        <span>{story.verification.assignees.join(', ')}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                            ))}

                            {(!grouped[need.id] || grouped[need.id].length === 0) && (
                                <div className="ml-16 mt-2 text-xs text-slate-400 italic">
                                    └── Nessuna User Story collegata
                                </div>
                            )}
                        </div>
                    ))
                    }

                    {
                        orphans.length > 0 && (
                            <div className="pt-8 border-t border-slate-200 mt-8">
                                <h3 className="text-amber-600 font-bold mb-4 flex items-center gap-2"><AlertTriangle size={16} /> Orfane (Non Catalogate)</h3>
                                {orphans.map(story => (
                                    <div key={story.id} className="ml-4 mb-2 bg-amber-50 border border-amber-200 p-2 rounded inline-block text-xs text-amber-800">
                                        {story.action}
                                    </div>
                                ))}
                            </div>
                        )
                    }
                </div>
            )}
        </div>
    );
};

