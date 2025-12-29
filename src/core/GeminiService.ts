/**
 * Gemini API Service
 * Handles communication with Google's Gemini API for chat completions
 */

interface GeminiMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

interface GeminiSettings {
    apiKey: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
}

export class GeminiService {
    private static readonly API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

    // Available Gemini models
    static readonly MODELS = [
        { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Fast & Smart)' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Fast)' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Most Capable)' },
    ];

    /**
     * Convert OpenAI-style messages to Gemini format
     */
    private static convertToGeminiFormat(
        conversationHistory: Array<{ role: string; content: string }>,
        userMessage: string
    ): GeminiMessage[] {
        const geminiMessages: GeminiMessage[] = [];

        // Add conversation history
        for (const msg of conversationHistory) {
            geminiMessages.push({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            });
        }

        // Add the new user message
        geminiMessages.push({
            role: 'user',
            parts: [{ text: userMessage }]
        });

        return geminiMessages;
    }

    /**
     * Call the Gemini API for chat completions
     */
    static async chat(
        message: string,
        systemPrompt: string,
        conversationHistory: Array<{ role: string; content: string }>,
        settings: GeminiSettings
    ): Promise<string> {
        const model = settings.model || 'gemini-2.0-flash';
        const url = `${this.API_BASE}/models/${model}:generateContent?key=${settings.apiKey}`;

        // Build the contents array with conversation history
        const contents = this.convertToGeminiFormat(conversationHistory, message);

        const requestBody = {
            contents,
            systemInstruction: {
                parts: [{ text: systemPrompt || 'You are a helpful AI assistant. Be concise, friendly, and professional.' }]
            },
            generationConfig: {
                temperature: settings.temperature ?? 0.7,
                maxOutputTokens: settings.maxTokens ?? 1000,
            }
        };

        console.log('Making Gemini API call:', {
            url: url.replace(settings.apiKey, '***'),
            model,
            messageCount: contents.length
        });

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        console.log('Gemini response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini API error:', errorText);

            if (response.status === 400) {
                // Try to parse the error for more details
                try {
                    const errorJson = JSON.parse(errorText);
                    throw new Error(`Gemini Error: ${errorJson.error?.message || errorText}`);
                } catch {
                    throw new Error(`Gemini Error (400): ${errorText}`);
                }
            } else if (response.status === 401 || response.status === 403) {
                throw new Error('Invalid API key. Please check your Gemini API key in AI Settings.');
            } else if (response.status === 429) {
                throw new Error('Rate limit exceeded. Please wait a moment and try again.');
            } else {
                throw new Error(`Gemini API Error ${response.status}: ${errorText}`);
            }
        }

        const data = await response.json();
        console.log('Gemini response data:', data);

        if (!data.candidates || data.candidates.length === 0) {
            throw new Error('No response from Gemini model');
        }

        const candidate = data.candidates[0];

        // Check for blocked content
        if (candidate.finishReason === 'SAFETY') {
            throw new Error('Response was blocked due to safety filters.');
        }

        if (!candidate.content?.parts?.[0]?.text) {
            throw new Error('Empty response from Gemini model');
        }

        return candidate.content.parts[0].text;
    }

    /**
     * Test the API key by making a simple request
     */
    static async testConnection(apiKey: string): Promise<{ success: boolean; message: string }> {
        try {
            const response = await this.chat(
                'Say "Hello" in one word.',
                'You are a test bot. Respond with just one word.',
                [],
                { apiKey, model: 'gemini-2.0-flash', maxTokens: 10 }
            );

            return {
                success: true,
                message: `✅ Gemini API connected! Response: "${response.substring(0, 50)}"`
            };
        } catch (error: any) {
            return {
                success: false,
                message: `❌ ${error.message}`
            };
        }
    }
}
