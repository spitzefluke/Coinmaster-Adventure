// Edelsteine: Im Juwelnebel (Galaxie 2, nach der Supernova) findet man Edelsteine statt Münzen.
// Sie haben dieselben 10 Seltenheitsstufen wie die Münzen (gleiche Drop-Chancen, gleiches Glück), sind aber
// zehnmal so viel wert. Man verkauft sie für Diamantstaub, die Währung des Juwelnebels.
//
// cut: Schliff (rund, oval, tropfen, smaragd, herz, prinzess, stern), colors: [hell, Grundfarbe, dunkel]

import { LADDER } from '../../muenzen/js/coins.js';

// Dieselben Seltenheitsstufen wie die Münzen, ohne Premium und mit der ursprünglichen Chance für Normal (40 %)
export const TIERS = LADDER.map((t) => (t.id === 'normal' ? { ...t, chance: 40 } : t));
export const tierById = Object.fromEntries(TIERS.map((t, i) => [t.id, { ...t, index: i }]));

export const GEM_FACTOR = 10; // Edelstein = 10 × Münzwert der Stufe, in Diamantstaub

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

// Grundwert eines Edelsteins in Diamantstaub (ohne Welt, Wiedergeburt, Supernova)
export function gemBaseValue(gem) {
  const base = Number(tierById[gem.tier].value);
  return (Number.isFinite(base) ? base : 1000000) * GEM_FACTOR;
}


// ── Edelstein-Taschen ────────────────────────────────────────────────────────
// 50 eigene Taschen nur für Edelsteine, in 5 Stufen. Man kauft sie der Reihe nach mit Diamantstaub;
// die Kapazität sagt, wie viele Edelsteine man gleichzeitig tragen kann. Nr. 1 hat jeder von Anfang an.

export const GEM_BAG_TIERS = [
  { id: 'splitter', name: 'Splitter', color: '#c8c2dc' },
  { id: 'kristall', name: 'Kristall', color: '#c98bff' },
  { id: 'juwel', name: 'Juwel', color: '#3ee08a' },
  { id: 'prisma', name: 'Prisma', color: '#5ad8ff' },
  { id: 'supernova', name: 'Supernova', color: '#ff5fd2' },
];

