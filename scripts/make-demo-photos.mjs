import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const OUT = join(process.cwd(), "public", "demo");
mkdirSync(OUT, { recursive: true });

let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const range = (n) => Array.from({ length: n }, (_, i) => i);

const petal = (cx, cy, r, rot, fill, opacity = 1) =>
  `<path transform="translate(${cx} ${cy}) rotate(${rot})" d="M0 ${-r}C${r * 0.55} ${-r * 0.4} ${r * 0.55} ${r * 0.4} 0 ${r}C${-r * 0.55} ${r * 0.4} ${-r * 0.55} ${-r * 0.4} 0 ${-r}Z" fill="${fill}" opacity="${opacity}"/>`;

const mandala = (cx, cy, R, stroke, rings = 4, sw = 2) => range(rings).map((k) => {
  const r = R * (1 - k / rings);
  const n = 8 + k * 8;
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${stroke}" stroke-width="${sw}" opacity=".8"/>` +
    range(n).map((i) => {
      const a = (i / n) * 360;
      return `<path transform="translate(${cx} ${cy}) rotate(${a})" d="M0 ${-r}c${-r * 0.08} ${r * 0.12} ${-r * 0.08} ${r * 0.24} 0 ${r * 0.32}c${r * 0.08} ${-r * 0.08} ${r * 0.08} ${-r * 0.2} 0 ${-r * 0.32}Z" fill="none" stroke="${stroke}" stroke-width="${sw * 0.8}"/>`;
    }).join("");
}).join("");

const marigold = (x, y, r, c1, c2) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#mg${c1 === "#ffd65a" ? "Y" : "O"})"/>` +
  range(10).map((i) => `<circle cx="${x + Math.cos(i * 0.63) * r * 0.55}" cy="${y + Math.sin(i * 0.63) * r * 0.55}" r="${r * 0.28}" fill="${c2}" opacity=".35"/>`).join("");

const defs = `<defs>
  <radialGradient id="mgY" cx=".35" cy=".35" r=".8"><stop offset="0" stop-color="#ffe27a"/><stop offset="1" stop-color="#e8a317"/></radialGradient>
  <radialGradient id="mgO" cx=".35" cy=".35" r=".8"><stop offset="0" stop-color="#ffbe62"/><stop offset="1" stop-color="#d9571a"/></radialGradient>
  <radialGradient id="flame" cx=".5" cy=".7" r=".6"><stop offset="0" stop-color="#fff6c8"/><stop offset=".45" stop-color="#ffc23d"/><stop offset="1" stop-color="#ff7a1a" stop-opacity="0"/></radialGradient>
  <radialGradient id="glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd27a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
  <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6e2a8"/><stop offset=".5" stop-color="#b88a3a"/><stop offset="1" stop-color="#f0d58f"/></linearGradient>
</defs>`;

