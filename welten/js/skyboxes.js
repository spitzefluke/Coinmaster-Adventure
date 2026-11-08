// Welten mit eigenem Himmelsbild (tools/himmel/himmel.py malt assets/himmel/<welt>/seite|oben|unten.jpg).
// In Roblox: Sky mit SkyboxBk/Ft/Lf/Rt = seite, SkyboxUp = oben, SkyboxDn = unten. Die IDs trägt man im
// Ordner „Licht > Himmelsbild“ der Welt ein; bis dahin bleibt die alte Himmelskuppel.
//   wall     Wand am Horizont (verdeckt die Nachbarinseln): Farben unten, Mitte, oben
//   sea      Farben des Wolkenmeers unter der Insel (sonst aus der Himmelsfarbe)
//   seaMaterial / seaGlow  Material der Meeresteile; Anteil leuchtender Neon-Becken (Lava)
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
  wald: { sun: true, sea: ['#eef6ea', '#e2eedd', '#f6faf2'], wall: { low: ['#d6e8d2', '#cfe2cc'], mid: ['#eef6e8', '#e4f0de'], top: ['#f6fbf0', '#eef6e8'] } },
};

// Pfade relativ zur Wurzel der Webseite
export const skyboxFiles = (id) => ({ seite: `assets/himmel/${id}/seite.jpg`, oben: `assets/himmel/${id}/oben.jpg`, unten: `assets/himmel/${id}/unten.jpg` });
