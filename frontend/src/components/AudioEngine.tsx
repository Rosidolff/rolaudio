import { useEffect, useRef } from 'react';
import { Howl } from 'howler';
import { useAppStore } from '../store';

export const AudioEngine = () => {
    const {
        activeMusic,
        isPlayingMusic,
        masterVolume,
        activeAmbience
    } = useAppStore();

    // Refs to hold Howl instances
    const musicHowlRef = useRef<Howl | null>(null);
    const ambienceHowlsRef = useRef<Map<string, Howl>>(new Map());

    // --- Music Logic ---
    useEffect(() => {
        // If there's no active music, stop current and return
        if (!activeMusic) {
            if (musicHowlRef.current) {
                musicHowlRef.current.fade(musicHowlRef.current.volume(), 0, 1000);
                setTimeout(() => {
                    musicHowlRef.current?.stop();
                    musicHowlRef.current = null;
                }, 1000);
            }
            return;
        }

        // If same track is already loaded, just handle play/pause
        if (musicHowlRef.current && (musicHowlRef.current as any)._src.includes(activeMusic.url)) {
            if (isPlayingMusic) {
                if (!musicHowlRef.current.playing()) {
                    musicHowlRef.current.play();
                    musicHowlRef.current.fade(0, (masterVolume / 100), 1000);
                }
            } else {
                musicHowlRef.current.pause();
            }
            return;
        }

        // New track selected: Fade out old, load new
        if (musicHowlRef.current) {
            const oldHowl = musicHowlRef.current;
            oldHowl.fade(oldHowl.volume(), 0, 1000);
            setTimeout(() => oldHowl.stop(), 1000);
        }

        if (isPlayingMusic) {
            const newHowl = new Howl({
                src: [activeMusic.url],
                html5: true, // Force HTML5 Audio for large files
                loop: true,
                volume: 0, // Start at 0 for fade in
                onloaderror: (_id, err) => console.error('Music Load Error:', err),
                onplayerror: (_id, err) => console.error('Music Play Error:', err)
            });

            musicHowlRef.current = newHowl;
            newHowl.play();
            newHowl.fade(0, (masterVolume / 100), 2000);
        }

    }, [activeMusic, isPlayingMusic]);

    // Update Music Volume when Master Volume changes
    useEffect(() => {
        if (musicHowlRef.current) {
            musicHowlRef.current.volume(masterVolume / 100);
        }
    }, [masterVolume]);


    // --- Ambience Logic ---
    useEffect(() => {
        // 1. Remove tracks that are no longer in activeAmbience
        const currentIds = new Set(activeAmbience.map(a => a.instanceId));

        ambienceHowlsRef.current.forEach((howl, id) => {
            if (!currentIds.has(id)) {
                howl.fade(howl.volume(), 0, 1000);
                setTimeout(() => {
                    howl.stop();
                    howl.unload();
                }, 1000);
                ambienceHowlsRef.current.delete(id);
            }
        });

        // 2. Add/Update tracks
        activeAmbience.forEach(amb => {
            let howl = ambienceHowlsRef.current.get(amb.instanceId);

            if (!howl) {
                // New ambience track
                howl = new Howl({
                    src: [amb.track.url],
                    html5: true,
                    loop: true,
                    volume: 0,
                });
                ambienceHowlsRef.current.set(amb.instanceId, howl);
                howl.play();
            }

            // Update volume/mute state
            const targetVol = amb.isMuted ? 0 : (amb.volume / 100) * (masterVolume / 100);

            // Smooth volume transition
            if (Math.abs(howl.volume() - targetVol) > 0.01) {
                howl.fade(howl.volume(), targetVol, 500);
            }
        });

    }, [activeAmbience, masterVolume]);

    return null; // Logic only component
};
