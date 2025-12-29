import { Context } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

// Chat proxy function that keeps API keys secure server-side
// Supports per-bot API keys stored in Netlify Blobs
export default async (request: Request, context: Context) => {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        });
    }

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
    }

    try {
        const body = await request.json();
        const { message, provider, model, systemPrompt, conversationMemory, temperature, maxTokens, botId } = body;

        if (!message) {
            return new Response(JSON.stringify({ error: 'Message is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            });
        }

        // Fetch bot config from Netlify Blobs to get API keys
        let botConfig: any = null;
        if (botId) {
            try {
                const store = getStore('bot-configs');
                const configJson = await store.get(botId, { type: 'text' });
                if (configJson) {
                    botConfig = JSON.parse(configJson);
                    console.log(`✅ Loaded config for bot ${botId}`);
                }
            } catch (e: any) {
                console.warn(`Could not load bot config: ${e.message}`);
            }
        }

        // Use provider from request, bot config, or default
        const selectedProvider = provider || botConfig?.settings?.aiProvider || 'gemini';
        let responseText: string;

        if (selectedProvider === 'gemini') {
            // Use Gemini API - try bot config first, then env var fallback
            const apiKey = botConfig?.settings?.geminiApiKey || process.env.GEMINI_API_KEY;
            if (!apiKey) {
                return new Response(JSON.stringify({ error: 'Gemini API key not configured for this bot' }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                });
            }

            const geminiModel = model || botConfig?.settings?.model || 'gemini-2.0-flash';
            const geminiSystemPrompt = systemPrompt || botConfig?.settings?.systemPrompt || 'You are a helpful AI assistant.';
            const contents = (conversationMemory || []).map((msg: any) => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            }));
            contents.push({ role: 'user', parts: [{ text: message }] });

            const geminiResponse = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents,
                        systemInstruction: { parts: [{ text: geminiSystemPrompt }] },
                        generationConfig: {
                            temperature: temperature || botConfig?.settings?.temperature || 0.7,
                            maxOutputTokens: maxTokens || botConfig?.settings?.maxTokens || 1000
                        }
                    })
                }
            );

            if (!geminiResponse.ok) {
                const errorText = await geminiResponse.text();
                throw new Error(`Gemini API error: ${errorText}`);
            }

            const geminiData = await geminiResponse.json();
            responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini';

        } else if (selectedProvider === 'openrouter') {
            // Use OpenRouter API - try bot config first, then env var fallback
            const apiKey = botConfig?.settings?.openRouterApiKey || process.env.OPENROUTER_API_KEY;
            if (!apiKey) {
                return new Response(JSON.stringify({ error: 'OpenRouter API key not configured for this bot' }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                });
            }

            const openRouterSystemPrompt = systemPrompt || botConfig?.settings?.systemPrompt || 'You are a helpful AI assistant.';
            const messages = [
                { role: 'system', content: openRouterSystemPrompt },
                ...(conversationMemory || []),
                { role: 'user', content: message }
            ];

            const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': request.headers.get('referer') || 'https://memorykeep.bot',
                    'X-Title': 'MemoryKeep Bot'
                },
                body: JSON.stringify({
                    model: model || botConfig?.settings?.model || 'anthropic/claude-3-haiku',
                    messages,
                    max_tokens: maxTokens || botConfig?.settings?.maxTokens || 1000,
                    temperature: temperature || botConfig?.settings?.temperature || 0.7
                })
            });

            if (!openRouterResponse.ok) {
                const errorText = await openRouterResponse.text();
                throw new Error(`OpenRouter API error: ${errorText}`);
            }

            const openRouterData = await openRouterResponse.json();
            responseText = openRouterData.choices?.[0]?.message?.content || 'No response from OpenRouter';

        } else {
            return new Response(JSON.stringify({ error: `Unknown provider: ${selectedProvider}` }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            });
        }

        return new Response(JSON.stringify({
            success: true,
            response: responseText,
            provider: selectedProvider,
            model: model
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });

    } catch (error: any) {
        console.error('Chat proxy error:', error);
        return new Response(JSON.stringify({
            error: 'Failed to process chat request',
            details: error.message
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });
    }
};
