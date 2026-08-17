/* =========================================================================
 * URBAN TRAIL · 특정 도시의 랜드마크 이미지 교체
 *   폴백으로 도시 일반 사진이 들어온 항목을 지정한 공용 파일로 바꾼다.
 *   실행: node tools/patch-landmarks.js
 * ========================================================================= */
"use strict";
const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "_dl");
const WIDTH = 1600;
const UA = { "User-Agent": "UrbanTrail-EDU/1.0 (high-school geography class material)" };

/* 도시 id → 위키미디어 공용 파일명 (랜드마크가 실제로 담긴 사진) */
const PATCH = {
  lagos: "National Arts Theatre, Lagos.jpg",
  addis: "African Union Conference Centre building.jpg"
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const strip = (s) => String(s || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

async function fetchRetry(url, asJson) {
  for (let i = 0; ; i++) {
    const r = await fetch(url, { headers: UA });
    if (r.status === 429 || r.status === 503) {
      if (i >= 3) throw new Error("HTTP " + r.status);
      const w = [5000, 15000, 40000][i];
      console.log("  … " + r.status + " 대기 " + (w / 1000) + "초");
      await sleep(w);
      continue;
    }
    if (!r.ok) throw new Error("HTTP " + r.status);
    return asJson ? r.json() : Buffer.from(await r.arrayBuffer());
  }
}

(async () => {
  const mPath = path.join(OUT, "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(mPath, "utf8"));

  for (const id of Object.keys(PATCH)) {
    const file = PATCH[id];
    const entry = manifest.find(m => m.id === id);
    if (!entry) { console.log("✗ " + id + " manifest에 없음"); continue; }

    const u = "https://commons.wikimedia.org/w/api.php?action=query&titles=" +
      encodeURIComponent("File:" + file) +
      "&prop=imageinfo&iiprop=url|extmetadata|size|mime&iiurlwidth=" + WIDTH + "&format=json";
    const j = await fetchRetry(u, true);
    const page = Object.values(j.query.pages)[0];
    if (!page || !page.imageinfo) { console.log("✗ " + id + " 파일 정보 없음: " + file); continue; }

    const info = page.imageinfo[0];
    const em = info.extmetadata || {};
    const url = (info.thumburl || info.url).split("?")[0];

    await sleep(500);
    const buf = await fetchRetry(url, false);

    /* 기존 원본 파일 교체 (확장자가 달라질 수 있으므로 이전 파일 정리) */
    const ext = /png/.test(info.mime) ? ".png" : ".jpg";
    [".jpg", ".png", ".JPG"].forEach(e => {
      const p = path.join(OUT, id + e);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    });
    const tmp = path.join(OUT, id + ext);
    fs.writeFileSync(tmp, buf);

    entry.src = tmp;
    entry.file = file;
    entry.title = file.replace(/\.[^.]+$/, "") + " (직접 지정)";
    entry.license = strip(em.LicenseShortName && em.LicenseShortName.value) || "확인 필요";
    entry.artist = strip(em.Artist && em.Artist.value) || "미상";
    entry.page = info.descriptionurl || "";
    entry.bytes = buf.length;

    console.log("✓ " + id.padEnd(8) + (buf.length / 1024).toFixed(0).padStart(5) + "KB  " +
                entry.license + "  ← " + file);
    await sleep(800);
  }

  fs.writeFileSync(mPath, JSON.stringify(manifest, null, 2), "utf8");
  console.log("\nmanifest.json 갱신 완료");
})();