const BAG_NAMES = [
  // Splitter
  ['Quarzsäckchen', 'Ein Säckchen aus grobem Leinen mit einem Quarz als Knopf.'],
  ['Glitzerbeutel', 'Innen mit Glitzerstoff gefüttert, damit nichts zerkratzt.'],
  ['Steinchen-Dose', 'Eine runde Blechdose. Klappert bei jedem Schritt.'],
  ['Funkelranzen', 'Ein kleiner Ranzen, dessen Nieten wie Splitter glänzen.'],
  ['Kieselkorb', 'Geflochten aus Weidenruten, am Rücken festgeschnallt.'],
  ['Schürftasche', 'Die Tasche der Edelsteinschürfer, voller Staub.'],
  ['Rosenquarz-Beutel', 'Zartrosa und weich wie ein Kissen.'],
  ['Glimmerkiste', 'Eine Holzkiste mit Glimmerplättchen an den Seiten.'],
  ['Achatrucksack', 'Die Klappe ist mit einer Achatscheibe verziert.'],
  ['Splitterköcher', 'Statt Pfeilen stecken darin glitzernde Splitter.'],
  // Kristall
  ['Amethyst-Ranzen', 'Ein Ranzen aus violettem Leder mit Amethyst-Schnallen.'],
  ['Kristallkästchen', 'Ein gläsernes Kästchen, in dem die Steine schweben.'],
  ['Drusen-Rucksack', 'Wie eine aufgebrochene Druse: außen Fels, innen Kristall.'],
  ['Topas-Tornister', 'Goldgelb wie die Dünen von Planet 5.'],
  ['Prismatasche', 'Wirft kleine Regenbögen, wenn Licht darauf fällt.'],
  ['Eiskristall-Kiepe', 'Eine Rückentrage aus durchsichtigem Kristall.'],
  ['Glockenbeutel', 'Klingt bei jedem neuen Stein wie ein Glöckchen.'],
  ['Mondsteinschale', 'Eine Schale auf dem Rücken, die nachts bläulich schimmert.'],
  ['Kristallflügel', 'Zwei kleine Flügel aus Kristall, darunter Fächer für Steine.'],
  ['Grottenrucksack', 'So groß wie eine kleine Grotte und genauso funkelnd.'],
  // Juwel
  ['Smaragdtruhe', 'Eine grüne Truhe mit goldenen Beschlägen.'],
  ['Jadeschrein', 'Ein kleiner Tempel aus Jade, den man auf dem Rücken trägt.'],
  ['Saphirkoffer', 'Königsblau, mit einem Schloss aus Silber.'],
  ['Juwelenkranz', 'Ein Kranz aus Juwelen, der um den Rücken schwebt.'],
  ['Rubinpanzer', 'Ein Rückenpanzer aus Rubinplatten, glühend rot.'],
  ['Schatzkammer-Ranzen', 'Innen größer als außen: eine ganze Schatzkammer.'],
  ['Juwelendrache', 'Ein kleiner Drache, der Edelsteine in seinem Bauch sammelt.'],
  ['Kronjuwelenkiste', 'Die Kiste, in der früher die Kronjuwelen lagen.'],
  ['Smaragdflügel', 'Flügel aus Smaragdblättern, die leise klingen.'],
  ['Juwelenturm', 'Ein kleiner Turm mit einem Edelstein in jedem Fenster.'],
  // Prisma
  ['Opalkapsel', 'Eine Kapsel, die in allen Farben schillert.'],
  ['Regenbogenschrein', 'Jedes Fach hat eine andere Farbe des Regenbogens.'],
  ['Lichtprisma', 'Ein schwebendes Prisma, das Steine in Licht verwandelt und zurück.'],
  ['Diamantgehäuse', 'Ein Gehäuse aus Diamantglas. Fast unzerbrechlich.'],
  ['Alexandrit-Flügel', 'Am Tag grün, in der Nacht rot, wie der Stein.'],
  ['Kristallthron', 'Ein Thron auf dem Rücken. Die Steine sitzen in der Lehne.'],
  ['Spektralrucksack', 'Zeigt seinen Inhalt als leuchtendes Farbspektrum.'],
  ['Feueropal-Laterne', 'Eine Laterne, in der kleine Flammen die Steine wärmen.'],
  ['Prismenrad', 'Ein drehendes Rad aus Prismen, jedes Fach ein Stein.'],
  ['Diamantschwingen', 'Große Schwingen aus Diamant, die beim Fliegen funkeln.'],
  // Supernova
  ['Sternsaphir-Kern', 'Ein leuchtender Kern, um den die Steine kreisen.'],
  ['Nebelsphäre', 'Eine Kugel voller Sternennebel. Steine verschwinden darin.'],
  ['Kometenschweif', 'Ein Schweif aus Licht, der Edelsteine hinter dir herzieht.'],
  ['Galaxienrad', 'Eine kleine Spiralgalaxie, die sich langsam dreht.'],
  ['Supernova-Ring', 'Ein Ring aus Sternenfeuer, der um dich schwebt.'],
  ['Sternenschmiede', 'Eine Schmiede, in der neue Edelsteine entstehen.'],
  ['Pulsar-Herz', 'Pulsiert im Takt. Je mehr Steine, desto schneller.'],
  ['Juwelnebel-Wolke', 'Ein Stück des Juwelnebels, das dir folgt.'],
  ['Schwarzes Loch', 'Passt fast alles hinein. Nur Licht entkommt.'],
  ['Herz des Juwelnebels', 'Die größte Tasche, die es gibt. Hier passen alle Edelsteine hinein.'],
];

const roundNice = (n) => {
  const p = Math.pow(10, Math.max(0, Math.floor(Math.log10(n)) - 1));
  return Math.round(n / p) * p;
};

// Kapazität wächst von 25 auf 100.000 Steine, der Preis von gratis bis rund 5 Mrd. Diamantstaub
export const GEM_BAGS = BAG_NAMES.map(([name, text], i) => ({
  nr: i + 1,
  name,
  text,
  tier: GEM_BAG_TIERS[Math.floor(i / 10)].id,
  capacity: i === 49 ? 100000 : roundNice(25 * Math.pow(100000 / 25, i / 49)),
  price: i === 0 ? 0 : roundNice(500 * Math.pow(5e9 / 500, (i - 1) / 48)),
}));
export const gemBagByNr = (nr) => GEM_BAGS[Math.max(1, Math.min(GEM_BAGS.length, nr | 0)) - 1];
