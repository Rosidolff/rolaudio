import { useState } from 'react';
import { Volume2, VolumeX, Trash2, Plus, CloudRain, Save, FolderOpen, X, RefreshCw } from 'lucide-react';
import { useAppStore } from '../store';

export const AmbienceView = () => {
    const {
        currentFrame,
        activeAmbience,
        playAmbience,
        stopAmbience,
        setAmbienceVolume,
        toggleAmbienceMute,
        tracks,
        saveNewPreset,
        updateCurrentPreset,
        loadPreset,
        deletePreset,
        presets,
        activePresetId
    } = useAppStore();

    const [showAddModal, setShowAddModal] = useState(false);
    const [showLoadMenu, setShowLoadMenu] = useState(false);

    // Encontrar nombre del preset activo para mostrarlo
    const activePresetName = presets.find(p => p.id === activePresetId)?.name;

    const availableAmbience = tracks.filter(t =>
        t.type === 'ambience' && (!t.frame || t.frame === currentFrame)
    );

    const handleSaveNew = async () => {
        if (activeAmbience.length === 0) return alert("Añade ambientes primero.");
        const name = prompt("Nombre del Nuevo Preset:");
        if (name) await saveNewPreset(name);
    };

    const handleUpdate = async () => {
        if (confirm(`¿Sobreescribir preset "${activePresetName}" con la configuración actual?`)) {
            await updateCurrentPreset();
        }
    };

    const handleDeleteCurrent = async () => {
        if (activePresetId && confirm(`¿Eliminar preset "${activePresetName}"?`)) {
            await deletePreset(activePresetId);
        }
    };

    return (
        <div className="space-y-6 pb-10">
            {/* Preset Controls Toolbar */}
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 flex flex-col gap-3">
                
                {/* Fila Superior: Gestión de Presets */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex gap-2 relative">
                        <button 
                            onClick={() => setShowLoadMenu(!showLoadMenu)}
                            className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-xs font-bold text-slate-300 rounded hover:bg-slate-700 border border-slate-700 transition-colors"
                            title="Cargar Preset"
                        >
                            <FolderOpen size={16} />
                            {activePresetName ? <span className="text-amber-500 max-w-[100px] truncate">{activePresetName}</span> : "Cargar"}
                        </button>

                        {/* Load Menu Dropdown */}
                        {showLoadMenu && (
                            <div className="absolute top-full left-0 mt-2 w-64 bg-slate-950 border border-slate-700 rounded-lg shadow-2xl z-50 overflow-hidden ring-1 ring-black/50">
                                <div className="p-2 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Presets Guardados</span>
                                    <button onClick={() => setShowLoadMenu(false)} className="text-slate-500 hover:text-white"><X size={14} /></button>
                                </div>
                                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                    {presets.length === 0 ? (
                                        <div className="p-4 text-xs text-slate-600 text-center">No hay presets guardados.</div>
                                    ) : (
                                        presets.map(preset => (
                                            <div key={preset.id} className="flex items-center justify-between hover:bg-slate-800 p-2 group border-b border-slate-900 last:border-0">
                                                <button 
                                                    onClick={() => { loadPreset(preset); setShowLoadMenu(false); }}
                                                    className={`flex-1 text-left text-sm truncate px-1 ${activePresetId === preset.id ? 'text-amber-500 font-bold' : 'text-slate-300'}`}
                                                >
                                                    {preset.name}
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); if(confirm('Eliminar?')) deletePreset(preset.id); }}
                                                    className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-900/20 rounded opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-1">
                        {activePresetId && (
                            <>
                                <button 
                                    onClick={handleUpdate}
                                    className="p-2 bg-slate-800 text-cyan-500 rounded hover:bg-cyan-900/30 border border-transparent hover:border-cyan-900/50 transition-colors"
                                    title="Actualizar Preset Actual"
                                >
                                    <RefreshCw size={16} />
                                </button>
                                <button 
                                    onClick={handleDeleteCurrent}
                                    className="p-2 bg-slate-800 text-red-500 rounded hover:bg-red-900/30 border border-transparent hover:border-red-900/50 transition-colors"
                                    title="Eliminar Preset Actual"
                                >
                                    <Trash2 size={16} />
                                </button>
                                <div className="w-px h-8 bg-slate-800 mx-1"></div>
                            </>
                        )}
                        
                        <button 
                            onClick={handleSaveNew}
                            className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-xs font-bold text-slate-300 rounded hover:bg-slate-700 border border-slate-700 transition-colors"
                        >
                            <Save size={16} />
                            <span>Nuevo</span>
                        </button>
                    </div>
                </div>

                {/* Botón Añadir Ambiente */}
                <button
                    onClick={() => setShowAddModal(!showAddModal)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-amber-900/20 text-amber-500 text-xs font-bold rounded hover:bg-amber-900/40 border border-amber-900/40 transition-all"
                >
                    <Plus size={16} />
                    Añadir Capa de Ambiente
                </button>
            </div>

            {/* Dropdown de Ambientes Disponibles */}
            {showAddModal && (
                <div className="bg-slate-900 border border-slate-700 rounded-lg p-2 space-y-1 animate-in fade-in slide-in-from-top-2 shadow-xl">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase px-2 mb-2 tracking-wider">Disponibles ({currentFrame})</h4>
                    {availableAmbience.length === 0 ? (
                        <div className="text-xs text-slate-500 px-2 italic py-2">No hay pistas para este Frame.</div>
                    ) : (
                        <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto custom-scrollbar">
                            {availableAmbience.map(track => (
                                <button
                                    key={track.id}
                                    onClick={() => { playAmbience(track); setShowAddModal(false); }}
                                    className="w-full text-left px-3 py-2 hover:bg-slate-800 rounded flex items-center justify-between group"
                                >
                                    <span className="text-sm text-slate-300 group-hover:text-white truncate">{track.name}</span>
                                    <Plus size={14} className="text-slate-500 group-hover:text-amber-500" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Lista de Capas Activas */}
            <div className="space-y-3">
                {activeAmbience.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-lg text-slate-600 flex flex-col items-center gap-2">
                        <CloudRain size={32} className="opacity-20" />
                        <p className="text-sm">Sin atmósfera activa.</p>
                    </div>
                ) : (
                    activeAmbience.map(amb => (
                        <div key={amb.instanceId} className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex items-center gap-4 shadow-sm group hover:border-slate-700 transition-colors">
                            <div className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${amb.isMuted ? 'bg-slate-900 text-slate-700' : 'bg-cyan-900/20 text-cyan-500'}`}>
                                <CloudRain size={16} />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className={`text-xs font-bold truncate mb-1 ${amb.isMuted ? 'text-slate-500' : 'text-slate-300'}`}>{amb.track.name}</div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={amb.volume}
                                        onChange={(e) => setAmbienceVolume(amb.instanceId, parseInt(e.target.value))}
                                        className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-600 hover:accent-cyan-500"
                                        disabled={amb.isMuted}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => toggleAmbienceMute(amb.instanceId)}
                                    className={`p-2 rounded hover:bg-slate-800 transition-colors ${amb.isMuted ? 'text-red-500 bg-red-900/10' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    {amb.isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                                </button>
                                <button
                                    onClick={() => stopAmbience(amb.instanceId)}
                                    className="p-2 rounded hover:bg-red-900/20 text-slate-600 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};