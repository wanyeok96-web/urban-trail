/* Fetch Natural Earth 110m GeoJSON and emit compact SVG path data. */
const fs = require("fs");
const path = require("path");
const https = require("https");

const MAP = { w: 1000, h: 520, latTop: 85, latBottom: -60 };
const URLS = [
  "https://cdn.jsdelivr.net/gh/datasets/geo-boundaries-world-110m@master/countries.geojson",
  "https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson"
];

function fetchUrl(url) {
  return new Promise(function (resolve, reject) {
    https.get(url, { headers: { "User-Agent": "city-passport-map-builder" } }, function (res) {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchUrl(res.headers.location).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(url + " HTTP " + res.statusCode));
        return;
      }
      const chunks = [];
      res.on("data", function (c) { chunks.push(c); });
      res.on("end", function () { resolve(Buffer.concat(chunks).toString("utf8")); });
    }).on("error", reject);
  });
}

function projX(lon) { return (lon + 180) / 360 * MAP.w; }
function projY(lat) { return (MAP.latTop - lat) / (MAP.latTop - MAP.latBottom) * MAP.h; }

function splitRing(ring) {
  const parts = [];
  let cur = [];
  for (let i = 0; i < ring.length; i++) {
    const pt = ring[i];
    if (!pt || pt.length < 2) continue;
    if (cur.length) {
      const prev = cur[cur.length - 1];
      if (Math.abs(pt[0] - prev[0]) > 180) {
        if (cur.length > 2) parts.push(cur);
        cur = [];
      }
    }
    cur.push(pt);
  }
  if (cur.length > 2) parts.push(cur);
  return parts;
}

function ringToPath(ring) {
  const pts = [];
  for (let i = 0; i < ring.length; i++) {
    const lon = ring[i][0], lat = ring[i][1];
    if (lat > MAP.latTop + 2 || lat < MAP.latBottom - 2) continue;
    const x = Math.round(projX(lon) * 10) / 10;
    const y = Math.round(projY(Math.max(MAP.latBottom, Math.min(MAP.latTop, lat))) * 10) / 10;
    if (pts.length) {
      const last = pts[pts.length - 1];
      if (last[0] === x && last[1] === y) continue;
    }
    pts.push([x, y]);
  }
  if (pts.length < 3) return "";
  let d = "M" + pts[0][0] + " " + pts[0][1];
  for (let i = 1; i < pts.length; i++) d += "L" + pts[i][0] + " " + pts[i][1];
  return d + "Z";
}

function geomPaths(geom) {
  const out = [];
  if (!geom) return out;
  const type = geom.type;
  let polys = [];
  if (type === "Polygon") polys = [geom.coordinates];
  else if (type === "MultiPolygon") polys = geom.coordinates;
  else return out;
  polys.forEach(function (poly) {
    if (!poly || !poly[0]) return;
    splitRing(poly[0]).forEach(function (ring) {
      const d = ringToPath(ring);
      if (d) out.push(d);
    });
  });
  return out;
}

async function main() {
  let raw = null, used = "";
  for (let i = 0; i < URLS.length; i++) {
    try {
      console.log("fetch", URLS[i]);
      raw = await fetchUrl(URLS[i]);
      used = URLS[i];
      break;
    } catch (e) {
      console.warn(e.message);
    }
  }
  if (!raw) throw new Error("GeoJSON download failed");
  const geo = JSON.parse(raw);
  const feats = geo.features || [];
  const paths = [];
  feats.forEach(function (f) {
    const name = (f.properties && (f.properties.NAME || f.properties.name || f.properties.ADMIN)) || "";
    if (/Antarctica/i.test(name)) return;
    geomPaths(f.geometry).forEach(function (d) { paths.push(d); });
  });
  const joined = paths.join("");
  const out = [
    "/* Natural Earth 110m countries → SVG paths (offline bundle)",
    " * source: " + used,
    " */",
    "(function (g) {",
    "\"use strict\";",
    "g.WORLD_LAND_PATH = " + JSON.stringify(joined) + ";",
    "})(typeof window !== \"undefined\" ? window : this);",
    ""
  ].join("\n");
  const dest = path.join(__dirname, "..", "world.js");
  fs.writeFileSync(dest, out, "utf8");
  console.log("wrote", dest, fs.statSync(dest).size, "bytes, rings", paths.length);
}

main().catch(function (e) {
  console.error(e);
  process.exit(1);
});
