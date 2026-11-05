// Münzbaumgarten: Bäume, Gartenwerkzeug und die Regeln des Gartens.
//
// Den Garten kauft man mit Talern. Bäume und Werkzeug gibt es nur aus Münzrollen (rollen/).
// Ein Baum wächst in drei Stufen (Setzling, Jungbaum, ausgewachsen). Ausgewachsen trägt er
// alle `cycle` Sekunden eine Ernte von `yield` Talern, höchstens MAX_RIPE Ernten auf Vorrat.
// Gießkannen lassen ihn schneller wachsen, Dünger vervielfacht die Ernte eine Zeit lang.
//
// Dieselben Regeln stehen in Luau in GardenData (roblox/js/gardenLuau.js).

export const RARITIES = [
  { id: 'gewoehnlich', name: 'Gewöhnlich', color: '#c9c0ae', chance: 55 },
  { id: 'selten', name: 'Selten', color: '#5fd38d', chance: 27 },
  { id: 'episch', name: 'Episch', color: '#b07bff', chance: 11 },
  { id: 'legendaer', name: 'Legendär', color: '#ffb02e', chance: 5 },
  { id: 'mythisch', name: 'Mythisch', color: '#ff5f8a', chance: 1.6 },
  { id: 'goettlich', name: 'Göttlich', color: '#fff2a0', chance: 0.4 },
];
export const rarityById = Object.fromEntries(RARITIES.map((r, i) => [r.id, { ...r, index: i }]));

// grow: Sekunden bis ausgewachsen · cycle: Sekunden je Ernte · yield: Taler je Ernte
// harvests: so oft lässt sich der Baum abernten, dann ist er abgeerntet und verschwindet
// crown: Form der Krone · trunk/leaf/fruit: Farben · look: Material der Krone
export const TREES = [
  { id: 'pfennigbusch', name: 'Pfennigbusch', rarity: 'gewoehnlich', grow: 60, cycle: 30, yield: 40, harvests: 6, crown: 'bush', trunk: '#7a5230', leaf: '#5fae4a', fruit: '#c8743a', look: 'Grass', text: 'Klein, rund und genügsam. Wächst überall, wo man ihn lässt.' },
  { id: 'kupferbaum', name: 'Kupferbaum', rarity: 'gewoehnlich', grow: 120, cycle: 45, yield: 90, harvests: 6, crown: 'round', trunk: '#6b4428', leaf: '#4f9a3c', fruit: '#d4834a', look: 'Grass', text: 'Der Klassiker. Zwischen den Blättern klimpern Kupfermünzen.' },
  { id: 'silberbirke', name: 'Silberbirke', rarity: 'selten', grow: 240, cycle: 60, yield: 300, harvests: 8, crown: 'oval', trunk: '#e8e4dc', leaf: '#9fd06a', fruit: '#d6dde8', look: 'Grass', text: 'Weiße Rinde, helles Laub und Silberlinge, die im Wind glitzern.' },
  { id: 'talertanne', name: 'Talertanne', rarity: 'selten', grow: 300, cycle: 75, yield: 420, harvests: 8, crown: 'cone', trunk: '#5a3a22', leaf: '#2f7a4a', fruit: '#ffd45a', look: 'Grass', text: 'Das ganze Jahr grün und behängt mit goldenen Talern wie mit Kugeln.' },
  { id: 'goldeiche', name: 'Goldeiche', rarity: 'episch', grow: 600, cycle: 90, yield: 1500, harvests: 10, crown: 'round', trunk: '#5b3b1f', leaf: '#e8b830', fruit: '#fff0a0', look: 'Foil', big: true, text: 'Uralt und mächtig. Ihre Blätter sind aus Blattgold.' },
  { id: 'dukatenkirsche', name: 'Dukatenkirsche', rarity: 'episch', grow: 540, cycle: 80, yield: 1300, harvests: 10, crown: 'blossom', trunk: '#4a2c22', leaf: '#ff9ec8', fruit: '#ffcf4a', look: 'SmoothPlastic', text: 'Blüht rosa und trägt statt Kirschen kleine Golddukaten.' },
  { id: 'kristallweide', name: 'Kristallweide', rarity: 'legendaer', grow: 1200, cycle: 120, yield: 6000, harvests: 12, crown: 'weeping', trunk: '#6a7f96', leaf: '#8fe8ff', fruit: '#e6fbff', look: 'Glass', text: 'Ihre Zweige hängen wie Eiszapfen herab und klingen beim Ernten.' },
  { id: 'drachenpalme', name: 'Drachenpalme', rarity: 'mythisch', grow: 2400, cycle: 150, yield: 25000, harvests: 15, crown: 'palm', trunk: '#5a2a1a', leaf: '#ff5a2a', fruit: '#ffb02e', look: 'Neon', text: 'Wächst nur, wo es heiß ist. Ihre Früchte glühen wie Drachenschuppen.' },
  { id: 'sternenbaum', name: 'Sternenbaum', rarity: 'goettlich', grow: 3600, cycle: 180, yield: 120000, harvests: 20, crown: 'star', trunk: '#2a1f4a', leaf: '#3b2a8a', fruit: '#fff2a0', look: 'Glass', text: 'Seine Krone ist ein Stück Nachthimmel. Jede Frucht ist ein kleiner Stern.' },
];

