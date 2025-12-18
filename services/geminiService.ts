
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { ChatMessage } from "../types";

const API_KEY = process.env.API_KEY || '';

// Initialize client securely - assuming env var is present
const ai = new GoogleGenAI({ apiKey: API_KEY });

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
    model: 'gemini-2.5-flash',
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
            model: 'gemini-2.5-flash',
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
      model: 'gemini-2.5-flash',
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
