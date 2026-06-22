
import crypto from 'crypto';
import { readFileSync } from 'fs';
const raw = readFileSync(new URL('./.env', import.meta.url), 'utf8');
for (const line of raw.split('\n')) {
  if (line.startsWith('AGNES_API_KEY=***    key = line.split('=', 1)[1].trim();
    console.log('AGNES MD5:', crypto.createHash('md5').update(key).digest('hex'));
    console.log('AGNES Len:', key.length);
    break;
  }
}
