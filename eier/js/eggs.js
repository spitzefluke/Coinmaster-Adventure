// Alle Eier, aus denen später Haustiere schlüpfen.
//
// rank 0–6 bestimmt, wie lang und episch das Schlüpfen ist (mehr Wackel-Stöße, längeres
// Aufladen, größere Explosion). Preise sind Vorschläge und hier anpassbar.
// price: null = nicht kaufbar.

export const EGGS = [
  {
    id: 'normal',
    name: 'Normal Egg',
    rank: 0,
    rankName: 'Normal',
    color: '#e8c98f',
    glow: '#ffd89a',
    price: { amount: 250, currency: 'muenzen' },
    availability: 'Immer im Shop',
    text: 'Warm, rund und im Strohnest. Was darin schläft, weiß noch niemand.',
  },
  {
    id: 'wald',
    name: 'Wald Egg',
    rank: 1,
    rankName: 'Selten',
    color: '#6fbf4a',
    glow: '#b6ff6a',
    price: { amount: 2500, currency: 'muenzen' },
    availability: 'Immer im Shop',
    text: 'Von Ranken umschlungen und mit Moos bewachsen. Nachts tanzen Glühwürmchen darum.',
  },
  {
    id: 'eis',
    name: 'Eis Egg',
    rank: 2,
    rankName: 'Episch',
    color: '#7fd6ff',
    glow: '#9ff0ff',
    price: { amount: 15000, currency: 'muenzen' },
    availability: 'Immer im Shop',
    text: 'Aus dem ewigen Gletscher geborgen. Die Schale ist so kalt, dass Schnee um sie herum fällt.',
  },
  {
    id: 'engel',
    name: 'Engels Egg',
    rank: 3,
    rankName: 'Engelsgleich',
    color: '#fff1c2',
    glow: '#fff4cf',
    price: { amount: 75000, currency: 'muenzen' },
    availability: 'Immer im Shop',
    text: 'Perlmutt mit goldenen Ranken, getragen von zwei Flügeln. Es summt ganz leise.',
  },
  {
    id: 'galaxie',
    name: 'Galaxie Egg',
    rank: 4,
    rankName: 'Galaktisch',
    color: '#8a6cff',
    glow: '#b49cff',
    price: { amount: 400000, currency: 'muenzen' },
    availability: 'Immer im Shop',
    text: 'In seiner Schale dreht sich ein Nebel voller Sterne, umkreist von eigenen Planeten.',
  },
  {
    id: 'admin',
    name: 'Admin Egg',
    rank: 5,
    rankName: 'Admin',
    color: '#ff2e48',
    glow: '#ff4058',
    price: null,
    availability: 'Nicht kaufbar · nur für Admins',
    text: 'Existiert offiziell nicht. Gepanzert, verschlüsselt und leicht instabil.',
  },
  {
    id: 'release',
    name: 'Release Egg',
    alias: 'Robux Egg',
    rank: 6,
    rankName: 'Limitiert',
    color: '#ffc93c',
    glow: '#ffe07a',
    price: { amount: 199, currency: 'robux' },
    availability: 'Nur zum Release des Spiels',
    text: 'Gibt es nur zum Start von Coinmaster Adventure. Danach nie wieder.',
  },
];

export const fmtPrice = (p) =>
  !p ? 'Nicht kaufbar' : p.currency === 'robux' ? `R$ ${p.amount.toLocaleString('de-DE')}` : `${p.amount.toLocaleString('de-DE')} Münzen`;
