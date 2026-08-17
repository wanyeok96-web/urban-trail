const fs = require("fs");
const path = require("path");

const p = path.join(__dirname, "..", "script.js");
let s = fs.readFileSync(p, "utf8");
const start = s.indexOf("/* =========================================================================\n * [B] 도시 데이터");
const end = s.indexOf("\n];\n\n/* =========================================================================\n * [C]");
if (start < 0 || end < 0) {
  console.error("markers not found", start, end);
  process.exit(1);
}

const replacement = `/* =========================================================================
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
  });
}
mergeCityMeta();`;

s = s.slice(0, start) + replacement + s.slice(end + 3);
fs.writeFileSync(p, s, "utf8");
console.log("patched script.js", fs.statSync(p).size, "bytes");
