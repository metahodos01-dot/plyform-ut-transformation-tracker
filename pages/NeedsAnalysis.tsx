
import React, { useState, useEffect } from 'react';
import { Plus, Sparkles, BrainCircuit, Save, Loader2, Bot, Pencil, Trash2, Ban, Hash, Map, ShieldCheck, MessageSquare, AlertTriangle, CheckCircle2, XCircle, Utensils, Ruler, Euro, Factory, UserCog, ArrowRight, ArrowUp, ArrowDown, AlertOctagon, Signal, DownloadCloud, RefreshCw, Target, Clock, Users, Layers } from 'lucide-react';
import { db, NEEDS_COLLECTION, TASKS_COLLECTION, USER_STORIES_COLLECTION, ensureAuth, getProjectSettings, updateLastSaved, formatDateTime } from '../services/firebase';
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { EmergingNeed, TeamMember, NeedStatus, PriorityLevel } from '../types';
import { INITIAL_PLAN } from '../constants';

// DEFINIZIONE DELLE 6 ESIGENZE STRATEGICHE (DEMO DATA)
const STRATEGIC_NEEDS_SEED: Omit<EmergingNeed, 'id'>[] = [
    {
        description: "Istituzione Feedback Loop Bidirezionale UT-Produzione (Lesson Learned)",
        reason: "Attualmente il flusso è unidirezionale (UT->Prod). Manca il ritorno strutturato dal campo ('Lesson Learned'), essenziale per correggere discrepanze tra cicli teorici e realtà operativa e mitigare rischi NADCAP.",
        originator: "Analisi As-Is",
        date: "2025-04-15",
        status: "CONFIRMED",
        priority: "URGENT",
        orderIndex: 6,
        aiAnalysis: {
            impactLevel: "HIGH",
            explanation: "Critico per la conformità. Senza feedback, l'errore umano rimane latente. Priorità assoluta per sicurezza processi.",
            timestamp: new Date().toISOString()
        }
    },
    {
        description: "Riqualificazione Processi per Rinnovo NADCAP (Zero-Error)",
        reason: "Scadenza Luglio 2026. La certificazione non ammette errori umani. Necessario allineare la responsabilità formale (UT) con quella operativa (attualmente Ramponi) per evitare Non Conformità gravi.",
        originator: "Management",
        date: "2025-04-16",
        status: "CONFIRMED",
        priority: "URGENT",
        orderIndex: 5,
        aiAnalysis: {
            impactLevel: "HIGH",
            explanation: "Rischio esistenziale. La perdita della certificazione comprometterebbe l'accesso al mercato Aerospace.",
            timestamp: new Date().toISOString()
        }
    },
    {
        description: "Upgrade Standard Documentali per Certificazione Part 21",
        reason: "Scadenza Ottobre 2026. L'ingresso nel mercato internazionale richiede standard di tracciabilità e robustezza documentale superiori. L'attuale gestione 'compartimenti stagni' è insufficiente.",
        originator: "Strategia 2026",
        date: "2025-04-16",
        status: "CONFIRMED",
        priority: "HIGH",
        orderIndex: 4,
        aiAnalysis: {
            impactLevel: "HIGH",
            explanation: "Abilitatore strategico. Senza Part 21 non si accede alle nuove commesse target.",
            timestamp: new Date().toISOString()
        }
    },
    {
        description: "Reingegnerizzazione Lean e Layout Linea Piaggio",
        reason: "Asset tattico scarsamente presidiato. L'UT deve progettare i cicli considerando il layout fisico (Analogia Architetto/Cucina) per eliminare gli sprechi (Muda) e ottimizzare il flusso logistico.",
        originator: "Operations",
        date: "2025-04-17",
        status: "CONFIRMED",
        priority: "HIGH",
        orderIndex: 3,
        aiAnalysis: {
            impactLevel: "MEDIUM",
            explanation: "Impatto diretto su Efficienza e tempi di attraversamento. Fondamentale per la marginalità operativa.",
            timestamp: new Date().toISOString()
        }
    },
    {
        description: "Integrazione UT-Commerciale per Analisi Marginalità Preventiva",
        reason: "L'UT deve evolvere da centro di costo a motore di profitto. Necessario validare i costi tecnici in fase di preventivazione per garantire la marginalità reale delle commesse prima dell'avvio.",
        originator: "Commerciale",
        date: "2025-04-18",
        status: "CONFIRMED",
        priority: "MEDIUM",
        orderIndex: 2,
        aiAnalysis: {
            impactLevel: "MEDIUM",
            explanation: "Impatto economico diretto. Previene commesse in perdita strutturale.",
            timestamp: new Date().toISOString()
        }
    },
    {
        description: "Adozione Framework Agile e Empowerment del Team",
        reason: "Superamento della logica 'esecutori passivi'. Il team necessita di autonomia decisionale, visibilità sugli obiettivi globali e capacità di gestire le priorità dinamicamente.",
        originator: "HR / Change Mgmt",
        date: "2025-04-18",
        status: "CONFIRMED",
        priority: "MEDIUM",
        orderIndex: 1,
        aiAnalysis: {
            impactLevel: "LOW",
            explanation: "Abilitatore culturale. Necessario per sostenere il cambiamento nel lungo periodo.",
            timestamp: new Date().toISOString()
        }
    }
];