// kind: water (seconds schneller wachsen, Infinity = sofort fertig) · boost (mult × Ernte für seconds)
//       taler (amount Taler sofort) · bed (+1 Beet)
export const TOOLS = [
  { id: 'talerbeutel', name: 'Talerbeutel', rarity: 'gewoehnlich', kind: 'taler', amount: 750, model: 'bag', color: '#c9a46a', text: 'Ein Säckchen voller Taler. Sofort in die Kasse.' },
  { id: 'blechkanne', name: 'Blechkanne', rarity: 'gewoehnlich', kind: 'water', seconds: 60, model: 'can', color: '#9aa3ad', text: 'Einmal gießen: Der Baum wächst 1 Minute schneller.' },
  { id: 'kupferkanne', name: 'Kupferkanne', rarity: 'selten', kind: 'water', seconds: 300, model: 'can', color: '#d4834a', text: 'Einmal gießen: Der Baum wächst 5 Minuten schneller.' },
  { id: 'duenger', name: 'Dünger', rarity: 'selten', kind: 'boost', mult: 2, seconds: 600, model: 'sack', color: '#6f8f3a', text: 'Doppelte Ernte an einem Baum, 10 Minuten lang.' },
  { id: 'goldkanne', name: 'Goldkanne', rarity: 'episch', kind: 'water', seconds: 1800, model: 'can', color: '#ffd45a', text: 'Einmal gießen: Der Baum wächst 30 Minuten schneller.' },
  { id: 'goldspaten', name: 'Goldener Spaten', rarity: 'legendaer', kind: 'bed', model: 'spade', color: '#ffd45a', text: 'Gräbt ein neues Beet in deinen Garten, ganz ohne Taler.' },
  { id: 'regenbogenkanne', name: 'Regenbogenkanne', rarity: 'legendaer', kind: 'water', seconds: Infinity, model: 'can', color: '#ff7ad9', rainbow: true, text: 'Einmal gießen: Der Baum ist sofort ausgewachsen.' },
  { id: 'zauberduenger', name: 'Zauberdünger', rarity: 'mythisch', kind: 'boost', mult: 3, seconds: 1800, model: 'sack', color: '#8a4bd8', text: 'Dreifache Ernte an einem Baum, 30 Minuten lang.' },
  { id: 'talertruhe', name: 'Talertruhe', rarity: 'goettlich', kind: 'taler', amount: 250000, model: 'chest', color: '#ffd45a', text: 'Eine ganze Truhe Taler. Selten wie ein Sternenbaum.' },
];

