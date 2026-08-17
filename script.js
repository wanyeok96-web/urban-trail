/* =========================================================================
 * URBAN TRAIL · Metro Atlas
 * script.js  (Vanilla JavaScript, 외부 라이브러리 없음)
 * -------------------------------------------------------------------------
 *  목차
 *  [A] 상수 · 권역 · 말 · 색상
 *  [B] 도시 데이터 — data.js (CITIES · CITY_META)
 *  [C] 특별 칸 / 찬스 · 축제 · 도시문제 카드 / 공통 지리 퀴즈
 *  [D] SVG 세계지도 데이터
 *  [E] 저장소(localStorage) 유틸
 *  [F] 사운드 엔진 (Web Audio API)
 *  [G] 공통 UI 유틸 (화면 전환 / 모달 / 토스트)
 *  [H] 게임 상태 & 보드 생성
 *  [I] 턴 진행 (주사위 · 이동 · 칸 이벤트)
 *  [J] 도시 학습 대시보드 · 퀴즈
 *  [K] 특별 칸 이벤트
 *  [L] 결과 리포트
 *  [M] 트레일 맵 / 트레일 로그 / 선생님 설정 / 이 기기 기록
 *  [N] 초기화 & 이벤트 바인딩
 * ========================================================================= */
(function () {
"use strict";

/* =========================================================================
 * [A] 상수 · 권역 · 말 · 색상
 * ========================================================================= */

var APP = { name: "URBAN TRAIL", tagline: "도시를 따라가는 지리 여행", version: "3.7.0" };

/* 저장소 키 */
var LS = {
  settings: "cityPassport.settings.v1",
  save:     "cityPassport.save.v1",
  groups:   "cityPassport.groups.v1",
  results:  "cityPassport.results.v1",
  codex:    "cityPassport.codex.v1",
  stamps:   "cityPassport.stamps.v1",
  profile:  "cityPassport.profile.v1",
  atlasQuiz:"cityPassport.atlasQuiz.v1",
  tutorial: "cityPassport.tutorial.v1",
  tutorials:"cityPassport.tutorials.v1",
  user:     "cityPassport.user.v1"
};

/* 6개 권역 (색상은 style.css의 --r-* 와 동일) */
var REGIONS = [
  { key: "EA", name: "동아시아·동남아시아", short: "동·동남아", color: "#e05a5a" },
  { key: "SW", name: "남아시아·서아시아",   short: "남·서아시아", color: "#e0913a" },
  { key: "EU", name: "유럽",               short: "유럽",     color: "#4d7fd6" },
  { key: "AF", name: "아프리카",            short: "아프리카",  color: "#35a877" },
  { key: "NA", name: "북아메리카",          short: "북아메리카", color: "#8b6ad6" },
  { key: "SO", name: "남아메리카·오세아니아", short: "남미·오세아니아", color: "#21a7ae" }
];

/* 플레이 시간 모드 : 실제 타이머가 아닌 "제한 턴" 기준 */
var MODES = [
  { key: "quick",  name: "빠른 탐험", turns: 8,  time: "약 15분",    emoji: "⚡",
    desc: "짧은 시간에 세계를 훑어보는 코스입니다. 도입 활동이나 남은 시간이 짧을 때 좋아요." },
  { key: "basic",  name: "기본 탐험", turns: 15, time: "약 25~30분", emoji: "🧭",
    desc: "50분 수업에 가장 알맞은 표준 코스입니다. 도시 정보를 충분히 읽고 미션에 도전할 수 있어요." },
  { key: "grand",  name: "세계일주",  turns: 22, time: "약 40분",    emoji: "🌏",
    desc: "보드를 여러 바퀴 돌며 권역 완성에 도전하는 코스입니다. 블록타임 수업에 추천합니다." }
];

/* 여행 말 12종 (교통수단 · 여행자 · 여행 아이템) */
var TOKENS = [
  { id: "plane",   name: "비행기",     emoji: "✈️" },
  { id: "train",   name: "기차",       emoji: "🚄" },
  { id: "cruise",  name: "유람선",     emoji: "🛳️" },
  { id: "balloon", name: "열기구",     emoji: "🎈" },
  { id: "explorer",name: "탐험가",     emoji: "🧗" },
  { id: "photog",  name: "사진가",     emoji: "📸" },
  { id: "geo",     name: "지리학자",   emoji: "🗺️" },
  { id: "backpack",name: "배낭여행자", emoji: "🎒" },
  { id: "passport",name: "트레일 로그", emoji: "📍" },
  { id: "compass", name: "나침반",     emoji: "🧭" },
  { id: "camera",  name: "카메라",     emoji: "📷" },
  { id: "globe",   name: "지구본",     emoji: "🌍" }
];

/* 팀 대표 색상 8종 */
var COLORS = ["#e0533f", "#e8913a", "#d9b641", "#35a877", "#21a7ae", "#4d7fd6", "#8b6ad6", "#d9569b"];

/* 점수표 */
var PTS = {
  visit: 10,        // 도시 첫 방문(정보 탐색)
  quizFirst: 30,    // 미션 1차 정답
  quizRetry: 15,    // 재도전 정답
  quizFail: 0,      // 재도전도 실패
  revisit: 5,       // 이미 스탬프를 받은 도시 재방문
  passStart: 20,    // 출발 칸 통과
  landStart: 40,    // 출발 칸 정지
  regionClear: 60,  // 권역 4개 도시 완성
  atlasQuiz: 30     // 아틀라스 미션 스탬프(게임 밖)
};

/* 여행 목표 카드 풀 — 게임 시작 시 3장 무작위 */
var GOAL_CATALOG = [
  {
    id: "stamp_regions3",
    title: "서로 다른 3개 권역에서 스탬프",
    bonus: 40,
    check: function (g) {
      var regs = {};
      g.stamped.forEach(function (id) { regs[getCity(id).region] = true; });
      return Object.keys(regs).length >= 3;
    }
  },
  {
    id: "visit_equator",
    title: "적도에서 위도 10° 이내 도시 방문",
    bonus: 40,
    check: function (g) {
      return g.visited.some(function (id) { return Math.abs(getCity(id).coordinates.lat) <= 10; });
    }
  },
  {
    id: "visit_megacity",
    title: "인구 2,000만 이상 도시 방문",
    bonus: 30,
    check: function (g) {
      return g.visited.some(function (id) { return cityStats(getCity(id)).population >= 20000000; });
    }
  },
  {
    id: "visit_highland",
    title: "해발 1,000m 이상 고원 도시 방문",
    bonus: 40,
    check: function (g) {
      return g.visited.some(function (id) { return cityStats(getCity(id)).elevation >= 1000; });
    }
  },
  {
    id: "stamp_ports2",
    title: "항구 기능 도시 2곳 스탬프",
    bonus: 30,
    check: function (g) {
      var n = 0;
      g.stamped.forEach(function (id) { if (cityStats(getCity(id)).isPort) n++; });
      return n >= 2;
    }
  },
  {
    id: "stamp_count8",
    title: "랜드마크 스탬프 8개 모으기",
    bonus: 35,
    check: function (g) { return g.stamped.length >= 8; }
  },
  {
    id: "visit_regions4",
    title: "4개 권역 이상 방문",
    bonus: 25,
    check: function (g) {
      var regs = {};
      g.visited.forEach(function (id) { regs[getCity(id).region] = true; });
      return Object.keys(regs).length >= 4;
    }
  }
];

/* =========================================================================
 * [B] 도시 데이터 — data.js 에서 로드 (CITIES · CITY_META)
 * ========================================================================= */

var _cpData = (typeof window !== "undefined" && window.CITY_PASSPORT_DATA) || {};
var CITIES = _cpData.CITIES || [];
var CITY_META = _cpData.CITY_META || {};

function mergeCityMeta() {
  CITIES.forEach(function (c) {
    var m = CITY_META[c.id];
    if (!m) return;
    if (m.stats) c.stats = m.stats;
    if (m.functions) c.functions = m.functions.slice();
    if (m.related) c.related = m.related.slice();
    if (m.countryFact) c.countryFact = m.countryFact;
    if (m.geoNote) c.geoNote = m.geoNote;
  });
}
mergeCityMeta();

/* =========================================================================
 * [C] 특별 칸 · 이벤트 카드 · 공통 지리 퀴즈
 * ========================================================================= */

/* 보드 32칸 중 8칸이 특별 칸. 4칸마다 하나씩 놓여 균형을 이룬다.
   pos 값은 보드 인덱스(0 = 출발, 시계 반대 방향) */
var SPECIALS = [
  { pos: 0,  key: "start",    name: "출발",       sub: "국제공항", emoji: "🛫",
    desc: "세계 여행이 시작되는 국제공항입니다. 한 바퀴를 돌아 이곳을 지날 때마다 여행 마일리지를 받습니다." },
  { pos: 4,  key: "chance",   name: "여행 찬스",  sub: "CHANCE",   emoji: "🎁",
    desc: "여행 중 일어나는 뜻밖의 사건! 카드를 한 장 뽑습니다." },
  { pos: 8,  key: "festival", name: "세계 축제",  sub: "FESTIVAL", emoji: "🎉",
    desc: "세계 곳곳의 축제를 만납니다. 축제를 통해 그 도시의 문화를 배워 봅시다." },
  { pos: 12, key: "transfer", name: "환승 라운지", sub: "TRANSFER", emoji: "🛄",
    desc: "환승 게이트가 열렸습니다. 아직 가보지 못한 도시 중 한 곳으로 바로 이동할 수 있습니다." },
  { pos: 16, key: "issue",    name: "도시 문제 해결", sub: "ISSUE", emoji: "🏗️",
    desc: "도시가 겪는 문제를 만났습니다. 친구들과 함께 해결 방법을 골라 보세요." },
  { pos: 20, key: "photo",    name: "여행 사진관", sub: "PHOTO",   emoji: "📸",
    desc: "지금까지 방문한 도시 중 가장 인상 깊었던 곳에서 인증샷을 남깁니다." },
  { pos: 24, key: "geoquiz",  name: "세계지리 퀴즈", sub: "QUIZ",  emoji: "🧠",
    desc: "세계 여러 도시와 권역에 대한 지리 상식 문제에 도전합니다." },
  { pos: 28, key: "journal",  name: "휴식과 기록", sub: "JOURNAL", emoji: "📔",
    desc: "잠시 쉬면서 여행 일지를 씁니다. 기록한 내용은 결과 리포트에 실립니다." }
];

/* 여행 찬스 카드 — 긍정적인 사건 위주로 구성 */
var CHANCE_CARDS = [
  { t: "기내 좌석 업그레이드", d: "친절한 승무원이 좌석을 올려 주었습니다. 편안한 여행으로 체력을 아꼈어요.", p: 25, emoji: "💺" },
  { t: "현지 가이드와의 만남", d: "골목을 잘 아는 가이드를 만나 숨은 명소를 둘러보았습니다.", p: 20, emoji: "🧑‍🏫" },
  { t: "환전 수수료 절약", d: "환율이 유리해져 여행 경비를 아꼈습니다.", p: 15, emoji: "💱" },
  { t: "야시장에서 길을 잃음", d: "사람이 너무 많아 한참을 헤맸습니다. 그래도 맛있는 간식은 챙겼어요.", p: -10, emoji: "🍢" },
  { t: "수하물 지연 도착", d: "짐이 다음 비행기로 왔습니다. 하루를 기다렸어요.", p: -10, emoji: "🧳" },
  { t: "여행 사진 콘테스트 입상", d: "찍은 사진이 온라인에서 큰 인기를 얻었습니다.", p: 30, emoji: "🏆" },
  { t: "기차 파업", d: "예정된 열차가 취소되어 일정이 밀렸습니다.", p: -15, emoji: "🚫" },
  { t: "지역 축제 초대", d: "우연히 마을 축제에 초대받아 특별한 경험을 했습니다.", p: 25, emoji: "🎪" },
  { t: "여행자 보험 환급", d: "사용하지 않은 보험료 일부를 돌려받았습니다.", p: 15, emoji: "🧾" },
  { t: "도시 지도 완성", d: "손으로 그린 도시 지도를 완성했습니다. 지리학자의 자질이 보이네요!", p: 20, emoji: "🗺️" },
  { t: "한밤중 별 관측", d: "빛 공해가 적은 곳에서 은하수를 보았습니다.", p: 20, emoji: "🌌" },
  { t: "여권 분실 소동", d: "여권을 잃어버린 줄 알고 놀랐지만 가방 안쪽에서 찾았습니다.", p: -5, emoji: "😱" }
];

/* 세계 축제 카드 — 도시·문화 학습 요소 */
var FESTIVAL_CARDS = [
  { t: "리우 카니발", city: "리우데자네이루", d: "삼바 학교들이 한 해를 준비해 퍼레이드를 펼치는 세계 최대 규모의 축제입니다.", emoji: "🎭" },
  { t: "라 토마티나", city: "부뇰(스페인)", d: "토마토를 던지며 즐기는 축제로, 작은 도시가 세계적 관광지가 된 사례입니다.", emoji: "🍅" },
  { t: "옥토버페스트", city: "뮌헨(독일)", d: "600만 명 이상이 찾는 축제로 도시 경제에 큰 영향을 줍니다.", emoji: "🥨" },
  { t: "홀리 축제", city: "델리·바라나시(인도)", d: "봄을 맞아 색색의 가루를 뿌리며 즐기는 인도의 대표 축제입니다.", emoji: "🎨" },
  { t: "송크란", city: "방콕(태국)", d: "새해를 맞아 서로에게 물을 뿌리며 복을 비는 물 축제입니다.", emoji: "💦" },
  { t: "벚꽃 축제", city: "도쿄(일본)", d: "봄이 오는 시기를 알리는 기후 지표이자 도시 전체가 참여하는 계절 행사입니다.", emoji: "🌸" },
  { t: "케이프타운 재즈 페스티벌", city: "케이프타운(남아공)", d: "아프리카 대륙 최대 규모의 재즈 축제로 문화 산업의 힘을 보여 줍니다.", emoji: "🎷" },
  { t: "망자의 날", city: "멕시코시티(멕시코)", d: "세상을 떠난 이를 기억하며 꽃과 음식을 준비하는 유네스코 무형유산 축제입니다.", emoji: "💀" },
  { t: "베네치아 카니발", city: "베네치아(이탈리아)", d: "가면을 쓰고 즐기는 축제로 도시 관광의 대표 시즌을 만듭니다.", emoji: "🎭" },
  { t: "하버 브리지 불꽃축제", city: "시드니(오스트레일리아)", d: "남반구에서 가장 먼저 새해를 맞이하는 도시 중 하나로 유명합니다.", emoji: "🎆" }
];

/* 도시 문제 해결 카드 — 3지선다, 정답에 도시 개념 학습 요소 */
var ISSUE_CARDS = [
  { t: "출퇴근 교통 혼잡", city: "대도시 공통",
    d: "도심으로 들어오는 자동차가 너무 많아 매일 아침 도로가 마비됩니다.",
    c: ["대중교통과 자전거 도로를 늘리고 도심 통행을 관리한다", "도로를 계속 넓혀 자동차를 더 받아들인다", "도심의 학교와 회사를 모두 없앤다"],
    a: 0, ex: "도로를 넓히면 오히려 교통량이 늘어나는 경우가 많아, 대중교통 중심 정책이 효과적입니다." },
  { t: "도시 열섬 현상", city: "여름철 대도시",
    d: "도심 기온이 주변 농촌보다 몇 도씩 높게 나타납니다.",
    c: ["도시 숲·옥상 정원·바람길을 늘린다", "에어컨 실외기를 도로 쪽으로 더 설치한다", "아스팔트 포장을 더 두껍게 한다"],
    a: 0, ex: "녹지와 물, 바람길은 지표면 온도를 낮추어 열섬 현상을 완화합니다." },
  { t: "주거비 상승", city: "인기 관광도시",
    d: "관광객이 늘면서 임대료가 올라 원래 살던 주민이 도시를 떠나고 있습니다.",
    c: ["공공임대주택을 늘리고 단기 임대를 관리한다", "관광객 수를 두 배로 늘린다", "주민을 도시 밖으로 이주시킨다"],
    a: 0, ex: "주거 안정 대책과 관광 총량 관리가 함께 필요합니다(젠트리피케이션 대응)." },
  { t: "물 부족", city: "건조 기후 도시",
    d: "가뭄이 이어져 저수지 수위가 크게 낮아졌습니다.",
    c: ["물 재이용과 누수 관리, 절수 캠페인을 함께 추진한다", "수영장을 더 많이 만든다", "지하수를 무제한으로 뽑아 쓴다"],
    a: 0, ex: "지하수 과다 사용은 지반 침하를 부릅니다. 재생수와 누수 관리가 핵심입니다." },
  { t: "해수면 상승과 침수", city: "저지대 해안도시",
    d: "만조 때마다 도로가 물에 잠기는 일이 잦아졌습니다.",
    c: ["방재 시설과 빗물 저류 공간을 확보하고 토지 이용을 조정한다", "바다를 콘크리트로 완전히 덮는다", "비 오는 날 도시를 폐쇄한다"],
    a: 0, ex: "제방·배수 시설과 함께 물을 머금는 공간(그린 인프라)을 확보하는 방식이 쓰입니다." },
  { t: "대기오염", city: "분지 지형 도시",
    d: "겨울철 공기가 정체되며 미세먼지 농도가 높아집니다.",
    c: ["배출 규제와 친환경 교통 전환을 추진한다", "창문을 모두 없앤다", "도시를 옮긴다"],
    a: 0, ex: "분지에서는 오염 물질이 잘 빠져나가지 못하므로 배출량 자체를 줄이는 것이 중요합니다." },
  { t: "쓰레기 처리 문제", city: "인구 급증 도시",
    d: "매립지가 거의 다 차서 새로운 처리 방법이 필요합니다.",
    c: ["분리배출·재활용을 확대하고 발생량 자체를 줄인다", "쓰레기를 바다에 버린다", "다른 나라로 모두 수출한다"],
    a: 0, ex: "감량-재사용-재활용 순서로 접근하는 것이 지속가능한 도시 폐기물 관리의 기본입니다." },
  { t: "도심 공동화", city: "구도심",
    d: "사람들이 신도시로 빠져나가 도심 상가가 비어 갑니다.",
    c: ["도심 재생 사업으로 주거·문화 기능을 다시 채운다", "구도심을 모두 철거한다", "신도시를 더 멀리 만든다"],
    a: 0, ex: "도시 재생은 기존 시설을 활용해 도심에 다시 활력을 불어넣는 방식입니다." }
];

/* 세계지리 상식 퀴즈 (특별 칸 전용) */
var GEO_QUIZ = [
  { q: "적도가 지나가는 도시는 다음 중 어디일까요?",
    c: ["싱가포르", "서울", "런던"], a: 0,
    ex: "싱가포르는 적도에서 약 1도 떨어진 곳에 있어 연중 덥고 습합니다." },
  { q: "두 대륙에 걸쳐 있는 도시는?",
    c: ["이스탄불", "파리", "리마"], a: 0,
    ex: "보스포루스 해협을 사이에 두고 유럽과 아시아에 걸쳐 있습니다." },
  { q: "남반구에 있는 도시로만 짝지어진 것은?",
    c: ["시드니 – 리우데자네이루", "런던 – 도쿄", "카이로 – 뉴욕"], a: 0,
    ex: "남반구 도시는 북반구와 계절이 반대로 나타납니다." },
  { q: "세계에서 인구가 가장 많은 도시권으로 꼽히는 곳은?",
    c: ["도쿄 수도권", "오클랜드 광역권", "프라하 광역권"], a: 0,
    ex: "도쿄 수도권은 약 3,700만 명으로 세계 최대 규모입니다." },
  { q: "태평양과 대서양을 잇는 운하가 있는 나라는?",
    c: ["파나마", "이집트", "네덜란드"], a: 0,
    ex: "파나마 운하는 지협을 가로질러 두 대양을 연결합니다." },
  { q: "지중해성 기후 도시의 여름 날씨로 알맞은 것은?",
    c: ["덥고 건조하다", "덥고 비가 아주 많다", "춥고 눈이 온다"], a: 0,
    ex: "로마·바르셀로나·아테네처럼 여름이 고온 건조하고 겨울에 비가 옵니다." },
  { q: "적도 부근인데도 서늘한 도시들의 공통점은?",
    c: ["해발고도가 높다", "북극과 가깝다", "사막에 있다"], a: 0,
    ex: "나이로비·보고타·아디스아바바는 모두 고원에 자리한 고산 도시입니다." },
  { q: "'수도'와 '최대 도시'가 서로 다른 나라는?",
    c: ["오스트레일리아(캔버라 – 시드니)", "대한민국(서울 – 서울)", "프랑스(파리 – 파리)"], a: 0,
    ex: "오스트레일리아·튀르키예·나이지리아 등은 수도와 최대 도시가 다릅니다." },
  { q: "삼각주에 발달한 도시로 알맞은 것은?",
    c: ["다카", "산티아고", "덴버"], a: 0,
    ex: "다카는 갠지스·브라마푸트라강 삼각주에 자리해 홍수에 취약합니다." },
  { q: "말라카 해협의 관문에 위치한 도시국가는?",
    c: ["싱가포르", "두바이", "아바나"], a: 0,
    ex: "말라카 해협은 인도양과 태평양을 잇는 세계적 해상 교통로입니다." },
  { q: "'도시 열섬 현상'을 줄이는 방법으로 알맞은 것은?",
    c: ["도시 숲과 바람길을 늘린다", "포장 도로를 더 늘린다", "건물을 더 촘촘히 세운다"], a: 0,
    ex: "녹지와 수변 공간은 증발산을 통해 기온을 낮춥니다." },
  { q: "다음 중 사막 기후 도시는?",
    c: ["두바이", "밴쿠버", "프라하"], a: 0,
    ex: "두바이는 강수량이 매우 적은 사막 기후에 속합니다." },
  { q: "안데스산맥과 태평양 사이 해안 사막에 있는 도시는?",
    c: ["리마", "부에노스아이레스", "몬트리올"], a: 0,
    ex: "리마는 페루 해류의 영향으로 비가 거의 오지 않는 해안 사막에 있습니다." },
  { q: "간척지 위에 발달해 해수면보다 낮은 땅이 많은 도시는?",
    c: ["암스테르담", "아테네", "나이로비"], a: 0,
    ex: "네덜란드는 제방과 배수로 바다를 막아 국토를 넓혔습니다." },
  { q: "도시가 커지면서 농촌 인구가 도시로 이동하는 현상을 무엇이라 할까요?",
    c: ["이촌향도", "귀농귀촌", "도시 소멸"], a: 0,
    ex: "일자리와 교육 기회를 찾아 도시로 이동하는 흐름을 이촌향도라고 합니다." },
  { q: "다음 중 오대호 연안에 있는 도시는?",
    c: ["시카고", "리스본", "카이로"], a: 0,
    ex: "시카고는 미시간호 남서안에 자리한 내륙 물류 중심 도시입니다." }
];

/* =========================================================================
 * [D] 세계지도
 *  - 해안선은 Natural Earth 110m GeoJSON을 SVG 경로로 변환한 world.js 를 사용한다.
 *  - world.js 가 없으면 아래 LANDS 개략도로 대체한다.
 * ========================================================================= */
var MAP_VIEW = { w: 1000, h: 520, latTop: 85, latBottom: -60 };

function projX(lon) { return (lon + 180) / 360 * MAP_VIEW.w; }
function projY(lat) { return (MAP_VIEW.latTop - lat) / (MAP_VIEW.latTop - MAP_VIEW.latBottom) * MAP_VIEW.h; }

/* [경도, 위도] 순서. 수업용 개략도이되 반도·만·섬이 식별되도록 점을 늘렸다.
 * 정밀 데이터가 없는 조각은 기존 윤곽을 그대로 쓴다(지도가 비지 않게). */
var LANDS = [
  /* 북아메리카 */
  [[-168,66],[-166,64],[-165,60],[-166,56],[-162,55],[-153,57],[-148,60],[-141,60],[-140,70],[-135,69],
   [-128,71],[-120,69],[-110,68],[-100,68],[-92,70],[-85,73],[-75,73],[-68,70],[-64,64],[-62,58],
   [-56,53],[-55,51],[-60,47],[-65,45],[-67,45],[-70,43],[-70,42],[-73,41],[-74,40],[-75,37],
   [-76,35],[-76,34],[-81,25],[-80,25],[-82,27],[-83,29],[-85,30],[-89,29],[-94,29],[-97,28],
   [-97,26],[-97,22],[-100,20],[-105,21],[-110,24],[-112,25],[-114,27],[-115,30],[-117,32],[-122,34],
   [-124,38],[-124,43],[-125,48],[-127,50],[-131,55],[-136,58],[-145,60],[-152,59],[-160,58],[-166,54]],
  /* 중앙아메리카 */
  [[-97,18],[-95,16],[-92,16],[-90,14],[-87,13],[-84,10],[-80,9],[-77,8],[-77,9],[-80,15],[-84,16],[-88,18],[-92,19],[-96,19]],
  /* 쿠바 */
  [[-85,22],[-82,23],[-77,21],[-74,20],[-78,20],[-82,22]],
  /* 그린란드 */
  [[-45,60],[-52,64],[-55,68],[-58,72],[-50,78],[-40,81],[-30,83],[-22,81],[-20,76],[-22,70],[-28,66],[-36,62],[-42,60]],
  /* 남아메리카 */
  [[-81,8],[-77,9],[-73,12],[-68,12],[-62,10],[-55,6],[-50,1],[-48,-1],[-44,-2],[-38,-7],
   [-35,-5],[-35,-8],[-39,-16],[-41,-22],[-48,-25],[-49,-28],[-53,-34],[-56,-37],[-58,-38],[-62,-40],
   [-65,-43],[-66,-48],[-68,-52],[-70,-55],[-71,-52],[-73,-47],[-74,-42],[-72,-36],[-71,-30],[-70,-20],
   [-73,-16],[-77,-14],[-80,-8],[-81,-4],[-80,0]],
  /* 아프리카 */
  [[-17,15],[-16,21],[-14,26],[-10,31],[-6,35],[-1,36],[4,37],[10,37],[12,33],[20,32],
   [25,32],[30,31],[32,31],[34,28],[35,24],[36,20],[39,16],[43,12],[47,12],[51,12],
   [51,11],[47,8],[44,2],[43,-1],[41,-2],[41,-8],[40,-12],[37,-18],[35,-24],[33,-26],
   [29,-32],[26,-34],[20,-35],[18,-33],[16,-29],[14,-22],[12,-17],[11,-10],[9,-1],[9,4],
   [5,5],[1,5],[-4,5],[-8,4],[-10,6],[-13,8],[-16,12]],
  /* 마다가스카르 */
  [[43,-12],[47,-13],[50,-15],[50,-22],[47,-25],[44,-25],[43,-20],[43,-16]],
  /* 유럽 본토 */
  [[-9,42],[-9,37],[-8,37],[-6,36],[-5,36],[-2,37],[0,39],[3,42],[4,43],[7,44],
   [9,44],[10,43],[12,45],[14,45],[16,43],[18,40],[19,40],[21,39],[22,37],[24,38],
   [24,41],[26,41],[28,41],[29,41],[30,45],[32,46],[36,45],[38,47],[40,50],[42,52],
   [45,55],[48,58],[50,60],[44,66],[38,69],[30,71],[22,70],[16,69],[12,66],[8,63],
   [5,60],[5,58],[8,57],[11,58],[12,56],[10,54],[7,54],[4,53],[1,53],[-2,50],
   [-4,48],[-1,46],[-1,45],[-4,43]],
  /* 이탈리아 */
  [[8,44],[10,44],[13,43],[14,42],[15,41],[17,41],[18,40],[16,39],[15,38],[13,38],[12,41],[10,42],[9,44]],
  /* 영국 */
  [[-5,50],[-5,54],[-4,57],[-3,58],[0,58],[1,53],[-1,51],[-4,50]],
  /* 아일랜드 */
  [[-10,52],[-8,55],[-6,53],[-8,51],[-10,52]],
  /* 아이슬란드 */
  [[-24,64],[-22,66],[-14,65],[-14,63],[-20,63]],
  /* 아시아 본토 */
  [[30,45],[36,45],[42,42],[48,42],[52,40],[55,37],[56,34],[60,30],[60,25],[64,25],
   [66,24],[68,23],[70,20],[72,21],[73,18],[76,10],[78,8],[80,6],[80,10],[82,16],
   [85,20],[88,22],[91,22],[94,18],[97,13],[99,8],[101,3],[103,1],[104,1],[105,6],
   [106,10],[109,11],[109,15],[108,18],[110,21],[116,23],[120,25],[122,30],[122,38],
   [124,40],[126,40],[128,41],[130,42],[134,44],[138,48],[140,52],[142,53],[145,59],
   [152,59],[160,61],[170,66],[180,66],[180,71],[165,71],[150,72],[130,73],[110,76],
   [90,77],[75,74],[62,71],[55,68],[48,67],[42,66],[40,62],[44,58],[42,54],[38,47],[34,45]],
  /* 한반도 */
  [[125,34],[126,33],[129,35],[129,38],[128,40],[127,38],[126,37],[125,35]],
  /* 아라비아 */
  [[34,31],[36,29],[40,20],[44,13],[48,14],[52,23],[56,26],[54,22],[48,18],[43,16],[39,21],[36,28]],
  /* 일본 혼슈·규슈 */
  [[130,31],[131,33],[133,34],[136,35],[139,35],[141,38],[141,41],[142,42],[145,44],[142,45],
   [140,41],[139,38],[137,35],[135,34],[132,33],[131,32]],
  /* 홋카이도 */
  [[140,42],[142,42],[145,44],[145,45],[141,45],[140,43]],
  /* 대만 */
  [[120,22],[122,25],[122,23],[121,22]],
  /* 수마트라 */
  [[95,6],[98,4],[101,2],[104,-3],[106,-6],[103,-6],[100,-1],[97,2]],
  /* 자바 */
  [[105,-6],[110,-7],[114,-8],[114,-9],[108,-8],[105,-7]],
  /* 보르네오 */
  [[109,1],[113,7],[117,7],[119,4],[117,-3],[112,-3],[109,-1]],
  /* 술라웨시 */
  [[119,1],[122,2],[125,1],[124,-3],[121,-6],[120,-2]],
  /* 필리핀 */
  [[120,18],[122,19],[124,18],[126,13],[126,7],[124,6],[122,6],[120,10],[120,14]],
  /* 뉴기니 */
  [[131,-1],[136,-2],[141,-3],[147,-6],[150,-6],[147,-10],[141,-9],[135,-8],[132,-4]],
  /* 오스트레일리아 */
  [[114,-22],[113,-26],[115,-32],[116,-34],[120,-34],[125,-32],[129,-32],[132,-32],[135,-35],
   [138,-36],[141,-38],[145,-39],[149,-38],[151,-37],[153,-32],[153,-28],[153,-25],[150,-22],
   [146,-19],[143,-12],[142,-11],[137,-12],[134,-12],[131,-11],[125,-14],[122,-17],[119,-20]],
  /* 태즈메이니아 */
  [[145,-41],[148,-41],[148,-43],[145,-43]],
  /* 뉴질랜드 북섬 */
  [[172,-35],[175,-36],[178,-38],[176,-40],[174,-39],[172,-38]],
  /* 뉴질랜드 남섬 */
  [[172,-41],[174,-42],[171,-45],[167,-46],[169,-47],[172,-44],[171,-42]]
];

/* =========================================================================
 * [E] 저장소 유틸 (localStorage)
 *  - 브라우저 저장소 사용이 막혀 있어도 게임이 멈추지 않도록 모두 try/catch 처리
 * ========================================================================= */
var Store = {
  get: function (key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      if (!raw) return fallback;
      var val = JSON.parse(raw);
      return (val === null || val === undefined) ? fallback : val;
    } catch (e) { return fallback; }
  },
  set: function (key, value) {
    try { window.localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  },
  remove: function (key) {
    try { window.localStorage.removeItem(key); } catch (e) {}
  }
};

/* 기본 설정값 : 첫 실행 시 효과음 낮은 음량으로 켜짐 */
var DEFAULT_SETTINGS = {
  sfx: true,  sfxVol: 30,
  defaultMode: "basic",   // 선생님 설정 기본 모드
  quizRetry: true,        // 오답 시 재도전 허용
  useSpecials: true,      // 특별 칸 이벤트 사용
  animSpeed: "normal",    // slow / normal / fast
  showHint: true,         // 재도전 시 힌트 제공
  codexUnlockAll: false,  // 도감·아틀라스 전체 공개
  lockUndiscovered: false, // 미발견 도시 잠금 (기본 꺼짐)
  allowExternalImages: true, // 외부 URL 이미지 허용
  sessionCode: "",          // 결과 요약 코드 접두 (선생님 설정)
  teacherPin: "1234"        // 선생님 메뉴 PIN (기본 1234)
};

var settings = Object.assign({}, DEFAULT_SETTINGS, Store.get(LS.settings, {}));
function saveSettings() { Store.set(LS.settings, settings); }

/* 누적 발견 도시(도감) */
var codexSet = Store.get(LS.codex, []);
function codexAdd(id) {
  if (codexSet.indexOf(id) === -1) { codexSet.push(id); Store.set(LS.codex, codexSet); }
}
function codexHas(id) { return settings.codexUnlockAll || codexSet.indexOf(id) !== -1; }

/* 누적 스탬프(게임 판을 넘어 여권에 남음) */
var stampSet = Store.get(LS.stamps, []);
function stampAdd(id) {
  if (stampSet.indexOf(id) === -1) { stampSet.push(id); Store.set(LS.stamps, stampSet); }
}
function stampHas(id) {
  if (stampSet.indexOf(id) !== -1) return true;
  if (game && game.stamped && game.stamped.indexOf(id) !== -1) return true;
  return false;
}
function hydrateStamps() {
  var results = Store.get(LS.results, []);
  var changed = false;
  results.forEach(function (r) {
    (r.stamps || []).forEach(function (id) {
      if (stampSet.indexOf(id) === -1) { stampSet.push(id); changed = true; }
    });
  });
  if (changed) Store.set(LS.stamps, stampSet);
}
function cityKnown(id) {
  if (!settings.lockUndiscovered) return true;
  return codexHas(id);
}

/* =========================================================================
 * [F] 사운드 엔진 (Web Audio API)
 *  - 별도 음원 파일 없이 오실레이터로 효과음을 생성한다.
 *  - 브라우저 자동재생 정책을 지켜 첫 사용자 상호작용 이후에만 소리를 낸다.
 *  - 오디오를 지원하지 않아도 게임 진행에는 영향이 없다.
 * ========================================================================= */
var Sound = (function () {
  var ctx = null, master = null, unlocked = false, failed = false;

  function ensure() {
    if (failed) return null;
    if (ctx) return ctx;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { failed = true; return null; }
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 1;
      master.connect(ctx.destination);
      return ctx;
    } catch (e) { failed = true; return null; }
  }

  /* 첫 상호작용에서 오디오 컨텍스트를 깨운다 */
  function unlock() {
    var c = ensure();
    if (!c) return;
    if (c.state === "suspended") { try { c.resume(); } catch (e) {} }
    unlocked = true;
  }

  /* 단순 톤 하나 */
  function tone(freq, dur, type, vol, delay, slideTo) {
    var c = ensure();
    if (!c || !unlocked || !settings.sfx) return;
    try {
      var t0 = c.currentTime + (delay || 0);
      var osc = c.createOscillator();
      var g = c.createGain();
      osc.type = type || "sine";
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      var peak = (vol === undefined ? 0.5 : vol) * (settings.sfxVol / 100) * 0.5;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(g); g.connect(master);
      osc.start(t0); osc.stop(t0 + dur + 0.03);
    } catch (e) {}
  }

  /* 짧은 노이즈(주사위 굴리는 느낌) */
  function noise(dur, vol) {
    var c = ensure();
    if (!c || !unlocked || !settings.sfx) return;
    try {
      var len = Math.floor(c.sampleRate * dur);
      var buf = c.createBuffer(1, len, c.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      var src = c.createBufferSource(); src.buffer = buf;
      var g = c.createGain();
      g.gain.value = (vol === undefined ? 0.25 : vol) * (settings.sfxVol / 100) * 0.5;
      var f = c.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 1400;
      src.connect(f); f.connect(g); g.connect(master);
      src.start();
    } catch (e) {}
  }

  var SFX = {
    click:   function () { tone(660, 0.07, "triangle", 0.35); },
    dice:    function () { noise(0.42, 0.28); },
    step:    function () { tone(520, 0.07, "square", 0.22); },
    land:    function () { tone(380, 0.16, "triangle", 0.4, 0, 620); },
    correct: function () { tone(660, 0.12, "sine", 0.5); tone(880, 0.14, "sine", 0.5, 0.11); tone(1170, 0.24, "sine", 0.45, 0.22); },
    wrong:   function () { tone(320, 0.18, "sawtooth", 0.28); tone(220, 0.28, "sawtooth", 0.26, 0.15); },
    stamp:   function () { noise(0.09, 0.4); tone(180, 0.22, "sine", 0.5, 0.02); },
    reward:  function () { tone(784, 0.1, "sine", 0.42); tone(1047, 0.16, "sine", 0.4, 0.09); },
    fanfare: function () {
      var seq = [523, 659, 784, 1047, 1319];
      for (var i = 0; i < seq.length; i++) tone(seq[i], 0.3, "triangle", 0.42, i * 0.13);
    }
  };
  function play(name) { if (SFX[name]) { try { SFX[name](); } catch (e) {} } }

  return { unlock: unlock, play: play };
})();

/* =========================================================================
 * [G] 공통 UI 유틸
 * ========================================================================= */
function $(sel, root) { return (root || document).querySelector(sel); }
function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
function el(tag, cls, html) {
  var n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html !== undefined) n.innerHTML = html;
  return n;
}
/* HTML 이스케이프 : 학생이 입력한 이름 등이 그대로 마크업으로 해석되지 않게 한다 */
function esc(s) {
  return String(s === undefined || s === null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function pad2(n) { return (n < 10 ? "0" : "") + n; }
function todayStr() {
  var d = new Date();
  return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
}
function nowStr() {
  var d = new Date();
  return todayStr() + " " + pad2(d.getHours()) + ":" + pad2(d.getMinutes());
}
function shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function sleep(ms) { return new Promise(function (res) { window.setTimeout(res, ms); }); }

/* 화면 전환 */
var screenStack = [];
var NAV_SCREEN_MAP = {
  "screen-title": "home",
  "screen-atlas": "atlas",
  "screen-compare": "atlas",
  "screen-passport": "passport",
  "screen-setup": "play",
  "screen-game": "play"
};

function updateSiteNav(screenId) {
  var key = NAV_SCREEN_MAP[screenId] || "";
  $$(".site-nav-btn").forEach(function (b) {
    b.classList.toggle("is-active", b.getAttribute("data-nav") === key);
  });
}

function showScreen(id, remember) {
  var cur = $(".screen.is-active");
  if (cur && cur.id === id) {
    updateSiteNav(id);
    return;
  }
  closeModal(true);
  if (cur && cur.id === id) {
    updateSiteNav(id);
    return;
  }
  if (cur && remember) screenStack.push(cur.id);
  $$(".screen").forEach(function (s) { s.classList.remove("is-active"); });
  var next = document.getElementById(id);
  if (next) next.classList.add("is-active");
  updateSiteNav(id);
  if (tutorialActive) {
    var need = { home: "screen-title", atlas: "screen-atlas", play: "screen-game", passport: "screen-passport" }[tutorialKind];
    if (need && id !== need) closeTutorial(false);
  }
  try { window.scrollTo(0, 0); } catch (e) {}
}
function backScreen(fallback) {
  var prev = screenStack.pop();
  showScreen(prev || fallback || "screen-title");
}

/* 토스트 (ms: 표시 시간, 기본 2300) */
function toast(msg, kind, ms) {
  var root = $("#toast-root");
  if (!root) return;
  var t = el("div", "toast" + (kind ? " " + kind : ""), esc(msg));
  root.appendChild(t);
  window.setTimeout(function () {
    t.classList.add("is-out");
    window.setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 320);
  }, ms || 2300);
}

/* 모달
 *  opts : { title, eyebrow, body(HTML), buttons:[{label,cls,act}], size, closable, onClose }
 *  반환값 : 모달 DOM (버튼 핸들러에서 closeModal() 호출) */
var modalOpen = false;
function dismissModal(opts) {
  closeModal();
  if (opts && opts.onClose) opts.onClose();
  else if (busy && game && !game.finished) endTurn();
}
function parkModalSheets() {
  var park = $("#sheet-park");
  if (!park) return;
  ["office-sheet", "guide-sheet"].forEach(function (id) {
    var n = document.getElementById(id);
    if (n && n.parentNode !== park) park.appendChild(n);
  });
}

function openModal(opts) {
  closeModal(true);
  var back = el("div", "modal-back");
  var m = el("div", "modal" + (opts.size ? " " + opts.size : ""));

  var head = el("div", "modal-head");
  head.innerHTML =
    "<div><div class='eyebrow'>" + esc(opts.eyebrow || APP.name) + "</div>" +
    "<h3>" + (opts.title || "") + "</h3></div>";
  var x = el("button", "modal-x", "✕");
  x.setAttribute("aria-label", "닫기");
  x.addEventListener("click", function () { Sound.play("click"); dismissModal(opts); });
  head.appendChild(x);
  m.appendChild(head);

  var body = el("div", "modal-body");
  body.innerHTML = opts.body || "";
  if (opts.mount) opts.mount(body, m);
  m.appendChild(body);

  if (opts.buttons && opts.buttons.length) {
    var foot = el("div", "modal-foot");
    opts.buttons.forEach(function (b) {
      var btn = el("button", "btn " + (b.cls || "btn-light"), b.label);
      if (b.id) btn.id = b.id;
      btn.addEventListener("click", function () { Sound.play("click"); if (b.act) b.act(m); });
      foot.appendChild(btn);
    });
    m.appendChild(foot);
  }

  back.appendChild(m);
  back.addEventListener("mousedown", function (e) {
    if (e.target === back) dismissModal(opts);
  });
  $("#modal-root").appendChild(back);
  modalOpen = true;
  if (opts.autofocus !== false) {
    window.setTimeout(function () {
      var f = m.querySelector("button:not(.modal-x), input, textarea");
      if (f) { try { f.focus(); } catch (e) {} }
    }, 60);
  }
  return m;
}
function closeModal(silent) {
  parkModalSheets();
  var root = $("#modal-root");
  if (root) root.innerHTML = "";
  modalOpen = false;
  if (!silent) { /* 필요 시 후처리 자리 */ }
}

/* 확인 대화상자 */
function confirmDialog(title, message, onYes, yesLabel) {
  var root = $("#modal-root");
  if (!root) return;
  var back = el("div", "modal-back is-nested");
  var m = el("div", "modal narrow");
  var head = el("div", "modal-head");
  head.innerHTML = "<div><div class='eyebrow'>확인</div><h3>" + esc(title) + "</h3></div>";
  m.appendChild(head);
  var body = el("div", "modal-body");
  body.innerHTML = "<p style='font-size:.93rem;line-height:1.7;color:var(--ink-700)'>" + message + "</p>";
  m.appendChild(body);
  var foot = el("div", "modal-foot");
  var cancel = el("button", "btn btn-light", "취소");
  var ok = el("button", "btn btn-navy", yesLabel || "확인");
  function remove() {
    if (back.parentNode) back.parentNode.removeChild(back);
  }
  cancel.addEventListener("click", function () { Sound.play("click"); remove(); });
  ok.addEventListener("click", function () { Sound.play("click"); remove(); if (onYes) onYes(); });
  foot.appendChild(cancel);
  foot.appendChild(ok);
  m.appendChild(foot);
  back.appendChild(m);
  back.addEventListener("mousedown", function (e) {
    if (e.target === back) remove();
  });
  root.appendChild(back);
}

/* 색종이 효과 */
function confetti(count) {
  var layer = el("div", "confetti-layer");
  var colors = ["#e0533f", "#e8913a", "#d9b641", "#35a877", "#21a7ae", "#4d7fd6", "#8b6ad6", "#d9569b"];
  var n = count || 70;
  for (var i = 0; i < n; i++) {
    var c = el("div", "confetti");
    c.style.left = (Math.random() * 100) + "%";
    c.style.background = colors[i % colors.length];
    c.style.animationDuration = (1.7 + Math.random() * 1.6) + "s";
    c.style.animationDelay = (Math.random() * 0.7) + "s";
    c.style.transform = "rotate(" + (Math.random() * 360) + "deg)";
    if (i % 3 === 0) c.style.borderRadius = "50%";
    layer.appendChild(c);
  }
  document.body.appendChild(layer);
  window.setTimeout(function () { if (layer.parentNode) layer.parentNode.removeChild(layer); }, 4200);
}

/* 애니메이션 속도(선생님 설정 반영) */
function moveDuration() {
  if (settings.animSpeed === "fast") return 150;
  if (settings.animSpeed === "slow") return 420;
  return 260;
}

/* 도시 조회 헬퍼 */
var CITY_BY_ID = {};
CITIES.forEach(function (c) { CITY_BY_ID[c.id] = c; });
function getCity(id) { return CITY_BY_ID[id]; }
function regionOf(key) {
  for (var i = 0; i < REGIONS.length; i++) if (REGIONS[i].key === key) return REGIONS[i];
  return REGIONS[0];
}
function regionName(key) { return regionOf(key).name; }
function regionColor(key) { return regionOf(key).color; }

function landmarkSrc(c) {
  if (!c) return "";
  return encodeURI("assets/landmarks/" + c.city + "-" + c.landmark + ".png");
}
function cityFallbackSrc(c) {
  return c ? "assets/cities/" + c.id + ".jpg" : "";
}

/* 초기화 : 도시별 지도 좌표(x, y) 계산 — 설계서의 coordinates {x, y} 값 */
CITIES.forEach(function (c) {
  c.coordinates.x = Math.round(projX(c.coordinates.lon) * 10) / 10;
  c.coordinates.y = Math.round(projY(c.coordinates.lat) * 10) / 10;
  c.continentColor = regionColor(c.region);
  c.regionName = regionName(c.region);
  c.image = landmarkSrc(c);
});

/* 목표 카드 · 비교 · 정렬 — data.js stats 우선, 없으면 문장에서 추출 */
function cityStats(c) {
  if (!c) return { population: 0, elevation: 50, isPort: false };
  if (c._stats) return c._stats;
  if (c.stats) {
    var fnText = (c.urbanFunction || "") + (c.industry || "") + (c.geography || "") + (c.keywords || []).join("");
    var isPort = (c.functions || []).indexOf("항구") >= 0 ||
      /항만|항구|항|컨테이너|port|harbor|harbour/i.test(fnText);
    c._stats = {
      population: c.stats.population || 0,
      elevation: c.stats.elevation != null ? c.stats.elevation : 50,
      isPort: isPort,
      tempJan: c.stats.tempJan,
      tempJul: c.stats.tempJul,
      annualRain: c.stats.annualRain,
      climateZone: c.stats.climateZone,
      tempMonth: c.stats.tempMonth,
      rainMonth: c.stats.rainMonth
    };
    return c._stats;
  }
  var pop = 0;
  var pm = (c.populationScale || "").match(/([\d,]+)\s*만\s*명/);
  if (pm) pop = parseInt(pm[1].replace(/,/g, ""), 10) * 10000;
  var pe = (c.populationScale || "").match(/([\d,]+)\s*억/);
  if (pe) pop = Math.round(parseFloat(pe[1].replace(/,/g, "")) * 100000000);

  var blob = (c.geography || "") + " " + (c.climate || "") + " " + (c.interestingFact || "");
  var elev = 50;
  var em = blob.match(/해발\s*([\d,]+)\s*m/);
  if (em) elev = parseInt(em[1].replace(/,/g, ""), 10);
  else if (/고원|고지대/.test(blob + (c.keywords || []).join(" "))) elev = 1200;

  var fnText2 = (c.urbanFunction || "") + (c.industry || "") + (c.geography || "") + (c.keywords || []).join(" ");
  var isPort2 = /항만|항구|항|컨테이너|port|harbor|harbour/i.test(fnText2);

  c._stats = { population: pop, elevation: elev, isPort: isPort2 };
  return c._stats;
}

function fmtPop(n) {
  if (!n) return "—";
  if (n >= 100000000) return (n / 100000000).toFixed(1).replace(/\.0$/, "") + "억";
  if (n >= 10000) return Math.round(n / 10000).toLocaleString() + "만";
  return n.toLocaleString();
}

var FUNCTION_FILTERS = ["ALL", "수도", "항구", "금융", "관광", "산업", "문화"];
var ATLAS_SORTS = [
  { key: "name", label: "이름" },
  { key: "pop", label: "인구↓" },
  { key: "elev", label: "해발↓" },
  { key: "rain", label: "강수↓" }
];

function climateChartHTML(cities) {
  cities = (cities || []).filter(Boolean);
  if (!cities.length) return "";
  if (cities.length === 1) return cityClimateHTML(cities[0]);
  return "<div class='climate-compare'>" +
    cities.map(function (c) { return cityClimateHTML(c); }).join("") +
    "</div>";
}

var KOEPPEN_KO = {
  Af: "열대 우림", Am: "열대 몬순", Aw: "열대 사바나",
  BWh: "사막", BSh: "스텝(반건조)", BSk: "냉대 스텝",
  Cfa: "온대 습윤", Cfb: "서안 해양성", Cwa: "온대 동계건조",
  Cwb: "고지 온대", Csa: "지중해성", Csb: "지중해성(서안)",
  Dwa: "냉대 동계건조", Dfa: "냉대 습윤", Dfb: "냉대 습윤"
};

function monthClimate(c) {
  var st = cityStats(c) || {};
  var t = (st.tempMonth && st.tempMonth.length === 12) ? st.tempMonth : null;
  var r = (st.rainMonth && st.rainMonth.length === 12) ? st.rainMonth : null;
  return { t: t, r: r, st: st };
}

function climographSVG(c) {
  var m = monthClimate(c);
  if (!m.t || !m.r) return "";
  var temps = m.t, rains = m.r;
  var W = 420, H = 210;
  var padL = 38, padR = 42, padT = 18, padB = 32;
  var plotW = W - padL - padR, plotH = H - padT - padB;
  var minT = Math.min.apply(null, temps);
  var maxT = Math.max.apply(null, temps);
  var maxR = Math.max.apply(null, rains);
  var tMin = Math.floor((minT - 2) / 5) * 5;
  var tMax = Math.ceil((maxT + 2) / 5) * 5;
  if (tMax <= tMin) { tMin -= 5; tMax += 10; }
  if (tMax - tMin < 15) tMax = tMin + 15;
  var rMax = Math.max(50, Math.ceil((maxR || 1) / 50) * 50);
  function xAt(i) { return padL + (i + 0.5) * plotW / 12; }
  function yTemp(t) { return padT + (tMax - t) / (tMax - tMin) * plotH; }
  function yRain(r) { return padT + plotH - r / rMax * plotH; }
  var barW = plotW / 12 * 0.62;
  var html = "<svg class='climograph' viewBox='0 0 " + W + " " + H + "' role='img' aria-label='" +
    esc(c.city) + " 월별 기온·강수량 기후 그래프'>";
  html += "<rect x='" + padL + "' y='" + padT + "' width='" + plotW + "' height='" + plotH + "' class='cg-plot'/>";
  var tStep = (tMax - tMin) <= 30 ? 5 : 10;
  for (var tv = tMin; tv <= tMax; tv += tStep) {
    var y = yTemp(tv);
    html += "<line x1='" + padL + "' y1='" + y.toFixed(1) + "' x2='" + (padL + plotW) + "' y2='" + y.toFixed(1) + "' class='cg-grid'/>";
    html += "<text x='" + (padL - 6) + "' y='" + (y + 3).toFixed(1) + "' class='cg-axis cg-temp-axis' text-anchor='end'>" + tv + "</text>";
  }
  var rStep = rMax <= 100 ? 25 : (rMax <= 200 ? 50 : (rMax <= 400 ? 100 : 200));
  for (var rv = 0; rv <= rMax; rv += rStep) {
    var yr = yRain(rv);
    html += "<text x='" + (padL + plotW + 6) + "' y='" + (yr + 3).toFixed(1) + "' class='cg-axis cg-rain-axis' text-anchor='start'>" + rv + "</text>";
  }
  html += "<text x='" + (padL - 28) + "' y='" + (padT - 6) + "' class='cg-unit cg-temp-axis'>°C</text>";
  html += "<text x='" + (padL + plotW + 28) + "' y='" + (padT - 6) + "' class='cg-unit cg-rain-axis' text-anchor='middle'>mm</text>";
  for (var i = 0; i < 12; i++) {
    var x = xAt(i);
    var hBar = Math.max(0, padT + plotH - yRain(rains[i]));
    html += "<rect x='" + (x - barW / 2).toFixed(1) + "' y='" + yRain(rains[i]).toFixed(1) +
      "' width='" + barW.toFixed(1) + "' height='" + hBar.toFixed(1) + "' class='cg-bar'/>";
  }
  var pts = [];
  for (var j = 0; j < 12; j++) pts.push(xAt(j).toFixed(1) + "," + yTemp(temps[j]).toFixed(1));
  html += "<polyline points='" + pts.join(" ") + "' class='cg-line'/>";
  for (var k = 0; k < 12; k++) {
    html += "<circle cx='" + xAt(k).toFixed(1) + "' cy='" + yTemp(temps[k]).toFixed(1) + "' r='2.4' class='cg-dot'/>";
    html += "<text x='" + xAt(k).toFixed(1) + "' y='" + (H - 10) + "' class='cg-month' text-anchor='middle'>" + (k + 1) + "</text>";
  }
  html += "<line x1='" + padL + "' y1='" + (padT + plotH) + "' x2='" + (padL + plotW) + "' y2='" + (padT + plotH) + "' class='cg-base'/>";
  html += "</svg>";
  return html;
}

function cityClimateHTML(c, compact) {
  var m = monthClimate(c);
  if (!m.t || !m.r) return "";
  var st = m.st;
  var south = c.coordinates && c.coordinates.lat < 0;
  var zone = st.climateZone || "";
  var zoneKo = KOEPPEN_KO[zone] || "";
  var rainSum = m.r.reduce(function (a, b) { return a + b; }, 0);
  var tMin = Math.min.apply(null, m.t);
  var tMax = Math.max.apply(null, m.t);
  var zoneBit = zone ? " · 쾨펜 " + esc(zone) + (zoneKo ? " (" + esc(zoneKo) + ")" : "") : "";
  if (compact) {
    return "<div class='climate-block compact'>" +
      "<div class='cb-head'>기후 그래프 · 1~12월" + zoneBit + "</div>" +
      climographSVG(c) +
      "<div class='cg-legend'>" +
        "<span class='cg-leg rain'>막대 강수량</span>" +
        "<span class='cg-leg temp'>선 기온</span>" +
      "</div>" +
      "<div class='cb-sum'>" +
        "최저기온 " + tMin + "°C · 최고기온 " + tMax + "°C · 연강수 " + rainSum + " mm" +
      "</div></div>";
  }
  return "<div class='climate-block'>" +
    "<div class='cb-head'>기후 그래프 · 1~12월" + zoneBit + "</div>" +
    "<div class='cb-city'>" + esc(c.city) + "</div>" +
    climographSVG(c) +
    "<div class='cg-legend'>" +
      "<span class='cg-leg rain'>막대 강수량</span>" +
      "<span class='cg-leg temp'>선 기온</span>" +
    "</div>" +
    "<div class='cb-sum'>" +
      "최저기온 " + tMin + "°C · 최고기온 " + tMax + "°C · 연강수 " + rainSum + " mm" +
    "</div>" +
    "<p class='cb-note'>" + (south
      ? "남반구 도시라 1월이 한여름, 7월이 한겨울에 가깝습니다."
      : "북반구 도시라 1월이 한겨울, 7월이 한여름에 가깝습니다.") +
    "</p></div>";
}

function cityLocatorHTML(c) {
  return "<div class='city-locator'>" +
    "<div class='cl-title'>이 도시의 위치</div>" +
    "<svg class='city-locator-map' viewBox='0 0 " + MAP_VIEW.w + " " + MAP_VIEW.h +
      "' role='img' aria-label='" + esc(c.city) + "의 위치 지도' data-city='" + c.id + "'></svg>" +
    "<div class='cl-coord'>" + fmtCoord(c) + "</div></div>";
}

function mountCityLocator(root, c) {
  var svg = root.querySelector(".city-locator-map");
  if (!svg || !c) return;
  drawMapBase(svg);
  var ns = "http://www.w3.org/2000/svg";
  var cx = c.coordinates.x, cy = c.coordinates.y;
  var ring = document.createElementNS(ns, "circle");
  ring.setAttribute("cx", cx); ring.setAttribute("cy", cy);
  ring.setAttribute("r", "14");
  ring.setAttribute("class", "cl-ring");
  svg.appendChild(ring);
  var dot = document.createElementNS(ns, "circle");
  dot.setAttribute("cx", cx); dot.setAttribute("cy", cy);
  dot.setAttribute("r", "5");
  dot.setAttribute("class", "cl-pin");
  svg.appendChild(dot);
  var label = document.createElementNS(ns, "text");
  label.setAttribute("x", cx);
  label.setAttribute("y", cy - 18);
  label.setAttribute("text-anchor", "middle");
  label.setAttribute("class", "cl-name");
  label.setAttribute("font-size", "13");
  label.setAttribute("stroke-width", "3");
  label.textContent = c.city;
  svg.appendChild(label);

  var pad = 130;
  var w = pad * 2;
  var h = w * (MAP_VIEW.h / MAP_VIEW.w);
  var x = cx - w / 2, y = cy - h / 2;
  x = Math.min(Math.max(0, x), MAP_VIEW.w - w);
  y = Math.min(Math.max(0, y), MAP_VIEW.h - h);
  svg.setAttribute("viewBox", x.toFixed(1) + " " + y.toFixed(1) + " " + w.toFixed(1) + " " + h.toFixed(1));
}

function goalDef(id) {
  for (var i = 0; i < GOAL_CATALOG.length; i++) if (GOAL_CATALOG[i].id === id) return GOAL_CATALOG[i];
  return null;
}
function pickGoals(n) {
  return shuffle(GOAL_CATALOG).slice(0, n).map(function (g) { return { id: g.id, done: false }; });
}
function checkGoals() {
  if (!game || !game.goals) return;
  var changed = false;
  game.goals.forEach(function (g) {
    if (g.done) return;
    var def = goalDef(g.id);
    if (def && def.check(game)) {
      g.done = true;
      changed = true;
      addScore(def.bonus, "score");
      addLog("🎯 목표 달성 · " + esc(def.title) + " +" + def.bonus, "gold");
      toast("여행 목표 달성! +" + def.bonus + "점", "good");
      Sound.play("reward");
    }
  });
  if (changed) renderGoalCards();
}

function isSoloGame(g) {
  g = g || game;
  return !!(g && (g.playMode === "solo" || (g.group.members && g.group.members.length === 1)));
}
function travelerName(g) {
  g = g || game;
  if (!g) return "";
  return g.group.members[0] || g.group.name || "여행자";
}
function groupLabel(g) {
  return isSoloGame(g) ? "여행자" : "팀";
}

var DEFAULT_PROFILE = { bestScore: 0, bestStamps: 0, bestRegions: 0, playCount: 0, gamesFinished: 0 };
function getProfile() { return Object.assign({}, DEFAULT_PROFILE, Store.get(LS.profile, {})); }
function saveProfile(p) { Store.set(LS.profile, p); }

var DEFAULT_USER = { role: "student", school: "", grade: "", klass: "", name: "" };
function getUser() { return Object.assign({}, DEFAULT_USER, Store.get(LS.user, {})); }
function saveUser(u) { Store.set(LS.user, u); }
function userKlassLabel() {
  var u = getUser();
  var parts = [];
  if (u.grade) parts.push(u.grade + "학년");
  if (u.klass) parts.push(u.klass + "반");
  var g = parts.join(" ");
  if (u.school && g) return u.school + " " + g;
  return g || u.school || "";
}
function updateProfileFromGame() {
  if (!game) return;
  var p = getProfile();
  p.gamesFinished++;
  if (game.score > p.bestScore) p.bestScore = game.score;
  var stamps = CITIES.filter(function (c) { return stampHas(c.id); }).length;
  if (stamps > p.bestStamps) p.bestStamps = stamps;
  if (game.regionsCleared.length > p.bestRegions) p.bestRegions = game.regionsCleared.length;
  saveProfile(p);
}
function bumpPlayCount() {
  var p = getProfile();
  p.playCount++;
  saveProfile(p);
}

var atlasQuizDone = Store.get(LS.atlasQuiz, {});
function saveAtlasQuizDone() { Store.set(LS.atlasQuiz, atlasQuizDone); }

function isExternalSrc(src) {
  return /^https?:\/\//i.test(src || "");
}
function cityImageList(c) {
  var list = [];
  if (c) {
    list.push({ src: landmarkSrc(c), caption: c.landmark, credit: "" });
    list.push({ src: cityFallbackSrc(c), caption: c.landmark, credit: "" });
  }
  if (c && c.images && c.images.length) {
    c.images.forEach(function (im) {
      if (!im) return;
      if (typeof im === "string") list.push({ src: im, caption: c.landmark, credit: "" });
      else if (im.src) list.push({ src: im.src, caption: im.caption || c.landmark, credit: im.credit || "" });
    });
  }
  var seen = {};
  return list.filter(function (im) {
    if (!im.src || seen[im.src]) return false;
    if (!settings.allowExternalImages && isExternalSrc(im.src)) return false;
    seen[im.src] = true;
    return true;
  });
}
function fmtCoord(c) {
  var lat = c.coordinates.lat, lon = c.coordinates.lon;
  var ns = lat >= 0 ? "N" : "S";
  var ew = lon >= 0 ? "E" : "W";
  return Math.abs(lat).toFixed(2) + "°" + ns + "  " + Math.abs(lon).toFixed(2) + "°" + ew;
}

/* =========================================================================
 * [H] 게임 상태 & 보드 생성
 * ========================================================================= */

var BOARD_SIZE = 32;
var SPECIAL_POS = SPECIALS.map(function (s) { return s.pos; });

var game = null;      // 진행 중인 게임 상태
var busy = false;     // 이동/모달 처리 중 입력 차단
var setupDraft = null; // 설정 화면 임시 데이터

/* 9x9 격자에서 보드 인덱스 → grid 위치 (테두리를 따라 정확히 32칸) */
function tileGridPos(i) {
  if (i <= 8)  return { row: 9, col: 1 + i };        // 아래 변 (왼→오)
  if (i <= 16) return { row: 17 - i, col: 9 };       // 오른 변 (아래→위)
  if (i <= 24) return { row: 1, col: 25 - i };       // 위 변 (오→왼)
  return { row: i - 23, col: 1 };                    // 왼 변 (위→아래)
}

/* 게임마다 24개 도시를 선정 : 6개 권역 × 4개, 중복 없음 */
function pickBoardCities() {
  var perRegion = {};
  REGIONS.forEach(function (r) {
    var pool = CITIES.filter(function (c) { return c.region === r.key; });
    perRegion[r.key] = shuffle(pool).slice(0, 4);
  });
  /* 권역이 한쪽에 몰리지 않도록 라운드마다 권역 순서를 섞어 교차 배치 */
  var ordered = [];
  for (var round = 0; round < 4; round++) {
    shuffle(REGIONS).forEach(function (r) { ordered.push(perRegion[r.key][round]); });
  }
  return ordered;
}

/* 보드 32칸 구성 */
function buildTiles() {
  var cities = pickBoardCities();
  var tiles = new Array(BOARD_SIZE);
  SPECIALS.forEach(function (s) {
    tiles[s.pos] = { type: "special", key: s.key };
  });
  var ci = 0;
  for (var i = 0; i < BOARD_SIZE; i++) {
    if (!tiles[i]) { tiles[i] = { type: "city", cityId: cities[ci].id }; ci++; }
  }
  return tiles;
}

/* 새 게임 상태 만들기 */
function createGame(draft) {
  var mode = MODES.filter(function (m) { return m.key === draft.mode; })[0] || MODES[1];
  return {
    v: 2,
    playMode: draft.playMode || "team",
    modeKey: mode.key,
    turnLimit: mode.turns,
    turn: 0,
    group: { klass: draft.klass, name: draft.name, members: draft.members.slice() },
    tokenId: draft.tokenId,
    color: draft.color,
    tiles: buildTiles(),
    pos: 0,
    score: 0,
    visited: [],
    stamped: [],
    regionsCleared: [],
    goals: pickGoals(3),
    memberIdx: 0,
    log: [],
    journal: [],
    photos: [],
    festivals: [],
    quiz: { correct: 0, retry: 0, wrong: 0 },
    startedAt: nowStr(),
    finished: false,
    report: null
  };
}

/* 저장 / 불러오기 */
function saveGame() { if (game) Store.set(LS.save, game); }
function loadGame() { return Store.get(LS.save, null); }
function clearSave() { Store.remove(LS.save); }

function tokenOf(id) {
  for (var i = 0; i < TOKENS.length; i++) if (TOKENS[i].id === id) return TOKENS[i];
  return TOKENS[0];
}

/* ---------------------------- 보드 렌더링 ---------------------------- */
var tileEls = [];

function renderBoard() {
  var board = $("#board");
  /* 기존 칸만 제거 (중앙 지도와 말 레이어는 유지) */
  $$(".tile", board).forEach(function (n) { n.parentNode.removeChild(n); });
  tileEls = [];

  game.tiles.forEach(function (t, i) {
    var pos = tileGridPos(i);
    var node;
    if (t.type === "city") {
      var c = getCity(t.cityId);
      if (!c) return;
      node = el("div", "tile tile-city");
      node.style.setProperty("--c", c.continentColor);
      node.innerHTML =
        "<img class='tile-photo' alt='' src='" + landmarkSrc(c) + "'>" +
        "<span class='tile-band'></span>" +
        "<span class='tile-flag'>" + c.flag + "</span>" +
        "<span class='tile-name'>" + esc(c.city) + "</span>" +
        "<span class='tile-icon'>" + c.landmarkIcon + "</span>" +
        "<span class='tile-stamp'>✓</span>";
      node.title = c.city + " · " + c.country + " (" + c.regionName + ")";
    } else {
      var sp = specialOf(t.key);
      node = el("div", "tile tile-special" + (sp.key === "start" ? " tile-start" : ""));
      node.innerHTML =
        "<span class='tile-icon'>" + sp.emoji + "</span>" +
        "<span class='tile-name'>" + esc(sp.name) + "</span>" +
        "<span class='tile-sub'>" + esc(sp.sub) + "</span>";
      node.title = sp.name + " — " + sp.desc;
    }
    node.style.gridRow = pos.row;
    node.style.gridColumn = pos.col;
    node.dataset.idx = i;
    node.setAttribute("role", "button");
    node.setAttribute("tabindex", "0");
    node.addEventListener("click", function () { peekTile(i); });
    node.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); peekTile(i); }
    });
    board.appendChild(node);
    var photo = node.querySelector(".tile-photo");
    if (photo) {
      photo.addEventListener("error", function () { if (photo.parentNode) photo.parentNode.removeChild(photo); });
    }
    tileEls.push(node);
  });

  renderPawn();
  refreshBoardMarks();
  updateBoardScale();
}

