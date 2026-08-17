const fs = require("fs");
const path = require("path");

const p = path.join(__dirname, "..", "data.js");
let src = fs.readFileSync(p, "utf8");
const start = src.indexOf("var CITY_META = ");
const marker = "\n\n  g.CITY_PASSPORT_DATA";
const end = src.indexOf(marker);
if (start < 0 || end < 0) throw new Error("CITY_META not found");
let json = src.slice(start + "var CITY_META = ".length, end).trim();
if (json.endsWith(";")) json = json.slice(0, -1);
const META = JSON.parse(json);

const COUNTRY_FACT = {
  "대한민국": "전 세계가 열광하는 K-컬처의 본토이자, 초고속 인터넷과 배달 문화가 발달한 IT 강국입니다.",
  "일본": "화산과 온천이 만든 경관, 편의점·자판기 문화, 애니메이션이 공존하는 섬나라입니다.",
  "중국": "영토가 매우 넓어 지역마다 기후와 생활 모습이 크게 다르고, '판다 외교'로도 유명합니다.",
  "싱가포르": "도시 국가로, 깨끗한 거리와 엄격한 공공질서 규칙으로 잘 알려져 있습니다.",
  "태국": "매년 전 세계인이 물총 싸움을 하는 송크란(물 축제)으로 유명한 나라입니다.",
  "베트남": "커피에 계란을 넣어 마시는 독특한 문화와, 오토바이가 거리를 가득 채우는 활기찬 나라입니다.",
  "인도네시아": "1만 7천 개가 넘는 섬으로 이루어졌고, 코모도 왕도마뱀의 서식지로도 유명합니다.",
  "인도": "수학의 0을 발명한 문명권이자, 힌두교의 영향으로 갠지스강을 신성하게 여기는 거대 인구 대국입니다.",
  "아랍에미리트": "세계 최고층 빌딩 부르즈 할리파가 있고, 사막 위에 초현대 도시를 세운 나라입니다.",
  "튀르키예": "유럽과 아시아가 만나는 지점으로, 이스탄불은 두 대륙에 걸쳐 있는 대표 도시입니다.",
  "이란": "화려한 페르시아 카펫과 장미수로 유명한 서아시아의 고원 국가입니다.",
  "카타르": "월드컵을 위해 도시 인프라를 크게 확충했고, 에어컨이 나오는 야외 시장으로도 화제가 되었습니다.",
  "방글라데시": "저지대 평야라 홍수가 잦고, 인구 밀도가 세계 최고 수준인 나라입니다.",
  "파키스탄": "세계에서 두 번째로 높은 산 K2를 품은, 거친 대자연과 고대 문명의 땅입니다.",
  "영국": "셰익스피어와 해리포터가 태어난 창의력의 나라로, 한때 '해가 지지 않는 나라'로 불렸습니다.",
  "프랑스": "예술과 패션의 중심지이자, 에펠탑과 미식 문화로 전 세계인의 사랑을 받는 나라입니다.",
  "이탈리아": "나라 전체가 박물관처럼 유적이 많고, 피자·파스타의 본고장이자 르네상스의 발상지입니다.",
  "스페인": "정열적인 플라멩코와 가우디의 도시 바르셀로나가 있는 나라입니다.",
  "독일": "철학자와 음악가의 고향이자, 아우토반과 정밀 기계 공업으로 유명한 유럽의 엔진입니다.",
  "네덜란드": "풍차와 튤립의 나라로, 해수면보다 낮은 땅을 둑을 쌓아 만든 '폴더'가 유명합니다.",
  "체코": "프라하 성의 야경이 환상적이며, 중세의 도시 경관을 잘 간직한 나라입니다.",
  "그리스": "민주주의와 서양 문명이 시작된 곳이자, 에게해의 푸른 섬으로 유명한 나라입니다.",
  "이집트": "피라미드와 스핑크스, 나일강의 축복을 받아 문명이 꽃핀 나라입니다.",
  "남아프리카공화국": "희망봉이 있는 대륙의 끝자락으로, 다이아몬드와 금이 풍부한 '무지개 국가'입니다.",
  "케냐": "사파리의 천국으로, 매년 수백만 마리의 누 떼가 이동하는 장관을 볼 수 있습니다.",
  "모로코": "사하라 사막의 관문이자, 이국적인 메디나(옛 시가지)로 유명한 나라입니다.",
  "나이지리아": "아프리카 최대 인구 대국이자, 해안 도시 라고스의 과밀을 피해 아부자로 수도를 옮긴 나라입니다.",
  "에티오피아": "커피가 처음 발견된 고향이자, 아프리카에서 식민 지배를 이겨 낸 자부심의 나라입니다.",
  "가나": "서아프리카의 해안 국가로, 과거 황금 교역과 카카오 생산으로 이름이 알려졌습니다.",
  "탄자니아": "아프리카에서 가장 높은 킬리만자로산과 야생의 보고 세렝게티가 있는 나라입니다.",
  "미국": "자유의 여신상부터 할리우드까지, 전 세계 대중문화와 경제를 움직이는 나라입니다.",
  "캐나다": "세계에서 두 번째로 넓은 나라로, 단풍시럽(메이플)과 오로라가 환상적인 곳입니다.",
  "멕시코": "아즈텍·마야 문명의 발상지이자, 타코와 '망자의 날' 축제로 유명한 나라입니다.",
  "쿠바": "거리마다 클래식카가 달리고, 정열적인 살사 음악이 가득한 카리브해의 섬나라입니다.",
  "파나마": "태평양과 대서양을 잇는 거대한 운하가 있는, 세계 물류의 핵심 통로입니다.",
  "브라질": "지구의 허파 아마존과 삼바 카니발, 축구 축제가 열리는 열정의 나라입니다.",
  "페루": "구름 위의 잉카 도시 마추픽추와 안데스 고산 지대가 있는 신비의 땅입니다.",
  "오스트레일리아": "캥거루와 코알라의 나라로, 울루루와 산호초 바다가 장관인 대륙 국가입니다.",
  "뉴질랜드": "영화 '반지의 제왕' 촬영지로 유명하며, 마오리족의 하카 춤이 강렬한 곳입니다.",
  "아르헨티나": "정열적인 탱고의 고향이자, 축구 영웅 메시와 마라도나를 배출한 나라입니다.",
  "칠레": "남북으로 세계에서 가장 길게 뻗어, 사막부터 빙하까지 한 나라에서 볼 수 있습니다.",
  "콜롬비아": "세계적인 품질의 커피 생산지이자, '엘도라도' 황금 도시 전설이 시작된 곳입니다."
};