export const NeedsAnalysis: React.FC = () => {
    const [needs, setNeeds] = useState<EmergingNeed[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string | undefined>();

    // Form State
    const [form, setForm] = useState<{
        description: string;
        originator: string;
        date: string;
        reason: string;
        priority: PriorityLevel;
    }>({
        description: '',
        originator: '',
        date: new Date().toISOString().split('T')[0],
        reason: '',
        priority: 'MEDIUM' as PriorityLevel,
        kpiValues: {
            revenue: undefined as number | undefined,
            margin: undefined as number | undefined,
            cashflow: undefined as number | undefined
        }
    });

    // AI Analysis State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiResult, setAiResult] = useState<EmergingNeed['aiAnalysis'] | null>(null);

    useEffect(() => {
        const init = async () => {
            await ensureAuth();
            const settings = await getProjectSettings();
            if (settings?.team) setTeamMembers(settings.team);
            if (settings?.lastUpdated) setLastUpdated(settings.lastUpdated);
            loadNeedsAndSeed();
        };
        init();
    }, []);

    const loadNeedsAndSeed = async () => {
        try {
            setLoading(true);
            const q = query(collection(db, NEEDS_COLLECTION), orderBy('orderIndex', 'desc'));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                console.log("Nessuna esigenza trovata. Caricamento automatico dati strategici...");
                await autoSeedStrategies();
            } else {
                const loadedNeeds = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmergingNeed));
                setNeeds(loadedNeeds);
            }
        } catch (e) {
            console.error("Error loading needs", e);
        } finally {
            setLoading(false);
        }
    };

    const autoSeedStrategies = async () => {
        try {
            const batch = writeBatch(db);
            const newNeedsWithIds: EmergingNeed[] = [];

            STRATEGIC_NEEDS_SEED.forEach(need => {
                const docRef = doc(collection(db, NEEDS_COLLECTION));
                batch.set(docRef, need);
                newNeedsWithIds.push({ ...need, id: docRef.id } as EmergingNeed);
            });

            await batch.commit();
            setNeeds(newNeedsWithIds);
        } catch (e) {
            console.error("Error auto-seeding", e);
        }
    };

    const runCopilotAnalysis = () => {
        if (!form.description) return;
        setIsAnalyzing(true);
        setAiResult(null);

        setTimeout(() => {
            const desc = form.description.toLowerCase();
            const reason = form.reason.toLowerCase();

            let level: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
            let explanation = "Supporto all'ottimizzazione corrente.";

            if (desc.includes('nadcap') || desc.includes('certificazi') || desc.includes('sicurezza') || reason.includes('blocco')) {
                level = 'HIGH';
                explanation = "STRATEGICO: Impatto diretto sulla compliance NADCAP e sicurezza. Priorità massima.";
            } else if (desc.includes('costo') || desc.includes('budget') || desc.includes('tempo') || desc.includes('efficienza')) {
                level = 'MEDIUM';
                explanation = "TATTICO: Impatto su Marginalità o Efficienza (Lean). Da pianificare a breve.";
            }

            setAiResult({
                impactLevel: level,
                explanation: explanation,
                timestamp: new Date().toISOString()
            });
            setIsAnalyzing(false);
        }, 2000);
    };

    const handleSaveNeed = async () => {
        if (!form.description || !form.originator) return;
        setLoading(true);
        try {
            const needData = {
                ...form,
                status: 'PENDING' as NeedStatus,
                aiAnalysis: aiResult,
                // If new, put at top (max orderIndex + 1)
                orderIndex: editingId
                    ? needs.find(n => n.id === editingId)?.orderIndex || 0
                    : (needs.length > 0 ? Math.max(...needs.map(n => n.orderIndex || 0)) + 1 : 1)
            };

            if (editingId) {
                const existing = needs.find(n => n.id === editingId);
                const updatedData = { ...needData, status: existing?.status || 'PENDING' };
                await updateDoc(doc(db, NEEDS_COLLECTION, editingId), updatedData);
                setNeeds(needs.map(n => n.id === editingId ? { ...n, ...updatedData, id: editingId } : n));
            } else {
                const docRef = await addDoc(collection(db, NEEDS_COLLECTION), needData);
                setNeeds([{ ...needData, id: docRef.id } as EmergingNeed, ...needs]);
            }

            const savedTime = await updateLastSaved();
            setLastUpdated(savedTime);
            resetForm();
        } catch (e) {
            console.error("Error saving need", e);
        } finally {
            setLoading(false);
        }
    };

    const handleForceBatchSave = async () => {
        setIsSyncing(true);
        try {
            const batch = writeBatch(db);
            needs.forEach(need => {
                const docRef = doc(db, NEEDS_COLLECTION, need.id);
                batch.update(docRef, {
                    orderIndex: need.orderIndex,
                    priority: need.priority || 'MEDIUM',
                    status: need.status || 'PENDING'
                });
            });
            await batch.commit();
            const savedTime = await updateLastSaved();
            setLastUpdated(savedTime);
            // Small delay to show feedback
            await new Promise(r => setTimeout(r, 500));
            alert("Modifiche salvate e sincronizzate con successo!");
        } catch (e) {
            console.error("Error batch saving", e);
            alert("Errore durante il salvataggio sincronizzato.");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleStatusChange = async (id: string, newStatus: NeedStatus) => {
        try {
            await updateDoc(doc(db, NEEDS_COLLECTION, id), { status: newStatus });
            setNeeds(needs.map(n => n.id === id ? { ...n, status: newStatus } : n));
            updateLastSaved().then(t => setLastUpdated(t));
        } catch (e) {
            console.error("Error updating status", e);
        }
    };

    const handlePriorityChange = async (id: string, newPriority: PriorityLevel) => {
        // Optimistic update
        setNeeds(needs.map(n => n.id === id ? { ...n, priority: newPriority } : n));

        try {
            await updateDoc(doc(db, NEEDS_COLLECTION, id), { priority: newPriority });
            // No explicit lastSaved update here to avoid too many writes, or we can add it if crucial
        } catch (e) {
            console.error("Error updating priority", e);
        }
    };

    const handleMove = async (index: number, direction: 'up' | 'down') => {
        // Create a copy of the needs array
        const newNeeds = [...needs];

        if (direction === 'up') {
            if (index === 0) return; // Already top
            const temp = newNeeds[index].orderIndex;
            newNeeds[index].orderIndex = newNeeds[index - 1].orderIndex;
            newNeeds[index - 1].orderIndex = temp;
            [newNeeds[index], newNeeds[index - 1]] = [newNeeds[index - 1], newNeeds[index]];
        } else {
            if (index === newNeeds.length - 1) return; // Already bottom
            const temp = newNeeds[index].orderIndex;
            newNeeds[index].orderIndex = newNeeds[index + 1].orderIndex;
            newNeeds[index + 1].orderIndex = temp;
            [newNeeds[index], newNeeds[index + 1]] = [newNeeds[index + 1], newNeeds[index]];
        }

        setNeeds(newNeeds);

        // We auto-save the move, but the new batch save button adds confidence
        try {
            const batch = writeBatch(db);
            const idx = direction === 'up' ? index - 1 : index + 1;
            const currentItem = newNeeds[direction === 'up' ? idx : index];
            const swappedItem = newNeeds[direction === 'up' ? index : idx];

            batch.update(doc(db, NEEDS_COLLECTION, currentItem.id), { orderIndex: currentItem.orderIndex });
            batch.update(doc(db, NEEDS_COLLECTION, swappedItem.id), { orderIndex: swappedItem.orderIndex });

            await batch.commit();
        } catch (e) {
            console.error("Error reordering", e);
        }
    };

    const handleEdit = (need: EmergingNeed) => {
        setEditingId(need.id);
        setForm({
            description: need.description,
            originator: need.originator,
            date: need.date,
            reason: need.reason,
            priority: need.priority || 'MEDIUM',
            kpiValues: need.kpiValues || { revenue: undefined, margin: undefined, cashflow: undefined }
        });
        setAiResult(need.aiAnalysis || null);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Rimuovere questa voce dal registro?")) return;
        try {
            await deleteDoc(doc(db, NEEDS_COLLECTION, id));
            setNeeds(needs.filter(n => n.id !== id));
            if (editingId === id) resetForm();
            updateLastSaved().then(t => setLastUpdated(t));
        } catch (e) {
            console.error("Error deleting need", e);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setForm({
            description: '',
            reason: '',
            originator: '',
            date: new Date().toISOString().split('T')[0],
            priority: 'MEDIUM',
            kpiValues: { revenue: undefined, margin: undefined, cashflow: undefined }
        });
        setAiResult(null);
    };

    const confirmedCount = needs.filter(n => n.status === 'CONFIRMED').length;

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'URGENT': return 'bg-red-100 text-red-700 border-red-200';
            case 'HIGH': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'MEDIUM': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'LOW': return 'bg-slate-100 text-slate-700 border-slate-200';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12 h-full flex flex-col">
            <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Analisi Esigenze & Impatto Sistemico</h2>
                    <p className="text-slate-500 mt-1">Gestione Priorità e Conferma per l'integrazione.</p>
                </div>

                {confirmedCount > 0 && (
                    <div className="bg-indigo-50 border border-indigo-200 px-4 py-2 rounded-lg flex items-center gap-3">
                        <span className="text-sm font-bold text-indigo-800">{confirmedCount} esigenze confermate</span>
                        <span className="text-slate-400">→</span>
                        <span className="text-xs text-indigo-600">Vai a <strong>User Stories</strong> per definire i dettagli.</span>
                    </div>
                )}
            </div>

            {/* NEW SECTION: Emerging Needs Register - ENLARGED */}
            <div className="bg-slate-900 rounded-2xl p-1 shadow-xl overflow-hidden flex-1 flex flex-col">
                <div className="bg-slate-900 p-6 sm:p-8 flex-1 flex flex-col">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 text-white gap-4">
                        <div className="flex items-center gap-3">
                            <BrainCircuit className="text-purple-400 w-8 h-8" />
                            <div>
                                <h3 className="text-2xl font-bold">Backlog Esigenze & Priorità</h3>
                                <p className="text-slate-400 text-sm">Inserisci, ordina e conferma le esigenze per l'esecuzione.</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                <Clock size={10} /> Aggiornato: {formatDateTime(lastUpdated)}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleForceBatchSave}
                                    disabled={isSyncing || loading}
                                    className="flex items-center gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded-full text-white transition-colors border border-emerald-500 shadow-lg font-bold"
                                >
                                    {isSyncing ? <Loader2 size={12} className="animate-spin" /> : <Save size={14} />}
                                    Salva & Aggiorna
                                </button>

                                {editingId && (
                                    <button
                                        onClick={resetForm}
                                        className="flex items-center gap-2 text-xs bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-full text-slate-300 transition-colors"
                                    >
                                        <Ban size={12} /> Annulla Modifica
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
                        {/* Form Column */}
                        <div className={`lg:col-span-5 space-y-4 p-6 rounded-xl border transition-all h-fit ${editingId ? 'bg-purple-900/20 border-purple-500/50' : 'bg-slate-800/50 border-slate-700'
                            }`}>
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                                    {editingId ? <><Pencil size={14} className="text-purple-400" /> Modifica Voce</> : <><Plus size={14} className="text-emerald-400" /> Nuova Esigenza</>}
                                </h4>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Proponente (Originator)</label>
                                <select
                                    value={form.originator}
                                    onChange={(e) => setForm({ ...form, originator: e.target.value })}
                                    className="w-full bg-slate-900 border-slate-700 text-white rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                >
                                    <option value="">Seleziona membro...</option>
                                    {teamMembers.map(m => (
                                        <option key={m.id} value={m.name}>{m.name} ({m.role})</option>
                                    ))}
                                    <option value="Analisi As-Is">Analisi As-Is</option>
                                    <option value="Management">Management</option>
                                    <option value="Operations">Operations</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Data</label>
                                    <input
                                        type="date"
                                        value={form.date}
                                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                                        className="w-full bg-slate-900 border-slate-700 text-white rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Priorità Iniziale</label>
                                    <select
                                        value={form.priority}
                                        onChange={(e) => setForm({ ...form, priority: e.target.value as PriorityLevel })}
                                        className="w-full bg-slate-900 border-slate-700 text-white rounded-lg focus:ring-purple-500 focus:border-purple-500 font-bold"
                                    >
                                        <option value="URGENT" className="text-red-400">URGENTE (Critico)</option>
                                        <option value="HIGH" className="text-orange-400">ALTA (Importante)</option>
                                        <option value="MEDIUM" className="text-blue-400">MEDIA (Standard)</option>
                                        <option value="LOW" className="text-slate-400">BASSA (Nice to have)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Descrizione Esigenza</label>
                                <textarea
                                    rows={3}
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Es. Feedback su Linea Piaggio..."
                                    className="w-full bg-slate-900 border-slate-700 text-white rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 block">Motivazione (Why)</label>
                                <textarea
                                    rows={2}
                                    value={form.reason}
                                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                                    placeholder="Perché è importante?"
                                    className="w-full bg-slate-900 border-slate-700 text-white rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                />
                            </div>

                            {/* KPI FINANCIAL MEASURES */}
                            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block flex items-center gap-2">
                                    <Euro size={12} /> Impatto Finanziario (Opzionale)
                                </label>
                                <div className="grid grid-cols-1 gap-3">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={form.kpiValues.revenue !== undefined}
                                            onChange={(e) => setForm({ ...form, kpiValues: { ...form.kpiValues, revenue: e.target.checked ? 0 : undefined } })}
                                            className="rounded border-slate-600 bg-slate-900 text-purple-600 focus:ring-purple-500"
                                        />
                                        <span className="text-sm text-slate-300 w-24">Fatturato</span>
                                        {form.kpiValues.revenue !== undefined && (
                                            <input
                                                type="number"
                                                value={form.kpiValues.revenue}
                                                onChange={(e) => setForm({ ...form, kpiValues: { ...form.kpiValues, revenue: Number(e.target.value) } })}
                                                placeholder="€"
                                                className="flex-1 bg-slate-900 border-slate-700 text-white text-xs rounded py-1 px-2"
                                            />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={form.kpiValues.margin !== undefined}
                                            onChange={(e) => setForm({ ...form, kpiValues: { ...form.kpiValues, margin: e.target.checked ? 0 : undefined } })}
                                            className="rounded border-slate-600 bg-slate-900 text-purple-600 focus:ring-purple-500"
                                        />
                                        <span className="text-sm text-slate-300 w-24">Margine Op.</span>
                                        {form.kpiValues.margin !== undefined && (
                                            <input
                                                type="number"
                                                value={form.kpiValues.margin}
                                                onChange={(e) => setForm({ ...form, kpiValues: { ...form.kpiValues, margin: Number(e.target.value) } })}
                                                placeholder="%"
                                                className="flex-1 bg-slate-900 border-slate-700 text-white text-xs rounded py-1 px-2"
                                            />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={form.kpiValues.cashflow !== undefined}
                                            onChange={(e) => setForm({ ...form, kpiValues: { ...form.kpiValues, cashflow: e.target.checked ? 0 : undefined } })}
                                            className="rounded border-slate-600 bg-slate-900 text-purple-600 focus:ring-purple-500"
                                        />
                                        <span className="text-sm text-slate-300 w-24">Cashflow</span>
                                        {form.kpiValues.cashflow !== undefined && (
                                            <input
                                                type="number"
                                                value={form.kpiValues.cashflow}
                                                onChange={(e) => setForm({ ...form, kpiValues: { ...form.kpiValues, cashflow: Number(e.target.value) } })}
                                                placeholder="€"
                                                className="flex-1 bg-slate-900 border-slate-700 text-white text-xs rounded py-1 px-2"
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    onClick={runCopilotAnalysis}
                                    disabled={isAnalyzing || !form.description}
                                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                >
                                    {isAnalyzing ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                                    {editingId ? "Rivaluta Impact" : "Analizza Impact"}
                                </button>
                            </div>

                            {/* AI Result Card */}
                            {aiResult && (
                                <div className="bg-slate-900 border border-purple-500/30 rounded-lg p-4 animate-in fade-in slide-in-from-bottom-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Bot className="text-purple-400" size={18} />
                                        <span className="text-purple-200 font-bold text-sm">Plyform AI Analysis</span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-slate-400 text-xs uppercase">Livello Impatto:</span>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${aiResult.impactLevel === 'HIGH' ? 'bg-emerald-500/20 text-emerald-400' :
                                            aiResult.impactLevel === 'MEDIUM' ? 'bg-blue-500/20 text-blue-400' :
                                                'bg-slate-500/20 text-slate-400'
                                            }`}>
                                            {aiResult.impactLevel}
                                        </span>
                                    </div>
                                    <p className="text-slate-300 text-sm italic border-l-2 border-purple-500 pl-3">
                                        "{aiResult.explanation}"
                                    </p>
                                    <button
                                        onClick={handleSaveNeed}
                                        disabled={loading}
                                        className="mt-4 w-full bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2"
                                    >
                                        <Save size={14} /> {editingId ? "Aggiorna Voce" : "Salva nel Registro"}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* List Column */}
                        <div className="lg:col-span-7 bg-white rounded-xl overflow-hidden flex flex-col h-[calc(100vh-240px)] min-h-[600px]">
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                                <h4 className="font-bold text-slate-800">Storico & Priorità</h4>
                                <span className="text-xs text-slate-500 bg-white border px-2 py-1 rounded">
                                    Ordina usando le frecce <ArrowUp size={10} className="inline" /> <ArrowDown size={10} className="inline" />
                                </span>
                            </div>
                            <div className="overflow-y-auto p-4 space-y-3 flex-1">
                                {loading && needs.length === 0 && (
                                    <div className="flex items-center justify-center h-full text-slate-400">
                                        <Loader2 className="animate-spin mr-2" /> Caricamento esigenze strategiche...
                                    </div>
                                )}
                                {!loading && needs.length === 0 && (
                                    <div className="text-center py-12 text-slate-400">
                                        <Sparkles className="mx-auto h-12 w-12 text-slate-200 mb-3" />
                                        <p className="mb-4">Nessuna voce registrata.</p>
                                    </div>
                                )}
                                {needs.map((need, index) => {
                                    const isPending = need.status === 'PENDING' || !need.status;
                                    const isConfirmed = need.status === 'CONFIRMED';
                                    const isIntegrated = need.status === 'INTEGRATED';
                                    const isRejected = need.status === 'REJECTED';

                                    return (
                                        <div key={need.id} className={`bg-white border rounded-lg p-0 hover:shadow-lg transition-all group flex flex-col sm:flex-row overflow-hidden ${editingId === need.id ? 'border-purple-500 ring-1 ring-purple-500 bg-purple-50' : 'border-slate-200'
                                            } ${isIntegrated ? 'opacity-75 bg-slate-50' : ''}`}>

                                            {/* Left Sidebar: Priority & Move Controls */}
                                            <div className="w-full sm:w-12 bg-slate-50 border-b sm:border-b-0 sm:border-r border-slate-100 flex sm:flex-col items-center justify-center gap-2 p-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleMove(index, 'up'); }}
                                                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded disabled:opacity-30"
                                                    disabled={index === 0}
                                                    title="Sposta Su (Aumenta Priorità)"
                                                >
                                                    <ArrowUp size={16} />
                                                </button>
                                                <span className="text-xs font-bold text-slate-400">{index + 1}</span>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleMove(index, 'down'); }}
                                                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded disabled:opacity-30"
                                                    disabled={index === needs.length - 1}
                                                    title="Sposta Giù (Diminuisci Priorità)"
                                                >
                                                    <ArrowDown size={16} />
                                                </button>
                                            </div>

                                            {/* Main Content */}
                                            <div className="flex-1 p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                                        {/* PRIORITY SELECTOR */}
                                                        <select
                                                            value={need.priority || 'MEDIUM'}
                                                            onChange={(e) => handlePriorityChange(need.id, e.target.value as PriorityLevel)}
                                                            className={`text-[10px] font-bold px-2 py-1 rounded border uppercase cursor-pointer focus:ring-2 focus:ring-blue-500 outline-none ${getPriorityColor(need.priority || 'MEDIUM')}`}
                                                        >
                                                            <option value="URGENT">URGENTE</option>
                                                            <option value="HIGH">ALTA</option>
                                                            <option value="MEDIUM">MEDIA</option>
                                                            <option value="LOW">BASSA</option>
                                                        </select>

                                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                                            <span>{need.date}</span>
                                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                            <span className="font-semibold text-blue-600">{need.originator}</span>
                                                        </div>

                                                        {/* KPI Badges */}
                                                        <div className="flex items-center gap-2">
                                                            {need.kpiValues?.revenue !== undefined && (
                                                                <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100">
                                                                    € {need.kpiValues.revenue.toLocaleString()} Rev
                                                                </span>
                                                            )}
                                                            {need.kpiValues?.margin !== undefined && (
                                                                <span className="text-[9px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100">
                                                                    {need.kpiValues.margin}% Mar
                                                                </span>
                                                            )}
                                                            {need.kpiValues?.cashflow !== undefined && (
                                                                <span className="text-[9px] font-bold bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-100">
                                                                    € {need.kpiValues.cashflow.toLocaleString()} CF
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-1">
                                                        <button onClick={() => handleEdit(need)} className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded-md"><Pencil size={14} /></button>
                                                        <button onClick={() => handleDelete(need.id)} className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-red-600 rounded-md"><Trash2 size={14} /></button>
                                                    </div>
                                                </div>

                                                <h5 className="font-bold text-slate-800 mb-1 leading-snug">{need.description}</h5>
                                                <p className="text-xs text-slate-500 mb-3">{need.reason}</p>

                                                {/* Status Bar & Actions */}
                                                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Stato:</span>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${isConfirmed ? 'bg-blue-100 text-blue-700' :
                                                            isIntegrated ? 'bg-emerald-100 text-emerald-700' :
                                                                isRejected ? 'bg-red-100 text-red-700' :
                                                                    'bg-slate-100 text-slate-600'
                                                            }`}>
                                                            {isConfirmed && "CONFERMATA"}
                                                            {isIntegrated && "PIANIFICATA"}
                                                            {isRejected && "SCARTATA"}
                                                            {isPending && "DA VALUTARE"}
                                                        </span>
                                                    </div>

                                                    {/* CONFIRMATION ACTIONS */}
                                                    {isPending && (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleStatusChange(need.id, 'REJECTED')}
                                                                className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                                                                title="Scarta"
                                                            >
                                                                <XCircle size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleStatusChange(need.id, 'CONFIRMED')}
                                                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded shadow-sm flex items-center gap-1 transition-colors"
                                                            >
                                                                <CheckCircle2 size={14} /> Conferma
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