function specialOf(key) {
  for (var i = 0; i < SPECIALS.length; i++) if (SPECIALS[i].key === key) return SPECIALS[i];
  return SPECIALS[0];
}

/* 칸을 눌러 미리보기 (게임 진행에는 영향 없음) */
function peekTile(i) {
  if (busy) return;
  var t = game.tiles[i];
  if (t.type === "city") {
    openCityModal(getCity(t.cityId), { preview: true });
  } else {
    var sp = specialOf(t.key);
    openModal({
      eyebrow: "SPECIAL", title: esc(sp.name), size: "narrow",
      body: "<div class='special-hero'><div class='special-emoji'>" + sp.emoji + "</div>" +
            "<div class='special-name'>" + esc(sp.name) + "</div>" +
            "<div class='special-desc'>" + esc(sp.desc) + "</div></div>",
      buttons: [{ label: "닫기", cls: "btn-light", act: function () { closeModal(); } }]
    });
  }
}

/* 방문/스탬프 표시 갱신 */
function refreshBoardMarks() {
  game.tiles.forEach(function (t, i) {
    var node = tileEls[i];
    if (!node) return;
    node.classList.toggle("is-current", i === game.pos);
    if (t.type === "city") {
      node.classList.toggle("is-visited", game.visited.indexOf(t.cityId) !== -1);
      node.classList.toggle("is-stamped", game.stamped.indexOf(t.cityId) !== -1);
    }
  });
}

