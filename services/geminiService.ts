
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getVidaNovaMessage = async (fragmentsCount: number): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `O jogador está em um jogo poético cristão chamado "Vida Nova". 
      Ele renunciou ao seu próprio peso (ego, passado) e coletou ${fragmentsCount} virtudes bíblicas. 
      Agora ele encontrou a "Vida Nova" (representação da regeneração em Cristo).
      Gere uma mensagem curta, solene e bíblica em Português (Brasil) sobre o fim das coisas velhas e o início das novas. 
      Máximo de 20 palavras.`,
    });
    return response.text || "As coisas velhas passaram. O meu amor faz tudo novo agora.";
  } catch (error) {
    console.error("Error fetching Gemini message:", error);
    return "Eis que faço novas todas as coisas. Entre no meu repouso.";
  }
};