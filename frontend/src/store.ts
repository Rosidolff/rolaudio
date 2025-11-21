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
    musicVolume: number;
    musicDuration: number;
    musicCurrentTime: number;
    seekRequest: number | null;

    // Ambience State
    activeAmbience: ActiveAmbience[];

    // SFX State
    sfxQueue: string[]; // URLs of SFX to play

    // Actions
    setFrame: (frame: Frame) => void;

    // Music Actions
    playMusic: (track: Track) => void;
    pauseMusic: () => void;
    stopMusic: () => void;
    setMusicVolume: (volume: number) => void;
    setMusicProgress: (time: number, duration: number) => void;
    requestSeek: (time: number) => void;

    // Ambience Actions
    playAmbience: (track: Track) => void;
    stopAmbience: (instanceId: string) => void;
    setAmbienceVolume: (instanceId: string, volume: number) => void;
    toggleAmbienceMute: (instanceId: string) => void;

    // SFX Actions
    playSFX: (track: Track) => void;
    popSFX: () => void; // Remove played SFX from queue
}

export const useAppStore = create<AppState>((set) => ({
    currentFrame: 'Fantasy',
    masterVolume: 50,

    activeMusic: null,
    isPlayingMusic: false,
    musicVolume: 100,
    musicDuration: 0,
    musicCurrentTime: 0,
    seekRequest: null,

    activeAmbience: [],

    sfxQueue: [],

    tracks: [],
    fetchTracks: async () => {
        try {
            const response = await fetch('http://localhost:5000/api/tracks');
            const data = await response.json();
            const tracks = data.map((t: any) => ({
                ...t,
                url: `http://localhost:5000/assets/${t.filename}`
            }));
            set({ tracks });
        } catch (error) {
            console.error('Failed to fetch tracks:', error);
        }
    },

    setFrame: (frame) => set({ currentFrame: frame }),

    playMusic: (track) => set({ activeMusic: track, isPlayingMusic: true }),
    pauseMusic: () => set({ isPlayingMusic: false }),
    stopMusic: () => set({ activeMusic: null, isPlayingMusic: false, musicCurrentTime: 0 }),
    setMusicVolume: (volume) => set({ musicVolume: volume }),
    setMusicProgress: (time, duration) => set({ musicCurrentTime: time, musicDuration: duration }),
    requestSeek: (time) => set({ seekRequest: time }),

    playAmbience: (track) => {
        const newAmbience: ActiveAmbience = {
            instanceId: crypto.randomUUID(),
            track,
            volume: 50,
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

    playSFX: (track) => set((state) => ({ sfxQueue: [...state.sfxQueue, track.url] })),
    popSFX: () => set((state) => ({ sfxQueue: state.sfxQueue.slice(1) })),
}));
