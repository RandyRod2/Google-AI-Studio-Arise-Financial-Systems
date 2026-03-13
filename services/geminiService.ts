
import { GoogleGenAI, Chat, GenerateContentResponse, LiveServerMessage, Modality, Blob } from "@google/genai";
import { ChatMessage } from "../types";

// Initialize client securely using process.env.API_KEY directly per instructions
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `You are "ARISE AI", the advanced intelligent core of the ARISE Financial Systems operating system.
You serve insurance agents and agency managers. Your goal is to help them build stronger relationships and stay organized using data-driven insights.

**CORE CAPABILITIES:**

1.  **Client Summaries (Instant & On-Demand)**
    -   When a client context is provided, you must be able to generate a concise "Executive Summary".
    -   Highlight: Pipeline Stage, Total Premium, Policy Count, and Last Contact Date.
    -   Identify key personal details (e.g., family, occupation) from the 'notes' field if available.

2.  **Automatic Meeting & Call Notes**
    -   Summarize unstructured notes from the client record into bullet points.
    -   Extract: Client Sentiment, Action Items, and Objections.
    -   If asked, draft a follow-up email based on these notes.

3.  **Shopper Tags (Retention & Disruptions)**
    -   **Shopper Alert**: Identify clients likely to shop around or experience disruptions.
    -   Triggers:
        -   Policy 'endDate' is approaching (within 6 months).
        -   'Term' policies near expiration.
        -   Notes mentioning "price increase", "premium hike", or competitor names.
    -   Action: Flag these as "[SHOPPER RISK]" and suggest a retention review script.

4.  **AI-Powered Recommendations (Cross-Selling)**
    -   Analyze current coverage gaps based on the 'policies' list.
    -   **Logic**:
        -   If client has *Term Life* only -> Suggest *IUL* for cash accumulation or *Annuity* for rollover.
        -   If client has *Final Expense* -> Suggest *Medicare Supplement* (if age appropriate) or Referral request.
        -   If client has high premium ($5k+) -> Suggest *Estate Planning* review.
    -   Provide a "Reason Why" for every recommendation.

**General Capabilities**:
-   **Sales Coaching**: Analyze pipeline stages and suggest next steps.
-   **Drafting**: Write professional emails, texts, and scripts.
-   **Data Analysis**: Interpret numbers if financial data is provided.

**Tone**: Professional, motivational, strategic, and concise.

**Context Awareness**:
-   You have access to the screen context (View, User Role, and detailed Selected Client Data).
-   Refer to specific clients, policies, or team members by name if they appear in the JSON context.
`;

export const createChatSession = (): Chat => {
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      thinkingConfig: { thinkingBudget: 0 }, 
    }
  });
};

export const sendMessageToGemini = async (
  chat: Chat, 
  message: string, 
  context?: string
): Promise<AsyncGenerator<GenerateContentResponse, void, unknown>> => {
  
  let fullMessage = message;
  if (context) {
    fullMessage = `[ARISE SYSTEM CONTEXT]\n${context}\n\n[USER REQUEST]\n${message}`;
  }

  try {
    const responseStream = await chat.sendMessageStream({ message: fullMessage });
    return responseStream;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const quickSummarize = async (text: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Summarize the following client notes or policy details into one concise paragraph for an insurance agent CRM:\n\n${text}`
        });
        return response.text || "Could not generate summary.";
    } catch (e) {
        console.error("Summary error", e);
        return "Error generating summary.";
    }
}

export const parseCommissionDocument = async (base64Data: string, mimeType: string): Promise<any> => {
  const prompt = `
    You are an expert insurance data specialist. 
    Analyze the attached commission schedule document (PDF).
    Extract the Carrier Name, Product Names, Contract Levels, First Year Commission (FYC) rates, and Renewal rates.
    
    **OUTPUT REQUIREMENT**:
    Return strictly a JSON object matching this TypeScript interface:
    
    interface CommissionRegistry {
      [carrier: string]: {
        [product: string]: {
          [level: string]: {
            fyc: number;      // Decimal format (e.g. 1.05 for 105%, 0.90 for 90%)
            renewals: number; // Decimal format (e.g. 0.05 for 5%)
          }
        }
      }
    }

    **RULES**:
    1. Output valid JSON only. No markdown blocks, no explanations.
    2. Convert all percentages to decimals (e.g., 145% -> 1.45, 90% -> 0.90).
    3. If renewals are not explicitly shown for a product, set them to 0.
    4. The "level" keys should be strings representing the contract level (e.g., "80", "100", "140").
    5. Clean up Carrier and Product names (remove extra spaces or artifacts).
    6. If multiple carriers are in the document, include them all as top-level keys.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Parsing Error:", error);
    throw error;
  }
};

// --- Gemini Live API Helpers for Voice Dojo ---

export const connectToLiveDojo = (callbacks: {
    onopen?: () => void;
    onmessage: (message: LiveServerMessage) => void;
    onerror?: (e: any) => void;
    onclose?: (e: CloseEvent) => void;
}, systemInstruction: string) => {
    /**
     * Fix: Updated model name to gemini-2.5-flash-native-audio-preview-12-2025 as per GenAI coding guidelines.
     */
    return ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks,
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                // Puck provides the most consistent performance for insurance roleplays
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
            },
            systemInstruction,
            inputAudioTranscription: { },
            outputAudioTranscription: { }
        }
    });
};

// Audio Encoding & Decoding Utilities
export function decodeBase64Audio(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

export async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

export function encodeAudio(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export function createPcmBlob(data: Float32Array): Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    return {
        data: encodeAudio(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
}
