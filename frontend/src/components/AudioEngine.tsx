import { useEffect, useRef } from 'react';
import { Howl } from 'howler';
import { useAppStore } from '../store';

export const AudioEngine = () => {
    const {
        activeMusic,
        isPlayingMusic,
        masterVolume,
        activeAmbience,
        seekRequest,
        setMusicProgress,
        requestSeek,
        activeSFXIds,
        sfxTrigger,
        sfxFinished
    } = useAppStore();

    const musicHowlRef = useRef<Howl | null>(null);
    const ambienceHowlsRef = useRef<Map<string, Howl>>(new Map());
    const sfxHowlsRef = useRef<Map<string, Howl>>(new Map());
    const rafRef = useRef<number | null>(null);

    const masterVolFactor = masterVolume / 100;

    // --- MÚSICA ---
    useEffect(() => {
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

        if (musicHowlRef.current && (musicHowlRef.current as any)._src.includes(activeMusic.url)) {
            if (isPlayingMusic) {
                if (!musicHowlRef.current.playing()) {
                    musicHowlRef.current.play();
                    musicHowlRef.current.fade(0, masterVolFactor, 1000);
                }
            } else {
                musicHowlRef.current.pause();
            }
            return;
        }

        if (musicHowlRef.current) {
            const oldHowl = musicHowlRef.current;
            oldHowl.fade(oldHowl.volume(), 0, 1000);
            setTimeout(() => oldHowl.stop(), 1000);
        }

        if (isPlayingMusic) {
            const newHowl = new Howl({
                src: [activeMusic.url],
                html5: true,
                loop: true,
                volume: 0,
                onloaderror: (_id, err) => console.error('Music Load Error:', err),
                onplayerror: (_id, err) => console.error('Music Play Error:', err)
            });

            musicHowlRef.current = newHowl;
            newHowl.play();
            newHowl.fade(0, masterVolFactor, 2000);
        }

    }, [activeMusic, isPlayingMusic]);

    useEffect(() => {
        if (musicHowlRef.current) {
            musicHowlRef.current.volume(masterVolFactor);
        }
    }, [masterVolume]);

    useEffect(() => {
        if (seekRequest !== null && musicHowlRef.current) {
            musicHowlRef.current.seek(seekRequest);
            requestSeek(null as any);
        }
    }, [seekRequest, requestSeek]);

    useEffect(() => {
        const updateProgress = () => {
            if (musicHowlRef.current && musicHowlRef.current.playing()) {
                const seek = musicHowlRef.current.seek();
                const duration = musicHowlRef.current.duration();
                if (typeof seek === 'number') {
                    setMusicProgress(seek, duration);
                }
            }
            rafRef.current = requestAnimationFrame(updateProgress);
        };

        if (isPlayingMusic) {
            rafRef.current = requestAnimationFrame(updateProgress);
        } else {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        }

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [isPlayingMusic, setMusicProgress]);


    // --- AMBIENTES ---
    useEffect(() => {
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

        activeAmbience.forEach(amb => {
            let howl = ambienceHowlsRef.current.get(amb.instanceId);

            if (!howl) {
                howl = new Howl({
                    src: [amb.track.url],
                    html5: true,
                    loop: true,
                    volume: 0,
                });
                ambienceHowlsRef.current.set(amb.instanceId, howl);
                howl.play();
            }

            const targetVol = amb.isMuted ? 0 : (amb.volume / 100) * masterVolFactor;

            if (Math.abs(howl.volume() - targetVol) > 0.01) {
                howl.fade(howl.volume(), targetVol, 300);
            }
        });

    }, [activeAmbience, masterVolume]);


    // --- SFX ---
    
    useEffect(() => {
        if (sfxTrigger) {
            const { track } = sfxTrigger;
            
            if (sfxHowlsRef.current.has(track.id)) {
                sfxHowlsRef.current.get(track.id)?.stop();
            }

            const sfx = new Howl({
                src: [track.url],
                volume: masterVolFactor,
                onend: () => {
                    sfxFinished(track.id);
                    sfxHowlsRef.current.delete(track.id);
                }
            });
            
            sfxHowlsRef.current.set(track.id, sfx);
            sfx.play();
        }
    }, [sfxTrigger]); // Ahora sí cambia gracias al triggerId

    useEffect(() => {
        sfxHowlsRef.current.forEach((howl, id) => {
            if (!activeSFXIds.includes(id)) {
                howl.stop();
                sfxHowlsRef.current.delete(id);
            } else {
                howl.volume(masterVolFactor);
            }
        });
    }, [activeSFXIds, masterVolume]);

    return null; 
};