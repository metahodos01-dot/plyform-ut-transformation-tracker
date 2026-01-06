
import React, { useState, useEffect } from 'react';
import { Target, ArrowRight, Save, Plus, Trash2, CheckCircle2, XCircle, LayoutList, Loader2, Link as LinkIcon, AlertTriangle, Clock, Edit2, Sparkles, Bot, RefreshCw, Users, Wand2, Calculator, ChevronDown, ChevronUp, Pencil, BookOpen, Layers, CheckSquare } from 'lucide-react';
import { db, NEEDS_COLLECTION, USER_STORIES_COLLECTION, TASKS_COLLECTION, ensureAuth, getProjectSettings, updateLastSaved, formatDateTime } from '../services/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, writeBatch } from 'firebase/firestore';
import { EmergingNeed, UserStory, StoryStatus, TeamMember, Complexity } from '../types';
import { INITIAL_PLAN } from '../constants';

export const ObjectivesKPI: React.FC = () => {
  const [needs, setNeeds] = useState<EmergingNeed[]>([]);
  const [stories, setStories] = useState<UserStory[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [integrating, setIntegrating] = useState(false);
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | undefined>();
  
  // AI / Copilot States
  const [isGenerating, setIsGenerating] = useState(false);
  const [draftStories, setDraftStories] = useState<any[]>([]); 
  
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
  }>({
      role: '',
      action: '',
      benefit: '',
      complexity: 'M',
      definitionOfReady: '',
      definitionOfDone: '',
      duration: 2,
      assignedTo: [],
      needId: ''
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
          duration: 2, assignedTo: [], needId: '' 
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
          needId: story.needId
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

  // --- COPILOT AGENT LOGIC (3 STORIES PER NEED) ---
  const runCopilotGenerator = () => {
      setIsGenerating(true);
      setDraftStories([]);

      setTimeout(() => {
          const suggestions: any[] = [];
          
          needs
            .filter(n => !stories.some(s => s.needId === n.id)) // Only needs without stories
            .forEach(need => {
                const generated = generateStoriesForNeed(need);
                suggestions.push(...generated);
            });
          
          if (suggestions.length === 0 && needs.length > 0) {
              alert("Le esigenze confermate hanno già storie collegate. Usa 'Nuova User Story' per aggiungerne altre manualmente.");
          }
          
          setDraftStories(suggestions);
          setIsGenerating(false);
      }, 3000);
  };

  const generateStoriesForNeed = (need: EmergingNeed): any[] => {
      const desc = need.description.toLowerCase();
      const base = {
          needId: need.id,
          needDescription: need.description,
          tempId: ''
      };

      // Scenario: Feedback Loop
      if (desc.includes('feedback') || desc.includes('loop')) {
          return [
              { ...base, role: 'Operatore', action: 'segnalare anomalie tramite modulo rapido', benefit: 'tracciare problemi reali', complexity: 'S', dor: 'Modulo disponibile', dod: 'Log compilato da 3 operatori', duration: 2, assignedTo: ['Produzione'], tempId: Math.random().toString() },
              { ...base, role: 'Tecnico UT', action: 'analizzare le segnalazioni settimanali', benefit: 'aggiornare i cicli di lavoro', complexity: 'M', dor: 'Accesso ai log', dod: 'Report analisi redatto', duration: 3, assignedTo: ['Leonardo'], tempId: Math.random().toString() },
              { ...base, role: 'Quality Manager', action: 'monitorare il trend delle non conformità', benefit: 'verificare efficacia azioni correttive', complexity: 'M', dor: 'KPI definiti', dod: 'Dashboard aggiornata', duration: 2, assignedTo: ['Qualità'], tempId: Math.random().toString() }
          ];
      }
      // Scenario: NADCAP
      else if (desc.includes('nadcap') || desc.includes('certificaz')) {
          return [
              { ...base, role: 'Responsabile UT', action: 'revisionare le checklist di processo', benefit: 'garantire compliance normativa', complexity: 'L', dor: 'Standard NADCAP disponibile', dod: 'Checklist approvata', duration: 4, assignedTo: ['Ramponi'], tempId: Math.random().toString() },
              { ...base, role: 'Operatore', action: 'eseguire un audit simulato', benefit: 'verificare lacune operative', complexity: 'M', dor: 'Checklist stampata', dod: 'Audit completato senza major NC', duration: 3, assignedTo: ['Produzione'], tempId: Math.random().toString() },
              { ...base, role: 'Team', action: 'documentare le evidenze', benefit: 'avere prova per l\'auditor', complexity: 'S', dor: 'Cartella condivisa', dod: 'Foto e documenti caricati', duration: 2, assignedTo: ['Qualità'], tempId: Math.random().toString() }
          ];
      }
      // Scenario: Agile/Board
      else if (desc.includes('agile') || desc.includes('scrum')) {
          return [
              { ...base, role: 'Team Member', action: 'visualizzare i miei task sulla board', benefit: 'sapere cosa fare oggi', complexity: 'XS', dor: 'Lavagna installata', dod: 'Post-it aggiornati', duration: 1, assignedTo: ['Tutti'], tempId: Math.random().toString() },
              { ...base, role: 'Scrum Master', action: 'facilitare il daily stand-up', benefit: 'rimuovere impedimenti', complexity: 'S', dor: 'Orario definito', dod: 'Verbale flash inviato', duration: 1, assignedTo: ['Leonardo'], tempId: Math.random().toString() },
              { ...base, role: 'Manager', action: 'vedere il progresso dello sprint', benefit: 'non disturbare il team', complexity: 'S', dor: 'Board aggiornata', dod: 'Foto della board ricevuta', duration: 1, assignedTo: ['Management'], tempId: Math.random().toString() }
          ];
      }
      
      // Generic Fallback
      return [
          { ...base, role: 'Utente UT', action: 'definire i requisiti operativi', benefit: 'chiarire il perimetro', complexity: 'M', dor: 'Documenti base', dod: 'Specifica approvata', duration: 2, assignedTo: ['UT'], tempId: Math.random().toString() },
          { ...base, role: 'Stakeholder', action: 'validare la soluzione proposta', benefit: 'evitare rilavorazioni', complexity: 'S', dor: 'Mockup pronto', dod: 'Mail di approvazione', duration: 1, assignedTo: ['Operations'], tempId: Math.random().toString() },
          { ...base, role: 'Tecnico', action: 'implementare la procedura', benefit: 'rendere operativo il processo', complexity: 'L', dor: 'Approvazione ricevuta', dod: 'Procedura in vigore', duration: 4, assignedTo: ['UT'], tempId: Math.random().toString() }
      ];
  };

  // --- DRAFT MANAGEMENT ---
  const updateDraft = (tempId: string, field: string, value: any) => {
      setDraftStories(prev => prev.map(draft => 
          draft.tempId === tempId ? { ...draft, [field]: value } : draft
      ));
  };

  const removeDraft = (tempId: string) => {
      setDraftStories(prev => prev.filter(d => d.tempId !== tempId));
  };

  const saveDraftToDB = async (draft: any) => {
      try {
          const finalStory = {
              needId: draft.needId,
              needDescription: draft.needDescription,
              role: draft.role,
              action: draft.action,
              benefit: draft.benefit,
              complexity: draft.complexity,
              definitionOfReady: draft.dor,
              definitionOfDone: draft.dod,
              duration: draft.duration,
              assignedTo: draft.assignedTo,
              status: 'CONFIRMED'
          };

          const docRef = await addDoc(collection(db, USER_STORIES_COLLECTION), finalStory);
          setStories(prev => [...prev, { ...finalStory, id: docRef.id } as UserStory]);
          removeDraft(draft.tempId);
      } catch (e) {
          console.error("Error saving draft", e);
      }
  };

  const saveAllDrafts = async () => {
      for (const draft of draftStories) {
          await saveDraftToDB(draft);
      }
      await updateLastSaved();
  };

  // --- EXISTING FUNCTIONALITY ---
  const handleStatusChange = async (id: string, newStatus: StoryStatus) => {
    try {
      await updateDoc(doc(db, USER_STORIES_COLLECTION, id), { status: newStatus });
      setStories(stories.map(s => s.id === id ? { ...s, status: newStatus } : s));
      updateLastSaved();
    } catch (e) {
      console.error("Error updating status", e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Eliminare questa User Story?")) return;
    try {
      await deleteDoc(doc(db, USER_STORIES_COLLECTION, id));
      setStories(stories.filter(s => s.id !== id));
      updateLastSaved();
    } catch (e) {
      console.error("Error deleting", e);
    }
  };

  const integrateStoriesToPlan = async () => {
    const confirmed = stories.filter(s => s.status === 'CONFIRMED');
    if (confirmed.length === 0) return;

    setIntegrating(true);
    try {
        const tasksSnap = await getDocs(collection(db, TASKS_COLLECTION));
        let currentTasks: any[] = [];
        
        if (tasksSnap.empty) {
             INITIAL_PLAN.forEach(d => {
                 d.tasks.forEach(t => currentTasks.push({...t, dayId: d.day}));
             });
        } else {
            currentTasks = tasksSnap.docs.map(d => d.data());
        }

        const newTasksBatch: any[] = [];
        const storiesToUpdate: string[] = [];

        confirmed.forEach(story => {
            let assignedDay = -1;
            // Simple Greedy Scheduler
            for (let d = 1; d <= 10; d++) {
                const dayTasks = [...currentTasks, ...newTasksBatch].filter(t => t.dayId === d);
                const dayLoad = dayTasks.reduce((acc, t) => acc + (t.duration || 0), 0);
                if (dayLoad + story.duration <= 6) {
                    assignedDay = d;
                    break;
                }
            }
            if (assignedDay === -1) assignedDay = 10; // Overflow

            const newTask = {
                description: `[US] ${story.action}`,
                completed: false,
                dayId: assignedDay,
                duration: story.duration,
                generatedFromStoryId: story.id,
                assignedTo: story.assignedTo.join(', '), 
                notes: `Story: As a ${story.role}, I want ${story.action} so that ${story.benefit}`,
                definitionOfDone: story.definitionOfDone
            };

            newTasksBatch.push(newTask);
            storiesToUpdate.push(story.id);
        });

        await Promise.all(newTasksBatch.map(t => addDoc(collection(db, TASKS_COLLECTION), t)));
        await Promise.all(storiesToUpdate.map(id => updateDoc(doc(db, USER_STORIES_COLLECTION, id), { status: 'INTEGRATED' })));

        setStories(stories.map(s => storiesToUpdate.includes(s.id) ? { ...s, status: 'INTEGRATED' } : s));
        
        await updateLastSaved();
        alert(`${newTasksBatch.length} User Stories integrate nel Piano Esecutivo.`);

    } catch (e) {
        console.error("Integration failed", e);
        alert("Errore integrazione.");
    } finally {
        setIntegrating(false);
    }
  };

  const confirmedCount = stories.filter(s => s.status === 'CONFIRMED').length;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* HEADER */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                    <Layers className="text-indigo-600"/> User Stories (Agile)
                    <button onClick={refreshData} title="Sincronizza Backlog Esigenze" className="text-slate-400 hover:text-blue-600 transition-colors">
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                </h2>
                <p className="text-slate-500 mt-2 text-sm">
                    Traduzione delle esigenze in storie utente concrete, pronte per lo Sprint.
                    <br/>Template: <em>"Come [Ruolo], voglio [Azione], affinché [Beneficio]"</em>.
                </p>
                <div className="flex flex-wrap gap-3 mt-4">
                    <button 
                        onClick={() => { resetForm(); setIsManualAdding(!isManualAdding); }}
                        className="bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 px-4 py-2.5 rounded-xl font-bold shadow-sm flex items-center gap-2 transition-all text-sm"
                    >
                        {isManualAdding && !editingStoryId ? <ChevronUp size={18} /> : <Plus size={18} />}
                        Nuova User Story
                    </button>
                    
                    {confirmedCount > 0 && (
                        <button 
                            onClick={integrateStoriesToPlan}
                            disabled={integrating}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all text-sm"
                        >
                            {integrating ? <Loader2 className="animate-spin" /> : <LayoutList size={18} />}
                            Pianifica {confirmedCount} Storie
                        </button>
                    )}
                </div>
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
      </div>

      {/* MANUAL ENTRY / EDIT FORM CARD */}
      {isManualAdding && (
          <div className="bg-white rounded-xl p-6 shadow-lg border border-indigo-100 animate-in slide-in-from-top-4 relative ring-2 ring-indigo-500/20">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      {editingStoryId ? <Pencil size={18} className="text-indigo-500" /> : <Edit2 size={18} className="text-indigo-500" />}
                      {editingStoryId ? "Modifica User Story" : "Nuova User Story Manuale"}
                  </h3>
                  <button onClick={resetForm} className="text-slate-400 hover:text-slate-600"><XCircle size={18}/></button>
              </div>
              
              <div className="space-y-4">
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Collega a Esigenza (Backlog)</label>
                      <select 
                         value={manualForm.needId} 
                         onChange={e => setManualForm({...manualForm, needId: e.target.value})}
                         className="w-full border-slate-300 rounded-lg text-sm"
                      >
                          <option value="">-- Nessun collegamento (Generica) --</option>
                          {needs.map(n => (
                              <option key={n.id} value={n.id}>{n.description}</option>
                          ))}
                      </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Come (Role)</label>
                          <input type="text" placeholder="es. Tecnico UT" value={manualForm.role} onChange={e => setManualForm({...manualForm, role: e.target.value})} className="w-full border-slate-300 rounded text-sm font-medium"/>
                      </div>
                      <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Voglio (Action)</label>
                          <input type="text" placeholder="es. accedere ai dati storici" value={manualForm.action} onChange={e => setManualForm({...manualForm, action: e.target.value})} className="w-full border-slate-300 rounded text-sm font-medium"/>
                      </div>
                      <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Affinché (Benefit)</label>
                          <input type="text" placeholder="es. non ripetere errori" value={manualForm.benefit} onChange={e => setManualForm({...manualForm, benefit: e.target.value})} className="w-full border-slate-300 rounded text-sm font-medium"/>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Definition of Ready (DoR)</label>
                           <textarea rows={2} placeholder="- Input disponibili..." value={manualForm.definitionOfReady} onChange={e => setManualForm({...manualForm, definitionOfReady: e.target.value})} className="w-full border-slate-300 rounded text-sm"/>
                      </div>
                      <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Definition of Done (DoD)</label>
                           <textarea rows={2} placeholder="- Output validato..." value={manualForm.definitionOfDone} onChange={e => setManualForm({...manualForm, definitionOfDone: e.target.value})} className="w-full border-slate-300 rounded text-sm"/>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Complessità</label>
                          <div className="flex gap-2">
                              {['XS','S','M','L','XL'].map((c) => (
                                  <button key={c} onClick={() => setManualForm({...manualForm, complexity: c as Complexity})} className={`px-3 py-1 rounded border text-xs font-bold ${manualForm.complexity === c ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500'}`}>{c}</button>
                              ))}
                          </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Durata (h)</label>
                          <input type="number" step="0.5" value={manualForm.duration} onChange={e => setManualForm({...manualForm, duration: parseFloat(e.target.value)})} className="w-24 border-slate-300 rounded text-sm"/>
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

      {/* COPILOT SECTION */}
      <div className="bg-slate-900 rounded-xl p-1 shadow-2xl overflow-hidden">
            <div className="bg-slate-900 p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3 text-white">
                        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-2 rounded-lg">
                            <Bot size={24} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Agile Copilot</h3>
                            <p className="text-slate-400 text-xs">Genera 3 User Story per ogni Esigenza (Produzione, UT, Mgmt)</p>
                        </div>
                    </div>
                    {draftStories.length > 0 && (
                         <button 
                            onClick={saveAllDrafts}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
                         >
                            <Save size={16} /> Salva Tutte ({draftStories.length})
                         </button>
                    )}
                </div>

                {draftStories.length === 0 && !isGenerating ? (
                    <div className="text-center py-10 bg-slate-800/50 rounded-xl border border-slate-700 border-dashed">
                        <Wand2 className="mx-auto h-10 w-10 text-purple-400 mb-3 opacity-80" />
                        <h4 className="text-white font-bold mb-2">Trasforma Esigenze in Storie</h4>
                        <p className="text-slate-400 text-sm mb-4">L'IA creerà automaticamente le storie mancanti per il backlog.</p>
                        <button 
                            onClick={runCopilotGenerator}
                            disabled={needs.length === 0}
                            className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 mx-auto disabled:opacity-50"
                        >
                            <Sparkles size={16} /> Genera Storie Mancanti
                        </button>
                    </div>
                ) : isGenerating ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="h-10 w-10 text-purple-500 animate-spin mb-3" />
                        <p className="text-purple-300 font-medium">Scrittura User Stories in corso...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {draftStories.map((draft, idx) => (
                            <div key={idx} className="bg-slate-800 border border-slate-700 rounded-lg p-4 relative group hover:border-purple-500/50">
                                <button onClick={() => removeDraft(draft.tempId)} className="absolute top-2 right-2 text-slate-500 hover:text-red-400"><XCircle size={16} /></button>
                                <div className="text-[10px] text-purple-300 mb-2 truncate">Esigenza: {draft.needDescription}</div>
                                <div className="space-y-2">
                                    <div className="flex gap-1"><span className="text-slate-500 text-xs font-bold w-8">Come</span><input value={draft.role} onChange={e=>updateDraft(draft.tempId,'role',e.target.value)} className="bg-slate-900 border-slate-600 text-xs text-white rounded w-full"/></div>
                                    <div className="flex gap-1"><span className="text-slate-500 text-xs font-bold w-8">Voglio</span><input value={draft.action} onChange={e=>updateDraft(draft.tempId,'action',e.target.value)} className="bg-slate-900 border-slate-600 text-xs text-white rounded w-full"/></div>
                                    <div className="flex gap-1"><span className="text-slate-500 text-xs font-bold w-8">Per</span><input value={draft.benefit} onChange={e=>updateDraft(draft.tempId,'benefit',e.target.value)} className="bg-slate-900 border-slate-600 text-xs text-white rounded w-full"/></div>
                                </div>
                                <button onClick={() => saveDraftToDB(draft)} className="mt-3 w-full bg-slate-700 hover:bg-emerald-600 text-white text-xs py-1.5 rounded font-bold">Conferma</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
      </div>

      {/* STORY LIST */}
      <div>
        <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4 text-xl">
             <Layers size={24} className="text-indigo-600"/> Backlog User Stories ({stories.length})
        </h3>
        
        {stories.length === 0 && (
             <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">Nessuna User Story definita.</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
             {stories.map(story => (
                 <div key={story.id} className={`bg-white p-5 rounded-xl border relative group transition-all ${story.status === 'INTEGRATED' ? 'opacity-60 bg-slate-50' : 'hover:shadow-md border-slate-200'}`}>
                     {/* Edit/Delete Actions */}
                     <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => handleEditClick(story)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded bg-white border border-slate-200 shadow-sm"><Pencil size={14}/></button>
                         <button onClick={() => handleDelete(story.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded bg-white border border-slate-200 shadow-sm"><Trash2 size={14}/></button>
                     </div>

                     <div className="flex items-center gap-2 mb-3">
                         <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${story.complexity === 'XL' || story.complexity === 'L' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                             {story.complexity}
                         </span>
                         <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                             story.status === 'CONFIRMED' ? 'bg-indigo-100 text-indigo-700' :
                             story.status === 'INTEGRATED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                         }`}>
                             {story.status}
                         </span>
                     </div>
                     
                     <div className="mb-4">
                         <p className="text-sm text-slate-800"><span className="font-bold text-slate-400">Come</span> {story.role}</p>
                         <p className="text-lg font-bold text-indigo-900 leading-tight my-1"><span className="font-normal text-slate-400 text-sm">Voglio</span> {story.action}</p>
                         <p className="text-sm text-slate-600 italic"><span className="font-bold text-slate-400 not-italic">Affinché</span> {story.benefit}</p>
                     </div>

                     <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                         <div>
                             <strong className="text-slate-500 block mb-1">Definition of Ready</strong>
                             <p className="text-slate-700">{story.definitionOfReady || '-'}</p>
                         </div>
                         <div>
                             <strong className="text-emerald-600 block mb-1 flex items-center gap-1"><CheckSquare size={10}/> Definition of Done</strong>
                             <p className="text-slate-700">{story.definitionOfDone || '-'}</p>
                         </div>
                     </div>
                     
                     <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                         <div className="flex items-center gap-1"><LinkIcon size={10}/> {story.needDescription?.substring(0, 30)}...</div>
                         <div className="flex items-center gap-1"><Clock size={10}/> {story.duration}h</div>
                     </div>
                 </div>
             ))}
        </div>
      </div>
    </div>
  );
};
