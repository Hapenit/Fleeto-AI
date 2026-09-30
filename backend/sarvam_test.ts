import { SarvamAIClient } from 'sarvamai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.SARVAM_API_KEY;

if (!apiKey) {
    console.error("Error: SARVAM_API_KEY is not set in the environment.");
    process.exit(1);
}

const sarvam = new SarvamAIClient({
    apiKey: apiKey,
});

async function main() {
    try {
        console.log("Sending request to sarvam-105b-conversations...");
        
        const response = await sarvam.chat.completions({
            model: 'sarvam-105b-conversations',
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful assistant.'
                },
                {
                    role: 'user',
                    content: 'Hello, what is your name?'
                }
            ],
            temperature: 0.7,
        });

        console.log("Response:");
        console.log(response.choices[0].message.content);
    } catch (error) {
        console.error("API Call failed:", error);
    }
}

main();
