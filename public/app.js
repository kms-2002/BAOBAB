// Initialize Lucide Icons
lucide.createIcons();

let currentScreen = 0; // Starts at Screen 0 (Onboarding Start Screen)
let currentScore = 94;
let selectedRestaurantId = null;
let recommendedRestaurants = [];
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

document.addEventListener('DOMContentLoaded', () => {
  updateLocalTime();
  setInterval(updateLocalTime, 15000);
  fetchUserProfile();
  fetchSurveyStats();
  goToStartScreen();
});

function updateLocalTime() {
  const clock = document.getElementById('local-time');
  if (clock) clock.textContent = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
}

async function fetchUserProfile() {
  try {
    const savedProfile = localStorage.getItem('baobab-profile');
    if (savedProfile) {
      const user = JSON.parse(savedProfile);
      renderUserProfile(user);
      return;
    }
    const res = await fetch('/api/user/profile');
    const json = await res.json();
    if (json.success) renderUserProfile(json.data);
  } catch (err) {
    console.error('Failed to fetch user profile:', err);
  }
}

function renderUserProfile(user) {
      document.getElementById('user-name').innerText = user.name;
      document.getElementById('user-dept').innerText = user.department;
      document.getElementById('user-email').innerText = user.email;
      document.getElementById('user-level').innerText = `🌳 Lv.${user.baobab_level}`;
      document.getElementById('user-score').innerText = `(${user.tree_score}점)`;
      currentScore = user.tree_score;
}