// Zäune zum Personalisieren: aus den Rollen, bleiben im Inventar und lassen sich jederzeit anbringen.
// Der Holzzaun ist immer da (Standard) und kommt nicht aus Rollen. color: Farbe für Symbole in der Oberfläche.
export const FENCES = [
  { id: 'holzzaun', name: 'Holzzaun', rarity: 'gewoehnlich', standard: true, color: '#96683e', text: 'Der gute alte Holzzaun. Gehört zu jedem Garten.' },
  { id: 'lattenzaun', name: 'Weißer Lattenzaun', rarity: 'gewoehnlich', color: '#f2efe6', text: 'Spitze weiße Latten wie vor einem Landhaus.' },
  { id: 'steinmauer', name: 'Steinmauer', rarity: 'selten', color: '#8a8f99', text: 'Niedrige Mauer aus Feldsteinen, oben mit Moos bewachsen.' },
  { id: 'bambuszaun', name: 'Bambuszaun', rarity: 'selten', color: '#8db84a', text: 'Dicht an dicht gestellte Bambusrohre mit Knoten.' },
  { id: 'eisengitter', name: 'Eisengitter', rarity: 'episch', color: '#2b2b33', text: 'Schwarzes Gitter mit goldenen Spitzen und Laternen auf den Pfosten.' },
  { id: 'kristallzaun', name: 'Kristallzaun', rarity: 'legendaer', color: '#8fe8ff', text: 'Pfosten aus Kristall, verbunden mit leuchtenden Bändern. Funkelt.' },
  { id: 'lavazaun', name: 'Lavazaun', rarity: 'mythisch', color: '#ff6a2a', text: 'Basalt mit glühenden Adern. Auf den Pfosten brennt Feuer.' },
  { id: 'sternenzaun', name: 'Sternenzaun', rarity: 'goettlich', color: '#b49cff', text: 'Nachtblaue Pfosten mit leuchtenden Sternen, dazwischen Bänder aus Licht.' },
];
export const fenceById = Object.fromEntries(FENCES.map((f) => [f.id, f]));

// Aus den Rollen kommen von Bäumen nur die Samen (seed); gesät wachsen sie mit Timer zum Baum
export const LOOT = [
  ...TREES.map((t) => ({ ...t, type: 'tree', seed: `${t.name}-Samen` })),
  ...TOOLS.map((t) => ({ ...t, type: 'tool' })),
  ...FENCES.filter((f) => !f.standard).map((f) => ({ ...f, type: 'fence' })),
];
// Name, wie er im Inventar und beim Öffnen steht: Samen für Bäume, sonst der Name
export const lootName = (item) => item.seed || item.name;
export const lootById = Object.fromEntries(LOOT.map((l) => [l.id, l]));

export const GARDEN = {
  price: 25000, // Garten kaufen
  startBeds: 4,
  maxBeds: 12,
  bedPrice: (beds) => 15000 * 2 ** (beds - 4), // nächstes Beet
  maxRipe: 3, // so viele Ernten wartet ein Baum, dann hört er auf zu tragen
};

// ── Regeln (wie GardenData) ──────────────────────────────────────────────────

// Stufe eines Beets: 0 leer, 1 Setzling, 2 Jungbaum, 3 ausgewachsen
export function stage(plot, now) {
  if (!plot) return 0;
  const tree = lootById[plot.tree];
  const p = (now - plot.planted + plot.bonus) / tree.grow;
  return p >= 1 ? 3 : p >= 0.34 ? 2 : 1;
}
export const grownAt = (plot) => plot.planted - plot.bonus + lootById[plot.tree].grow;
// Ernten, die ein Baum noch hergibt (danach ist er abgeerntet)
export const harvestsLeft = (plot) => Math.max(0, lootById[plot.tree].harvests - (plot.count || 0));
export function ripe(plot, now) {
  if (stage(plot, now) < 3) return 0;
  const tree = lootById[plot.tree];
  return Math.min(GARDEN.maxRipe, harvestsLeft(plot), Math.floor((now - Math.max(grownAt(plot), plot.harvested)) / tree.cycle));
}
export const boostMult = (plot, now) => (plot.boostEnd > now ? plot.boost : 1);
// Taler einer Ernte jetzt
export const harvestValue = (plot, now) => ripe(plot, now) * lootById[plot.tree].yield * boostMult(plot, now);

