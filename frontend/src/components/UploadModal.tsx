import { useState, useRef, useEffect } from 'react';
import { X, Upload, Check, AlertCircle, Files } from 'lucide-react';
import { useAppStore } from '../store';
import { MUSIC_CATEGORIES, SFX_CATEGORIES } from '../types';

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    preselectedType?: 'music' | 'ambience' | 'sfx';
}

export const UploadModal = ({ isOpen, onClose, preselectedType = 'music' }: UploadModalProps) => {
    const { currentFrame, fetchTracks } = useAppStore();
    const [files, setFiles] = useState<File[]>([]);
    const [name, setName] = useState('');
    const [type, setType] = useState<'music' | 'ambience' | 'sfx'>(preselectedType);
    const [category, setCategory] = useState('');
    const [subcategory, setSubcategory] = useState('');
    const [isGlobal, setIsGlobal] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // CORRECCIÓN: El useEffect debe estar ANTES de cualquier return condicional
    // Auto-seleccionar primera subcategoría al cambiar categoría
    useEffect(() => {
        if (type === 'music' && category && MUSIC_CATEGORIES[category]) {
            setSubcategory(MUSIC_CATEGORIES[category][0]);
        }
    }, [category, type]);

    // CORRECCIÓN: Ahora sí podemos hacer el early return
    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFiles = Array.from(e.target.files);
            setFiles(selectedFiles);
            
            if (selectedFiles.length === 1) {
                setName(selectedFiles[0].name.replace(/\.[^/.]+$/, "").replace(/_/g, " "));
            } else {
                setName('');
            }
        }
    };

    const handleUpload = async () => {
        if (files.length === 0) return;
        if (files.length === 1 && !name) return;

        setIsUploading(true);
        setError(null);

        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append('file', file);
                
                const finalName = files.length > 1 
                    ? file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ") 
                    : name;

                formData.append('name', finalName);
                formData.append('type', type);
                formData.append('is_global', String(isGlobal));
                
                if (!isGlobal) {
                    formData.append('frame', currentFrame); 
                }
                
                if (category) formData.append('category', category);
                if (subcategory) formData.append('subcategory', subcategory);

                const response = await fetch('http://localhost:5000/api/tracks', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) throw new Error(`Error al subir ${file.name}`);
            }

            await fetchTracks();
            onClose();
            setFiles([]);
            setName('');
            setCategory('');
            setSubcategory('');
        } catch (err) {
            console.error(err);
            setError('Error durante la subida. Revisa la consola.');
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
                        Subir Pistas ({files.length})
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* File Drop Area */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${files.length > 0 ? 'border-amber-500/50 bg-amber-500/5' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50'
                            }`}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="audio/*"
                            className="hidden"
                            multiple
                        />
                        {files.length > 0 ? (
                            <div className="text-amber-400 font-medium flex flex-col items-center gap-2">
                                {files.length === 1 ? (
                                    <>
                                        <Check size={24} />
                                        <span className="truncate max-w-[200px]">{files[0].name}</span>
                                    </>
                                ) : (
                                    <>
                                        <Files size={24} />
                                        <span>{files.length} archivos seleccionados</span>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="text-slate-400 flex flex-col items-center gap-2">
                                <Upload size={24} />
                                <span className="text-sm">Click para seleccionar archivos (MP3, WAV, OGG)</span>
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
                                disabled={files.length > 1}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 focus:border-amber-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                placeholder={files.length > 1 ? "(Se usarán los nombres de archivo)" : "Nombre de la pista"}
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
                        disabled={files.length === 0 || (files.length === 1 && !name) || isUploading}
                        className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 mt-4"
                    >
                        {isUploading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                {files.length > 1 ? `Subiendo ${files.length}...` : 'Subiendo...'}
                            </>
                        ) : (
                            <>
                                <Upload size={18} />
                                {files.length > 1 ? 'Subir Pistas' : 'Subir Pista'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};