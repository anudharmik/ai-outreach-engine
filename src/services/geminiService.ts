import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function generateOutreachMessage(
  leadName: string,
  company: string
) {
  const prompt = `
You are an outreach assistant.

Lead Name: ${leadName}
Company: ${company}

Generate a short personalized outreach message.
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return response.text ?? "";
}