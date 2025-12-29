import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

interface SavedAvatar {
    id: string;
    name: string;
    imageData: string;
    createdAt: string;
}

const STORE_NAME = 'avatars';
const AVATARS_INDEX = 'avatars-index';

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }

    try {
        const store = getStore(STORE_NAME);

        // GET - List all avatars
        if (event.httpMethod === 'GET') {
            try {
                const indexData = await store.get(AVATARS_INDEX, { type: 'json' });
                const avatars: SavedAvatar[] = indexData || [];
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ avatars })
                };
            } catch (e) {
                // No avatars yet
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ avatars: [] })
                };
            }
        }

        // POST - Save new avatar
        if (event.httpMethod === 'POST') {
            if (!event.body) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Request body required' })
                };
            }

            const avatar: SavedAvatar = JSON.parse(event.body);

            if (!avatar.id || !avatar.imageData) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Avatar id and imageData required' })
                };
            }

            // Get existing avatars
            let avatars: SavedAvatar[] = [];
            try {
                const indexData = await store.get(AVATARS_INDEX, { type: 'json' });
                avatars = indexData || [];
            } catch (e) {
                avatars = [];
            }

            // Add new avatar
            avatars.push(avatar);

            // Save updated index
            await store.setJSON(AVATARS_INDEX, avatars);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, avatar })
            };
        }

        // DELETE - Remove avatar
        if (event.httpMethod === 'DELETE') {
            const params = new URLSearchParams(event.rawQuery || '');
            const id = params.get('id');

            if (!id) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Avatar id required' })
                };
            }

            // Get existing avatars
            let avatars: SavedAvatar[] = [];
            try {
                const indexData = await store.get(AVATARS_INDEX, { type: 'json' });
                avatars = indexData || [];
            } catch (e) {
                avatars = [];
            }

            // Filter out deleted avatar
            const filtered = avatars.filter(a => a.id !== id);

            // Save updated index
            await store.setJSON(AVATARS_INDEX, filtered);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true })
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };

    } catch (error) {
        console.error('Avatar function error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};
