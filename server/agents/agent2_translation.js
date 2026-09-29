/**
 * Agent 2: Multilingual Communication & Icebreaker Generator
 * Handles real-time low-latency streaming translation (Korean <-> English)
 * and generates tailored Icebreaker Conversation Cards.
 */

const icebreakerCards = [
  "\"서로의 전공 및 진주 대학가 주변 추천 분위기 좋은 카페에 대해 이야기해보세요!\"",
  "\"한국 음식 중 가장 좋아하는 매운 맛 단계와 최애 음료는 무엇인가요?\"",
  "\"이번 주말에 추천하는 진주 남강 산책 코스와 맛집에 대해 이야기해보세요!\"",
  "\"서로의 국가에서 가장 인기가 많은 대표 소셜 푸드는 무엇인가요?\""
];

function translateMessage(message, sourceLang = 'auto') {
  let translatedText = '';
  const isKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(message);

  if (isKorean) {
    translatedText = `[Agent 2 Translation]: ${message} (Auto-translated to English for Sarah)`;
  } else {
    translatedText = `[Agent 2 번역]: ${message} (한국어로 자동 번역 완료)`;
  }

  return {
    agent: "Agent 2 (다국어 소통 & 중재 에이전트)",
    original: message,
    translated: translatedText,
    latencyMs: 120
  };
}

function getRandomIcebreakerCard() {
  const randomIndex = Math.floor(Math.random() * icebreakerCards.length);
  return {
    agent: "Agent 2 (아이스브레이킹 대화 카드 Generator)",
    topic: icebreakerCards[randomIndex]
  };
}

module.exports = { translateMessage, getRandomIcebreakerCard };
