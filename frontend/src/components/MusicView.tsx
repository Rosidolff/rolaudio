import { useState } from 'react';
import { ChevronDown, ChevronRight, Play, Pause, Repeat, ArrowRight, Shuffle, GripVertical } from 'lucide-react';
import { MUSIC_CATEGORIES } from '../types';
import { useAppStore } from '../store';
import type { Track } from '../types';
import { TrackContextMenu } from './TrackContextMenu';

export const MusicView = () => {
    const { 
        currentFrame, activeMusic, isPlayingMusic, playMusic, pauseMusic, 
        tracks, playlistOrders, reorderPlaylist, moveTrackFile,
        playbackMode, setPlaybackMode 
    } = useAppStore();
    
    const [expandedCategory, setExpandedCategory] = useState<string | null>('Acción');
    const [contextMenu, setContextMenu] = useState<{x: number, y: number, track: Track} | null>(null);
    
    const [draggedTrack, setDraggedTrack] = useState<Track | null>(null);
    const [dragOverTarget, setDragOverTarget] = useState<{cat: string, sub: string, index?: number} | null>(null);

    const availableTracks = tracks.filter(t =>
        t.type === 'music' && (!t.frame || t.frame === currentFrame)
    );

    const toggleCategory = (cat: string) => {
        setExpandedCategory(expandedCategory === cat ? null : cat);
    };

    const handleContextMenu = (e: React.MouseEvent, track: Track) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, track });
    };

    const handleDragStart = (e: React.DragEvent, track: Track) => {
        setDraggedTrack(track);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent, cat: string, sub: string, index?: number) => {
        e.preventDefault();
        if (!draggedTrack) return;
        setDragOverTarget({ cat, sub, index });
    };

    const handleDrop = async (e: React.DragEvent, targetCat: string, targetSub: string, targetIndex?: number) => {
        e.preventDefault();
        setDragOverTarget(null);
        if (!draggedTrack) return;

        const sourceCat = draggedTrack.category;
        const sourceSub = draggedTrack.subcategory;

        // CASO 1: Mover archivo a otra lista (SIN CONFIRMACIÓN)
        if (sourceCat !== targetCat || sourceSub !== targetSub) {
            await moveTrackFile(draggedTrack, targetCat, targetSub);
            setDraggedTrack(null);
            return;
        }

        // CASO 2: Reordenar
        if (targetIndex !== undefined) {
            const tracksInList = availableTracks.filter(t => t.category === targetCat && t.subcategory === targetSub);
            const orderKey = `${currentFrame}.${targetCat}.${targetSub}`;
            const savedOrder = playlistOrders[orderKey];

            if (savedOrder) {
                tracksInList.sort((a, b) => {
                    const idxA = savedOrder.indexOf(a.id);
                    const idxB = savedOrder.indexOf(b.id);
                    if (idxA === -1) return 1;
                    if (idxB === -1) return -1;
                    return idxA - idxB;
                });
            }

            const currentIndex = tracksInList.findIndex(t => t.id === draggedTrack.id);
            if (currentIndex === -1) return;

            const newOrder = [...tracksInList];
            const [movedItem] = newOrder.splice(currentIndex, 1);
            newOrder.splice(targetIndex, 0, movedItem);

            reorderPlaylist(orderKey, newOrder);
        }
        setDraggedTrack(null);
    };

    return (
        <div className="space-y-2 pb-10">
            {/* Global Controls */}
            <div className="flex justify-center gap-4 bg-slate-900 p-2 rounded mb-4 border border-slate-800">
                <button onClick={() => setPlaybackMode('loop')} className={`p-2 rounded ${playbackMode === 'loop' ? 'text-amber-500 bg-amber-900/20' : 'text-slate-500 hover:bg-slate-800'}`} title="Bucle (1 canción)"><Repeat size={18} /></button>
                <button onClick={() => setPlaybackMode('sequential')} className={`p-2 rounded ${playbackMode === 'sequential' ? 'text-cyan-500 bg-cyan-900/20' : 'text-slate-500 hover:bg-slate-800'}`} title="Secuencial (Lista)"><ArrowRight size={18} /></button>
                <button onClick={() => setPlaybackMode('shuffle')} className={`p-2 rounded ${playbackMode === 'shuffle' ? 'text-purple-500 bg-purple-900/20' : 'text-slate-500 hover:bg-slate-800'}`} title="Aleatorio"><Shuffle size={18} /></button>
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
                                let tracksInSub = availableTracks.filter(t => t.category === category && t.subcategory === sub);
                                const orderKey = `${currentFrame}.${category}.${sub}`;
                                const savedOrder = playlistOrders[orderKey];

                                if (savedOrder) {
                                    tracksInSub.sort((a, b) => {
                                        const idxA = savedOrder.indexOf(a.id);
                                        const idxB = savedOrder.indexOf(b.id);
                                        if (idxA === -1) return 1;
                                        if (idxB === -1) return -1;
                                        return idxA - idxB;
                                    });
                                }

                                const isDragOverContainer = dragOverTarget?.cat === category && dragOverTarget?.sub === sub && dragOverTarget?.index === undefined;

                                return (
                                    <div 
                                        key={sub} 
                                        className={`space-y-1 p-1 rounded transition-colors ${isDragOverContainer ? 'bg-amber-900/20 ring-1 ring-amber-500/50' : ''}`}
                                        onDragOver={(e) => handleDragOver(e, category, sub)}
                                        onDrop={(e) => handleDrop(e, category, sub)}
                                    >
                                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 border-b border-slate-800/50 pb-1 mb-2 select-none">{sub}</h4>
                                        
                                        {tracksInSub.length === 0 ? (
                                            <div className="px-2 text-xs text-slate-600 italic h-8 flex items-center">Arrastra aquí...</div>
                                        ) : (
                                            <div className="space-y-1">
                                                {tracksInSub.map((track, index) => {
                                                    const isCurrent = activeMusic?.id === track.id;
                                                    const isOver = dragOverTarget?.cat === category && dragOverTarget?.sub === sub && dragOverTarget?.index === index;
                                                    
                                                    return (
                                                        <div
                                                            key={track.id}
                                                            draggable
                                                            onDragStart={(e) => handleDragStart(e, track)}
                                                            onDragOver={(e) => handleDragOver(e, category, sub, index)}
                                                            onDrop={(e) => handleDrop(e, category, sub, index)}
                                                            onContextMenu={(e) => handleContextMenu(e, track)}
                                                            className={`
                                                                group flex items-center gap-3 p-2 rounded cursor-pointer transition-all relative
                                                                ${isCurrent ? 'bg-amber-900/20 border border-amber-900/50' : 'hover:bg-slate-800 border border-transparent'}
                                                                ${isOver ? 'border-t-2 border-t-amber-500 pt-1' : ''} 
                                                                ${draggedTrack?.id === track.id ? 'opacity-50' : 'opacity-100'}
                                                            `}
                                                            onClick={() => isCurrent && isPlayingMusic ? pauseMusic() : playMusic(track, tracksInSub)}
                                                        >
                                                            <div className="text-slate-600 cursor-grab active:cursor-grabbing hover:text-slate-400"><GripVertical size={14} /></div>
                                                            <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${isCurrent ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200'}`}>
                                                                {isCurrent && isPlayingMusic ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                                                            </div>
                                                            <div className="flex-1 min-w-0 pointer-events-none">
                                                                <div className={`text-sm font-medium truncate ${isCurrent ? 'text-amber-500' : 'text-slate-300'}`}>{track.name}</div>
                                                                {!track.frame && <div className="text-[10px] text-cyan-500">Global</div>}
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
            
            {contextMenu && (
                <TrackContextMenu 
                    x={contextMenu.x} 
                    y={contextMenu.y} 
                    track={contextMenu.track} 
                    onClose={() => setContextMenu(null)} 
                />
            )}
        </div>
    );
};