/* 말 생성 및 위치 */
function renderPawn() {
  var layer = $("#pawn-layer");
  layer.innerHTML = "";
  var tk = tokenOf(game.tokenId);
  var p = el("div", "pawn", tk.emoji);
  p.id = "pawn";
  p.style.setProperty("--tc", game.color);
  p.setAttribute("aria-label", "우리 팀 말");
  layer.appendChild(p);
  movePawnTo(game.pos, true);
}

function movePawnTo(idx, instant) {
  var pawn = $("#pawn");
  var tile = tileEls[idx];
  if (!pawn || !tile) return;
  if (instant) pawn.style.transition = "none";
  var x = tile.offsetLeft + tile.offsetWidth / 2 - pawn.offsetWidth / 2;
  var y = tile.offsetTop + tile.offsetHeight / 2 - pawn.offsetHeight / 2;
  pawn.style.transform = "translate(" + x + "px," + y + "px)";
  if (instant) {
    /* 강제 리플로우 후 트랜지션 복구 */
    void pawn.offsetWidth;
    pawn.style.transition = "";
  }
}

/* 보드 크기에 맞춰 글자/말 크기 기준값 갱신
 *  - 화면 전환 도중 보드 폭이 0에 가깝게 측정되는 경우가 있어 최소값 이상일 때만 반영한다. */
function updateBoardScale() {
  var board = $("#board");
  if (!board) return;
  var w = board.getBoundingClientRect().width;
  if (w >= 200) {
    document.documentElement.style.setProperty("--board-w", w + "px");
  } else {
    window.setTimeout(updateBoardScale, 150); // 레이아웃이 잡힌 뒤 다시 측정
  }
  document.documentElement.style.setProperty("--move-dur", moveDuration() + "ms");
  window.setTimeout(function () { if (game) movePawnTo(game.pos, true); }, 30);
}

/* ------------------------- 중앙 세계지도 ------------------------- */
function landPoints(poly) {
  return poly.map(function (pt) {
    return projX(pt[0]).toFixed(1) + "," + projY(pt[1]).toFixed(1);
  }).join(" ");
}
function drawMapBase(svg) {
  var ns = "http://www.w3.org/2000/svg";
  svg.innerHTML = "";

  var ocean = document.createElementNS(ns, "rect");
  ocean.setAttribute("class", "wm-ocean");
  ocean.setAttribute("x", "0"); ocean.setAttribute("y", "0");
  ocean.setAttribute("width", String(MAP_VIEW.w));
  ocean.setAttribute("height", String(MAP_VIEW.h));
  svg.appendChild(ocean);

  var grid = document.createElementNS(ns, "g");
  grid.setAttribute("class", "wm-grid");
  for (var lon = -150; lon <= 150; lon += 30) {
    var l = document.createElementNS(ns, "line");
    l.setAttribute("x1", projX(lon)); l.setAttribute("y1", 0);
    l.setAttribute("x2", projX(lon)); l.setAttribute("y2", MAP_VIEW.h);
    grid.appendChild(l);
  }
  for (var lat = -45; lat <= 75; lat += 30) {
    var h = document.createElementNS(ns, "line");
    h.setAttribute("x1", 0); h.setAttribute("y1", projY(lat));
    h.setAttribute("x2", MAP_VIEW.w); h.setAttribute("y2", projY(lat));
    grid.appendChild(h);
  }
  var eq = document.createElementNS(ns, "line");
  eq.setAttribute("x1", 0); eq.setAttribute("y1", projY(0));
  eq.setAttribute("x2", MAP_VIEW.w); eq.setAttribute("y2", projY(0));
  eq.setAttribute("stroke", "rgba(37, 99, 235, 0.22)");
  eq.setAttribute("stroke-dasharray", "6 6");
  grid.appendChild(eq);
  svg.appendChild(grid);

  var landG = document.createElementNS(ns, "g");
  var pathData = (typeof window !== "undefined" && window.WORLD_LAND_PATH) || "";
  if (pathData) {
    var p = document.createElementNS(ns, "path");
    p.setAttribute("class", "wm-land");
    p.setAttribute("d", pathData);
    landG.appendChild(p);
  } else {
    LANDS.forEach(function (poly) {
      var polyEl = document.createElementNS(ns, "polygon");
      polyEl.setAttribute("class", "wm-land");
      polyEl.setAttribute("points", landPoints(poly));
      landG.appendChild(polyEl);
    });
  }
  svg.appendChild(landG);
}

function renderWorldMap() {
  var svg = $("#world-map");
  if (!svg) return;
  drawMapBase(svg);
  var ns = "http://www.w3.org/2000/svg";
  var dotG = document.createElementNS(ns, "g");
  dotG.setAttribute("id", "wm-dots");
  svg.appendChild(dotG);
  updateWorldMap();
}

function updateWorldMap() {
  var svg = $("#world-map");
  var g = svg && svg.querySelector("#wm-dots");
  if (!g) return;
  var ns = "http://www.w3.org/2000/svg";
  g.innerHTML = "";

  var onBoard = {};
  game.tiles.forEach(function (t) { if (t.type === "city") onBoard[t.cityId] = true; });

  /* 48개 도시 모두 옅게 표시 → 보드에 오른 도시는 강조 → 스탬프는 초록 */
  CITIES.forEach(function (c) {
    var stamped = game.stamped.indexOf(c.id) !== -1;
    var dot = document.createElementNS(ns, "circle");
    dot.setAttribute("cx", c.coordinates.x);
    dot.setAttribute("cy", c.coordinates.y);
    dot.setAttribute("r", stamped ? 6 : (onBoard[c.id] ? 4.5 : 2.6));
    dot.setAttribute("class", "wm-dot" + (stamped ? " is-visited" : (onBoard[c.id] ? " is-onboard" : "")));
    g.appendChild(dot);
  });

  /* 현재 위치 */
  var cur = game.tiles[game.pos];
  if (cur && cur.type === "city") {
    var cc = getCity(cur.cityId);
    var pin = document.createElementNS(ns, "circle");
    pin.setAttribute("cx", cc.coordinates.x);
    pin.setAttribute("cy", cc.coordinates.y);
    pin.setAttribute("r", 6);
    pin.setAttribute("class", "wm-pin");
    g.appendChild(pin);

    var label = document.createElementNS(ns, "text");
    label.setAttribute("class", "wm-label");
    label.setAttribute("x", Math.min(Math.max(cc.coordinates.x, 40), MAP_VIEW.w - 40));
    label.setAttribute("y", cc.coordinates.y - 12);
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("font-size", "13");
    label.setAttribute("stroke-width", "3");
    label.textContent = cc.flag + " " + cc.city;
    g.appendChild(label);
  }

  $("#map-count").textContent = "스탬프 " + game.stamped.length + " / 24";
  renderRegionBars();
}

/* 권역별 탐험 진행률 */
function renderRegionBars() {
  var wrap = $("#region-bars");
  if (!wrap) return;
  wrap.innerHTML = "";
  REGIONS.forEach(function (r) {
    var st = regionStat(r.key);
    var row = el("div", "rb" + (st.done >= st.total && st.total > 0 ? " is-clear" : ""));
    row.style.setProperty("--c", r.color);
    row.innerHTML =
      "<span class='rb-name'>" + esc(r.short) + "</span>" +
      "<span class='rb-track'><span class='rb-fill' style='width:" +
        (st.total ? (st.done / st.total * 100) : 0) + "%'></span></span>" +
      "<span class='rb-num'>" + st.done + "/" + st.total + "</span>";
    row.title = r.name + " " + st.done + "/" + st.total;
    wrap.appendChild(row);
  });
}

/* 특정 권역의 보드 내 도시 수 / 스탬프 수 */
function regionStat(key) {
  var total = 0, done = 0;
  game.tiles.forEach(function (t) {
    if (t.type !== "city") return;
    var c = getCity(t.cityId);
    if (c.region !== key) return;
    total++;
    if (game.stamped.indexOf(c.id) !== -1) done++;
  });
  return { total: total, done: done };
}

/* ---------------------------- 사이드 패널 ---------------------------- */
function renderSidePanel() {
  var tk = tokenOf(game.tokenId);
  var head = $("#pass-head");
  var solo = isSoloGame();
  if (solo) {
    head.innerHTML =
      "<div class='pass-token' style='--tc:" + game.color + "'>" + tk.emoji + "</div>" +
      "<div class='pass-id'>" +
        "<div class='cls'>" + esc(game.group.klass) + "</div>" +
        "<div class='gname'>" + esc(travelerName()) + "의 여행</div>" +
        "<div class='mem'>혼자 하기</div>" +
      "</div>";
  } else {
    head.innerHTML =
      "<div class='pass-token' style='--tc:" + game.color + "'>" + tk.emoji + "</div>" +
      "<div class='pass-id'>" +
        "<div class='cls'>" + esc(game.group.klass) + "</div>" +
        "<div class='gname'>" + esc(game.group.name) + "</div>" +
        "<div class='mem'>" + esc(game.group.members.join(" · ")) + "</div>" +
      "</div>";
  }
  var gameScreen = $("#screen-game");
  if (gameScreen) gameScreen.classList.toggle("is-solo", solo);
  updateStats();
  renderGoalCards();
  renderStampStrip();
  renderLog();
  updateTurnUI();
}

function renderGoalCards() {
  var list = $("#goal-list");
  if (!list || !game || !game.goals) return;
  list.innerHTML = "";
  game.goals.forEach(function (g) {
    var def = goalDef(g.id);
    if (!def) return;
    var row = el("div", "goal-item" + (g.done ? " is-done" : ""));
    row.innerHTML =
      "<span class='g-ico'>" + (g.done ? "✅" : "🎯") + "</span>" +
      "<div><div class='g-t'>" + esc(def.title) + "</div>" +
      "<div class='g-b'>" + (g.done ? "달성 +" + def.bonus : "보너스 +" + def.bonus) + "</div></div>";
    list.appendChild(row);
  });
}

function updateStats(popKey) {
  $("#stat-score").querySelector(".v").textContent = game.score;
  $("#stat-stamp").querySelector(".v").innerHTML = game.stamped.length + "<small>/24</small>";
  $("#stat-region").querySelector(".v").innerHTML = game.regionsCleared.length + "<small>/6</small>";
  if (popKey) {
    var n = $("#stat-" + popKey);
    if (n) { n.classList.remove("pop"); void n.offsetWidth; n.classList.add("pop"); }
  }
}

function updateTurnUI() {
  var cur = Math.min(game.turn + 1, game.turnLimit);
  $("#turn-text").textContent = cur + " / " + game.turnLimit + "턴";
  var mode = MODES.filter(function (m) { return m.key === game.modeKey; })[0] || MODES[1];
  $("#turn-mode").textContent = mode.name;
  $("#turn-fill").style.width = (game.turn / game.turnLimit * 100) + "%";

  var nowTurn = $("#now-turn");
  if (isSoloGame()) {
    nowTurn.className = "now-turn solo-mode";
    nowTurn.innerHTML = esc(travelerName()) + "의 여행";
  } else {
    nowTurn.className = "now-turn is-active-turn";
    var who = game.group.members.length
      ? game.group.members[game.memberIdx % game.group.members.length] : "친구";
    nowTurn.innerHTML = "<span class='turn-badge'>🎲 지금 주사위</span> <b>" + esc(who) + "</b>";
  }
}

function renderStampStrip() {
  var wrap = $("#stamp-strip");
  wrap.innerHTML = "";
  if (!game.stamped.length) {
    wrap.appendChild(el("span", "stamp-empty", "아직 스탬프가 없어요. 미션에 도전해 보세요!"));
    return;
  }
  game.stamped.forEach(function (id) {
    var c = getCity(id);
    var s = el("div", "mini-stamp");
    s.style.setProperty("--c", c.continentColor);
    s.title = c.city + " · " + c.landmark;
    s.innerHTML = "<img alt='' src='" + landmarkSrc(c) + "'>";
    wrap.appendChild(s);
  });
}

function addLog(text, kind) {
  game.log.push({ t: text, k: kind || "" });
  if (game.log.length > 60) game.log.shift();
  renderLog();
}
function renderLog() {
  var list = $("#log-list");
  list.innerHTML = "";
  game.log.slice().reverse().slice(0, 20).forEach(function (item) {
    list.appendChild(el("li", item.k, item.t));
  });
}

/* 점수 부여 */
function addScore(n, key) {
  game.score = Math.max(0, game.score + n);
  updateStats(key || "score");
}

/* =========================================================================
 * [I] 턴 진행 : 주사위 · 이동 · 칸 이벤트
 * ========================================================================= */

/* 주사위 눈 그리기 — CSS 3D 큐브 */
var PIP_MAP = {
  1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8]
};
var DICE_FACE_ROT = {
  1: { x: 0, y: 0 },
  2: { x: 0, y: -90 },
  3: { x: -90, y: 0 },
  4: { x: 90, y: 0 },
  5: { x: 0, y: 90 },
  6: { x: 0, y: 180 }
};
var diceSpin = { x: 0, y: 0 };

function pipFaceHTML(n) {
  var cells = PIP_MAP[n] || PIP_MAP[1];
  var html = "";
  for (var i = 0; i < 9; i++) {
    html += "<span" + (cells.indexOf(i) !== -1 ? " class='pip'" : "") + "></span>";
  }
  return html;
}

function ensureDiceCube() {
  var d = $("#dice");
  if (!d) return null;
  if (!d.querySelector(".dice-face")) {
    d.className = "dice-cube";
    d.innerHTML =
      "<div class='dice-face f1'>" + pipFaceHTML(1) + "</div>" +
      "<div class='dice-face f2'>" + pipFaceHTML(2) + "</div>" +
      "<div class='dice-face f3'>" + pipFaceHTML(3) + "</div>" +
      "<div class='dice-face f4'>" + pipFaceHTML(4) + "</div>" +
      "<div class='dice-face f5'>" + pipFaceHTML(5) + "</div>" +
      "<div class='dice-face f6'>" + pipFaceHTML(6) + "</div>";
  }
  return d;
}

function drawDice(n, opts) {
  opts = opts || {};
  var d = ensureDiceCube();
  if (!d) return;
  n = Math.max(1, Math.min(6, n | 0));
  var face = DICE_FACE_ROT[n] || DICE_FACE_ROT[1];
  if (!opts.instant) {
    diceSpin.x += 360 * (1 + Math.floor(Math.random() * 2));
    diceSpin.y += 360 * (2 + Math.floor(Math.random() * 3));
  }
  var rot = "rotateX(" + (diceSpin.x + face.x) + "deg) rotateY(" + (diceSpin.y + face.y) + "deg)";
  if (opts.instant) {
    d.style.transition = "none";
    d.style.transform = rot;
    void d.offsetWidth;
    d.style.transition = "";
  } else {
    d.style.transform = rot;
  }
  d.setAttribute("aria-label", "주사위 " + n);
}

function setDiceMsg(text, isResult) {
  var msg = $("#dice-msg");
  if (!msg) return;
  msg.textContent = text;
  msg.classList.toggle("is-result", !!isResult);
}

function setRollEnabled(on) {
  var b = $("#btn-roll");
  if (b) b.disabled = !on;
}

async function rollDice() {
  if (busy || !game || game.finished) return;
  busy = true;
  setRollEnabled(false);
  Sound.unlock();
  Sound.play("dice");

  var d = ensureDiceCube();
  var toss = $("#dice-toss");
  if (toss) {
    toss.classList.remove("is-land");
    toss.classList.add("is-rolling");
  }
  setDiceMsg("주사위를 굴리는 중...");

  var spins = settings.animSpeed === "fast" ? 7 : (settings.animSpeed === "slow" ? 14 : 10);
  var step = settings.animSpeed === "fast" ? 55 : (settings.animSpeed === "slow" ? 90 : 70);
  if (d) d.style.transition = "transform " + Math.max(70, step - 10) + "ms linear";
  for (var i = 0; i < spins; i++) {
    drawDice(1 + Math.floor(Math.random() * 6));
    await sleep(step);
  }
  var value = 1 + Math.floor(Math.random() * 6);
  if (d) d.style.transition = "transform .9s cubic-bezier(.18, .7, .22, 1.18)";
  drawDice(value);
  if (toss) {
    toss.classList.remove("is-rolling");
    toss.classList.add("is-land");
  }

  var who = isSoloGame()
    ? travelerName()
    : (game.group.members[game.memberIdx % game.group.members.length] || "친구");
  setDiceMsg(who + " · " + value + "칸 이동!", true);
  addLog("<b>" + esc(who) + "</b> 주사위 " + value);

  await sleep(420);
  if (toss) toss.classList.remove("is-land");
  await movePawn(value);
}

/* 말 이동 (칸 단위 애니메이션) */
async function movePawn(steps) {
  var passedStart = false;
  for (var s = 0; s < steps; s++) {
    game.pos = (game.pos + 1) % BOARD_SIZE;
    if (game.pos === 0 && s < steps - 1) passedStart = true;
    var pawn = $("#pawn");
    if (pawn) { pawn.classList.remove("is-hopping"); void pawn.offsetWidth; pawn.classList.add("is-hopping"); }
    movePawnTo(game.pos);
    Sound.play("step");
    refreshBoardMarks();
    await sleep(moveDuration() + 30);
  }
  var target = tileEls[game.pos];
  if (target) { target.classList.remove("is-target"); void target.offsetWidth; target.classList.add("is-target"); }
  Sound.play("land");
  updateWorldMap();

  if (passedStart) {
    addScore(PTS.passStart);
    addLog("🛫 출발 칸을 통과해 여행 마일리지 <b>+" + PTS.passStart + "</b>", "gold");
    toast("출발 칸 통과! 마일리지 +" + PTS.passStart, "good");
    Sound.play("reward");
  }

  await sleep(180);
  handleTile();
}

/* 도착한 칸 처리 */
function handleTile() {
  var t = game.tiles[game.pos];
  if (t.type === "city") {
    var c = getCity(t.cityId);
    codexAdd(c.id);
    if (game.stamped.indexOf(c.id) !== -1) {
      /* 이미 스탬프를 받은 도시 재방문 */
      addScore(PTS.revisit);
      addLog(c.flag + " <b>" + esc(c.city) + "</b> 재방문 +" + PTS.revisit, "gold");
      toast(c.city + " 재방문! +" + PTS.revisit + "점", "good");
      window.setTimeout(endTurn, 500);
      return;
    }
    if (game.visited.indexOf(c.id) === -1) {
      game.visited.push(c.id);
      addScore(PTS.visit);
      addLog(c.flag + " <b>" + esc(c.city) + "</b> 도착 · 탐험 +" + PTS.visit, "good");
      checkGoals();
    } else {
      addLog(c.flag + " <b>" + esc(c.city) + "</b> 다시 방문 — 미션 재도전!");
    }
    openCityModal(c, { preview: false });
  } else {
    handleSpecial(specialOf(t.key));
  }
}