// ── Spielstand der Vorschau (geteilt mit der Rollen-Seite) ───────────────────

const KEY = 'coinmaster.garten';
export const START_TALER = 50000;

export function freshState() {
  return { taler: START_TALER, owned: false, beds: GARDEN.startBeds, fence: 'holzzaun', plots: [], inv: {}, clock: { vt: 0, real: Date.now(), speed: 1 } };
}
export function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && typeof s.taler === 'number') return { ...freshState(), ...s };
  } catch {}
  return freshState();
}
export function saveState(s) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}
// Gartenzeit in Sekunden (die Vorschau kann vorspulen)
export function now(s) {
  return s.clock.vt + ((Date.now() - s.clock.real) / 1000) * s.clock.speed;
}
export function setSpeed(s, speed) {
  s.clock = { vt: now(s), real: Date.now(), speed };
}
export function addLoot(s, items) {
  for (const it of items) s.inv[it.id] = (s.inv[it.id] || 0) + 1;
}

export const fmt = (n) => Math.round(n).toLocaleString('de-DE');
export function fmtTime(sec) {
  sec = Math.max(0, Math.ceil(sec));
  const join = (a, ua, b, ub) => (b ? `${a} ${ua} ${b} ${ub}` : `${a} ${ua}`);
  if (sec >= 3600) return join(Math.floor(sec / 3600), 'h', Math.floor((sec % 3600) / 60), 'min');
  if (sec >= 60) return join(Math.floor(sec / 60), 'min', sec % 60, 's');
  return `${sec} s`;
}

// ── Spielstand wie im Spiel (Attribut Garden, siehe GardenData in Luau) ──────
// { Owned, Beds, Fence, Plots: { "1": { Tree, Planted, Bonus, Harvested, Boost, BoostEnd, Count } }, Inv: { id: n } }
// Zeiten in Sekunden (os.time()). gardenAct ist dieselbe Regel wie GardenData.Act.

export const newGarden = () => ({ Owned: false, Beds: GARDEN.startBeds, Fence: 'holzzaun', Plots: {}, Inv: {}, Receipts: [] });
const asPlot = (p) => ({ tree: p.Tree, planted: p.Planted, bonus: p.Bonus, harvested: p.Harvested, boost: p.Boost, boostEnd: p.BoostEnd, count: p.Count || 0 });
const kindName = { water: 'Water', boost: 'Boost', taler: 'Taler', bed: 'Bed' };

