import dotenv from 'dotenv';
import { readFileSync } from 'fs';

// Read raw .env
const raw = readFileSync('server/.env', 'utf8');
const match = raw.match(/AGNES_API_KEY=(.+)/);
const key = match ? match[1].trim() : '';

console.log('Key length:', key.length);
console.log('Key first 10:', key.slice(0,10));
console.log('Key last 10:', key.slice(-10));

// Test against Agnes
const resp = await fetch('https://apihub.agnes-ai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${key}`,
  },
  body: JSON.stringify({
    model: 'agnes-1.5-flash',
    messages: [{ role: 'user', content: 'Say hello' }],
    max_tokens: 50,
  }),
});

const data = await resp.json();
if (data.error) {
  console.log('ERROR:', JSON.stringify(data.error));
} else {
  console.log('SUCCESS:', data.choices[0].message.content);
}
