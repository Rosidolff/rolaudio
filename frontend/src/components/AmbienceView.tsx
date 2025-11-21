import { useState } from 'react';
import { Volume2, VolumeX, Trash2, Plus, CloudRain } from 'lucide-react';
import { useAppStore } from '../store';

export const AmbienceView = () => {
    const {
        currentFrame,
        activeAmbience,
        addAmbience,
        removeAmbience,
        setAmbienceVolume,
        toggleAmbienceMute,
        tracks
    } = useAppStore();

    const [showAddModal, setShowAddModal] = useState(false);

    // Filter available ambience tracks by Frame
    const availableAmbience = tracks.filter(t =>
        t.type === 'ambience' && (!t.frame || t.frame === currentFrame)
    );

    return (
        <div className="space-y-6">
            {/* Controls Header */}
            <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                <div className="flex gap-2">
                    <button className="px-3 py-1.5 bg-slate-800 text-xs font-bold text-slate-300 rounded hover:bg-slate-700 border border-slate-700">
                        Cargar Preset
                    </button>
                    <button className="px-3 py-1.5 bg-slate-800 text-xs font-bold text-slate-300 rounded hover:bg-slate-700 border border-slate-700">
                        Guardar Preset
                    </button>
                </div>
                <button
                    onClick={() => setShowAddModal(!showAddModal)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-amber-900/30 text-amber-500 text-xs font-bold rounded hover:bg-amber-900/50 border border-amber-900/50 transition-colors"
                >
                    <Plus size={14} />
                    Añadir Ambiente
                </button>
            </div>

            {/* Add Ambience List (Mock Modal/Dropdown) */}
            {showAddModal && (
                <div className="bg-slate-900 border border-slate-700 rounded-lg p-2 space-y-1 animate-in fade-in slide-in-from-top-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase px-2 mb-2">Disponibles ({currentFrame})</h4>
                    {availableAmbience.length === 0 ? (
                        <div className="text-xs text-slate-500 px-2 italic">No hay ambientes disponibles para este Frame.</div>
                    ) : (
                        availableAmbience.map(track => (
                            <button
                                key={track.id}
                                onClick={() => {
                                    addAmbience(track);
                                    setShowAddModal(false);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-slate-800 rounded flex items-center justify-between group"
                            >
                                <span className="text-sm text-slate-300 group-hover:text-white">{track.name}</span>
                                <Plus size={14} className="text-slate-500 group-hover:text-amber-500" />
                            </button>
                        ))
                    )}
                </div>
            )}

            {/* Active Ambience List */}
            <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <CloudRain size={14} />
                    Capas Activas
                </h3>

                {activeAmbience.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-slate-800 rounded-lg text-slate-600">
                        <p className="text-sm">No hay ambientes sonando.</p>
                        <p className="text-xs mt-1">Añade capas para crear atmósfera.</p>
                    </div>
                ) : (
                    activeAmbience.map(amb => (
                        <div key={amb.instanceId} className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-center gap-4 shadow-sm">
                            <div className="w-10 h-10 bg-slate-800 rounded flex items-center justify-center text-slate-500">
                                <CloudRain size={20} />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold text-slate-200 truncate">{amb.track.name}</div>
                                <div className="flex items-center gap-2 mt-1">
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={amb.volume}
                                        onChange={(e) => setAmbienceVolume(amb.instanceId, parseInt(e.target.value))}
                                        className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                        disabled={amb.isMuted}
                                    />
                                    <span className="text-xs text-slate-500 w-6 text-right">{amb.isMuted ? 'M' : `${amb.volume}%`}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => toggleAmbienceMute(amb.instanceId)}
                                    className={`p-2 rounded hover:bg-slate-800 transition-colors ${amb.isMuted ? 'text-red-400' : 'text-slate-400'}`}
                                    title={amb.isMuted ? "Unmute" : "Mute"}
                                >
                                    {amb.isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                                </button>
                                <button
                                    onClick={() => removeAmbience(amb.instanceId)}
                                    className="p-2 rounded hover:bg-red-900/20 text-slate-600 hover:text-red-400 transition-colors"
                                    title="Eliminar capa"
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
