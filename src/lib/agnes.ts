const AGNES_API_KEY = process.env.AGNES_API_KEY || '';
const AGNES_BASE = 'https://apihub.agnes-ai.com/v1';
const AGNES_MODEL = 'agnes-1.5-flash'; // free model

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function chat(messages: ChatMessage[], maxTokens = 500): Promise<string> {
  if (!AGNES_API_KEY) {
    return "SYSTEM ERROR: AGNES_API_KEY NOT CONFIGURED. SET IT IN .env.local";
  }

  try {
    const response = await fetch(`${AGNES_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AGNES_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: AGNES_MODEL,
        messages,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Agnes AI Error:', response.status, errText);
      return `SYSTEM ERROR: AGNES API RETURNED ${response.status}. CHECK API KEY AND MODEL AVAILABILITY.`;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'SYSTEM ERROR: EMPTY RESPONSE FROM AGNES.';
  } catch (error) {
    console.error('Agnes AI Error:', error);
    return 'SYSTEM ERROR: FAILED TO REACH AGNES API. CHECK NETWORK CONNECTIVITY.';
  }
}

export async function askAI(prompt: string, context?: string): Promise<string> {
  const systemPrompt = "You are the 'Nexus OS Assistant', a specialized AI for managing university clubs. Your tone is professional, technical, and slightly brutalist. Help users with club registration, event planning, and administrative tasks. Be concise.";

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
  ];

  if (context) {
    messages.push({ role: 'user', content: `${context}\n\nUser Question: ${prompt}` });
  } else {
    messages.push({ role: 'user', content: prompt });
  }

  return chat(messages);
}

export async function generateClubDescription(clubName: string, category: string): Promise<string> {
  const prompt = `Generate a compelling and professional description for a student club named '${clubName}' in the '${category}' category. Keep it under 100 words.`;
  return askAI(prompt);
}
