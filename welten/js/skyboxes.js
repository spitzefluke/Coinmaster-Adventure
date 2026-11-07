// Welten mit eigenem Himmelsbild (tools/himmel/himmel.py malt assets/himmel/<welt>/seite|oben|unten.jpg).
// In Roblox: Sky mit SkyboxBk/Ft/Lf/Rt = seite, SkyboxUp = oben, SkyboxDn = unten. Die IDs trägt man im
// Ordner „Licht > Himmelsbild“ der Welt ein; bis dahin bleibt die alte Himmelskuppel.
//   wall     Wand am Horizont (verdeckt die Nachbarinseln): Farben unten, Mitte, oben
//   sun      Sonne und Mond von Roblox zeigen (CelestialBodiesShown)
export const SKYBOXES = {
  normal: { sun: true, wall: { low: ['#e8f1fb', '#dce9f7'], mid: ['#ffffff', '#f3f8fe'], top: ['#ffffff', '#fbfdff'] } },
};

// Pfade relativ zur Wurzel der Webseite
export const skyboxFiles = (id) => ({ seite: `assets/himmel/${id}/seite.jpg`, oben: `assets/himmel/${id}/oben.jpg`, unten: `assets/himmel/${id}/unten.jpg` });
