const express = require('express');
const cors = require('cors');
const path = require('path');

const { runAgent1Matching } = require('./agents/agent1_matching');
const { translateMessage, getRandomIcebreakerCard } = require('./agents/agent2_translation');
const { inspectMessageSafety, processMannerRating } = require('./agents/agent3_guardian');
let usersData = require('./data/users.json');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static frontend files from /public directory
app.use(express.static(path.join(__dirname, '../public')));

// REST API Endpoints

// 1. Get Current User Profile & 2-Step Verification Status
app.get('/api/user/profile', (req, res) => {
  res.json({
    success: true,
    data: usersData.currentUser
  });
});

// 2. Sign-up (회원가입) Endpoint
app.post('/api/auth/signup', (req, res) => {
  const { name, university, department, email, password } = req.body;

  if (!name || !email) {
    return res.status(400).json({ success: false, error: "이름과 이메일은 필수 입력사항입니다." });
  }

  // Update mock current user with signed-up info
  usersData.currentUser = {
    id: `usr_${Date.now()}`,
    name: name,
    university: university || "경상국립대학교",
    department: department || "학생",
    email: email,
    univ_verified: true,
    ocr_verified: true,
    baobab_level: 4,
    tree_score: 94,
    manner_score: 5.0,
    no_show_count: 0,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
  };

  res.json({
    success: true,
    message: "회원가입 및 2단계 공인 인증이 정상 완료되었습니다!",
    data: usersData.currentUser
  });
});

// 3. Agent 1: Trigger Matching & Safety Restaurant Search
app.post('/api/agents/match', (req, res) => {
  const preferences = req.body || {};
  const matchResult = runAgent1Matching(preferences);
  res.json({
    success: true,
    data: matchResult
  });
});

// 4. Agent 2: Translate Message
app.post('/api/agents/translate', (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ success: false, error: "Message is required" });
  }
  const result = translateMessage(message);
  res.json({
    success: true,
    data: result
  });
});

// 5. Agent 2: Get Icebreaker Topic Card
app.get('/api/agents/icebreaker', (req, res) => {
  const card = getRandomIcebreakerCard();
  res.json({
    success: true,
    data: card
  });
});

// 6. Agent 3: Inspect Message Safety (Guardian Pre-detection)
app.post('/api/agents/guardian/inspect', (req, res) => {
  const { text } = req.body;
  const safetyResult = inspectMessageSafety(text || '');
  res.json({
    success: true,
    data: safetyResult
  });
});

// 7. Agent 3: Process Post-Meal Rating & Baobab Tree Level Update
app.post('/api/agents/rating', (req, res) => {
  const { currentScore, isNoShow, mannerStars } = req.body;
  const ratingResult = processMannerRating(currentScore || 94, isNoShow, mannerStars);
  res.json({
    success: true,
    data: ratingResult
  });
});

// 8. Get PDF 2 Survey Statistics
app.get('/api/stats/survey', (req, res) => {
  res.json({
    success: true,
    sampleSize: 32,
    stats: [
      { id: 1, title: "혼밥 시 외로움/어색함 경험", percentage: "71.9%", solution: "1:1 소셜 다이닝 동행 매칭" },
      { id: 2, title: "2인 이상 메뉴 주문 포기", percentage: "71.9%", solution: "부대찌개/닭갈비 등 2인 전용 매칭" },
      { id: 3, title: "영업/포교/범죄 만남 불안", percentage: "96.9%", solution: "Agent 3 가디언 텍스트 사전 감지" },
      { id: 4, title: "대학 메일/신분증 인증 선호", percentage: "71.9%", solution: "2단계 공인 신원 인증 시스템" },
      { id: 5, title: "외국인 실시간 번역 니즈", percentage: "87.5%", solution: "Agent 2 저지연 실시간 통번역" }
    ]
  });
});

// Fallback route: serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 [BAOBAB AI Server] Running live at: http://localhost:${PORT}`);
  console.log(`🌳 Multi-Agent Server (Signup, Agent 1, 2, 3) ready!`);
  console.log(`=======================================================`);
});
