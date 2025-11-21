export type Frame = 'Fantasy' | 'Futurista' | 'Grim Dark';
export type TrackType = 'music' | 'ambience' | 'sfx';
export type PlaybackMode = 'loop' | 'sequential' | 'shuffle';

export interface Track {
    id: string;
    name: string;
    url: string;
    type: TrackType;
    frame?: Frame; // If undefined, it's Global
    category?: string; 
    subcategory?: string; 
    duration?: number;
}

export interface ActiveAmbience {
    instanceId: string;
    track: Track;
    volume: number;
    isMuted: boolean;
}

export interface AmbiencePreset {
    id: string;
    name: string;
    frame: Frame;
    tracks: { trackId: string; volume: number }[];
}

export interface Playlist {
    id: string;
    name: string;
    tracks: Track[];
}

// ELIMINADA: Categoría 'General'
export const MUSIC_CATEGORIES: Record<string, string[]> = {
    'Acción': ['Combate', 'Persecución', 'Clímax', 'Asedio'],
    'Cotidiano': ['Hoguera', 'Taberna', 'Viaje', 'Mercado'],
    'Misterio': ['Investigación', 'Sigilo', 'Conspiración', 'Descubrimiento'],
    'Terror': ['Misterio', 'Horror', 'Tensión', 'Encuentro Sobrenatural'],
    'Exploración': ['Bosque', 'Ruinas', 'Mar', 'Desierto', 'Montañas'],
    'Drama': ['Intriga', 'Ceremonia', 'Duelo', 'Revelación']
};

export const SFX_CATEGORIES = [
    'Combate', 'Social', 'Entorno', 'Misterio', 'Magia', 'Tecnología'
] as const;