const GEO_NOTE = {
  seoul: "수도권은 여러 도시가 이어진 거대 도시권(메갈로폴리스)의 사례로 자주 다뤄집니다.",
  tokyo: "뉴욕·런던과 함께 세계 도시로 불리며, 세계 최대 규모의 도시권을 이룹니다.",
  beijing: "정치·행정의 중심인 수도 기능과, 분지 지형으로 인한 대기 정체가 함께 학습 포인트입니다.",
  shanghai: "창장(양쯔강) 하구의 항구 도시로, 중국의 대표적인 세계 도시·금융 허브입니다.",
  singapore: "나라 전체가 하나의 도시인 도시 국가로, 항만·금융·중계 무역 기능이 겹칩니다.",
  bangkok: "동남아시아의 대표 종주도시로, 송크란 같은 축제가 도시 관광의 큰 축입니다.",
  hanoi: "하노이는 정치 수도, 호찌민은 경제 중심처럼 기능이 나뉜 이중 구조의 한 축입니다.",
  jakarta: "섬나라 인도네시아의 종주도시로, 과밀과 지반 침하 등 대도시 문제가 자주 거론됩니다.",
  delhi: "인도의 정치 수도로, 힌두교 문화와 거대한 인구가 도시 경관을 만들어 냅니다.",
  mumbai: "인도의 금융·영화(볼리우드) 중심 항구 도시로, 수도(델리)와 기능이 나뉩니다.",
  dubai: "사막 기후 위에 세운 계획적 세계 도시로, 초고층 빌딩과 허브 공항이 상징입니다.",
  istanbul: "보스포루스 해협을 사이에 두고 아시아와 유럽에 걸쳐 있는 독특한 위치의 도시입니다.",
  tehran: "해발 1,200m 안팎의 고원 도시로, 건조 기후와 산지 지형이 도시 입지를 설명합니다.",
  doha: "자원 수출로 얻은 자본으로 단기간에 세계 도시 기능을 갖춘 사례입니다.",
  dhaka: "저지대·고밀도 도시의 대표 사례로, 홍수와 인구 과밀이 핵심 학습 주제입니다.",
  karachi: "파키스탄 최대 항구 도시로, 수도가 아니면서도 경제 중심 역할을 합니다.",
  london: "세계 도시이자 CBD(시티 오브 런던) 개념을 배우기 좋은 도시입니다.",
  paris: "센강을 따라 형성된 문화·관광 종주도시로, 도시 경관 보전의 사례이기도 합니다.",
  rome: "고대 도시 위에 현대 도시가 겹친 층위 구조로, '나라 전체가 박물관'인 이탈리아의 수도입니다.",
  barcelona: "가우디의 건축과 지중해성 기후, 항구 기능이 겹치는 남유럽 관광·산업 도시입니다.",
  berlin: "분단과 통일의 흔적이 도시 공간에 남아 있는, 유럽의 정치·문화 중심입니다.",
  amsterdam: "해수면보다 낮은 땅을 간척한 폴더 지대 위의 도시로, 운하망이 유명합니다.",
  prague: "중세 도시 구조를 잘 보전해 관광 기능이 강한 중부 유럽 도시입니다.",
  athens: "서양 문명의 발상지로, 지중해성 기후의 전형적인 남유럽 수도입니다.",
  cairo: "나일강 유역의 오아시스형 입지로, 사막 기후 속 대도시가 가능한 이유를 보여 줍니다.",
  capetown: "희망봉 일대의 해안 도시로, 지중해성 기후(남반구)가 나타납니다.",
  nairobi: "적도 부근이지만 고원 위에 있어 연중 선선한, 고지대 도시 입지의 사례입니다.",
  marrakesh: "사하라로 들어가는 관문 도시로, 메디나와 오아시스 교역의 역사가 남아 있습니다.",
  lagos: "해안 거대 도시의 과밀 때문에 나이지리아가 내륙 아부자로 수도를 옮긴 배경이 되는 도시입니다.",
  addis: "해발 2,300m가 넘는 고원 수도로, 아프리카 연합 본부가 있어 정치 중심 기능도 큽니다.",
  accra: "서아프리카 기니만 연안의 항구 수도로, 카카오 등 1차 산품 수출과 연결됩니다.",
  dar: "탄자니아의 최대 항구 도시로, 내륙 국가들의 출구 역할을 하는 관문 도시입니다.",
  newyork: "세계 도시의 대표 사례이며, 보스턴~워싱턴을 잇는 보스워시 메갈로폴리스의 핵심입니다.",
  vancouver: "온난 습윤한 서안 해양성 기후의 항구 도시로, 산과 바다가 가까운 입지입니다.",
  mexico: "해발 2,200m 고원 분지의 거대 도시로, 열섬·대기 정체와 망자의 날 문화가 함께 등장합니다.",
  sanfrancisco: "산과 만, 단층대가 겹친 항구 도시로, 안개가 잦은 지중해성 기후를 보입니다.",
  toronto: "오대호 연안의 캐나다 최대 도시로, 금융·다문화 기능이 집중되어 있습니다.",
  chicago: "오대호 수운과 철도가 만나는 교통 요지로 성장한 북미 산업·물류 도시입니다.",
  havana: "카리브해 사회주의 국가의 수도로, 구도심 경관과 항만 기능이 남아 있습니다.",
  panama: "파나마 운하가 태평양과 대서양을 잇는 세계적 교통·물류 결절점입니다.",
  rio: "산비탈의 파벨라(무허가 거주지)와 삼바 카니발로, 도시 내부 격차를 배우는 대표 사례입니다.",
  lima: "연중 강수가 거의 없는 해안 사막 기후 위의 대도시로, 한류의 영향이 큽니다.",
  sydney: "멜버른과 수도 유치 경쟁을 벌인 끝에, 두 도시 사이에 계획 수도 캔버라가 들어선 배경이 있습니다.",
  auckland: "뉴질랜드 최대 도시이지만 수도는 웰링턴으로, 경제 중심과 정치 중심이 나뉜 사례입니다.",
  buenosaires: "라플라타강 하구의 항구 수도로, 탱고와 유럽풍 도시 경관이 유명합니다.",
  santiago: "안데스 산맥 기슭의 분지 도시로, 남북으로 긴 칠레의 정치·경제 중심입니다.",
  bogota: "해발 2,600m 안팎의 고원 수도로, 적도 근처인데도 기온이 낮아 고지대 입지를 보여 줍니다.",
  melbourne: "시드니와 쌍벽을 이루는 호주의 문화·스포츠 도시로, 이 경쟁이 캔버라 건설로 이어졌습니다."
};

