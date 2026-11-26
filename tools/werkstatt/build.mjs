// Baut den Ordner für das Artifact „Welten-Werkstatt“: die 3D-Engine (Roblox-Vorschau 1:1) mit allen
// Modulen, die Modell-Bibliothek und die Himmelsbilder, dazu die Seite tools/werkstatt/index.html.
//
//   node tools/werkstatt/build.mjs <ziel> <pfad-zu-three@0.160.0>
//
// „three“ wird im Artifact direkt von jsDelivr geladen (feste Adresse statt Import-Map); OrbitControls und
// GLTFLoader liegen als Kopie bei und importieren dieselbe Adresse, damit es nur ein THREE gibt.

import fs from 'node:fs';
import path from 'node:path';

const [OUT, THREE_DIR] = process.argv.slice(2);
if (!OUT || !THREE_DIR) throw new Error('Aufruf: node tools/werkstatt/build.mjs <ziel> <pfad-zu-three>');
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
const ADDONS = {
  'three/addons/controls/OrbitControls.js': 'vendor/OrbitControls.js',
  'three/addons/loaders/GLTFLoader.js': 'vendor/GLTFLoader.js',
  '../utils/BufferGeometryUtils.js': 'vendor/BufferGeometryUtils.js',
};

fs.rmSync(OUT, { recursive: true, force: true });
const files = [];
const write = (rel, data) => {
  const f = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, data);
  files.push(rel);
};
const relTo = (fromRel, toRel) => {
  let r = path.relative(path.dirname(fromRel), toRel).split(path.sep).join('/');
  return r.startsWith('.') ? r : './' + r;
};
const IMPORT = /((?:import|export)[^'";]*?from\s*|import\(\s*|import\s+)(['"])([^'"]+)\2/g;
function rewrite(rel, src) {
  return src.replace(IMPORT, (m, pre, q, spec) => {
    if (spec === 'three') return `${pre}${q}${THREE_URL}${q}`;
    if (ADDONS[spec]) return `${pre}${q}${relTo(rel, ADDONS[spec])}${q}`;
    return m;
  });
}
const AFTER = {
  'js/rbx/models.js': (s) => {
    const a = "'../../assets/modelle/bibliothek.glb'", b = 'new GLTFLoader().loadAsync(URL_GLB)';
    if (!s.includes(a) || !s.includes(b)) throw new Error('models.js: Ladecode hat sich geändert, build.mjs anpassen');
    return s
      .replace(a, "'../../assets/modelle/bibliothek.glb.txt'")
      .replace(b, 'fetch(URL_GLB).then((r) => r.text()).then((t) => new GLTFLoader().parseAsync(Uint8Array.from(atob(t.trim()), (c) => c.charCodeAt(0)).buffer, \'\'))');
  },
};

// Module der Seite und alles, was sie importieren
const seen = new Set();
function walk(rel) {
  if (seen.has(rel)) return;
  seen.add(rel);
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  for (const m of src.matchAll(IMPORT)) {
    const spec = m[3];
    if (spec.startsWith('.')) walk(path.posix.normalize(path.posix.join(path.posix.dirname(rel), spec)));
  }
  write(rel, (AFTER[rel] || ((x) => x))(rewrite(rel, src)));
}
for (const entry of ['welten/js/robloxWorld.js', 'welten/js/worlds.js', 'welten/js/worldFactory.js', 'js/settings.js', 'spiel/js/uiDemo.js']) walk(entry); // uiDemo: Spiel-UI im Ablauf „Spawn“

// Zusätze aus three (examples/jsm)
const jsm = (p) => fs.readFileSync(path.join(THREE_DIR, 'examples/jsm', p), 'utf8');
write('vendor/OrbitControls.js', rewrite('vendor/OrbitControls.js', jsm('controls/OrbitControls.js')));
write('vendor/GLTFLoader.js', rewrite('vendor/GLTFLoader.js', jsm('loaders/GLTFLoader.js')));
write('vendor/BufferGeometryUtils.js', rewrite('vendor/BufferGeometryUtils.js', jsm('utils/BufferGeometryUtils.js')));

// Bilder und Modelle
// Artifacts liefern keine .glb aus: die Bytes als Base64-Text; models.js lädt den Text und gibt die Bytes
// direkt an GLTFLoader.parseAsync (keine weiteren Abrufe, auch keine data:-Adressen)
write('assets/modelle/bibliothek.glb.txt', fs.readFileSync(path.join(ROOT, 'assets/modelle/bibliothek.glb')).toString('base64'));
// Himmelsbilder samt Unterordnern (nacht/ für den Tag-Nacht-Wechsel)
const copyDir = (rel) => {
  for (const f of fs.readdirSync(path.join(ROOT, rel))) {
    const r = `${rel}/${f}`;
    if (fs.statSync(path.join(ROOT, r)).isDirectory()) copyDir(r);
    else write(r, fs.readFileSync(path.join(ROOT, r)));
  }
};
copyDir('assets/himmel');

// Seite
fs.copyFileSync(path.join(ROOT, 'tools/werkstatt/index.html'), path.join(OUT, 'index.html'));

// Liste für den Upload: { "pfad": "pfad" }
const map = Object.fromEntries(files.map((f) => [f, f]));
fs.writeFileSync(path.join(OUT, 'files.json'), JSON.stringify(map, null, 1));
const bytes = files.reduce((s, f) => s + fs.statSync(path.join(OUT, f)).size, 0);
console.log(`${files.length} Dateien, ${(bytes / 1e6).toFixed(1)} MB`);
