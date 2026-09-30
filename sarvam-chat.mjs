import { SarvamAIClient } from "sarvamai";

const apiKey = process.env.SARVAM_API_KEY;
if (!apiKey) {
  throw new Error("Set SARVAM_API_KEY in .env before running this script.");
}

const client = new SarvamAIClient({ apiSubscriptionKey: apiKey });
const response = await client.chat.completions({
  model: "sarvam-105b-conversations",
  messages: [{ role: "user", content: "Say hello in one sentence." }],
});

console.log(response.choices[0]?.message.content);