/* 턴 종료 */
function nextTurnLabel() {
  return isSoloGame() ? "계속하기 →" : "다음 친구에게 →";
}
function endTurn() {
  closeModal();
  if (!game || game.finished || !busy) return;
  game.turn++;
  if (!isSoloGame()) game.memberIdx++;
  updateTurnUI();
  updateStats();
  checkGoals();
  refreshBoardMarks();
  updateWorldMap();
  saveGame();

  if (game.turn >= game.turnLimit) {
    busy = true;
    setRollEnabled(false);
    setDiceMsg("제한 턴을 모두 사용했습니다.");
    window.setTimeout(function () { finishGame(); }, 700);
    return;
  }
  busy = false;
  setRollEnabled(true);
  if (isSoloGame()) {
    setDiceMsg("주사위를 굴려 다음 도시로 이동하세요.");
  } else {
    var who = game.group.members[game.memberIdx % game.group.members.length] || "친구";
    setDiceMsg(who + "님, 주사위를 굴려 주세요!");
    toast("다음 차례 · " + who, "", 2200);
  }
}

/* 권역 완성 확인 */
function checkRegionClear(regionKey) {
  if (game.regionsCleared.indexOf(regionKey) !== -1) return null;
  var st = regionStat(regionKey);
  if (st.total > 0 && st.done >= st.total) {
    game.regionsCleared.push(regionKey);
    addScore(PTS.regionClear, "region");
    var r = regionOf(regionKey);
    addLog("🏅 <b>" + esc(r.name) + "</b> 권역 완성! +" + PTS.regionClear, "gold");
    return r;
  }
  return null;
}

/* =========================================================================
 * [J] 도시 학습 대시보드 · 랜드마크 미션(퀴즈)
 * ========================================================================= */

/* 도시 대표 이미지 영역 HTML (이미지가 없으면 대체 카드가 그대로 보인다) */
function cityVisualHTML(c) {
  var first = cityImageList(c)[0];
  var src = first ? first.src : (c.image || "");
  return "" +
    "<div class='city-visual' style='--c:" + c.continentColor + "'>" +
      "<span class='cv-flag'>" + c.flag + "</span>" +
      "<span class='cv-region'>" + esc(c.regionName) + "</span>" +
      "<img class='cv-img' alt='' data-src='" + esc(src) + "'>" +
      "<div class='cv-fallback'>" +
        "<div class='cv-icon'>" + c.landmarkIcon + "</div>" +
        "<div class='cv-city'>" + esc(c.city) + "</div>" +
        "<div class='cv-country'>" + esc(c.country) + "</div>" +
        "<span class='cv-landmark'>" + c.landmarkIcon + " " + esc(c.landmark) + "</span>" +
      "</div>" +
    "</div>";
}

/* 이미지 로딩 시도 : 실패해도 오류 없이 대체 카드 유지 */
function mountCityImages(root) {
  $$(".cv-img", root).forEach(function (img) {
    var src = img.getAttribute("data-src");
    if (!src) return;
    img.addEventListener("load", function () {
      if (img.naturalWidth > 0) img.parentNode.classList.add("has-image");
    });
    img.addEventListener("error", function () { /* 대체 카드 유지 */ });
    img.src = src;
  });
}

function infoItem(c, k, v) {
  return "<div class='info-item' style='--c:" + c.continentColor + "'><div class='k'>" + k + "</div><div class='v'>" + esc(v) + "</div></div>";
}

function cityRoleLabel(c) {
  if (c.functions && c.functions.length) return c.functions[0];
  if (c.keywords && c.keywords.length) return c.keywords[0];
  return "도시";
}

function cityClimateZoneLabel(c) {
  var st = cityStats(c) || {};
  var zone = st.climateZone || "";
  if (!zone) return "—";
  var ko = KOEPPEN_KO[zone];
  return ko ? ko : zone;
}

function cityDashTabHTML(c, tab) {
  var st = cityStats(c) || {};
  var south = c.coordinates && c.coordinates.lat < 0;
  if (tab === "human") {
    return "<div class='info-grid'>" +
      infoItem(c, "👥 인구 규모", c.populationScale + " — " + c.populationNote) +
      infoItem(c, "🏭 산업", c.industry) +
      infoItem(c, "🏙️ 도시 기능", c.urbanFunction) +
      infoItem(c, "🎎 문화", c.culture) +
      infoItem(c, "📈 성장 배경", c.growthReason) +
      "</div>";
  }
  if (tab === "story") {
    var extra = "";
    extra += "<div class='fact-box'><b>💡 알아 두면 재미있는 사실</b><br>" + esc(c.interestingFact) + "</div>";
    if (c.geoNote) extra += "<div class='fact-box geo-note'><b>🗺️ 지리로 한 걸음 더</b><br>" + esc(c.geoNote) + "</div>";
    if (c.countryFact) extra += "<div class='fact-box country-fact'><b>🌍 이 나라가 궁금하다면</b><br>" + esc(c.countryFact) + "</div>";
    return extra;
  }
  if (tab === "mission") return atlasMissionHTML(c);
  var zone = st.climateZone || "";
  var zoneKo = KOEPPEN_KO[zone] || "";
  return "<div class='info-grid'>" +
    infoItem(c, "📍 위치와 지형", c.geography) +
    infoItem(c, "🌡️ 기후", c.climate) +
    (zone ? infoItem(c, "🌐 쾨펜 기후", zone + (zoneKo ? " · " + zoneKo : "")) : "") +
    "</div>" +
    "<p class='cb-note' style='margin-top:10px'>" + (south
      ? "남반구 도시라 1월이 한여름, 7월이 한겨울에 가깝습니다."
      : "북반구 도시라 1월이 한겨울, 7월이 한여름에 가깝습니다.") +
    "</p>";
}

function atlasMissionHTML(c) {
  if (stampHas(c.id)) {
    return "<div class='quiz-result good'><span class='rt'>스탬프를 이미 받았어요</span>이 도시의 랜드마크 스탬프가 트레일 로그에 기록되어 있습니다.</div>";
  }
  var prog = atlasQuizDone[c.id] || [];
  var html = "<p class='hint' style='margin-bottom:10px'>두 문항 모두 맞히면 랜드마크 스탬프를 받습니다. 게임과 같은 트레일 로그에 쌓입니다.</p>";
  (c.quiz || []).forEach(function (q, qi) {
    if (prog[qi]) {
      html += "<div class='atlas-q is-done'><div class='aq'>" + (qi + 1) + ". " + esc(q.q) + "</div>" +
        "<div class='quiz-result good' style='margin:0'>✓ 완료</div></div>";
      return;
    }
    html += "<div class='atlas-q' data-qi='" + qi + "'><div class='aq'>" + (qi + 1) + ". " + esc(q.q) + "</div><div class='choices'>";
    q.c.forEach(function (ch, ci) {
      html += "<button type='button' class='choice' data-ci='" + ci + "'><span class='no'>" + (ci + 1) + "</span><span>" + esc(ch) + "</span></button>";
    });
    html += "</div><div class='aq-fb'></div></div>";
  });
  return html;
}

function cityDashboardHTML(c, opts) {
  opts = opts || {};
  var tab = opts.tab || "nature";
  var extraTabs = opts.extraTabs || [];
  var st = cityStats(c) || {};
  var chips = "<span class='chip chip-region' style='--c:" + c.continentColor + "'>" + esc(c.regionName) + "</span>";
  (c.keywords || []).forEach(function (k) { chips += "<span class='chip'>#" + esc(k) + "</span>"; });
  var climate = cityClimateHTML(c, true) ||
    "<div class='climate-block compact'><div class='cb-head'>기후</div><p class='cb-note'>" + esc(c.climate) + "</p></div>";
  var tabs = [
    { k: "nature", t: "자연" },
    { k: "human", t: "인문" },
    { k: "story", t: "이야기" }
  ].concat(extraTabs);
  var tabBtns = tabs.map(function (tb) {
    return "<button type='button' class='cd-tab" + (tab === tb.k ? " is-on" : "") +
      "' data-tab='" + tb.k + "' role='tab' aria-selected='" + (tab === tb.k ? "true" : "false") + "'>" +
      tb.t + "</button>";
  }).join("");
  return "" +
    "<div class='city-dash' style='--c:" + c.continentColor + "'>" +
      "<aside class='cd-left'>" +
        cityVisualHTML(c) +
        cityLocatorHTML(c) +
        "<div class='kw-row'>" + chips + "</div>" +
      "</aside>" +
      "<div class='cd-right'>" +
        "<div class='cd-kpis'>" +
          "<div class='cd-kpi'><span class='k'>인구</span><span class='v'>" + fmtPop(st.population) + "</span></div>" +
          "<div class='cd-kpi'><span class='k'>해발</span><span class='v'>" + (st.elevation != null ? st.elevation + " m" : "—") + "</span></div>" +
          "<div class='cd-kpi'><span class='k'>기후대</span><span class='v'>" + esc(cityClimateZoneLabel(c)) + "</span></div>" +
          "<div class='cd-kpi'><span class='k'>도시 기능</span><span class='v'>" + esc(cityRoleLabel(c)) + "</span></div>" +
        "</div>" +
        "<div class='cd-split'>" +
          climate +
          "<div class='cd-geo'><div class='k'>📍 위치와 지형</div><div class='v'>" + esc(c.geography) + "</div></div>" +
        "</div>" +
        "<div class='cd-tabs' role='tablist'>" + tabBtns + "</div>" +
        "<div class='cd-tab-body' id='cd-tab-body'>" + cityDashTabHTML(c, tab) + "</div>" +
      "</div>" +
    "</div>";
}

function bindCityDashTabs(root, c, opts) {
  opts = opts || {};
  var body = root.querySelector("#cd-tab-body");
  if (!body) return;
  function show(tab) {
    body.innerHTML = cityDashTabHTML(c, tab);
    if (tab === "mission") bindAtlasMission(root, c);
    if (opts.onTab) opts.onTab(tab);
  }
  $$(".cd-tab", root).forEach(function (btn) {
    btn.addEventListener("click", function () {
      var tab = btn.getAttribute("data-tab");
      $$(".cd-tab", root).forEach(function (b) {
        var on = b === btn;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
      });
      Sound.play("click");
      show(tab);
    });
  });
  if (opts.tab === "mission") bindAtlasMission(root, c);
}

function bindAtlasMission(root, c) {
  $$(".atlas-q", root).forEach(function (box) {
    var qi = parseInt(box.getAttribute("data-qi"), 10);
    var q = (c.quiz || [])[qi];
    if (!q) return;
    $$(".choice", box).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var ci = parseInt(btn.getAttribute("data-ci"), 10);
        $$(".choice", box).forEach(function (x) { x.disabled = true; });
        var fb = box.querySelector(".aq-fb");
        if (ci === q.a) {
          btn.classList.add("is-correct");
          Sound.play("correct");
          fb.innerHTML = "<div class='quiz-result good'><span class='rt'>정답입니다</span>" + esc(q.ex) + "</div>";
          window.setTimeout(function () { onAtlasQuizCorrect(c, qi); }, 700);
        } else {
          btn.classList.add("is-wrong");
          var right = $$(".choice", box)[q.a];
          if (right) right.classList.add("is-correct");
          Sound.play("wrong");
          fb.innerHTML = "<div class='quiz-result bad'><span class='rt'>아쉬워요</span>" + esc(q.ex) + "</div>";
        }
      });
    });
  });
}

/* 도시 학습 대시보드 모달
 *  opts.preview = true 면 정보만 보여주고 미션은 진행하지 않는다. */
function openCityModal(c, opts) {
  opts = opts || {};
  var buttons;

  if (opts.preview) {
    buttons = [{ label: "닫기", cls: "btn-light", act: function () { closeModal(); } }];
  } else {
    buttons = [{
      label: "🎯 랜드마크 미션 도전",
      cls: "btn-gold",
      act: function () { openQuiz(c); }
    }];
  }

  var m = openModal({
    eyebrow: "CITY DASHBOARD · " + c.country + " · " + c.regionName,
    title: c.flag + " " + esc(c.city) + " <span style='font-weight:600;font-size:.82rem;opacity:.75'>" + esc(c.landmark) + "</span>",
    body: cityDashboardHTML(c),
    buttons: buttons,
    size: "city"
  });
  mountCityImages(m);
  mountCityLocator(m, c);
  bindCityDashTabs(m, c);
  return m;
}

/* 랜드마크 미션(퀴즈) */
function openQuiz(c) {
  var qsrc = pick(c.quiz);
  /* 보기 순서를 섞어 정답 위치를 고정하지 않는다 */
  var idx = qsrc.c.map(function (_, i) { return i; });
  var order = shuffle(idx);
  var choices = order.map(function (i) { return qsrc.c[i]; });
  var answer = order.indexOf(qsrc.a);

  var attempt = 0;
  var disabled = [];

  function render() {
    var html = "";
    html += "<div class='quiz-stage'>" + (attempt === 0 ? "LANDMARK MISSION" : "RETRY · 재도전") + "</div>";
    html += "<div class='quiz-q'>" + c.flag + " " + esc(c.city) + " — " + esc(qsrc.q) + "</div>";
    html += "<div class='choices' id='quiz-choices'></div>";
    html += "<div id='quiz-feedback'></div>";
    return html;
  }

  var m = openModal({
    eyebrow: "MISSION",
    title: "🎯 랜드마크 미션",
    body: render(),
    buttons: []
  });

  function paintChoices() {
    var wrap = $("#quiz-choices", m);
    wrap.innerHTML = "";
    choices.forEach(function (text, i) {
      var b = el("button", "choice");
      b.innerHTML = "<span class='no'>" + (i + 1) + "</span><span>" + esc(text) + "</span>";
      if (disabled.indexOf(i) !== -1) { b.disabled = true; b.classList.add("is-wrong"); }
      b.addEventListener("click", function () { answerQuiz(i, b); });
      wrap.appendChild(b);
    });
  }

  function answerQuiz(i, btn) {
    var all = $$(".choice", m);
    all.forEach(function (b) { b.disabled = true; });

    if (i === answer) {
      btn.classList.add("is-correct");
      Sound.play("correct");
      var pts = attempt === 0 ? PTS.quizFirst : PTS.quizRetry;
      if (attempt === 0) game.quiz.correct++; else game.quiz.retry++;
      grantStamp(c, pts, qsrc.ex);
      return;
    }

    /* 오답 */
    btn.classList.add("is-wrong");
    Sound.play("wrong");
    if (attempt === 0 && settings.quizRetry) {
      attempt = 1;
      disabled.push(i);
      var hint = settings.showHint
        ? "<br><span style='font-weight:700'>힌트</span> · 도시 학습 대시보드의 <b>" + esc(c.keywords.join(", ")) + "</b> 를 떠올려 보세요."
        : "";
      $("#quiz-feedback", m).innerHTML =
        "<div class='quiz-result bad'><span class='rt'>아쉬워요! 한 번 더 도전할 수 있습니다.</span>" +
        "친구들과 상의해 다시 골라 보세요." + hint + "</div>";
      $(".quiz-stage", m).textContent = "RETRY · 재도전";
      window.setTimeout(function () {
        $("#quiz-feedback", m).innerHTML = "";
        paintChoices();
      }, 1600);
      return;
    }

    /* 재도전도 실패하거나 재도전이 꺼진 경우 */
    all[answer].classList.add("is-correct");
    game.quiz.wrong++;
    addLog("❌ " + esc(c.city) + " 미션 실패 — 스탬프를 얻지 못했어요.", "bad");
    $("#quiz-feedback", m).innerHTML =
      "<div class='quiz-result bad'><span class='rt'>정답은 " + (answer + 1) + "번이었어요.</span>" +
      esc(qsrc.ex) + "<br><br>다음에 이 도시에 다시 도착하면 미션에 재도전할 수 있습니다.</div>";
    addFooter([{ label: nextTurnLabel(), cls: "btn-navy", act: function () { endTurn(); } }]);
  }

  function addFooter(buttons) {
    var old = m.querySelector(".modal-foot");
    if (old) old.parentNode.removeChild(old);
    var foot = el("div", "modal-foot");
    buttons.forEach(function (b) {
      var btn = el("button", "btn " + (b.cls || "btn-light"), b.label);
      btn.addEventListener("click", function () { Sound.play("click"); b.act(); });
      foot.appendChild(btn);
    });
    m.appendChild(foot);
    window.setTimeout(function () { try { foot.querySelector("button").focus(); } catch (e) {} }, 80);
  }

  /* 정답 처리 : 스탬프 획득 */
  function grantStamp(city, pts, explain) {
    if (game.stamped.indexOf(city.id) === -1) game.stamped.push(city.id);
    stampAdd(city.id);
    addScore(pts, "stamp");
    codexAdd(city.id);
    Sound.play("stamp");
    addLog("🏅 " + city.flag + " <b>" + esc(city.city) + "</b> 스탬프 획득 +" + pts, "good");

    var cleared = checkRegionClear(city.region);

    var html = "";
    html += "<div class='stamp-anim'><div class='stamp-big' style='--c:" + city.continentColor + "'>" +
            "<div><div class='si'>" + city.landmarkIcon + "</div>" +
            "<div class='sn'>" + esc(city.city) + "</div>" +
            "<div class='sl'>" + esc(city.landmark) + "</div></div></div></div>";
    html += "<div class='quiz-result good'><span class='rt'>정답입니다! 랜드마크 스탬프를 획득했어요.</span>" + esc(explain) + "</div>";
    html += "<div class='reward-line'>여행 점수 <span class='pt'>+" + pts + "</span></div>";
    if (cleared) {
      html += "<div class='reward-line' style='background:linear-gradient(140deg,#e3f5ec,#d5efe2);border-color:var(--ok);color:#1c5f42'>" +
              "🏅 " + esc(cleared.name) + " 권역 완성 보너스 <span class='pt' style='color:var(--ok)'>+" + PTS.regionClear + "</span></div>";
      confetti(80);
      Sound.play("fanfare");
    } else {
      confetti(36);
    }

    $("#quiz-choices", m).innerHTML = "";
    $("#quiz-feedback", m).innerHTML = html;
    $(".quiz-q", m).style.display = "none";
    $(".quiz-stage", m).textContent = "STAMP ACQUIRED";
    refreshBoardMarks();
    updateWorldMap();
    renderStampStrip();
    checkGoals();
    addFooter([{ label: nextTurnLabel(), cls: "btn-navy", act: function () { endTurn(); } }]);
  }

  paintChoices();
}

/* =========================================================================
 * [K] 특별 칸 이벤트
 * ========================================================================= */
function handleSpecial(sp) {
  /* 선생님 설정에서 특별 칸 이벤트를 끈 경우 : 간단한 휴식 처리 */
  if (!settings.useSpecials && sp.key !== "start") {
    addScore(10);
    addLog(sp.emoji + " <b>" + esc(sp.name) + "</b> — 잠시 휴식 +10");
    toast(sp.name + " · 휴식 +10점", "good");
    window.setTimeout(endTurn, 600);
    return;
  }

  switch (sp.key) {
    case "start":    spStart(sp); break;
    case "chance":   spChance(sp); break;
    case "festival": spFestival(sp); break;
    case "transfer": spTransfer(sp); break;
    case "issue":    spIssue(sp); break;
    case "photo":    spPhoto(sp); break;
    case "geoquiz":  spGeoQuiz(sp); break;
    case "journal":  spJournal(sp); break;
    default:         endTurn();
  }
}

function specialHeroHTML(sp, extra) {
  return "<div class='special-hero'>" +
    "<div class='special-emoji'>" + sp.emoji + "</div>" +
    "<div class='special-name'>" + esc(sp.name) + "</div>" +
    "<div class='special-desc'>" + esc(extra || sp.desc) + "</div></div>";
}

/* 출발 칸 정지 */
function spStart(sp) {
  addScore(PTS.landStart);
  Sound.play("reward");
  addLog("🛫 출발 칸 정지 · 마일리지 <b>+" + PTS.landStart + "</b>", "gold");
  openModal({
    eyebrow: "START", title: "🛫 국제공항", size: "narrow",     body: specialHeroHTML(sp, "출발 칸에 정확히 도착했습니다! 넉넉한 여행 마일리지를 받습니다.") +
          "<div class='reward-line'>여행 마일리지 <span class='pt'>+" + PTS.landStart + "</span></div>",
    buttons: [{ label: nextTurnLabel(), cls: "btn-navy", act: endTurn }]
  });
}

/* 여행 찬스 */
function spChance(sp) {
  var card = pick(CHANCE_CARDS);
  addScore(card.p);
  if (card.p >= 0) Sound.play("reward"); else Sound.play("wrong");
  addLog(card.emoji + " 여행 찬스 · " + esc(card.t) + " " + (card.p >= 0 ? "+" : "") + card.p,
         card.p >= 0 ? "good" : "bad");
  openModal({
    eyebrow: "CHANCE", title: "🎁 여행 찬스", size: "narrow",     body: "<div class='special-hero'><div class='special-emoji'>" + card.emoji + "</div>" +
          "<div class='special-name'>" + esc(card.t) + "</div>" +
          "<div class='special-desc'>" + esc(card.d) + "</div></div>" +
          "<div class='reward-line'" + (card.p < 0 ? " style='background:var(--bad-soft);border-color:var(--bad);color:#7d2b29'" : "") + ">" +
          "여행 점수 <span class='pt'" + (card.p < 0 ? " style='color:var(--bad)'" : "") + ">" +
          (card.p >= 0 ? "+" : "") + card.p + "</span></div>",
    buttons: [{ label: nextTurnLabel(), cls: "btn-navy", act: endTurn }]
  });
}

/* 세계 축제 */
function spFestival(sp) {
  var card = pick(FESTIVAL_CARDS);
  var pts = 20;
  addScore(pts);
  Sound.play("reward");
  if (game.festivals.indexOf(card.t) === -1) game.festivals.push(card.t);
  addLog(card.emoji + " 세계 축제 · " + esc(card.t) + " +" + pts, "gold");
  openModal({
    eyebrow: "FESTIVAL", title: "🎉 세계 축제",  size: "narrow",
    body: "<div class='special-hero'><div class='special-emoji'>" + card.emoji + "</div>" +
          "<div class='special-name'>" + esc(card.t) + "</div>" +
          "<div class='special-desc'>" + esc(card.city) + "</div></div>" +
          "<div class='fact-box' style='margin-top:6px'>" + esc(card.d) + "</div>" +
          "<div class='reward-line'>문화 탐험 점수 <span class='pt'>+" + pts + "</span></div>",
    buttons: [{ label: nextTurnLabel(), cls: "btn-navy", act: endTurn }]
  });
}

/* 환승 라운지 : 아직 스탬프가 없는 도시 3곳 중 하나로 이동 */
function spTransfer(sp) {
  var candidates = [];
  game.tiles.forEach(function (t, i) {
    if (t.type !== "city") return;
    if (game.stamped.indexOf(t.cityId) !== -1) return;
    candidates.push({ idx: i, city: getCity(t.cityId) });
  });
  candidates = shuffle(candidates).slice(0, 3);

  if (!candidates.length) {
    addScore(20);
    addLog("🛄 환승 라운지 · 모든 도시를 이미 방문했습니다 +20", "gold");
    openModal({
      eyebrow: "TRANSFER", title: "🛄 환승 라운지", size: "narrow",       body: specialHeroHTML(sp, "보드 위의 모든 도시에서 스탬프를 받았습니다! 라운지에서 편히 쉬어 갑니다.") +
            "<div class='reward-line'>여행 점수 <span class='pt'>+20</span></div>",
      buttons: [{ label: nextTurnLabel(), cls: "btn-navy", act: endTurn }]
    });
    return;
  }

  var html = specialHeroHTML(sp) + "<div class='pick-list' id='transfer-list'></div>";
  var m = openModal({
    eyebrow: "TRANSFER", title: "🛄 환승 라운지",     body: html,
    buttons: [{ label: "환승하지 않기 (+10점)", cls: "btn-light", act: function () {
      addScore(10);
      addLog("🛄 환승하지 않고 휴식 +10");
      endTurn();
    } }]
  });

  var list = $("#transfer-list", m);
  candidates.forEach(function (cand) {
    var c = cand.city;
    var b = el("button", "pick-item");
    b.innerHTML = "<span class='pi-icon'>" + c.flag + "</span>" +
      "<span><span class='pi-t'>" + esc(c.city) + " · " + esc(c.country) + "</span>" +
      "<span class='pi-s'>" + esc(c.regionName) + " · " + esc(c.landmark) + "</span></span>";
    b.addEventListener("click", async function () {
      Sound.play("click");
      closeModal();
      addLog("🛄 환승 · " + c.flag + " <b>" + esc(c.city) + "</b> 으로 이동", "gold");
      game.pos = cand.idx;
      movePawnTo(game.pos);
      refreshBoardMarks();
      updateWorldMap();
      Sound.play("land");
      await sleep(moveDuration() + 220);
      handleTile();
    });
    list.appendChild(b);
  });
}

/* 도시 문제 해결 */
function spIssue(sp) {
  var card = pick(ISSUE_CARDS);
  var order = shuffle([0, 1, 2]);
  var choices = order.map(function (i) { return card.c[i]; });
  var answer = order.indexOf(card.a);

  var body = "<div class='special-hero'><div class='special-emoji'>" + sp.emoji + "</div>" +
    "<div class='special-name'>" + esc(card.t) + "</div>" +
    "<div class='special-desc'>" + esc(card.city) + "</div></div>" +
    "<div class='fact-box' style='margin-top:4px'>" + esc(card.d) + "</div>" +
    "<div class='quiz-q' style='margin-top:14px;font-size:.98rem'>우리 팀이 도시 계획가라면 어떤 방법을 고르겠습니까?</div>" +
    "<div class='choices' id='issue-choices'></div><div id='issue-feedback'></div>";

  var m = openModal({ eyebrow: "URBAN ISSUE", title: "🏗️ 도시 문제 해결", body: body,  buttons: [] });

  var wrap = $("#issue-choices", m);
  choices.forEach(function (text, i) {
    var b = el("button", "choice");
    b.innerHTML = "<span class='no'>" + (i + 1) + "</span><span>" + esc(text) + "</span>";
    b.addEventListener("click", function () {
      $$(".choice", m).forEach(function (x) { x.disabled = true; });
      var ok = (i === answer);
      var pts = ok ? 25 : 10;
      if (ok) { b.classList.add("is-correct"); Sound.play("correct"); }
      else { b.classList.add("is-wrong"); $$(".choice", m)[answer].classList.add("is-correct"); Sound.play("wrong"); }
      addScore(pts);
      addLog("🏗️ 도시 문제 · " + esc(card.t) + " " + (ok ? "해결" : "참여") + " +" + pts, ok ? "good" : "");
      $("#issue-feedback", m).innerHTML =
        "<div class='quiz-result " + (ok ? "good" : "bad") + "'><span class='rt'>" +
        (ok ? "좋은 선택이에요!" : "다시 생각해 볼까요?") + "</span>" + esc(card.ex) + "</div>" +
        "<div class='reward-line'>여행 점수 <span class='pt'>+" + pts + "</span></div>";
      var foot = el("div", "modal-foot");
      var nb = el("button", "btn btn-navy", nextTurnLabel());
      nb.addEventListener("click", function () { Sound.play("click"); endTurn(); });
      foot.appendChild(nb);
      m.appendChild(foot);
    });
    wrap.appendChild(b);
  });
}

/* 여행 사진관 : 방문한 도시 중 하나를 골라 베스트 컷으로 남긴다 */
function spPhoto(sp) {
  var visited = game.visited.map(getCity).filter(Boolean);
  if (!visited.length) {
    addScore(10);
    addLog("📸 여행 사진관 · 아직 찍을 사진이 없어요 +10");
    openModal({
      eyebrow: "PHOTO", title: "📸 여행 사진관", size: "narrow",       body: specialHeroHTML(sp, "아직 방문한 도시가 없어 카메라만 점검했습니다. 다음 도시를 기대해 볼까요?") +
            "<div class='reward-line'>여행 점수 <span class='pt'>+10</span></div>",
      buttons: [{ label: nextTurnLabel(), cls: "btn-navy", act: endTurn }]
    });
    return;
  }

  var body = specialHeroHTML(sp) + "<div class='pick-list' id='photo-list'></div>";
  var m = openModal({ eyebrow: "PHOTO", title: "📸 여행 사진관", body: body,  buttons: [] });
  var list = $("#photo-list", m);
  visited.slice(-8).reverse().forEach(function (c) {
    var b = el("button", "pick-item");
    b.innerHTML = "<span class='pi-icon'>" + c.landmarkIcon + "</span>" +
      "<span><span class='pi-t'>" + c.flag + " " + esc(c.city) + "</span>" +
      "<span class='pi-s'>" + esc(c.landmark) + "</span></span>";
    b.addEventListener("click", function () {
      Sound.play("stamp");
      var pts = 15;
      addScore(pts);
      if (game.photos.indexOf(c.id) === -1) game.photos.push(c.id);
      addLog("📸 " + c.flag + " <b>" + esc(c.city) + "</b> 베스트 컷 +" + pts, "gold");
      closeModal();
      openModal({
        eyebrow: "PHOTO", title: "📸 베스트 컷 완성",         body: cityVisualHTML(c) +
              "<div class='quiz-result good' style='margin-top:14px'><span class='rt'>" +
              esc(c.city) + "에서의 사진이 여권에 실렸습니다!</span>" + esc(c.interestingFact) + "</div>" +
              "<div class='reward-line'>여행 점수 <span class='pt'>+" + pts + "</span></div>",
        buttons: [{ label: nextTurnLabel(), cls: "btn-navy", act: endTurn }]
      });
      mountCityImages($("#modal-root"));
    });
    list.appendChild(b);
  });
}

