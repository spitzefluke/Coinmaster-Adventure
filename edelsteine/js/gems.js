// Edelsteine: Im Juwelnebel (Galaxie 2, nach der Supernova) findet man Edelsteine statt Münzen.
// Sie haben dieselben 10 Seltenheitsstufen wie die Münzen (gleiche Drop-Chancen, gleiches Glück), sind aber
// zehnmal so viel wert. Man verkauft sie wie Münzen für Taler.
//
// cut: Schliff (rund, oval, tropfen, smaragd, herz, prinzess, stern), colors: [hell, Grundfarbe, dunkel]

import { TIERS, tierById } from '../../muenzen/js/coins.js';

export const GEM_FACTOR = 10; // Edelstein = 10 × Münzwert der Stufe

export const GEMS = [
  // Normal
  { id: 'quarz', name: 'Quarz', tier: 'normal', cut: 'prinzess', colors: ['#ffffff', '#e8e4f4', '#a8a0c4'], text: 'Klar wie Eis. Der häufigste Stein im Juwelnebel, aber schön anzusehen.' },
  { id: 'rosenquarz', name: 'Rosenquarz', tier: 'normal', cut: 'oval', colors: ['#ffe4ee', '#f6b8cc', '#c87a96'], text: 'Zartrosa und milchig. Liegt oft in kleinen Häufchen im Quarzfeld.' },
  // Selten
  { id: 'achat', name: 'Achat', tier: 'selten', cut: 'oval', colors: ['#f4d8b8', '#c87a4a', '#7a3a1e'], text: 'Innen voller Ringe, wie die Jahresringe eines Baums.' },
  { id: 'jaspis', name: 'Jaspis', tier: 'selten', cut: 'rund', colors: ['#ffb8a0', '#c8402a', '#7a1a10'], text: 'Rot und matt. Glänzt erst, wenn man ihn poliert.' },
  // Sehr selten
  { id: 'amethyst', name: 'Amethyst', tier: 'sehr-selten', cut: 'tropfen', colors: ['#ead2ff', '#a35ae8', '#5a2a9a'], text: 'Violett wie die Grotten, in denen er wächst.' },
  { id: 'topas', name: 'Topas', tier: 'sehr-selten', cut: 'smaragd', colors: ['#fff0b8', '#ffb02e', '#b06a10'], text: 'Goldgelb wie Honig. Die Dünen von Planet 5 sind voll davon.' },
  // Episch
  { id: 'aquamarin', name: 'Aquamarin', tier: 'episch', cut: 'smaragd', colors: ['#e0fffc', '#5ad8e8', '#1a8a9a'], text: 'Meerblau und durchsichtig, als hätte jemand Wasser eingefroren.' },
  { id: 'peridot', name: 'Peridot', tier: 'episch', cut: 'herz', colors: ['#f0ffc8', '#9ae03a', '#4a8a10'], text: 'Hellgrün wie frisches Gras. Funkelt sogar im Schatten.' },
  // Legendär
  { id: 'smaragd', name: 'Smaragd', tier: 'legendaer', cut: 'smaragd', colors: ['#b4ffd6', '#1ec870', '#0a6a3a'], text: 'Tiefgrün. Im Smaragdwald hängen sie an den Bäumen wie Blätter.' },
  { id: 'saphir', name: 'Saphir', tier: 'legendaer', cut: 'oval', colors: ['#c8d8ff', '#2a5ae8', '#0e2a8a'], text: 'Königsblau. Auf dem Grund des Saphirsees leuchten sie wie Sterne.' },
  // Mystisch
  { id: 'rubin', name: 'Rubin', tier: 'mystisch', cut: 'herz', colors: ['#ffc8d4', '#e8183a', '#8a0a1e'], text: 'Glutrot. Der Rubinvulkan spuckt ihn nur selten aus.' },
  { id: 'mondstein', name: 'Mondstein', tier: 'mystisch', cut: 'rund', colors: ['#ffffff', '#cfe0ff', '#7a8ac8'], text: 'Schimmert bläulich, als läge Mondlicht darin.' },
  // Engelsgleich
  { id: 'opal', name: 'Opal', tier: 'engelsgleich', cut: 'oval', colors: ['#fff0fa', '#ff9ae0', '#5ad8ff'], text: 'Schillert in allen Farben, je nachdem, wie man ihn dreht.' },
  { id: 'alexandrit', name: 'Alexandrit', tier: 'engelsgleich', cut: 'tropfen', colors: ['#d8ffe8', '#2ab08a', '#a83a8a'], text: 'Am Tag grün, in der Nacht rot. Niemand weiß, warum.' },
  // Göttlich
  { id: 'diamant', name: 'Diamant', tier: 'goettlich', cut: 'rund', colors: ['#ffffff', '#e8fdff', '#8ad0e8'], text: 'Härter als alles andere. Bricht das Licht in Regenbögen.' },
  { id: 'feueropal', name: 'Feueropal', tier: 'goettlich', cut: 'herz', colors: ['#fff0b8', '#ff7a1a', '#c81a2a'], text: 'In ihm tanzen kleine Flammen, die nie ausgehen.' },
  // Galaktisch
  { id: 'sternsaphir', name: 'Sternsaphir', tier: 'galaktisch', cut: 'stern', colors: ['#e8e0ff', '#5a4ae8', '#1a0e6a'], text: 'Ein sechsstrahliger Stern leuchtet in seiner Mitte.' },
  { id: 'nebelkristall', name: 'Nebelkristall', tier: 'galaktisch', cut: 'prinzess', colors: ['#ffd8f6', '#c84ad8', '#2a1a6a'], text: 'Ein ganzer Sternennebel ist darin eingeschlossen.' },
  // Unerreichbar
  { id: 'supernova-diamant', name: 'Supernova-Diamant', tier: 'unerreichbar', cut: 'stern', colors: ['#ffffff', '#ffe7a8', '#ff5fd2'], text: 'Entstanden im Licht der Supernova. Es gibt nur ganz wenige davon.' },
  { id: 'herz-der-galaxie', name: 'Herz der Galaxie', tier: 'unerreichbar', cut: 'herz', colors: ['#ffffff', '#8af0ff', '#c84ad8'], text: 'Pulsiert langsam wie ein Herzschlag. Der seltenste Stein, den es gibt.' },
];

export const gemById = Object.fromEntries(GEMS.map((g) => [g.id, g]));
export const gemsOfTier = (tierId) => GEMS.filter((g) => g.tier === tierId);

// Grundwert eines Edelsteins in Talern (ohne Welt, Wiedergeburt, Supernova)
export function gemBaseValue(gem) {
  const base = Number(tierById[gem.tier].value);
  return (Number.isFinite(base) ? base : 1000000) * GEM_FACTOR;
}

export { TIERS, tierById };
