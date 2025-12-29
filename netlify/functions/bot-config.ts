import { Context } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

// Bot Config storage function - stores and retrieves bot configurations including API keys
export default async (request: Request, context: Context) => {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
        });
    }

    const url = new URL(request.url);
    const botId = url.searchParams.get('botId');

    if (!botId) {
        return new Response(JSON.stringify({ error: 'botId is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
    }

    try {
        const store = getStore('bot-configs');

        // GET - Retrieve bot config
        if (request.method === 'GET') {
            const configJson = await store.get(botId, { type: 'text' });

            if (!configJson) {
                return new Response(JSON.stringify({ error: 'Bot not found' }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                });
            }

            const config = JSON.parse(configJson);

            // Return full config including API keys (for chat function internal use)
            // The admin key check can be added for external access if needed
            return new Response(JSON.stringify({ success: true, config }), {
                status: 200,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            });
        }

        // POST - Save bot config
        if (request.method === 'POST') {
            const body = await request.json();
            const { config } = body;

            if (!config) {
                return new Response(JSON.stringify({ error: 'config is required' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                });
            }

            // Store the config (including API keys) in Netlify Blobs
            await store.set(botId, JSON.stringify(config));

            console.log(`✅ Bot config saved for ${botId}`);

            return new Response(JSON.stringify({
                success: true,
                message: 'Bot config saved',
                botId
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            });
        }

        // DELETE - Remove bot config
        if (request.method === 'DELETE') {
            await store.delete(botId);

            return new Response(JSON.stringify({
                success: true,
                message: 'Bot config deleted',
                botId
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            });
        }

        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });

    } catch (error: any) {
        console.error('Bot config error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to process bot config request',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
    }
};
