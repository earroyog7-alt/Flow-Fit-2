
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateCustomRoutine = async (goal: string, level: string, time: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Como entrenador experto en salto de cuerda, crea una rutina de ${time} minutos para alguien de nivel ${level} con el objetivo de ${goal}. 
      Devuelve la respuesta en formato JSON con la siguiente estructura: 
      { "title": string, "warmup": string, "mainSet": string[], "cooldown": string, "proTip": string }`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            warmup: { type: Type.STRING },
            mainSet: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            cooldown: { type: Type.STRING },
            proTip: { type: Type.STRING }
          },
          required: ["title", "warmup", "mainSet", "cooldown", "proTip"]
        }
      }
    });

    const jsonStr = response.text || '{}';
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error generating routine:", error);
    return null;
  }
};

export const generateAiImage = async (prompt: string, aspectRatio: string) => {
  try {
    const aiImage = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const validRatios = ["1:1", "3:4", "4:3", "9:16", "16:9"];
    const ratioToUse = validRatios.includes(aspectRatio) ? aspectRatio : "1:1";

    const response = await aiImage.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: `A highly motivational fitness photo related to jumping rope: ${prompt}` }],
      },
      config: {
        imageConfig: {
          aspectRatio: ratioToUse as any,
          imageSize: "1K"
        },
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error: any) {
    console.error("Error generating image:", error);
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("KEY_RESET");
    }
    throw error;
  }
};

export const editAiImage = async (base64DataUrl: string, prompt: string) => {
  try {
    const aiEdit = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Extract base64 data and mime type
    const matches = base64DataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) throw new Error("Invalid image format");
    
    const mimeType = matches[1];
    const data = matches[2];

    const response = await aiEdit.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: data,
              mimeType: mimeType,
            },
          },
          {
            text: `Edit this fitness image based on this request: ${prompt}. Keep it professional and motivational.`,
          },
        ],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error: any) {
    console.error("Error editing image:", error);
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("KEY_RESET");
    }
    throw error;
  }
};

export const createChatSession = () => {
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: 'Eres FlowBot, el entrenador virtual experto de Flow Fit. Tu objetivo es motivar y guiar a los usuarios en su entrenamiento de salto con cuerda. Eres enérgico, profesional y das consejos técnicos precisos sobre postura, tipos de cuerdas y rutinas.',
    },
  });
};
