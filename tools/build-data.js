/* eslint-disable */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const src = fs.readFileSync(path.join(root, "script.js"), "utf8");
const start = src.indexOf("var CITIES = [");
const end = src.indexOf("\n];\n\n/* =========================================================================\n * [C]");
if (start < 0 || end < 0) {
  console.error("CITIES block not found");
  process.exit(1);
}
const citiesBlock = src.slice(start, end + 3);

let CITIES;
eval(citiesBlock.replace("var CITIES", "CITIES"));
console.log("Cities:", CITIES.length);

const CLIMATE = {
  seoul: { climateZone: "Dwa", tempJan: -2.4, tempJul: 25.7, annualRain: 1400, elevation: 38, population: 9500000 },
  tokyo: { climateZone: "Cfa", tempJan: 5.4, tempJul: 27.1, annualRain: 1530, elevation: 40, population: 14000000 },
  beijing: { climateZone: "Dwa", tempJan: -3.7, tempJul: 26.4, annualRain: 570, elevation: 44, population: 21800000 },
  shanghai: { climateZone: "Cfa", tempJan: 4.3, tempJul: 28.0, annualRain: 1166, elevation: 4, population: 24800000 },
  singapore: { climateZone: "Af", tempJan: 26.5, tempJul: 27.5, annualRain: 2340, elevation: 15, population: 5900000 },
  bangkok: { climateZone: "Aw", tempJan: 26.0, tempJul: 28.5, annualRain: 1498, elevation: 2, population: 10500000 },
  hanoi: { climateZone: "Cwa", tempJan: 17.0, tempJul: 29.5, annualRain: 1680, elevation: 16, population: 8500000 },
  jakarta: { climateZone: "Af", tempJan: 26.0, tempJul: 27.5, annualRain: 1800, elevation: 8, population: 10500000 },
  delhi: { climateZone: "BSh", tempJan: 14.3, tempJul: 31.7, annualRain: 790, elevation: 216, population: 32000000 },
  mumbai: { climateZone: "Aw", tempJan: 24.5, tempJul: 27.0, annualRain: 2420, elevation: 14, population: 20400000 },
  dubai: { climateZone: "BWh", tempJan: 19.0, tempJul: 35.5, annualRain: 94, elevation: 5, population: 3400000 },
  istanbul: { climateZone: "Cfa", tempJan: 6.0, tempJul: 23.5, annualRain: 820, elevation: 39, population: 15500000 },
  tehran: { climateZone: "BSk", tempJan: 4.0, tempJul: 30.0, annualRain: 230, elevation: 1200, population: 9000000 },
  doha: { climateZone: "BWh", tempJan: 19.0, tempJul: 36.0, annualRain: 75, elevation: 10, population: 2400000 },
  dhaka: { climateZone: "Aw", tempJan: 19.0, tempJul: 29.0, annualRain: 1850, elevation: 4, population: 22000000 },
  karachi: { climateZone: "BWh", tempJan: 18.0, tempJul: 30.0, annualRain: 230, elevation: 8, population: 16000000 },
  london: { climateZone: "Cfb", tempJan: 5.2, tempJul: 18.5, annualRain: 690, elevation: 11, population: 9000000 },
  paris: { climateZone: "Cfb", tempJan: 4.9, tempJul: 20.3, annualRain: 640, elevation: 35, population: 11000000 },
  rome: { climateZone: "Csa", tempJan: 7.5, tempJul: 24.5, annualRain: 830, elevation: 21, population: 4300000 },
  barcelona: { climateZone: "Csa", tempJan: 9.0, tempJul: 24.5, annualRain: 620, elevation: 12, population: 5600000 },
  berlin: { climateZone: "Cfb", tempJan: 0.5, tempJul: 19.0, annualRain: 570, elevation: 34, population: 3700000 },
  amsterdam: { climateZone: "Cfb", tempJan: 3.4, tempJul: 17.5, annualRain: 840, elevation: 2, population: 870000 },
  prague: { climateZone: "Dfb", tempJan: -0.9, tempJul: 18.3, annualRain: 530, elevation: 200, population: 1300000 },
  athens: { climateZone: "Csa", tempJan: 9.5, tempJul: 28.0, annualRain: 400, elevation: 70, population: 6600000 },
  cairo: { climateZone: "BWh", tempJan: 14.0, tempJul: 28.0, annualRain: 25, elevation: 23, population: 22000000 },
  capetown: { climateZone: "Csb", tempJan: 17.0, tempJul: 21.0, annualRain: 520, elevation: 10, population: 4600000 },
  nairobi: { climateZone: "Cwb", tempJan: 13.0, tempJul: 17.5, annualRain: 790, elevation: 1661, population: 4700000 },
  marrakesh: { climateZone: "BSh", tempJan: 12.0, tempJul: 28.5, annualRain: 240, elevation: 466, population: 930000 },
  lagos: { climateZone: "Aw", tempJan: 27.0, tempJul: 26.5, annualRain: 1800, elevation: 41, population: 15000000 },
  addis: { climateZone: "Cwb", tempJan: 14.0, tempJul: 16.0, annualRain: 1200, elevation: 2355, population: 5000000 },
  accra: { climateZone: "Aw", tempJan: 27.0, tempJul: 26.5, annualRain: 730, elevation: 61, population: 2500000 },
  dar: { climateZone: "Aw", tempJan: 28.0, tempJul: 24.5, annualRain: 1100, elevation: 12, population: 6700000 },
  newyork: { climateZone: "Cfa", tempJan: 0.5, tempJul: 24.5, annualRain: 1268, elevation: 10, population: 8400000 },
  vancouver: { climateZone: "Cfb", tempJan: 4.1, tempJul: 18.0, annualRain: 1190, elevation: 2, population: 2600000 },
  mexico: { climateZone: "Cwb", tempJan: 12.5, tempJul: 18.5, annualRain: 700, elevation: 2240, population: 22000000 },
  sanfrancisco: { climateZone: "Csb", tempJan: 10.0, tempJul: 17.5, annualRain: 570, elevation: 16, population: 870000 },
  toronto: { climateZone: "Dfa", tempJan: -3.7, tempJul: 22.0, annualRain: 790, elevation: 76, population: 2900000 },
  chicago: { climateZone: "Dfa", tempJan: -4.0, tempJul: 24.0, annualRain: 940, elevation: 179, population: 2700000 },
  havana: { climateZone: "Aw", tempJan: 22.0, tempJul: 28.0, annualRain: 1180, elevation: 59, population: 2100000 },
  panama: { climateZone: "Am", tempJan: 27.0, tempJul: 28.0, annualRain: 1900, elevation: 2, population: 880000 },
  rio: { climateZone: "Aw", tempJan: 25.0, tempJul: 26.0, annualRain: 1170, elevation: 2, population: 6700000 },
  lima: { climateZone: "BWh", tempJan: 19.0, tempJul: 19.5, annualRain: 6, elevation: 154, population: 10700000 },
  sydney: { climateZone: "Cfa", tempJan: 18.0, tempJul: 23.0, annualRain: 1210, elevation: 58, population: 5300000 },
  auckland: { climateZone: "Cfb", tempJan: 14.0, tempJul: 19.0, annualRain: 1210, elevation: 20, population: 1700000 },
  buenosaires: { climateZone: "Cfa", tempJan: 10.5, tempJul: 24.5, annualRain: 1000, elevation: 25, population: 3100000 },
  santiago: { climateZone: "Csb", tempJan: 9.0, tempJul: 20.5, annualRain: 280, elevation: 520, population: 6300000 },
  bogota: { climateZone: "Cfb", tempJan: 14.0, tempJul: 13.5, annualRain: 990, elevation: 2640, population: 8100000 },
  melbourne: { climateZone: "Cfb", tempJan: 14.0, tempJul: 20.5, annualRain: 650, elevation: 31, population: 5100000 }
};

