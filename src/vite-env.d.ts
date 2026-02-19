/// <reference types="vite/client" />

interface Window {
    electron: {
        getBeatmaps: () => Promise<any[]>;
        openExternal: (url: string) => Promise<void>;
    }
}
