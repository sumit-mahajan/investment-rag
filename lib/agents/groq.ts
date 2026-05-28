import { ChatGroq } from "@langchain/groq";

let model: ChatGroq | null = null;

export function getGroqModel(): ChatGroq {
  if (!model) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not set");
    }
    model = new ChatGroq({
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return model;
}