function deriveFunctions(c) {
  var f = [];
  var text = (c.urbanFunction || "") + (c.industry || "") + (c.geography || "") + (c.keywords || []).join("");
  if (/수도/.test(text)) f.push("수도");
  if (/항만|항구|항/.test(text)) f.push("항구");
  if (/금융|은행/.test(text)) f.push("금융");
  if (/관광|축제|랜드마크/.test(text)) f.push("관광");
  if (/산업|제조|공업/.test(text)) f.push("산업");
  if (/교육|대학/.test(text)) f.push("교육");
  if (/문화|예술|박물관/.test(text)) f.push("문화");
  if (/석유|에너지|광업/.test(text)) f.push("자원");
  if (!f.length) f.push("도시");
  return f.slice(0, 4);
}

const byRegion = {};
CITIES.forEach(function (c) {
  if (!byRegion[c.region]) byRegion[c.region] = [];
  byRegion[c.region].push(c.id);
});

const META = {};
CITIES.forEach(function (c, i) {
  var cl = CLIMATE[c.id] || {
    climateZone: "?",
    tempJan: 15,
    tempJul: 25,
    annualRain: 800,
    elevation: 50,
    population: 1000000
  };
  var regionList = byRegion[c.region].filter(function (id) { return id !== c.id; });
  var related = regionList.slice(0, 2);
  if (related.length < 2) {
    var extra = CITIES.map(function (x) { return x.id; }).filter(function (id) {
      return id !== c.id && related.indexOf(id) < 0;
    });
    related.push(extra[(i * 3) % extra.length]);
  }
  META[c.id] = {
    stats: cl,
    functions: deriveFunctions(c),
    related: related.slice(0, 2)
  };
});

const header = [
  "/* =========================================================================",
  " * CITY PASSPORT · data.js",
  " * 도시 48개 · 퀴즈 · 좌표 + 수치·기능·비교 추천(CITY_META)",
  " * script.js보다 먼저 로드합니다.",
  " * ========================================================================= */",
  "(function (g) {",
  "\"use strict\";",
  ""
].join("\n");

const footer = [
  "",
  "  g.CITY_PASSPORT_DATA = { CITIES: CITIES, CITY_META: CITY_META };",
  "})(typeof window !== \"undefined\" ? window : this);",
  ""
].join("\n");

const metaStr = "var CITY_META = " + JSON.stringify(META, null, 2) + ";\n";
const out = header + citiesBlock + "\n\n" + metaStr + footer;

fs.writeFileSync(path.join(root, "data.js"), out, "utf8");
console.log("Wrote data.js", fs.statSync(path.join(root, "data.js")).size, "bytes");
