import { useState, useRef } from 'react';
import { X, Upload, Check, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store';
import { MUSIC_CATEGORIES, SFX_CATEGORIES } from '../types';

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    preselectedType?: 'music' | 'ambience' | 'sfx';
}

export const UploadModal = ({ isOpen, onClose, preselectedType = 'music' }: UploadModalProps) => {
    const { currentFrame, fetchTracks } = useAppStore();
    const [file, setFile] = useState<File | null>(null);
    const [name, setName] = useState('');
    const [type, setType] = useState<'music' | 'ambience' | 'sfx'>(preselectedType);
    const [category, setCategory] = useState('');
    const [subcategory, setSubcategory] = useState('');
    const [isGlobal, setIsGlobal] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setName(selectedFile.name.replace(/\.[^/.]+$/, "").replace(/_/g, " "));
        }
    };

    const handleUpload = async () => {
        if (!file || !name) return;

        setIsUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', name);
        formData.append('type', type);
        formData.append('is_global', String(isGlobal));
        if (!isGlobal) formData.append('frame_id', '1'); // TODO: Map currentFrame name to ID properly
        if (category) formData.append('category', category);
        if (subcategory) formData.append('subcategory', subcategory);

        try {
            const response = await fetch('http://localhost:5000/api/tracks', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');

            await fetchTracks();
            onClose();
            // Reset form
            setFile(null);
            setName('');
        } catch (err) {
            setError('Error al subir el archivo. Inténtalo de nuevo.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                        <Upload size={20} className="text-amber-500" />
                        Subir Pista de Audio
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* File Drop Area */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${file ? 'border-amber-500/50 bg-amber-500/5' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50'
                            }`}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="audio/*"
                            className="hidden"
                        />
                        {file ? (
                            <div className="text-amber-400 font-medium flex flex-col items-center gap-2">
                                <Check size={24} />
                                {file.name}
                            </div>
                        ) : (
                            <div className="text-slate-400 flex flex-col items-center gap-2">
                                <Upload size={24} />
                                <span className="text-sm">Click para seleccionar archivo (MP3, WAV, OGG)</span>
                            </div>
                        )}
                    </div>

                    {/* Metadata Form */}
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 focus:border-amber-500 outline-none"
                                placeholder="Nombre de la pista"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo</label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value as any)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 focus:border-amber-500 outline-none"
                                >
                                    <option value="music">Música</option>
                                    <option value="ambience">Ambiente</option>
                                    <option value="sfx">SFX</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contexto</label>
                                <div className="flex items-center gap-2 mt-2">
                                    <input
                                        type="checkbox"
                                        checked={isGlobal}
                                        onChange={(e) => setIsGlobal(e.target.checked)}
                                        className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                                    />
                                    <span className="text-sm text-slate-300">Global</span>
                                    {!isGlobal && <span className="text-xs text-amber-500 font-mono">({currentFrame})</span>}
                                </div>
                            </div>
                        </div>

                        {/* Dynamic Categories based on Type */}
                        {type === 'music' && (
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoría</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 focus:border-amber-500 outline-none"
                                    >
                                        <option value="">Seleccionar...</option>
                                        {Object.keys(MUSIC_CATEGORIES).map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subcategoría</label>
                                    <select
                                        value={subcategory}
                                        onChange={(e) => setSubcategory(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 focus:border-amber-500 outline-none"
                                        disabled={!category}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {category && MUSIC_CATEGORIES[category as keyof typeof MUSIC_CATEGORIES]?.map(sub => (
                                            <option key={sub} value={sub}>{sub}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {type === 'sfx' && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoría</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 focus:border-amber-500 outline-none"
                                >
                                    <option value="">Seleccionar...</option>
                                    {SFX_CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 p-3 rounded border border-red-900/50">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleUpload}
                        disabled={!file || !name || isUploading}
                        className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 mt-4"
                    >
                        {isUploading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Subiendo...
                            </>
                        ) : (
                            <>
                                <Upload size={18} />
                                Subir Pista
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
