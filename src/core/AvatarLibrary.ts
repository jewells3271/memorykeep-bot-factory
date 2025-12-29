/**
 * Avatar Library Service
 * Manages saved avatars that can be reused across bots
 * Uses localStorage locally, Netlify Blobs when deployed
 */

export interface SavedAvatar {
    id: string;
    name: string;
    imageData: string; // base64 data URL
    createdAt: string;
}

const AVATARS_KEY = 'mkbf_avatar_library';

// Default preset avatars
export const PRESET_AVATARS: SavedAvatar[] = [
    {
        id: 'preset-robot',
        name: 'Robot',
        imageData: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM2MzY2ZjEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSIzIiB5PSIxMSIgd2lkdGg9IjE4IiBoZWlnaHQ9IjEwIiByeD0iMiIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iNSIgcj0iMiIvPjxwYXRoIGQ9Ik0xMiA3djQiLz48bGluZSB4MT0iOCIgeTE9IjE2IiB4Mj0iOCIgeTI9IjE2Ii8+PGxpbmUgeDE9IjE2IiB5MT0iMTYiIHgyPSIxNiIgeTI9IjE2Ii8+PC9zdmc+',
        createdAt: '2024-01-01T00:00:00Z'
    },
    {
        id: 'preset-support',
        name: 'Support Agent',
        imageData: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMxMGI5ODEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTggMTYuOTJhNS41MDQgNS41MDQgMCAwIDAtMi41NjctLjU0OGMtLjI1MyAwLS41IC4wMjEtLjc0My4wNjIiLz48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTAiIHI9IjMiLz48cGF0aCBkPSJNNyAyMC42NjJWMTlhMiAyIDAgMCAxIDItMmg2YTIgMiAwIDAgMSAyIDJ2MS42NjIiLz48bGluZSB4MT0iNCIgeTE9IjQiIHgyPSI0IiB5Mj0iNCIvPjwvc3ZnPg==',
        createdAt: '2024-01-01T00:00:00Z'
    },
    {
        id: 'preset-bot-blue',
        name: 'Bot (Blue)',
        imageData: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjM2I4MmY2IiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMSI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTEiIGZpbGw9IiMzYjgyZjYiLz48Y2lyY2xlIGN4PSI5IiBjeT0iMTAiIHI9IjIiIGZpbGw9IiNmZmYiLz48Y2lyY2xlIGN4PSIxNSIgY3k9IjEwIiByPSIyIiBmaWxsPSIjZmZmIi8+PHBhdGggZD0iTTggMTVjMCAwIDIgMyA0IDMgMiAwIDQtMyA0LTMiIHN0cm9rZT0iI2ZmZiIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+',
        createdAt: '2024-01-01T00:00:00Z'
    },
    {
        id: 'preset-user',
        name: 'User',
        imageData: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM2YjcyODAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjgiIHI9IjQiLz48cGF0aCBkPSJNMjAgMjF2LTJhNCA0IDAgMCAwLTQtNEg4YTQgNCAwIDAgMC00IDR2MiIvPjwvc3ZnPg==',
        createdAt: '2024-01-01T00:00:00Z'
    },
    {
        id: 'preset-user-purple',
        name: 'User (Purple)',
        imageData: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjOGI1Y2Y2IiBzdHJva2U9IiNmZmYiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjExIiBmaWxsPSIjOGI1Y2Y2Ii8+PGNpcmNsZSBjeD0iMTIiIGN5PSI5IiByPSIzIiBmaWxsPSIjZmZmIi8+PHBhdGggZD0iTTE4IDE5Yy0uNS0yLjUtMy00LTYtNHMtNS41IDEuNS02IDQiIHN0cm9rZT0iI2ZmZiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==',
        createdAt: '2024-01-01T00:00:00Z'
    },
    {
        id: 'preset-sparkle',
        name: 'AI Sparkle',
        imageData: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjZjU5ZTBiIiBzdHJva2U9IiNmNTllMGIiIHN0cm9rZS13aWR0aD0iMiI+PHBhdGggZD0iTTEyIDNsMS41IDQuNUwxOCA5bC00LjUgMS41TDEyIDEybC0xLjUtMS41TDYgOWw0LjUtMS41TDEyIDN6Ii8+PHBhdGggZD0iTTUgMTVsLjc1IDIuMjVMMTggMThsLTIuMjUuNzVMNSAyMWwuNzUtMi4yNUwzIDE4bDIuMjUtLjc1TDUgMTV6IiBvcGFjaXR5PSIuNyIvPjwvc3ZnPg==',
        createdAt: '2024-01-01T00:00:00Z'
    }
];

