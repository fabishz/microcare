const MOOD_KEYWORDS: Record<string, string[]> = {
  calm: ['calm', 'peaceful', 'relaxed', 'steady'],
  anxious: ['anxious', 'worried', 'nervous', 'overwhelmed', 'stress'],
  sad: ['sad', 'down', 'lonely', 'hurt', 'grief'],
  happy: ['happy', 'grateful', 'excited', 'joy', 'content'],
  angry: ['angry', 'frustrated', 'irritated', 'upset'],
};

const STOPWORDS = new Set([
  'the', 'and', 'a', 'to', 'of', 'in', 'for', 'on', 'with', 'is', 'it', 'that', 'this', 'i', 'you', 'my', 'me',
  'we', 'our', 'your', 'was', 'were', 'are', 'be', 'been', 'but', 'or', 'as', 'at', 'by', 'so', 'if', 'from',
]);

export interface InsightResult {
  summary: string;
  themes: string[];
}

function detectMood(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [mood, keywords] of Object.entries(MOOD_KEYWORDS)) {
    if (keywords.some((keyword) => lower.includes(keyword))) {
      return mood;
    }
  }
  return null;
}

function extractThemes(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 3 && !STOPWORDS.has(word));

  const counts = new Map<string, number>();
  for (const word of words) {
    counts.set(word, (counts.get(word) || 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}

export function generateInsightFromEntry(content: string): InsightResult {
  const mood = detectMood(content);
  const themes = extractThemes(content);

  const moodLine = mood
    ? `You mentioned feeling ${mood}. It's okay to feel that way, and noticing it is a meaningful step.`
    : 'Your reflection shows thoughtful self-awareness.';

  const themeLine = themes.length > 0
    ? `A few recurring themes stood out: ${themes.join(', ')}.`
    : 'No clear themes stood out yet, and that is completely fine.';

  const growthLine = 'If you want, consider one small action that could support you today, even if it is just a pause to breathe.';

  return {
    summary: `${moodLine} ${themeLine} ${growthLine}`,
    themes,
  };
}
