import { useState } from 'react';
import { ChevronDown, ChevronRight, Play, Pause, Repeat, ArrowRight, Shuffle, ArrowUp, ArrowDown } from 'lucide-react';
import { MUSIC_CATEGORIES } from '../types';
import { useAppStore } from '../store';

export const MusicView = () => {
    const { 
        currentFrame, activeMusic, isPlayingMusic, playMusic, pauseMusic, 
        tracks, playlistOrders, reorderPlaylist, 
        playbackMode, setPlaybackMode 
    } = useAppStore();
    
    const [expandedCategory, setExpandedCategory] = useState<string | null>('Acción');

    const availableTracks = tracks.filter(t =>
        t.type === 'music' && (!t.frame || t.frame === currentFrame)
    );

    // Función para mover canciones
    const moveTrack = (e: React.MouseEvent, list: typeof tracks, index: number, direction: 'up' | 'down', categoryKey: string) => {
        e.stopPropagation();
        const newList = [...list];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newList.length) return;
        
        // Swap
        [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
        reorderPlaylist(categoryKey, newList);
    };

    const toggleCategory = (cat: string) => {
        setExpandedCategory(expandedCategory === cat ? null : cat);
    };

    return (
        <div className="space-y-2 pb-10">
            {/* Global Controls */}
            <div className="flex justify-center gap-4 bg-slate-900 p-2 rounded mb-4 border border-slate-800">
                <button 
                    onClick={() => setPlaybackMode('loop')}
                    className={`p-2 rounded ${playbackMode === 'loop' ? 'text-amber-500 bg-amber-900/20' : 'text-slate-500 hover:bg-slate-800'}`}
                    title="Bucle (1 canción)"
                >
                    <Repeat size={18} />
                </button>
                <button 
                    onClick={() => setPlaybackMode('sequential')}
                    className={`p-2 rounded ${playbackMode === 'sequential' ? 'text-cyan-500 bg-cyan-900/20' : 'text-slate-500 hover:bg-slate-800'}`}
                    title="Secuencial (Lista)"
                >
                    <ArrowRight size={18} />
                </button>
                <button 
                    onClick={() => setPlaybackMode('shuffle')}
                    className={`p-2 rounded ${playbackMode === 'shuffle' ? 'text-purple-500 bg-purple-900/20' : 'text-slate-500 hover:bg-slate-800'}`}
                    title="Aleatorio"
                >
                    <Shuffle size={18} />
                </button>
            </div>

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
                                // Filtrar pistas
                                let tracksInSub = availableTracks.filter(t => t.category === category && t.subcategory === sub);
                                
                                // Clave única para el orden: Frame.Categoria.Subcategoria
                                const orderKey = `${currentFrame}.${category}.${sub}`;
                                const savedOrder = playlistOrders[orderKey];

                                // Ordenar si existe orden guardado
                                if (savedOrder) {
                                    tracksInSub.sort((a, b) => {
                                        const idxA = savedOrder.indexOf(a.id);
                                        const idxB = savedOrder.indexOf(b.id);
                                        // Si no está en la lista guardada (nuevo), al final
                                        if (idxA === -1) return 1;
                                        if (idxB === -1) return -1;
                                        return idxA - idxB;
                                    });
                                }

                                return (
                                    <div key={sub} className="space-y-1">
                                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 border-b border-slate-800/50 pb-1 mb-2">{sub}</h4>
                                        {tracksInSub.length === 0 ? (
                                            <div className="px-2 text-xs text-slate-600 italic">No hay pistas</div>
                                        ) : (
                                            <div className="space-y-1">
                                                {tracksInSub.map((track, index) => {
                                                    const isCurrent = activeMusic?.id === track.id;
                                                    return (
                                                        <div
                                                            key={track.id}
                                                            className={`group flex items-center gap-3 p-2 rounded cursor-pointer transition-all ${isCurrent ? 'bg-amber-900/20 border border-amber-900/50' : 'hover:bg-slate-800 border border-transparent'}`}
                                                            onClick={() => isCurrent && isPlayingMusic ? pauseMusic() : playMusic(track, tracksInSub)}
                                                        >
                                                            <div className={`w-8 h-8 rounded flex items-center justify-center ${isCurrent ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200'}`}>
                                                                {isCurrent && isPlayingMusic ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className={`text-sm font-medium truncate ${isCurrent ? 'text-amber-500' : 'text-slate-300'}`}>{track.name}</div>
                                                                {!track.frame && <div className="text-[10px] text-cyan-500">Global</div>}
                                                            </div>
                                                            
                                                            {/* Controles de Reordenamiento (Solo visibles al pasar mouse) */}
                                                            <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button 
                                                                    onClick={(e) => moveTrack(e, tracksInSub, index, 'up', orderKey)}
                                                                    className="text-slate-600 hover:text-white disabled:opacity-0"
                                                                    disabled={index === 0}
                                                                >
                                                                    <ArrowUp size={12} />
                                                                </button>
                                                                <button 
                                                                    onClick={(e) => moveTrack(e, tracksInSub, index, 'down', orderKey)}
                                                                    className="text-slate-600 hover:text-white disabled:opacity-0"
                                                                    disabled={index === tracksInSub.length - 1}
                                                                >
                                                                    <ArrowDown size={12} />
                                                                </button>
                                                            </div>
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