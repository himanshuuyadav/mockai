type SentimentLabel = "positive" | "neutral" | "negative";

export type AnswerAnalysisReport = {
  transcript: string;
  fillerWordsCount: number;
  fillerWordBreakdown: Record<string, number>;
  speakingSpeedWpm: number;
  sentenceClarity: number;
  confidenceScore: number;
  sentiment: SentimentLabel;
  technicalDepth: number;
  improvementSuggestions: string[];
};

const FILLER_WORDS = [
  "um",
  "uh",
  "like",
  "you know",
  "basically",
  "actually",
  "literally",
  "kind of",
  "sort of",
] as const;

const POSITIVE_WORDS = ["confident", "delivered", "achieved", "improved", "led", "resolved", "success"];
const NEGATIVE_WORDS = ["maybe", "not sure", "guess", "probably", "fail", "failed", "difficult"];

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function countWordOccurrences(text: string, phrase: string) {
  const regex = new RegExp(`\\b${phrase.replace(/\s+/g, "\\s+")}\\b`, "gi");
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

function analyzeSentiment(text: string): SentimentLabel {
  const lower = text.toLowerCase();
  const positiveCount = POSITIVE_WORDS.reduce((acc, word) => acc + countWordOccurrences(lower, word), 0);
  const negativeCount = NEGATIVE_WORDS.reduce((acc, word) => acc + countWordOccurrences(lower, word), 0);

  if (positiveCount > negativeCount + 1) {
    return "positive";
  }
  if (negativeCount > positiveCount + 1) {
    return "negative";
  }
  return "neutral";
}

function countTechnicalSignals(text: string) {
  const lower = text.toLowerCase();
  const technicalKeywords = [
    "architecture",
    "scalable",
    "latency",
    "throughput",
    "database",
    "index",
    "cache",
    "api",
    "tradeoff",
    "complexity",
    "optimization",
    "microservice",
    "distributed",
    "system design",
  ];

  return technicalKeywords.reduce((acc, keyword) => acc + countWordOccurrences(lower, keyword), 0);
}

export function analyzeInterviewAnswer(transcript: string): AnswerAnalysisReport {
  const normalized = transcript.trim();
  const words = normalized ? normalized.split(/\s+/) : [];
  const wordCount = words.length;
  const estimatedMinutes = Math.max(1 / 6, wordCount / 130);

  const fillerWordBreakdown: Record<string, number> = {};
  let fillerWordsCount = 0;

  for (const filler of FILLER_WORDS) {
    const count = countWordOccurrences(normalized.toLowerCase(), filler);
    if (count > 0) {
      fillerWordBreakdown[filler] = count;
      fillerWordsCount += count;
    }
  }

  const sentenceCount = Math.max(1, normalized.split(/[.!?]+/).filter((s) => s.trim()).length);
  const avgWordsPerSentence = wordCount / sentenceCount;
  const fillerRatio = wordCount > 0 ? fillerWordsCount / wordCount : 0;
  const speakingSpeedWpm = wordCount / estimatedMinutes;
  const technicalSignals = countTechnicalSignals(normalized);
  const sentiment = analyzeSentiment(normalized);

  const sentenceClarity = clampScore(100 - Math.abs(avgWordsPerSentence - 18) * 2 - fillerRatio * 120);
  const confidenceScore = clampScore(75 - fillerRatio * 150 + (sentiment === "positive" ? 10 : sentiment === "negative" ? -10 : 0));
  const technicalDepth = clampScore(technicalSignals * 12 + Math.min(25, wordCount / 8));

  const improvementSuggestions: string[] = [];
  if (fillerWordsCount > 5) {
    improvementSuggestions.push("Reduce filler words by adding short pauses before key points.");
  }
  if (speakingSpeedWpm < 110) {
    improvementSuggestions.push("Increase speaking pace slightly to improve delivery energy.");
  } else if (speakingSpeedWpm > 170) {
    improvementSuggestions.push("Slow down a little to improve clarity and interviewer comprehension.");
  }
  if (sentenceClarity < 65) {
    improvementSuggestions.push("Use shorter sentence structures and one idea per sentence.");
  }
  if (technicalDepth < 55) {
    improvementSuggestions.push("Add deeper technical reasoning, tradeoffs, and measurable outcomes.");
  }
  if (!improvementSuggestions.length) {
    improvementSuggestions.push("Maintain this structure and add one quantified impact metric per answer.");
  }

  return {
    transcript: normalized,
    fillerWordsCount,
    fillerWordBreakdown,
    speakingSpeedWpm: Math.round(speakingSpeedWpm),
    sentenceClarity,
    confidenceScore,
    sentiment,
    technicalDepth,
    improvementSuggestions,
  };
}

export function buildFinalInterviewReport(analyses: AnswerAnalysisReport[]) {
  const validAnalyses = analyses.filter((item) => item.transcript);
  if (!validAnalyses.length) {
    return {
      confidenceScore: 0,
      speakingSpeedWpm: 0,
      technicalDepth: 0,
      fillerWordsCount: 0,
      sentiment: "neutral" as SentimentLabel,
      improvementSuggestions: ["No analyzed answers available."],
      timelineMarkers: [],
    };
  }

  const avg = (values: number[]) =>
    Math.round(values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length));

  const sentimentCounts = validAnalyses.reduce<Record<SentimentLabel, number>>(
    (acc, item) => {
      acc[item.sentiment] += 1;
      return acc;
    },
    { positive: 0, neutral: 0, negative: 0 },
  );

  const dominantSentiment = (Object.entries(sentimentCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    "neutral") as SentimentLabel;

  const suggestions = Array.from(
    new Set(validAnalyses.flatMap((item) => item.improvementSuggestions)),
  ).slice(0, 6);

  return {
    confidenceScore: avg(validAnalyses.map((item) => item.confidenceScore)),
    speakingSpeedWpm: avg(validAnalyses.map((item) => item.speakingSpeedWpm)),
    technicalDepth: avg(validAnalyses.map((item) => item.technicalDepth)),
    fillerWordsCount: validAnalyses.reduce((sum, item) => sum + item.fillerWordsCount, 0),
    sentiment: dominantSentiment,
    improvementSuggestions: suggestions,
    timelineMarkers: validAnalyses.map((item, index) => ({
      marker: `Q${index + 1}`,
      confidence: item.confidenceScore,
      clarity: item.sentenceClarity,
      technicalDepth: item.technicalDepth,
      fillerWords: item.fillerWordsCount,
      speakingSpeedWpm: item.speakingSpeedWpm,
    })),
  };
}
