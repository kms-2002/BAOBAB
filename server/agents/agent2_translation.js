/**
 * Agent 2: Multilingual Communication & Icebreaker Generator
 * Handles real-time low-latency streaming translation (Korean <-> English)
 * and generates tailored Icebreaker Conversation Cards.
 */

async function requestModel(prompt) {
  const key = process.env.BAOBAB_AI_API_KEY;
  if (!key) return null;
  const provider = (process.env.BAOBAB_AI_PROVIDER || 'openai').toLowerCase();
  if (provider === 'gemini') {
    const model = process.env.BAOBAB_AI_MODEL || 'gemini-2.5-flash';
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    if (!response.ok) throw new Error(`AI provider error (${response.status})`);
    const json = await response.json();
    return json.candidates?.[0]?.content?.parts?.map(p => p.text).join('').trim() || null;
  }
  const endpoint = process.env.BAOBAB_AI_BASE_URL || 'https://api.openai.com/v1/chat/completions';
  const response = await fetch(endpoint, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: process.env.BAOBAB_AI_MODEL || 'gpt-4o-mini', temperature: 0.85, messages: [{ role: 'user', content: prompt }] })
  });
  if (!response.ok) throw new Error(`AI provider error (${response.status})`);
  const json = await response.json();
  return json.choices?.[0]?.message?.content?.trim() || null;
}

async function translateMessage(message, sourceLang = 'auto') {
  const aiText = await requestModel(`Translate this message naturally between Korean and English. Return only the translation, no labels or notes.\nMessage: ${message}`);
  if (aiText) return { agent: '바오밥 번역', original: message, translated: aiText, latencyMs: 0, live: true };
  const phrases = {
    '안녕하세요': 'Hello!', '안녕': 'Hi!', '반가워요': 'Nice to meet you.',
    '감사합니다': 'Thank you.', '고마워요': 'Thanks!', '맛있어요': 'It is delicious.',
    '어디에서 만날까요?': 'Where should we meet?', '몇 시에 만날까요?': 'What time should we meet?',
    '좋아요': 'Sounds good!', '괜찮아요': 'That is fine.', '같이 밥 먹을래요?': 'Would you like to have a meal together?',
    'Hello!': '안녕하세요!', 'Hi!': '안녕!', 'Nice to meet you.': '만나서 반가워요.',
    'Thank you.': '감사합니다.', 'Thanks!': '고마워요!', 'It is delicious.': '맛있어요.',
    'Where should we meet?': '어디에서 만날까요?', 'What time should we meet?': '몇 시에 만날까요?',
    'Sounds good!': '좋아요!', 'That is fine.': '괜찮아요.', 'Would you like to have a meal together?': '같이 밥 먹을래요?'
  };
  const translated = phrases[message.trim()];
  return { agent: '바오밥 번역', original: message, translated: translated || '이 문장은 오프라인 번역 목록에 없어요. AI API 키를 설정하면 자유 문장도 번역할 수 있습니다.', live: false };
}

async function getRandomIcebreakerCard() {
  const topics = [
    '요즘 가장 자주 듣는 노래가 있나요?', '진주에서 꼭 가보고 싶은 곳은 어디예요?',
    '오늘 먹고 싶은 음식은 무엇인가요?', '최근에 재밌게 본 영화나 드라마가 있나요?',
    '쉬는 날에는 보통 어떻게 시간을 보내세요?', '서로의 나라에서 소개하고 싶은 음식이 있나요?',
    '요즘 새로 배우고 싶은 것이 있나요?', '가장 좋아하는 계절과 그 이유는요?',
    '학교 근처에서 좋아하는 산책 코스가 있나요?', '여행지에서 기억에 남는 식사가 있나요?',
    '커피와 차 중 더 자주 마시는 것은 무엇인가요?', '이번 달에 기대하는 일이 있나요?',
    '어릴 때 좋아했던 음식은 무엇이었나요?', '서로에게 추천하고 싶은 동네 맛집은요?',
    '최근에 작게 뿌듯했던 순간이 있었나요?', '새로운 사람을 만나면 주로 어떤 이야기를 나누나요?'
  ];
  const aiText = await requestModel('한국인 대학생과 외국인 유학생이 식사 자리에서 편하게 나눌 수 있는 짧은 대화 질문을 한국어로 하나만 만들어 주세요. 이전 질문과 겹치지 않도록 일상, 음식, 취미, 학교, 여행 중 하나를 골라주세요. 질문만 출력하세요.');
  if (aiText) return { agent: '대화 주제', topic: aiText, live: true };
  const randomIndex = Math.floor(Math.random() * topics.length);
  return {
    agent: "Agent 2 (아이스브레이킹 대화 카드 Generator)",
    topic: topics[randomIndex]
  };
}

module.exports = { translateMessage, getRandomIcebreakerCard };