/* 세계지리 퀴즈 */
function spGeoQuiz(sp) {
  var qsrc = pick(GEO_QUIZ);
  var order = shuffle([0, 1, 2]);
  var choices = order.map(function (i) { return qsrc.c[i]; });
  var answer = order.indexOf(qsrc.a);

  var body = specialHeroHTML(sp) +
    "<div class='quiz-q' style='margin-top:12px'>" + esc(qsrc.q) + "</div>" +
    "<div class='choices' id='geo-choices'></div><div id='geo-feedback'></div>";
  var m = openModal({ eyebrow: "GEO QUIZ", title: "🧠 세계지리 퀴즈", body: body,  buttons: [] });

  var wrap = $("#geo-choices", m);
  choices.forEach(function (text, i) {
    var b = el("button", "choice");
    b.innerHTML = "<span class='no'>" + (i + 1) + "</span><span>" + esc(text) + "</span>";
    b.addEventListener("click", function () {
      $$(".choice", m).forEach(function (x) { x.disabled = true; });
      var ok = (i === answer);
      var pts = ok ? 30 : 10;
      if (ok) { b.classList.add("is-correct"); Sound.play("correct"); confetti(30); }
      else { b.classList.add("is-wrong"); $$(".choice", m)[answer].classList.add("is-correct"); Sound.play("wrong"); }
      addScore(pts);
      addLog("🧠 세계지리 퀴즈 " + (ok ? "정답" : "오답") + " +" + pts, ok ? "good" : "bad");
      $("#geo-feedback", m).innerHTML =
        "<div class='quiz-result " + (ok ? "good" : "bad") + "'><span class='rt'>" +
        (ok ? "정답입니다!" : "정답은 " + (answer + 1) + "번이에요.") + "</span>" + esc(qsrc.ex) + "</div>" +
        "<div class='reward-line'>여행 점수 <span class='pt'>+" + pts + "</span></div>";
      var foot = el("div", "modal-foot");
      var nb = el("button", "btn btn-navy", nextTurnLabel());
      nb.addEventListener("click", function () { Sound.play("click"); endTurn(); });
      foot.appendChild(nb);
      m.appendChild(foot);
    });
    wrap.appendChild(b);
  });
}

/* 휴식과 기록 : 여행 일지 한 줄 작성 */
function spJournal(sp) {
  var lastCity = game.visited.length ? getCity(game.visited[game.visited.length - 1]) : null;
  var placeholder = lastCity
    ? lastCity.city + "에서 가장 기억에 남는 것은..."
    : "이번 여행에서 기대되는 것은...";

  var body = specialHeroHTML(sp) +
    "<div class='field' style='margin-top:10px'>" +
    "<label for='journal-input'>여행 일지 (한 줄이면 충분해요)</label>" +
    "<textarea class='textarea' id='journal-input' maxlength='150' placeholder='" + esc(placeholder) + "'></textarea>" +
    "<span class='hint'>작성한 내용은 결과 리포트의 여행 일지에 그대로 실립니다.</span></div>";

  var m = openModal({
    eyebrow: "JOURNAL", title: "📔 휴식과 기록",  body: body,
    buttons: [
      { label: "건너뛰기 (+5)", cls: "btn-light", act: function () { addScore(5); addLog("📔 휴식 +5"); endTurn(); } },
      { label: "기록 남기기 (+15)", cls: "btn-gold", act: function () {
          var v = ($("#journal-input", m).value || "").trim();
          if (!v) { toast("한 줄이라도 적어 주세요!", "bad"); return; }
          game.journal.push({ turn: game.turn + 1, city: lastCity ? lastCity.city : "", text: v });
          addScore(15);
          Sound.play("stamp");
          addLog("📔 여행 일지 작성 +15", "gold");
          endTurn();
        } }
    ]
  });
}

/* =========================================================================
 * [L] 결과 리포트
 * ========================================================================= */

/* 스탬프 수에 따른 여행자 등급 */
function travelRank(stamps) {
  if (stamps >= 15) return { t: "월드투어 마스터", e: "🌟" };
  if (stamps >= 10) return { t: "랜드마크 수집가", e: "🏅" };
  if (stamps >= 6)  return { t: "세계 여행자", e: "🌍" };
  if (stamps >= 3)  return { t: "도시 탐험가", e: "🧭" };
  return { t: "첫 여행자", e: "🎒" };
}

function stampCardHTML(c, sub) {
  if (!c) return "";
  return "<div class='stamp-page' style='--c:" + c.continentColor + "'>" +
    "<div class='sp-i'>" + c.landmarkIcon + "</div>" +
    "<div class='sp-c'>" + esc(c.city) + "</div>" +
    "<div class='sp-l'>" + esc(sub != null ? sub : c.landmark) + "</div>" +
    "<div class='sp-f'>" + c.flag + "</div></div>";
}

/* 스탬프를 권역 단위로 묶어, 인쇄 때 권역 중간이 잘리지 않게 한다 */
function stampsGroupedHTML(ids, subFn) {
  var have = {};
  (ids || []).forEach(function (id) { have[id] = true; });
  var html = "";
  REGIONS.forEach(function (r) {
    var cities = CITIES.filter(function (c) { return c.region === r.key && have[c.id]; });
    if (!cities.length) return;
    html += "<div class='stamp-region' style='--c:" + r.color + "'>" +
      "<div class='stamp-region-h'>" +
        "<span class='sr-name'>" + esc(r.name) + "</span>" +
        "<span class='sr-n'>" + cities.length + "곳</span></div>" +
      "<div class='stamp-book'>";
    cities.forEach(function (c) {
      html += stampCardHTML(c, subFn ? subFn(c) : c.landmark);
    });
    html += "</div></div>";
  });
  return html;
}

function syncPrintAnswers() {
  $$(".reflect-q").forEach(function (q) {
    var ta = q.querySelector("textarea");
    var out = q.querySelector(".print-answer");
    if (!ta || !out) return;
    var text = (ta.value || "").trim();
    out.textContent = text || "(미작성)";
    out.classList.toggle("is-empty", !text);
  });
}

function isGameInProgress() {
  return !!(game && !game.finished);
}

function goTitleNow() {
  clearSaveFlagRefresh();
  renderCoverStats();
  renderHeroMap();
  showScreen("screen-title");
}

function confirmLeaveGame(onYes, message) {
  confirmDialog("게임 나가기",
    message || "진행 중인 여행이 있습니다. 홈으로 나갈까요?<br><span style='font-size:.86rem;color:var(--ink-500)'>이어하려면 <b>저장 후 나가기</b>를 이용하세요.</span>",
    onYes, "나가기");
}

function confirmSaveQuit(onYes) {
  confirmDialog("저장 후 나가기",
    "지금까지의 여행을 저장하고 홈으로 나갈까요?<br>나중에 <b>어반 런</b>을 누르면 이어서 할 수 있어요.",
    onYes, "저장하고 나가기");
}
function finishGame() {
  game.finished = true;
  game.finishedAt = nowStr();
  checkGoals();
  updateProfileFromGame();
  renderCoverStats();
  saveGame();
  Sound.play("fanfare");
  confetti(140);
  renderReport();
  showScreen("screen-report");
}

function renderReport() {
  var doc = $("#report-doc");
  var tk = tokenOf(game.tokenId);
  var rank = travelRank(game.stamped.length);
  var mode = MODES.filter(function (m) { return m.key === game.modeKey; })[0] || MODES[1];
  var solo = isSoloGame();
  var nameLine = solo
    ? esc(travelerName()) + " · " + esc(game.group.klass)
    : esc(game.group.klass) + " · " + esc(game.group.name);

  var html = "";
  html += "<div class='report-top'>" +
    "<div class='rt-eyebrow'>" + esc(APP.name) + " · TRAVEL REPORT</div>" +
    "<h2>" + esc(APP.tagline) + "</h2>" +
    "<div class='rt-group'>" + nameLine + " " + tk.emoji + "</div>" +
    "<div class='rt-mem'>" + esc(game.group.members.join(" · ")) + "</div>" +
    "<div class='rt-mem'>" + esc(mode.name) + " (" + game.turnLimit + "턴) · " + esc(game.startedAt) + "</div>" +
    "<div class='report-rank'>" + rank.e + " " + esc(rank.t) + "</div>" +
    "</div>";

  html += "<div class='report-body'>";

  /* 점수 요약 */
  var quizTotal = game.quiz.correct + game.quiz.retry + game.quiz.wrong;
  var accuracy = quizTotal ? Math.round((game.quiz.correct + game.quiz.retry) / quizTotal * 100) : 0;
  html += "<div class='score-grid'>" +
    "<div class='score-box hi'><div class='sk'>여행 점수</div><div class='sv'>" + game.score + "</div></div>" +
    "<div class='score-box'><div class='sk'>랜드마크 스탬프</div><div class='sv'>" + game.stamped.length + "<small>/24</small></div></div>" +
    "<div class='score-box'><div class='sk'>방문한 도시</div><div class='sv'>" + game.visited.length + "<small>곳</small></div></div>" +
    "<div class='score-box'><div class='sk'>완성한 권역</div><div class='sv'>" + game.regionsCleared.length + "<small>/6</small></div></div>" +
    "<div class='score-box'><div class='sk'>미션 성공률</div><div class='sv'>" + accuracy + "<small>%</small></div></div>" +
    "</div>";

  if (game.goals && game.goals.length) {
    html += "<section class='print-section is-keep'><h3 class='sec-title'>🎯 여행 목표</h3><div class='goal-list'>";
    game.goals.forEach(function (g) {
      var def = goalDef(g.id);
      if (!def) return;
      html += "<div class='goal-item" + (g.done ? " is-done" : "") + "'>" +
        "<span class='g-ico'>" + (g.done ? "✅" : "⬜") + "</span>" +
        "<div><div class='g-t'>" + esc(def.title) + "</div>" +
        "<div class='g-b'>" + (g.done ? "달성 +" + def.bonus : "미달성") + "</div></div></div>";
    });
    html += "</div></section>";
  }

  html += "<div class='report-summary-code teacher-only-block no-print'><strong>결과 요약 코드</strong> (선생님용)<br>" +
    esc(reportSummaryCode()) + "</div>";

  /* 스탬프 — 권역별 */
  html += "<section class='print-section'><h3 class='sec-title'>📍 " + (solo ? "나의" : "우리 팀의") + " 스탬프 트레일</h3>";
  var stampGroups = stampsGroupedHTML(game.stamped);
  html += stampGroups || "<p class='hint'>이번 여행에서는 스탬프를 얻지 못했어요. 다음 여행에서 도전해 봅시다!</p>";
  html += "</section>";

  /* 권역별 탐험률 */
  html += "<section class='print-section is-keep'><h3 class='sec-title'>🗺️ 권역별 탐험 진행률</h3><div class='region-report'>";
  REGIONS.forEach(function (r) {
    var st = regionStat(r.key);
    var pct = st.total ? (st.done / st.total * 100) : 0;
    html += "<div class='rr-row" + (st.done >= st.total && st.total ? " is-clear" : "") + "' style='--c:" + r.color + "'>" +
      "<span class='rr-name'>" + esc(r.name) + "</span>" +
      "<span class='rr-track'><span class='rr-fill' style='width:" + pct + "%'></span></span>" +
      "<span class='rr-num'>" + st.done + "/" + st.total + "</span></div>";
  });
  html += "</div></section>";

  /* 여행 일지 · 사진 · 축제 (화면용, 제출 PDF에서는 생략) */
  if (game.journal.length || game.photos.length || game.festivals.length) {
    html += "<h3 class='sec-title no-print'>📔 여행 일지</h3><div class='journal no-print'>";
    game.journal.forEach(function (j) {
      html += "<div class='journal-item'><div class='jt'>" + j.turn + "턴" +
        (j.city ? " · " + esc(j.city) : "") + "</div>" + esc(j.text) + "</div>";
    });
    if (game.photos.length) {
      html += "<div class='journal-item'><div class='jt'>📸 베스트 컷</div>" +
        game.photos.map(function (id) { var c = getCity(id); return c.flag + " " + esc(c.city); }).join(" · ") + "</div>";
    }
    if (game.festivals.length) {
      html += "<div class='journal-item'><div class='jt'>🎉 만난 축제</div>" +
        game.festivals.map(esc).join(" · ") + "</div>";
    }
    html += "</div>";
  }

  /* 성찰 — 문항별로 페이지가 갈리도록 (목록 전체를 한 덩어리로 묶지 않음) */
  var saved = game.report || {};
  html += "<section class='print-section'><h3 class='sec-title'>✍️ 여행을 마치며 (성찰)</h3>";
  html += "<div class='reflect-list'>";
  html += "<div class='reflect-q'><div class='rq'><span>Q1.</span> 가장 인상 깊었던 도시를 고르고, 그 까닭을 적어 봅시다.</div>" +
          "<div class='pick-fav no-print' id='fav-pick'></div>" +
          "<p class='print-only print-fav' id='print-fav'></p>" +
          "<textarea class='textarea' id='reflect-1' style='margin-top:8px' placeholder='예) 싱가포르가 인상 깊었다. 물이 부족한데도 기술로 해결한 점이 놀라웠다.'>" +
          esc(saved.r1 || "") + "</textarea>" +
          "<div class='print-answer' aria-hidden='true'></div></div>";
  html += "<div class='reflect-q'><div class='rq'><span>Q2.</span> 오늘 만난 도시들 사이에서 발견한 <b>공통점</b>이나 <b>차이점</b>은 무엇인가요?</div>" +
          "<textarea class='textarea' id='reflect-2' placeholder='예) 큰 강이나 바다를 끼고 발달한 도시가 많았다. 반면 기후는 아주 달랐다.'>" +
          esc(saved.r2 || "") + "</textarea>" +
          "<div class='print-answer' aria-hidden='true'></div></div>";
  html += "<div class='reflect-q'><div class='rq'><span>Q3.</span> 앞으로 <b>더 깊이 공부해 보고 싶은 도시나 주제</b>는 무엇인가요?</div>" +
          "<textarea class='textarea' id='reflect-3' placeholder='예) 해수면 상승 때문에 수도를 옮기는 자카르타에 대해 더 알아보고 싶다.'>" +
          esc(saved.r3 || "") + "</textarea>" +
          "<div class='print-answer' aria-hidden='true'></div></div>";
  html += "</div></section>";

  html += "</div>"; /* report-body */
  doc.innerHTML = html;

  /* 인상 깊은 도시 선택 버튼 */
  var favWrap = $("#fav-pick");
  var pool = game.stamped.length ? game.stamped : game.visited;
  if (!pool.length) {
    favWrap.innerHTML = "<span class='hint'>방문한 도시가 없습니다.</span>";
  } else {
    pool.map(getCity).forEach(function (c) {
      var b = el("button", "fav-btn" + (saved.fav === c.id ? " is-on" : ""), c.flag + " " + esc(c.city));
      b.addEventListener("click", function () {
        $$(".fav-btn", favWrap).forEach(function (x) { x.classList.remove("is-on"); });
        b.classList.add("is-on");
        game.report = game.report || {};
        game.report.fav = c.id;
        Sound.play("click");
        saveGame();
        updatePrintFav();
      });
      favWrap.appendChild(b);
    });
  }
  updatePrintFav();
  syncPrintAnswers();
}

function updatePrintFav() {
  var elFav = $("#print-fav");
  if (!elFav || !game) return;
  var favId = game.report && game.report.fav;
  var c = favId ? getCity(favId) : null;
  elFav.textContent = c ? "선택한 도시: " + c.flag + " " + c.city : "";
}

/* 리포트 입력 내용 수집 */
function collectReport() {
  game.report = game.report || {};
  var r1 = $("#reflect-1"), r2 = $("#reflect-2"), r3 = $("#reflect-3");
  if (r1) game.report.r1 = r1.value.trim();
  if (r2) game.report.r2 = r2.value.trim();
  if (r3) game.report.r3 = r3.value.trim();
  return game.report;
}

/* 리포트를 텍스트로 변환 (복사 / 파일 저장용) */
function reportSummaryCode() {
  if (!game) return "";
  var solo = isSoloGame();
  var who = solo ? travelerName() : game.group.name;
  var prefix = settings.sessionCode ? settings.sessionCode.trim() + " | " : "";
  return prefix + game.group.klass + " | " + who + " | " + game.score + "점 | 스탬프" +
    game.stamped.length + " | 권역" + game.regionsCleared.length;
}

function reportToText() {
  collectReport();
  var rank = travelRank(game.stamped.length);
  var mode = MODES.filter(function (m) { return m.key === game.modeKey; })[0] || MODES[1];
  var solo = isSoloGame();
  var L = [];
  L.push("=== " + APP.name + " · " + APP.tagline + " 여행 리포트 ===");
  L.push("학급 : " + game.group.klass);
  L.push((solo ? "여행자" : "팀") + " : " + (solo ? travelerName() : game.group.name));
  L.push((solo ? "여행자" : "팀원") + " : " + game.group.members.join(", "));
  L.push("모드 : " + mode.name + " (" + game.turnLimit + "턴) / 진행 : " + game.startedAt);
  L.push("등급 : " + rank.t);
  L.push("요약 코드 : " + reportSummaryCode());
  L.push("");
  L.push("[점수 요약]");
  L.push("- 여행 점수 : " + game.score + "점");
  L.push("- 랜드마크 스탬프 : " + game.stamped.length + " / 24");
  L.push("- 방문한 도시 : " + game.visited.length + "곳");
  L.push("- 완성한 권역 : " + game.regionsCleared.length + " / 6");
  L.push("");
  L.push("[획득한 스탬프]");
  if (game.stamped.length) {
    game.stamped.forEach(function (id) {
      var c = getCity(id);
      L.push("- " + c.city + " (" + c.country + ") · " + c.landmark + " · " + c.regionName);
    });
  } else { L.push("- 없음"); }
  L.push("");
  L.push("[권역별 탐험]");
  REGIONS.forEach(function (r) {
    var st = regionStat(r.key);
    L.push("- " + r.name + " : " + st.done + "/" + st.total);
  });
  if (game.journal.length) {
    L.push("");
    L.push("[여행 일지]");
    game.journal.forEach(function (j) { L.push("- (" + j.turn + "턴) " + j.text); });
  }
  L.push("");
  L.push("[성찰]");
  var favCity = game.report.fav ? getCity(game.report.fav) : null;
  L.push("Q1. 가장 인상 깊었던 도시 : " + (favCity ? favCity.city : "(미선택)"));
  L.push("    " + (game.report.r1 || "(작성 전)"));
  L.push("Q2. 공통점과 차이점");
  L.push("    " + (game.report.r2 || "(작성 전)"));
  L.push("Q3. 더 공부하고 싶은 도시·주제");
  L.push("    " + (game.report.r3 || "(작성 전)"));
  L.push("");
  L.push("작성 일시 : " + nowStr());
  return L.join("\n");
}

/* 결과 저장 (이 기기 기록용) */
function saveResult(silent) {
  if (!game) return false;
  collectReport();
  if (game.resultSaved) {
    if (!silent) toast("이미 이 기기에 저장된 결과입니다.", "");
    saveGame();
    return true;
  }
  var list = Store.get(LS.results, []);
  var rank = travelRank(game.stamped.length);
  var solo = isSoloGame();
  list.push({
    id: "r" + Date.now(),
    date: nowStr(),
    klass: game.group.klass,
    name: solo ? travelerName() : game.group.name,
    members: game.group.members.slice(),
    token: game.tokenId,
    color: game.color,
    mode: game.modeKey,
    turns: game.turnLimit,
    score: game.score,
    stamps: game.stamped.slice(),
    visited: game.visited.length,
    regions: game.regionsCleared.length,
    rank: rank.t,
    fav: game.report.fav || "",
    r1: game.report.r1 || "", r2: game.report.r2 || "", r3: game.report.r3 || ""
  });
  var ok = Store.set(LS.results, list);
  if (ok) game.resultSaved = true;
  if (!silent) {
    Sound.play(ok ? "stamp" : "wrong");
    toast(ok ? "이 기기에 결과를 저장했어요." : "저장 공간을 사용할 수 없습니다.", ok ? "good" : "bad");
  }
  saveGame();
  return ok;
}

/* PDF 저장용 파일명 */
function reportBaseName() {
  var solo = isSoloGame();
  var klass = (game.group.klass || "학급").replace(/[^\w가-힣]/g, "") || "학급";
  var name = solo ? travelerName() : game.group.name;
  name = (name || "팀").replace(/[^\w가-힣]/g, "") || "팀";
  return "URBAN_TRAIL_" + klass + "_" + name + "_" + todayStr();
}

function reportPdfSave() {
  collectReport();
  saveGame();
  saveResult(true);
  var prevTitle = document.title;
  var fname = reportBaseName();
  document.title = fname;
  window.print();
  window.setTimeout(function () { document.title = prevTitle; }, 800);
  toast("인쇄 창에서 「PDF로 저장」을 선택하세요. 파일명: " + fname + ".pdf", "good");
}

function downloadReportJson() {
  if (!game) return;
  collectReport();
  var solo = isSoloGame();
  var rank = travelRank(game.stamped.length);
  var payload = {
    app: APP.name,
    version: APP.version,
    exportedAt: nowStr(),
    klass: game.group.klass,
    team: solo ? travelerName() : game.group.name,
    members: game.group.members.slice(),
    playMode: game.playMode || (solo ? "solo" : "team"),
    mode: game.modeKey,
    turns: game.turnLimit,
    score: game.score,
    stamps: game.stamped.slice(),
    visited: game.visited.length,
    regions: game.regionsCleared.length,
    rank: rank.t,
    summary: reportSummaryCode(),
    report: Object.assign({}, game.report || {})
  };
  try {
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = reportBaseName() + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    toast("JSON 파일을 저장했어요.", "good");
  } catch (e) {
    toast("이 브라우저에서는 파일 저장을 지원하지 않습니다.", "bad");
  }
}