async function fetchSurveyStats() {
  try {
    const res = await fetch('/api/stats/survey');
    const json = await res.json();
    if (json.success && json.stats) {
      const grid = document.getElementById('survey-stats-grid');
      grid.innerHTML = json.stats.slice(0, 4).map(st => `
        <div class="bg-white border border-indigo-100 p-2 rounded-xl space-y-0.5 shadow-xs">
          <div class="text-indigo-600 font-bold text-xs font-mono">${st.percentage}</div>
          <div class="text-slate-800 font-semibold text-[10px]">${st.title}</div>
          <div class="text-[8px] text-slate-500">➔ ${st.solution}</div>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Failed to fetch survey stats:', err);
  }
}

function updateHeaderVisibility(show) {
  const header = document.getElementById('app-header-bar');
  if (show) {
    header.classList.remove('hidden');
  } else {
    header.classList.add('hidden');
  }
}

function updateScreenSubtitle() {
  const subtitle = document.getElementById('screen-subtitle');
  const agentTag = document.getElementById('agent-active-tag');
  
  if (currentScreen === 1) {
    subtitle.innerText = '1단계: 프로필 & 동행 조건';
    agentTag.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span><span>Agent Ready</span>`;
  } else if (currentScreen === 2) {
    subtitle.innerText = '2단계: Agent 1 매칭 & 안심식당';
    agentTag.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span><span>Agent 1 OK</span>`;
  } else if (currentScreen === 3) {
    subtitle.innerText = '3단계: Agent 2,3 통번역 & 가디언';
    agentTag.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse"></span><span>Agent 2,3 Active</span>`;
  } else if (currentScreen === 4) {
    subtitle.innerText = '4단계: 매너 평가 & 나무 레벨';
    agentTag.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span><span>Complete</span>`;
  }
}

function hideAllScreens() {
  const screens = ['screen-0', 'screen-signup', 'screen-1', 'screen-2', 'screen-3', 'screen-4'];
  screens.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
}

function goToStartScreen() {
  currentScreen = 0;
  hideAllScreens();
  document.getElementById('screen-0').classList.remove('hidden');
  updateHeaderVisibility(false);
  document.getElementById('bottom-nav').classList.add('hidden');
}

function goToSignup() {
  hideAllScreens();
  document.getElementById('screen-signup').classList.remove('hidden');
  updateHeaderVisibility(false);
  document.getElementById('bottom-nav').classList.add('hidden');
}

function quickStartGuest() {
  currentScreen = 1;
  hideAllScreens();
  document.getElementById('screen-1').classList.remove('hidden');
  updateHeaderVisibility(true);
  updateScreenSubtitle();
  document.getElementById('bottom-nav').classList.remove('hidden');
}

function goToPreferences() { quickStartGuest(); }
function goToCurrentMatch() {
  if (currentScreen >= 2) enterChatRoom();
  else triggerMatchAPI();
}
function goToProfile() {
  currentScreen = 1;
  hideAllScreens(); document.getElementById('screen-1').classList.remove('hidden');
  updateHeaderVisibility(true); updateScreenSubtitle();
  document.getElementById('app-viewport').scrollTop = 0;
  document.getElementById('bottom-nav').classList.remove('hidden');
}

async function handleSignupSubmit(event) {
  event.preventDefault();

  const name = document.getElementById('su-name').value;
  const university = document.getElementById('su-univ').value;
  const department = document.getElementById('su-dept').value;
  const email = document.getElementById('su-email').value;
  const password = document.getElementById('su-password').value;

  try {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, university, department, email, password })
    });
    const json = await res.json();

    if (json.success) {
      alert(`가입 완료! 이 기기의 로컬 데이터에 저장했어요.`);
      localStorage.setItem('baobab-profile', JSON.stringify(json.data));
      fetchUserProfile();
      quickStartGuest();
    } else alert(json.error || '가입에 실패했어요.');
  } catch (err) {
    console.error('Signup error:', err);
    alert('가입을 완료하지 못했어요. 입력한 정보를 확인해 주세요.');
  }
}

async function triggerMatchAPI() {
  const menu = document.getElementById('pref-menu').value;
  const gender = document.getElementById('pref-gender').value;
  const talkStyle = document.getElementById('pref-talk').value;
  const allowForeigner = document.getElementById('pref-foreign').checked;

  try {
    currentScreen = 2;
    hideAllScreens();
    document.getElementById('screen-2').classList.remove('hidden');
    updateHeaderVisibility(true);
    updateScreenSubtitle();
    document.getElementById('bottom-nav').classList.remove('hidden');

    const logBox = document.getElementById('agent-log-box');
    logBox.innerHTML = `<div class="text-slate-400">⏳ /api/agents/match 로 요청 전송 중...</div>`;

    const res = await fetch('/api/agents/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ menu, gender, talkStyle, allowForeigner })
    });
    const json = await res.json();

    if (json.success) {
      const data = json.data;
      logBox.innerHTML = data.agentLogs.map(l => `<div>${l}</div>`).join('');
      logBox.scrollTop = logBox.scrollHeight;

      const p = data.matchDetails.partner;
      document.getElementById('partner-card').innerHTML = `
        <div class="absolute top-2 right-2 bg-indigo-50 text-indigo-700 border border-indigo-100 text-[9px] px-2 py-0.5 rounded-full font-bold">
          ${p.match_score} 매칭 적합도
        </div>
        <div class="flex items-center gap-3">
          <img src="${p.avatar}" class="w-11 h-11 rounded-full object-cover border-2 border-indigo-500">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-slate-900">${p.name}</span>
              <span class="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded font-medium">${p.country}</span>
            </div>
            <div class="text-[9px] text-slate-500 mt-0.5">${p.status}</div>
            <div class="flex items-center gap-2 mt-1 text-[9px]">
              <span class="text-amber-600 font-bold">🌱 Lv.${p.baobab_level} (${p.tree_score}점)</span>
              <span class="text-slate-400">•</span>
              <span class="text-emerald-600 font-semibold">매너 ${p.manner_score}/5.0</span>
            </div>
          </div>
        </div>
      `;

      const restList = document.getElementById('restaurant-list');
      recommendedRestaurants = data.matchDetails.recommendedSafetyRestaurants;
      selectedRestaurantId = recommendedRestaurants[0]?.id ?? null;
      restList.innerHTML = recommendedRestaurants.map((r, idx) => `
        <button type="button" onclick="selectRestaurant(${JSON.stringify(r.id)})" id="rest-${r.id}" aria-pressed="${idx === 0}" class="w-full text-left bg-white ${idx === 0 ? 'border-2 border-indigo-600 shadow-sm' : 'border border-slate-200'} rounded-xl p-3 cursor-pointer transition">
          <div class="flex justify-between items-start">
            <div>
              <div class="flex items-center gap-1.5">
                <span class="text-xs font-bold text-slate-900">${r.name}</span>
                <span class="text-[8px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.2 rounded font-semibold">${r.safety_grade}</span>
              </div>
              <div class="text-[10px] text-slate-500 mt-0.5">${r.price_info} | ${r.distance}</div>
              <div class="text-[9px] text-indigo-600 mt-0.5 font-medium flex items-center gap-1">
                <span>🎁 ${r.perk}</span>
              </div>
            </div>
            <div class="restaurant-check ${idx === 0 ? '' : 'hidden'} w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">✓</div>
          </div>
        </button>
      `).join('');
    }
  } catch (err) {
    console.error('Matching API error:', err);
  }
}

function selectRestaurant(id) {
  selectedRestaurantId = id;
  document.querySelectorAll('#restaurant-list > button').forEach(card => {
    const selected = String(card.id.slice('rest-'.length)) === String(id);
    card.classList.toggle('border-2', selected);
    card.classList.toggle('border-indigo-600', selected);
    card.classList.toggle('shadow-sm', selected);
    card.classList.toggle('border-slate-200', !selected);
    card.setAttribute('aria-pressed', String(selected));
    card.querySelector('.restaurant-check').classList.toggle('hidden', !selected);
  });
  const restaurant = recommendedRestaurants.find(item => String(item.id) === String(id));
  if (restaurant) document.getElementById('chat-rest-name').textContent = restaurant.name;
}

function enterChatRoom() {
  currentScreen = 3;
  hideAllScreens();
  document.getElementById('screen-3').classList.remove('hidden');
  updateHeaderVisibility(true);
  updateScreenSubtitle();
  document.getElementById('bottom-nav').classList.remove('hidden');
}

async function sendMessageAPI() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;

  const chatBox = document.getElementById('chat-messages');

  try {
    const inspectRes = await fetch('/api/agents/guardian/inspect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const inspectJson = await inspectRes.json();
    if (inspectJson.success && !inspectJson.data.isSafe) {
      alert(inspectJson.data.message);
      input.value = '';
      return;
    }
  } catch (err) {
    console.error('Safety inspection error:', err);
  }

  try {
    const transRes = await fetch('/api/agents/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    });
    const transJson = await transRes.json();

    if (transJson.success) {
      const translatedStr = transJson.data.translated;

      const myMsgHTML = `
        <div class="flex gap-2 items-start justify-end animate-fade">
          <div class="max-w-[78%] space-y-1 text-right">
            <div class="text-[9px] text-slate-400">나</div>
            <div class="bg-indigo-600 text-white p-2.5 rounded-2xl rounded-tr-none text-[11px] text-left shadow-sm">
              ${escapeHTML(text)}
              <div class="mt-1 pt-1 border-t border-indigo-500 text-[10px] text-indigo-100 font-medium">
                ${escapeHTML(translatedStr)}
              </div>
            </div>
          </div>
        </div>
      `;
      chatBox.innerHTML += myMsgHTML;
      input.value = '';
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  } catch (err) {
    console.error('Translation API error:', err);
  }
}

async function fetchIcebreakerAPI() {
  try {
    const res = await fetch('/api/agents/icebreaker');
    const json = await res.json();
    if (json.success) {
      document.getElementById('icebreaker-text').innerText = json.data.topic;
    }
  } catch (err) {
    console.error('Icebreaker API error:', err);
  }
}

function sendProhibitedTestMessage() {
  document.getElementById('chat-input').value = '저희 종교 세미나 가실래요? 선물 드려요';
  sendMessageAPI();
}

function triggerSOS() {
  alert("SOS [안심식당 긴급 지원]\n\n현장 안심식당 점주 및 BAOBAB AI 가디언에 SOS 메시지가 발송되었습니다.");
}

function finishMealProcess() {
  currentScreen = 4;
  hideAllScreens();
  document.getElementById('screen-4').classList.remove('hidden');
  updateHeaderVisibility(true);
  updateScreenSubtitle();
}

async function submitRatingAPI() {
  try {
    const res = await fetch('/api/agents/rating', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentScore: currentScore,
        isNoShow: false,
        mannerStars: 5
      })
    });
    const json = await res.json();
    if (json.success) {
      const r = json.data;
      document.getElementById('tree-growth-box').classList.remove('hidden');
      document.getElementById('growth-level-text').innerText = `🌳 Lv.${r.baobabLevel} (${r.updatedScore}점)`;
      document.getElementById('growth-score-added').innerHTML = `매너 평가 우수로 신뢰도 <span class="text-indigo-600 font-bold">+${r.scoreAdded}점</span> 상승!`;
      document.getElementById('growth-bar').style.width = `${r.updatedScore}%`;
    }
  } catch (err) {
    console.error('Rating API error:', err);
  }
}
