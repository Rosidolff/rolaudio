import { useState } from 'react';
import { Zap, ChevronDown, ChevronRight, Square } from 'lucide-react';
import { SFX_CATEGORIES } from '../types';
import { useAppStore } from '../store';

export const SFXView = () => {
    const { currentFrame, toggleSFX, activeSFXIds, tracks } = useAppStore();
    
    // Estado para categorías expandidas (por defecto algunas abiertas)
    const [expandedCategories, setExpandedCategories] = useState<string[]>(['Combate', 'Magia']);

    // Filtrar pistas SFX por Frame actual + Globales
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
                        {/* Cabecera de Categoría */}
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

                        {/* Contenido de Categoría */}
                        {expandedCategories.includes(category) && (
                            <div className="p-2 bg-slate-950/50">
                                {tracksInCategory.length === 0 ? (
                                    <div className="text-xs text-slate-600 italic px-2">No hay efectos disponibles.</div>
                                ) : (
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                        {tracksInCategory.map(track => {
                                            const isActive = activeSFXIds.includes(track.id);
                                            
                                            return (
                                                <button
                                                    key={track.id}
                                                    onClick={() => toggleSFX(track)}
                                                    className={`
                                                        relative p-2 rounded flex flex-col items-center gap-2 transition-all active:scale-95 border
                                                        ${isActive 
                                                            ? 'bg-amber-900/20 border-amber-500/50 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.1)]' 
                                                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750 hover:border-slate-600 hover:text-slate-200'}
                                                    `}
                                                >
                                                    {isActive ? (
                                                        <Square size={20} fill="currentColor" className="animate-pulse" />
                                                    ) : (
                                                        <Zap size={20} />
                                                    )}
                                                    
                                                    <span className="text-[10px] font-medium text-center truncate w-full leading-tight">
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