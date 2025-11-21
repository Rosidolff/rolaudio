import { create } from 'zustand';
import type { Frame, Track, ActiveAmbience, AmbiencePreset } from './types';

interface AppState {
    currentFrame: Frame;
    masterVolume: number;
    tracks: Track[];
    presets: AmbiencePreset[];
    
    activeMusic: Track | null;
    isPlayingMusic: boolean;
    musicVolume: number;
    musicDuration: number;
    musicCurrentTime: number;
    seekRequest: number | null;
    
    activeAmbience: ActiveAmbience[];
    
    activeSFXIds: string[]; 
    // CORRECCIÓN: Objeto disparador con ID único (timestamp) para forzar re-render
    sfxTrigger: { track: Track, triggerId: number } | null;

    fetchTracks: () => Promise<void>;
    fetchPresets: () => Promise<void>;
    loadSettings: () => Promise<void>;
    saveSettings: () => void;

    setFrame: (frame: Frame) => void;
    setMasterVolume: (volume: number) => void;

    playMusic: (track: Track) => void;
    pauseMusic: () => void;
    stopMusic: () => void;
    setMusicVolume: (volume: number) => void;
    setMusicProgress: (time: number, duration: number) => void;
    requestSeek: (time: number) => void;

    playAmbience: (track: Track, volume?: number) => void;
    stopAmbience: (instanceId: string) => void;
    setAmbienceVolume: (instanceId: string, volume: number) => void;
    toggleAmbienceMute: (instanceId: string) => void;
    loadPreset: (preset: AmbiencePreset) => void;
    savePreset: (name: string) => Promise<void>;

    toggleSFX: (track: Track) => void;
    sfxFinished: (trackId: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
    currentFrame: 'Fantasy',
    masterVolume: 50,
    tracks: [],
    presets: [],
    
    activeMusic: null,
    isPlayingMusic: false,
    musicVolume: 100,
    musicDuration: 0,
    musicCurrentTime: 0,
    seekRequest: null,
    
    activeAmbience: [],
    
    activeSFXIds: [],
    sfxTrigger: null,

    fetchTracks: async () => {
        try {
            const res = await fetch('http://localhost:5000/api/tracks');
            const tracks = await res.json();
            set({ tracks });
        } catch (e) { console.error(e); }
    },
    fetchPresets: async () => {
        try {
            const res = await fetch('http://localhost:5000/api/presets');
            set({ presets: await res.json() });
        } catch (e) { console.error(e); }
    },
    loadSettings: async () => {
        try {
            const res = await fetch('http://localhost:5000/api/settings');
            const settings = await res.json();
            set({ 
                masterVolume: settings.masterVolume ?? 50, 
                currentFrame: settings.lastFrame ?? 'Fantasy' 
            });
        } catch (e) { console.error(e); }
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

    playMusic: (track) => set({ activeMusic: track, isPlayingMusic: true }),
    pauseMusic: () => set({ isPlayingMusic: false }),
    stopMusic: () => set({ activeMusic: null, isPlayingMusic: false, musicCurrentTime: 0 }),
    setMusicVolume: (volume) => set({ musicVolume: volume }),
    setMusicProgress: (time, duration) => set({ musicCurrentTime: time, musicDuration: duration }),
    requestSeek: (time) => set({ seekRequest: time }),

    playAmbience: (track, volume = 50) => {
        const newAmbience: ActiveAmbience = {
            instanceId: crypto.randomUUID(),
            track,
            volume,
            isMuted: false
        };
        set(state => ({ activeAmbience: [...state.activeAmbience, newAmbience] }));
    },
    stopAmbience: (id) => set(state => ({
        activeAmbience: state.activeAmbience.filter(a => a.instanceId !== id)
    })),
    setAmbienceVolume: (id, vol) => set(state => ({
        activeAmbience: state.activeAmbience.map(a => a.instanceId === id ? { ...a, volume: vol } : a)
    })),
    toggleAmbienceMute: (id) => set(state => ({
        activeAmbience: state.activeAmbience.map(a => a.instanceId === id ? { ...a, isMuted: !a.isMuted } : a)
    })),
    
    loadPreset: (preset) => {
        set({ activeAmbience: [] });
        const { tracks } = get();
        preset.tracks.forEach(pTrack => {
            const track = tracks.find(t => t.id === pTrack.trackId);
            if (track) {
                get().playAmbience(track, pTrack.volume);
            }
        });
    },
    savePreset: async (name) => {
        const { activeAmbience, currentFrame } = get();
        const presetData = {
            id: crypto.randomUUID(),
            name,
            frame: currentFrame,
            tracks: activeAmbience.map(a => ({ trackId: a.track.id, volume: a.volume }))
        };
        await fetch('http://localhost:5000/api/presets', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(presetData)
        });
        get().fetchPresets();
    },

    toggleSFX: (track) => {
        const { activeSFXIds } = get();
        const isPlaying = activeSFXIds.includes(track.id);

        if (isPlaying) {
            set({ activeSFXIds: activeSFXIds.filter(id => id !== track.id) });
        } else {
            set({ 
                activeSFXIds: [...activeSFXIds, track.id],
                sfxTrigger: { track, triggerId: Date.now() } // Nuevo objeto para forzar efecto
            });
        }
    },
    sfxFinished: (trackId) => {
        set(state => ({ activeSFXIds: state.activeSFXIds.filter(id => id !== trackId) }));
    }
}));