const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs}${body}</svg>`;

const scenes = [
  ["Marigold toran", 1600, 1067, (w, h) => `<rect width="${w}" height="${h}" fill="#5c1622"/>
    ${range(5).map((row) => `<path d="M0 ${80 + row * 210} Q ${w / 2} ${170 + row * 210} ${w} ${80 + row * 210}" fill="none" stroke="#8a5a1e" stroke-width="5"/>` +
      range(34).map((i) => { const x = i * 48 + 12; const t = x / w; const y = 80 + row * 210 + Math.sin(t * Math.PI) * 90; return marigold(x, y, 24, i % 2 ? "#ffd65a" : "#ffb04d", "#fff2b0"); }).join("")).join("")}`],
  ["Diyas at dusk", 1600, 1067, (w, h) => `<rect width="${w}" height="${h}" fill="#1d0b1a"/><rect width="${w}" height="${h}" fill="url(#glow)" opacity=".4"/>
    ${range(60).map(() => `<circle cx="${rnd() * w}" cy="${rnd() * h * 0.6}" r="${2 + rnd() * 3}" fill="#ffd27a" opacity="${0.2 + rnd() * 0.5}"/>`).join("")}
    ${range(9).map((i) => { const x = 110 + i * 172; const y = 760 + (i % 2) * 70; return `<circle cx="${x}" cy="${y - 70}" r="150" fill="url(#glow)"/>
      <path d="M${x - 70} ${y}Q${x} ${y + 70} ${x + 70} ${y}Z" fill="#b5652b"/><path d="M${x - 70} ${y}H${x + 70}" stroke="#7a3d16" stroke-width="6"/>
      <ellipse cx="${x}" cy="${y - 42}" rx="20" ry="46" fill="url(#flame)"/>`; }).join("")}`],
  ["Golden mandala", 1067, 1600, (w, h) => `<rect width="${w}" height="${h}" fill="#fbf3e6"/>${mandala(w / 2, h / 2, 470, "#b88a3a", 6, 2.5)}${mandala(w / 2, h / 2, 120, "#b9727c", 3, 2)}`],
  ["Mehndi patterns", 1600, 1067, (w, h) => `<rect width="${w}" height="${h}" fill="#f3e2c7"/>
    ${range(6).map((i) => mandala(160 + (i % 3) * 640, 260 + Math.floor(i / 3) * 540, 210, "#7a3d16", 4, 2.2)).join("")}
    ${range(40).map(() => petal(rnd() * w, rnd() * h, 18 + rnd() * 14, rnd() * 360, "none")).join("").replace(/fill="none"/g, 'fill="none" stroke="#7a3d16" stroke-width="2"')}`],
  ["Rangoli", 1600, 1600, (w, h) => `<rect width="${w}" height="${h}" fill="#2b1031"/>
    ${range(7).reverse().map((k) => { const cols = ["#ff4d6d", "#ffb703", "#8338ec", "#06d6a0", "#fb8500", "#ef476f", "#ffd166"]; const n = 8 + k * 4; const r = 110 + k * 95;
      return range(n).map((i) => petal(w / 2 + Math.cos((i / n) * 2 * Math.PI) * r, h / 2 + Math.sin((i / n) * 2 * Math.PI) * r, 48 + k * 6, (i / n) * 360 + 90, cols[k])).join(""); }).join("")}
    <circle cx="${w / 2}" cy="${h / 2}" r="70" fill="#ffd166"/><circle cx="${w / 2}" cy="${h / 2}" r="34" fill="#ef476f"/>`],
  ["The couple's seal", 1600, 1067, (w, h) => `<rect width="${w}" height="${h}" fill="#f6e7e2"/>${mandala(w / 2, h / 2, 520, "#e6c9c3", 5, 2)}
    ${range(28).map((i) => `<circle cx="${w / 2}" cy="${h / 2 - 240}" r="22" fill="url(#gold)" transform="rotate(${(i / 28) * 360} ${w / 2} ${h / 2})"/>`).join("")}
    <circle cx="${w / 2}" cy="${h / 2}" r="226" fill="url(#gold)"/><circle cx="${w / 2}" cy="${h / 2}" r="150" fill="#6d1a28" stroke="url(#gold)" stroke-width="10"/>
    <text x="${w / 2}" y="${h / 2 + 32}" text-anchor="middle" font-family="Georgia, serif" font-size="96" fill="#f0d58f">N &amp; R</text>`],
  ["Palace arches", 1600, 1067, (w, h) => `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7b267"/><stop offset=".6" stop-color="#f4845f"/><stop offset="1" stop-color="#c0392b"/></linearGradient></defs>
    <rect width="${w}" height="${h}" fill="url(#sky)"/><circle cx="${w / 2}" cy="${h * 0.62}" r="170" fill="#ffe8a3" opacity=".9"/>
    <path d="M0 ${h}V0H${w}V${h}Z ${range(5).map((i) => { const x = 80 + i * 300, a = 120; return `M${x} ${h - 60}V420C${x} 330 ${x + 60} 300 ${x + a} 220C${x + 180} 300 ${x + 240} 330 ${x + 240} 420V${h - 60}Z`; }).join(" ")}" fill="#3a0d16" fill-rule="evenodd"/>`],
  ["Rose petals", 1600, 1067, (w, h) => `<rect width="${w}" height="${h}" fill="#fdf6ef"/>
    ${range(140).map(() => petal(rnd() * w, rnd() * h, 16 + rnd() * 26, rnd() * 360, ["#d94f68", "#e7798a", "#f2a3ae", "#b9324b"][Math.floor(rnd() * 4)], 0.75 + rnd() * 0.25)).join("")}`],
  ["Lotus pond", 1600, 1067, (w, h) => `<defs><linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a6f6a"/><stop offset="1" stop-color="#123f3c"/></linearGradient></defs>
    <rect width="${w}" height="${h}" fill="url(#water)"/>
    ${range(14).map(() => `<ellipse cx="${rnd() * w}" cy="${rnd() * h}" rx="${70 + rnd() * 60}" ry="${30 + rnd() * 20}" fill="#3f8f4e" opacity=".85"/>`).join("")}
    ${range(7).map(() => { const x = 120 + rnd() * (w - 240), y = 160 + rnd() * (h - 320); return range(9).map((i) => petal(x + Math.cos(i * 0.7 - 1.6) * 34, y + Math.sin(i * 0.7 - 1.6) * 14 - 20, 46, (i - 4) * 18, i % 2 ? "#f6b3c2" : "#e7798a")).join("") + `<circle cx="${x}" cy="${y}" r="14" fill="#ffd166"/>`; }).join("")}`],
  ["Sangeet lights", 1067, 1600, (w, h) => `<rect width="${w}" height="${h}" fill="#140a1f"/>
    ${range(70).map(() => { const c = ["#ffd27a", "#ff9ec4", "#9fd8ff", "#ffb36b"][Math.floor(rnd() * 4)]; return `<circle cx="${rnd() * w}" cy="${rnd() * h}" r="${20 + rnd() * 70}" fill="${c}" opacity="${0.08 + rnd() * 0.22}"/>`; }).join("")}
    ${range(6).map((k) => `<path d="M0 ${200 + k * 250} Q ${w / 2} ${330 + k * 250} ${w} ${200 + k * 250}" fill="none" stroke="#3b2b48" stroke-width="3"/>` +
      range(14).map((i) => { const x = i * 80 + 20, t = x / w; return `<circle cx="${x}" cy="${200 + k * 250 + Math.sin(t * Math.PI) * 130 + 14}" r="10" fill="#ffe7a0"/>`; }).join("")).join("")}`],
  ["Varmala", 1600, 1067, (w, h) => `<rect width="${w}" height="${h}" fill="#f7efe3"/>
    ${[w / 2 - 330, w / 2 + 330].map((cx) => range(48).map((i) => { const a = (i / 48) * 2 * Math.PI; return marigold(cx + Math.cos(a) * 260, h / 2 + Math.sin(a) * 300, 22, i % 3 ? "#ffd65a" : "#ffb04d", "#fff2b0") + (i % 4 === 0 ? petal(cx + Math.cos(a) * 225, h / 2 + Math.sin(a) * 262, 16, (a * 180) / Math.PI, "#d94f68") : ""); }).join("")).join("")}`],
  ["Haldi morning", 1600, 1067, (w, h) => `<rect width="${w}" height="${h}" fill="#ffd23f"/><rect width="${w}" height="${h}" fill="url(#glow)" opacity=".5"/>
    ${range(110).map(() => petal(rnd() * w, rnd() * h, 14 + rnd() * 20, rnd() * 360, ["#ff9f1c", "#ffbf69", "#e76f51", "#fff3b0"][Math.floor(rnd() * 4)], 0.9)).join("")}
    ${mandala(w / 2, h / 2, 260, "#c97c00", 4, 3)}`],
];

const manifest = [];
for (const [i, [title, w, h, draw]] of scenes.entries()) {
  const name = `demo-${String(i + 1).padStart(2, "0")}`;
  const base = sharp(Buffer.from(svg(w, h, draw(w, h))), { density: 96 });
  const jpg = await base.clone().jpeg({ quality: 86, mozjpeg: true }).toBuffer();
  writeFileSync(join(OUT, `${name}.jpg`), jpg);
  writeFileSync(join(OUT, `${name}-thumb.webp`), await sharp(jpg).resize({ width: 600, height: 600, fit: "inside" }).webp({ quality: 76 }).toBuffer());
  writeFileSync(join(OUT, `${name}-preview.webp`), await sharp(jpg).resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true }).webp({ quality: 84 }).toBuffer());
  manifest.push({ id: name, title, width: w, height: h });
  console.log(`✓ ${name}  ${title}  ${w}×${h}  ${(jpg.length / 1024).toFixed(0)} KB`);
}
writeFileSync(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
