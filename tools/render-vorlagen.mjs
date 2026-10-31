// Rendert Haustiere als Vorlage-Bilder (weißer Hintergrund, 1024 px, drei Ansichten) für Hyper3D Rodin.
// Aufruf im Repo-Ordner:
//   python3 -m http.server 8765 &
//   node tools/render-vorlagen.mjs hund baer codedrache
// Bilder landen in haustiere/vorlagen/<id>-front|schraeg|seite.png
// Optional THREE_DIR=/pfad/zu/node_modules/three, falls cdn.jsdelivr.net nicht erreichbar ist.
import { createRequire } from 'module';
import { writeFileSync } from 'fs';
const { chromium } = createRequire(import.meta.url)('playwright');

const ids = process.argv.slice(2);
if (!ids.length) throw new Error('Haustier-IDs angeben, z. B. hund baer codedrache');
const VIEWS = [['front', 0], ['schraeg', 0.7], ['seite', Math.PI / 2]];

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
if (process.env.THREE_DIR) {
  await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**', (route) => {
    const rel = new URL(route.request().url()).pathname.replace('/npm/three@0.160.0/', '');
    return route.fulfill({ path: `${process.env.THREE_DIR}/${rel}`, contentType: 'application/javascript' });
  });
}
await page.goto('http://localhost:8765/haustiere/');
await page.waitForTimeout(1500);

for (const id of ids) {
  for (const [tag, yaw] of VIEWS) {
    const url = await page.evaluate(async ({ id, yaw }) => {
      const { THREE, makeEnvironment, makeScene } = await import('/haustiere/js/kit.js');
      const { createPet } = await import('/haustiere/js/petFactory.js');
      const { petById } = await import('/haustiere/js/pets.js');
      const c = document.createElement('canvas');
      const r = new THREE.WebGLRenderer({ canvas: c, antialias: true, preserveDrawingBuffer: true });
      r.setSize(1024, 1024, false);
      r.toneMapping = THREE.ACESFilmicToneMapping;
      const scene = makeScene(makeEnvironment(r));
      scene.background = new THREE.Color(0xffffff);
      const o = createPet(petById[id], { pedestal: false });
      o.update(1);
      o.root.traverse((x) => (x.isSprite || x.isPoints) && (x.visible = false));
      o.spinner.rotation.y = yaw;
      scene.add(o.root);
      o.root.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(o.model);
      const ctr = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3()).length();
      const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
      cam.position.set(ctr.x, ctr.y + size * 0.15, ctr.z + size * 1.75);
      cam.lookAt(ctr);
      r.render(scene, cam);
      return c.toDataURL('image/png');
    }, { id, yaw });
    writeFileSync(`haustiere/vorlagen/${id}-${tag}.png`, Buffer.from(url.split(',')[1], 'base64'));
    console.log(`haustiere/vorlagen/${id}-${tag}.png`);
  }
}
await browser.close();
