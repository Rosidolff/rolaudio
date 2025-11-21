import { useState } from 'react';
import { Zap, ChevronDown, ChevronRight } from 'lucide-react';
import { SFX_CATEGORIES } from '../types';
import { useAppStore } from '../store';

export const SFXView = () => {
    const { currentFrame, toggleSFX, activeSFXIds, tracks } = useAppStore();
    
    const [expandedCategories, setExpandedCategories] = useState<string[]>(['Combate', 'Magia']);

    const availableSFX = tracks.filter(t =>
        t.type === 'sfx' && (!t.frame || t.frame === currentFrame)
    );

    const toggleCategory = (cat: string) => {
        setExpandedCategories(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    };

    return (
        <div className="space-y-4 pb-10">
            {SFX_CATEGORIES.map(category => {
                const tracksInCategory = availableSFX.filter(t => t.category === category);

                return (
                    <div key={category} className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/50">
                        {/* Cabecera */}
                        <button
                            onClick={() => toggleCategory(category)}
                            className="w-full px-3 py-2 flex items-center justify-between bg-slate-800/80 hover:bg-slate-800 transition-colors text-left"
                        >
                            <span className="font-bold text-slate-200 flex items-center gap-2 text-xs uppercase tracking-wider">
                                {category}
                            </span>
                            {expandedCategories.includes(category) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>

                        {/* Grid de botones SFX */}
                        {expandedCategories.includes(category) && (
                            <div className="p-2 bg-slate-950/50">
                                {tracksInCategory.length === 0 ? (
                                    <div className="text-xs text-slate-600 italic px-2">Vacío.</div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-2">
                                        {tracksInCategory.map(track => {
                                            const isActive = activeSFXIds.includes(track.id);
                                            
                                            return (
                                                <button
                                                    key={track.id}
                                                    onClick={() => toggleSFX(track)}
                                                    className={`
                                                        relative h-20 p-2 rounded-md flex items-center justify-center transition-all active:scale-95 border overflow-hidden
                                                        ${isActive 
                                                            ? 'bg-amber-600 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                                                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750 hover:border-slate-600 hover:text-white'}
                                                    `}
                                                >
                                                    {/* Indicador de estado (borde brillante o fondo) */}
                                                    {isActive && (
                                                        <div className="absolute inset-0 bg-white/10 animate-pulse" />
                                                    )}

                                                    {/* Texto GRANDE y centrado */}
                                                    <span className="text-sm font-black leading-tight text-center break-words w-full z-10 drop-shadow-md uppercase">
                                                        {track.name}
                                                    </span>
                                                </button>
                                            );
                                        })}
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