// Skilltree: ein Kern in der Mitte, von dem vier Äste ausgehen.
//
// Jeder Skill hat mehrere Stufen. Eine Stufe kostet `cost` Skillpunkte. Ein Skill lässt sich
// erst lernen, wenn sein Vorgänger (`req`) mindestens Stufe 1 hat. `per` ist der Effekt pro
// Stufe; `format` macht daraus den angezeigten Text.
//
// Position (x, y) im Baum: Raster mit dem Kern bei (0, 0); jeder Ast zeigt in eine Richtung.
// Werte sind Vorschläge und hier anpassbar.

export const BRANCHES = [
  { id: 'erkundung', name: 'Erkundung', color: '#5fd38d', text: 'Münzen in den Welten schneller finden und einsammeln.' },
  { id: 'glueck', name: 'Münzen & Glück', color: '#f2c14e', text: 'Seltenere und wertvollere Münzen.' },
  { id: 'eier', name: 'Eier & Haustiere', color: '#ff8ac8', text: 'Günstigere Eier und bessere Haustiere.' },
  { id: 'komfort', name: 'Komfort', color: '#7ab8ff', text: 'Mehr Platz und weniger Klicken.' },
];

const pct = (v) => `+${v.toLocaleString('de-DE')} %`;
const minus = (v) => `−${v.toLocaleString('de-DE')} %`;

