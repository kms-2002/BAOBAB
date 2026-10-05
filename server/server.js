const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Load local secrets without shipping them to the browser or adding a runtime dependency.
const envFile = path.join(__dirname, '../.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const entry = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (entry && !entry[1].startsWith('#') && process.env[entry[1]] === undefined) process.env[entry[1]] = entry[2].replace(/^['"]|['"]$/g, '');
  }
}

const { runAgent1Matching } = require('./agents/agent1_matching');
const { translateMessage, getRandomIcebreakerCard } = require('./agents/agent2_translation');
const { inspectMessageSafety, processMannerRating } = require('./agents/agent3_guardian');
const seedUsers = require('./data/users.json');
const localUsersPath = path.join(__dirname, 'data/local-users.json');
let localUsers = fs.existsSync(localUsersPath)
  ? JSON.parse(fs.readFileSync(localUsersPath, 'utf8'))
  : { currentUser: seedUsers.currentUser, registeredUsers: [] };
localUsers.registeredUsers ||= [];

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use((req, res, next) => { res.setHeader('X-Content-Type-Options', 'nosniff'); next(); });

function saveUsers() {
  fs.writeFileSync(localUsersPath, JSON.stringify(localUsers, null, 2), 'utf8');
}

// Serve static frontend files from /public directory
app.use(express.static(path.join(__dirname, '../public')));

// REST API Endpoints

// 1. Get Current User Profile & 2-Step Verification Status
app.get('/api/user/profile', (req, res) => {
  res.json({
    success: true,
    data: localUsers.currentUser
  });
});

// 2. Sign-up (회원가입) Endpoint
app.post('/api/auth/signup', (req, res) => {
  const { name, university, department, email, password } = req.body;

  if (!name || !email) {
    return res.status(400).json({ success: false, error: "이름과 이메일은 필수 입력사항입니다." });
  }

  if (!password || password.length < 8) return res.status(400).json({ success: false, error: '비밀번호는 8자 이상 입력해 주세요.' });
  const duplicate = localUsers.registeredUsers.find(user => user.email.toLowerCase() === email.toLowerCase());
  if (duplicate) return res.status(409).json({ success: false, error: '이미 가입된 이메일이에요.' });
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = crypto.scryptSync(password, salt, 64).toString('hex');
  localUsers.currentUser = {
    id: `usr_${Date.now()}`,
    name: name,
    university: university || "경상국립대학교",
    department: department || "학생",
    email: email,
    univ_verified: false,
    ocr_verified: false,
    baobab_level: 1,
    tree_score: 60,
    manner_score: 5.0,
    no_show_count: 0,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
  };
  localUsers.registeredUsers.push({ ...localUsers.currentUser, passwordSalt: salt, passwordHash });
  saveUsers();

  res.json({
    success: true,
    message: '가입이 완료되었습니다. 이 기기의 로컬 데이터에 저장했어요.',
    data: localUsers.currentUser
  });
});

// 3. Agent 1: Trigger Matching & Safety Restaurant Search
app.post('/api/agents/match', (req, res) => {
  const preferences = { ...(req.body || {}), userName: localUsers.currentUser.name };
  const matchResult = runAgent1Matching(preferences);
  res.json({
    success: true,
    data: matchResult
  });
});

// 4. Agent 2: Translate Message
app.post('/api/agents/translate', async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ success: false, error: "Message is required" });
  }
  try {
  const result = await translateMessage(message);
  res.json({
    success: true,
    data: result
  });
  } catch (error) { res.status(502).json({ success: false, error: '번역을 완료하지 못했어요. 잠시 후 다시 시도해 주세요.' }); }
});

// 5. Agent 2: Get Icebreaker Topic Card
app.get('/api/agents/icebreaker', async (req, res) => {
  const card = await getRandomIcebreakerCard();
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
  localUsers.currentUser.tree_score = ratingResult.updatedScore;
  localUsers.currentUser.baobab_level = ratingResult.baobabLevel;
  const savedUser = localUsers.registeredUsers.find(user => user.id === localUsers.currentUser.id);
  if (savedUser) { savedUser.tree_score = ratingResult.updatedScore; savedUser.baobab_level = ratingResult.baobabLevel; }
  saveUsers();
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
