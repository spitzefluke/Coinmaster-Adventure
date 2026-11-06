// Coinmaster Adventure · Modellbibliothek bauen
//
// Liest die Auswahl (auswahl.json) aus den CC0-Paketen (quellen.json, KayKit von Kay Lousberg), legt alle
// Modelle in EINE Datei assets/modelle/bibliothek.glb und schreibt welten/js/modelCatalog.js mit Größe und
// Mitte jedes Modells. Dieselbe .glb-Datei nutzen die Vorschau auf der Webseite und Roblox Studio
// (3D-Importer), darum sehen die Welten in beiden gleich aus.
//
//   cd tools/modelle && npm install && npm run build
//
// Die Pakete werden beim ersten Lauf nach tools/modelle/.cache geklont (git, öffentliche Repos).

import { NodeIO, Document, getBounds } from '@gltf-transform/core';
import { mergeDocuments, dedup, prune } from '@gltf-transform/functions';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const CACHE = path.join(HERE, '.cache');
const quellen = JSON.parse(fs.readFileSync(path.join(HERE, 'quellen.json'), 'utf8'));
const auswahl = JSON.parse(fs.readFileSync(path.join(HERE, 'auswahl.json'), 'utf8'));

// Paket holen (einmalig) und alle .gltf-Dateien darin nach Namen finden
const files = {};
function packFiles(pack) {
  if (files[pack]) return files[pack];
  const q = quellen[pack];
  const dir = path.join(CACHE, pack);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(CACHE, { recursive: true });
    execFileSync('git', ['clone', '--depth', '1', q.repo, dir], { stdio: 'inherit' });
  }
  const out = {};
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.gltf')) out[e.name.slice(0, -5)] = p;
    }
  };
  walk(path.join(dir, q.gltf));
  return (files[pack] = out);
}

const io = new NodeIO();
const doc = new Document();
doc.createBuffer();
// Ein Wurzelknoten: der 3D-Importer legt daraus ein Model „CoinmasterModelle“ mit einem MeshPart je Modell an
const scene = doc.createScene('CoinmasterModelle');
const rootNode = doc.createNode('CoinmasterModelle');
scene.addChild(rootNode);

const catalog = {};
const seen = new Set();
for (const entry of auswahl) {
  const id = entry.id;
  if (seen.has(id)) throw new Error(`doppelte Id ${id}`);
  seen.add(id);
  const file = packFiles(entry.pack)[entry.file || id];
  if (!file) throw new Error(`${id}: nicht im Paket ${entry.pack}`);
  const src = await io.read(file);
  const map = mergeDocuments(doc, src);
  // Knoten der eingelesenen Szene unter den Wurzelknoten hängen
  const srcScene = src.getRoot().listScenes()[0];
  const nodes = srcScene.listChildren().map((n) => map.get(n));
  for (const s of doc.getRoot().listScenes()) if (s !== scene) s.dispose();
  let node;
  if (nodes.length === 1) node = nodes[0];
  else {
    node = doc.createNode(id);
    for (const n of nodes) node.addChild(n);
  }
  node.setName(id);
  rootNode.addChild(node);
  // Größe und Mitte in Modell-Einheiten (wie der Importer das MeshPart misst)
  const b = getBounds(node);
  const size = b.max.map((v, i) => +(v - b.min[i]).toFixed(4));
  const center = b.max.map((v, i) => +((v + b.min[i]) / 2).toFixed(4));
  catalog[id] = { size, center, fest: entry.fest !== false, pack: entry.pack };
}
// Alle Puffer zu einem zusammenfassen, doppelte Texturen und Materialien entfernen
const buffer = doc.getRoot().listBuffers()[0];
for (const a of doc.getRoot().listAccessors()) a.setBuffer(buffer);
for (const b of doc.getRoot().listBuffers()) if (b !== buffer) b.dispose();
await doc.transform(dedup(), prune());

const outGlb = path.join(ROOT, 'assets/modelle/bibliothek.glb');
fs.mkdirSync(path.dirname(outGlb), { recursive: true });
await io.write(outGlb, doc);

const lizenzen = [...new Set(auswahl.map((e) => e.pack))].map((p) => `//   ${p}: ${quellen[p].repo} (${quellen[p].license})`).join('\n');
fs.writeFileSync(
  path.join(ROOT, 'welten/js/modelCatalog.js'),
  `// Automatisch erzeugt von tools/modelle/build.mjs, nicht von Hand ändern.
// Modelle in assets/modelle/bibliothek.glb: Größe und Mitte in Modell-Einheiten, fest = in Roblox begehbar/kollidierend.
// Quellen (alle CC0):
${lizenzen}
export const MODELS = ${JSON.stringify(catalog, null, 0).replace(/\},"/g, '},\n  "').replace(/^\{/, '{\n  ').replace(/\}\}$/, '},\n}')};
`,
);
const kb = Math.round(fs.statSync(outGlb).size / 1024);
console.log(`${Object.keys(catalog).length} Modelle, bibliothek.glb ${kb} KB`);
