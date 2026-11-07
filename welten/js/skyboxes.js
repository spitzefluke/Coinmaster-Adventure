// Welten mit eigenem Himmelsbild (tools/himmel/himmel.py malt assets/himmel/<welt>/seite|oben|unten.jpg).
// In Roblox: Sky mit SkyboxBk/Ft/Lf/Rt = seite, SkyboxUp = oben, SkyboxDn = unten. Die IDs trägt man im
// Ordner „Licht > Himmelsbild“ der Welt ein; bis dahin bleibt die alte Himmelskuppel.
//   wall     Wand am Horizont (verdeckt die Nachbarinseln): Farben unten, Mitte, oben
//   sea      Farben des Wolkenmeers unter der Insel (sonst aus der Himmelsfarbe)
//   sun      Sonne und Mond von Roblox zeigen (CelestialBodiesShown)
export const SKYBOXES = {
  normal: { sun: true, wall: { low: ['#e8f1fb', '#dce9f7'], mid: ['#ffffff', '#f3f8fe'], top: ['#ffffff', '#fbfdff'] } },
  stadt: { sun: true, sea: ['#ffe6cc', '#ffd8c0', '#fbeedf'], wall: { low: ['#ffd6b0', '#ffcaa8'], mid: ['#ffe2c0', '#ffd8b8'], top: ['#ffe8cc', '#ffdcc4'] } },
  wald: { sun: true, sea: ['#eef6ea', '#e2eedd', '#f6faf2'], wall: { low: ['#d6e8d2', '#cfe2cc'], mid: ['#eef6e8', '#e4f0de'], top: ['#f6fbf0', '#eef6e8'] } },
};

// Pfade relativ zur Wurzel der Webseite
export const skyboxFiles = (id) => ({ seite: `assets/himmel/${id}/seite.jpg`, oben: `assets/himmel/${id}/oben.jpg`, unten: `assets/himmel/${id}/unten.jpg` });
