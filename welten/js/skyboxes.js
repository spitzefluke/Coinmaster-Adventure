// Welten mit eigenem Himmelsbild (tools/himmel/himmel.py malt assets/himmel/<welt>/seite|oben|unten.jpg).
// In Roblox: Sky mit SkyboxBk/Ft/Lf/Rt = seite, SkyboxUp = oben, SkyboxDn = unten. Die IDs trägt man im
// Ordner „Licht > Himmelsbild“ der Welt ein; bis dahin bleibt die alte Himmelskuppel.
//   wall     Wand am Horizont (verdeckt die Nachbarinseln): Farben unten, Mitte, oben
//   sea      Farben des Wolkenmeers unter der Insel (sonst aus der Himmelsfarbe)
//   seaMaterial / seaGlow  Material der Meeresteile; Anteil leuchtender Neon-Becken (Lava)
//   seaOpaque  Meer im All nicht durchscheinend (Mars: Staubdünen)
//   sun      Sonne und Mond von Roblox zeigen (CelestialBodiesShown)
export const SKYBOXES = {
  normal: { sun: true, wall: { low: ['#e8f1fb', '#dce9f7'], mid: ['#ffffff', '#f3f8fe'], top: ['#ffffff', '#fbfdff'] } },
  stadt: { sun: true, sea: ['#ffe6cc', '#ffd8c0', '#fbeedf'], wall: { low: ['#ffd6b0', '#ffcaa8'], mid: ['#ffe2c0', '#ffd8b8'], top: ['#ffe8cc', '#ffdcc4'] } },
  eis: { sun: true, sea: ['#ffffff', '#f2f8ff', '#e8f2fc'], wall: { low: ['#e6f0fa', '#dce8f6'], mid: ['#f4f8fe', '#eaf2fc'], top: ['#f8fbff', '#eef4fc'] } },
  lava: {
    sun: false, sea: ['#2a1c18', '#3a2420', '#221614'], seaMaterial: 'Basalt', seaGlow: { share: 0.35, colors: ['#ff5a14', '#ff7a1a', '#ff3a0a'] },
    wall: { low: ['#3a1a14', '#4a2018'], mid: ['#5a2418', '#4a1e16'], top: ['#6a2a1c', '#5a2418'] },
  },
  hoehle: {
    sun: false, sea: ['#6a4aa8', '#5a3e96', '#7a56b8'], seaGlow: { share: 0.3, colors: ['#8a5aff', '#5ad8ff', '#c87aff'] },
    wall: { low: ['#2a2238', '#241e30'], mid: ['#2e2640', '#2a2238'], top: ['#322a44', '#2e2640'] },
  },
  candy: { sun: true, sea: ['#ffd6ec', '#ffe6f4', '#d8ecff'], wall: { low: ['#ffd0ea', '#ffc6e4'], mid: ['#ffe2f2', '#e2f0ff'], top: ['#fff0f8', '#eef6ff'] } },
  mond: { sun: false, sea: ['#2a2e3e', '#22263a', '#30344a'], wall: { low: ['#1a1e30', '#161a2a'], mid: ['#1e2236', '#1a1e30'], top: ['#22263a', '#1e2236'] } },
  neptun: { sun: false, sea: ['#3a6ad8', '#2a52b8', '#4a7ae0'], wall: { low: ['#2a52b8', '#2448a8'], mid: ['#3a62c8', '#2e56b8'], top: ['#4a72d8', '#3a62c8'] } },
  mars: { sun: false, sea: ['#c4582e', '#b04c26', '#d06a3a'], seaMaterial: 'Sand', seaOpaque: true, wall: { low: ['#a84a24', '#9a4220'], mid: ['#c0603a', '#b05430'], top: ['#d07a4a', '#c06a3e'] } },
  saturn: { sun: false, sea: ['#b0905a', '#c8a870', '#a08050'], wall: { low: ['#7a6440', '#6a5638'], mid: ['#8a7048', '#7a6440'], top: ['#9a7c50', '#8a7048'] } },
  alien: { sun: false, sea: ['#5a2e98', '#4a2478', '#6a3aa8'], seaGlow: { share: 0.2, colors: ['#7aff5a', '#5affd8'] }, wall: { low: ['#3a1a60', '#321650'], mid: ['#4a2478', '#3a1a60'], top: ['#5a2e90', '#4a2478'] } },
  sonne: {
    sun: false, sea: ['#a02a08', '#8a2006', '#c03a10'], seaMaterial: 'CrackedLava', seaOpaque: true, seaGlow: { share: 0.45, colors: ['#ffb02e', '#ffd84a', '#ff7a1a'] },
    wall: { low: ['#ff9a2a', '#ff8a1a'], mid: ['#ffb84a', '#ffa83a'], top: ['#ffd06a', '#ffc05a'] },
  },
  korallenriff: { sun: false }, // unter Wasser: Nebel verdeckt die Nachbarn, keine Wand; Dünen aus worldParts
  muschelland: { sun: false },
  atlantis: { sun: false },
  spawn: { sun: true, sea: ['#fff4e2', '#ffeacc', '#fff8ee'], wall: { low: ['#ffe6c4', '#ffdcb8'], mid: ['#fff0dc', '#ffe8d0'], top: ['#fff8ec', '#fff2e2'] } },
  wald: { sun: true, sea: ['#eef6ea', '#e2eedd', '#f6faf2'], wall: { low: ['#d6e8d2', '#cfe2cc'], mid: ['#eef6e8', '#e4f0de'], top: ['#f6fbf0', '#eef6e8'] } },
  // Werkstatt-Wunsch „Himmel sehr stark verbessern“: jetzt alle Welten mit eigenem Himmelsbild
  tiefseegraben: { sun: false },
  wolkenburg: { sun: true },
  engelsgarten: { sun: true },
  goetterthron: { sun: true },
  quarzfeld: { sun: false },
  amethystgrotte: { sun: false },
  topasduenen: { sun: false },
  smaragdwald: { sun: false },
  jadetempel: { sun: false },
  saphirsee: { sun: false },
  rubinvulkan: { sun: false },
  opalwolken: { sun: false },
  diamantkern: { sun: false },
};

