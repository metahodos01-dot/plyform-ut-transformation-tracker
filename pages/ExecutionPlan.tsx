
import React, { useState, useEffect } from 'react';
import { db, USER_STORIES_COLLECTION, NEEDS_COLLECTION, updateLastSaved, formatDateTime } from '../services/firebase';
import { collection, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { UserStory, EmergingNeed, StoryStatus } from '../types';
import { Loader2, CalendarCheck, Lock, Unlock, ArrowRight, LayoutGrid, Save } from 'lucide-react';

export const ExecutionPlan: React.FC = () => {
    const [stories, setStories] = useState<UserStory[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string | undefined>();
    const [needsMap, setNeedsMap] = useState<Record<string, string>>({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            // Load Stories
            const storiesSnap = await getDocs(collection(db, USER_STORIES_COLLECTION));
            const loadedStories = storiesSnap.docs.map(d => ({ id: d.id, ...d.data() } as UserStory));
            setStories(loadedStories);

            // Load Needs for context (descriptions)
            const needsSnap = await getDocs(collection(db, NEEDS_COLLECTION));
            const map: Record<string, string> = {};
            needsSnap.docs.forEach(d => {
                const data = d.data();
                map[d.id] = data.description;
            });
            setNeedsMap(map);
        } catch (e) {
            console.error("Error loading data", e);
        } finally {
            setLoading(false);
        }
    };

    const handleAssignSprint = async (storyId: string, sprintIndex: number | undefined) => {
        // Optimistic Update
        const updatedStories = stories.map(s =>
            s.id === storyId ? { ...s, sprintIndex } : s
        );
        setStories(updatedStories);

        try {
            const updatePayload = sprintIndex !== undefined ? { sprintIndex } : { sprintIndex: null }; // Firestore deletes field if null usually, or we can use deleteField() but null is fine for now if handled. Actually better undefined to remove.
            // Firestore treats undefined as "ignore", null as "set to null".
            // Let's use value or delete.
            const ref = doc(db, USER_STORIES_COLLECTION, storyId);
            // If undefined, we can't send it in update() directly to remove.
            // We'll send null for "Backlog".
            await updateDoc(ref, { sprintIndex: sprintIndex === undefined ? null : sprintIndex });
            await updateLastSaved();
        } catch (e) {
            console.error("Error assigning sprint", e);
            // Revert on error would be ideal, but simple log for now.
        }
    };

    // Filter Stories
    const getStoriesForSlot = (index: number) => stories.filter(s => s.sprintIndex === index);
    const getBacklogStories = () => stories.filter(s => s.sprintIndex === undefined || s.sprintIndex === null);

    // Sprint Slots (0-9)
    const sprints = Array.from({ length: 10 }, (_, i) => i);

    return (
        <div className="space-y-6 animate-fade-in pb-12 h-screen flex flex-col bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <CalendarCheck className="text-blue-600" />
                        Pianificazione Sprint (10 Slot)
                    </h2>
                    <p className="text-slate-500 text-sm">Organizza le User Story nei container temporali. I primi 2 slot sono storici (chiusi).</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-400">
                        {stories.length} User Stories Totali
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-6 p-6">

                {/* LEFT: BACKLOG (Unassigned) */}
                <div className="lg:w-1/4 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden shrink-0">
                    <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <LayoutGrid size={16} /> Backlog
                        </h3>
                        <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">
                            {getBacklogStories().length}
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                        {loading && <div className="text-center p-4"><Loader2 className="animate-spin mx-auto text-slate-400" /></div>}

                        {getBacklogStories().map(story => (
                            <div key={story.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-blue-300 transition-colors group">
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-[10px] font-bold px-1.5 rounded uppercase ${story.status === 'CLOSED' ? 'bg-slate-800 text-white' : 'bg-blue-100 text-blue-800'
                                        }`}>
                                        {story.status === 'CLOSED' ? 'CHIUSA' : story.status}
                                    </span>
                                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1 rounded">
                                        {story.complexity}
                                    </span>
                                </div>
                                <p className="text-sm font-medium text-slate-800 leading-snug mb-2">
                                    {story.action}
                                </p>
                                <div className="text-[10px] text-slate-400 mb-3 line-clamp-1">
                                    {needsMap[story.needId] || 'Esigenza sconosciuta'}
                                </div>

                                {/* Sprint Selector */}
                                <select
                                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                    onChange={(e) => handleAssignSprint(story.id, Number(e.target.value))}
                                    value=""
                                >
                                    <option value="" disabled>Assegna a Sprint...</option>
                                    {sprints.map(idx => (
                                        <option key={idx} value={idx}>
                                            {idx < 2 ? `Sprint ${idx + 1} (Chiuso)` : `Sprint ${idx + 1}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ))}
                        {getBacklogStories().length === 0 && !loading && (
                            <div className="text-center text-xs text-slate-400 italic py-8">
                                Nessuna storia nel backlog.
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: SPRINT BOARD (10 Slots) */}
                <div className="flex-1 overflow-x-auto">
                    <div className="grid grid-cols-5 gap-4 min-w-[1000px] pb-4">
                        {sprints.map(i => {
                            const isPast = i < 2;
                            const slotStories = getStoriesForSlot(i);
                            const totalDuration = slotStories.reduce((acc, s) => acc + (s.duration || 0), 0);

                            return (
                                <div key={i} className={`rounded-xl border flex flex-col h-[600px] overflow-hidden ${isPast ? 'bg-slate-100 border-slate-300 opacity-75' : 'bg-white border-slate-200 shadow-sm'
                                    }`}>
                                    {/* Slot Header */}
                                    <div className={`px-3 py-2 border-b flex justify-between items-center ${isPast ? 'bg-slate-200 border-slate-300' : 'bg-indigo-50 border-indigo-100'
                                        }`}>
                                        <div className="flex items-center gap-2">
                                            {isPast ? <Lock size={14} className="text-slate-500" /> : <Unlock size={14} className="text-indigo-400" />}
                                            <span className={`font-bold text-sm ${isPast ? 'text-slate-600' : 'text-indigo-900'}`}>
                                                Sprint {i + 1}
                                            </span>
                                        </div>
                                        <span className="text-[10px] bg-white px-1.5 rounded border border-slate-200 font-mono">
                                            {slotStories.length} items
                                        </span>
                                    </div>

                                    {/* Stats line */}
                                    <div className="px-3 py-1 bg-slate-50/50 text-[10px] text-slate-500 flex justify-between border-b border-slate-100">
                                        <span>Stima: {totalDuration}h</span>
                                        {isPast && <span>Completato</span>}
                                    </div>

                                    {/* Stories List */}
                                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                        {slotStories.map(story => (
                                            <div key={story.id} className="bg-white p-2 rounded border border-slate-100 shadow-sm text-xs relative group">
                                                <div className="font-medium text-slate-800 mb-1">{story.action}</div>
                                                <div className="flex justify-between items-center text-[10px] text-slate-400">
                                                    <span>{story.complexity} • {story.duration}h</span>
                                                    {story.status === 'CLOSED' && <span className="text-emerald-600 font-bold">✓</span>}
                                                </div>

                                                {/* Move Action (Hover) */}
                                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-sm border rounded">
                                                    <select
                                                        className="text-[10px] p-1 outline-none cursor-pointer bg-transparent"
                                                        value={i}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            if (val === 'backlog') handleAssignSprint(story.id, undefined);
                                                            else handleAssignSprint(story.id, Number(val));
                                                        }}
                                                    >
                                                        <option value="backlog">Backlog</option>
                                                        {sprints.map(idx => (
                                                            <option key={idx} value={idx}>Sprint {idx + 1}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
};
