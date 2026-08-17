/* =========================================================================
 * URBAN TRAIL · 랜드마크 이미지 출처 표기 생성
 *   tools/_dl/manifest.json → assets/landmarks/CREDITS.md + credits.json
 *   실행: node tools/make-credits.js
 * ========================================================================= */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUTDIR = path.join(ROOT, "assets", "landmarks");
const items = JSON.parse(fs.readFileSync(path.join(__dirname, "_dl", "manifest.json"), "utf8"));

/* data.js 순서(권역별)를 따르기 위해 도시 순서를 가져온다 */
global.window = global;
require(path.join(ROOT, "data.js"));
const CITIES = (global.CITY_PASSPORT_DATA && global.CITY_PASSPORT_DATA.CITIES) || global.CITIES;
const REGION_NAME = {
  EA: "동아시아·동남아시아", SW: "남아시아·서아시아", EU: "유럽",
  AF: "아프리카", NA: "북아메리카", SO: "남아메리카·오세아니아"
};

const byId = {};
items.forEach(i => { byId[i.id] = i; });

/* 실제 저장된 PNG의 크기·용량 */
function fileInfo(name) {
  const p = path.join(OUTDIR, name);
  if (!fs.existsSync(p)) return null;
  return { kb: Math.round(fs.statSync(p).size / 1024) };
}

const rows = [];
let region = null;
const lines = [];
lines.push("# 랜드마크 이미지 출처");
lines.push("");
lines.push("모든 이미지는 **위키미디어 공용(Wikimedia Commons)** 에서 내려받은 자유 이용 라이선스 자료입니다.");
lines.push("각 이미지의 대표 사진은 위키데이터의 대표 이미지(P18) 속성을 기준으로 선정했습니다.");
lines.push("");
lines.push("> 수업 자료·발표에 사용할 때는 아래 **저작자와 라이선스**를 함께 표기하세요.");
lines.push("> `CC BY` 계열은 저작자 표시가 필수이며, `CC BY-SA` 는 2차 저작물에 동일 조건 적용이 필요합니다.");
lines.push("> `Public domain` · `CC0` 는 표기 의무가 없지만 출처를 밝히는 것을 권합니다.");
lines.push("");

CITIES.forEach(c => {
  const it = byId[c.id];
  if (!it) return;
  if (c.region !== region) {
    region = c.region;
    lines.push("");
    lines.push("## " + REGION_NAME[region]);
    lines.push("");
    lines.push("| 도시 | 랜드마크 | 파일 | 저작자 | 라이선스 | 공용 원본 |");
    lines.push("|---|---|---|---|---|---|");
  }
  const info = fileInfo(it.out);
  const artist = (it.artist || "미상").replace(/\|/g, "/").slice(0, 60);
  const lic = (it.license || "확인 필요").replace(/\|/g, "/");
  lines.push("| " + c.city + " | " + c.landmark + " | `" + it.out + "`" +
    (info ? " (" + info.kb + "KB)" : " (없음)") +
    " | " + artist + " | " + lic +
    " | [원본](" + it.page + ") |");

  rows.push({
    id: c.id, city: c.city, country: c.country, region: REGION_NAME[c.region],
    landmark: c.landmark, file: "assets/landmarks/" + it.out,
    commonsFile: it.file, artist: it.artist, license: it.license, source: it.page
  });
});

lines.push("");
lines.push("---");
lines.push("");
lines.push("- 총 " + rows.length + "개 도시");
lines.push("- 수집 방식: 위키데이터 대표 이미지(P18) → 위키미디어 공용 썸네일");
lines.push("- 규격: 가로세로 비율 유지, 1200 × 900 px 박스에 맞춰 축소, PNG");
lines.push("- 생성 일시: " + new Date().toISOString().slice(0, 10));
lines.push("");

fs.writeFileSync(path.join(OUTDIR, "CREDITS.md"), lines.join("\n"), "utf8");
fs.writeFileSync(path.join(OUTDIR, "credits.json"), JSON.stringify(rows, null, 2), "utf8");
console.log("CREDITS.md · credits.json 생성 완료 (" + rows.length + "개)");

/* 라이선스별 집계 */
const tally = {};
rows.forEach(r => { tally[r.license] = (tally[r.license] || 0) + 1; });
Object.keys(tally).sort((a, b) => tally[b] - tally[a])
  .forEach(k => console.log("  " + String(tally[k]).padStart(2) + "개  " + k));
