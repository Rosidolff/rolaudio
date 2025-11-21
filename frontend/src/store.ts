import { create } from 'zustand';
import type { Frame, Track, ActiveAmbience, AmbiencePreset, PlaybackMode } from './types';

interface AppState {
    currentFrame: Frame;
    masterVolume: number;
    tracks: Track[];
    presets: AmbiencePreset[];
    playlistOrders: Record<string, string[]>; // Guardar orden de listas

    // Music State
    activeMusic: Track | null;
    isPlayingMusic: boolean;
    musicVolume: number;
    musicDuration: number;
    musicCurrentTime: number;
    seekRequest: number | null;
    
    // Playlist Logic
    currentPlaylist: Track[];
    playbackMode: PlaybackMode;
    
    // Ambience State
    activeAmbience: ActiveAmbience[];
    activePresetId: string | null;

    // SFX State
    activeSFXIds: string[]; 
    sfxTrigger: { track: Track, triggerId: number } | null;

    // Actions
    fetchTracks: () => Promise<void>;
    fetchPresets: () => Promise<void>;
    loadSettings: () => Promise<void>;
    saveSettings: () => void;

    setFrame: (frame: Frame) => void;
    setMasterVolume: (volume: number) => void;

    // Music Actions
    playMusic: (track: Track, contextPlaylist?: Track[]) => void;
    pauseMusic: () => void;
    stopMusic: () => void;
    nextTrack: () => void; // Avanzar a la siguiente canción
    setPlaybackMode: (mode: PlaybackMode) => void;
    reorderPlaylist: (categoryKey: string, newOrder: Track[]) => void;
    
    setMusicVolume: (volume: number) => void;
    setMusicProgress: (time: number, duration: number) => void;
    requestSeek: (time: number) => void;

    // Ambience Actions
    playAmbience: (track: Track, volume?: number) => void;
    stopAmbience: (instanceId: string) => void;
    setAmbienceVolume: (instanceId: string, volume: number) => void;
    toggleAmbienceMute: (instanceId: string) => void;
    
    // Preset Actions
    loadPreset: (preset: AmbiencePreset) => void;
    saveNewPreset: (name: string) => Promise<void>;
    updateCurrentPreset: () => Promise<void>;
    deletePreset: (id: string) => Promise<void>;

    // SFX Actions
    toggleSFX: (track: Track) => void;
    sfxFinished: (trackId: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
    currentFrame: 'Fantasy',
    masterVolume: 50,
    tracks: [],
    presets: [],
    playlistOrders: {},

    activeMusic: null,
    isPlayingMusic: false,
    musicVolume: 100,
    musicDuration: 0,
    musicCurrentTime: 0,
    seekRequest: null,
    
    currentPlaylist: [],
    playbackMode: 'loop', // Por defecto loop (comportamiento original)

    activeAmbience: [],
    activePresetId: null,

    activeSFXIds: [],
    sfxTrigger: null,

    // --- DATA FETCHING ---
    fetchTracks: async () => {
        try {
            const [tracksRes, ordersRes] = await Promise.all([
                fetch('http://localhost:5000/api/tracks'),
                fetch('http://localhost:5000/api/playlist/orders')
            ]);
            const tracks = await tracksRes.json();
            const orders = await ordersRes.json();
            set({ tracks, playlistOrders: orders });
        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    },
    fetchPresets: async () => {
        try {
            const response = await fetch('http://localhost:5000/api/presets');
            set({ presets: await response.json() });
        } catch (error) {
            console.error('Failed to fetch presets:', error);
        }
    },
    loadSettings: async () => {
        try {
            const response = await fetch('http://localhost:5000/api/settings');
            const settings = await response.json();
            set({ 
                masterVolume: settings.masterVolume ?? 50, 
                currentFrame: settings.lastFrame ?? 'Fantasy' 
            });
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    },
    saveSettings: () => {
        const { masterVolume, currentFrame } = get();
        fetch('http://localhost:5000/api/settings', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ masterVolume, lastFrame: currentFrame })
        }).catch(console.error);
    },

    setFrame: (frame) => {
        set({ currentFrame: frame });
        get().saveSettings();
    },
    setMasterVolume: (volume) => {
        set({ masterVolume: volume });
        if (Math.random() > 0.8) get().saveSettings();
    },

    // --- MUSIC ACTIONS ---
    playMusic: (track, contextPlaylist) => {
        // Si se proporciona una lista de contexto, úsala. Si no, mantén la actual si contiene la pista.
        let newPlaylist = contextPlaylist || get().currentPlaylist;
        
        // Fallback: si la pista no está en la lista actual, créala con esa pista única
        if (!newPlaylist.find(t => t.id === track.id)) {
            newPlaylist = [track];
        }

        set({ 
            activeMusic: track, 
            isPlayingMusic: true, 
            currentPlaylist: newPlaylist 
        });
    },
    pauseMusic: () => set({ isPlayingMusic: false }),
    stopMusic: () => set({ activeMusic: null, isPlayingMusic: false, musicCurrentTime: 0 }),
    