function exportResultsJson() {
  var list = Store.get(LS.results, []);
  if (!list.length) { toast("내보낼 기록이 없습니다.", "bad"); return; }
  try {
    var blob = new Blob([JSON.stringify({ exportedAt: nowStr(), results: list }, null, 2)],
      { type: "application/json;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "URBAN_TRAIL_device_records_" + todayStr() + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    toast("이 기기의 여행 기록 JSON을 저장했어요.", "good");
  } catch (e) {
    toast("이 브라우저에서는 파일 저장을 지원하지 않습니다.", "bad");
  }
}

/* 텍스트 파일 다운로드 */
function downloadReport() {
  var text = reportToText();
  try {
    var blob = new Blob(["﻿" + text], { type: "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = reportBaseName() + ".txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    toast("텍스트 파일을 저장했어요.", "good");
  } catch (e) {
    toast("이 브라우저에서는 파일 저장을 지원하지 않습니다.", "bad");
  }
}

/* 클립보드 복사 */
function copyReport() {
  var text = reportToText();
  function fallback() {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
    toast(ok ? "리포트를 복사했어요." : "복사에 실패했습니다.", ok ? "good" : "bad");
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () {
      toast("리포트를 복사했어요.", "good");
    }, fallback);
  } else { fallback(); }
}

function copySummary() {
  var text = reportSummaryCode();
  function fallback() {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) {} 
    document.body.removeChild(ta);
    toast(ok ? "요약 코드를 복사했어요." : "복사에 실패했습니다.", ok ? "good" : "bad");
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () {
      toast("요약 코드를 복사했어요.", "good");
    }, fallback);
  } else { fallback(); }
}

/* =========================================================================
 * [M] 게임 설정 화면 / 트레일 맵 / 선생님 설정 / 이 기기 기록
 * ========================================================================= */

/* ---------------------------- 설정 화면 ---------------------------- */
function newSetupDraft() {
  var saved = Store.get(LS.groups, []);
  var last = saved.length ? saved[saved.length - 1] : null;
  return {
    step: 1,
    playMode: "team",
    mode: settings.defaultMode,
    klass: last ? last.klass : userKlassLabel(),
    name: "",
    members: ["", ""],
    tokenId: TOKENS[0].id,
    color: COLORS[5]
  };
}

function minMembers() { return setupDraft && setupDraft.playMode === "solo" ? 1 : 2; }

function updateSetupStep2Copy() {
  if (!setupDraft) return;
  var solo = setupDraft.playMode === "solo";
  var t = $("#setup-step2-title");
  var s = $("#setup-step2-sub");
  var gl = $("#setup-group-label");
  var ml = $("#setup-member-label");
  var rh = $("#member-range-hint");
  var ig = $("#in-group");
  if (t) t.textContent = solo ? "여행자 정보를 입력하세요" : "팀 정보를 입력하세요";
  if (s) s.textContent = solo
    ? "학급과 여행자 이름을 입력하세요. 혼자 하기는 1명만 필요합니다."
    : "학급과 팀 이름은 필수입니다. 함께 여행할 친구 이름을 2~5명까지 입력하세요.";
  if (gl) gl.innerHTML = solo ? "여행 제목 <span class='hint'>(선택)</span>" : "팀 이름<span class='req'>*</span>";
  if (ml) ml.textContent = solo ? "여행자 이름" : "친구 이름";
  if (rh) rh.textContent = solo ? "(1명)" : "(2~5명)";
  if (ig) ig.placeholder = solo ? "예) 김지호의 세계일주" : "예) 3반 탐험대";
  var dot2 = $("#setup-step2-dot");
  if (dot2) dot2.textContent = solo ? "여행자" : "팀 정보";
  var t3 = $("#setup-step3-title");
  var s3 = $("#setup-step3-sub");
  if (t3) t3.textContent = solo ? "나의 여행 말을 고르세요" : "우리 팀의 여행 말을 고르세요";
  if (s3) s3.textContent = solo
    ? "말과 색상을 고르면 보드와 트레일 로그에 적용됩니다."
    : "말과 대표 색상을 선택하면 보드 위의 말과 트레일 로그에 적용됩니다.";
  var step2Next = document.querySelector('.setup-step[data-step="2"] [data-act="setup-next"]');
  if (step2Next) step2Next.textContent = solo ? "✈️ 바로 시작" : "다음 →";
  var addBtn = document.querySelector('[data-act="add-member"]');
  if (addBtn) {
    addBtn.hidden = solo;
    addBtn.textContent = "＋ 친구 추가";
  }
  var steps = $("#setup-steps");
  if (steps) steps.classList.toggle("is-solo", solo);
}

function renderPlayModeSeg() {
  var wrap = $("#play-mode-seg");
  if (!wrap || !setupDraft) return;
  wrap.innerHTML = "";
  [{ t: "친구와 함께", v: "team" }, { t: "혼자 하기", v: "solo" }].forEach(function (o) {
    var b = el("button", setupDraft.playMode === o.v ? "is-on" : "", o.t);
    b.addEventListener("click", function () {
      if (setupDraft.playMode === o.v) return;
      setupDraft.playMode = o.v;
      if (o.v === "solo") {
        if (setupDraft.members.length > 1) setupDraft.members = [setupDraft.members[0] || ""];
        else if (!setupDraft.members.length) setupDraft.members = [""];
      } else if (setupDraft.members.length < 2) {
        while (setupDraft.members.length < 2) setupDraft.members.push("");
      }
      Sound.play("click");
      renderPlayModeSeg();
      updateSetupStep2Copy();
      renderMemberInputs();
      renderSetupPreview();
    });
    wrap.appendChild(b);
  });
}

function openSetup() {
  setupDraft = newSetupDraft();
  renderPlayModeSeg();
  updateSetupStep2Copy();
  renderModeGrid();
  renderMemberInputs();
  renderSavedGroups();
  renderTokenGrid();
  renderColorRow();
  renderSetupPreview();
  $("#in-class").value = setupDraft.klass;
  $("#in-group").value = setupDraft.name;
  gotoSetupStep(1);
  showScreen("screen-setup");
}

function gotoSetupStep(n) {
  setupDraft.step = n;
  $$("#setup-steps .step-dot").forEach(function (d) {
    var s = parseInt(d.dataset.step, 10);
    d.classList.toggle("is-on", s === n);
    d.classList.toggle("is-done", s < n);
  });
  $$(".setup-step").forEach(function (p) {
    p.classList.toggle("is-active", parseInt(p.dataset.step, 10) === n);
  });
  $("#setup-error").style.display = "none";
  window.scrollTo({ top: 0, behavior: "auto" });
}

function renderModeGrid() {
  var wrap = $("#mode-grid");
  wrap.innerHTML = "";
  MODES.forEach(function (m) {
    var b = el("button", "mode-card" + (m.key === setupDraft.mode ? " is-on" : ""));
    b.setAttribute("aria-pressed", m.key === setupDraft.mode ? "true" : "false");
    b.innerHTML =
      "<div class='mode-emoji'>" + m.emoji + "</div>" +
      "<div class='mode-name'>" + esc(m.name) + "</div>" +
      "<div class='mode-meta'><span class='chip'>🎲 " + m.turns + "턴</span><span class='chip'>⏱️ " + esc(m.time) + "</span></div>" +
      "<div class='mode-desc'>" + esc(m.desc) + "</div>";
    b.addEventListener("click", function () {
      setupDraft.mode = m.key;
      Sound.unlock(); Sound.play("click");
      renderModeGrid();
    });
    wrap.appendChild(b);
  });
}

function renderMemberInputs() {
  var wrap = $("#members");
  wrap.innerHTML = "";
  setupDraft.members.forEach(function (val, i) {
    var row = el("div", "member-row");
    row.innerHTML = "<span class='idx'>" + (i + 1) + "</span>";
    var input = el("input", "input");
    input.type = "text";
    input.maxLength = 12;
    input.placeholder = setupDraft.playMode === "solo"
      ? "여행자 이름"
      : (i + 1) + "번째 친구 이름";
    input.value = val;
    input.autocomplete = "off";
    input.addEventListener("input", function () { setupDraft.members[i] = input.value; });
    row.appendChild(input);
    var x = el("button", "btn-x", "✕");
    x.type = "button";
    x.title = "삭제";
    if (setupDraft.playMode === "solo") x.hidden = true;
    x.addEventListener("click", function () {
      var min = minMembers();
      if (setupDraft.members.length <= min) {
        toast("친구는 최소 " + min + "명이 필요해요.", "bad"); return;
      }
      setupDraft.members.splice(i, 1);
      Sound.play("click");
      renderMemberInputs();
    });
    row.appendChild(x);
    wrap.appendChild(row);
  });
  var solo = setupDraft.playMode === "solo";
  $("#member-hint").textContent = solo
    ? "혼자 하기 · 1명"
    : "현재 " + setupDraft.members.length + "명 (최소 " + minMembers() + "명, 최대 5명)";
}

function renderSavedGroups() {
  var saved = Store.get(LS.groups, []);
  var wrap = $("#saved-groups");
  var box = $("#saved-groups-wrap");
  if (!saved.length) { box.style.display = "none"; return; }
  box.style.display = "block";
  wrap.innerHTML = "";
  saved.slice().reverse().slice(0, 8).forEach(function (g) {
    var b = el("button", "saved-group-btn",
      esc(g.klass) + " · <b>" + esc(g.name) + "</b> <span style='color:var(--ink-300)'>(" + g.members.length + "명)</span>");
    b.addEventListener("click", function () {
      setupDraft.klass = g.klass;
      setupDraft.name = g.name;
      setupDraft.members = g.members.slice(0, 5);
      $("#in-class").value = g.klass;
      $("#in-group").value = g.name;
      renderMemberInputs();
      Sound.play("click");
      toast("이전 팀 정보를 불러왔어요.", "good");
    });
    wrap.appendChild(b);
  });
}

function renderTokenGrid() {
  var wrap = $("#token-grid");
  wrap.innerHTML = "";
  TOKENS.forEach(function (t) {
    var b = el("button", "token-card" + (t.id === setupDraft.tokenId ? " is-on" : ""));
    b.innerHTML = "<div class='token-emoji' style='--tc:" + setupDraft.color + "'>" + t.emoji + "</div>" +
                  "<div class='token-name'>" + esc(t.name) + "</div>";
    b.addEventListener("click", function () {
      setupDraft.tokenId = t.id;
      Sound.play("click");
      renderTokenGrid(); renderSetupPreview();
    });
    wrap.appendChild(b);
  });
}

function renderColorRow() {
  var wrap = $("#color-row");
  wrap.innerHTML = "";
  COLORS.forEach(function (c) {
    var b = el("button", "color-dot" + (c === setupDraft.color ? " is-on" : ""));
    b.style.background = c;
    b.title = c;
    b.addEventListener("click", function () {
      setupDraft.color = c;
      Sound.play("click");
      renderColorRow(); renderTokenGrid(); renderSetupPreview();
    });
    wrap.appendChild(b);
  });
}

function renderSetupPreview() {
  var t = tokenOf(setupDraft.tokenId);
  var mode = MODES.filter(function (m) { return m.key === setupDraft.mode; })[0] || MODES[1];
  var names = setupDraft.members.filter(function (n) { return n.trim(); });
  var solo = setupDraft.playMode === "solo";
  $("#setup-preview").innerHTML =
    "<div class='pv-token' style='--tc:" + setupDraft.color + "'>" + t.emoji + "</div>" +
    "<div><div class='pv-name'>" + esc(setupDraft.name || (solo ? "여행자명 미입력" : "팀 이름 미입력")) + "</div>" +
    "<div class='pv-meta'>" + esc(setupDraft.klass || "학급 미입력") + " · " +
    esc(names.length ? names.join(", ") : (solo ? "이름 미입력" : "친구 이름 미입력")) + "</div>" +
    "<div class='pv-meta'>" + (solo ? "혼자 하기 · " : "친구와 함께 · ") +
    esc(mode.name) + " · " + mode.turns + "턴 · " + esc(mode.time) + " · 말: " + esc(t.name) + "</div></div>";
}

/* 2단계 유효성 검사 */
function validateGroup() {
  setupDraft.klass = $("#in-class").value.trim();
  setupDraft.name = $("#in-group").value.trim();
  var err = $("#setup-error");
  var names = setupDraft.members.map(function (n) { return n.trim(); }).filter(Boolean);
  var solo = setupDraft.playMode === "solo";
  var min = minMembers();

  $("#in-class").classList.remove("is-error");
  $("#in-group").classList.remove("is-error");

  if (!setupDraft.klass) {
    $("#in-class").classList.add("is-error");
    err.textContent = "학급을 입력해 주세요.";
    err.style.display = "block"; return false;
  }
  if (!solo && !setupDraft.name) {
    $("#in-group").classList.add("is-error");
    err.textContent = "팀 이름을 입력해 주세요.";
    err.style.display = "block"; return false;
  }
  if (names.length < min) {
    err.textContent = solo ? "여행자 이름을 입력해 주세요." : "친구 이름을 2명 이상 입력해 주세요.";
    err.style.display = "block"; return false;
  }
  setupDraft.members = names;
  if (solo && !setupDraft.name) setupDraft.name = names[0];
  renderMemberInputs();
  err.style.display = "none";
  return true;
}

/* 팀 정보 기억 (이 기기에만 저장) */
function rememberGroup() {
  var list = Store.get(LS.groups, []);
  list = list.filter(function (g) {
    return !(g.klass === setupDraft.klass && g.name === setupDraft.name);
  });
  list.push({ klass: setupDraft.klass, name: setupDraft.name, members: setupDraft.members.slice() });
  if (list.length > 12) list = list.slice(list.length - 12);
  Store.set(LS.groups, list);
}

/* 게임 시작 */
function startGame() {
  if (!validateGroup()) { gotoSetupStep(2); return; }
  if (setupDraft.playMode === "team") rememberGroup();
  game = createGame(setupDraft);
  bumpPlayCount();
  renderCoverStats();
  var msg = isSoloGame()
    ? "✈️ " + esc(travelerName()) + "의 세계 여행이 시작되었습니다!"
    : "✈️ " + esc(game.group.name) + " 팀의 세계 여행이 시작되었습니다!";
  addLog(msg, "gold");
  clearSaveFlagRefresh();
  enterGameScreen();
  saveGame();
  toast("여행 목표 3장이 주어졌어요. 주사위를 굴려 보세요!", "good");
}

/* 게임 화면 진입 */
function enterGameScreen() {
  showScreen("screen-game");
  renderBoard();
  renderWorldMap();
  renderSidePanel();
  drawDice(1, { instant: true });
  busy = false;
  setRollEnabled(!game.finished);
  window.setTimeout(updateBoardScale, 60);
  window.setTimeout(function () { movePawnTo(game.pos, true); }, 200);
  window.setTimeout(function () { maybeStartScreenTutorial("play"); }, 500);
}

/* 이어하기 버튼 활성/비활성 */
function clearSaveFlagRefresh() {
  var saved = loadGame();
  var btn = $("#btn-continue");
  if (!btn) return;
  var ok = !!(saved && !saved.finished);
  btn.disabled = !ok;
  btn.textContent = ok
    ? "📖 이어하기 (" + saved.group.name + " · " + (saved.turn + 1) + "턴)"
    : "📖 이어하기";
}

function continueGame() {
  var saved = loadGame();
  if (!saved) { toast("저장된 게임이 없습니다.", "bad"); return; }
  game = saved;
  /* 저장 데이터 보정 (버전 차이 대비) */
  game.journal = game.journal || [];
  game.photos = game.photos || [];
  game.festivals = game.festivals || [];
  game.regionsCleared = game.regionsCleared || [];
  game.quiz = game.quiz || { correct: 0, retry: 0, wrong: 0 };
  game.playMode = game.playMode || (game.group.members.length === 1 ? "solo" : "team");
  if (!game.goals || !game.goals.length) game.goals = pickGoals(3);
  if (game.finished) { renderReport(); showScreen("screen-report"); return; }
  enterGameScreen();
  toast("저장된 여행을 이어서 시작합니다.", "good");
}

/* ---------------------------- 월드 아틀라스 ---------------------------- */
var atlas = {
  view: "map",
  filter: "ALL",
  funcFilter: "ALL",
  sort: "name",
  query: "",
  selected: null,
  tab: "nature",
  imgIdx: 0,
  vb: { x: 0, y: 0, w: MAP_VIEW.w, h: MAP_VIEW.h },
  bound: false,
  panning: false,
  pan: null,
  pinch: null
};

var compare = { slots: [null, null, null] };

function collectStats() {
  var found = CITIES.filter(function (c) { return codexHas(c.id); }).length;
  var stamps = CITIES.filter(function (c) { return stampHas(c.id); }).length;
  return { found: found, stamps: stamps, total: CITIES.length };
}
function collectSummaryHTML() {
  var st = collectStats();
  return "<span class='big'>" + st.found + "</span><span>/ " + st.total + "개 발견</span>" +
    "<span class='chip'>스탬프 " + st.stamps + " / " + st.total + "</span>" +
    "<span class='chip'>지도에서 도시를 고르거나 목록으로 찾아보세요</span>";
}
function renderCoverStats() {
  var box = $("#cover-stats");
  if (!box) return;
  var st = collectStats();
  var pctFound = st.total ? Math.round(st.found / st.total * 100) : 0;
  var pctStamp = st.total ? Math.round(st.stamps / st.total * 100) : 0;
  box.innerHTML =
    "<div class='stat-item'>" +
      "<span class='stat-k'>발견 도시</span>" +
      "<span class='stat-v'>" + st.found + "<small> / " + st.total + "</small></span>" +
      "<div class='stat-track'><div class='stat-fill' style='width:" + pctFound + "%'></div></div>" +
    "</div>" +
    "<div class='stat-item'>" +
      "<span class='stat-k'>랜드마크 스탬프</span>" +
      "<span class='stat-v'>" + st.stamps + "<small> / " + st.total + "</small></span>" +
      "<div class='stat-track'><div class='stat-fill' style='width:" + pctStamp + "%'></div></div>" +
    "</div>" +
    "<div class='stat-item'>" +
      "<span class='stat-k'>탐험 진행률</span>" +
      "<span class='stat-v'>" + pctFound + "<small>%</small></span>" +
      "<div class='stat-track'><div class='stat-fill' style='width:" + pctFound + "%'></div></div>" +
    "</div>";
}

function renderHeroMap() {
  var svg = $("#hero-map");
  if (!svg) return;
  drawMapBase(svg);
  var ns = "http://www.w3.org/2000/svg";
  var g = document.createElementNS(ns, "g");
  g.setAttribute("id", "hero-dots");
  CITIES.forEach(function (c) {
    var stamped = stampHas(c.id);
    var found = codexHas(c.id);
    var dot = document.createElementNS(ns, "circle");
    dot.setAttribute("cx", c.coordinates.x);
    dot.setAttribute("cy", c.coordinates.y);
    dot.setAttribute("r", stamped ? 3.8 : (found ? 3 : 2.2));
    dot.setAttribute("class", "wm-dot" + (stamped ? " is-visited" : (found ? " is-onboard" : "")));
    if (!stamped && found) dot.setAttribute("fill", c.continentColor);
    g.appendChild(dot);
  });
  svg.appendChild(g);
}

function atlasFilteredCities() {
  var q = atlas.query.trim().toLowerCase();
  var list = CITIES.filter(function (c) {
    if (atlas.filter !== "ALL" && c.region !== atlas.filter) return false;
    if (atlas.funcFilter !== "ALL") {
      if ((c.functions || []).indexOf(atlas.funcFilter) < 0) return false;
    }
    if (!q) return true;
    var blob = c.city + c.country + c.landmark + c.regionName + c.keywords.join("") + (c.functions || []).join("");
    return blob.toLowerCase().indexOf(q) !== -1;
  });
  list = list.slice();
  var sk = atlas.sort || "name";
  list.sort(function (a, b) {
    var sa = cityStats(a), sb = cityStats(b);
    if (sk === "pop") return sb.population - sa.population;
    if (sk === "elev") return sb.elevation - sa.elevation;
    if (sk === "rain") return (sb.annualRain || 0) - (sa.annualRain || 0);
    return a.city.localeCompare(b.city, "ko");
  });
  return list;
}

function openAtlas(opts) {
  opts = opts || {};
  if (opts.view) atlas.view = opts.view;
  if (opts.cityId) atlas.selected = opts.cityId;
  renderAtlasChrome();
  renderAtlasView();
  showScreen("screen-atlas", true);
  window.setTimeout(function () {
    bindAtlasMap();
    applyAtlasViewBox();
    if (opts.cityId) {
      atlasFocusCity(opts.cityId, false);
      openAtlasCityModal(getCity(opts.cityId));
    }
    maybeStartScreenTutorial("atlas");
  }, 40);
}
function openCodex() { openAtlas({ view: "list" }); }

function renderAtlasChrome() {
  var sum = $("#atlas-summary");
  if (sum) sum.innerHTML = collectSummaryHTML();
  $("#atlas-btn-map") && $("#atlas-btn-map").classList.toggle("is-on", atlas.view === "map");
  $("#atlas-btn-list") && $("#atlas-btn-list").classList.toggle("is-on", atlas.view === "list");
  var wrap = $("#atlas-filters");
  if (!wrap) return;
  wrap.innerHTML = "";
  function addFilter(key, label, color) {
    var b = el("button", "filter-btn" + (atlas.filter === key ? " is-on" : ""), label);
    b.style.setProperty("--c", color);
    b.addEventListener("click", function () {
      atlas.filter = key;
      renderAtlasChrome();
      renderAtlasView();
      if (atlas.view === "map") atlasFrameRegion(key);
    });
    wrap.appendChild(b);
  }
  addFilter("ALL", "전체", "#2563eb");
  REGIONS.forEach(function (r) { addFilter(r.key, esc(r.short), r.color); });

  var sortRow = $("#atlas-sort-row");
  if (sortRow) {
    sortRow.innerHTML = "";
    var sortLbl = el("span", "sort-lbl", "정렬");
    sortRow.appendChild(sortLbl);
    ATLAS_SORTS.forEach(function (s) {
      var b = el("button", "sort-btn" + (atlas.sort === s.key ? " is-on" : ""), s.label);
      b.addEventListener("click", function () {
        atlas.sort = s.key;
        renderAtlasChrome();
        renderAtlasView();
      });
      sortRow.appendChild(b);
    });
    var fnLbl = el("span", "sort-lbl", "기능");
    sortRow.appendChild(fnLbl);
    FUNCTION_FILTERS.forEach(function (fk) {
      var b = el("button", "sort-btn fn-btn" + (atlas.funcFilter === fk ? " is-on" : ""), fk === "ALL" ? "전체" : fk);
      b.addEventListener("click", function () {
        atlas.funcFilter = fk;
        renderAtlasChrome();
        renderAtlasView();
      });
      sortRow.appendChild(b);
    });
  }
}

function renderAtlasView() {
  var mapW = $("#atlas-map-wrap"), listW = $("#atlas-list-wrap");
  if (mapW) mapW.hidden = atlas.view !== "map";
  if (listW) listW.hidden = atlas.view !== "list";
  if (atlas.view === "map") renderAtlasMap();
  else renderAtlasList();
}

function atlasScale() { return MAP_VIEW.w / atlas.vb.w; }

function applyAtlasViewBox() {
  var svg = $("#atlas-map");
  if (!svg) return;
  var v = atlas.vb;
  svg.setAttribute("viewBox", v.x.toFixed(1) + " " + v.y.toFixed(1) + " " + v.w.toFixed(1) + " " + v.h.toFixed(1));
  renderAtlasHotspots();
}

function clampAtlasView() {
  var v = atlas.vb;
  v.w = Math.min(MAP_VIEW.w, Math.max(70, v.w));
  v.h = v.w * (MAP_VIEW.h / MAP_VIEW.w);
  v.x = Math.min(Math.max(0, v.x), MAP_VIEW.w - v.w);
  v.y = Math.min(Math.max(0, v.y), MAP_VIEW.h - v.h);
}

function atlasZoomAt(cx, cy, factor) {
  var v = atlas.vb;
  var nx = cx - (cx - v.x) * factor;
  var ny = cy - (cy - v.y) * factor;
  v.w *= factor; v.h *= factor; v.x = nx; v.y = ny;
  clampAtlasView();
  applyAtlasViewBox();
}

function atlasClientToMap(clientX, clientY) {
  var svg = $("#atlas-map");
  if (!svg) return { x: MAP_VIEW.w / 2, y: MAP_VIEW.h / 2 };
  var r = svg.getBoundingClientRect();
  return {
    x: atlas.vb.x + (clientX - r.left) / r.width * atlas.vb.w,
    y: atlas.vb.y + (clientY - r.top) / r.height * atlas.vb.h
  };
}

function atlasFrameBox(minX, minY, maxX, maxY) {
  var pad = Math.max((maxX - minX) * 0.18, 28);
  var w = Math.max(maxX - minX + pad * 2, 120);
  var h = w * (MAP_VIEW.h / MAP_VIEW.w);
  var cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  atlas.vb = { x: cx - w / 2, y: cy - h / 2, w: w, h: h };
  clampAtlasView();
  applyAtlasViewBox();
}

function atlasFrameRegion(key) {
  if (key === "ALL") {
    atlas.vb = { x: 0, y: 0, w: MAP_VIEW.w, h: MAP_VIEW.h };
    applyAtlasViewBox();
    return;
  }
  var list = CITIES.filter(function (c) { return c.region === key; });
  if (!list.length) return;
  var xs = list.map(function (c) { return c.coordinates.x; });
  var ys = list.map(function (c) { return c.coordinates.y; });
  atlasFrameBox(Math.min.apply(null, xs), Math.min.apply(null, ys),
                Math.max.apply(null, xs), Math.max.apply(null, ys));
}

function atlasFocusCity(id, zoom) {
  var c = getCity(id);
  if (!c) return;
  if (zoom !== false) {
    var s = 220;
    atlas.vb = { x: c.coordinates.x - s / 2, y: c.coordinates.y - s * MAP_VIEW.h / MAP_VIEW.w / 2, w: s, h: s * MAP_VIEW.h / MAP_VIEW.w };
    clampAtlasView();
  }
  applyAtlasViewBox();
}

function renderAtlasMap() {
  var svg = $("#atlas-map");
  if (!svg) return;
  drawMapBase(svg);
  var ns = "http://www.w3.org/2000/svg";
  var g = document.createElementNS(ns, "g");
  g.setAttribute("id", "atlas-hotspots");
  svg.appendChild(g);
  var labels = document.createElementNS(ns, "g");
  labels.setAttribute("id", "atlas-labels");
  svg.appendChild(labels);
  renderAtlasRegionBar();
  applyAtlasViewBox();
}

function renderAtlasRegionBar() {
  var bar = $("#atlas-region-bar");
  if (!bar) return;
  bar.innerHTML = "";
  function add(key, label, color) {
    var b = el("button", atlas.filter === key ? "is-on" : "", label);
    b.style.setProperty("--c", color);
    b.addEventListener("click", function () {
      atlas.filter = key;
      renderAtlasChrome();
      atlasFrameRegion(key);
    });
    bar.appendChild(b);
  }
  add("ALL", "전체", "#2563eb");
  REGIONS.forEach(function (r) { add(r.key, r.short, r.color); });
}

function renderAtlasHotspots() {
  var svg = $("#atlas-map");
  var g = svg && svg.querySelector("#atlas-hotspots");
  var lg = svg && svg.querySelector("#atlas-labels");
  if (!g) return;
  var ns = "http://www.w3.org/2000/svg";
  g.innerHTML = "";
  if (lg) lg.innerHTML = "";
  var scale = atlasScale();
  var rBase = 5.2 / Math.pow(scale, 0.72);
  var showName = scale >= 1.35;
  var showExtra = scale >= 2.4;
  var list = atlasFilteredCities();

  list.forEach(function (c) {
    var known = cityKnown(c.id);
    var found = codexHas(c.id);
    var stamped = stampHas(c.id);
    var sel = atlas.selected === c.id;
    var cx = c.coordinates.x, cy = c.coordinates.y;

    var hit = document.createElementNS(ns, "circle");
    hit.setAttribute("class", "atlas-hs-hit atlas-hs");
    hit.setAttribute("cx", cx); hit.setAttribute("cy", cy);
    hit.setAttribute("r", Math.max(rBase * 2.4, 9 / scale));
    hit.setAttribute("tabindex", "0");
    hit.setAttribute("role", "button");
    hit.setAttribute("aria-label", known ? (c.city + " " + c.country) : (c.regionName + "의 미발견 도시"));
    hit.dataset.city = c.id;
    g.appendChild(hit);

    if (sel) {
      var ring = document.createElementNS(ns, "circle");
      ring.setAttribute("cx", cx); ring.setAttribute("cy", cy);
      ring.setAttribute("r", rBase * 2.2);
      ring.setAttribute("fill", "none");
      ring.setAttribute("stroke", "#2563eb");
      ring.setAttribute("stroke-width", (1.8 / scale).toFixed(2));
      ring.setAttribute("opacity", "0.9");
      g.appendChild(ring);
    }
    if (stamped) {
      var outer = document.createElementNS(ns, "circle");
      outer.setAttribute("cx", cx); outer.setAttribute("cy", cy);
      outer.setAttribute("r", rBase * 1.55);
      outer.setAttribute("fill", "none");
      outer.setAttribute("stroke", "#2563eb");
      outer.setAttribute("stroke-width", (2.2 / scale).toFixed(2));
      g.appendChild(outer);
    }
    var dot = document.createElementNS(ns, "circle");
    dot.setAttribute("cx", cx); dot.setAttribute("cy", cy);
    dot.setAttribute("r", stamped ? rBase * 1.15 : (found ? rBase : rBase * 0.72));
    if (stamped) dot.setAttribute("fill", "#2563eb");
    else if (found) dot.setAttribute("fill", c.continentColor);
    else { dot.setAttribute("fill", "#9aa6b8"); dot.setAttribute("opacity", "0.55"); }
    g.appendChild(dot);

    if (lg && showName && known) {
      var fs = (11 / scale).toFixed(2);
      var sw = Math.max(0.6, 2.4 / scale).toFixed(2);
      var t = document.createElementNS(ns, "text");
      t.setAttribute("class", "wm-label");
      t.setAttribute("x", cx);
      t.setAttribute("y", cy - Math.max(8 / scale, rBase * 2.1));
      t.setAttribute("text-anchor", "middle");
      t.setAttribute("font-size", fs);
      t.setAttribute("stroke-width", sw);
      t.textContent = showExtra ? (c.city + " · " + c.country) : c.city;
      lg.appendChild(t);
      if (showExtra) {
        var ic = document.createElementNS(ns, "text");
        ic.setAttribute("x", cx + Math.max(8 / scale, rBase * 2.4));
        ic.setAttribute("y", cy + 4 / scale);
        ic.setAttribute("font-size", (12 / scale).toFixed(2));
        ic.textContent = c.landmarkIcon;
        lg.appendChild(ic);
      }
    }

    hit.addEventListener("click", function (e) {
      e.stopPropagation();
      selectAtlasCity(c.id);
    });
    hit.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectAtlasCity(c.id); }
    });
    hit.addEventListener("mouseenter", function (e) { showAtlasTip(c, e); });
    hit.addEventListener("mouseleave", hideAtlasTip);
    hit.addEventListener("mousemove", function (e) { showAtlasTip(c, e); });
  });
}

function showAtlasTip(c, e) {
  var tip = $("#atlas-tip");
  var wrap = $("#atlas-map-wrap");
  if (!tip || !wrap) return;
  var known = cityKnown(c.id);
  tip.hidden = false;
  tip.textContent = known ? (c.flag + " " + c.city + " · " + c.country) : (c.regionName + " · 미발견");
  var r = wrap.getBoundingClientRect();
  tip.style.left = (e.clientX - r.left) + "px";
  tip.style.top = (e.clientY - r.top) + "px";
}
function hideAtlasTip() {
  var tip = $("#atlas-tip");
  if (tip) tip.hidden = true;
}

