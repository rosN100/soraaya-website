import { OpenAIStream, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';
import { systemPrompt } from '../lib/system-prompt.js';

// Configure edge runtime
export const config = {
    runtime: 'edge',
};

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    try {
        const { messages } = await req.json();

        // Validate messages
        if (!messages || !Array.isArray(messages)) {
            return new Response('Invalid request body', { status: 400 });
        }

        // Limit conversation history to last 10 messages
        const recentMessages = messages.slice(-10);

        // Create chat completion with streaming
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini', // Cost-effective model
            stream: true,
            messages: [
                { role: 'system', content: systemPrompt },
                ...recentMessages,
            ],
            max_tokens: 500, // Limit response length
            temperature: 0.7, // Balanced creativity
        });

        // Convert the response into a friendly text-stream
        const stream = OpenAIStream(response, {
            onStart: async () => {
                // Log conversation start (for analytics)
                console.log('Chat started:', new Date().toISOString());
            },
            onCompletion: async (completion) => {
                // Log conversation completion (for analytics)
                console.log('Response:', completion);
            },
        });

        // Return the stream as a response
        return new StreamingTextResponse(stream);
    } catch (error) {
        console.error('Chat API error:', error);
        return new Response('Internal server error', { status: 500 });
    }
}