export const SKILLS = [
  { id: 'kern', branch: null, name: 'Münzmeister', max: 1, cost: 0, x: 0, y: 0, per: 0, icon: 'coin',
    text: 'Der Anfang von allem. Von hier wachsen die vier Äste.', format: () => 'Freigeschaltet' },

  // ── Erkundung (oben) ──
  { id: 'fuesse', branch: 'erkundung', name: 'Flinke Füße', max: 5, cost: 1, x: 0, y: -1, req: 'kern', per: 5, icon: 'boot',
    text: 'Schneller laufen in allen Welten.', format: (v) => `${pct(v)} Laufgeschwindigkeit` },
  { id: 'magnet', branch: 'erkundung', name: 'Münzmagnet', max: 5, cost: 1, x: -0.8, y: -2, req: 'fuesse', per: 2, icon: 'magnet',
    text: 'Münzen in der Nähe fliegen von selbst zu dir.', format: (v) => `${v} Studs Sammelradius` },
  { id: 'sprung', branch: 'erkundung', name: 'Sprungkraft', max: 3, cost: 1, x: 0.8, y: -2, req: 'fuesse', per: 10, icon: 'jump',
    text: 'Höher springen und versteckte Münzen erreichen.', format: (v) => `${pct(v)} Sprunghöhe` },
  { id: 'radar', branch: 'erkundung', name: 'Münzradar', max: 3, cost: 2, x: -0.8, y: -3, req: 'magnet', per: 25, icon: 'radar',
    text: 'Zeigt Münzen in der Umgebung auf der Minikarte.', format: (v) => `${v} Studs Radarreichweite` },
  { id: 'kompass', branch: 'erkundung', name: 'Weltenkompass', max: 1, cost: 3, x: 0, y: -4, req: 'radar', per: 1, icon: 'compass',
    text: 'Zeigt die Richtung zur seltensten Münze der Welt.', format: () => 'Kompass zur seltensten Münze' },

  // ── Münzen & Glück (rechts) ──
  { id: 'glueckspilz', branch: 'glueck', name: 'Glückspilz', max: 5, cost: 1, x: 1, y: 0, req: 'kern', per: 4, icon: 'clover',
    text: 'Seltene Stufen werden häufiger.', format: (v) => `${pct(v)} Chance auf seltene Münzen` },
  { id: 'wert', branch: 'glueck', name: 'Wertvoller Fund', max: 5, cost: 1, x: 2, y: -0.8, req: 'glueckspilz', per: 5, icon: 'gem',
    text: 'Jede gefundene Münze ist mehr wert.', format: (v) => `${pct(v)} Münzwert` },
  { id: 'doppel', branch: 'glueck', name: 'Doppelfund', max: 5, cost: 1, x: 2, y: 0.8, req: 'glueckspilz', per: 3, icon: 'double',
    text: 'Manchmal liegt dieselbe Münze zweimal da.', format: (v) => `${v} % Chance auf doppelte Münze` },
  { id: 'wetter', branch: 'glueck', name: 'Wettergespür', max: 5, cost: 2, x: 3, y: -0.8, req: 'wert', per: 2, icon: 'cloud',
    text: 'Während eines Wetters mutieren Münzen öfter.', format: (v) => `+${v} Prozentpunkte Mutationschance` },
  { id: 'goldhand', branch: 'glueck', name: 'Goldene Hand', max: 3, cost: 3, x: 4, y: 0, req: 'doppel', per: 2, icon: 'hand',
    text: 'Eine gefundene Münze steigt manchmal eine Stufe auf.', format: (v) => `${v} % Chance auf eine Stufe höher` },

  // ── Eier & Haustiere (unten) ──
  { id: 'feilscher', branch: 'eier', name: 'Feilscher', max: 5, cost: 1, x: 0, y: 1, req: 'kern', per: 4, icon: 'tag',
    text: 'Eier im Shop werden günstiger.', format: (v) => `${minus(v)} Eierpreis` },
  { id: 'brutwaerme', branch: 'eier', name: 'Brutwärme', max: 5, cost: 1, x: 0.8, y: 2, req: 'feilscher', per: 10, icon: 'flame',
    text: 'Eier schlüpfen schneller.', format: (v) => `${minus(v)} Schlüpfzeit` },
  { id: 'tierfreund', branch: 'eier', name: 'Haustierfreund', max: 5, cost: 1, x: -0.8, y: 2, req: 'feilscher', per: 5, icon: 'paw',
    text: 'Haustiere geben einen größeren Bonus.', format: (v) => `${pct(v)} Haustier-Bonus` },
  { id: 'zwilling', branch: 'eier', name: 'Zwillingsei', max: 5, cost: 2, x: 0.8, y: 3, req: 'brutwaerme', per: 2, icon: 'eggs',
    text: 'Aus einem Ei schlüpfen manchmal zwei Haustiere.', format: (v) => `${v} % Chance auf Doppel-Schlupf` },
  { id: 'nest', branch: 'eier', name: 'Glückliches Nest', max: 3, cost: 3, x: 0, y: 4, req: 'zwilling', per: 1, icon: 'nest',
    text: 'Seltene Haustiere schlüpfen häufiger.', format: (v) => `${pct(v)} Chance auf seltene Haustiere` },

  // ── Komfort (links) ──
  { id: 'beutel', branch: 'komfort', name: 'Großer Beutel', max: 5, cost: 1, x: -1, y: 0, req: 'kern', per: 10, icon: 'bag',
    text: 'Mehr Platz im Inventar.', format: (v) => `+${v} Inventarplätze` },
  { id: 'offline', branch: 'komfort', name: 'Offline-Taler', max: 5, cost: 1, x: -2, y: 0.8, req: 'beutel', per: 5, icon: 'moon',
    text: 'Du verdienst Taler, während du nicht spielst.', format: (v) => `${v} % der Einnahmen offline` },
  { id: 'autosammeln', branch: 'komfort', name: 'Auto-Sammeln', max: 1, cost: 2, x: -2, y: -0.8, req: 'beutel', per: 1, icon: 'auto',
    text: 'Münzen im Sammelradius werden automatisch eingesammelt.', format: () => 'Automatisches Einsammeln' },
  { id: 'autoverkauf', branch: 'komfort', name: 'Auto-Verkauf', max: 1, cost: 2, x: -3, y: 0.8, req: 'offline', per: 1, icon: 'coins',
    text: 'Gewählte Seltenheiten werden beim Finden direkt verkauft.', format: () => 'Automatischer Verkauf' },
  { id: 'schnellreise', branch: 'komfort', name: 'Schnellreise', max: 1, cost: 3, x: -4, y: 0, req: 'autosammeln', per: 1, icon: 'portal',
    text: 'Zwischen entdeckten Welten teleportieren.', format: () => 'Teleport zwischen Welten' },
];

export const skillById = Object.fromEntries(SKILLS.map((s) => [s.id, s]));
export const branchById = Object.fromEntries(BRANCHES.map((b) => [b.id, b]));