const RELATED = {
  seoul: ["tokyo", "beijing"],
  tokyo: ["seoul", "shanghai"],
  beijing: ["shanghai", "seoul"],
  shanghai: ["tokyo", "singapore"],
  singapore: ["jakarta", "bangkok"],
  bangkok: ["hanoi", "singapore"],
  hanoi: ["bangkok", "jakarta"],
  jakarta: ["singapore", "bangkok"],
  delhi: ["mumbai", "dhaka"],
  mumbai: ["delhi", "karachi"],
  dubai: ["doha", "istanbul"],
  istanbul: ["athens", "dubai"],
  tehran: ["istanbul", "dubai"],
  doha: ["dubai", "cairo"],
  dhaka: ["delhi", "karachi"],
  karachi: ["mumbai", "dhaka"],
  london: ["paris", "newyork"],
  paris: ["london", "rome"],
  rome: ["athens", "paris"],
  barcelona: ["rome", "athens"],
  berlin: ["prague", "amsterdam"],
  amsterdam: ["london", "berlin"],
  prague: ["berlin", "paris"],
  athens: ["rome", "istanbul"],
  cairo: ["marrakesh", "dubai"],
  capetown: ["nairobi", "sydney"],
  nairobi: ["addis", "dar"],
  marrakesh: ["cairo", "lagos"],
  lagos: ["accra", "nairobi"],
  addis: ["nairobi", "dar"],
  accra: ["lagos", "nairobi"],
  dar: ["nairobi", "addis"],
  newyork: ["london", "chicago"],
  vancouver: ["sanfrancisco", "toronto"],
  mexico: ["bogota", "lima"],
  sanfrancisco: ["vancouver", "newyork"],
  toronto: ["chicago", "vancouver"],
  chicago: ["newyork", "toronto"],
  havana: ["mexico", "panama"],
  panama: ["havana", "bogota"],
  rio: ["buenosaires", "lima"],
  lima: ["bogota", "santiago"],
  sydney: ["melbourne", "auckland"],
  auckland: ["sydney", "melbourne"],
  buenosaires: ["santiago", "rio"],
  santiago: ["lima", "buenosaires"],
  bogota: ["lima", "mexico"],
  melbourne: ["sydney", "auckland"]
};

