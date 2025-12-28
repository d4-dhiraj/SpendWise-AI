import { GoogleGenAI, Type } from "@google/genai";
import { ClassificationResponse, Category, Transaction, RunwayAnalysis, GoalStrategy, TransactionType, ComparisonData } from "../types";

// Always use process.env.API_KEY directly as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Models for different tasks
const FAST_MODEL = 'gemini-3-flash-preview';
const PRO_MODEL = 'gemini-3-pro-preview';

// Helper to extract JSON from model output
const extractJson = (text: string | undefined) => {
  if (!text) return {};
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : text);
  } catch (e) {
    console.error("JSON extraction failed", e);
    return {};
  }
};

export const classifySmsWithGemini = async (smsText: string, userLoc?: { lat: number, lng: number }): Promise<ClassificationResponse> => {
  try {
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: `Classify this bank message and extract transaction details: "${smsText}"`,
      config: {
        systemInstruction: "Extract: Amount (number), Merchant (name), Category (Food, Travel, Fun, Academic, Other), and Type (credit/debit). Return strictly as a JSON object with fields: amount, merchant, category, type.",
        responseMimeType: "application/json"
      }
    });

    const data = extractJson(response.text);
    const validCategory = Object.values(Category).find(
      cat => cat.toLowerCase() === (data.category || '').toLowerCase()
    ) || Category.OTHER;
    
    return {
      amount: Number(data.amount) || 0,
      merchant: data.merchant || "Unknown Entity",
      category: validCategory as Category,
      type: (data.type?.toLowerCase() === 'credit' ? 'credit' : 'debit') as TransactionType,
      location: userLoc || undefined
    };
  } catch (error) {
    console.error("SMS Classification error:", error);
    throw error;
  }
};

export const getPeerComparison = async (transactions: Transaction[]): Promise<ComparisonData[]> => {
  try {
    const userSpend = Object.values(Category).map(cat => ({
      category: cat,
      amount: transactions.filter(t => t.category === cat && t.type === 'debit').reduce((s, t) => s + t.amount, 0)
    }));

    const response = await ai.models.generateContent({
      model: PRO_MODEL,
      contents: `User Spending: ${JSON.stringify(userSpend)}. Provide average peer benchmarks.`,
      config: {
        systemInstruction: "Generate realistic 'average student' monthly spending benchmarks for these categories. Provide a comparison JSON with: category, userAmount, peerAmount, and insight.",
        responseMimeType: "application/json"
      }
    });

    return extractJson(response.text);
  } catch (error) {
    console.error("Peer comparison error:", error);
    return [];
  }
};

export const getFinancialRunwayAnalysis = async (transactions: Transaction[], currentBalance: number): Promise<RunwayAnalysis> => {
  try {
    const history = transactions.map(t => ({ date: t.date, amount: t.amount, category: t.category, type: t.type }));
    
    const response = await ai.models.generateContent({
      model: PRO_MODEL,
      contents: `Transactions: ${JSON.stringify(history)}. Balance: $${currentBalance}.`,
      config: {
        systemInstruction: "Analyze runway based on history and balance. Return JSON: zeroDate (ISO string), daysRemaining (number), burnRatePerDay (number), warningLevel (1-10), advice (string).",
        responseMimeType: "application/json"
      }
    });
    return extractJson(response.text);
  } catch (error) {
    console.error("Runway analysis error:", error);
    return { zeroDate: '', daysRemaining: 0, burnRatePerDay: 0, warningLevel: 0, advice: 'Calculation failed' };
  }
};

export const getAIBuddyFeedback = async (stats: { funTotal: number, totalSpent: number, streak: number }): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: `Stats: Fun $${stats.funTotal}, Total $${stats.totalSpent}, Streak ${stats.streak}.`,
      config: {
        systemInstruction: "You are Balthazar, a witty AI owl financial counselor. Give 1-2 punchy feedback sentences based on the user's spending stats.",
      }
    });
    return response.text || "Watch your wallet.";
  } catch (error) {
    console.error("AI Buddy feedback error:", error);
    return "I'm keeping an eye on your expenses.";
  }
};

export const getSavingsTipFromGemini = async (transactions: Transaction[]): Promise<string> => {
  try {
    const summary = transactions.slice(0, 5).map(t => `${t.merchant} ($${t.amount})`).join(', ');
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: `Expenses: ${summary}. Give one actionable saving tip.`,
      config: { systemInstruction: "Witty student financial advisor. 1 short tip." }
    });
    return response.text || "Save more.";
  } catch (error) {
    console.error("Savings tip error:", error);
    return "Consider tracking every penny.";
  }
};

export const getSavingsGoalStrategy = async (transactions: Transaction[], goalAmount: number, goalTitle: string): Promise<GoalStrategy> => {
  try {
    const history = transactions.filter(t => t.type === 'debit').slice(0, 10);
    const response = await ai.models.generateContent({
      model: PRO_MODEL,
      contents: `Goal: ${goalAmount} for ${goalTitle}. History: ${JSON.stringify(history)}`,
      config: {
        systemInstruction: "Suggest one specific item to skip from the user's history to reach the goal. Return JSON: itemToSkip, avgCostPerItem, skipsRequired, encouragement.",
        responseMimeType: "application/json"
      }
    });
    return extractJson(response.text);
  } catch (error) {
    console.error("Savings goal strategy error:", error);
    return {
      itemToSkip: 'discretionary items',
      avgCostPerItem: 0,
      skipsRequired: 0,
      encouragement: 'Every little bit counts!'
    };
  }
};

export const classifyReceiptWithGemini = async (base64Image: string, mimeType: string): Promise<ClassificationResponse> => {
  try {
    const response = await ai.models.generateContent({
      model: FAST_MODEL,
      contents: { 
        parts: [
          { inlineData: { data: base64Image, mimeType } }, 
          { text: "Extract receipt data: Merchant, Amount, Category, Type. Return as JSON." }
        ] 
      },
      config: {
        systemInstruction: "Extract Amount (number), Merchant (string), Category (Food/Travel/Fun/Academic/Other), and Type (debit/credit). Return strictly as a JSON object.",
        responseMimeType: "application/json"
      }
    });
    const data = extractJson(response.text);
    
    // Validate category
    const validCategory = Object.values(Category).find(
      cat => cat.toLowerCase() === (data.category || 'other').toLowerCase()
    ) || Category.OTHER;
    
    return {
      amount: Number(data.amount) || 0,
      merchant: data.merchant || "Unknown",
      category: validCategory as Category,
      type: (data.type?.toLowerCase() === 'credit' ? 'credit' : 'debit') as TransactionType
    };
  } catch (error) {
    console.error("Receipt classification error:", error);
    throw error;
  }
};