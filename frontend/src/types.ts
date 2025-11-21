export type Frame = 'Fantasy' | 'Futurista' | 'Grim Dark';

export type TrackType = 'music' | 'ambience' | 'sfx';

export interface Track {
    id: string;
    name: string;
    url: string; // Path to file
    type: TrackType;
    frame?: Frame; // If undefined, it's Global
    category?: string; // e.g., 'Action', 'Social'
    subcategory?: string; // e.g., 'Combate', 'Hoguera'
    duration?: number;
}

export interface ActiveAmbience {
    instanceId: string;
    track: Track;
    volume: number;
    isMuted: boolean;
}

export interface Playlist {
    id: string;
    name: string;
    tracks: Track[];
}

export const MUSIC_CATEGORIES: Record<string, string[]> = {
    'General': ['General'],
    'Acción': ['Combate', 'Persecución', 'Clímax', 'Asedio'],
    'Cotidiano': ['Hoguera', 'Taberna', 'Viaje', 'Mercado'],
    'Misterio': ['Investigación', 'Sigilo', 'Conspiración', 'Descubrimiento'],
    'Terror': ['Misterio', 'Horror', 'Tensión', 'Encuentro Sobrenatural'],
    'Exploración': ['Bosque', 'Ruinas', 'Mar', 'Desierto', 'Montañas'],
    'Drama': ['Intriga', 'Ceremonia', 'Duelo', 'Revelación'],
    'Ambiental': ['Lluvia', 'Viento', 'Fuego', 'Naturaleza']
};

export const SFX_CATEGORIES = [
    'Combate', 'Social', 'Entorno', 'Misterio', 'Magia', 'Tecnología'
] as const;
