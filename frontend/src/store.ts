import { create } from 'zustand';

import type { Frame, Track, ActiveAmbience } from './types';

interface AppState {
    currentFrame: Frame;
    masterVolume: number;

    // Data State
    tracks: Track[];
    fetchTracks: () => Promise<void>;

    // Music State
    activeMusic: Track | null;
    isPlayingMusic: boolean;

    // Ambience State
    activeAmbience: ActiveAmbience[];

    // Actions
    setFrame: (frame: Frame) => void;
    setMasterVolume: (vol: number) => void;

    playMusic: (track: Track) => void;
    pauseMusic: () => void;
    stopMusic: () => void;

    playSFX: (track: Track) => void;

    addAmbience: (track: Track) => void;
    removeAmbience: (instanceId: string) => void;
    setAmbienceVolume: (instanceId: string, vol: number) => void;
    toggleAmbienceMute: (instanceId: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
    currentFrame: 'Fantasy',
    masterVolume: 100,

    tracks: [],
    fetchTracks: async () => {
        try {
            const response = await fetch('http://localhost:5000/api/tracks');
            const data = await response.json();
            // Map backend fields to frontend if needed, but they should match
            // Backend: filename -> Frontend: url (we need to prepend base url)
            const tracks = data.map((t: any) => ({
                ...t,
                url: `http://localhost:5000/assets/${t.filename}`
            }));
            set({ tracks });
        } catch (error) {
            console.error('Failed to fetch tracks:', error);
        }
    },

    activeMusic: null,
    isPlayingMusic: false,
    activeAmbience: [],

    setFrame: (frame) => set({ currentFrame: frame }),
    setMasterVolume: (vol) => set({ masterVolume: vol }),

    playMusic: (track) => set({ activeMusic: track, isPlayingMusic: true }),
    pauseMusic: () => set({ isPlayingMusic: false }),
    stopMusic: () => set({ activeMusic: null, isPlayingMusic: false }),

    playSFX: (track) => console.log('Playing SFX:', track.name),

    addAmbience: (track) => set((state) => ({
        activeAmbience: [
            ...state.activeAmbience,
            {
                instanceId: crypto.randomUUID(),
                track,
                volume: 75,
                isMuted: false
            }
        ]
    })),
    removeAmbience: (id) => set((state) => ({
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
}));
