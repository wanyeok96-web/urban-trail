/* =========================================================================
 * URBAN TRAIL · 랜드마크 이미지 수집 스크립트
 * -------------------------------------------------------------------------
 *  위키데이터 대표 사진(P18) → 위키미디어 공용 썸네일을 내려받는다.
 *  - P18이 없으면 영문 위키백과 대표 이미지 → 공용 파일 검색 순으로 폴백
 *  - 라이선스/저작자 정보를 함께 수집해 credits.json 으로 남긴다
 *
 *  실행:  node tools/fetch-landmarks.js
 *  출력:  tools/_dl/<id>.<ext>  +  tools/_dl/manifest.json
 * ========================================================================= */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(__dirname, "_dl");
const WIDTH = 1600;                       // 내려받을 원본 폭(px) — 이후 리사이즈
const UA = { "User-Agent": "UrbanTrail-EDU/1.0 (high-school geography class material)" };

/* 도시 id → 영문 위키백과 문서 제목 (앞에서부터 시도) */
const TITLES = {
  seoul:        ["Gyeongbokgung"],
  tokyo:        ["Sensō-ji", "Tokyo Skytree"],
  beijing:      ["Forbidden City"],
  shanghai:     ["The Bund", "Oriental Pearl Tower"],
  singapore:    ["Marina Bay Sands", "Marina Bay, Singapore"],
  bangkok:      ["Grand Palace", "Wat Phra Kaew"],
  hanoi:        ["Hoàn Kiếm Lake", "Temple of Literature, Hanoi"],
  jakarta:      ["National Monument (Indonesia)"],
  delhi:        ["Humayun's Tomb", "India Gate"],
  mumbai:       ["Chhatrapati Shivaji Maharaj Terminus"],
  dubai:        ["Burj Khalifa"],
  istanbul:     ["Hagia Sophia"],
  tehran:       ["Azadi Tower"],
  doha:         ["Museum of Islamic Art, Doha", "Souq Waqif"],
  dhaka:        ["Lalbagh Fort"],
  karachi:      ["Port of Karachi", "Karachi"],
  london:       ["Big Ben", "Palace of Westminster"],
  paris:        ["Eiffel Tower"],
  rome:         ["Colosseum"],
  barcelona:    ["Sagrada Família"],
  berlin:       ["Brandenburg Gate"],
  amsterdam:    ["Canals of Amsterdam", "Amsterdam"],
  prague:       ["Charles Bridge", "Prague Castle"],
  athens:       ["Parthenon"],
  cairo:        ["Giza pyramid complex", "Great Pyramid of Giza"],
  capetown:     ["Table Mountain"],
  nairobi:      ["Nairobi National Park"],
  marrakesh:    ["Jemaa el-Fnaa", "Koutoubia Mosque"],
  lagos:        ["National Arts Theatre, Lagos", "Lagos"],
  addis:        ["African Union Conference Center and Office Complex", "African Union", "Addis Ababa"],
  accra:        ["Black Star Gate", "Independence Square (Ghana)", "Accra"],
  dar:          ["Port of Dar es Salaam", "Dar es Salaam"],
  newyork:      ["Statue of Liberty"],
  vancouver:    ["Stanley Park"],
  mexico:       ["Zócalo", "Templo Mayor"],
  sanfrancisco: ["Golden Gate Bridge"],
  toronto:      ["CN Tower"],
  chicago:      ["Willis Tower"],
  havana:       ["Old Havana", "Havana"],
  panama:       ["Panama Canal"],
  rio:          ["Christ the Redeemer (statue)"],
  lima:         ["Plaza Mayor, Lima", "Historic Centre of Lima", "Lima"],
  sydney:       ["Sydney Opera House"],
  auckland:     ["Sky Tower (Auckland)"],
  buenosaires:  ["Obelisco de Buenos Aires"],
  santiago:     ["San Cristóbal Hill", "Santiago"],
  bogota:       ["Monserrate", "Gold Museum, Bogotá"],
  melbourne:    ["Federation Square"]
};

/* ---------------------------------------------------------------- utils */
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/* 위키미디어 예의 지키기: 요청 사이 간격 + 429/503 지수 백오프 재시도 */
const GAP = 350;              // 모든 요청 사이 최소 간격(ms)
const BACKOFF = [5000, 15000, 40000];
let lastCall = 0;

async function politeFetch(url, asJson) {
  const wait = GAP - (Date.now() - lastCall);
  if (wait > 0) await sleep(wait);

  for (let attempt = 0; ; attempt++) {
    lastCall = Date.now();
    let r;
    try {
      r = await fetch(url, { headers: UA });
    } catch (e) {
      if (attempt >= BACKOFF.length) throw e;
      await sleep(BACKOFF[attempt]);
      continue;
    }
    if (r.status === 429 || r.status === 503) {
      if (attempt >= BACKOFF.length) throw new Error("HTTP " + r.status);
      process.stdout.write("  … " + r.status + " 대기 " + (BACKOFF[attempt] / 1000) + "초\n");
      await sleep(BACKOFF[attempt]);
      continue;
    }
    if (!r.ok) throw new Error("HTTP " + r.status);
    return asJson ? r.json() : Buffer.from(await r.arrayBuffer());
  }
}