function bindAtlasMap() {
  var wrap = $("#atlas-map-wrap");
  if (!wrap || wrap.dataset.bound === "1") return;
  wrap.dataset.bound = "1";

  wrap.addEventListener("wheel", function (e) {
    if (atlas.view !== "map") return;
    e.preventDefault();
    var p = atlasClientToMap(e.clientX, e.clientY);
    atlasZoomAt(p.x, p.y, e.deltaY > 0 ? 1.18 : 0.84);
  }, { passive: false });

  wrap.addEventListener("dblclick", function (e) {
    if (e.target.closest && e.target.closest(".atlas-hs")) return;
    var p = atlasClientToMap(e.clientX, e.clientY);
    atlasZoomAt(p.x, p.y, 0.72);
  });

  wrap.addEventListener("pointerdown", function (e) {
    if (e.target.closest && (
      e.target.closest(".atlas-hs") ||
      e.target.closest(".atlas-zoom") ||
      e.target.closest(".atlas-region-bar")
    )) return;
    atlas.panning = true;
    atlas.pan = { x: e.clientX, y: e.clientY, vx: atlas.vb.x, vy: atlas.vb.y };
    wrap.classList.add("is-panning");
    try { wrap.setPointerCapture(e.pointerId); } catch (err) {}
  });
  wrap.addEventListener("pointermove", function (e) {
    if (!atlas.panning || !atlas.pan) return;
    var svg = $("#atlas-map");
    if (!svg) return;
    var r = svg.getBoundingClientRect();
    var dx = (e.clientX - atlas.pan.x) / r.width * atlas.vb.w;
    var dy = (e.clientY - atlas.pan.y) / r.height * atlas.vb.h;
    atlas.vb.x = atlas.pan.vx - dx;
    atlas.vb.y = atlas.pan.vy - dy;
    clampAtlasView();
    applyAtlasViewBox();
  });
  function endPan() {
    atlas.panning = false; atlas.pan = null;
    wrap.classList.remove("is-panning");
  }
  wrap.addEventListener("pointerup", endPan);
  wrap.addEventListener("pointercancel", endPan);

  wrap.addEventListener("touchstart", function (e) {
    if (e.touches.length === 2) {
      atlas.panning = false;
      var a = e.touches[0], b = e.touches[1];
      atlas.pinch = {
        dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
        mid: atlasClientToMap((a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2)
      };
    }
  }, { passive: true });
  wrap.addEventListener("touchmove", function (e) {
    if (e.touches.length === 2 && atlas.pinch) {
      e.preventDefault();
      var a = e.touches[0], b = e.touches[1];
      var dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      var factor = atlas.pinch.dist / dist;
      atlas.pinch.dist = dist;
      atlasZoomAt(atlas.pinch.mid.x, atlas.pinch.mid.y, factor);
    }
  }, { passive: false });
  wrap.addEventListener("touchend", function () { atlas.pinch = null; });
}

function selectAtlasCity(id) {
  var c = getCity(id);
  if (!c) return;
  if (!cityKnown(id)) {
    toast("아직 발견하지 않은 도시입니다. 선생님 설정에서 잠금을 끄면 미리 볼 수 있어요.", "bad");
    return;
  }
  atlas.selected = id;
  atlas.tab = "nature";
  atlas.imgIdx = 0;
  Sound.play("click");
  renderAtlasHotspots();
  renderAtlasList();
  openAtlasCityModal(c);
}

function renderAtlasList() {
  var grid = $("#atlas-grid");
  if (!grid || atlas.view !== "list") return;
  grid.innerHTML = "";
  var list = atlasFilteredCities();
  if (!list.length) {
    grid.innerHTML = "<p class='hint'>조건에 맞는 도시가 없습니다.</p>";
    return;
  }
  list.forEach(function (c) {
    var known = cityKnown(c.id);
    var found = codexHas(c.id);
    var stamped = stampHas(c.id);
    var st = cityStats(c);
    var item = el("button", "codex-item" + (known ? "" : " is-locked") + (atlas.selected === c.id ? " is-on" : ""));
    var statLine = known && st.population
      ? "<div class='cc cc-stat'>인구 " + fmtPop(st.population) + " · 해발 " + st.elevation + "m</div>"
      : "";
    item.innerHTML =
      "<div class='codex-thumb' style='--c:" + c.continentColor + "'>" +
        (known ? "<img alt='' src='" + landmarkSrc(c) + "'>" : "") +
        "<span class='cflag'>" + (known ? c.flag : "❔") + "</span>" +
        (known ? "" : "❔") +
      "</div>" +
      "<div class='codex-meta'>" +
        "<div class='cn'>" + (known ? esc(c.city) : "???") + (stamped ? " ✹" : "") + "</div>" +
        "<div class='cc'>" + (known ? esc(c.country) : esc(c.regionName)) + "</div>" +
        statLine +
      "</div>";
    item.addEventListener("click", function () {
      if (!known) {
        Sound.play("click");
        toast("아직 발견하지 않은 도시입니다. 게임에서 방문해 보세요!", "bad");
        return;
      }
      selectAtlasCity(c.id);
    });
    grid.appendChild(item);
  });
}

function atlasRelatedHTML(c) {
  var related = (c.related || []).filter(function (id) { return cityKnown(id); });
  if (!related.length) return "";
  return "<div class='atlas-related'><span class='ar-label'>비교 추천</span>" +
    related.map(function (id) {
      var rc = getCity(id);
      return rc ? "<button type='button' class='chip atlas-related-btn' data-city='" + id + "'>" +
        rc.flag + " " + esc(rc.city) + "</button>" : "";
    }).join("") + "</div>";
}

function openAtlasCityModal(c) {
  if (!c || !cityKnown(c.id)) return;
  atlas.selected = c.id;
  if (!atlas.tab || atlas.tab === "overview") atlas.tab = "nature";
  var stamped = stampHas(c.id);
  var m = openModal({
    eyebrow: "CITY DASHBOARD · " + c.country + " · " + c.regionName,
    title: c.flag + " " + esc(c.city) +
      (stamped ? " <span class='atlas-stamp-mark'>스탬프 획득</span>" : "") +
      " <span style='font-weight:600;font-size:.82rem;opacity:.75'>" + esc(c.landmark) + "</span>",
    body: atlasRelatedHTML(c) + cityDashboardHTML(c, {
      tab: atlas.tab,
      extraTabs: [{ k: "mission", t: "미션" }]
    }),
    buttons: [
      { label: "⚖ 비교하기", cls: "btn-light", act: function () { openCompare([c.id]); } },
      { label: "닫기", cls: "btn-navy", act: function () { closeModal(); } }
    ],
    size: "city",
    autofocus: false
  });
  mountCityImages(m);
  mountCityLocator(m, c);
  bindCityDashTabs(m, c, {
    tab: atlas.tab,
    onTab: function (tab) { atlas.tab = tab; }
  });
  $$(".atlas-related-btn", m).forEach(function (b) {
    b.addEventListener("click", function () {
      openCompare([c.id, b.getAttribute("data-city")]);
    });
  });
  return m;
}

function renderAtlasPanel() {
  var c = atlas.selected ? getCity(atlas.selected) : null;
  if (!c || !cityKnown(c.id) || !modalOpen) return;
  var root = document.querySelector("#modal-root .modal.city");
  var body = root && root.querySelector("#cd-tab-body");
  if (body && atlas.tab === "mission") {
    body.innerHTML = cityDashTabHTML(c, "mission");
    bindAtlasMission(root, c);
    return;
  }
  openAtlasCityModal(c);
}

function grantAtlasStamp(c) {
  if (stampHas(c.id)) {
    openAtlasCityModal(c);
    renderCoverStats();
    renderHeroMap();
    return;
  }
  stampAdd(c.id);
  codexAdd(c.id);
  if (game && game.stamped.indexOf(c.id) === -1) game.stamped.push(c.id);
  Sound.play("stamp");
  confetti(36);
  toast(c.city + " 랜드마크 스탬프!", "good");
  if (game) addLog("🗺️ 트레일 맵 · " + esc(c.city) + " 스탬프 획득", "good");
  openAtlasCityModal(c);
  renderCoverStats();
  if (game) {
    refreshBoardMarks();
    updateWorldMap();
    renderStampStrip();
    updateStats("stamp");
    checkGoals();
    saveGame();
  }
}

function openCompare(prefill) {
  if (prefill && prefill.length) {
    compare.slots = prefill.slice(0, 3).concat([null, null, null]).slice(0, 3);
  } else if (atlas.selected) {
    compare.slots = [atlas.selected, null, null];
  }
  renderCompare();
  showScreen("screen-compare", true);
}

function compareSelectedCities() {
  return compare.slots.map(function (id) { return id ? getCity(id) : null; }).filter(Boolean);
}

function renderCompare() {
  var picks = $("#compare-picks");
  var body = $("#compare-body");
  if (!picks || !body) return;

  picks.innerHTML = "";
  compare.slots.forEach(function (slotId, si) {
    var box = el("div", "compare-slot");
    box.innerHTML = "<label class='compare-slot-label'>도시 " + (si + 1) + "</label>";
    var sel = el("select", "input compare-select");
    sel.innerHTML = "<option value=''>— 선택 —</option>";
    CITIES.forEach(function (c) {
      if (!cityKnown(c.id)) return;
      var opt = el("option", "", c.flag + " " + c.city + " (" + c.country + ")");
      opt.value = c.id;
      if (slotId === c.id) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener("change", function () {
      compare.slots[si] = sel.value || null;
      renderCompare();
    });
    box.appendChild(sel);
    picks.appendChild(box);
  });

  var cities = compareSelectedCities();
  if (!cities.length) {
    body.innerHTML = "<div class='compare-empty'><span>⚖</span><b>2~3개 도시를 선택하세요</b>인구·해발·기후를 나란히 비교할 수 있습니다.</div>";
    return;
  }

  var rows = [
    { k: "인구", fn: function (c) { return fmtPop(cityStats(c).population); } },
    { k: "해발", fn: function (c) { return cityStats(c).elevation + " m"; } },
    { k: "기후대", fn: function (c) { return cityStats(c).climateZone || "—"; } },
    { k: "1월 기온", fn: function (c) { var t = cityStats(c).tempJan; return t != null ? t + "°C" : "—"; } },
    { k: "7월 기온", fn: function (c) { var t = cityStats(c).tempJul; return t != null ? t + "°C" : "—"; } },
    { k: "연간 강수", fn: function (c) { var r = cityStats(c).annualRain; return r != null ? r + " mm" : "—"; } },
    { k: "도시 기능", fn: function (c) { return (c.functions || []).join(", ") || "—"; } },
    { k: "권역", fn: function (c) { return c.regionName; } }
  ];

  var table = "<div class='compare-table-wrap'><table class='compare-table'><thead><tr><th>항목</th>";
  cities.forEach(function (c) {
    table += "<th><span class='ct-flag'>" + c.flag + "</span> " + esc(c.city) + "</th>";
  });
  table += "</tr></thead><tbody>";
  rows.forEach(function (row) {
    table += "<tr><th>" + row.k + "</th>";
    cities.forEach(function (c) { table += "<td>" + esc(row.fn(c)) + "</td>"; });
    table += "</tr>";
  });
  table += "</tbody></table></div>";

  body.innerHTML = table + climateChartHTML(cities);
}

function onAtlasQuizCorrect(c, qi) {
  var prog = atlasQuizDone[c.id] || [];
  prog[qi] = true;
  atlasQuizDone[c.id] = prog;
  saveAtlasQuizDone();
  var allDone = (c.quiz || []).every(function (_, i) { return prog[i]; });
  if (allDone) grantAtlasStamp(c);
  else renderAtlasPanel();
}
function atlasZoomOut() { atlasZoomAt(atlas.vb.x + atlas.vb.w / 2, atlas.vb.y + atlas.vb.h / 2, 1.22); }
function atlasZoomReset() { atlas.filter = "ALL"; atlas.vb = { x: 0, y: 0, w: MAP_VIEW.w, h: MAP_VIEW.h }; renderAtlasChrome(); applyAtlasViewBox(); }

/* ---------------------------- 나의 여권 ---------------------------- */
function openPassport() {
  var st = collectStats();
  var p = getProfile();
  $("#passport-summary").innerHTML =
    "<span class='big'>" + st.stamps + "</span><span>/ " + st.total + "개 스탬프</span>" +
    "<span class='chip'>발견 " + st.found + "곳</span>" +
    "<span class='chip'>누적 플레이 " + p.playCount + "회</span>";
  var body = $("#passport-body");
  var html = "<div class='profile-stats'>" +
    "<div class='profile-stat'><div class='pk'>최고 점수</div><div class='pv'>" + p.bestScore + "</div></div>" +
    "<div class='profile-stat'><div class='pk'>최다 스탬프</div><div class='pv'>" + p.bestStamps + "</div></div>" +
    "<div class='profile-stat'><div class='pk'>최다 권역 완성</div><div class='pv'>" + p.bestRegions + "</div></div>" +
    "<div class='profile-stat'><div class='pk'>완주 횟수</div><div class='pv'>" + p.gamesFinished + "</div></div>" +
    "</div>";
  html += "<p class='hint' style='margin-bottom:14px'>게임·트레일 맵 미션에서 받은 스탬프가 같은 트레일 로그에 쌓입니다. 도시를 누르면 트레일 맵으로 이동합니다.</p>";
  html += "<div class='passport-grid'>";
  CITIES.forEach(function (c) {
    var found = codexHas(c.id);
    var stamped = stampHas(c.id);
    var known = cityKnown(c.id);
    var cls = "passport-cell" + (stamped ? " is-stamp" : (found ? " is-found" : "")) + (known ? "" : " is-locked");
    html += "<button type='button' class='" + cls + "' style='--c:" + c.continentColor + "' data-city='" + c.id + "'>" +
      "<div class='pc-node'>" +
        (known
          ? "<img class='pc-photo' alt='' src='" + landmarkSrc(c) + "'>"
          : "<span class='pc-fallback'>❔</span>") +
        (stamped ? "<img class='pc-stamp-mark' alt='스탬프' src='assets/brand/beaver-scholar.png'>" : "") +
      "</div>" +
      "<div class='pc-n'>" + (known ? esc(c.city) : "???") + "</div>" +
      "<div class='pc-c'>" + (stamped ? "스탬프" : (found ? "발견" : esc(c.regionName))) + "</div></button>";
  });
  html += "</div>";
  body.innerHTML = html;
  $$(".pc-photo", body).forEach(function (img) {
    img.addEventListener("error", function () {
      var fb = el("span", "pc-fallback", "🏙️");
      if (img.parentNode) img.parentNode.replaceChild(fb, img);
    });
  });
  $$("[data-city]", body).forEach(function (b) {
    b.addEventListener("click", function () {
      Sound.play("click");
      var id = b.getAttribute("data-city");
      if (!cityKnown(id)) { toast("아직 발견하지 않은 도시입니다.", "bad"); return; }
      openAtlas({ view: "map", cityId: id });
    });
  });
  showScreen("screen-passport", true);
  maybeStartScreenTutorial("passport");
}

/* ---------------------------- 관리실 ---------------------------- */
function openOffice() {
  openModal({
    eyebrow: "OFFICE",
    title: "관리실",
    size: "sheet",
    body: "",
    autofocus: false,
    buttons: [{ label: "닫기", cls: "btn-light", act: function () { closeModal(); } }],
    mount: function (body) {
      var sheet = $("#office-sheet");
      if (sheet) body.appendChild(sheet);
    }
  });
  renderOffice();
}
function officeReadForm() {
  return {
    role: (getUser().role === "teacher" ? "teacher" : "student"),
    school: ($("#office-school") && $("#office-school").value || "").trim(),
    name: ($("#office-name") && $("#office-name").value || "").trim(),
    grade: ($("#office-grade") && $("#office-grade").value || "").trim(),
    klass: ($("#office-class") && $("#office-class").value || "").trim()
  };
}
function renderOfficeRoleSeg() {
  var wrap = $("#office-role-seg");
  if (!wrap) return;
  var u = getUser();
  wrap.innerHTML = "";
  [{ t: "학생", v: "student" }, { t: "교사", v: "teacher" }].forEach(function (o) {
    var b = el("button", u.role === o.v ? "is-on" : "", o.t);
    b.addEventListener("click", function () {
      var cur = officeReadForm();
      cur.role = o.v;
      saveUser(cur);
      Sound.play("click");
      renderOffice();
    });
    wrap.appendChild(b);
  });
}
function renderOffice() {
  var u = getUser();
  if ($("#office-school")) $("#office-school").value = u.school || "";
  if ($("#office-name")) $("#office-name").value = u.name || "";
  if ($("#office-grade")) $("#office-grade").value = u.grade || "";
  if ($("#office-class")) $("#office-class").value = u.klass || "";
  renderOfficeRoleSeg();
  syncAudioUI();
  var tools = $("#office-teacher-tools");
  if (tools) tools.hidden = u.role !== "teacher";
  var st = collectStats();
  var p = getProfile();
  var saved = loadGame();
  var box = $("#office-stats");
  if (box) {
    box.innerHTML =
      "<div class='profile-stat'><div class='pk'>발견 도시</div><div class='pv'>" + st.found + "<small> / " + st.total + "</small></div></div>" +
      "<div class='profile-stat'><div class='pk'>스탬프</div><div class='pv'>" + st.stamps + "<small> / " + st.total + "</small></div></div>" +
      "<div class='profile-stat'><div class='pk'>완주 횟수</div><div class='pv'>" + p.gamesFinished + "</div></div>" +
      "<div class='profile-stat'><div class='pk'>진행 중 게임</div><div class='pv'>" + (saved && !saved.finished ? "있음" : "없음") + "</div></div>";
  }
}
function saveOfficeForm() {
  var u = officeReadForm();
  saveUser(u);
  toast("이용자 정보를 이 기기에 저장했습니다.", "good");
  renderOffice();
}
function exportLearningBundle() {
  var payload = {
    app: APP.name,
    version: APP.version,
    exportedAt: nowStr(),
    user: getUser(),
    profile: getProfile(),
    stamps: stampSet,
    discovered: codexSet,
    results: Store.get(LS.results, []),
    save: loadGame()
  };
  var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "URBAN_TRAIL_학습기록.json";
  document.body.appendChild(a);
  a.click();
  window.setTimeout(function () {
    URL.revokeObjectURL(a.href);
    if (a.parentNode) a.parentNode.removeChild(a);
  }, 400);
  toast("학습 기록을 파일로 저장했습니다.", "good");
}
function resetLearningRecords() {
  Store.remove(LS.save); Store.remove(LS.results);
  Store.remove(LS.codex); Store.remove(LS.stamps);
  Store.remove(LS.profile); Store.remove(LS.atlasQuiz);
  codexSet = []; stampSet = []; atlasQuizDone = {};
  saveProfile(Object.assign({}, DEFAULT_PROFILE));
  game = null;
  clearSaveFlagRefresh();
  renderCoverStats();
  renderHeroMap();
  renderOffice();
  toast("학습 기록을 초기화했습니다. 이용자 정보는 그대로입니다.", "good");
}
function resetAllDeviceData() {
  Store.remove(LS.settings); Store.remove(LS.save); Store.remove(LS.groups);
  Store.remove(LS.results); Store.remove(LS.codex); Store.remove(LS.stamps);
  Store.remove(LS.profile); Store.remove(LS.atlasQuiz);
  Store.remove(LS.tutorial); Store.remove(LS.tutorials); Store.remove(LS.user);
  settings = Object.assign({}, DEFAULT_SETTINGS);
  codexSet = []; stampSet = []; atlasQuizDone = {};
  game = null;
  saveSettings();
  syncAudioUI();
  clearSaveFlagRefresh();
  renderCoverStats();
  renderHeroMap();
  renderOffice();
  toast("모든 데이터를 초기화했습니다.", "good");
}

/* ---------------------------- 선생님 메뉴 (PIN) ---------------------------- */
var TEACHER_SESSION_KEY = "urbanTrail.teacherUnlocked";

function isTeacherUnlocked() {
  try { return sessionStorage.getItem(TEACHER_SESSION_KEY) === "1"; } catch (e) { return false; }
}
function unlockTeacher() {
  try { sessionStorage.setItem(TEACHER_SESSION_KEY, "1"); } catch (e) {}
  document.body.classList.add("is-teacher-unlocked");
}
function teacherPinValue() {
  var pin = (settings.teacherPin || DEFAULT_SETTINGS.teacherPin || "1234") + "";
  return pin.trim() || "1234";
}

function requireTeacherAccess(onOk) {
  if (isTeacherUnlocked()) { onOk(); return; }
  openTeacherPinModal(onOk);
}

function openTeacherPinModal(onOk) {
  openModal({
    title: "선생님 확인",
    eyebrow: "TEACHER",
    size: "narrow",
    body: "<p style='font-size:.9rem;line-height:1.65;color:var(--ink-700);margin-bottom:12px'>" +
      "선생님용 메뉴입니다. PIN을 입력하세요. (기본값 <b>1234</b>, 선생님 설정에서 변경 가능)</p>" +
      "<input type='password' id='teacher-pin-input' class='input' maxlength='12' placeholder='PIN 입력' autocomplete='off' inputmode='numeric'>",
    buttons: [
      { label: "취소", cls: "btn-light", act: function () { closeModal(); } },
      { label: "확인", cls: "btn-navy", id: "teacher-pin-ok", act: function () {
        submitTeacherPin(onOk);
      } }
    ]
  });
  window.setTimeout(function () {
    var input = $("#teacher-pin-input");
    if (!input) return;
    try { input.focus(); } catch (e) {}
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        submitTeacherPin(onOk);
      }
    });
  }, 80);
}

function submitTeacherPin(onOk) {
  var input = $("#teacher-pin-input");
  var pin = input ? input.value.trim() : "";
  if (pin === teacherPinValue()) {
    unlockTeacher();
    closeModal();
    onOk();
  } else {
    toast("PIN이 맞지 않습니다.", "bad");
    if (input) { input.value = ""; input.focus(); }
  }
}

function openStudentGuide() { openGuideModal("student"); }
function openTeacherGuide() { openGuideModal("teacher"); }
function openGuide() { openGuideModal("student"); }

var guideTab = "student";
function bindGuideSheet() {
  var sheet = $("#guide-sheet");
  if (!sheet || sheet.getAttribute("data-bound") === "1") return;
  sheet.setAttribute("data-bound", "1");
  sheet.addEventListener("click", function (e) {
    var tab = e.target.closest("[data-guide-tab]");
    if (!tab) return;
    Sound.play("click");
    setGuideTab(tab.getAttribute("data-guide-tab"));
  });
}
function setGuideTab(kind) {
  guideTab = kind === "teacher" ? "teacher" : "student";
  var student = $("#guide-pane-student");
  var teacher = $("#guide-pane-teacher");
  if (student) student.hidden = guideTab !== "student";
  if (teacher) teacher.hidden = guideTab !== "teacher";
  $$("[data-guide-tab]").forEach(function (b) {
    var on = b.getAttribute("data-guide-tab") === guideTab;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-selected", on ? "true" : "false");
  });
  var head = document.querySelector("#modal-root .modal.sheet .modal-head");
  if (head) {
    var eye = head.querySelector(".eyebrow");
    var h3 = head.querySelector("h3");
    if (eye) eye.textContent = guideTab === "teacher" ? "TEACHER GUIDE" : "STUDENT GUIDE";
    if (h3) h3.textContent = guideTab === "teacher" ? "교사용 가이드" : "학생용 가이드";
  }
}
function openGuideModal(kind) {
  openModal({
    eyebrow: kind === "teacher" ? "TEACHER GUIDE" : "STUDENT GUIDE",
    title: kind === "teacher" ? "교사용 가이드" : "학생용 가이드",
    size: "sheet",
    body: "",
    autofocus: false,
    buttons: [{ label: "닫기", cls: "btn-light", act: function () { closeModal(); } }],
    mount: function (body) {
      var sheet = $("#guide-sheet");
      if (sheet) body.appendChild(sheet);
    }
  });
  bindGuideSheet();
  setGuideTab(kind || "student");
}

function printTeacherGuide() {
  var wasOpen = !!document.querySelector("#modal-root .modal.sheet #guide-sheet");
  closeModal(true);
  setGuideTab("teacher");
  document.body.classList.add("is-print-guide");
  var prevTitle = document.title;
  document.title = "URBAN_TRAIL_프로그램_가이드";
  window.setTimeout(function () {
    window.print();
    document.title = prevTitle;
    document.body.classList.remove("is-print-guide");
    if (wasOpen) openGuideModal("teacher");
  }, 80);
}

function openTeacherHub() {
  openTeacherGuide();
}

function toggleLinksMore() {
  openTeacherGuide();
}

/* ---------------------------- 선생님 설정 ---------------------------- */
function openTeacher() {
  renderTeacher();
  showScreen("screen-teacher");
}

function settingRow(title, sub, ctlNode) {
  var row = el("div", "set-row");
  row.innerHTML = "<div><div class='st'>" + title + "</div><div class='ss'>" + sub + "</div></div>";
  var ctl = el("div", "set-ctl");
  ctl.appendChild(ctlNode);
  row.appendChild(ctl);
  return row;
}

function makeSwitch(checked, onChange) {
  var label = el("label", "switch on-light");
  label.innerHTML = "<input type='checkbox'" + (checked ? " checked" : "") +
    "><span class='switch-track'><span class='switch-thumb'></span></span>";
  label.querySelector("input").addEventListener("change", function (e) {
    Sound.play("click");
    onChange(e.target.checked);
  });
  return label;
}

function makeSeg(options, value, onChange) {
  var seg = el("div", "seg");
  options.forEach(function (o) {
    var b = el("button", o.v === value ? "is-on" : "", esc(o.t));
    b.addEventListener("click", function () {
      Sound.play("click");
      onChange(o.v);
    });
    seg.appendChild(b);
  });
  return seg;
}

function renderTeacher() {
  var wrap = $("#teacher-settings");
  wrap.innerHTML = "";

  wrap.appendChild(settingRow(
    "기본 플레이 시간 모드",
    "새 게임을 시작할 때 처음 선택되어 있는 모드입니다. 학생은 설정 화면에서 바꿀 수 있습니다.",
    makeSeg(MODES.map(function (m) { return { t: m.name + " (" + m.turns + "턴)", v: m.key }; }),
      settings.defaultMode, function (v) { settings.defaultMode = v; saveSettings(); renderTeacher(); })
  ));

  wrap.appendChild(settingRow(
    "미션 오답 시 재도전 허용",
    "끄면 한 번의 기회만 주어집니다. 학기 초 흥미 유발이 목적이라면 켜 두는 것을 권장합니다.",
    makeSwitch(settings.quizRetry, function (v) { settings.quizRetry = v; saveSettings(); })
  ));

  wrap.appendChild(settingRow(
    "재도전 힌트 제공",
    "재도전할 때 도시 학습 대시보드의 핵심 키워드를 힌트로 보여 줍니다.",
    makeSwitch(settings.showHint, function (v) { settings.showHint = v; saveSettings(); })
  ));

  wrap.appendChild(settingRow(
    "특별 칸 이벤트 사용",
    "끄면 특별 칸에 도착해도 카드·퀴즈 없이 소액의 점수만 얻고 지나갑니다. 시간이 부족할 때 사용하세요.",
    makeSwitch(settings.useSpecials, function (v) { settings.useSpecials = v; saveSettings(); })
  ));

  wrap.appendChild(settingRow(
    "말 이동 애니메이션 속도",
    "수업 시간이 빠듯하면 '빠름'으로 설정하세요.",
    makeSeg([{ t: "느림", v: "slow" }, { t: "보통", v: "normal" }, { t: "빠름", v: "fast" }],
      settings.animSpeed, function (v) {
        settings.animSpeed = v; saveSettings(); updateBoardScale(); renderTeacher();
      })
  ));

  wrap.appendChild(settingRow(
    "도시 도감 전체 공개",
    "켜면 48개 도시를 모두 발견한 것으로 표시합니다. 사전 학습이나 발표 자료 준비에 활용하세요.",
    makeSwitch(settings.codexUnlockAll, function (v) { settings.codexUnlockAll = v; saveSettings(); })
  ));

  wrap.appendChild(settingRow(
    "미발견 도시 잠금",
    "켜면 게임에서 아직 만나지 않은 도시는 아틀라스에서 열 수 없습니다. 수집 동기를 강조할 때 사용하세요. 기본은 꺼져 있어 48개 도시를 자료집으로 쓸 수 있습니다.",
    makeSwitch(settings.lockUndiscovered, function (v) { settings.lockUndiscovered = v; saveSettings(); })
  ));

  wrap.appendChild(settingRow(
    "외부 이미지 불러오기",
    "도시 데이터에 적힌 외부 URL 이미지를 허용합니다. 학교망이 막혀 있으면 끄세요. 끄면 이 폴더의 로컬 파일과 대체 카드만 사용합니다.",
    makeSwitch(settings.allowExternalImages, function (v) { settings.allowExternalImages = v; saveSettings(); })
  ));

  var sessionInput = el("input", "input");
  sessionInput.type = "text";
  sessionInput.maxLength = 24;
  sessionInput.placeholder = "예) 0817-3반";
  sessionInput.value = settings.sessionCode || "";
  sessionInput.style.maxWidth = "180px";
  sessionInput.addEventListener("input", function () {
    settings.sessionCode = sessionInput.value.trim();
    saveSettings();
  });
  wrap.appendChild(settingRow(
    "세션 코드",
    "결과 요약 코드 앞에 붙습니다. 반·차시별로 구분할 때 사용합니다.",
    sessionInput
  ));

  var soundBox = el("div", "");
  soundBox.style.display = "flex";
  soundBox.style.gap = "10px";
  soundBox.appendChild(makeSeg([{ t: "효과음 켬", v: true }, { t: "끔", v: false }],
    settings.sfx, function (v) { settings.sfx = v; saveSettings(); syncAudioUI(); renderTeacher(); }));
  wrap.appendChild(settingRow("효과음", "주사위·정답·스탬프 효과음을 켜고 끕니다. 음량은 관리실에서 조절합니다.", soundBox));

  /* 데이터 관리 */
  var dataBox = el("div", "");
  dataBox.style.display = "flex";
  dataBox.style.gap = "8px";
  dataBox.style.flexWrap = "wrap";

  var b1 = el("button", "btn btn-light btn-sm", "저장된 게임 삭제");
  b1.addEventListener("click", function () {
    confirmDialog("저장된 게임 삭제", "진행 중이던 게임 기록을 삭제할까요? 되돌릴 수 없습니다.", function () {
      clearSave(); clearSaveFlagRefresh(); toast("저장된 게임을 삭제했습니다.", "good");
    }, "삭제");
  });
  var b2 = el("button", "btn btn-light btn-sm", "여행 기록 전체 삭제");
  b2.addEventListener("click", function () {
    confirmDialog("여행 기록 삭제", "이 기기에 저장된 모든 여행 결과를 삭제할까요?", function () {
      Store.remove(LS.results); toast("여행 기록을 삭제했습니다.", "good");
    }, "삭제");
  });
  var b3 = el("button", "btn btn-danger btn-sm", "전체 초기화");
  b3.addEventListener("click", function () {
    confirmDialog("전체 초기화", "설정·도감·팀 정보·결과를 모두 삭제하고 처음 상태로 되돌립니다.", function () {
      Store.remove(LS.settings); Store.remove(LS.save); Store.remove(LS.groups);
      Store.remove(LS.results); Store.remove(LS.codex); Store.remove(LS.stamps);
      Store.remove(LS.profile); Store.remove(LS.atlasQuiz);
      settings = Object.assign({}, DEFAULT_SETTINGS);
      codexSet = [];
      stampSet = [];
      atlasQuizDone = {};
      saveSettings(); syncAudioUI(); renderTeacher(); clearSaveFlagRefresh();
      renderCoverStats();
    renderHeroMap();
      toast("모든 데이터를 초기화했습니다.", "good");
    }, "초기화");
  });
  dataBox.appendChild(b1); dataBox.appendChild(b2);
  var b4 = el("button", "btn btn-light btn-sm", "기록 JSON 내보내기");
  b4.addEventListener("click", function () { exportResultsJson(); });
  dataBox.appendChild(b4);
  dataBox.appendChild(b3);
  wrap.appendChild(settingRow("데이터 관리",
    "모든 정보는 이 기기의 브라우저 저장소에만 보관되며 외부로 전송되지 않습니다.", dataBox));
}

/* ---------------------------- 이 기기 여행 기록 ---------------------------- */
function openResults() {
  renderResultsScreen();
}

