import { useState } from 'react';
import { ChevronDown, ChevronRight, Play, Pause } from 'lucide-react';
import { MUSIC_CATEGORIES } from '../types';
import { useAppStore } from '../store';


export const MusicView = () => {
    const { currentFrame, activeMusic, isPlayingMusic, playMusic, pauseMusic, tracks } = useAppStore();
    const [expandedCategory, setExpandedCategory] = useState<string | null>('Acción');

    // Filter tracks by Frame (Current + Global) and Type 'music'
    const availableTracks = tracks.filter(t =>
        t.type === 'music' && (!t.frame || t.frame === currentFrame)
    );

    const toggleCategory = (cat: string) => {
        setExpandedCategory(expandedCategory === cat ? null : cat);
    };

    return (
        <div className="space-y-2">
            {Object.entries(MUSIC_CATEGORIES).map(([category, subcategories]) => (
                <div key={category} className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/50">
                    <button
                        onClick={() => toggleCategory(category)}
                        className="w-full px-3 py-2 flex items-center justify-between bg-slate-800/80 hover:bg-slate-800 transition-colors text-left"
                    >
                        <span className="font-bold text-slate-200 text-sm">{category}</span>
                        {expandedCategory === category ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>

                    {expandedCategory === category && (
                        <div className="p-2 space-y-4 bg-slate-950/50">
                            {subcategories.map(sub => {
                                const tracksInSub = availableTracks.filter(t => t.category === category && t.subcategory === sub);

                                return (
                                    <div key={sub} className="space-y-1">
                                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">{sub}</h4>
                                        {tracksInSub.length === 0 ? (
                                            <div className="px-2 text-xs text-slate-600 italic">No hay pistas</div>
                                        ) : (
                                            <div className="space-y-1">
                                                {tracksInSub.map(track => {
                                                    const isCurrent = activeMusic?.id === track.id;
                                                    return (
                                                        <div
                                                            key={track.id}
                                                            className={`group flex items-center gap-3 p-2 rounded cursor-pointer transition-all ${isCurrent ? 'bg-amber-900/20 border border-amber-900/50' : 'hover:bg-slate-800 border border-transparent'}`}
                                                            onClick={() => isCurrent && isPlayingMusic ? pauseMusic() : playMusic(track)}
                                                        >
                                                            <div className={`w-8 h-8 rounded flex items-center justify-center ${isCurrent ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200'}`}>
                                                                {isCurrent && isPlayingMusic ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className={`text-sm font-medium truncate ${isCurrent ? 'text-amber-500' : 'text-slate-300'}`}>{track.name}</div>
                                                                {!track.frame && <div className="text-[10px] text-cyan-500">Global</div>}
                                                            </div>
                                                            <div className="text-xs text-slate-600">3:45</div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
