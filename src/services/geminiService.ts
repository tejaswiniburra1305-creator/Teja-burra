import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeClassroomImage(base64Image: string): Promise<AIAnalysisResult> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              text: `Analyze this classroom image for student attention and engagement. 
              Identify specific students if possible and provide feedback for each.
              Provide a JSON response with the following structure:
              {
                "overallScore": number (0-100),
                "studentCount": number,
                "distractedCount": number,
                "summary": string (brief overview of classroom state),
                "recommendations": string[] (actions for the teacher),
                "studentIdentifications": [
                  {
                    "name": string,
                    "status": "focused" | "distracted" | "idle",
                    "score": number,
                    "feedback": string
                  }
                ]
              }`
            },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.NUMBER },
            studentCount: { type: Type.NUMBER },
            distractedCount: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            studentIdentifications: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  status: { type: Type.STRING, enum: ["focused", "distracted", "idle"] },
                  score: { type: Type.NUMBER },
                  feedback: { type: Type.STRING }
                },
                required: ["name", "status", "score", "feedback"]
              }
            }
          },
          required: ["overallScore", "studentCount", "distractedCount", "summary", "recommendations"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Analysis failed:", error);
    throw error;
  }
}
