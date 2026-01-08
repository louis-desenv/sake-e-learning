
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY as string;
if (!API_KEY) {
    console.warn("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const getTipOfTheDay = async (): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Provide a short, interesting English learning tip of the day. Make it practical and encouraging.',
        });
        return response.text;
    } catch (error) {
        console.error("Error fetching tip of the day:", error);
        return "Could not fetch a tip right now. Please try again later.";
    }
};



export const sendChatMessage = async (message: string, conversationHistory: string[] = [], topic?: string): Promise<string> => {
    const topicLabel = topic ? topic.replace(/-/g, ' ') : undefined;
    const basePrompt = topicLabel ? `You are an AI English tutor specializing in conversations about ${topicLabel}. ` : `You are an AI English tutor. `;
    try {
        const prompt = conversationHistory.length > 0
            ? `${basePrompt}Continue this conversation:\n${conversationHistory.join('\n')}\nUser: ${message}\nTutor:`
            : `${basePrompt}Respond to this message: ${message}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Error sending chat message:", error);
        return "Sorry, I couldn't process your message. Please try again.";
    }
};
