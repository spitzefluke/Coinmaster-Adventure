// Haustiere aus Admin Egg und Release Egg
import { THREE, TAU, glowSprite, v3 } from './kit.js';
import { quad, lizard, furMat, collar, whiskers, spots, spot, swarm, blink, makeEars, featherWing } from './templates.js';

const gold = (b, o = {}) => b.mat('#f2c14e', { metal: 1, rough: 0.22, ...o });
const RAINBOW = ['#ff4d6d', '#ff9f43', '#ffe14d', '#3ddc84', '#3ec9ff', '#7a5cff', '#ff5fd2'];

function codeCanvas(b, glowOnly, color = '#ff3a52') {
  const rnd = (() => { let s = 4242; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  const words = ['if', 'fn', 'let', '0x1F', 'ban()', '=>', '{', '}', 'root', 'sudo', 'void', 'null', '01101', 'admin', 'kick', '&&', 'return', 'egg'];
  return b.ctex(512, 512, (ctx, s) => {
    ctx.fillStyle = glowOnly ? '#000' : '#140a0e';
    ctx.fillRect(0, 0, s, s);
    ctx.font = '600 18px "JetBrains Mono", ui-monospace, monospace';
    ctx.textBaseline = 'top';
    for (let y = 4; y < s; y += 22) {
      let x = 4 + Math.floor(rnd() * 4) * 18;
      while (x < s) {
        const w = words[Math.floor(rnd() * words.length)];
        ctx.fillStyle = glowOnly ? `rgba(255,58,82,${0.35 + rnd() * 0.65})` : `rgba(120,30,44,${0.6 + rnd() * 0.4})`;
        ctx.fillText(w, x, y);
        x += ctx.measureText(w + ' ').width;
      }
    }
  }, { wrap: true, repeat: [2, 2] });
}

function giftBox(b, parent, w = 0.7, h = 0.5, d = 0.6) {
  const red = b.mat('#e0243a', { rough: 0.45, coat: 0.6, sheen: 0.3 });
  const rib = gold(b, { coat: 1 });
  b.rbox(parent, red, [0, h / 2, 0], [w, h, d], 0.03);
  b.rbox(parent, red, [0, h + 0.03, 0], [w + 0.05, 0.08, d + 0.05], 0.025);
  b.rbox(parent, rib, [0, h / 2 + 0.02, 0], [0.09, h + 0.1, d + 0.07], 0.01);
  b.rbox(parent, rib, [0, h / 2 + 0.02, 0], [w + 0.07, h + 0.1, 0.09], 0.01);
  return h + 0.07;
}

export const BUILDERS = {
  // ── Admin Egg ──
  glitchhund(b) {
    const dog = b.group(b.model);
    const m = b.mat('#25252d', { rough: 0.35, metal: 0.7, surf: 'panel', ns: 0.4 });
    const lite = b.mat('#3a3a46', { rough: 0.35, metal: 0.6 });
    const red = b.mat('#ff2e48', { glow: '#ff2e48', ei: 1.8 });
    b.rbox(dog, m, [0, 0.55, 0], [0.5, 0.42, 0.95], 0.05);
    b.rbox(dog, lite, [0, 0.5, 0.42], [0.42, 0.34, 0.16], 0.04);
    for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      b.rbox(dog, m, [sx * 0.17, 0.22, sz * 0.33], [0.13, 0.4, 0.13], 0.03);
      b.rbox(dog, lite, [sx * 0.17, 0.035, sz * 0.33 + 0.03], [0.16, 0.07, 0.2], 0.02);
      b.rbox(dog, red, [sx * 0.236, 0.28, sz * 0.33], [0.01, 0.16, 0.025], 0.004);
    }
    for (const sx of [1, -1]) {
      b.rbox(dog, red, [sx * 0.252, 0.6, 0], [0.01, 0.025, 0.7], 0.005);
      b.rbox(dog, red, [sx * 0.252, 0.6, -0.2], [0.01, 0.18, 0.025], 0.005);
      b.rbox(dog, red, [sx * 0.252, 0.6, 0.2], [0.01, 0.12, 0.025], 0.005);
    }
    b.rbox(dog, red, [0, 0.765, 0], [0.025, 0.01, 0.8], 0.005);
    b.rbox(dog, m, [0, 0.82, 0.38], [0.26, 0.3, 0.24], 0.04);
    const head = b.group(dog, [0, 1.04, 0.52]);
    b.rbox(head, m, [0, 0, 0], [0.42, 0.36, 0.38], 0.05);
    b.rbox(head, lite, [0, -0.08, 0.26], [0.26, 0.18, 0.2], 0.04);
    b.rbox(head, b.mat('#0a0a0e', { rough: 0.2, coat: 1 }), [0, -0.02, 0.37], [0.09, 0.06, 0.04], 0.015);
    for (const sx of [1, -1]) {
      b.rbox(head, red, [sx * 0.1, 0.05, 0.19], [0.085, 0.085, 0.02], 0.008);
      b.rbox(head, m, [sx * 0.15, 0.25, -0.06], [0.1, 0.2, 0.06], 0.02, [0, 0, -sx * 0.2]);
    }
    const tail = b.group(dog, [0, 0.72, -0.48]);
    b.rbox(tail, m, [0, 0.1, -0.08], [0.08, 0.08, 0.3], 0.02, [-0.8, 0, 0]);
    const sign = b.group(b.model, [0, 1.6, 0.5]);
    sign.userData.nofit = true;
    b.cone(sign, red, [0, -0.1, 0], 0.13, 0.2, null, [1, 1, 0.15], 3);
    b.rbox(sign, b.mat('#ffffff', { glow: '#ffffff', ei: 1 }), [0, -0.02, 0.025], [0.022, 0.07, 0.01], 0.005);
    b.rbox(sign, b.mat('#ffffff', { glow: '#ffffff', ei: 1 }), [0, -0.08, 0.025], [0.022, 0.022, 0.01], 0.005);
    const ghosts = ['#ff2e48', '#2ef2ff'].map((c) => {
      const gh = dog.clone();
      const gm = b.basic(c, { opacity: 0.55 });
      gh.traverse((o) => o.isMesh && (o.material = gm));
      gh.userData.nofit = true;
      gh.visible = false;
      b.model.add(gh);
      return gh;
    });
    let until = 0;
    b.on((t) => {
      head.rotation.y = Math.sin(t * 0.8) * 0.2;
      tail.rotation.y = Math.sin(t * 10) * 0.5;
      sign.position.y = 1.6 + Math.sin(t * 2) * 0.04;
      sign.rotation.y = t;
      if (t > until + 1.2 && Math.random() < 0.03) until = t + 0.25;
      const on = t < until;
      ghosts.forEach((gh, i) => {
        gh.visible = on;
        gh.position.x = on ? (i ? 1 : -1) * (0.04 + Math.random() * 0.05) : 0;
        gh.position.y = on ? (Math.random() - 0.5) * 0.03 : 0;
      });
      dog.position.x = on ? (Math.random() - 0.5) * 0.06 : 0;
      head.position.x = on ? (Math.random() - 0.5) * 0.1 : 0;
      red.emissiveIntensity = on ? 4 : 1.6 + Math.sin(t * 3) * 0.3;
    });
  },

  banhammer(b) {
    const q = lizard(b, { color: '#3d5a2a', belly: '#c9c68e', len: 1.25, bodyR: 0.15, bodyW: 0.25, headR: 0.17, snoutL: 0.42, tailL: 1.2, tailR: 0.13, iris: '#ffcf3a', bodyY: 0.22 });
    const scute = b.mat('#2a3f1c', { rough: 0.5, coat: 0.4 });
    for (let i = 0; i < 10; i++) for (const sx of [1, -1]) b.cone(q.body, scute, [sx * 0.07, q.P.bodyR * 0.9, q.P.len * 0.42 - i * 0.1], 0.035, 0.06, null, [1, 1, 1.4], 4);
    const c = q.tailMesh.userData.curve;
    for (let i = 1; i < 14; i++) {
      const p = c.getPointAt(i / 16);
      b.cone(q.tail, scute, [p.x, p.y + q.P.tailR * (1 - i / 16) * 0.9, p.z], 0.03 * (1 - i / 20), 0.07 * (1 - i / 20), null, null, 4);
    }
    const H = q.H, tooth = b.mat('#f6f1e0', { rough: 0.3, coat: 0.6 });
    for (const sx of [1, -1]) for (let i = 0; i < 7; i++) b.cone(q.head, tooth, [sx * H * 0.5, -H * 0.3, H * 0.3 + i * 0.07], 0.014, 0.05, [Math.PI, 0, 0]);
    // Ban-Hammer quer im Maul
    const hm = b.group(q.head, [0, -H * 0.22, H * 0.9]);
    b.limb(hm, b.mat('#2a2a33', { rough: 0.35, metal: 0.6 }), [-0.62, 0, 0], [0.38, 0, 0], 0.03, 0.03);
    for (const x of [-0.1, 0.1, 0.3]) b.torus(hm, b.mat('#ff2e48', { glow: '#ff2e48', ei: 1.2 }), [x, 0, 0], 0.033, 0.01, [0, Math.PI / 2, 0]);
    const headM = b.mat('#c81e34', { rough: 0.35, metal: 0.3, coat: 1, glow: '#ff2e48', ei: 0.3 });
    const steel = b.mat('#c8ccd6', { metal: 1, rough: 0.25 });
    const hh = b.group(hm, [-0.72, 0, 0]);
    b.rbox(hh, headM, [0, 0, 0], [0.26, 0.44, 0.26], 0.04);
    for (const y of [-0.24, 0.24]) b.rbox(hh, steel, [0, y, 0], [0.29, 0.06, 0.29], 0.02);
    const banTex = b.ctex(256, 128, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 86px "JetBrains Mono", ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('BAN', w / 2, h / 2 + 4);
    });
    const labelM = b.track(new THREE.MeshBasicMaterial({ map: banTex, transparent: true, color: '#ffffff' }));
    for (const [rot, pos] of [[0, [0, 0, 0.132]], [Math.PI, [0, 0, -0.132]], [Math.PI / 2, [0.132, 0, 0]], [-Math.PI / 2, [-0.132, 0, 0]]]) {
      const l = b.place(new THREE.Mesh(b.track(new THREE.PlaneGeometry(0.22, 0.11)), labelM), hh, pos, null, [0, rot, Math.PI / 2]);
      l.userData.nofit = true;
    }
    const hg = glowSprite('#ff2e48', 0.9, 0.35);
    hh.add(hg);
    b.on((t) => {
      headM.emissiveIntensity = 0.3 + Math.max(0, Math.sin(t * 2.2)) * 0.8;
      hg.material.opacity = 0.25 + Math.max(0, Math.sin(t * 2.2)) * 0.4;
    });
  },

  lagschwein(b) {
    const q = quad(b, { color: '#f4a6b2', len: 0.95, bodyR: 0.34, bodyW: 0.33, legH: 0.22, legR: 0.07, headR: 0.28, headUp: 0.0, headFwd: 0.04, snoutL: 0.06, snoutR: 0.13, ear: 'pointy', earS: 0.9, innerEar: '#e07a8c', tail: 'curly', tailR: 0.025, hoof: '#c96a7a', iris: '#2a1418', nose: '#f4a6b2', matOpts: { surf: 'short', ns: 0.3, sheenColor: '#ffd8e0' } });
    const snoutM = b.mat('#f08a9c', { rough: 0.5, sheen: 0.4 });
    b.cyl(q.head, snoutM, [0, q.snY + 0.01, q.snZ + 0.06], 0.11, 0.12, 0.09, [Math.PI / 2, 0, 0], 32);
    for (const sx of [1, -1]) b.ball(q.head, b.mat('#8a3a4a', { rough: 0.6 }), [sx * 0.04, q.snY + 0.01, q.snZ + 0.105], [0.02, 0.03, 0.01]);
    q.ears.forEach((e) => (e.userData.rx = e.rotation.x = 0.5));
    const spin = b.group(q.g, [0, q.hy + 0.55, q.hz - 0.05]);
    spin.userData.nofit = true;
    const dots = Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * TAU;
      const m = b.track(new THREE.MeshBasicMaterial({ color: '#ff4058', transparent: true }));
      return b.ball(spin, m, [Math.cos(a) * 0.15, Math.sin(a) * 0.15, 0], 0.03);
    });
    const pingTex = b.ctex(256, 64, (ctx, w, h) => {
      ctx.fillStyle = '#ff4058';
      ctx.font = '700 40px "JetBrains Mono", ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('999 ms', w / 2, h / 2);
    });
    const ping = b.place(new THREE.Mesh(b.track(new THREE.PlaneGeometry(0.4, 0.1)), b.track(new THREE.MeshBasicMaterial({ map: pingTex, transparent: true }))), spin, [0, -0.27, 0]);
    // Ruckeln: 4 Bilder pro Sekunde, zwischendurch Standbild und Zurückspringen
    b.warp = (t) => {
      const c = t % 3.2, tt = c > 2.4 ? t - c + 2.4 : t;
      return Math.floor(tt * 4) / 4;
    };
    b.on((tt, t) => {
      const k = Math.floor(t * 10) % 8;
      dots.forEach((d, i) => (d.material.opacity = 0.15 + 0.85 * (((i - k + 8) % 8) / 7)));
      spin.rotation.y = Math.sin(t * 0.5) * 0.3;
      q.g.position.z = (Math.floor(tt / 1.6) % 2) * 0.08;
    });
  },

  uivogel(b) {
    const g = b.group(b.model);
    const fl = b.group(g, [0, 0.36, 0]);
    const win = b.mat('#f3f3f7', { rough: 0.35, coat: 0.5 });
    const bar = b.mat('#24242c', { rough: 0.4 });
    const red = b.mat('#ff2e48', { glow: '#ff2e48', ei: 0.8 });
    const blue = b.mat('#4a7dff', { glow: '#4a7dff', ei: 0.5 });
    const gray = b.mat('#c4c4cc', { rough: 0.4 });
    for (const sx of [1, -1]) {
      b.limb(g, gray, [sx * 0.09, 0.38, 0], [sx * 0.09, 0.05, 0.02], 0.018, 0.018);
      b.rbox(g, gray, [sx * 0.09, 0.025, 0.06], [0.08, 0.035, 0.2], 0.012);
      b.rbox(g, blue, [sx * 0.09, 0.045, 0.1], [0.06, 0.01, 0.1], 0.004);
    }
    b.rbox(fl, win, [0, 0.35, 0], [0.62, 0.48, 0.34], 0.05);
    b.rbox(fl, bar, [0, 0.62, 0], [0.64, 0.09, 0.36], 0.03);
    [red, gray, gray].forEach((m, i) => b.cyl(fl, m, [0.24 - i * 0.06, 0.62, 0.182], 0.018, 0.018, 0.01, [Math.PI / 2, 0, 0], 16));
    for (let i = 0; i < 3; i++) b.rbox(fl, gray, [-0.06, 0.48 - i * 0.07, 0.172], [0.34 - i * 0.08, 0.025, 0.01], 0.006);
    b.rbox(fl, blue, [0.19, 0.42, 0.172], [0.09, 0.09, 0.01], 0.012);
    b.rbox(fl, b.mat('#ffffff'), [0.17, 0.41, 0.18], [0.04, 0.012, 0.006], 0.003, [0, 0, -0.8]);
    b.rbox(fl, b.mat('#ffffff'), [0.205, 0.425, 0.18], [0.07, 0.012, 0.006], 0.003, [0, 0, 0.9]);
    b.rbox(fl, gray, [0, 0.2, 0.172], [0.46, 0.04, 0.01], 0.01);
    b.rbox(fl, blue, [-0.08, 0.2, 0.178], [0.28, 0.035, 0.01], 0.01);
    const head = b.group(fl, [0, 0.86, 0.1]);
    b.rbox(head, win, [0, 0, 0], [0.34, 0.28, 0.3], 0.05);
    b.rbox(head, bar, [0, 0.13, 0], [0.35, 0.05, 0.31], 0.02);
    const eyes = [1, -1].map((sx) => {
      const e = b.group(head, [sx * 0.08, 0.0, 0.152]);
      b.torus(e, bar, [0, 0, 0], 0.04, 0.008);
      b.ball(e, blue, [0, 0, 0.005], [0.022, 0.022, 0.01]);
      return e;
    });
    blink(b, eyes);
    const arrow = new THREE.Shape();
    [[0, 0], [0, -0.32], [0.08, -0.24], [0.14, -0.37], [0.19, -0.35], [0.13, -0.22], [0.23, -0.22]].forEach(([x, y], i) => (i ? arrow.lineTo(x, y) : arrow.moveTo(x, y)));
    arrow.closePath();
    b.extrude(head, bar, arrow, 0.04, [-0.05, -0.05, 0.4], [Math.PI / 2, 0, 0], 0.5, 0.008);
    for (let i = -1; i <= 1; i++) b.rbox(head, i ? gray : red, [i * 0.07, 0.2, -0.02 - Math.abs(i) * 0.03], [0.06, 0.1, 0.02], 0.008, [0, 0, -i * 0.25]);
    const wings = [1, -1].map((s) => {
      const w = b.group(fl, [s * 0.3, 0.45, 0]);
      b.rbox(w, win, [s * 0.22, 0, 0], [0.42, 0.26, 0.04], 0.02, [0, 0, s * 0.15]);
      b.rbox(w, bar, [s * 0.22, 0.1, 0.01], [0.42, 0.05, 0.045], 0.015, [0, 0, s * 0.15]);
      b.rbox(w, gray, [s * 0.22, -0.03, 0.025], [0.3, 0.012, 0.01], 0.004, [0, 0, s * 0.15]);
      b.cyl(w, blue, [s * 0.26, -0.026, 0.03], 0.025, 0.025, 0.02, [Math.PI / 2, 0, 0], 16);
      return [w, s];
    });
    for (let i = -1; i <= 1; i++) b.rbox(fl, i ? win : blue, [i * 0.08, 0.3, -0.3], [0.12, 0.04, 0.3], 0.015, [0.3, i * 0.3, 0]);
    b.on((t) => {
      fl.position.y = 0.36 + Math.sin(t * 2) * 0.02;
      wings.forEach(([w, s]) => (w.rotation.z = s * Math.sin(t * 5) * 0.35));
      head.rotation.z = Math.sin(t * 1.3) * 0.12;
    });
  },

  dateikatze(b) {
    const g = b.group(b.model);
    const folder = b.mat('#2a2a33', { rough: 0.4, metal: 0.3 });
    b.rbox(g, folder, [0, 0.05, 0], [0.8, 0.1, 0.6], 0.03);
    b.rbox(g, b.mat('#ff2e48', { glow: '#ff2e48', ei: 0.6 }), [-0.2, 0.11, -0.2], [0.3, 0.04, 0.2], 0.015);
    const fl = b.group(g, [0, 0.42, 0]);
    const paper = b.mat('#f4f6fa', { rough: 0.5, surf: 'short', ns: 0.15 });
    const line = b.mat('#a8adbb', { rough: 0.5 });
    b.rbox(fl, paper, [0, 0.3, 0], [0.46, 0.56, 0.12], 0.025);
    b.rbox(fl, b.mat('#d5d9e2', { rough: 0.5 }), [0.17, 0.52, 0.064], [0.11, 0.11, 0.01], 0.006, [0, 0, Math.PI / 4]);
    b.rbox(fl, b.mat('#ff2e48', { glow: '#ff2e48', ei: 0.5 }), [-0.06, 0.48, 0.062], [0.22, 0.03, 0.01], 0.006);
    [0.32, 0.26, 0.2, 0.36, 0.14].forEach((w, i) => b.rbox(fl, line, [-0.18 + w / 2, 0.4 - i * 0.055, 0.062], [w, 0.018, 0.01], 0.005));
    const head = b.group(fl, [0, 0.76, 0.02]);
    const fur = furMat(b, '#f4f6fa', { sheenColor: '#ffffff' });
    b.ball(head, fur, [0, 0, 0], [0.22, 0.18, 0.18]);
    b.ball(head, fur, [0, -0.05, 0.12], [0.1, 0.07, 0.07]);
    const pink = b.mat('#f6b2bc', { rough: 0.6 });
    b.ball(head, pink, [0, -0.03, 0.185], [0.022, 0.016, 0.012]);
    const eyes = [1, -1].map((sx) => b.eye(head, [sx * 0.08, 0.02, 0.14], 0.05, '#ff4058', [sx * 0.4, 0.05, 0.9], { glow: '#ff2e48' }));
    blink(b, eyes);
    const ears = makeEars(b, head, 'pointy', 0.22, 1.1, fur, pink);
    whiskers(b, head, [0.05, -0.05, 0.16], 0.18, '#a8adbb');
    for (const sx of [1, -1]) b.ball(fl, fur, [sx * 0.12, 0.02, 0.06], [0.06, 0.04, 0.07]);
    b.taper(fl, fur, [[0.1, 0.1, -0.07], [0.3, 0.14, -0.14], [0.4, 0.42, -0.12], [0.3, 0.62, -0.04]], 0.035, 0.022);
    const sheets = Array.from({ length: 4 }, (_, i) => {
      const s = b.group(fl, [0, 0, 0]);
      s.userData.nofit = true;
      b.rbox(s, paper, [0, 0, 0], [0.12, 0.15, 0.01], 0.006);
      for (let k = 0; k < 3; k++) b.rbox(s, line, [0, 0.03 - k * 0.03, 0.006], [0.08, 0.008, 0.004], 0.002);
      return [s, i];
    });
    swarm(b, fl, 20, '#ff4058', 0.06, (s, t, o) => {
      const life = (t * 0.3 + s[0]) % 1;
      o[0] = (s[1] - 0.5) * 0.8;
      o[1] = -0.2 + life * 1.3;
      o[2] = (s[2] - 0.5) * 0.6;
      o[3] = Math.sin(life * Math.PI) * 0.8;
    });
    b.on((t) => {
      fl.position.y = 0.42 + Math.sin(t * 1.5) * 0.05;
      fl.rotation.z = Math.sin(t * 0.9) * 0.06;
      head.rotation.z = Math.sin(t * 1.2) * 0.12;
      sheets.forEach(([s, i]) => {
        const a = t * 0.6 + (i / 4) * TAU;
        s.position.set(Math.cos(a) * 0.55, 0.35 + Math.sin(t + i) * 0.12, Math.sin(a) * 0.45);
        s.rotation.set(Math.sin(t + i) * 0.4, -a, 0.2);
      });
    });
  },

  codedrache(b) {
    const g = b.group(b.model);
    const fl = b.group(g, [0, 0.9, 0]);
    const pad = b.mat('#1a1a20', { metal: 0.7, rough: 0.3, surf: 'panel', ns: 0.3 });
    b.cyl(g, pad, [0, 0.03, 0], 0.5, 0.55, 0.06, null, 6);
    b.torus(g, b.basic('#ff2e48'), [0, 0.065, 0], 0.46, 0.01, [Math.PI / 2, 0, 0]);
    const codeMap = codeCanvas(b, false), codeGlow = codeCanvas(b, true);
    const skin = b.mat('#ffffff', { map: codeMap, emap: codeGlow, glow: '#ffffff', ei: 1.4, rough: 0.35, metal: 0.4, coat: 0.6 });
    const armor = b.mat('#1c1a22', { rough: 0.3, metal: 0.8, coat: 1, surf: 'panel', ns: 0.35 });
    const red = b.mat('#ff2e48', { glow: '#ff2e48', ei: 2 });
    const pts = [[0, 0.02, 0.5], [0, 0.08, 0.25], [0.15, 0.02, -0.1], [-0.1, -0.05, -0.45], [0.12, 0.04, -0.8], [0.28, 0.25, -1.1], [0.2, 0.45, -1.25]];
    const prof = (t) => (t < 0.22 ? 0.11 + 0.08 * (t / 0.22) : 0.19 * (1 - (t - 0.22) / 0.78) + 0.012);
    const body = b.taper(fl, skin, pts, 0.1, 0.01, { seg: 120, profile: prof });
    const c = body.userData.curve;
    const spikes = [];
    for (let i = 1; i < 22; i++) {
      const t = i / 23, p = c.getPointAt(t), r = prof(t);
      spikes.push(b.cone(fl, red, [p.x, p.y + r * 0.85, p.z], r * 0.35, r * 0.9, [-0.5, 0, 0], [1, 1, 0.5], 4));
    }
    const tipP = c.getPointAt(1);
    b.cone(fl, red, [tipP.x, tipP.y, tipP.z], 0.06, 0.16, [-0.6, 0, 0], [1, 1, 0.3], 3);
    const head = b.group(fl, [0, 0.06, 0.6]);
    b.ball(head, armor, [0, 0, 0], [0.15, 0.13, 0.2]);
    b.ball(head, armor, [0, -0.03, 0.2], [0.1, 0.075, 0.17]);
    b.ball(head, skin, [0, -0.09, 0.14], [0.09, 0.04, 0.16]);
    for (const sx of [1, -1]) {
      b.taper(head, armor, [[sx * 0.07, 0.08, -0.06], [sx * 0.14, 0.2, -0.25], [sx * 0.12, 0.36, -0.38]], 0.035, 0.008);
      b.taper(head, armor, [[sx * 0.12, 0.0, -0.08], [sx * 0.22, 0.04, -0.22]], 0.02, 0.005);
      b.ball(head, red, [sx * 0.09, 0.045, 0.13], [0.035, 0.018, 0.03], [0, sx * 0.4, -sx * 0.3]);
      b.ball(head, red, [sx * 0.03, 0.0, 0.36], 0.012);
      for (let k = 0; k < 4; k++) b.cone(head, b.mat('#f2ece0', { rough: 0.3 }), [sx * 0.06, -0.075, 0.12 + k * 0.05], 0.01, 0.035, [Math.PI, 0, 0]);
    }
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0.05);
    wingShape.lineTo(0.45, 0.5);
    wingShape.lineTo(1.3, 0.7);
    wingShape.quadraticCurveTo(1.0, 0.35, 1.1, 0.0);
    wingShape.quadraticCurveTo(0.8, -0.05, 0.7, -0.35);
    wingShape.quadraticCurveTo(0.35, -0.15, 0, -0.3);
    wingShape.closePath();
    const memTex = b.ctex(256, 256, (ctx, s) => {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, s, s);
      ctx.strokeStyle = '#ff3a52';
      ctx.lineWidth = 2;
      const r = (() => { let v = 77; return () => (v = (v * 16807) % 2147483647) / 2147483647; })();
      for (let i = 0; i < 30; i++) {
        let x = r() * s, y = r() * s;
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let k = 0; k < 4; k++) (k % 2 ? (y += (r() - 0.5) * 80) : (x += (r() - 0.5) * 80)), ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, TAU);
        ctx.fillStyle = '#ff3a52';
        ctx.fill();
      }
    }, { wrap: true, repeat: [1.5, 1.5] });
    const mem = b.mat('#2a0a12', { rough: 0.5, double: true, emap: memTex, glow: '#ffffff', ei: 1.2, opacity: 0.94 });
    const wings = [1, -1].map((s) => {
      const p = c.getPointAt(0.2);
      const wp = b.group(fl, [p.x + s * 0.12, p.y + 0.12, p.z]);
      const inner = b.group(wp, [0, 0, 0], [Math.PI / 2 - 0.5, 0, 0]);
      inner.scale.set(s, 1, 1);
      b.extrude(inner, mem, wingShape, 0.01, [0, 0, 0], null, null, 0.008);
      for (const tip of [[1.3, 0.7], [1.1, 0.0], [0.7, -0.35]]) b.limb(inner, armor, [0.45, 0.5, 0], [tip[0], tip[1], 0], 0.02, 0.008);
      b.limb(inner, armor, [0, 0.05, 0], [0.45, 0.5, 0], 0.035, 0.025);
      b.cone(inner, red, [1.3, 0.7, 0], 0.02, 0.08, [0, 0, -0.9]);
      return [wp, s];
    });
    for (const t of [0.25, 0.45]) {
      const p = c.getPointAt(t);
      for (const sx of [1, -1]) {
        const foot = [p.x + sx * 0.2, p.y - 0.3, p.z + 0.08];
        b.limb(fl, armor, [p.x + sx * 0.1, p.y - 0.05, p.z], foot, 0.04, 0.025);
        for (const a of [-0.4, 0, 0.4]) b.cone(fl, b.mat('#f2ece0'), foot, 0.012, 0.06, [Math.PI / 2 + 0.5, a, 0]);
      }
    }
    swarm(b, b.model, 46, '#ff3a52', 0.07, (s, t, o) => {
      const life = (t * (0.25 + s[0] * 0.2) + s[1]) % 1;
      o[0] = (s[2] - 0.5) * 2.2;
      o[1] = 2.2 - life * 2.2;
      o[2] = (s[3] - 0.5) * 2;
      o[3] = Math.sin(life * Math.PI) * (0.5 + 0.5 * Math.sin(t * 9 + s[0] * 30));
    });
    b.on((t) => {
      fl.position.y = 0.9 + Math.sin(t * 1.3) * 0.07;
      wings.forEach(([w, s]) => (w.rotation.z = s * (0.3 + Math.sin(t * 2.2) * 0.45)));
      head.rotation.y = Math.sin(t * 0.7) * 0.2;
      head.rotation.x = Math.sin(t * 1.1) * 0.08;
      codeMap.offset.y = codeGlow.offset.y = -t * 0.05;
      red.emissiveIntensity = 1.6 + Math.sin(t * 3) * 0.6;
    });
  },

  serverchamaeleon(b) {
    const g = b.group(b.model);
    const rack = b.mat('#1a1a20', { metal: 0.7, rough: 0.35, surf: 'panel', ns: 0.35 });
    const bay = b.mat('#2a2a33', { metal: 0.6, rough: 0.3 });
    b.rbox(g, rack, [0, 0.36, 0], [0.75, 0.72, 0.55], 0.03);
    const leds = [];
    const ledCols = ['#3ddc84', '#ff2e48', '#3ec9ff', '#ffb84d'];
    const ledMats = ledCols.map((c) => b.mat(c, { glow: c, ei: 2 }));
    for (let r = 0; r < 5; r++) {
      b.rbox(g, bay, [0, 0.1 + r * 0.13, 0.27], [0.66, 0.1, 0.03], 0.01);
      for (let k = 0; k < 4; k++) b.rbox(g, b.mat('#0e0e12', { rough: 0.6 }), [-0.22 + k * 0.08, 0.1 + r * 0.13, 0.287], [0.05, 0.012, 0.01], 0.003);
      for (let k = 0; k < 3; k++) leds.push(b.rbox(g, ledMats[(r + k) % 4], [0.16 + k * 0.05, 0.1 + r * 0.13, 0.288], [0.022, 0.022, 0.01], 0.004));
    }
    const top = 0.72;
    const tex = b.ctex(256, 256, (ctx, s) => {
      ctx.fillStyle = '#2b2e38';
      ctx.fillRect(0, 0, s, s);
      ctx.fillStyle = '#1a1c22';
      for (let y = 0; y < s; y += 32) ctx.fillRect(0, y, s, 3);
      for (let x = 0; x < s; x += 64) ctx.fillRect(x, 0, 2, s);
      ctx.fillStyle = '#3a3e4a';
      for (let y = 10; y < s; y += 32) for (let x = 8; x < s; x += 64) for (let k = 0; k < 5; k++) ctx.fillRect(x + k * 6, y, 3, 14);
    }, { wrap: true, repeat: [2, 2] });
    const glowTex = b.ctex(256, 256, (ctx, s) => {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, s, s);
      for (let y = 16; y < s; y += 32) for (let x = 46; x < s; x += 64) {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, TAU);
        ctx.arc(x + 9, y, 3.5, 0, TAU);
        ctx.fill();
      }
    }, { wrap: true, repeat: [2, 2] });
    const skin = b.mat('#ffffff', { map: tex, emap: glowTex, glow: '#3ddc84', ei: 2, rough: 0.35, metal: 0.5, coat: 0.6 });
    const q = lizard(b, { skinMat: skin, len: 0.8, bodyR: 0.2, bodyW: 0.17, headR: 0.17, snoutL: 0.08, tailL: 0.9, tailR: 0.08, turret: true, curl: true, iris: '#ff4058', eyeGlow: '#ff2e48', bodyY: top + 0.27, ground: top });
    const H = q.H, red = b.mat('#ff2e48', { glow: '#ff2e48', ei: 2 });
    b.cone(q.head, skin, [0, H * 0.3, -H * 0.35], H * 0.5, H * 0.75, [-0.7, 0, 0], [0.55, 1, 1]);
    for (let i = 0; i < 8; i++) b.cone(q.body, red, [0, q.P.bodyR * 0.9, q.P.len * 0.4 - i * 0.1], 0.025, 0.07, [-0.4, 0, 0], [0.5, 1, 1], 4);
    const fans = [-0.14, 0.14].map((z) => {
      const f = b.group(q.body, [0, q.P.bodyR * 0.82, z], [0.0, 0, 0]);
      b.torus(f, b.mat('#121216', { metal: 0.8, rough: 0.3 }), [0, 0.02, 0], 0.07, 0.015, [Math.PI / 2, 0, 0]);
      const rot = b.group(f, [0, 0.025, 0]);
      for (let k = 0; k < 5; k++) b.rbox(rot, bay, [Math.cos((k / 5) * TAU) * 0.035, 0, Math.sin((k / 5) * TAU) * 0.035], [0.05, 0.006, 0.025], 0.003, [0, -(k / 5) * TAU, 0.4]);
      b.ball(f, red, [0, 0.03, 0], 0.015);
      return rot;
    });
    const cols = ['#e0243a', '#3ec9ff', '#ffd23f'];
    cols.forEach((c, i) => {
      const x = (i - 1) * 0.07;
      b.taper(g, b.mat(c, { rough: 0.4, coat: 0.6 }), [[x, q.bodyY - 0.12, -0.05 + i * 0.08], [x + 0.1, q.bodyY - 0.24, 0.05], [x + 0.2, top - 0.04, 0.32]], 0.014, 0.014, { seg: 20, radial: 8 });
    });
    const holo = b.basic('#ff2e48', { opacity: 0.7 });
    const rings = [0.65, 0.8].map((R, i) => {
      const r = b.torus(g, holo, [0, top + 0.35, 0], R, 0.006, [Math.PI / 2 + (i ? 0.3 : -0.2), 0, 0]);
      r.userData.nofit = true;
      return r;
    });
    const steps = ['#3ddc84', '#3ec9ff', '#ffb84d', '#ff2e48'].map((c) => new THREE.Color(c));
    const tmp = new THREE.Color();
    b.on((t) => {
      const k = (t * 0.25) % 4, i = Math.floor(k), f = Math.min(1, (k - i) * 3);
      tmp.copy(steps[i]).lerp(steps[(i + 1) % 4], f);
      skin.emissive.copy(tmp);
      holo.color.copy(tmp);
      fans.forEach((f, j) => (f.rotation.y = t * (14 + j * 3)));
      rings[0].rotation.z = t * 0.6;
      rings[1].rotation.z = -t * 0.4;
      leds.forEach((l, j) => (l.visible = Math.sin(t * (3 + (j % 5)) + j * 7) > -0.3));
    });
  },

  // ── Release Egg ──
  dackel(b) {
    const q = quad(b, { color: '#8a4220', len: 1.35, bodyR: 0.24, bodyW: 0.23, legH: 0.15, legR: 0.065, headR: 0.24, headL: 1.1, headUp: 0.14, headFwd: 0.04, snoutL: 0.32, snoutR: 0.11, ear: 'floppy', earS: 1.3, earColor: '#5e2a12', tail: 'thin', tailL: 0.55, tailR: 0.05, iris: '#3a1a0c', wag: 9, wagAmp: 0.5 });
    const H = q.H;
    const stripe = b.ctex(256, 256, (ctx, s) => {
      const cols = ['#ff5fd2', '#ffd23f', '#3ec9ff', '#ff4d6d'];
      for (let i = -8; i < 16; i++) {
        ctx.fillStyle = cols[((i % 4) + 4) % 4];
        ctx.beginPath();
        ctx.moveTo(i * 32, 0);
        ctx.lineTo(i * 32 + 32, 0);
        ctx.lineTo(i * 32 + 32 + s, s);
        ctx.lineTo(i * 32 + s, s);
        ctx.fill();
      }
      ctx.fillStyle = '#fff6c8';
      for (let i = 0; i < 40; i++) {
        ctx.beginPath();
        ctx.arc((i * 53) % s, (i * 97) % s, 4, 0, TAU);
        ctx.fill();
      }
    });
    const hat = b.group(q.head, [H * 0.12, H * 0.78, -H * 0.05], [-0.1, 0, -0.28]);
    b.cone(hat, b.mat('#ffffff', { map: stripe, rough: 0.45, coat: 0.6 }), [0, 0, 0], H * 0.42, H * 1.3, null, null, 40);
    b.torus(hat, gold(b), [0, 0.01, 0], H * 0.42, 0.018, [Math.PI / 2, 0, 0]);
    const pom = furMat(b, '#ffd23f', { sheenColor: '#fff6c8', ns: 1 });
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU;
      b.ball(hat, pom, [Math.cos(a) * 0.035, H * 1.32 + Math.sin(i * 2) * 0.02, Math.sin(a) * 0.035], 0.04);
    }
    b.limb(q.head, b.mat('#ffffff', { rough: 0.6 }), [H * 0.38, H * 0.78, -H * 0.05], [H * 0.62, -H * 0.55, H * 0.25], 0.005, 0.005, false);
    const cl = collar(b, q, '#1d1d24', null, 0.5);
    const bow = b.group(q.g, [cl.pos.x, cl.pos.y, cl.pos.z]);
    bow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), cl.perp);
    const bm = b.mat('#e0243a', { rough: 0.45, coat: 0.6, sheen: 0.5 });
    for (const sx of [1, -1]) b.cone(bow, bm, [0, 0, 0], 0.06, 0.12, [0, 0, -sx * Math.PI / 2], [1, 1, 0.4], 4);
    b.ball(bow, bm, [0, 0, 0.01], [0.03, 0.035, 0.025]);
  },

  konfetti(b) {
    const g = b.group(b.model);
    const top = giftBox(b, g, 0.7, 0.42, 0.55);
    const dots = b.ctex(256, 256, (ctx, s) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, s, s);
      for (let i = 0; i < 160; i++) {
        ctx.fillStyle = RAINBOW[i % 7];
        const x = (i * 71) % s, y = (i * 137 + (i % 3) * 29) % s;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(i);
        if (i % 2) ctx.fillRect(-6, -3, 12, 6);
        else {
          ctx.beginPath();
          ctx.arc(0, 0, 5, 0, TAU);
          ctx.fill();
        }
        ctx.restore();
      }
    }, { wrap: true, repeat: [2, 2] });
    const glowDots = b.ctex(256, 256, (ctx, s) => {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, s, s);
      for (let i = 0; i < 160; i++) {
        ctx.fillStyle = RAINBOW[i % 7];
        const x = (i * 71) % s, y = (i * 137 + (i % 3) * 29) % s;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(i);
        if (i % 2) ctx.fillRect(-6, -3, 12, 6);
        else {
          ctx.beginPath();
          ctx.arc(0, 0, 5, 0, TAU);
          ctx.fill();
        }
        ctx.restore();
      }
    }, { wrap: true, repeat: [2, 2] });
    const skin = b.mat('#ffffff', { map: dots, emap: glowDots, glow: '#ffffff', ei: 0.35, rough: 0.35, coat: 0.7, surf: 'scales', ns: 0.4 });
    const q = lizard(b, { skinMat: skin, len: 0.8, bodyR: 0.2, bodyW: 0.17, headR: 0.17, snoutL: 0.08, tailL: 0.9, tailR: 0.08, turret: true, curl: true, iris: '#ff5fd2', bodyY: top + 0.27, ground: top });
    b.cone(q.head, skin, [0, q.H * 0.3, -q.H * 0.35], q.H * 0.5, q.H * 0.75, [-0.7, 0, 0], [0.55, 1, 1]);
    const horn = b.group(q.head, [0, -q.H * 0.15, q.H * 1.1], [Math.PI / 2 + 0.2, 0, 0]);
    b.cone(horn, b.mat('#ffd23f', { metal: 0.6, rough: 0.3 }), [0, 0.18, 0], 0.05, 0.18, [Math.PI, 0, 0]);
    const hsv = new THREE.Color();
    b.on((t) => {
      hsv.setHSL((t * 0.08) % 1, 0.65, 0.78);
      skin.color.copy(hsv);
    });
    swarm(b, b.model, 50, '#ffffff', 0.08, (s, t, o) => {
      const life = (t * (0.2 + s[0] * 0.15) + s[1]) % 1, c = new THREE.Color(RAINBOW[Math.floor(s[2] * 7)]);
      o[0] = (s[3] - 0.5) * 1.8 + Math.sin(t * 2 + s[0] * 9) * 0.1;
      o[1] = 1.9 - life * 1.9;
      o[2] = (s[2] - 0.5) * 1.6;
      o[3] = Math.sin(life * Math.PI);
      o[4] = c.r;
      o[5] = c.g;
      o[6] = c.b;
    });
  },

  ballonschwein(b) {
    const g = b.group(b.model);
    const bal = b.mat('#ff7fa8', { rough: 0.06, coat: 1, coatRough: 0.04, sheen: 0.4, sheenColor: '#ffd0e0' });
    const eye = b.mat('#1a0e12', { rough: 0.1, coat: 1 });
    b.rbox(g, gold(b), [0, 0.06, -0.15], [0.14, 0.12, 0.14], 0.03);
    const fl = b.group(g, [0, 0.75, 0]);
    b.ball(fl, bal, [0, 0.3, 0], [0.28, 0.26, 0.42]);
    b.ball(fl, bal, [0, 0.44, 0.48], [0.24, 0.22, 0.21]);
    b.ball(fl, bal, [0, 0.4, 0.69], [0.12, 0.1, 0.06]);
    for (const sx of [1, -1]) {
      b.ball(fl, b.mat('#c84a74', { rough: 0.2, coat: 1 }), [sx * 0.04, 0.4, 0.745], [0.018, 0.026, 0.01]);
      b.ball(fl, bal, [sx * 0.13, 0.64, 0.44], [0.06, 0.1, 0.04], [0, 0, -sx * 0.4]);
      b.ball(fl, eye, [sx * 0.09, 0.5, 0.66], [0.025, 0.032, 0.012], [0, sx * 0.3, 0]);
      b.ball(fl, b.mat('#ffffff', { glow: '#ffffff', ei: 1 }), [sx * 0.09 + 0.008, 0.512, 0.672], 0.008);
    }
    for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      b.ball(fl, bal, [sx * 0.16, 0.06, sz * 0.25], [0.075, 0.16, 0.075]);
      b.ball(fl, bal, [sx * 0.14, 0.2, sz * 0.25], 0.04);
    }
    for (const z of [0.3, -0.39]) b.ball(fl, bal, [0, 0.33, z], 0.06);
    const curl = [];
    for (let i = 0; i <= 20; i++) {
      const a = (i / 20) * TAU * 1.5;
      curl.push([Math.sin(a) * 0.05, 0.36 + Math.cos(a) * 0.05 + i * 0.002, -0.43 - i * 0.006]);
    }
    b.taper(fl, bal, curl, 0.022, 0.016, { seg: 40 });
    b.ball(fl, bal, [0, 0.12, -0.38], [0.03, 0.03, 0.03]);
    b.cone(fl, bal, [0, 0.12, -0.38], 0.03, 0.05, [Math.PI, 0, 0]);
    b.taper(g, b.mat('#ffffff', { rough: 0.6 }), [[0, 0.87, -0.38], [0.05, 0.6, -0.3], [-0.03, 0.35, -0.2], [0, 0.12, -0.15]], 0.005, 0.005, { seg: 30, radial: 6 });
    b.on((t) => {
      fl.position.y = 0.75 + Math.sin(t * 1.3) * 0.05;
      fl.rotation.z = Math.sin(t * 0.9) * 0.06;
      fl.rotation.x = Math.sin(t * 0.7) * 0.04;
    });
  },

  wunderkerze(b) {
    const tipMat = b.mat('#ffe9a8', { glow: '#ffcf4d', ei: 1.6, rough: 0.6, sheen: 1, surf: 'fur', ns: 0.4 });
    const q = quad(b, { color: '#e8862e', belly: '#fff4e0', cheek: true, len: 1.05, bodyR: 0.27, bodyW: 0.25, legH: 0.4, legR: 0.058, legColor: '#3a2416', headR: 0.26, headW: 1.05, snoutL: 0.3, snoutR: 0.1, ear: 'pointy', earS: 1.4, innerEar: '#fff4e0', tail: 'bushy', tailL: 0.85, tailR: 0.13, tipColor: 'x', tipMat, iris: '#ffb02e', nose: '#1a1214', wag: 3, wagAmp: 0.35 });
    const H = q.H;
    const stick = b.group(q.head, [H * 0.05, q.snY - 0.02, q.snZ + 0.02]);
    const tipP = [0.42, 0.32, 0.08];
    b.limb(stick, b.mat('#8a8a94', { metal: 0.8, rough: 0.4 }), [-0.04, 0, 0], tipP, 0.007, 0.007);
    b.limb(stick, b.mat('#4a4a52', { rough: 0.8, surf: 'stone', ns: 0.6 }), [0.24, 0.18, 0.045], tipP, 0.016, 0.014);
    const core = b.ball(stick, b.mat('#ffffff', { glow: '#ffd76a', ei: 3 }), tipP, 0.025);
    const sg = glowSprite('#ffd76a', 0.55, 0.9);
    sg.position.set(...tipP);
    stick.add(sg);
    swarm(b, stick, 50, '#ffe9a8', 0.05, (s, t, o) => {
      const life = (t * (1.2 + s[0]) + s[1]) % 1;
      const th = s[2] * TAU, ph = Math.acos(s[3] * 2 - 1), r = life * (0.15 + s[0] * 0.15);
      o[0] = tipP[0] + Math.sin(ph) * Math.cos(th) * r;
      o[1] = tipP[1] + Math.cos(ph) * r - life * life * 0.08;
      o[2] = tipP[2] + Math.sin(ph) * Math.sin(th) * r;
      o[3] = 1 - life;
      o[4] = 1;
      o[5] = 0.85 - life * 0.3;
      o[6] = 0.5 - life * 0.4;
    });
    b.on((t) => {
      sg.material.opacity = 0.7 + Math.random() * 0.3;
      core.scale.setScalar(0.025 * (0.8 + Math.random() * 0.4));
      tipMat.emissiveIntensity = 1.3 + Math.sin(t * 6) * 0.3;
    });
  },

  qualle(b) {
    const g = b.group(b.model);
    const fl = b.group(g, [0, 0.55, 0]);
    const bellM = b.mat('#ffd76a', { rough: 0.15, coat: 1, irid: 1, opacity: 0.62, double: true, glow: '#ffb84d', ei: 0.3, depthWrite: false });
    const liquid = b.mat('#ffcf4d', { rough: 0.1, coat: 1, opacity: 0.55, glow: '#ffb000', ei: 0.4, depthWrite: false });
    const gd = gold(b);
    const pts = [];
    for (let i = 0; i <= 16; i++) {
      const a = (i / 16) * Math.PI * 0.55;
      pts.push([Math.max(0.001, Math.sin(a) * 0.6), Math.cos(a) * 0.5]);
    }
    const bell = b.group(fl, [0, 0.9, 0]);
    b.lathe(bell, bellM, pts.reverse(), [0, 0, 0], 48);
    const inner = pts.map(([x, y]) => [x * 0.75, y * 0.7]);
    b.lathe(bell, liquid, inner, [0, 0.0, 0], 32);
    const rimR = Math.sin(Math.PI * 0.55) * 0.6, rimY = Math.cos(Math.PI * 0.55) * 0.5;
    b.torus(bell, gd, [0, rimY, 0], rimR, 0.018, [Math.PI / 2, 0, 0]);
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * TAU;
      b.ball(bell, bellM, [Math.cos(a) * rimR, rimY - 0.03, Math.sin(a) * rimR], [0.06, 0.04, 0.06]);
    }
    bell.add(glowSprite('#ffd76a', 1.4, 0.5));
    const tm = b.mat('#ffe9b8', { rough: 0.3, coat: 1, opacity: 0.75, glow: '#ffb84d', ei: 0.4, depthWrite: false });
    const oral = b.mat('#ffb0c0', { rough: 0.3, coat: 1, opacity: 0.8, glow: '#ff8aa0', ei: 0.3, sheen: 1 });
    const tents = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      const tg = b.group(bell, [Math.cos(a) * rimR * 0.92, rimY - 0.02, Math.sin(a) * rimR * 0.92]);
      const L = 0.65 + (i % 3) * 0.12;
      const p = [];
      for (let k = 0; k <= 8; k++) p.push([Math.sin(k * 0.9 + i) * 0.04, -L * (k / 8), Math.cos(k * 0.9 + i) * 0.03]);
      b.taper(tg, tm, p, 0.012, 0.004, { seg: 24, radial: 6 });
      tents.push([tg, i]);
    }
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU + 0.4;
      const tg = b.group(bell, [Math.cos(a) * 0.08, rimY, Math.sin(a) * 0.08]);
      const p = [];
      for (let k = 0; k <= 10; k++) p.push([Math.cos(a) * k * 0.012 + Math.sin(k * 1.4) * 0.05, -0.08 * k, Math.sin(a) * k * 0.012 + Math.cos(k * 1.4) * 0.05]);
      b.taper(tg, oral, p, 0.045, 0.012, { seg: 40, radial: 10 });
      tents.push([tg, i + 20]);
    }
    swarm(b, bell, 36, '#fff6d8', 0.05, (s, t, o) => {
      const life = (t * (0.25 + s[0] * 0.25) + s[1]) % 1, a = s[2] * TAU, r = s[3] * 0.32;
      o[0] = Math.cos(a) * r + Math.sin(t * 3 + s[0] * 9) * 0.01;
      o[1] = rimY + life * 0.62;
      o[2] = Math.sin(a) * r;
      o[3] = Math.sin(life * Math.PI) * 0.9;
    });
    swarm(b, fl, 20, '#fff6d8', 0.07, (s, t, o) => {
      const life = (t * 0.2 + s[0]) % 1;
      o[0] = (s[1] - 0.5) * 0.9;
      o[1] = 1.4 + life * 0.8;
      o[2] = (s[2] - 0.5) * 0.9;
      o[3] = Math.sin(life * Math.PI) * 0.8;
    });
    b.on((t) => {
      const p = Math.sin(t * 2.2);
      bell.scale.set(1 + p * 0.05, 1 - p * 0.06, 1 + p * 0.05);
      fl.position.y = 0.55 + Math.sin(t * 2.2 - 0.6) * 0.06;
      tents.forEach(([tg, i]) => {
        tg.rotation.x = Math.sin(t * 1.6 + i) * 0.12;
        tg.rotation.z = Math.cos(t * 1.3 + i * 0.7) * 0.12;
      });
    });
  },

  roboter(b) {
    const g = b.group(b.model);
    const white = b.mat('#f4f1ea', { rough: 0.3, coat: 0.8, surf: 'panel', ns: 0.25 });
    const gd = gold(b, { coat: 1 });
    const dark = b.mat('#1c1c24', { rough: 0.3, metal: 0.6 });
    const cyan = b.mat('#bff6ff', { glow: '#5fe0ff', ei: 2.5 });
    b.cyl(g, dark, [0, 0.03, 0], 0.5, 0.56, 0.06, null, 48);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      b.rbox(g, i % 2 ? gd : b.mat('#ffd23f', { glow: '#ffb000', ei: 0.8 }), [Math.cos(a) * 0.44, 0.065, Math.sin(a) * 0.44], [0.12, 0.012, 0.04], 0.004, [0, -a, 0]);
    }
    const fl = b.group(g, [0, 0.42, 0]);
    const flames = [];
    const flameM = b.basic('#ff9a3a', { opacity: 0.9 }), flameC = b.basic('#fff0b0', { opacity: 0.9 });
    const flame = (p, x, y, z, s = 1) => {
      const f = b.group(p, [x, y, z]);
      f.userData.nofit = true;
      b.cone(f, flameM, [0, 0, 0], 0.06 * s, 0.3 * s, [Math.PI, 0, 0]);
      b.cone(f, flameC, [0, 0, 0], 0.03 * s, 0.18 * s, [Math.PI, 0, 0]);
      flames.push(f);
    };
    for (const sx of [1, -1]) {
      b.ball(fl, gd, [sx * 0.12, 0.42, 0], 0.06);
      b.limb(fl, dark, [sx * 0.12, 0.42, 0], [sx * 0.15, 0.2, 0.02], 0.045, 0.04);
      b.rbox(fl, white, [sx * 0.16, 0.08, 0.04], [0.2, 0.2, 0.28], 0.05);
      b.rbox(fl, gd, [sx * 0.16, 0.14, 0.04], [0.21, 0.03, 0.29], 0.01);
      b.cyl(fl, dark, [sx * 0.16, -0.04, 0.02], 0.05, 0.065, 0.06, null, 20);
      flame(fl, sx * 0.16, -0.07, 0.02, 0.9);
    }
    const screen = b.ctex(256, 160, () => {});
    const sctx = screen.image.getContext('2d');
    const draw = (n) => {
      sctx.fillStyle = '#0a0a14';
      sctx.fillRect(0, 0, 256, 160);
      sctx.fillStyle = '#ffd23f';
      sctx.font = '700 44px "JetBrains Mono", ui-monospace, monospace';
      sctx.textAlign = 'center';
      sctx.fillText(n > 0 ? 'T-' + String(n).padStart(2, '0') : 'LIFTOFF', 128, 70);
      sctx.font = '600 22px "JetBrains Mono", ui-monospace, monospace';
      sctx.fillStyle = '#5fe0ff';
      sctx.fillText('LAUNCH DAY', 128, 110);
      sctx.fillStyle = '#2a2a3a';
      sctx.fillRect(28, 128, 200, 12);
      sctx.fillStyle = '#ffd23f';
      sctx.fillRect(28, 128, 200 * (1 - n / 10), 12);
      screen.needsUpdate = true;
    };
    draw(10);
    const torso = b.group(fl, [0, 0.82, 0]);
    b.rbox(torso, white, [0, 0, 0], [0.62, 0.6, 0.42], 0.09);
    b.rbox(torso, dark, [0, 0.04, 0.2], [0.46, 0.32, 0.04], 0.03);
    b.place(new THREE.Mesh(b.track(new THREE.PlaneGeometry(0.4, 0.25)), b.track(new THREE.MeshBasicMaterial({ map: screen }))), torso, [0, 0.04, 0.222]);
    b.rbox(torso, gd, [0, -0.3, 0], [0.56, 0.07, 0.38], 0.02);
    b.rbox(fl, dark, [0, 0.45, 0], [0.38, 0.16, 0.28], 0.04);
    b.rbox(torso, white, [0, 0.0, -0.28], [0.46, 0.5, 0.18], 0.06);
    for (const sx of [1, -1]) {
      b.cyl(torso, gd, [sx * 0.14, -0.05, -0.38], 0.075, 0.075, 0.44, null, 24);
      b.cone(torso, b.mat('#e0243a', { rough: 0.4, coat: 0.6 }), [sx * 0.14, 0.17, -0.38], 0.075, 0.12, null, null, 24);
      b.cyl(torso, dark, [sx * 0.14, -0.3, -0.38], 0.05, 0.07, 0.06, null, 20);
      flame(torso, sx * 0.14, -0.33, -0.38, 1.3);
    }
    const arms = [1, -1].map((sx) => {
      const sh = b.group(torso, [sx * 0.36, 0.18, 0]);
      b.ball(sh, gd, [0, 0, 0], 0.08);
      const arm = b.group(sh, [0, 0, 0]);
      b.limb(arm, white, [0, 0, 0], [sx * 0.08, -0.25, 0.04], 0.06, 0.055);
      b.ball(arm, dark, [sx * 0.08, -0.25, 0.04], 0.055);
      b.limb(arm, white, [sx * 0.08, -0.25, 0.04], [sx * 0.1, -0.48, 0.1], 0.055, 0.05);
      b.ball(arm, dark, [sx * 0.1, -0.53, 0.1], [0.06, 0.06, 0.06]);
      return [arm, sx];
    });
    const rocket = b.group(arms[1][0], [-0.1, -0.53, 0.18], [0.3, 0, 0]);
    b.cyl(rocket, white, [0, 0.1, 0], 0.035, 0.035, 0.2, null, 20);
    b.cone(rocket, b.mat('#e0243a', { rough: 0.4, coat: 0.6 }), [0, 0.2, 0], 0.035, 0.08, null, null, 20);
    for (let k = 0; k < 3; k++) b.rbox(rocket, gd, [Math.cos((k / 3) * TAU) * 0.035, 0.02, Math.sin((k / 3) * TAU) * 0.035], [0.008, 0.06, 0.04], 0.003, [0, -(k / 3) * TAU, 0]);
    const head = b.group(fl, [0, 1.32, 0]);
    b.rbox(head, white, [0, 0, 0], [0.44, 0.34, 0.36], 0.1);
    b.rbox(head, b.mat('#0c0c14', { rough: 0.1, coat: 1 }), [0, 0.01, 0.17], [0.36, 0.15, 0.04], 0.05);
    const eyes = [1, -1].map((sx) => b.rbox(head, cyan, [sx * 0.08, 0.01, 0.19], [0.07, 0.035, 0.01], 0.012));
    for (const sx of [1, -1]) b.cyl(head, gd, [sx * 0.23, 0, 0], 0.07, 0.07, 0.04, [0, 0, Math.PI / 2], 24);
    b.limb(head, dark, [0, 0.17, 0], [0, 0.32, 0], 0.01, 0.01);
    const ant = b.ball(head, b.mat('#ff4d6d', { glow: '#ff2e48', ei: 2 }), [0, 0.34, 0], 0.035);
    swarm(b, b.model, 40, '#ffb84d', 0.08, (s, t, o) => {
      const life = (t * (0.6 + s[0] * 0.5) + s[1]) % 1;
      const src = s[2] < 0.5 ? [(s[2] < 0.25 ? 1 : -1) * 0.16, 0.3] : [(s[2] < 0.75 ? 1 : -1) * 0.14, 0.88];
      o[0] = src[0] + (s[3] - 0.5) * 0.3 * life;
      o[1] = src[1] - life * 0.45;
      o[2] = (s[2] < 0.5 ? 0.02 : -0.38) + (s[0] - 0.5) * 0.2 * life;
      o[3] = 1 - life;
      o[4] = 1;
      o[5] = 0.8 - life * 0.5;
      o[6] = 0.4 - life * 0.4;
    });
    let last = -1;
    b.on((t) => {
      fl.position.y = 0.42 + Math.sin(t * 1.8) * 0.04;
      flames.forEach((f, i) => f.scale.set(1, 0.75 + Math.random() * 0.45, 1));
      arms[0][0].rotation.z = 2.4 + Math.sin(t * 4) * 0.35;
      arms[1][0].rotation.x = -0.4;
      ant.material.emissiveIntensity = Math.sin(t * 5) > 0 ? 3 : 0.4;
      head.rotation.y = Math.sin(t * 0.8) * 0.2;
      const n = 10 - (Math.floor(t) % 13);
      if (n !== last) draw(Math.max(0, (last = n)));
    });
  },

  phoenix(b) {
    const g = b.group(b.model);
    const bowl = gold(b, { coat: 1 });
    b.lathe(g, bowl, [[0.001, 0], [0.18, 0], [0.12, 0.05], [0.14, 0.1], [0.36, 0.22], [0.38, 0.25], [0.3, 0.2], [0.001, 0.16]], [0, 0, 0], 48);
    const coal = b.mat('#3a1408', { glow: '#ff4a00', ei: 1.2, rough: 0.8, surf: 'stone', ns: 0.7 });
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU;
      b.ball(g, coal, [Math.cos(a) * 0.18, 0.2, Math.sin(a) * 0.18], 0.06 + b.rnd() * 0.03);
    }
    const fireOuter = b.basic('#ff6a1a', { opacity: 0.85 }), fireInner = b.basic('#ffe08a', { opacity: 0.9 });
    const fires = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU, r = i ? 0.12 : 0;
      const f = b.group(g, [Math.cos(a) * r, 0.2, Math.sin(a) * r]);
      f.userData.nofit = true;
      b.cone(f, fireOuter, [0, 0, 0], 0.07, 0.3);
      b.cone(f, fireInner, [0, 0, 0], 0.035, 0.18);
      fires.push(f);
    }
    const fl = b.group(g, [0, 1.05, 0]);
    const body = b.mat('#ff5a1f', { glow: '#ff3a00', ei: 0.9, rough: 0.4, surf: 'feather', ns: 0.4, sheen: 1, sheenColor: '#ffd27a' });
    const chest = b.mat('#ffcf4d', { glow: '#ff9a00', ei: 0.9, rough: 0.4, surf: 'feather', ns: 0.3 });
    const gd = gold(b);
    b.ball(fl, body, [0, 0, 0], [0.22, 0.3, 0.26], [0.35, 0, 0]);
    b.ball(fl, chest, [0, 0.02, 0.1], [0.17, 0.24, 0.18], [0.35, 0, 0]);
    const head = b.group(fl, [0, 0.38, 0.16]);
    b.ball(head, body, [0, -0.1, -0.04], [0.13, 0.14, 0.13]);
    b.ball(head, body, [0, 0, 0], [0.15, 0.14, 0.17]);
    b.cone(head, gd, [0, -0.02, 0.15], 0.04, 0.12, [Math.PI * 0.62, 0, 0]);
    for (const sx of [1, -1]) b.eye(head, [sx * 0.08, 0.03, 0.11], 0.035, '#fff2b0', [sx * 0.6, 0.1, 0.78], { glow: '#ffd76a' });
    const crestM = b.mat('#ffcf4d', { glow: '#ff9a00', ei: 1.4, rough: 0.4 });
    for (let i = 0; i < 5; i++) {
      const x = (i - 2) * 0.03;
      b.taper(head, crestM, [[x, 0.1, -0.02], [x * 1.5, 0.25, -0.12], [x * 2, 0.32 + Math.abs(i - 2) * -0.04, -0.3]], 0.02, 0.006, { capMat: b.mat('#fff2b0', { glow: '#ffd76a', ei: 2 }) });
    }
    const wings = [1, -1].map((s) => {
      const w = featherWing(b, fl, s, { pos: [s * 0.15, 0.12, -0.02], len: 1.2, color: '#e0301a', mid: '#ff8a1f', tip: '#ffe14d', rows: 3, n: 10, fl: 0.6, mat: { glow: '#ff4a00', ei: 0.6 } });
      w.rotation.y = s * 0.3;
      return [w, s];
    });
    const plume = b.mat('#ff7a1a', { glow: '#ff4a00', ei: 1, rough: 0.4, surf: 'feather', ns: 0.3 });
    const eyeSpot = b.mat('#ffe14d', { glow: '#ffb000', ei: 1.6 });
    const plumes = [];
    for (let i = 0; i < 5; i++) {
      const x = (i - 2) * 0.08;
      const pg = b.group(fl, [0, -0.2, -0.18]);
      const end = [x * 2.5, -0.7 - Math.abs(i - 2) * -0.08, -0.55 - (2 - Math.abs(i - 2)) * 0.08];
      const m = b.taper(pg, plume, [[x * 0.2, 0, 0], [x * 0.8, -0.25, -0.25], [x * 1.8, -0.5, -0.45], end], 0.03, 0.012);
      b.ball(pg, eyeSpot, end, [0.05, 0.07, 0.025]);
      b.ball(pg, b.mat('#c81e1e', { glow: '#ff2000', ei: 1 }), [end[0], end[1], end[2] + 0.02], [0.022, 0.03, 0.015]);
      plumes.push([pg, i]);
    }
    swarm(b, b.model, 50, '#ffb84d', 0.09, (s, t, o) => {
      const life = (t * (0.4 + s[0] * 0.3) + s[1]) % 1;
      o[0] = (s[2] - 0.5) * 1.8 * (0.3 + life * 0.3);
      o[1] = 0.9 + (s[3] - 0.3) * 0.6 + life * 1.0;
      o[2] = (s[0] - 0.5) * 0.6;
      o[3] = (1 - life) * 0.9;
      o[4] = 1;
      o[5] = 0.7 - life * 0.4;
      o[6] = 0.3 - life * 0.3;
    });
    // Feuerwerk
    const bursts = [0, 1, 2].map((k) => {
      const N = 36;
      const pts = swarm(b, b.fx, N, '#ffffff', 0.11, (s, t, o, i) => {
        const T = 2.6, tt = t + k * (T / 3), cyc = Math.floor(tt / T), life = (tt % T) / T;
        const r1 = Math.sin(cyc * 12.9 + k * 7.1) * 43758.5453, r2 = Math.sin(cyc * 78.2 + k * 3.3) * 12543.12;
        const cx = ((r1 - Math.floor(r1)) - 0.5) * 2.4, cy = 0.7 + (r2 - Math.floor(r2)) * 1.1;
        const th = (i / N) * TAU, ph = Math.acos(((i * 0.618) % 1) * 2 - 1), r = Math.min(1, life * 2.2) * 0.55;
        o[0] = cx + Math.sin(ph) * Math.cos(th) * r;
        o[1] = cy + Math.cos(ph) * r - life * life * 0.3;
        o[2] = -0.6 + Math.sin(ph) * Math.sin(th) * r * 0.5;
        o[3] = life < 0.08 ? 0 : Math.pow(1 - life, 1.5);
        const c = new THREE.Color(RAINBOW[(cyc + k * 2) % 7]);
        o[4] = c.r;
        o[5] = c.g;
        o[6] = c.b;
      });
      return pts;
    });
    b.on((t) => {
      fl.position.y = 1.05 + Math.sin(t * 1.4) * 0.06;
      wings.forEach(([w, s]) => (w.rotation.z = s * (0.3 + Math.sin(t * 2) * 0.3)));
      plumes.forEach(([p, i]) => (p.rotation.x = Math.sin(t * 1.5 + i * 0.6) * 0.1));
      fires.forEach((f, i) => f.scale.set(1, 0.7 + Math.random() * 0.5, 1));
      head.rotation.y = Math.sin(t * 0.8) * 0.25;
      body.emissiveIntensity = 0.8 + Math.sin(t * 3) * 0.2;
    });
  },
};
