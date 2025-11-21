import { useState } from 'react';
import { Zap, ChevronDown, ChevronRight } from 'lucide-react';
import { SFX_CATEGORIES } from '../types';
import { useAppStore } from '../store';


export const SFXView = () => {
    const { currentFrame, playSFX, tracks } = useAppStore();
    const [expandedCategories, setExpandedCategories] = useState<string[]>(['Combate', 'Magia']);

    // Filter available SFX tracks by Frame
    const availableSFX = tracks.filter(t =>
        t.type === 'sfx' && (!t.frame || t.frame === currentFrame)
    );

    const toggleCategory = (cat: string) => {
        setExpandedCategories(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    };

    return (
        <div className="space-y-4">
            {SFX_CATEGORIES.map(category => {
                const tracksInCategory = availableSFX.filter(t => t.category === category);

                return (
                    <div key={category} className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/50">
                        <button
                            onClick={() => toggleCategory(category)}
                            className="w-full px-3 py-2 flex items-center justify-between bg-slate-800/80 hover:bg-slate-800 transition-colors text-left"
                        >
                            <span className="font-bold text-slate-200 flex items-center gap-2 text-sm">
                                <Zap size={14} className="text-amber-500" />
                                {category}
                            </span>
                            {expandedCategories.includes(category) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>

                        {expandedCategories.includes(category) && (
                            <div className="p-2 bg-slate-950/50">
                                {tracksInCategory.length === 0 ? (
                                    <div className="text-xs text-slate-600 italic">No hay efectos disponibles.</div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-1">
                                        {tracksInCategory.map(track => (
                                            <button
                                                key={track.id}
                                                onClick={() => playSFX(track)}
                                                className="p-2 bg-slate-800 hover:bg-amber-900/30 border border-slate-700 hover:border-amber-500/50 rounded flex flex-col items-center gap-1 transition-all active:scale-95"
                                            >
                                                <Zap size={16} className="text-slate-400 group-hover:text-amber-500" />
                                                <span className="text-[10px] font-medium text-slate-300 text-center truncate w-full">{track.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