export class AvatarLibrary {
    /**
     * Get API base URL from environment
     */
    private static getApiBaseUrl(): string {
        // Check for production deployment
        if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
            return '/.netlify/functions';
        }
        return '';
    }

    /**
     * Get all saved avatars (presets + custom)
     */
    static async getAvatars(): Promise<SavedAvatar[]> {
        const customAvatars = await this.getCustomAvatars();
        return [...PRESET_AVATARS, ...customAvatars];
    }

    /**
     * Get only custom (user-saved) avatars
     */
    static async getCustomAvatars(): Promise<SavedAvatar[]> {
        const apiBase = this.getApiBaseUrl();

        // Try Netlify first if deployed
        if (apiBase) {
            try {
                const response = await fetch(`${apiBase}/avatars`);
                if (response.ok) {
                    const data = await response.json();
                    return data.avatars || [];
                }
            } catch (e) {
                console.warn('Netlify avatars not available, falling back to localStorage');
            }
        }

        // Fallback to localStorage
        try {
            const stored = localStorage.getItem(AVATARS_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Failed to load avatars from localStorage:', e);
            return [];
        }
    }

    /**
     * Save a new avatar to the library
     */
    static async saveAvatar(name: string, imageData: string): Promise<SavedAvatar> {
        const newAvatar: SavedAvatar = {
            id: `avatar-${Date.now()}`,
            name: name.trim() || 'Custom Avatar',
            imageData,
            createdAt: new Date().toISOString()
        };

        const apiBase = this.getApiBaseUrl();

        // Try Netlify first if deployed
        if (apiBase) {
            try {
                const response = await fetch(`${apiBase}/avatars`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newAvatar)
                });
                if (response.ok) {
                    return newAvatar;
                }
            } catch (e) {
                console.warn('Netlify save failed, falling back to localStorage');
            }
        }

        // Fallback to localStorage
        try {
            const existing = await this.getCustomAvatars();
            existing.push(newAvatar);
            localStorage.setItem(AVATARS_KEY, JSON.stringify(existing));
        } catch (e) {
            console.error('Failed to save avatar:', e);
            throw e;
        }

        return newAvatar;
    }

    /**
     * Delete an avatar from the library
     */
    static async deleteAvatar(id: string): Promise<void> {
        // Don't allow deleting presets
        if (id.startsWith('preset-')) {
            throw new Error('Cannot delete preset avatars');
        }

        const apiBase = this.getApiBaseUrl();

        // Try Netlify first if deployed
        if (apiBase) {
            try {
                const response = await fetch(`${apiBase}/avatars?id=${id}`, {
                    method: 'DELETE'
                });
                if (response.ok) {
                    return;
                }
            } catch (e) {
                console.warn('Netlify delete failed, falling back to localStorage');
            }
        }

        // Fallback to localStorage
        try {
            const existing = await this.getCustomAvatars();
            const filtered = existing.filter(a => a.id !== id);
            localStorage.setItem(AVATARS_KEY, JSON.stringify(filtered));
        } catch (e) {
            console.error('Failed to delete avatar:', e);
            throw e;
        }
    }

    /**
     * Get a specific avatar by ID
     */
    static async getAvatarById(id: string): Promise<SavedAvatar | null> {
        const all = await this.getAvatars();
        return all.find(a => a.id === id) || null;
    }
}
