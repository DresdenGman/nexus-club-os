import { askAI as apiAskAI } from '../api';

export async function askAI(prompt: string, context?: string) {
  try {
    return await apiAskAI(prompt, context);
  } catch (error) {
    console.error('AI Error:', error);
    return 'SYSTEM ERROR: FAILED TO PROCESS AI QUERY. PLEASE CHECK BACKEND CONNECTIVITY.';
  }
}

export async function generateClubDescription(clubName: string, category: string) {
  const prompt = `Generate a compelling and professional description for a student club named '${clubName}' in the '${category}' category. Keep it under 100 words.`;
  return askAI(prompt);
}
