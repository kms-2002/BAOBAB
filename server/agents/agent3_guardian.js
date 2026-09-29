/**
 * Agent 3: Guardian & Credibility Agent
 * Inspects chat logs for safety/prohibited speech (sales, religion, harassment)
 * and updates Baobab Tree Levels (신뢰도/나무 레벨).
 */

const PROHIBITED_KEYWORDS = ['종교', '포교', '영업', '세미나', '가입', '투자', '돈', '다단계'];

function inspectMessageSafety(text) {
  const foundKeywords = PROHIBITED_KEYWORDS.filter(kw => text.includes(kw));

  if (foundKeywords.length > 0) {
    return {
      agent: "Agent 3 (가디언 안전 모니터링)",
      isSafe: false,
      alertLevel: "HIGH",
      detectedKeywords: foundKeywords,
      action: "WARNING_ISSUED",
      message: "🚨 [Agent 3 가디언 경보] 목적 외 언행(포교/영업/금전) 키워드가 감지되었습니다. 계정 신뢰도 차감 조치됩니다."
    };
  }

  return {
    agent: "Agent 3 (가디언 안전 모니터링)",
    isSafe: true,
    alertLevel: "NONE",
    message: "🛡️ 안전한 식사 동행 대화입니다."
  };
}

function processMannerRating(currentScore, isNoShow = false, mannerStars = 5) {
  let scoreDiff = 0;
  if (isNoShow) {
    scoreDiff = -15;
  } else {
    scoreDiff = mannerStars >= 4 ? 2 : 0;
  }

  const updatedScore = Math.min(100, Math.max(0, currentScore + scoreDiff));
  let level = 1;
  if (updatedScore >= 90) level = 4;
  else if (updatedScore >= 75) level = 3;
  else if (updatedScore >= 60) level = 2;

  return {
    agent: "Agent 3 (나무 레벨 & 신뢰도 계산기)",
    previousScore: currentScore,
    scoreAdded: scoreDiff,
    updatedScore: updatedScore,
    baobabLevel: level,
    rewardCoupon: updatedScore >= 90 ? "🎟️ 안심식당 2,000원 제휴 할인 쿠폰" : null
  };
}

module.exports = { inspectMessageSafety, processMannerRating };