    setPlaybackMode: (mode) => set({ playbackMode: mode }),

    nextTrack: () => {
        const { activeMusic, currentPlaylist, playbackMode } = get();
        if (!activeMusic || currentPlaylist.length === 0) return;

        let nextIndex = 0;
        const currentIndex = currentPlaylist.findIndex(t => t.id === activeMusic.id);

        if (playbackMode === 'shuffle') {
            nextIndex = Math.floor(Math.random() * currentPlaylist.length);
            // Evitar repetir la misma si hay más de 1
            if (currentPlaylist.length > 1 && nextIndex === currentIndex) {
                nextIndex = (nextIndex + 1) % currentPlaylist.length;
            }
        } else {
            // Sequential (o forzado desde loop)
            nextIndex = (currentIndex + 1) % currentPlaylist.length;
        }

        set({ activeMusic: currentPlaylist[nextIndex], isPlayingMusic: true });
    },

    reorderPlaylist: async (categoryKey, newOrder) => {
        // Actualización optimista
        set(state => ({
            playlistOrders: {
                ...state.playlistOrders,
                [categoryKey]: newOrder.map(t => t.id)
            }
        }));

        // Guardar en servidor
        await fetch('http://localhost:5000/api/playlist/order', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ 
                key: categoryKey, 
                trackIds: newOrder.map(t => t.id) 
            })
        });
    },

    setMusicVolume: (volume) => set({ musicVolume: volume }),
    setMusicProgress: (time, duration) => set({ musicCurrentTime: time, musicDuration: duration }),
    requestSeek: (time) => set({ seekRequest: time }),

    // --- AMBIENCE ACTIONS ---
    playAmbience: (track, volume = 50) => {
        const newAmbience: ActiveAmbience = {
            instanceId: crypto.randomUUID(),
            track,
            volume,
            isMuted: false
        };
        set((state) => ({ activeAmbience: [...state.activeAmbience, newAmbience] }));
    },
    stopAmbience: (id) => set((state) => ({
        activeAmbience: state.activeAmbience.filter(a => a.instanceId !== id)
    })),
    setAmbienceVolume: (id, vol) => set((state) => ({
        activeAmbience: state.activeAmbience.map(a =>
            a.instanceId === id ? { ...a, volume: vol } : a
        )
    })),
    toggleAmbienceMute: (id) => set((state) => ({
        activeAmbience: state.activeAmbience.map(a =>
            a.instanceId === id ? { ...a, isMuted: !a.isMuted } : a
        )
    })),
    
    loadPreset: (preset) => {
        set({ activeAmbience: [], activePresetId: preset.id });
        const { tracks } = get();
        preset.tracks.forEach(pTrack => {
            const track = tracks.find(t => t.id === pTrack.trackId);
            if (track) {
                get().playAmbience(track, pTrack.volume);
            }
        });
    },
    saveNewPreset: async (name) => {
        const { activeAmbience, currentFrame } = get();
        const newId = crypto.randomUUID();
        const presetData = {
            id: newId,
            name,
            frame: currentFrame,
            tracks: activeAmbience.map(a => ({ trackId: a.track.id, volume: a.volume }))
        };
        await fetch('http://localhost:5000/api/presets', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(presetData)
        });
        await get().fetchPresets();
        set({ activePresetId: newId });
    },
    updateCurrentPreset: async () => {
        const { activeAmbience, currentFrame, activePresetId, presets } = get();
        if (!activePresetId) return;

        const existingPreset = presets.find(p => p.id === activePresetId);
        if (!existingPreset) return;

        const updatedPreset = {
            ...existingPreset,
            frame: currentFrame,
            tracks: activeAmbience.map(a => ({ trackId: a.track.id, volume: a.volume }))
        };

        await fetch('http://localhost:5000/api/presets', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(updatedPreset)
        });
        await get().fetchPresets();
    },
    deletePreset: async (id) => {
        await fetch(`http://localhost:5000/api/presets/${id}`, {
            method: 'DELETE',
        });
        set(state => state.activePresetId === id ? { activePresetId: null } : {});
        get().fetchPresets();
    },

    // --- SFX ACTIONS ---
    toggleSFX: (track) => {
        const { activeSFXIds } = get();
        const isPlaying = activeSFXIds.includes(track.id);

        if (isPlaying) {
            set({ activeSFXIds: activeSFXIds.filter(id => id !== track.id) });
        } else {
            set({ 
                activeSFXIds: [...activeSFXIds, track.id],
                sfxTrigger: { track, triggerId: Date.now() }
            });
        }
    },
    sfxFinished: (trackId) => {
        set((state) => ({ activeSFXIds: state.activeSFXIds.filter(id => id !== trackId) }));
    },
}));