const getJSON = (url) => politeFetch(url, true);
const getBuf = (url) => politeFetch(url, false);
const strip = (s) => String(s || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

/* 영문 위키백과 요약 → 위키데이터 Q-id */
async function wikidataId(title) {
  const u = "https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(title.replace(/ /g, "_"));
  const s = await getJSON(u);
  return { qid: s.wikibase_item || null, original: s.originalimage && s.originalimage.source };
}

/* 위키데이터 P18(대표 사진) 파일명 */
async function p18(qid) {
  const u = "https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=" + qid + "&property=P18&format=json";
  const c = await getJSON(u);
  const arr = c.claims && c.claims.P18;
  if (!arr || !arr.length) return null;
  return arr[0].mainsnak.datavalue.value;
}

/* 공용 파일명 → 썸네일 URL + 라이선스 */
async function commonsInfo(fileName) {
  const u = "https://commons.wikimedia.org/w/api.php?action=query&titles=" +
    encodeURIComponent("File:" + fileName) +
    "&prop=imageinfo&iiprop=url|extmetadata|size|mime&iiurlwidth=" + WIDTH + "&format=json";
  const j = await getJSON(u);
  const page = Object.values(j.query.pages)[0];
  if (!page || !page.imageinfo) return null;
  const info = page.imageinfo[0];
  const em = info.extmetadata || {};
  return {
    file: fileName,
    url: (info.thumburl || info.url).split("?")[0],
    mime: info.mime,
    license: strip(em.LicenseShortName && em.LicenseShortName.value) || "확인 필요",
    artist: strip(em.Artist && em.Artist.value) || "미상",
    descPage: info.descriptionurl || ("https://commons.wikimedia.org/wiki/File:" + encodeURIComponent(fileName))
  };
}

/* 공용 파일 검색 (최후 폴백) */
async function commonsSearch(query) {
  const u = "https://commons.wikimedia.org/w/api.php?action=query&generator=search" +
    "&gsrsearch=" + encodeURIComponent(query) + "&gsrnamespace=6&gsrlimit=8" +
    "&prop=imageinfo&iiprop=url|extmetadata|size|mime&iiurlwidth=" + WIDTH + "&format=json";
  const j = await getJSON(u);
  if (!j.query || !j.query.pages) return null;
  const pages = Object.values(j.query.pages)
    .filter(p => p.imageinfo && /jpeg|png/.test(p.imageinfo[0].mime))
    .filter(p => p.imageinfo[0].width >= 800);
  if (!pages.length) return null;
  const p = pages[0], info = p.imageinfo[0], em = info.extmetadata || {};
  return {
    file: p.title.replace(/^File:/, ""),
    url: (info.thumburl || info.url).split("?")[0],
    mime: info.mime,
    license: strip(em.LicenseShortName && em.LicenseShortName.value) || "확인 필요",
    artist: strip(em.Artist && em.Artist.value) || "미상",
    descPage: info.descriptionurl || ""
  };
}

/* ----------------------------------------------------------------- main */
(async () => {
  global.window = global;
  require(path.join(ROOT, "data.js"));
  const CITIES = (global.CITY_PASSPORT_DATA && global.CITY_PASSPORT_DATA.CITIES) || global.CITIES;

  fs.mkdirSync(OUT, { recursive: true });

  /* 이어받기: 이미 받은 항목은 건너뛴다 */
  const mPath = path.join(OUT, "manifest.json");
  const manifest = fs.existsSync(mPath) ? JSON.parse(fs.readFileSync(mPath, "utf8")) : [];
  const done = new Set(manifest.filter(m => fs.existsSync(m.src)).map(m => m.id));
  const failed = [];

  for (const c of CITIES) {
    if (done.has(c.id)) { console.log("· " + c.id.padEnd(13) + c.city + "  (이미 받음)"); continue; }

    const titles = TITLES[c.id] || [c.city];
    let got = null, usedTitle = null;

    for (const t of titles) {
      try {
        const { qid } = await wikidataId(t);
        if (qid) {
          const f = await p18(qid);
          if (f) { got = await commonsInfo(f); usedTitle = t; }
        }
      } catch (e) { /* 다음 제목으로 */ }
      if (got) break;
    }
    /* 폴백: 공용 검색 */
    if (!got) {
      try {
        got = await commonsSearch(titles[0] + " " + c.country);
        usedTitle = titles[0] + " (검색)";
      } catch (e) { /* noop */ }
    }

    if (!got) {
      failed.push(c.id + " (" + c.city + " · " + c.landmark + ")");
      console.log("✗ " + c.id.padEnd(13) + c.city);
      continue;
    }

    /* 내려받기 */
    const ext = /png/.test(got.mime) ? ".png" : ".jpg";
    const tmp = path.join(OUT, c.id + ext);
    try {
      const buf = await getBuf(got.url);
      fs.writeFileSync(tmp, buf);
      manifest.push({
        id: c.id, city: c.city, country: c.country, landmark: c.landmark,
        src: tmp,
        out: c.city + "-" + c.landmark + ".png",
        title: usedTitle, file: got.file, license: got.license,
        artist: got.artist, page: got.descPage, bytes: buf.length
      });
      console.log("✓ " + c.id.padEnd(13) + c.city.padEnd(10) +
                  (buf.length / 1024).toFixed(0).padStart(5) + "KB  " + got.license);
    } catch (e) {
      failed.push(c.id + " (다운로드 실패: " + e.message + ")");
      console.log("✗ " + c.id.padEnd(13) + c.city + "  다운로드 실패");
    }
  }

  fs.writeFileSync(mPath, JSON.stringify(manifest, null, 2), "utf8");
  console.log("\n성공 " + manifest.length + " / 실패 " + failed.length);
  if (failed.length) console.log("실패 목록:\n  " + failed.join("\n  "));
})();