// Tag-Nacht-Wechsel (Werkstatt-Wunsch): Welten auf der Oberfläche haben zusätzlich ein Nachtbild
// (assets/himmel/<welt>/nacht/) und Nachtlicht. horizon/top: Farben des Nachthimmels für Nebel und Atmosphere.
export const NIGHT_SKY = {
  spawn: { horizon: '#3a4a8a', top: '#060a20' },
  normal: { horizon: '#34488a', top: '#050a22' },
  wald: { horizon: '#24485a', top: '#04101a' },
  stadt: { horizon: '#5a3a7a', top: '#0a0620' },
  eis: { horizon: '#1a3a6a', top: '#03081c' },
  candy: { horizon: '#6a4aa8', top: '#140a30' },
  wolkenburg: { horizon: '#3a4a9a', top: '#060a24' },
  engelsgarten: { horizon: '#4a3a8a', top: '#0a0624' },
  goetterthron: { horizon: '#4a2a6a', top: '#08041c' },
};
export const DAY_NIGHT_SECONDS = 720; // ein ganzer Tag dauert 12 Minuten

// Verlauf eines Tages: lange Tagphase in der gemalten Stimmung der Welt (Uhrzeit dayClock), Abenddämmerung
// (Sonne geht unter), Nacht mit Nachthimmel, Morgendämmerung. phase 0..1 → { clock, night (0 Tag … 1 Nacht) }
export function dayNightAt(phase, dayClock) {
  const p = ((phase % 1) + 1) % 1, s = (t) => t * t * (3 - 2 * t);
  if (p < 0.55) return { clock: dayClock, night: 0 };
  if (p < 0.65) { const t = (p - 0.55) / 0.1; return { clock: dayClock + (24 - dayClock) * t, night: s(t) }; }
  if (p < 0.9) return { clock: ((p - 0.65) / 0.25) * 4, night: 1 };
  const t = (p - 0.9) / 0.1;
  return { clock: 4 + (dayClock - 4) * t, night: 1 - s(t) };
}

// Pfade relativ zur Wurzel der Webseite
export const skyboxFiles = (id, night = false) => {
  const d = `assets/himmel/${id}${night ? '/nacht' : ''}`;
  return { seite: `${d}/seite.jpg`, oben: `${d}/oben.jpg`, unten: `${d}/unten.jpg` };
};