function renderResultsScreen() {
  var list = Store.get(LS.results, []);
  var body = $("#results-body");
  if (!list.length) {
    body.innerHTML = "<p class='hint'>아직 이 기기에 저장된 결과가 없습니다. 학생이 여행을 마친 뒤 " +
      "<b>제출용 PDF 저장</b> 또는 <b>이 기기에 결과 저장</b>을 누르면 여기에 기록됩니다.<br><br>" +
      "※ 다른 태블릿의 결과는 자동으로 모이지 않습니다. PDF 제출을 권장합니다.</p>";
    showScreen("screen-results");
    return;
  }
  var sorted = list.slice().sort(function (a, b) { return b.score - a.score; });
  var html = "<p class='hint' style='margin-bottom:14px'>이 태블릿에 저장된 기록만 표시됩니다. " +
    "반 전체 비교는 학생이 제출한 PDF를 확인하세요.</p>";
  html += "<div class='table-scroll'><table class='compare-table'><thead><tr>" +
    "<th>순위</th><th>학급</th><th>팀</th><th>팀원</th><th class='num'>점수</th>" +
    "<th class='num'>스탬프</th><th class='num'>권역</th><th>등급</th><th>일시</th></tr></thead><tbody>";
  sorted.forEach(function (r, i) {
    html += "<tr>" +
      "<td>" + (i + 1) + "</td>" +
      "<td>" + esc(r.klass) + "</td>" +
      "<td><b>" + esc(r.name) + "</b> " + tokenOf(r.token).emoji + "</td>" +
      "<td style='font-size:.8rem;color:var(--ink-500)'>" + esc((r.members || []).join(", ")) + "</td>" +
      "<td class='num'>" + r.score + "</td>" +
      "<td class='num'>" + (r.stamps ? r.stamps.length : 0) + "</td>" +
      "<td class='num'>" + (r.regions || 0) + "</td>" +
      "<td>" + esc(r.rank || "") + "</td>" +
      "<td style='font-size:.78rem;color:var(--ink-500)'>" + esc(r.date) + "</td>" +
      "</tr>";
  });
  html += "</tbody></table></div>";

  /* 학급 전체가 모은 도시 */
  var union = {};
  list.forEach(function (r) { (r.stamps || []).forEach(function (id) { union[id] = (union[id] || 0) + 1; }); });
  var ids = Object.keys(union).sort(function (a, b) { return union[b] - union[a]; });
  html += "<h3 class='sec-title' style='color:var(--navy-800)'>🌍 이 기기에서 모은 도시 (" + ids.length + "곳)</h3>";
  if (ids.length) {
    html += stampsGroupedHTML(ids, function (c) { return union[c.id] + "번 저장"; });
  }

  html += "<div class='report-actions no-print' style='justify-content:flex-start'>" +
    "<button class='btn btn-light' id='btn-print-results'>🖨️ 인쇄 / PDF</button>" +
    "<button class='btn btn-light' id='btn-copy-results'>📋 표 복사</button></div>";

  body.innerHTML = html;

  $("#btn-print-results").addEventListener("click", function () { window.print(); });
  $("#btn-copy-results").addEventListener("click", function () {
    var lines = ["순위\t학급\t팀\t점수\t스탬프\t권역\t등급"];
    sorted.forEach(function (r, i) {
      lines.push([i + 1, r.klass, r.name, r.score, (r.stamps || []).length, r.regions || 0, r.rank].join("\t"));
    });
    var text = lines.join("\n");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast("표를 복사했어요.", "good"); });
    } else { toast("복사를 지원하지 않는 브라우저입니다.", "bad"); }
  });

  showScreen("screen-results");
}

/* =========================================================================
 * [N-1] 시작 화면 튜토리얼
 * ========================================================================= */

var HOME_TUTORIAL_STEPS = [
  {
    target: null,
    title: "URBAN TRAIL에 오신 것을 환영합니다",
    body: "처음 사용하는 분을 위해 주요 버튼을 하나씩 안내합니다. 아래 <b>다음</b>을 눌러 시작하세요."
  },
  {
    target: "[data-tutorial='hero-map']",
    title: "세계 도시 지도",
    body: "48개 도시가 세계 지도 위에 표시됩니다. 발견한 도시와 스탬프를 받은 도시는 색과 크기로 구분됩니다."
  },
  {
    target: "[data-tutorial='stats']",
    title: "나의 진행 현황",
    body: "게임·트레일 맵에서 쌓인 <b>발견 도시</b>와 <b>랜드마크 스탬프</b> 진행률을 한눈에 볼 수 있습니다."
  },
  {
    target: "[data-tutorial='nav-atlas']",
    title: "트레일 맵 (상단 메뉴)",
    body: "어느 화면에서든 눌러 <b>트레일 맵</b>으로 이동합니다. 도시를 누르면 게임과 같은 <b>도시 학습 대시보드</b>로 자연·인문·이야기·미션을 학습할 수 있어요."
  },
  {
    target: "[data-tutorial='nav-play']",
    title: "어반 런 (상단 메뉴)",
    body: "보드게임을 시작합니다. 이미 여행 중이면 그 화면으로 돌아갑니다."
  },
  {
    target: "[data-tutorial='nav-passport']",
    title: "트레일 로그 (상단 메뉴)",
    body: "게임·트레일 맵에서 모은 스탬프와 발견 기록을 확인합니다. 도시를 누르면 트레일 맵으로 이동합니다."
  },
  {
    target: "[data-tutorial='office']",
    title: "관리실",
    body: "이용자 정보와 효과음이 여기에 있습니다. 누르면 상세 창이 열리고, 수업 기기마다 따로 저장됩니다."
  },
  {
    target: "[data-tutorial='guide-hub']",
    title: "가이드",
    body: "학생용 가이드와 교사용 가이드가 한 창에 있습니다. 위쪽 탭에서 원하는 안내를 고르세요."
  },
  {
    target: "[data-tutorial='guide-tutorial']",
    title: "튜토리얼",
    body: "이 버튼을 다시 누르면 지금처럼 주요 버튼을 하나씩 안내받을 수 있습니다."
  },
  {
    target: "[data-tutorial='route-explore']",
    title: "트레일 맵 카드",
    body: "홈 화면에서도 트레일 맵으로 바로 갈 수 있습니다. 도시를 누르면 도시 학습 대시보드가 열리고, 목록 보기·도시 비교도 활용할 수 있어요."
  },
  {
    target: "[data-tutorial='route-play']",
    title: "어반 런 카드",
    body: "보드게임으로 이동합니다. 상단 메뉴와 같은 기능이에요."
  },
  {
    target: "[data-tutorial='route-collect']",
    title: "트레일 로그 카드",
    body: "스탬프와 발견 도시를 모아 둔 기록장입니다. 권역별로 얼마나 채웠는지 확인할 수 있습니다."
  },
  {
    target: null,
    title: "안내를 마쳤습니다",
    body: "이제 원하는 버튼을 눌러 여행을 시작해 보세요. 다시 보고 싶으면 홈의 <b>💡 튜토리얼</b>을 누르세요."
  }
];

var ATLAS_TUTORIAL_STEPS = [
  {
    target: null,
    title: "트레일 맵에 오신 것을 환영합니다",
    body: "세계 지도에서 48개 도시를 탐험하는 화면입니다. <b>다음</b>을 눌러 주요 버튼을 살펴보세요."
  },
  {
    target: "[data-tutorial='atlas-map']",
    title: "세계 지도",
    body: "점을 누르면 도시 학습 대시보드가 큰 창으로 열립니다. 확대·이동하며 위치를 확인해 보세요."
  },
  {
    target: "[data-tutorial='atlas-search']",
    title: "검색과 필터",
    body: "도시·나라·랜드마크 이름으로 찾고, 권역·기능으로 걸러 볼 수 있습니다."
  },
  {
    target: "[data-tutorial='atlas-view']",
    title: "지도 / 목록",
    body: "지도 보기와 카드 목록 보기를 바꿀 수 있습니다. 어느 쪽이든 도시를 누르면 대시보드가 창으로 열립니다. 도시 비교도 여기서 시작합니다."
  },
  {
    target: null,
    title: "탐험을 시작해 보세요",
    body: "지도의 점을 눌러 도시를 열어 보세요. 다시 보려면 홈의 <b>튜토리얼</b>을 이용하세요."
  }
];

var PLAY_TUTORIAL_STEPS = [
  {
    target: null,
    title: "어반 런을 시작합니다",
    body: "주사위를 굴려 도시를 여행하는 보드게임입니다. 보드와 옆 패널을 함께 보세요."
  },
  {
    target: "[data-tutorial='game-board']",
    title: "여행 보드",
    body: "도착하면 도시 학습 대시보드가 열립니다. 미리 보려면 도시 칸을 눌러 보세요."
  },
  {
    target: "[data-tutorial='game-dice']",
    title: "주사위",
    body: "지금 차례인 친구가 <b>주사위 굴리기</b>를 누릅니다. 주사위가 입체적으로 굴러 눈이 나옵니다."
  },
  {
    target: "[data-tutorial='game-info']",
    title: "여행 정보",
    body: "점수·스탬프·남은 턴이 여기에 표시됩니다. 팀을 한눈에 확인할 수 있어요."
  },
  {
    target: "[data-tutorial='game-goals']",
    title: "여행 목표",
    body: "이번 판에서 달성하면 보너스 점수를 받는 목표 3장입니다. 점수 카드 안에서 모두 볼 수 있어요."
  },
  {
    target: null,
    title: "여행을 떠나 보세요",
    body: "주사위를 굴려 첫 도시로 이동해 보세요. 도착하면 도시 학습 대시보드가 넓게 열려 함께 읽기 좋아요."
  }
];

var PASSPORT_TUTORIAL_STEPS = [
  {
    target: null,
    title: "트레일 로그입니다",
    body: "게임과 트레일 맵에서 모은 발견·스탬프가 한곳에 쌓입니다."
  },
  {
    target: "[data-tutorial='log-summary']",
    title: "진행 현황",
    body: "지금까지 받은 스탬프와 발견한 도시 수가 요약됩니다."
  },
  {
    target: "[data-tutorial='log-grid']",
    title: "도시 노드",
    body: "각 도시는 랜드마크 사진으로 표시됩니다. 스탬프를 받은 도시에는 그 위에 스탬프가 찍힙니다. 도시를 누르면 트레일 맵으로 이동합니다."
  },
  {
    target: null,
    title: "로그를 채워 보세요",
    body: "어반 런 미션을 성공하면 이 칸에 스탬프 사진이 남습니다."
  }
];

var TUTORIAL_PACKS = {
  home: HOME_TUTORIAL_STEPS,
  atlas: ATLAS_TUTORIAL_STEPS,
  play: PLAY_TUTORIAL_STEPS,
  passport: PASSPORT_TUTORIAL_STEPS
};

var tutorialActive = false;
var tutorialStep = 0;
var tutorialKind = "home";
var TUTORIAL_STEPS = HOME_TUTORIAL_STEPS;
var tutorialTargetEl = null;
var tutorialLayoutTimer = null;

function tutorialState() {
  var map = Store.get(LS.tutorials, null);
  if (!map || typeof map !== "object") {
    map = { home: !!Store.get(LS.tutorial, false) };
  }
  return map;
}
function tutorialCompleted(kind) {
  kind = kind || tutorialKind || "home";
  return !!tutorialState()[kind];
}
function markTutorialCompleted(kind) {
  kind = kind || tutorialKind || "home";
  var map = tutorialState();
  map[kind] = true;
  Store.set(LS.tutorials, map);
  if (kind === "home") Store.set(LS.tutorial, true);
}

function closeTutorial(markDone) {
  tutorialActive = false;
  if (markDone) markTutorialCompleted();
  var root = $("#tutorial-root");
  if (root) {
    root.hidden = true;
    root.setAttribute("aria-hidden", "true");
  }
  document.body.classList.remove("is-tutorial-active");
  if (tutorialTargetEl) {
    tutorialTargetEl.classList.remove("tutorial-target-active");
    tutorialTargetEl = null;
  }
  if (tutorialLayoutTimer) {
    window.clearTimeout(tutorialLayoutTimer);
    tutorialLayoutTimer = null;
  }
  window.removeEventListener("resize", layoutTutorialStep);
  window.removeEventListener("scroll", layoutTutorialStep, true);
}

function startTutorial(force, kind) {
  kind = kind || "home";
  if (tutorialActive) return;
  if (!force && tutorialCompleted(kind)) return;
  closeModal(true);
  tutorialKind = kind;
  TUTORIAL_STEPS = TUTORIAL_PACKS[kind] || HOME_TUTORIAL_STEPS;
  if (kind === "home") {
    if (!$("#screen-title") || !$("#screen-title").classList.contains("is-active")) {
      showScreen("screen-title");
    }
  }
  tutorialStep = 0;
  tutorialActive = true;
  var root = $("#tutorial-root");
  if (root) {
    root.hidden = false;
    root.setAttribute("aria-hidden", "false");
  }
  document.body.classList.add("is-tutorial-active");
  window.addEventListener("resize", layoutTutorialStep);
  window.addEventListener("scroll", layoutTutorialStep, true);
  renderTutorialStep();
  Sound.unlock();
}
function maybeStartScreenTutorial(kind) {
  window.setTimeout(function () {
    if (tutorialActive) return;
    startTutorial(false, kind);
  }, 420);
}

function tutorialGo(delta) {
  if (!tutorialActive) return;
  var next = tutorialStep + delta;
  if (next < 0) return;
  if (next >= TUTORIAL_STEPS.length) {
    closeTutorial(true);
    toast("튜토리얼을 완료했습니다.", "good");
    return;
  }
  tutorialStep = next;
  renderTutorialStep();
  Sound.play("click");
}

function renderTutorialStep() {
  var step = TUTORIAL_STEPS[tutorialStep];
  if (!step) return;

  if (tutorialTargetEl) {
    tutorialTargetEl.classList.remove("tutorial-target-active");
    tutorialTargetEl = null;
  }

  $("#tutorial-progress").textContent = (tutorialStep + 1) + " / " + TUTORIAL_STEPS.length;
  $("#tutorial-title").textContent = step.title;
  $("#tutorial-body").innerHTML = step.body;

  var prevBtn = $("#tutorial-btn-prev");
  var nextBtn = $("#tutorial-btn-next");
  if (prevBtn) prevBtn.disabled = tutorialStep === 0;
  if (nextBtn) {
    nextBtn.textContent = (tutorialStep >= TUTORIAL_STEPS.length - 1) ? "시작하기 ✓" : "다음 →";
  }

  if (step.target) {
    tutorialTargetEl = document.querySelector(step.target);
    if (tutorialTargetEl) {
      tutorialTargetEl.classList.add("tutorial-target-active");
      try {
        tutorialTargetEl.scrollIntoView({ block: "center", behavior: "smooth" });
      } catch (e) {}
      tutorialLayoutTimer = window.setTimeout(layoutTutorialStep, 280);
    } else {
      layoutTutorialStep();
    }
  } else {
    layoutTutorialStep();
  }
}

function layoutTutorialStep() {
  if (!tutorialActive) return;
  var step = TUTORIAL_STEPS[tutorialStep];
  var spot = $("#tutorial-spotlight");
  var card = $("#tutorial-card");
  if (!spot || !card) return;

  if (!step || !step.target || !tutorialTargetEl) {
    spot.hidden = true;
    card.classList.add("is-center");
    card.style.left = "";
    card.style.top = "";
    card.style.transform = "";
    return;
  }

  card.classList.remove("is-center");
  card.style.transform = "";

  var pad = 10;
  var r = tutorialTargetEl.getBoundingClientRect();
  var left = Math.max(8, r.left - pad);
  var top = Math.max(8, r.top - pad);
  var width = Math.min(window.innerWidth - 16, r.width + pad * 2);
  var height = Math.min(window.innerHeight - 16, r.height + pad * 2);

  spot.hidden = false;
  spot.style.left = left + "px";
  spot.style.top = top + "px";
  spot.style.width = width + "px";
  spot.style.height = height + "px";

  var cardW = card.offsetWidth || 320;
  var cardH = card.offsetHeight || 180;
  var gap = 14;
  var cardLeft = left + width / 2 - cardW / 2;
  var cardTop = top + height + gap;

  if (cardTop + cardH > window.innerHeight - 12) {
    cardTop = top - cardH - gap;
  }
  if (cardTop < 12) {
    cardTop = Math.min(window.innerHeight - cardH - 12, top + height + gap);
  }
  cardLeft = Math.max(12, Math.min(cardLeft, window.innerWidth - cardW - 12));
  cardTop = Math.max(12, Math.min(cardTop, window.innerHeight - cardH - 12));

  card.style.left = cardLeft + "px";
  card.style.top = cardTop + "px";
}

/* =========================================================================
 * [N] 초기화 & 이벤트 바인딩
 * ========================================================================= */

/* 소리 UI 동기화 */
function syncAudioUI() {
  var ts = document.getElementById("toggle-sfx-office");
  if (ts) ts.checked = settings.sfx;
  var vs = document.getElementById("vol-sfx-office");
  if (vs) {
    vs.value = settings.sfxVol;
    vs.disabled = !settings.sfx;
  }
  var lab = document.getElementById("vol-sfx-value");
  if (lab) lab.textContent = (settings.sfxVol | 0) + "%";
  var test = document.getElementById("btn-sfx-test");
  if (test) test.disabled = !settings.sfx;
}

function bindAudioUI() {
  var ts = document.getElementById("toggle-sfx-office");
  if (ts) ts.addEventListener("change", function () {
    settings.sfx = ts.checked; saveSettings(); syncAudioUI();
    Sound.unlock();
    if (settings.sfx) Sound.play("click");
  });
  var vs = document.getElementById("vol-sfx-office");
  if (vs) {
    vs.addEventListener("input", function () {
      settings.sfxVol = parseInt(vs.value, 10); saveSettings(); syncAudioUI();
    });
    vs.addEventListener("change", function () {
      Sound.unlock();
      if (settings.sfx) Sound.play("click");
    });
  }
  var test = document.getElementById("btn-sfx-test");
  if (test) test.addEventListener("click", function () {
    Sound.unlock();
    if (!settings.sfx) {
      toast("효과음이 꺼져 있습니다. 먼저 켜 주세요.", "");
      return;
    }
    Sound.play("dice");
    window.setTimeout(function () { Sound.play("reward"); }, 280);
  });
}

/* data-act 속성 기반 이벤트 위임 */
function resumeOrNewGame() {
  if (game && !game.finished) {
    enterGameScreen();
    return;
  }
  var saved = loadGame();
  if (saved && !saved.finished) {
    continueGame();
    return;
  }
  ACTIONS["new-game"]();
}

var ACTIONS = {
  "new-game": function () {
    Sound.unlock();
    var saved = loadGame();
    if (saved && !saved.finished) {
      confirmDialog("새 게임 시작", "진행 중인 게임이 있습니다. 새로 시작하면 이전 진행 상황은 사라집니다.", function () {
        clearSave(); openSetup();
      }, "새로 시작");
    } else { openSetup(); }
  },
  "nav-play": function () { Sound.unlock(); resumeOrNewGame(); },
  "continue-game": function () { Sound.unlock(); continueGame(); },
  "open-atlas": function () { Sound.unlock(); openAtlas(); },
  "open-codex": function () { Sound.unlock(); openAtlas({ view: "list" }); },
  "atlas-back": function () {
    renderCoverStats();
    renderHeroMap();
    backScreen("screen-title");
    if (game && $("#screen-game") && $("#screen-game").classList.contains("is-active")) {
      window.setTimeout(updateBoardScale, 80);
    }
  },
  "atlas-view-map": function () { atlas.view = "map"; renderAtlasChrome(); renderAtlasView(); },
  "atlas-view-list": function () { atlas.view = "list"; renderAtlasChrome(); renderAtlasView(); },
  "atlas-zoom-in": function () { atlasZoomIn(); },
  "atlas-zoom-out": function () { atlasZoomOut(); },
  "atlas-zoom-reset": function () { atlasZoomReset(); },
  "open-compare": function () { Sound.unlock(); openCompare(); },
  "compare-back": function () { showScreen("screen-atlas"); },
  "open-passport": function () { Sound.unlock(); openPassport(); },
  "passport-back": function () {
    if (game && !game.finished) { enterGameScreen(); return; }
    backScreen("screen-title");
  },
  "codex-back": function () { backScreen("screen-title"); },
  "open-howto": function () { Sound.unlock(); openStudentGuide(); },
  "howto-back": function () { backScreen("screen-title"); },
  "open-guide": function () { Sound.unlock(); openStudentGuide(); },
  "open-student-guide": function () { Sound.unlock(); openStudentGuide(); },
  "open-teacher-guide": function () { Sound.unlock(); openTeacherGuide(); },
  "print-teacher-guide": function () { Sound.unlock(); printTeacherGuide(); },
  "open-teacher": function () { Sound.unlock(); requireTeacherAccess(openTeacher); },
  "open-results": function () { Sound.unlock(); requireTeacherAccess(openResults); },
  "go-back": function () { backScreen("screen-title"); },
  "open-office": function () { Sound.unlock(); openOffice(); },
  "office-save": function () { Sound.unlock(); saveOfficeForm(); },
  "office-export": function () { Sound.unlock(); exportLearningBundle(); },
  "office-reset-learn": function () {
    Sound.unlock();
    confirmDialog("학습기록 초기화",
      "발견 도시·스탬프·여행 결과·진행 중 게임을 지울까요?<br>학교·이름 등 이용자 정보는 남습니다.",
      function () { resetLearningRecords(); }, "초기화");
  },
  "office-reset-all": function () {
    Sound.unlock();
    confirmDialog("전체 초기화",
      "이용자 정보와 학습 기록, 설정까지 모두 처음 상태로 되돌립니다.",
      function () { resetAllDeviceData(); }, "초기화");
  },
  "go-title": function () {
    if ($("#screen-title") && $("#screen-title").classList.contains("is-active")) {
      closeModal();
      return;
    }
    if (isGameInProgress()) {
      confirmLeaveGame(function () {
        saveGame();
        goTitleNow();
      });
      return;
    }
    goTitleNow();
  },

  "start-tutorial": function () { Sound.unlock(); startTutorial(true, "home"); },
  "tutorial-next": function () { tutorialGo(1); },
  "tutorial-prev": function () { tutorialGo(-1); },
  "tutorial-skip": function () {
    Sound.play("click");
    closeTutorial(true);
    toast("튜토리얼을 건너뛰었습니다.", "");
  },

  "setup-next": function () {
    if (setupDraft.step === 1) { gotoSetupStep(2); return; }
    if (setupDraft.step === 2) {
      if (!validateGroup()) return;
      if (setupDraft.playMode === "solo") {
        Sound.unlock();
        startGame();
        return;
      }
      renderSetupPreview();
      gotoSetupStep(3);
    }
  },
  "setup-prev": function () { gotoSetupStep(Math.max(1, setupDraft.step - 1)); },
  "add-member": function () {
    if (setupDraft.playMode === "solo") return;
    if (setupDraft.members.length >= 5) { toast("친구는 최대 5명까지 입력할 수 있어요.", "bad"); return; }
    setupDraft.members.push("");
    Sound.play("click");
    renderMemberInputs();
  },
  "start-game": function () { Sound.unlock(); startGame(); },

  "roll": function () { rollDice(); },
  "save-quit": function () {
    if (!game || game.finished) return;
    confirmSaveQuit(function () {
      saveGame();
      toast("현재 진행 상황을 저장했습니다.", "good");
      clearSaveFlagRefresh();
      renderCoverStats();
      renderHeroMap();
      showScreen("screen-title");
    });
  },
  "finish-now": function () {
    if (busy) return;
    confirmDialog("여행 마치기",
      "남은 턴이 " + Math.max(0, game.turnLimit - game.turn) + "턴 있습니다. 지금 여행을 마치고 결과 리포트를 볼까요?",
      function () { finishGame(); }, "리포트 보기");
  },

  "save-result": function () { saveResult(); },
  "report-pdf-save": function () { reportPdfSave(); },
  "print-report": function () { reportPdfSave(); },
  "copy-report": function () { copyReport(); },
  "copy-summary": function () { copySummary(); },
  "download-report": function () { downloadReport(); },
  "download-report-json": function () { downloadReportJson(); }
};

function bindActions() {
  document.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target.closest("[data-act]") : null;
    if (!t) return;
    var act = t.dataset.act;
    if (ACTIONS[act]) {
      e.preventDefault();
      if (act !== "roll" && act.indexOf("tutorial-") !== 0) Sound.play("click");
      ACTIONS[act]();
    }
  });
}

/* 국기 이모지 지원 여부 확인
 *  Windows 기본 이모지 글꼴에는 국기 글리프가 없어 🇰🇷 가 "KR" 같은 글자로 표시된다.
 *  이 경우 <html>에 no-flag-emoji 클래스를 붙여 국가 코드 배지 스타일로 예쁘게 보이게 한다. */
function detectFlagEmoji() {
  try {
    var cv = document.createElement("canvas");
    cv.width = 24; cv.height = 24;
    var ctx = cv.getContext("2d");
    if (!ctx) return true;
    ctx.font = "18px sans-serif";
    ctx.fillStyle = "#000";
    ctx.textBaseline = "top";
    ctx.fillText("🇰🇷", 0, 0); // 🇰🇷 (빨강·파랑이 있어 색으로 판별 가능)
    var d = ctx.getImageData(0, 0, 24, 24).data;
    for (var i = 0; i < d.length; i += 4) {
      if (d[i + 3] > 10 && (Math.abs(d[i] - d[i + 1]) > 18 || Math.abs(d[i + 1] - d[i + 2]) > 18)) return true;
    }
    return false;
  } catch (e) { return true; }
}

/* 초기화 */
function init() {
  if (!detectFlagEmoji()) document.documentElement.classList.add("no-flag-emoji");
  if (!CITIES.length) {
    showFatal("data.js를 불러오지 못했습니다. data.js가 script.js보다 먼저 로드되는지 확인하세요.");
    return;
  }
  if (isTeacherUnlocked()) document.body.classList.add("is-teacher-unlocked");
  hydrateStamps();
  syncAudioUI();
  bindAudioUI();
  bindGuideSheet();
  bindActions();
  window.addEventListener("beforeprint", syncPrintAnswers);
  ensureDiceCube();
  drawDice(1, { instant: true });
  clearSaveFlagRefresh();
  renderCoverStats();
  renderHeroMap();
  updateSiteNav("screen-title");

  window.setTimeout(function () {
    if (!tutorialCompleted()) startTutorial(false);
  }, 500);

  /* 설정 화면 입력 연동 */
  var inClass = $("#in-class"), inGroup = $("#in-group");
  if (inClass) inClass.addEventListener("input", function () { if (setupDraft) setupDraft.klass = inClass.value; });
  if (inGroup) inGroup.addEventListener("input", function () { if (setupDraft) setupDraft.name = inGroup.value; });

  /* 아틀라스 검색 */
  var as = $("#atlas-search");
  if (as) as.addEventListener("input", function () {
    atlas.query = as.value;
    renderAtlasView();
  });

  /* 첫 상호작용에서 오디오 잠금 해제 (브라우저 자동재생 정책 준수) */
  ["pointerdown", "keydown", "touchstart"].forEach(function (evt) {
    window.addEventListener(evt, function once() {
      Sound.unlock();
      window.removeEventListener(evt, once);
    }, { once: true });
  });

  /* 창 크기 변화 대응 */
  var rt = null;
  window.addEventListener("resize", function () {
    if (rt) window.clearTimeout(rt);
    rt = window.setTimeout(function () { if (game) updateBoardScale(); }, 120);
  });
  if (window.ResizeObserver) {
    var board = $("#board");
    if (board) {
      var ro = new ResizeObserver(function () { if (game) updateBoardScale(); });
      ro.observe(board);
    }
  }

  /* 키보드 : ESC로 모달 닫기, Space/Enter로 주사위 */
  document.addEventListener("keydown", function (e) {
    if (tutorialActive) {
      if (e.key === "Escape") {
        closeTutorial(true);
        toast("튜토리얼을 건너뛰었습니다.", "");
        return;
      }
      if (e.key === "Enter" || e.key === "ArrowRight") {
        e.preventDefault();
        tutorialGo(1);
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        tutorialGo(-1);
        return;
      }
    }
    if (e.key === "Escape" && modalOpen) {
      var closeBtn = document.querySelector(".modal-x");
      if (closeBtn) closeBtn.click();
      return;
    }
    if (e.code === "Space" && !modalOpen && $("#screen-game").classList.contains("is-active")) {
      var tag = (document.activeElement && document.activeElement.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      e.preventDefault();
      rollDice();
    }
  });

  /* 진행 중인 게임이 있으면 창을 닫기 전에 저장 */
  window.addEventListener("beforeunload", function () { if (game && !game.finished) saveGame(); });

  /* 콘솔 안내 */
  try {
    console.log("%c" + APP.name + " v" + APP.version,
      "background:#14213d;color:#e6c886;padding:4px 10px;border-radius:4px;font-weight:bold");
    console.log("도시 데이터 " + CITIES.length + "개 · 보드 " + BOARD_SIZE + "칸 · 권역 " + REGIONS.length + "개");
  } catch (e) {}
}

/* 예기치 못한 오류를 화면에 드러낸다.
   (오류가 조용히 삼켜지면 "버튼이 안 눌린다"처럼 원인을 알 수 없는 증상이 된다) */
function showFatal(msg) {
  try {
    if (document.getElementById("fatal-banner")) return;
    var bar = document.createElement("div");
    bar.id = "fatal-banner";
    bar.style.cssText =
      "position:fixed;left:0;right:0;top:0;z-index:9999;padding:12px 16px;" +
      "background:#cf5350;color:#fff;font:600 14px/1.5 sans-serif;text-align:center;" +
      "box-shadow:0 4px 16px rgba(0,0,0,.3)";
    bar.textContent = "오류가 발생했습니다: " + msg + " — 페이지를 새로고침(F5)해 주세요.";
    document.body.appendChild(bar);
  } catch (e) {}
}
window.addEventListener("error", function (e) {
  showFatal((e && e.message) ? e.message : "알 수 없는 오류");
});

function safeInit() {
  try { init(); }
  catch (e) {
    showFatal(e && e.message ? e.message : String(e));
    try { console.error(e); } catch (e2) {}
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", safeInit);
} else {
  safeInit();
}

})();
