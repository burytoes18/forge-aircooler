import 'server-only';
import Anthropic from '@anthropic-ai/sdk';

const DEFAULT_MODEL = 'claude-sonnet-4-6';
const DEEP_MODEL = 'claude-opus-4-7';

export function getAnthropic() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('Missing ANTHROPIC_API_KEY');
  return new Anthropic({ apiKey: key });
}

export function webSearchTool(maxUses = 5): any {
  return {
    type: 'web_search_20250305',
    name: 'web_search',
    max_uses: maxUses,
    user_location: {
      type: 'approximate',
      city: process.env.USER_LOCATION_CITY || 'Bengaluru',
      region: process.env.USER_LOCATION_REGION || 'Karnataka',
      country: process.env.USER_LOCATION_COUNTRY || 'IN',
      timezone: 'Asia/Kolkata',
    },
  };
}

export const MODELS = { DEFAULT: DEFAULT_MODEL, DEEP: DEEP_MODEL };