// → [ok, text, Taler-Änderung]
export function gardenAct(g, action, a, b, t, taler) {
  const bed = Number(a);
  const take = (id) => {
    g.Inv[id] = (g.Inv[id] || 0) - 1;
    if (g.Inv[id] <= 0) delete g.Inv[id];
  };
  if (action === 'buyGarden') {
    if (g.Owned) return [false, 'Du hast schon einen Garten', 0];
    if (taler < GARDEN.price) return [false, 'Zu wenig Taler', 0];
    g.Owned = true;
    g.Beds = Math.max(g.Beds, GARDEN.startBeds);
    return [true, 'Der Münzbaumgarten gehört dir!', -GARDEN.price];
  }
  if (!g.Owned) return [false, 'Kauf zuerst den Garten', 0];
  if (action === 'buyBed') {
    if (g.Beds >= GARDEN.maxBeds) return [false, 'Mehr Beete gehen nicht', 0];
    const price = GARDEN.bedPrice(g.Beds);
    if (taler < price) return [false, 'Zu wenig Taler', 0];
    g.Beds++;
    return [true, `Beet ${g.Beds} ist umgegraben`, -price];
  }
  if (action === 'plant') {
    const tree = lootById[b];
    if (!Number.isInteger(bed) || bed < 1 || bed > g.Beds) return [false, 'Dieses Beet gibt es nicht', 0];
    if (g.Plots[bed]) return [false, 'Das Beet ist schon belegt', 0];
    if (!tree || tree.type !== 'tree' || !(g.Inv[b] > 0)) return [false, 'Diese Samen hast du nicht', 0];
    take(b);
    g.Plots[bed] = { Tree: b, Planted: t, Bonus: 0, Harvested: 0, Boost: 1, BoostEnd: 0 };
    return [true, `${tree.seed} in Beet ${bed} gesät`, 0];
  }
  if (action === 'use') {
    const tool = lootById[a];
    if (!tool || tool.type !== 'tool' || !(g.Inv[a] > 0)) return [false, 'Das hast du nicht', 0];
    const kind = kindName[tool.kind];
    if (kind === 'Taler') {
      take(a);
      return [true, `+${fmt(tool.amount)} Taler aus ${tool.name}`, tool.amount];
    }
    if (kind === 'Bed') {
      if (g.Beds >= GARDEN.maxBeds) return [false, 'Mehr Beete gehen nicht', 0];
      take(a);
      g.Beds++;
      return [true, `${tool.name}: Beet ${g.Beds} ist umgegraben`, 0];
    }
    const i = Number(b);
    const plot = g.Plots[i];
    if (!plot) return [false, 'Auf dem Beet wächst nichts', 0];
    if (kind === 'Water') {
      const left = grownAt(asPlot(plot)) - t;
      if (left <= 0) return [false, 'Der Baum ist schon ausgewachsen', 0];
      plot.Bonus += Math.min(tool.seconds, left);
      take(a);
      return [true, `Beet ${i} gegossen${tool.seconds >= left ? ': ausgewachsen!' : ` (${fmtTime(tool.seconds)} schneller)`}`, 0];
    }
    plot.Boost = tool.mult;
    plot.BoostEnd = t + tool.seconds;
    take(a);
    return [true, `Beet ${i} gedüngt: ×${tool.mult} Ernte für ${fmtTime(tool.seconds)}`, 0];
  }
  if (action === 'harvest') {
    let total = 0;
    const gone = [];
    for (const [key, plot] of Object.entries(g.Plots)) {
      if (a !== 'all' && Number(key) !== bed) continue;
      const pl = asPlot(plot);
      const n = ripe(pl, t);
      const value = harvestValue(pl, t);
      if (value > 0) {
        total += value;
        plot.Harvested = t;
        plot.Count = (plot.Count || 0) + n;
        // Grenze erreicht: der Baum ist abgeerntet und verschwindet
        if (plot.Count >= lootById[plot.Tree].harvests) {
          gone.push(lootById[plot.Tree].name);
          delete g.Plots[key];
        }
      }
    }
    if (total <= 0) return [false, 'Noch nichts reif', 0];
    return [true, `+${fmt(total)} Taler geerntet${gone.length ? ` · ${gone.join(', ')} abgeerntet, das Beet ist frei` : ''}`, total];
  }
  if (action === 'dig') {
    const plot = g.Plots[bed];
    if (!plot) return [false, 'Auf dem Beet wächst nichts', 0];
    const pl = asPlot(plot);
    const value = harvestValue(pl, t);
    const tree = lootById[plot.Tree];
    delete g.Plots[bed];
    // nur ein noch nicht ausgewachsener Baum gibt seine Samen zurück
    if (stage(pl, t) < 3) {
      g.Inv[plot.Tree] = (g.Inv[plot.Tree] || 0) + 1;
      return [true, `${tree.name} ausgegraben, die ${tree.seed} liegen wieder im Inventar`, value];
    }
    return [true, `${tree.name} ausgerissen, das Beet ist frei`, value];
  }
  if (action === 'fence') {
    const fence = fenceById[a];
    if (!fence) return [false, 'Diesen Zaun gibt es nicht', 0];
    if (!fence.standard && !(g.Inv[a] > 0)) return [false, 'Diesen Zaun hast du nicht', 0];
    g.Fence = a;
    return [true, `${fence.name} angebracht`, 0];
  }
  return [false, 'Ungültig', 0];
}