function cityCountry(id) {
  const map = {
    seoul: "대한민국", tokyo: "일본", beijing: "중국", shanghai: "중국",
    singapore: "싱가포르", bangkok: "태국", hanoi: "베트남", jakarta: "인도네시아",
    delhi: "인도", mumbai: "인도", dubai: "아랍에미리트", istanbul: "튀르키예",
    tehran: "이란", doha: "카타르", dhaka: "방글라데시", karachi: "파키스탄",
    london: "영국", paris: "프랑스", rome: "이탈리아", barcelona: "스페인",
    berlin: "독일", amsterdam: "네덜란드", prague: "체코", athens: "그리스",
    cairo: "이집트", capetown: "남아프리카공화국", nairobi: "케냐", marrakesh: "모로코",
    lagos: "나이지리아", addis: "에티오피아", accra: "가나", dar: "탄자니아",
    newyork: "미국", vancouver: "캐나다", mexico: "멕시코", sanfrancisco: "미국",
    toronto: "캐나다", chicago: "미국", havana: "쿠바", panama: "파나마",
    rio: "브라질", lima: "페루", sydney: "오스트레일리아", auckland: "뉴질랜드",
    buenosaires: "아르헨티나", santiago: "칠레", bogota: "콜롬비아", melbourne: "오스트레일리아"
  };
  return map[id];
}

Object.keys(META).forEach(function (id) {
  const m = META[id];
  const country = cityCountry(id);
  if (country && COUNTRY_FACT[country]) m.countryFact = COUNTRY_FACT[country];
  if (GEO_NOTE[id]) m.geoNote = GEO_NOTE[id];
  if (RELATED[id]) m.related = RELATED[id].filter(function (x) { return !!META[x]; });
});

const next = src.slice(0, start) + "var CITY_META = " + JSON.stringify(META, null, 2) + ";\n" + src.slice(end);
fs.writeFileSync(p, next, "utf8");
console.log("patched CITY_META", Object.keys(META).length);
