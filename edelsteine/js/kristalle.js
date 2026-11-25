// Gemeinsamer Kern für die Edelsteine in 3D: Daten aller 43 Steine, Schliffe, Materialien, Mutationen,
// Einschlüsse, Gewichte, Klänge und die Fundliste. Genutzt von edelsteine/js/vitrine3d.js (Steckbrief, Vitrine,
// Mutationen) und schleiferei/js/main.js (?-Steine aufbrechen und polieren).

import * as THREE from 'three';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import * as BGU from 'three/addons/utils/BufferGeometryUtils.js';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
// Die Schleiferei hängt sich hier ein, damit Mutationen beim Öffnen live wirken (Funken, Kamerastoß).
const mutHooks = { isLive: () => false, kick: () => {}, burst: () => {} };

// ── Daten ──────────────────────────────────────────────────────────────────
const TIERS = [
  { id: 'normal', name: 'Normal', value: 1, chance: 40, color: '#c27a4a' },
  { id: 'selten', name: 'Selten', value: 5, chance: 25, color: '#c9d1d9' },
  { id: 'sehr-selten', name: 'Sehr selten', value: 10, chance: 15, color: '#f2c14e' },
  { id: 'episch', name: 'Episch', value: 25, chance: 9, color: '#b072ff' },
  { id: 'legendaer', name: 'Legendär', value: 50, chance: 5, color: '#ff8a3d' },
  { id: 'mystisch', name: 'Mystisch', value: 100, chance: 3, color: '#3ee6c8' },
  { id: 'engelsgleich', name: 'Engelsgleich', value: 250, chance: 1.5, color: '#fff4d6' },
  { id: 'goettlich', name: 'Göttlich', value: 500, chance: 0.9, color: '#ffd23f' },
  { id: 'galaktisch', name: 'Galaktisch', value: 1000, chance: 0.5, color: '#7b6cff' },
  { id: 'unerreichbar', name: 'Unerreichbar', value: 1000000, chance: 0.1, color: '#ff5fd2' },
  { id: 'premium', name: 'Premium', value: 40, chance: 2, color: '#d9b26a' },
  { id: 'unbekannt', name: 'Unbekannt', value: 0, chance: 1, color: '#b450ff' },
];
const MYSTERY = 'unbekannt';
const tierById = Object.fromEntries(TIERS.map((t, i) => [t.id, { ...t, index: i }]));
const GEM_FACTOR = 10;

const CUTS = {
  kristall: 'Kristallspitze', herzkissen: 'Herz-Cabochon', baguette: 'Baguette', kissen: 'Kissen',
  scheibe: 'Achatscheibe', kiesel: 'Trommelstein', tropfencabochon: 'Tropfen-Cabochon', kugel: 'Kugel',
  druse: 'Geode', asscher: 'Asscher', dodekaeder: 'Rhombendodekaeder', tafel: 'Tafel',
  saeule: 'Säule', marquise: 'Navette', stab: 'Prismenstab', rose: 'Rosenschliff',
  smaragd: 'Smaragd-Treppe', oval: 'Oval', trillion: 'Trillion', bi: 'Jadescheibe',
  herz: 'Herz', mond: 'Mondsichel', handschmeichler: 'Handschmeichler', hexagon: 'Sechseck-Treppe',
  ovalcabochon: 'Oval-Cabochon', tropfen: 'Tropfen', prinzess: 'Prinzess', briolette: 'Briolette',
  rund: 'Brillant', flamme: 'Flamme', doppelspitze: 'Doppelspitze', sonne: 'Sonnenschliff',
  rundcabochon: 'Rund-Cabochon', oktaeder: 'Oktaeder', komet: 'Kometenkugel', prisma: 'Dreiecksprisma',
  stern: 'Stern', herzjuwel: 'Herzjuwel', singularitaet: 'Singularität', urknall: 'Sternpolyeder', fragezeichen: 'Fragezeichen', prismaherz: 'Prismaherz', perle: 'Perle',
};
const MATS = { klar: 'Durchsichtig', diamant: 'Diamantklar', milchig: 'Milchig', jade: 'Durchscheinend', opak: 'Undurchsichtig', stein: 'Matt poliert', schwarz: 'Tiefschwarz' };
const TEXS = { '': 'Glatt', ringe: 'Achatringe', wellen: 'Malachitwellen', sprenkel: 'Sprenkel', goldsprenkel: 'Goldsprenkel', wolken: 'Jadewolken', streifen: 'Streifen', opalfeuer: 'Opalfeuer', stern: 'Sternlicht', polarlicht: 'Polarlicht' };
const FXS = {
  '': 'Kein Effekt', phantom: 'Phantomkristall', verlauf: 'Rauchverlauf', zweifarbig: 'Zweifarbig', funken: 'Goldfunken',
  glut: 'Innere Glut', geode: 'In der Geode', blasen: 'Wasserbläschen', einschluss: 'Grüner Garten',
  blickwechsel: 'Blau oder Violett, je nach Blickwinkel', mondschein: 'Wandernder Mondschein', labradoreszenz: 'Farbblitze',
  glitzer: 'Glitzerplättchen', schiller: 'Schillern', farbwechsel: 'Wechselt zwischen Grün und Rot', neon: 'Neonleuchten',
  goldfassung: 'Goldfassung mit Öse', regenbogen: 'Regenbogenfunkeln', flammen: 'Tanzende Flammen', strahlen: 'Lichtstrahlen',
  schockwelle: 'Schockwellen', nebel: 'Sternennebel', schweif: 'Kometenschweif', polarlicht: 'Wandernde Lichtbänder',
  galaxie: 'Spiralgalaxie im Inneren', puls: 'Herzschlag', akkretion: 'Glühende Akkretionsscheibe', urknall: 'Explodierender Kern', mysterium: 'Flackert. Muss zerbrochen und poliert werden', prismalicht: 'Wechselt Farbe und Form', muschel: 'Liegt in einer Perlmuttmuschel', perlglanz: 'Perlmuttschimmer', mondtraenen: 'Mondsichel, Mondstrahl und fallende Mondtränen',
};

const OLD = [
  { id: 'quarz', name: 'Quarz', tier: 'normal', colors: ['#ffffff', '#e8e4f4', '#a8a0c4'], text: 'Klar wie Eis. Der häufigste Stein im Juwelnebel, aber schön anzusehen.', look: { cut: 'kristall', mat: 'klar', fx: ['phantom'] } },
  { id: 'rosenquarz', name: 'Rosenquarz', tier: 'normal', colors: ['#ffe4ee', '#f6b8cc', '#c87a96'], text: 'Zartrosa und milchig. Liegt oft in kleinen Häufchen im Quarzfeld.', look: { cut: 'herzkissen', mat: 'milchig' } },
  { id: 'achat', name: 'Achat', tier: 'selten', colors: ['#f4d8b8', '#c87a4a', '#7a3a1e'], text: 'Innen voller Ringe, wie die Jahresringe eines Baums.', look: { cut: 'scheibe', mat: 'opak', tex: 'ringe' } },
  { id: 'jaspis', name: 'Jaspis', tier: 'selten', colors: ['#ffb8a0', '#c8402a', '#7a1a10'], text: 'Rot und matt. Glänzt erst, wenn man ihn poliert.', look: { cut: 'kiesel', mat: 'stein', tex: 'sprenkel' } },
  { id: 'amethyst', name: 'Amethyst', tier: 'sehr-selten', colors: ['#ead2ff', '#a35ae8', '#5a2a9a'], text: 'Violett wie die Grotten, in denen er wächst.', look: { cut: 'druse', mat: 'klar', fx: ['geode'] } },
  { id: 'topas', name: 'Topas', tier: 'sehr-selten', colors: ['#fff0b8', '#ffb02e', '#b06a10'], text: 'Goldgelb wie Honig. Die Dünen von Planet 5 sind voll davon.', look: { cut: 'asscher', mat: 'klar' } },
  { id: 'aquamarin', name: 'Aquamarin', tier: 'episch', colors: ['#e0fffc', '#5ad8e8', '#1a8a9a'], text: 'Meerblau und durchsichtig, als hätte jemand Wasser eingefroren.', look: { cut: 'saeule', mat: 'klar', fx: ['blasen'] } },
  { id: 'peridot', name: 'Peridot', tier: 'episch', colors: ['#f0ffc8', '#9ae03a', '#4a8a10'], text: 'Hellgrün wie frisches Gras. Funkelt sogar im Schatten.', look: { cut: 'marquise', mat: 'klar', fx: ['funken'] } },
  { id: 'smaragd', name: 'Smaragd', tier: 'legendaer', colors: ['#b4ffd6', '#1ec870', '#0a6a3a'], text: 'Tiefgrün. Im Smaragdwald hängen sie an den Bäumen wie Blätter.', look: { cut: 'smaragd', mat: 'klar', fx: ['einschluss'] } },
  { id: 'saphir', name: 'Saphir', tier: 'legendaer', colors: ['#c8d8ff', '#2a5ae8', '#0e2a8a'], text: 'Königsblau. Auf dem Grund des Saphirsees leuchten sie wie Sterne.', look: { cut: 'oval', mat: 'klar' } },
  { id: 'rubin', name: 'Rubin', tier: 'mystisch', colors: ['#ffc8d4', '#e8183a', '#8a0a1e'], text: 'Glutrot. Der Rubinvulkan spuckt ihn nur selten aus.', look: { cut: 'herz', mat: 'klar', fx: ['glut'] } },
  { id: 'mondstein', name: 'Mondstein', tier: 'mystisch', colors: ['#ffffff', '#cfe0ff', '#7a8ac8'], text: 'Schimmert bläulich, als läge Mondlicht darin.', look: { cut: 'mond', mat: 'milchig', fx: ['mondschein'] } },
  { id: 'opal', name: 'Opal', tier: 'engelsgleich', colors: ['#fff0fa', '#ff9ae0', '#5ad8ff'], text: 'Schillert in allen Farben, je nachdem, wie man ihn dreht.', look: { cut: 'ovalcabochon', mat: 'opak', tex: 'opalfeuer', fx: ['schiller'] } },
  { id: 'alexandrit', name: 'Alexandrit', tier: 'engelsgleich', colors: ['#d8ffe8', '#2ab08a', '#a83a8a'], text: 'Am Tag grün, in der Nacht rot. Niemand weiß, warum.', look: { cut: 'tropfen', mat: 'klar', fx: ['farbwechsel'] } },
  { id: 'diamant', name: 'Diamant', tier: 'goettlich', colors: ['#ffffff', '#e8fdff', '#8ad0e8'], text: 'Härter als alles andere. Bricht das Licht in Regenbögen.', look: { cut: 'rund', mat: 'diamant', fx: ['regenbogen'] } },
  { id: 'feueropal', name: 'Feueropal', tier: 'goettlich', colors: ['#fff0b8', '#ff7a1a', '#c81a2a'], text: 'In ihm tanzen kleine Flammen, die nie ausgehen.', look: { cut: 'flamme', mat: 'milchig', fx: ['flammen', 'glut'] } },
  { id: 'sternsaphir', name: 'Sternsaphir', tier: 'galaktisch', colors: ['#e8e0ff', '#5a4ae8', '#1a0e6a'], text: 'Ein sechsstrahliger Stern leuchtet in seiner Mitte.', look: { cut: 'rundcabochon', mat: 'opak', tex: 'stern' } },
  { id: 'nebelkristall', name: 'Nebelkristall', tier: 'galaktisch', colors: ['#ffd8f6', '#c84ad8', '#2a1a6a'], text: 'Ein ganzer Sternennebel ist darin eingeschlossen.', look: { cut: 'oktaeder', mat: 'klar', fx: ['nebel'] } },
  { id: 'supernova-diamant', name: 'Supernova-Diamant', tier: 'unerreichbar', colors: ['#ffffff', '#ffe7a8', '#ff5fd2'], text: 'Entstanden im Licht der Supernova. Es gibt nur ganz wenige davon.', look: { cut: 'stern', mat: 'diamant', fx: ['strahlen', 'schockwelle', 'schiller'] } },
  { id: 'herz-der-galaxie', name: 'Herz der Galaxie', tier: 'unerreichbar', colors: ['#ffffff', '#8af0ff', '#c84ad8'], text: 'Pulsiert langsam wie ein Herzschlag. Der seltenste Stein, den es gibt.', look: { cut: 'herzjuwel', mat: 'klar', fx: ['galaxie', 'puls'] } },
];

const NEW = [
  { id: 'rauchquarz', name: 'Rauchquarz', tier: 'normal', colors: ['#e8ddd2', '#9a8270', '#4a3a2e'], text: 'Rauchig braun, als hätte jemand ein Lagerfeuer darin eingefangen.', look: { cut: 'baguette', mat: 'klar', fx: ['verlauf'] } },
  { id: 'citrin', name: 'Citrin', tier: 'normal', colors: ['#fff6c8', '#f2c84a', '#a8761a'], text: 'Sonnengelb und fröhlich. Im Quarzfeld blitzt er zwischen den grauen Steinen.', look: { cut: 'kissen', mat: 'klar' } },
  { id: 'karneol', name: 'Karneol', tier: 'selten', colors: ['#ffd2a8', '#e8642a', '#8a2a10'], text: 'Orange wie Glut. Fühlt sich in der Hand immer ein bisschen warm an.', look: { cut: 'tropfencabochon', mat: 'milchig', fx: ['glut'] } },
  { id: 'malachit', name: 'Malachit', tier: 'selten', colors: ['#b8f0cc', '#1a9a5a', '#0a4a2a'], text: 'Grün mit dunklen Wellen, wie ein Wald von oben gesehen.', look: { cut: 'kugel', mat: 'opak', tex: 'wellen' } },
  { id: 'granat', name: 'Granat', tier: 'sehr-selten', colors: ['#ffb8c0', '#a8182e', '#4a0a14'], text: 'Dunkelrot wie Kirschsaft. Wächst im Fels als Kugel mit zwölf Flächen.', look: { cut: 'dodekaeder', mat: 'klar' } },
  { id: 'lapislazuli', name: 'Lapislazuli', tier: 'sehr-selten', colors: ['#c8d4ff', '#1e3aa8', '#0a1450'], text: 'Nachtblau mit goldenen Pünktchen, wie ein Himmel voller Sterne.', look: { cut: 'tafel', mat: 'opak', tex: 'goldsprenkel' } },
  { id: 'turmalin', name: 'Turmalin', tier: 'episch', colors: ['#ffd0e4', '#e84a8a', '#2a9a5a'], text: 'Oben pink, unten grün. Sieht aus wie eine Stange Wassermelone.', look: { cut: 'stab', mat: 'klar', fx: ['zweifarbig'] } },
  { id: 'morganit', name: 'Morganit', tier: 'episch', colors: ['#fff0ea', '#f4b0a0', '#b86a6a'], text: 'Pfirsichrosa und sanft. Leuchtet am schönsten im Abendlicht.', look: { cut: 'rose', mat: 'klar' } },
  { id: 'tansanit', name: 'Tansanit', tier: 'legendaer', colors: ['#e0d8ff', '#5a3ae8', '#22106a'], text: 'Blau oder violett, je nachdem, von welcher Seite man schaut.', look: { cut: 'trillion', mat: 'klar', fx: ['blickwechsel'] } },
  { id: 'kaiserjade', name: 'Kaiserjade', tier: 'legendaer', colors: ['#d8ffe0', '#2ab85a', '#0a5a2a'], text: 'Satt grün und glatt wie Seide. Stammt aus dem Jadetempel.', look: { cut: 'bi', mat: 'jade', tex: 'wolken' } },
  { id: 'labradorit', name: 'Labradorit', tier: 'mystisch', colors: ['#d8f0ff', '#4a6a8a', '#1a2a3a'], text: 'Grau, bis man ihn dreht. Dann blitzt plötzlich Blau und Gold auf.', look: { cut: 'handschmeichler', mat: 'opak', tex: 'streifen', fx: ['labradoreszenz'] } },
  { id: 'sonnenstein', name: 'Sonnenstein', tier: 'mystisch', colors: ['#fff0c8', '#ff9a3a', '#a8401a'], text: 'Voller winziger Glitzerplättchen, die wie Sonnenfunken tanzen.', look: { cut: 'hexagon', mat: 'milchig', fx: ['glitzer'] } },
  { id: 'paraiba', name: 'Paraiba-Turmalin', tier: 'engelsgleich', colors: ['#d8fff8', '#1ae8d8', '#0a7a8a'], text: 'Leuchtet türkis wie eine Neonlampe, sogar ohne Licht.', look: { cut: 'prinzess', mat: 'klar', fx: ['neon'] } },
  { id: 'himmelstraene', name: 'Himmelsträne', tier: 'engelsgleich', colors: ['#ffffff', '#bfe4ff', '#e8c86a'], text: 'Eine Träne aus Wolkenlicht, gefasst in Gold.', look: { cut: 'briolette', mat: 'klar', fx: ['goldfassung', 'schiller'] } },
  { id: 'painit', name: 'Painit', tier: 'goettlich', colors: ['#ffd8c0', '#c8501a', '#5a1a0a'], text: 'Einer der seltensten Steine überhaupt. Braunrot und an beiden Enden spitz.', look: { cut: 'doppelspitze', mat: 'klar' } },
  { id: 'sonnendiamant', name: 'Sonnendiamant', tier: 'goettlich', colors: ['#ffffff', '#ffd84a', '#ff8a1a'], text: 'Trinkt so viel Licht, dass er selbst zu strahlen beginnt.', look: { cut: 'sonne', mat: 'diamant', fx: ['strahlen', 'glut'] } },
  { id: 'kometenkristall', name: 'Kometenkristall', tier: 'galaktisch', colors: ['#e8fbff', '#5ac8ff', '#1a3a8a'], text: 'Fiel mit einem Kometen herab. Hinter ihm glitzert noch der Schweif.', look: { cut: 'komet', mat: 'klar', fx: ['schweif'] } },
  { id: 'polarlicht-opal', name: 'Polarlicht-Opal', tier: 'galaktisch', colors: ['#e0fff0', '#3ae8a0', '#8a3ae8'], text: 'Grüne und violette Lichtbänder wandern langsam durch ihn hindurch.', look: { cut: 'prisma', mat: 'milchig', tex: 'polarlicht', fx: ['polarlicht'] } },
  { id: 'ereignishorizont', name: 'Ereignishorizont', tier: 'unerreichbar', colors: ['#d8b8ff', '#140a24', '#8a3ae8'], text: 'Schwarz wie ein Schwarzes Loch. Um ihn kreist eine glühende Scheibe.', look: { cut: 'singularitaet', mat: 'schwarz', fx: ['akkretion'] } },
  { id: 'urknall-juwel', name: 'Urknall-Juwel', tier: 'unerreichbar', colors: ['#ffffff', '#ffb8f0', '#ffd23f'], text: 'So alt wie das Universum. Darin explodiert immer wieder ein kleiner Urknall.', look: { cut: 'urknall', mat: 'diamant', fx: ['urknall'] } },
  { id: 'prismaherz', name: 'Prismaherz', tier: 'premium', colors: ['#ffffff', '#ff9ae0', '#7af0ff'], text: 'Ein Herz aus reinem Licht. Es zeigt alle Farben zugleich und verändert langsam seine Form.', look: { cut: 'prismaherz', mat: 'diamant', fx: ['prismalicht'] } },
  { id: 'mondtraenen-perle', name: 'Mondtränen-Perle', tier: 'premium', colors: ['#d8ccdc', '#7a6080', '#4a3a58'], text: 'Eine Perle in Tränenform, geweint vom Mond. Sie liegt in einer Perlmuttmuschel, und immer wieder fällt eine leuchtende Mondträne hinein.', look: { cut: 'perle', mat: 'opak', fx: ['muschel', 'perlglanz', 'mondtraenen'] } },
  { id: MYSTERY, name: '???', tier: 'unbekannt', colors: ['#e8d8ff', '#6a3ab0', '#0c0c10'], text: 'Auf den Inseln liegen nur ?-Steine. Wer einen einsammelt, muss ihn zerbrechen und polieren. Erst dann zeigt sich, welcher der 42 Kristalle darin steckt und wie schwer er ist.', look: { cut: 'fragezeichen', mat: 'klar', fx: ['mysterium'] } },
].map((g) => ({ ...g, isNew: true }));

const GEMS = [...OLD, ...NEW];
GEMS.forEach((g) => { g.cut = g.look.cut; g.look.fx ||= []; g.look.tex ||= ''; });
// Eigene Chance jedes Kristalls im ?-Stein (Summe 100 %) und sein Gewichtsbereich in Gramm [leichtester, schwerster]
const CHANCE = {
  quarz: 12, rosenquarz: 10, rauchquarz: 9, citrin: 7,
  achat: 8, jaspis: 7, karneol: 6, malachit: 4,
  amethyst: 5, topas: 4, granat: 3.5, lapislazuli: 2.5,
  aquamarin: 3, peridot: 2.5, turmalin: 2, morganit: 1.5,
  smaragd: 1.6, saphir: 1.4, tansanit: 1.1, kaiserjade: 0.9,
  rubin: 1, mondstein: 0.8, labradorit: 0.7, sonnenstein: 0.5,
  opal: 0.5, alexandrit: 0.4, paraiba: 0.35, himmelstraene: 0.25,
  diamant: 0.3, feueropal: 0.25, painit: 0.2, sonnendiamant: 0.15,
  sternsaphir: 0.16, nebelkristall: 0.14, kometenkristall: 0.11, 'polarlicht-opal': 0.09,
  'supernova-diamant': 0.035, 'herz-der-galaxie': 0.03, ereignishorizont: 0.02, 'urknall-juwel': 0.015,
  prismaherz: 1.2, 'mondtraenen-perle': 0.8,
};
const GRAMS = {
  quarz: [1, 800], rosenquarz: [1, 600], rauchquarz: [1, 500], citrin: [0.5, 300],
  achat: [2, 900], jaspis: [2, 1000], karneol: [1, 400], malachit: [3, 1200],
  amethyst: [2, 1500], topas: [0.5, 250], granat: [0.3, 150], lapislazuli: [2, 700],
  aquamarin: [0.5, 300], peridot: [0.3, 120], turmalin: [0.5, 250], morganit: [0.4, 180],
  smaragd: [0.2, 100], saphir: [0.2, 90], tansanit: [0.2, 80], kaiserjade: [2, 600],
  rubin: [0.2, 70], mondstein: [0.5, 200], labradorit: [3, 900], sonnenstein: [0.5, 200],
  opal: [0.3, 120], alexandrit: [0.1, 40], paraiba: [0.1, 30], himmelstraene: [0.1, 25],
  diamant: [0.1, 20], feueropal: [0.2, 60], painit: [0.1, 15], sonnendiamant: [0.1, 18],
  sternsaphir: [0.3, 60], nebelkristall: [0.5, 90], kometenkristall: [1, 200], 'polarlicht-opal': [0.5, 80],
  'supernova-diamant': [0.1, 10], 'herz-der-galaxie': [0.1, 8], ereignishorizont: [0.5, 50], 'urknall-juwel': [0.05, 5],
  prismaherz: [0.5, 60], 'mondtraenen-perle': [1, 150],
};
GEMS.forEach((g) => { g.chance = CHANCE[g.id] ?? 0; g.grams = GRAMS[g.id] ?? [1, 10]; });
const gemById = Object.fromEntries(GEMS.map((g) => [g.id, g]));

const nf = new Intl.NumberFormat('de-DE');
const fmtValue = (g) => { const v = tierById[g.tier].value * GEM_FACTOR; if (!v) return '?'; return v >= 1e6 ? `${nf.format(v / 1e6)} Mio.` : nf.format(v); };
const fmtPct = (v) => `${v.toLocaleString('de-DE', { maximumFractionDigits: 3 })} %`;
const fmtChance = (g) => g.id === MYSTERY ? 'liegt überall' : fmtPct(g.chance);
// Gewicht eines Fundes: erst die Gewichtsklasse nach Chance, dann ein Wert im Bereich dieses Kristalls.
// Die Klassen teilen den Gewichtsbereich jedes Kristalls logarithmisch auf (f = Anteil am Bereich).
const WEIGHTS = [
  { id: 'splitter', name: 'Splitter', f: [0, 0.3], chance: 50, mult: 1, color: '#a39cad' },
  { id: 'klein', name: 'Klein', f: [0.3, 0.5], chance: 28, mult: 2, color: '#c9d1d9' },
  { id: 'mittel', name: 'Mittel', f: [0.5, 0.65], chance: 13, mult: 4, color: '#3ee08a' },
  { id: 'gross', name: 'Groß', f: [0.65, 0.8], chance: 6, mult: 8, color: '#5ad8ff' },
  { id: 'riesig', name: 'Riesig', f: [0.8, 0.92], chance: 2.5, mult: 20, color: '#ff8a3d' },
  { id: 'gigantisch', name: 'Gigantisch', f: [0.92, 1], chance: 0.5, mult: 100, color: '#ff5fd2' },
];
const roundG = (x) => (x < 1 ? Math.round(x * 100) / 100 : x < 10 ? Math.round(x * 10) / 10 : Math.round(x));
const classRange = (gem, w) => { const [a, b] = gem.grams; return w.f.map((f) => roundG(a * Math.pow(b / a, f))); };
function rollWeight(gem) {
  let roll = Math.random() * WEIGHTS.reduce((sum, w) => sum + w.chance, 0);
  let index = WEIGHTS.findIndex((w) => (roll -= w.chance) <= 0); if (index < 0) index = 0;
  const w = WEIGHTS[index], [lo, hi] = classRange(gem, w);
  const grams = roundG(lo * Math.pow(hi / lo, Math.pow(Math.random(), 1.6)));
  return { grams: Math.max(lo, grams), cls: w, index };
}
const fmtGrams = (g) => { const d = g < 1 ? 2 : g < 10 ? 1 : 0; return `${g.toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d })} g`; };
// Edelstein-Mutationen. Beim Öffnen wird viermal verdeckt gewürfelt (chance × MUT_ROLL pro Wurf), höchstens zwei
// Mutationen pro Kristall. Sichtbar werden sie erst, wenn der Kristall fertig poliert ist.
const MUT_ROLL = 0.55, MUT_ROLLS = 4, MUT_MAX = 2;
// Polieren dauert bei jedem Stein ungefähr gleich lang (verrät weder Seltenheit noch Mutationen).
// Bis REVEAL_AT reibt man an einem Rohklumpen, erst dann zeigt sich der Kristall.
const POLISH_PX = 5600, REVEAL_AT = 0.85;
const POLISH_MUTATIONS = [
  { id: 'rissig', name: 'Rissig', mult: 1.2, color: '#f2e6d0', chance: 3, desc: 'Der Kristall ist in Scherben zersprungen. Ein rissiger Lichtkern hält sie zusammen, alle paar Sekunden sprengt er sie kurz auseinander.' },
  { id: 'glaenzend', name: 'Glänzend', mult: 1.5, color: '#ffffff', chance: 2.5, desc: 'Spiegelglatt poliert: Lichtstreifen, Linsenreflex, ein Lichtpunkt rast um ihn herum, Glanzexplosionen und ein Spiegelbild.' },
  { id: 'einschluss', name: 'Einschluss', mult: 2, multText: '×1 bis ×20', color: '#d8a24a', chance: 2, desc: 'Im Inneren leuchtet ein Bernstein. Was darin steckt, wird extra gewürfelt: meist Müll, manchmal ein Insekt, ganz selten ein Fossil. Je seltener, desto wertvoller.' },
  { id: 'magmakern', name: 'Magmakern', mult: 2, color: '#ff5a1a', chance: 1.5, desc: 'Dunkles Basalt mit pulsierenden Lavaadern. Lava tropft in eine glühende Pfütze, Rauch und Glut steigen auf.' },
  { id: 'giftkristall', name: 'Giftkristall', mult: 2.2, color: '#7aff3a', chance: 1.2, desc: 'Giftgrünes Leuchten, Blasen wachsen und platzen, Säure tropft in eine zischende Pfütze, giftige Schwaden ziehen.' },
  { id: 'eisherz', name: 'Eisherz', mult: 2.5, color: '#9fe8ff', chance: 1.2, desc: 'Eine Frostschale umhüllt ihn, darin pocht ein blaues Herz. Eiszapfen wachsen und tropfen, Schnee fällt.' },
  { id: 'blitzkristall', name: 'Blitzkristall', mult: 3, color: '#ffe94a', chance: 1, desc: 'Lädt sich alle drei Sekunden auf und entlädt sich in zuckenden Blitzen. Ein Plasmaring kreist, Funken springen.' },
  { id: 'bluetenkristall', name: 'Blütenkristall', mult: 3.5, color: '#ff8ad8', chance: 0.8, desc: 'Kristallblumen öffnen und schließen sich auf ihm, Blütenblätter wehen davon, Pollen funkeln.' },
  { id: 'regenbogen', name: 'Regenbogen', mult: 4, color: '#ff7ad9', chance: 0.6, desc: 'Ein Doppelregenbogen mit fließenden Farben im feinen Regen, kreisende Glasprismen, Farbstrahlen und ein Regenbogenboden.' },
  { id: 'gigant', name: 'Riesenkristall', mult: 10, color: '#ff9a3c', chance: 0.3, desc: 'Viel größer als normal. Felsspitzen brechen aus dem glühenden Boden, Brocken kreisen, Schockwellen rollen.' },
  { id: 'phoenix', name: 'Phoenix', mult: 15, color: '#ff7a1a', chance: 0.12, premium: true, desc: 'Premium: Feuerflügel schlagen hinter ihm, ein Flammenkranz brennt. Alle acht Sekunden zerfällt er zu Asche und ersteht in einer Feuerexplosion neu.' },
  { id: 'dimensionsriss', name: 'Dimensionsriss', mult: 25, color: '#b450ff', chance: 0.08, premium: true, desc: 'Premium: Hinter ihm reißt der Raum auf und zeigt eine fremde Welt. Realitätssplitter schweben, Teilchen werden eingesogen, er flackert zwischen den Welten.' },
];
const mutById = Object.fromEntries(POLISH_MUTATIONS.map((m) => [m.id, m]));
// Beispielkristall für das Vorschaubild jeder Mutation
const MUT_PREVIEW = { rissig: 'topas', glaenzend: 'saphir', einschluss: 'citrin', magmakern: 'rubin', giftkristall: 'peridot', eisherz: 'aquamarin', blitzkristall: 'topas', bluetenkristall: 'morganit', regenbogen: 'quarz', gigant: 'amethyst', phoenix: 'feueropal', dimensionsriss: 'diamant' };
const mutMult = (muts = []) => muts.reduce((a, m) => a * (typeof m === 'string' ? (mutById[m]?.mult ?? 1) : m.mult), 1);
// Was im Bernstein steckt (eigener Wurf, Summe 100 %). Der Multiplikator ersetzt den der Mutation.
const INCLUSIONS = [
  { id: 'dreck', name: 'Erdklumpen', kind: 'Müll', chance: 30, mult: 1, color: '#8a7a66', text: 'Nur ein Klumpen Erde mit ein paar Halmen.' },
  { id: 'kronkorken', name: 'Kronkorken', kind: 'Müll', chance: 18, mult: 1.1, color: '#c9d1d9', text: 'Wie kommt der denn da rein?' },
  { id: 'schraube', name: 'Rostige Schraube', kind: 'Müll', chance: 14, mult: 1.2, color: '#b86a3a', text: 'Verrostet und krumm.' },
  { id: 'blatt', name: 'Urzeit-Blatt', kind: 'Gewöhnlich', chance: 14, mult: 1.6, color: '#7ac04a', text: 'Ein Blatt mit allen Adern, Millionen Jahre alt.' },
  { id: 'fliege', name: 'Urzeit-Fliege', kind: 'Selten', chance: 11, mult: 2, color: '#d8a24a', text: 'Eine Fliege mit roten Facettenaugen und zuckenden Flügeln.' },
  { id: 'spinne', name: 'Bernstein-Spinne', kind: 'Selten', chance: 7, mult: 3, color: '#c84a2a', text: 'Acht Beine, leuchtende Augen. Sie zuckt manchmal.' },
  { id: 'ammonit', name: 'Ammonit', kind: 'Episch', chance: 4, mult: 5, color: '#e8c88a', text: 'Eine perlmuttschimmernde Spiralschnecke aus der Urzeit.' },
  { id: 'trilobit', name: 'Trilobit', kind: 'Legendär', chance: 1.5, mult: 8, color: '#9aa0b4', text: 'Ein Urkrebs mit Panzersegmenten, die sich noch bewegen.' },
  { id: 'dinoei', name: 'Versteinertes Dino-Ei', kind: 'Mythisch', chance: 0.5, mult: 20, color: '#ff8a3d', text: 'Darin schlägt noch ein Herz. Es glüht bei jedem Schlag.' },
];
const INC_BY_ID = Object.fromEntries(INCLUSIONS.map((i) => [i.id, i]));
function rollInclusion() { let r = Math.random() * 100; return INCLUSIONS.find((i) => (r -= i.chance) <= 0) || INCLUSIONS[0]; }
// eine konkrete Mutation (bei Einschluss mit gewürfeltem Inhalt)
function makeMut(id, incId = null) {
  const base = mutById[id]; if (!base || id !== 'einschluss') return base;
  const inc = (incId && INC_BY_ID[incId]) || rollInclusion();
  return { ...base, name: `Einschluss · ${inc.name}`, mult: inc.mult, inc, desc: `${inc.kind}: ${inc.name}. ${inc.text}` };
}
const mutLabel = (m) => m.multText || `×${m.mult.toLocaleString('de-DE')}`;
const foundValue = (gem, wt, muts = []) => Math.round(tierById[gem.tier].value * GEM_FACTOR * wt.cls.mult * mutMult(muts));
const lookText = (g) => [g.look.tex ? TEXS[g.look.tex] : '', ...g.look.fx.map((f) => FXS[f])].filter(Boolean).join(' · ') || 'Reiner Schliff, ohne Effekt';

// ── Geometrie-Werkzeuge ────────────────────────────────────────────────────
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const V2 = (x, y) => new THREE.Vector2(x, y);
const TAU = Math.PI * 2;

function normalize2(pts) {
  const box = new THREE.Box2().setFromPoints(pts);
  const c = box.getCenter(V2()), s = box.getSize(V2());
  const k = 2 / Math.max(s.x, s.y);
  return pts.map((p) => p.clone().sub(c).multiplyScalar(k));
}
const sample = (fn, M) => normalize2(Array.from({ length: M }, (_, i) => V2(...fn((i / M) * TAU))));
function starOutline(k, inner) {
  const pts = [];
  for (let i = 0; i < 2 * k; i++) { const a = (i / (2 * k)) * TAU, r = i % 2 ? inner : 1; pts.push(V2(Math.cos(a) * r, Math.sin(a) * r)); }
  return normalize2(pts);
}
function polyOutline(corners, per) {
  const pts = [];
  for (let i = 0; i < corners.length; i++) {
    const a = corners[i], b = corners[(i + 1) % corners.length];
    for (let k = 0; k < per; k++) { const t = k / per; pts.push(V2(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)); }
  }
  return normalize2(pts);
}
const SHAPE = {
  circle: (t) => [Math.cos(t), Math.sin(t)],
  oval: (t) => [Math.cos(t), 0.7 * Math.sin(t)],
  pear: (t) => { const x = Math.cos(t); return [x, Math.sin(t) * Math.pow((1 - x) / 2, 0.55)]; },
  heart: (t) => {
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    return [y / 17, x / 17];
  },
  cushion: (t) => { const c = Math.cos(t), s = Math.sin(t), p = 0.6; return [Math.sign(c) * Math.pow(Math.abs(c), p), 0.88 * Math.sign(s) * Math.pow(Math.abs(s), p)]; },
  marquise: (t) => [Math.cos(t), 0.5 * Math.sin(t) * Math.abs(Math.sin(t))],
  flame: (t) => {
    const x = Math.cos(t); let z = 0.95 * Math.sin(t) * Math.pow((1 - x) / 2, 0.5);
    z += 0.28 * Math.sin((x + 1) * 2.4) * Math.pow((x + 1) / 2, 1.6);
    return [x, z];
  },
  trillion: (t) => {
    const k = 3, seg = TAU / k, a0 = Math.floor(t / seg) * seg, f = (t - a0) / seg;
    const A = [Math.cos(a0), Math.sin(a0)], B = [Math.cos(a0 + seg), Math.sin(a0 + seg)];
    const mx = A[0] + (B[0] - A[0]) * f, mz = A[1] + (B[1] - A[1]) * f;
    const bulge = 1 + 0.32 * Math.sin(Math.PI * f);
    return [mx * bulge, mz * bulge];
  },
  blob: (t) => { const r = 1 + 0.09 * Math.sin(3 * t + 0.6) + 0.05 * Math.sin(5 * t + 2); return [Math.cos(t) * r * 1.15, Math.sin(t) * r * 0.82]; },
  agate: (t) => { const r = 1 + 0.08 * Math.sin(4 * t + 1) + 0.06 * Math.sin(7 * t) + 0.04 * Math.sin(11 * t + 2); return [Math.cos(t) * r, Math.sin(t) * r * 0.86]; },
};

// Dreiecke sammeln und nach außen ausrichten (Bezugspunkt auf der Mittelachse)
function triGeo(tris, ref) {
  let minY = Infinity, maxY = -Infinity;
  for (const t of tris) for (const p of t) { minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); }
  const r = ref || v3(0, (minY + maxY) / 2, 0);
  const pos = [];
  const e1 = v3(), e2 = v3(), n = v3(), cen = v3();
  for (const [a, b, c] of tris) {
    e1.subVectors(b, a); e2.subVectors(c, a); n.crossVectors(e1, e2);
    cen.copy(a).add(b).add(c).divideScalar(3).sub(r);
    const list = n.dot(cen) < 0 ? [a, c, b] : [a, b, c];
    for (const p of list) pos.push(p.x, p.y, p.z);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  return geo;
}
function planarUV(geo, axes = 'xz') {
  const p = geo.attributes.position; geo.computeBoundingBox();
  const b = geo.boundingBox, [A, B] = axes.split('');
  const minA = b.min[A], minB = b.min[B], span = Math.max(b.max[A] - minA, b.max[B] - minB) || 1;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const v = v3(p.getX(i), p.getY(i), p.getZ(i));
    uv[i * 2] = (v[A] - minA) / span; uv[i * 2 + 1] = (v[B] - minB) / span;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}
function finish(geo, size = 2.2, uv = 'xz') {
  geo.computeBoundingBox();
  const b = geo.boundingBox, c = b.getCenter(v3()), s = b.getSize(v3());
  geo.translate(-c.x, -c.y, -c.z);
  const k = size / Math.max(s.x, s.y, s.z); geo.scale(k, k, k);
  planarUV(geo, uv); geo.computeBoundingBox();
  return geo;
}
function smoothen(geo) {
  geo.deleteAttribute('normal'); if (geo.attributes.uv) geo.deleteAttribute('uv');
  const g = BGU.mergeVertices(geo, 1e-4); g.computeVertexNormals(); return g;
}
const wrap = (arr, k) => arr[((k % arr.length) + arr.length) % arr.length];

// Brillant-Familie: Tafel, Krone mit Stern- und Hauptfacetten, Rundiste, Pavillon
function brilliant(g, P) {
  const N = g.length / 2, at = (p, y, s = 1) => v3(p.x * s, y, p.y * s);
  const yT = P.crown, yGt = 0.025, yGb = -0.025;
  const T = [], Gt = [], Gb = [], M = [], tris = [];
  for (let i = 0; i < N; i++) T.push(at(g[2 * i], yT, P.table));
  for (let j = 0; j < 2 * N; j++) { Gt.push(at(g[j], yGt)); Gb.push(at(g[j], yGb)); }
  for (let i = 0; i < N; i++) M.push(at(g[2 * i + 1], -P.pav * 0.5, 0.5));
  const culet = v3(0, -P.pav, 0), center = v3(0, yT, 0);
  for (let i = 0; i < N; i++) {
    tris.push([center, T[i], wrap(T, i + 1)]);
    tris.push([T[i], Gt[2 * i], Gt[2 * i + 1]], [T[i], Gt[2 * i + 1], wrap(T, i + 1)], [wrap(T, i + 1), Gt[2 * i + 1], wrap(Gt, 2 * i + 2)]);
    for (const j of [2 * i, 2 * i + 1]) tris.push([Gt[j], Gb[j], wrap(Gb, j + 1)], [Gt[j], wrap(Gb, j + 1), wrap(Gt, j + 1)]);
    tris.push([Gb[2 * i], Gb[2 * i + 1], M[i]], [Gb[2 * i + 1], wrap(Gb, 2 * i + 2), M[i]], [M[i], wrap(Gb, 2 * i + 2), wrap(M, i + 1)], [M[i], wrap(M, i + 1), culet]);
  }
  return finish(triGeo(tris));
}
// Treppenschliff: konzentrische Stufen oben und unten
function stepCut(corners, rings) {
  const R = ([s, y]) => corners.map((c) => v3(c.x * s, y, c.y * s));
  const L = rings.map(R), tris = [];
  const top = v3(0, rings[0][1], 0), bot = v3(0, rings[rings.length - 1][1] - 0.06, 0);
  const n = corners.length;
  for (let i = 0; i < n; i++) tris.push([top, L[0][i], wrap(L[0], i + 1)]);
  for (let r = 0; r < L.length - 1; r++) for (let i = 0; i < n; i++) {
    const a = L[r][i], b = wrap(L[r], i + 1), c = wrap(L[r + 1], i + 1), d = L[r + 1][i];
    tris.push([a, d, c], [a, c, b]);
  }
  const last = L[L.length - 1];
  for (let i = 0; i < n; i++) tris.push([bot, wrap(last, i + 1), last[i]]);
  return finish(triGeo(tris));
}
// Ringe mit versetzten Facetten (Rose, Briolette, Herzjuwel)
function polarFn(pts) {
  const B = 720, R = new Float32Array(B);
  const cr = (a, b) => a.x * b.y - a.y * b.x;
  for (let b = 0; b < B; b++) {
    const a = (b / B) * TAU, d = V2(Math.cos(a), Math.sin(a)); let best = 0;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], e = pts[(i + 1) % pts.length].clone().sub(p), den = cr(d, e);
      if (Math.abs(den) < 1e-9) continue;
      const t = cr(p, e) / den, u = cr(p, d) / den;
      if (u >= -1e-6 && u <= 1 + 1e-6 && t > 0) best = Math.max(best, t);
    }
    R[b] = best || 1;
  }
  return (a) => R[((Math.round((a / TAU) * B) % B) + B) % B];
}
function ringCut(N, rings, { top, bottom, polar } = {}) {
  const L = rings.map(({ s, y, o }) => Array.from({ length: N }, (_, i) => {
    const a = ((i + o) / N) * TAU, r = s * (polar ? polar(a) : 1);
    return v3(Math.cos(a) * r, y, Math.sin(a) * r);
  }));
  const tris = [];
  const zip = (A, B, oa, ob) => {
    for (let i = 0; i < N; i++) {
      if (oa === ob) { tris.push([A[i], B[i], wrap(B, i + 1)], [A[i], wrap(B, i + 1), wrap(A, i + 1)]); }
      else if (oa < ob) { tris.push([A[i], wrap(A, i + 1), B[i]], [B[i], wrap(B, i + 1), wrap(A, i + 1)]); }
      else { tris.push([B[i], wrap(B, i + 1), A[i]], [A[i], wrap(A, i + 1), wrap(B, i + 1)]); }
    }
  };
  for (let r = 0; r < L.length - 1; r++) zip(L[r], L[r + 1], rings[r].o, rings[r + 1].o);
  const capT = v3(0, top ?? rings[0].y, 0), capB = v3(0, bottom ?? rings[rings.length - 1].y, 0);
  for (let i = 0; i < N; i++) { tris.push([capT, L[0][i], wrap(L[0], i + 1)]); tris.push([capB, wrap(L[L.length - 1], i + 1), L[L.length - 1][i]]); }
  return finish(triGeo(tris));
}
// Glatter Cabochon: Drehkörper, dann auf den Umriss verformt
function cabochon(pts, { dome = 0.5, under = 0.1, double = false } = {}) {
  const prof = [], K = 28;
  if (double) {
    for (let k = 0; k <= K * 2; k++) { const a = -Math.PI / 2 + (Math.PI * k) / (K * 2); prof.push(V2(Math.max(Math.cos(a), 0.0005), Math.sin(a) * (a > 0 ? dome : under))); }
  } else {
    prof.push(V2(0.0005, -under), V2(0.96, -under), V2(1, -under * 0.4));
    for (let k = 0; k <= K; k++) { const a = (k / K) * (Math.PI / 2); prof.push(V2(Math.max(Math.cos(a), 0.0005), Math.sin(a) * dome)); }
  }
  const geo = new THREE.LatheGeometry(prof, 96), R = polarFn(pts), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), r = R(Math.atan2(z, x));
    p.setX(i, x * r); p.setZ(i, z * r);
  }
  geo.computeVertexNormals();
  return finish(geo);
}
function extruded(shape, depth, bevel, size = 2.2) {
  let geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 8, curveSegments: 64 });
  geo.rotateX(-Math.PI / 2);
  return finish(smoothen(geo), size);
}
function hexCrystal(r, h, apex, { bottomApex = 0, chamfer = 0, sides = 6, rFn } = {}) {
  const pts = [];
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * TAU, rr = r * (rFn ? rFn(a) : 1);
    pts.push(v3(Math.cos(a) * rr, 0, Math.sin(a) * rr), v3(Math.cos(a) * rr, h, Math.sin(a) * rr));
    if (chamfer) pts.push(v3(Math.cos(a) * rr * 0.8, h + chamfer, Math.sin(a) * rr * 0.8), v3(Math.cos(a) * rr * 0.8, -chamfer, Math.sin(a) * rr * 0.8));
  }
  if (apex) pts.push(v3(0, h + apex, 0));
  if (bottomApex) pts.push(v3(0, -bottomApex, 0));
  return new ConvexGeometry(pts);
}
function placed(geo, { pos = [0, 0, 0], rot = [0, 0, 0], s = 1 }) {
  const m = new THREE.Matrix4().compose(v3(...pos), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)), v3(s, s, s));
  return geo.applyMatrix4(m);
}

const BUILD = {
  rund: () => brilliant(sample(SHAPE.circle, 32), { table: 0.56, crown: 0.34, pav: 0.95 }),
  oval: () => brilliant(sample(SHAPE.oval, 32), { table: 0.56, crown: 0.32, pav: 0.85 }),
  tropfen: () => brilliant(sample(SHAPE.pear, 32), { table: 0.52, crown: 0.32, pav: 0.85 }),
  herz: () => brilliant(sample(SHAPE.heart, 32), { table: 0.5, crown: 0.3, pav: 0.8 }),
  kissen: () => brilliant(sample(SHAPE.cushion, 32), { table: 0.6, crown: 0.36, pav: 0.9 }),
  marquise: () => brilliant(sample(SHAPE.marquise, 28), { table: 0.5, crown: 0.26, pav: 0.6 }),
  trillion: () => brilliant(sample(SHAPE.trillion, 24), { table: 0.55, crown: 0.28, pav: 0.75 }),
  flamme: () => brilliant(sample(SHAPE.flame, 32), { table: 0.48, crown: 0.34, pav: 0.8 }),
  stern: () => { const s = starOutline(6, 0.55), g = []; s.forEach((p, i) => g.push(p, p.clone().lerp(s[(i + 1) % s.length], 0.5))); return brilliant(g, { table: 0.45, crown: 0.34, pav: 0.75 }); },
  sonne: () => brilliant(starOutline(12, 0.74), { table: 0.5, crown: 0.3, pav: 0.7 }),
  prinzess: () => brilliant(polyOutline([[1, -1], [1, 1], [-1, 1], [-1, -1]], 4), { table: 0.62, crown: 0.26, pav: 0.9 }),
  smaragd: () => stepCut(polyOutline([[1, -0.48], [1, 0.48], [0.76, 0.72], [-0.76, 0.72], [-1, 0.48], [-1, -0.48], [-0.76, -0.72], [0.76, -0.72]], 1),
    [[0.7, 0.3], [0.8, 0.24], [0.9, 0.15], [1, 0.03], [1, -0.03], [0.82, -0.25], [0.6, -0.45], [0.36, -0.62], [0.14, -0.74]]),
  asscher: () => stepCut(polyOutline([[1, -0.62], [1, 0.62], [0.62, 1], [-0.62, 1], [-1, 0.62], [-1, -0.62], [-0.62, -1], [0.62, -1]], 1),
    [[0.6, 0.36], [0.72, 0.3], [0.86, 0.18], [1, 0.03], [1, -0.03], [0.78, -0.3], [0.56, -0.55], [0.32, -0.75], [0.1, -0.88]]),
  baguette: () => stepCut(polyOutline([[1, -0.34], [1, 0.34], [-1, 0.34], [-1, -0.34]], 1),
    [[0.84, 0.2], [0.92, 0.12], [1, 0.03], [1, -0.03], [0.9, -0.16], [0.8, -0.3], [0.7, -0.42]]),
  hexagon: () => stepCut(sample((t) => [Math.cos(t), Math.sin(t)], 6),
    [[0.62, 0.3], [0.78, 0.22], [0.9, 0.12], [1, 0.03], [1, -0.03], [0.74, -0.3], [0.48, -0.52], [0.22, -0.7]]),
  rose: () => ringCut(12, [{ s: 0.34, y: 0.56, o: 0.5 }, { s: 0.7, y: 0.36, o: 0 }, { s: 1, y: 0.02, o: 0.5 }, { s: 1, y: -0.06, o: 0.5 }], { top: 0.68, bottom: -0.06 }),
  briolette: () => ringCut(10, [0.22, 0.42, 0.6, 0.76, 0.88, 0.95, 0.9, 0.7, 0.4].map((s, i) => ({ s, y: 1.25 - i * 0.29, o: i % 2 ? 0.5 : 0 })), { top: 1.6, bottom: -1.32 }),
  prismaherz: () => ringCut(24, [{ s: 0.35, y: 0.5, o: 0 }, { s: 0.62, y: 0.42, o: 0.5 }, { s: 0.85, y: 0.26, o: 0 }, { s: 1, y: 0.04, o: 0.5 }, { s: 0.92, y: -0.18, o: 0 }, { s: 0.68, y: -0.36, o: 0.5 }, { s: 0.36, y: -0.48, o: 0 }],
    { top: 0.56, bottom: -0.54, polar: polarFn(sample(SHAPE.heart, 96)) }).rotateX(Math.PI / 2).rotateZ(Math.PI / 2),
  perle: () => {
    const prof = [];
    for (let i = 0; i <= 48; i++) {
      const y = -1 + (i / 48) * 2.18;
      const r = i === 0 || i === 48 ? 0.0005 : y <= 0 ? Math.sqrt(Math.max(0, 1 - y * y)) : Math.sqrt(Math.max(0, 1 - (y / 1.18) ** 2)) * (1 - 0.12 * (y / 1.18));
      prof.push(V2(Math.max(r, 0.0005), y));
    }
    const geo = new THREE.LatheGeometry(prof, 96), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 + 0.015 * Math.sin(x * 7 + y * 5) * Math.cos(z * 6); p.setXYZ(i, x * k, y, z * k); }
    geo.computeVertexNormals();
    const out = finish(geo, 0.84); out.translate(0, -1.07 - out.boundingBox.min.y, 0); out.computeBoundingBox(); return out;
  },
  herzjuwel: () => ringCut(16, [{ s: 0.5, y: 0.42, o: 0 }, { s: 0.82, y: 0.26, o: 0.5 }, { s: 1, y: 0.02, o: 0 }, { s: 0.8, y: -0.24, o: 0.5 }, { s: 0.48, y: -0.4, o: 0 }],
    { top: 0.5, bottom: -0.48, polar: polarFn(sample(SHAPE.heart, 96)) }).rotateX(Math.PI / 2).rotateZ(Math.PI / 2),
  herzkissen: () => cabochon(sample(SHAPE.heart, 96), { dome: 0.42, under: 0.42, double: true }).rotateX(Math.PI / 2).rotateZ(Math.PI / 2),
  tropfencabochon: () => cabochon(sample(SHAPE.pear, 96), { dome: 0.55, under: 0.08 }),
  ovalcabochon: () => cabochon(sample(SHAPE.oval, 96), { dome: 0.42, under: 0.08 }),
  rundcabochon: () => cabochon(sample(SHAPE.circle, 96), { dome: 0.6, under: 0.08 }),
  handschmeichler: () => cabochon(sample(SHAPE.blob, 96), { dome: 0.32, under: 0.26, double: true }),
  mond: () => {
    const s = new THREE.Shape(), a = Math.acos(0.5275), b = Math.acos(0.0275 / 0.85);
    s.absarc(0, 0, 1, a, TAU - a, false); s.absarc(0.5, 0, 0.85, TAU - b, b, true);
    return extruded(s, 0.28, 0.16);
  },
  bi: () => {
    const s = new THREE.Shape(); s.absarc(0, 0, 1, 0, TAU, false);
    const h = new THREE.Path(); h.absarc(0, 0, 0.36, 0, TAU, true); s.holes.push(h);
    return extruded(s, 0.12, 0.08);
  },
  scheibe: () => extruded(new THREE.Shape(sample(SHAPE.agate, 96)), 0.1, 0.05),
  tafel: () => {
    const s = new THREE.Shape(), w = 0.95, h = 0.6, r = 0.14;
    s.moveTo(-w + r, -h); s.lineTo(w - r, -h); s.quadraticCurveTo(w, -h, w, -h + r); s.lineTo(w, h - r); s.quadraticCurveTo(w, h, w - r, h);
    s.lineTo(-w + r, h); s.quadraticCurveTo(-w, h, -w, h - r); s.lineTo(-w, -h + r); s.quadraticCurveTo(-w, -h, -w + r, -h);
    return extruded(s, 0.2, 0.05);
  },
  kugel: () => finish(new THREE.SphereGeometry(1, 72, 48), 1.9),
  singularitaet: () => finish(new THREE.SphereGeometry(1, 72, 48), 1.25),
  kiesel: () => {
    const geo = smoothen(new THREE.IcosahedronGeometry(1, 5)), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const k = 1 + 0.07 * Math.sin(x * 3.1 + 1) * Math.cos(z * 2.3) + 0.05 * Math.sin(y * 4.2 + z * 1.7);
      p.setXYZ(i, x * k * 1.15, y * k * 0.7, z * k * 0.92);
    }
    geo.computeVertexNormals();
    return finish(geo, 2.1);
  },
  komet: () => finish(new THREE.IcosahedronGeometry(1, 1), 1.8),
  dodekaeder: () => {
    const pts = [];
    for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) pts.push(v3(x, y, z));
    for (const s of [-2, 2]) pts.push(v3(s, 0, 0), v3(0, s, 0), v3(0, 0, s));
    return finish(new ConvexGeometry(pts), 2);
  },
  oktaeder: () => finish(new ConvexGeometry([v3(1, 0, 0), v3(-1, 0, 0), v3(0, 1.35, 0), v3(0, -1.35, 0), v3(0, 0, 1), v3(0, 0, -1)]), 2.4),
  prisma: () => {
    const tri = [[0, 0.82], [0.72, -0.42], [-0.72, -0.42]], pts = [];
    for (const x of [-1.2, 1.2]) for (const [y, z] of tri) pts.push(v3(x, y, z));
    for (const x of [-1.32, 1.32]) for (const [y, z] of tri) pts.push(v3(x, y * 0.78, z * 0.78));
    return finish(new ConvexGeometry(pts), 2.5, 'xy');
  },
  saeule: () => finish(placed(hexCrystal(0.45, 2, 0, { chamfer: 0.1 }), { rot: [0, 0, 0.18] }), 2.4),
  doppelspitze: () => finish(hexCrystal(0.5, 1.3, 0.6, { bottomApex: 0.6 }), 2.5),
  stab: () => finish(hexCrystal(0.42, 1.9, 0.32, { sides: 9, rFn: (a) => 1 + 0.16 * Math.cos(3 * a) }), 2.5),
  kristall: () => {
    const parts = [
      hexCrystal(0.42, 1.4, 0.6),
      placed(hexCrystal(0.22, 0.7, 0.32), { pos: [0.5, 0, 0.12], rot: [0, 0.4, -0.5] }),
      placed(hexCrystal(0.18, 0.5, 0.26), { pos: [-0.42, 0, -0.18], rot: [0.2, 0, 0.55] }),
      placed(hexCrystal(0.16, 0.42, 0.22), { pos: [0.05, 0, -0.45], rot: [-0.55, 0, 0] }),
    ];
    return finish(BGU.mergeGeometries(parts), 2.4);
  },
  druse: () => {
    // Aufgeschnittene Geode: Die Schnittfläche liegt bei y = 0, die Schale darunter. Kristallspitzen wachsen von der
    // Innenwand zur Mitte. 'shade' (0 = Fuß, 1 = Spitze) wird später mit den Steinfarben eingefärbt.
    const parts = [], rnd = seeded(77), up = v3(0, 1, 0);
    const grow = (dir, wallR, rad, h, apex, tilt) => {
      const geo = hexCrystal(rad, h, apex), p = geo.attributes.position, shade = new Float32Array(p.count);
      for (let i = 0; i < p.count; i++) shade[i] = Math.min(1, Math.max(0, p.getY(i) / (h + apex)));
      geo.setAttribute('shade', new THREE.BufferAttribute(shade, 1));
      const inward = dir.clone().negate().add(v3(...rndIn(tilt, tilt, tilt))).normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(up, inward);
      geo.applyMatrix4(new THREE.Matrix4().compose(dir.clone().multiplyScalar(wallR), q, v3(1, 1, 1)));
      parts.push(geo);
    };
    for (let i = 0; i < 150; i++) {
      let d; do { d = v3(rnd() * 2 - 1, -rnd(), rnd() * 2 - 1); } while (d.length() > 1 || d.length() < 0.2);
      d.normalize(); if (d.y > -0.08) d.y = -0.08 - rnd() * 0.1; d.normalize();
      const big = i < 9, mid = i < 40;
      const rad = big ? 0.1 + rnd() * 0.04 : mid ? 0.06 + rnd() * 0.03 : 0.035 + rnd() * 0.025;
      const h = big ? 0.22 + rnd() * 0.16 : mid ? 0.12 + rnd() * 0.12 : 0.05 + rnd() * 0.09;
      grow(d, 0.97, rad, h, rad * (1.5 + rnd() * 0.6), big ? 0.25 : 0.45);
    }
    for (let i = 0; i < 26; i++) { // Spitzen direkt an der Schnittkante
      const a = (i / 26) * TAU + rnd() * 0.2, d = v3(Math.cos(a), -0.12 - rnd() * 0.1, Math.sin(a)).normalize();
      grow(d, 0.97, 0.04 + rnd() * 0.03, 0.05 + rnd() * 0.07, 0.07 + rnd() * 0.04, 0.3);
    }
    const geo = BGU.mergeGeometries(parts);
    geo.rotateX(GEODE_TILT);
    planarUV(geo); geo.computeBoundingBox();
    return geo;
  },
  fragezeichen: () => {
    const q = new THREE.Shape(), d2r = Math.PI / 180, cy = 0.55, R = 0.72, r = 0.37;
    q.absarc(0, cy, R, 160 * d2r, -50 * d2r, true);
    q.lineTo(0.17, -0.15); q.lineTo(0.17, -0.42); q.lineTo(-0.17, -0.42); q.lineTo(-0.17, -0.05);
    q.lineTo(r * Math.cos(-50 * d2r), cy + r * Math.sin(-50 * d2r));
    q.absarc(0, cy, r, -50 * d2r, 160 * d2r, false);
    const dot = new THREE.Shape(); dot.absarc(0, -0.78, 0.19, 0, TAU, false);
    const geo = new THREE.ExtrudeGeometry([q, dot], { depth: 0.3, bevelEnabled: true, bevelThickness: 0.09, bevelSize: 0.07, bevelSegments: 2, curveSegments: 9 });
    return finish(geo, 2.4, 'xy');
  },
  urknall: () => {
    const ico = new THREE.IcosahedronGeometry(0.7, 0), p = ico.attributes.position, tris = [];
    for (let f = 0; f < p.count; f += 3) {
      const a = v3(p.getX(f), p.getY(f), p.getZ(f)), b = v3(p.getX(f + 1), p.getY(f + 1), p.getZ(f + 1)), c = v3(p.getX(f + 2), p.getY(f + 2), p.getZ(f + 2));
      const tip = a.clone().add(b).add(c).normalize().multiplyScalar(1.3);
      tris.push([a, b, tip], [b, c, tip], [c, a, tip]);
    }
    return finish(triGeo(tris, v3(0, 0, 0)), 2.3);
  },
};
const GEODE_TILT = 0.62; // Die Öffnung der Geode schaut schräg zur Kamera
const geoCache = {};
const baseGeometry = (cut) => (geoCache[cut] ||= BUILD[cut]());

function gemGeometry(gem) {
  let geo = baseGeometry(gem.cut);
  geo = geo.index ? geo.toNonIndexed() : geo.clone();
  const fx = gem.look.fx;
  if (geo.attributes.shade) {
    const sh = geo.attributes.shade, col = new Float32Array(sh.count * 3), [l, b, d] = gem.colors.map((c) => new THREE.Color(c));
    const foot = b.clone().lerp(l, 0.45), mid = b.clone(), tip = d.clone(), c = new THREE.Color();
    for (let i = 0; i < sh.count; i++) { const t = sh.getX(i); if (t < 0.55) c.copy(foot).lerp(mid, t / 0.55); else c.copy(mid).lerp(tip, (t - 0.55) / 0.45); c.toArray(col, i * 3); }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  }
  if (fx.includes('verlauf') || fx.includes('zweifarbig')) {
    const p = geo.attributes.position, col = new Float32Array(p.count * 3);
    geo.computeBoundingBox(); const { min, max } = geo.boundingBox;
    const [l, b, d] = gem.colors.map((c) => new THREE.Color(c));
    const c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const t = (p.getY(i) - min.y) / (max.y - min.y);
      if (fx.includes('zweifarbig')) { const k = THREE.MathUtils.smoothstep(t, 0.42, 0.58); c.copy(d).lerp(b, k); if (t > 0.9) c.lerp(l, (t - 0.9) * 4); }
      else c.copy(d).lerp(b, t).lerp(l, Math.pow(t, 3) * 0.6);
      c.toArray(col, i * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  }
  return geo;
}

// ── Texturen (aus den Steinfarben gemalt) ──────────────────────────────────
const texCache = {};
function causticTexture() {
  return pixelTex('kaustik', 256, (u, v) => {
    const x = u * 6, y = v * 6;
    const a = Math.sin(x * 2.1 + Math.sin(y * 1.7) * 1.8) + Math.sin(y * 2.3 + Math.sin(x * 1.9) * 1.6) + Math.sin((x + y) * 1.4);
    const k = Math.pow(Math.max(0, 1 - Math.abs(a) * 0.55), 5), r = Math.hypot(u - 0.5, v - 0.5) * 2, f = k * Math.max(0, 1 - r * r) + Math.max(0, 1 - r) * 0.15;
    return [f, f, f];
  });
}
function canvasTex(key, size, draw) {
  if (texCache[key]) return texCache[key];
  const cv = document.createElement('canvas'); cv.width = cv.height = size;
  draw(cv.getContext('2d'), size);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return (texCache[key] = t);
}
function pixelTex(key, size, fn) {
  return canvasTex(key, size, (x, S) => {
    const img = x.createImageData(S, S);
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const [r, g, b] = fn(i / S, j / S); const o = (j * S + i) * 4;
      img.data[o] = r * 255; img.data[o + 1] = g * 255; img.data[o + 2] = b * 255; img.data[o + 3] = 255;
    }
    x.putImageData(img, 0, 0);
  });
}
const rgb = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b].map((v) => Math.pow(v, 1 / 2.2)); };
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
function seeded(n) { let s = n; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }

function surface(tex, colors) {
  const key = tex + colors.join();
  const [L, B, D] = colors.map(rgb);
  switch (tex) {
    case 'ringe': return pixelTex(key, 512, (u, v) => {
      const x = u - 0.5, y = v - 0.5, a = Math.atan2(y, x), d = Math.hypot(x, y) + 0.025 * Math.sin(6 * a) + 0.015 * Math.sin(13 * a + 1);
      const f = (d * 15) % 1;
      if (d < 0.07) return mix(L, [1, 1, 1], 0.5);
      return f < 0.12 ? mix(L, [1, 1, 1], 0.3) : f < 0.5 ? mix(B, L, f * 0.4) : f < 0.58 ? D : mix(B, D, 0.3);
    });
    case 'wellen': return pixelTex(key, 512, (u, v) => {
      const d1 = Math.hypot(u - 0.32, v - 0.36), d2 = Math.hypot(u - 0.74, v - 0.7) * 1.15, d3 = Math.hypot(u - 0.2, v - 0.85) * 1.3;
      const d = Math.min(d1, d2, d3) + 0.012 * Math.sin(u * 40 + v * 13);
      const f = (d * 22) % 1;
      return f < 0.35 ? mix(D, B, f * 1.5) : f < 0.85 ? mix(B, L, (f - 0.35) * 0.9) : D;
    });
    case 'sprenkel': return canvasTex(key, 512, (x, S) => {
      const r = seeded(11); x.fillStyle = colors[1]; x.fillRect(0, 0, S, S);
      for (let i = 0; i < 1600; i++) { x.fillStyle = r() < 0.6 ? colors[2] + '99' : colors[0] + '66'; x.beginPath(); x.arc(r() * S, r() * S, 1 + r() * 5, 0, TAU); x.fill(); }
    });
    case 'goldsprenkel': return canvasTex(key, 512, (x, S) => {
      const r = seeded(5); x.fillStyle = colors[1]; x.fillRect(0, 0, S, S);
      for (let i = 0; i < 260; i++) { const g = x.createRadialGradient(0, 0, 0, 0, 0, 40); x.save(); x.translate(r() * S, r() * S); g.addColorStop(0, colors[2] + 'aa'); g.addColorStop(1, colors[2] + '00'); x.fillStyle = g; x.fillRect(-40, -40, 80, 80); x.restore(); }
      for (let i = 0; i < 40; i++) { x.strokeStyle = colors[0] + '55'; x.lineWidth = 1 + r() * 2; x.beginPath(); const sx = r() * S, sy = r() * S; x.moveTo(sx, sy); x.quadraticCurveTo(sx + 30, sy + r() * 40, sx + 60 + r() * 60, sy + r() * 30); x.stroke(); }
      for (let i = 0; i < 520; i++) { x.fillStyle = r() < 0.8 ? '#e8c86a' : '#fff0b0'; x.beginPath(); x.arc(r() * S, r() * S, 0.8 + r() * 2.2, 0, TAU); x.fill(); }
    });
    case 'wolken': return canvasTex(key, 512, (x, S) => {
      const r = seeded(9); x.fillStyle = colors[1]; x.fillRect(0, 0, S, S);
      for (let i = 0; i < 70; i++) { const g = x.createRadialGradient(0, 0, 0, 0, 0, 90); x.save(); x.translate(r() * S, r() * S); x.scale(1.8, 0.7); g.addColorStop(0, (r() < 0.5 ? colors[0] : colors[2]) + '55'); g.addColorStop(1, colors[1] + '00'); x.fillStyle = g; x.fillRect(-90, -90, 180, 180); x.restore(); }
    });
    case 'streifen': return canvasTex(key, 512, (x, S) => {
      const r = seeded(21); x.fillStyle = colors[1]; x.fillRect(0, 0, S, S);
      for (let i = 0; i < 90; i++) { x.strokeStyle = (r() < 0.5 ? colors[2] : colors[0]) + '66'; x.lineWidth = 2 + r() * 10; const o = r() * S * 1.6 - S * 0.3; x.beginPath(); x.moveTo(o, 0); x.lineTo(o - S * 0.5, S); x.stroke(); }
    });
    case 'opalfeuer': return canvasTex(key, 512, (x, S) => {
      const r = seeded(17); x.fillStyle = colors[0]; x.fillRect(0, 0, S, S);
      for (let i = 0; i < 260; i++) {
        const hue = Math.floor(r() * 360), cx = r() * S, cy = r() * S, rad = 10 + r() * 34;
        const g = x.createRadialGradient(cx, cy, 0, cx, cy, rad); g.addColorStop(0, `hsla(${hue},95%,62%,.85)`); g.addColorStop(1, `hsla(${hue},95%,62%,0)`);
        x.fillStyle = g; x.beginPath(); x.ellipse(cx, cy, rad, rad * (0.4 + r() * 0.6), r() * 3, 0, TAU); x.fill();
      }
    });
    case 'stern': return canvasTex(key, 512, (x, S) => {
      x.fillStyle = '#000'; x.fillRect(0, 0, S, S); x.translate(S / 2, S / 2);
      for (let k = 0; k < 3; k++) {
        x.save(); x.rotate((k * Math.PI) / 3);
        const g = x.createLinearGradient(-S / 2, 0, S / 2, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        x.fillStyle = g; x.shadowColor = '#fff'; x.shadowBlur = 18; x.fillRect(-S / 2, -5, S, 10); x.restore();
      }
      const c = x.createRadialGradient(0, 0, 0, 0, 0, 90); c.addColorStop(0, 'rgba(255,255,255,.95)'); c.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = c; x.fillRect(-90, -90, 180, 180);
    });
    case 'polarlicht': {
      const t = canvasTex(key, 512, (x, S) => {
        x.fillStyle = colors[1] + '30'; x.fillStyle = '#081814'; x.fillRect(0, 0, S, S);
        const r = seeded(4);
        for (let i = 0; i < 26; i++) {
          const cx = r() * S, w = 20 + r() * 50, col = r() < 0.55 ? colors[1] : colors[2];
          const g = x.createLinearGradient(0, 0, 0, S); g.addColorStop(0, col + '00'); g.addColorStop(0.3 + r() * 0.3, col + 'cc'); g.addColorStop(1, col + '00');
          x.fillStyle = g; x.beginPath(); x.moveTo(cx, 0);
          for (let y = 0; y <= S; y += 16) x.lineTo(cx + Math.sin(y / 40 + i) * 18, y);
          for (let y = S; y >= 0; y -= 16) x.lineTo(cx + w + Math.sin(y / 40 + i) * 18, y);
          x.fill();
        }
      });
      t.wrapS = THREE.RepeatWrapping; return t;
    }
  }
  return null;
}
const SPRITE = {};
function sprite(kind) {
  return SPRITE[kind] ||= canvasTex('sprite-' + kind, 128, (x, S) => {
    const c = S / 2;
    if (kind === 'dot' || kind === 'star' || kind === 'glow') {
      const g = x.createRadialGradient(c, c, 0, c, c, c);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(kind === 'glow' ? 0.3 : 0.18, kind === 'glow' ? 'rgba(255,255,255,.45)' : 'rgba(255,255,255,.7)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.fillRect(0, 0, S, S);
      if (kind === 'star') { x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 2.5; x.beginPath(); x.moveTo(c, 4); x.lineTo(c, S - 4); x.moveTo(4, c); x.lineTo(S - 4, c); x.stroke(); }
    } else if (kind === 'q') {
      x.font = `700 ${S * 0.8}px Georgia, serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.shadowColor = '#fff'; x.shadowBlur = 14; x.fillStyle = '#fff'; x.fillText('?', c, c + S * 0.04);
    } else if (kind === 'rays') {
      x.translate(c, c);
      for (let i = 0; i < 16; i++) {
        x.rotate(TAU / 16); const g = x.createLinearGradient(0, 0, c, 0); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        x.fillStyle = g; x.beginPath(); x.moveTo(0, 0); x.lineTo(c, i % 2 ? -3 : -6); x.lineTo(c, i % 2 ? 3 : 6); x.fill();
      }
    } else if (kind === 'ring') {
      x.strokeStyle = 'rgba(255,255,255,1)'; x.lineWidth = 5; x.shadowColor = '#fff'; x.shadowBlur = 10; x.beginPath(); x.arc(c, c, c - 10, 0, TAU); x.stroke();
    } else if (kind === 'disk') {
      const g = x.createRadialGradient(c, c, c * 0.5, c, c, c);
      g.addColorStop(0, 'rgba(255,240,220,1)'); g.addColorStop(0.2, 'rgba(255,160,90,.9)'); g.addColorStop(0.55, 'rgba(200,80,220,.55)'); g.addColorStop(1, 'rgba(90,40,160,0)');
      x.fillStyle = g; x.fillRect(0, 0, S, S);
      const r = seeded(8); x.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 40; i++) { x.strokeStyle = `rgba(0,0,0,${0.15 + r() * 0.3})`; x.lineWidth = 1 + r() * 2; x.beginPath(); x.arc(c, c, c * (0.52 + r() * 0.46), r() * TAU, r() * TAU + 1.5); x.stroke(); }
    }
  });
}

// ── Material ───────────────────────────────────────────────────────────────
const MAT_PARAMS = {
  klar: { transmission: 0.72, roughness: 0.02, ior: 1.72, att: 3, glow: 0.14, disp: 1.2 },
  diamant: { transmission: 0.82, roughness: 0, ior: 2.42, att: 6, glow: 0.1, disp: 4.5 },
  milchig: { transmission: 0.35, roughness: 0.14, ior: 1.55, att: 2, glow: 0.14, disp: 0.3 },
  jade: { transmission: 0.38, roughness: 0.3, ior: 1.6, att: 1.2, glow: 0.08 },
  opak: { transmission: 0, roughness: 0.18, clearcoat: 1, glow: 0.03 },
  stein: { transmission: 0, roughness: 0.42, clearcoat: 0.25, glow: 0.02 },
  schwarz: { transmission: 0, roughness: 0.03, metalness: 0.35, clearcoat: 1, glow: 0 },
};
function makeMaterial(gem) {
  const { mat, tex, fx } = gem.look;
  const P = MAT_PARAMS[mat] || MAT_PARAMS.klar;
  const [light, base, deep] = gem.colors.map((c) => new THREE.Color(c));
  const m = new THREE.MeshPhysicalMaterial({
    color: base, metalness: P.metalness || 0, roughness: P.roughness,
    transmission: P.transmission, thickness: 1.4, ior: P.ior || 1.5,
    attenuationColor: deep, attenuationDistance: P.att || 1,
    specularIntensity: 1, specularColor: light,
    clearcoat: P.clearcoat ?? 0.4, clearcoatRoughness: 0.05, envMapIntensity: 1.6,
    emissive: base, emissiveIntensity: P.glow, dispersion: P.disp || 0,
  });
  if (fx.includes('verlauf') || fx.includes('zweifarbig')) { m.vertexColors = true; m.color.set('#ffffff'); }
  if (tex) {
    const t = surface(tex, gem.colors);
    if (tex === 'stern') { m.emissiveMap = t; m.emissive = light; m.emissiveIntensity = 1.1; m.color = base.clone().lerp(deep, 0.35); }
    else if (tex === 'polarlicht') { m.map = t; m.emissiveMap = t; m.emissive.set('#ffffff'); m.emissiveIntensity = 0.8; m.color.set('#ffffff'); }
    else if (tex === 'opalfeuer') { m.map = t; m.emissiveMap = t; m.emissive.set('#ffffff'); m.emissiveIntensity = 0.3; m.color.set('#ffffff'); }
    else { m.map = t; m.color.set('#ffffff'); m.emissiveMap = t; m.emissive.set('#ffffff'); m.emissiveIntensity = 0.06; }
  }
  if (fx.includes('glut')) { m.emissive = deep.clone().lerp(base, 0.5); m.emissiveIntensity = 0.45; }
  if (fx.includes('neon')) { m.emissive = base; m.emissiveIntensity = 0.85; }
  if (fx.includes('schiller')) { m.iridescence = 0.85; m.iridescenceIOR = 1.6; m.iridescenceThicknessRange = [200, 700]; }
  if (fx.includes('labradoreszenz')) { m.iridescence = 1; m.iridescenceIOR = 2; m.iridescenceThicknessRange = [200, 800]; }
  if (mat === 'schwarz') { m.emissive = deep; m.emissiveIntensity = 0.05; m.iridescence = 0.6; m.iridescenceThicknessRange = [300, 600]; }
  return m;
}

// ── Effekte: Zusatzobjekte und Animationen je Stein ────────────────────────
function cloud(n, gen, { size = 0.08, color = '#ffffff', tex = 'dot', additive = true, opacity = 1, inner = false, vertexColors = false }) {
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), seedArr = new Float32Array(n);
  const c = new THREE.Color();
  for (let i = 0; i < n; i++) { const r = gen(i, c); pos.set(r, i * 3); c.toArray(col, i * 3); seedArr[i] = Math.random(); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  if (vertexColors) g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.userData.seed = seedArr; g.userData.base = pos.slice();
  const pts = new THREE.Points(g, new THREE.PointsMaterial({
    map: sprite(tex), size, color: vertexColors ? 0xffffff : color, vertexColors, transparent: true, opacity,
    depthWrite: false, depthTest: !inner, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  }));
  if (inner) pts.renderOrder = 3;
  return pts;
}
const rndIn = (sx, sy, sz) => { let x, y, z; do { x = Math.random() * 2 - 1; y = Math.random() * 2 - 1; z = Math.random() * 2 - 1; } while (x * x + y * y + z * z > 1); return [x * sx, y * sy, z * sz]; };
function billboard(kind, color, scale, opacity = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: sprite(kind), color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending }));
  s.scale.set(scale, scale, 1); return s;
}

// Gesteinsschale der Geode: raue Außenhaut, Achatbänder an der Schnittkante, heller Chalcedon innen, violettes Leuchten
const geoNoise = (x, y, z) => 1 + 0.07 * Math.sin(x * 5.1 + 1) * Math.cos(z * 4.3) + 0.04 * Math.sin(y * 7 + z * 3) + 0.03 * Math.sin(x * 11 + z * 9);
function agateTexture(colors) {
  return canvasTex('achatrand' + colors.join(), 512, (x, S) => {
    const c = S / 2, toPx = (r) => (r / 1.2) * c;
    x.fillStyle = '#6a5e52'; x.fillRect(0, 0, S, S);
    const bands = ['#a89eb4', '#6a6276', '#bcb4c6', '#544c60', '#9a90aa', colors[1], '#b0a8bc', '#5e5470', '#8e84a0'];
    let r = 1.2;
    const rnd = seeded(13);
    for (let i = 0; r > 0.96; i++) { const w = 0.012 + rnd() * 0.03; x.fillStyle = bands[i % bands.length]; x.beginPath(); x.arc(c, c, toPx(r), 0, TAU); x.fill(); r -= w; }
    x.fillStyle = colors[2]; x.beginPath(); x.arc(c, c, toPx(0.97), 0, TAU); x.fill();
  });
}
function geodeShell(gem) {
  const grp = new THREE.Group();
  const outerGeo = new THREE.SphereGeometry(1.2, 72, 36, 0, TAU, Math.PI / 2, Math.PI / 2), op = outerGeo.attributes.position;
  for (let i = 0; i < op.count; i++) { const x = op.getX(i), y = op.getY(i), z = op.getZ(i), k = geoNoise(x, 0, z) * (1 + 0.05 * Math.sin(x * 9 + y * 8)); op.setXYZ(i, x * k, Math.min(0, y * k), z * k); }
  outerGeo.computeVertexNormals();
  const rock = new THREE.MeshStandardMaterial({ map: surface('sprenkel', ['#b8a898', '#6e6256', '#3a322c']), roughness: 0.95, flatShading: true });
  const outer = new THREE.Mesh(outerGeo, rock);
  const inner = new THREE.Mesh(new THREE.SphereGeometry(1.0, 48, 24, 0, TAU, Math.PI / 2, Math.PI / 2), new THREE.MeshStandardMaterial({ color: new THREE.Color(gem.colors[2]).lerp(new THREE.Color('#2a2232'), 0.45), roughness: 0.6, envMapIntensity: 0.5, side: THREE.BackSide }));
  const ringGeo = new THREE.RingGeometry(0.985, 1.2, 128, 3), rp = ringGeo.attributes.position;
  for (let i = 0; i < rp.count; i++) { const x = rp.getX(i), y = rp.getY(i); if (Math.hypot(x, y) > 1.15) { const k = geoNoise(x, 0, -y); rp.setXY(i, x * k, y * k); } }
  const ring = new THREE.Mesh(ringGeo, new THREE.MeshStandardMaterial({ map: agateTexture(gem.colors), roughness: 0.55, metalness: 0.05, envMapIntensity: 0.45, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.002;
  const glow = new THREE.PointLight(new THREE.Color(gem.colors[1]), 1.1, 2.4); glow.position.set(0, -0.35, 0);
  grp.add(outer, inner, ring, glow);
  grp.rotation.x = GEODE_TILT;
  return grp;
}
const SMOOTH_CUTS = new Set(['perle', 'kugel', 'singularitaet', 'kiesel', 'herzkissen', 'tropfencabochon', 'ovalcabochon', 'rundcabochon', 'handschmeichler', 'mond', 'bi', 'scheibe', 'tafel']);
// Geöffnete Perlmuttmuschel unter und hinter der Perle
function scallopShell() {
  const grp = new THREE.Group();
  // Schalenmuster: u = quer über den Fächer, v = vom Scharnier zum Rand
  const outerTex = canvasTex('kammmuschel-aussen', 512, (x, S) => {
    const g2 = x.createLinearGradient(0, 0, 0, S); g2.addColorStop(0, '#f2dcc8'); g2.addColorStop(0.5, '#e09a7a'); g2.addColorStop(1, '#b8584a'); x.fillStyle = g2; x.fillRect(0, 0, S, S);
    for (let i = 0; i < 17; i++) { const cx = (i + 0.5) / 17 * S, g3 = x.createLinearGradient(cx - S / 34, 0, cx + S / 34, 0); g3.addColorStop(0, 'rgba(90,30,20,.35)'); g3.addColorStop(0.5, 'rgba(255,240,225,.35)'); g3.addColorStop(1, 'rgba(90,30,20,.35)'); x.fillStyle = g3; x.fillRect(cx - S / 34, 0, S / 17, S); }
    for (let k = 0; k < 14; k++) { const y = S * (0.12 + k * 0.065 + Math.sin(k) * 0.01); x.strokeStyle = `rgba(110,50,35,${0.25 + (k % 3) * 0.1})`; x.lineWidth = 1.5 + (k % 4 === 0 ? 2 : 0); x.beginPath(); x.moveTo(0, y); for (let u = 0; u <= S; u += 8) x.lineTo(u, y + Math.sin(u / S * Math.PI * 17) * 3); x.stroke(); }
    const r = seeded(29); for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(150,60,50,${r() * 0.3})`; x.beginPath(); x.arc(r() * S, S * 0.3 + r() * S * 0.7, 1 + r() * 4, 0, TAU); x.fill(); }
  });
  const outer = new THREE.MeshStandardMaterial({ map: outerTex, roughness: 0.7, envMapIntensity: 0.5 });
  const nacre = new THREE.MeshPhysicalMaterial({ color: '#8e7f98', roughness: 0.14, iridescence: 1, iridescenceIOR: 1.7, iridescenceThicknessRange: [200, 800], clearcoat: 0.8, envMapIntensity: 0.5 });
  const lipMat = new THREE.MeshStandardMaterial({ color: '#c49484', roughness: 0.6, envMapIntensity: 0.35, side: THREE.DoubleSide });
  // Jede Hälfte ist ein geschlossener Körper: Außenseite, Innenseite (Perlmutt) und eine Randfläche ringsum.
  // Die Scharnierkante ist gerade (x von -HW bis +HW bei z = 0), damit beide Hälften dort auf ganzer Breite zusammenstoßen.
  const RA = 1.5, SPAN = 1.42, HW = 0.42, RIBS = 17, NU = 136, NV = 36, THICK = 0.035;
  const rimPoint = (u, span) => { const a = u * span, R = RA * (0.97 + 0.03 * Math.cos(a * 1.4)); return [Math.sin(a) * R, Math.cos(a) * R]; };
  const surf = (u, v, depth, inner, span = SPAN) => {
    const [rx, rz] = rimPoint(u, span), hx = u * HW;
    const rib = 0.5 + 0.5 * Math.cos(u * RIBS * Math.PI);
    const x = hx + (rx - hx) * v, z = rz * v;
    const spread = 1 + rib * 0.03 * v;
    let y = depth * Math.pow(Math.sin(Math.PI * Math.min(1, v * 0.98 + 0.02)), 0.8) * (1 - 0.35 * u * u) + rib * 0.05 * v * v;
    if (inner) y -= THICK * (1 - 0.6 * v);
    return [x * spread, y, z * spread];
  };
  const valve = (depth, span = SPAN) => {
    const outerPos = [], innerPos = [], uvs = [], idxO = [], idxI = [];
    for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
      const u = -1 + (2 * i) / NU, v = j / NV;
      outerPos.push(...surf(u, v, depth, false, span)); innerPos.push(...surf(u, v, depth, true, span)); uvs.push(i / NU, v);
    }
    for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) {
      const a = j * (NU + 1) + i, b = a + 1, c = a + NU + 1, d = c + 1;
      idxO.push(a, c, b, b, c, d); idxI.push(a, b, c, b, d, c);
    }
    const mk = (pos, idx) => { const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g2.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g2.setIndex(idx); g2.computeVertexNormals(); return g2; };
    // Randfläche: läuft einmal um den Umriss (Scharnier, rechte Seite, Rand, linke Seite) und verbindet außen mit innen
    const loop = [];
    for (let i = 0; i <= NU; i++) loop.push([i, 0]);
    for (let j = 1; j <= NV; j++) loop.push([NU, j]);
    for (let i = NU - 1; i >= 0; i--) loop.push([i, NV]);
    for (let j = NV - 1; j >= 1; j--) loop.push([0, j]);
    const rimPos = [], rimIdx = [];
    loop.forEach(([i, j]) => { const k = (j * (NU + 1) + i) * 3; rimPos.push(outerPos[k], outerPos[k + 1], outerPos[k + 2], innerPos[k], innerPos[k + 1], innerPos[k + 2]); });
    for (let n = 0; n < loop.length; n++) { const a = n * 2, b = ((n + 1) % loop.length) * 2; rimIdx.push(a, b, a + 1, a + 1, b, b + 1); }
    const rimG = new THREE.BufferGeometry(); rimG.setAttribute('position', new THREE.Float32BufferAttribute(rimPos, 3)); rimG.setIndex(rimIdx); rimG.computeVertexNormals();
    const o = new THREE.Group();
    o.add(new THREE.Mesh(mk(outerPos, idxO), outer), new THREE.Mesh(mk(innerPos, idxI), nacre), new THREE.Mesh(rimG, lipMat));
    return o;
  };
  const HZ = -0.78, HY = -0.49;
  const bottom = valve(0.62); bottom.scale.y = -1; bottom.position.set(0, HY, HZ); grp.add(bottom);
  const LID_SPAN = 1.85;
  const lid = valve(0.32, LID_SPAN); lid.position.set(0, HY, HZ); lid.rotation.x = -1.2; grp.add(lid);
  // Seiten schließen: zwischen der Seitenkante der unteren Schale und der des Deckels spannt sich auf ganzer Länge eine Wand,
  // die Muschel ist dadurch wie in echt nur nach vorne offen
  const WN = 30, wallMat = new THREE.MeshStandardMaterial({ color: '#b48a8a', roughness: 0.5, envMapIntensity: 0.45, side: THREE.DoubleSide });
  const walls = [-1, 1].map((sd) => {
    const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.BufferAttribute(new Float32Array((WN + 1) * 2 * 3), 3));
    const idx = []; for (let i = 0; i < WN; i++) { const a = i * 2, b = a + 1, c = a + 2, d = a + 3; idx.push(a, c, b, b, c, d); } g2.setIndex(idx);
    grp.add(new THREE.Mesh(g2, wallMat)); return { g2, sd };
  });
  const tmp = v3();
  const updateWalls = () => {
    bottom.updateMatrix(); lid.updateMatrix();
    for (const w of walls) {
      const p = w.g2.attributes.position;
      for (let i = 0; i <= WN; i++) {
        const v = i / WN;
        tmp.set(...surf(w.sd, v, 0.62, false, SPAN)).applyMatrix4(bottom.matrix); p.setXYZ(i * 2, tmp.x, tmp.y, tmp.z);
        tmp.set(...surf(w.sd, v, 0.32, false, LID_SPAN)).applyMatrix4(lid.matrix); p.setXYZ(i * 2 + 1, tmp.x, tmp.y, tmp.z);
      }
      p.needsUpdate = true; w.g2.computeVertexNormals(); w.g2.computeBoundingSphere();
    }
  };
  updateWalls();
  // Schlossband aus dunklem Horn entlang der Scharnierkante
  const hornMat = new THREE.MeshStandardMaterial({ color: '#4a2e22', roughness: 0.55, envMapIntensity: 0.4 });
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, HW * 2, 20), hornMat); band.rotation.z = Math.PI / 2; band.position.set(0, HY, HZ - 0.02); grp.add(band);
  for (const cap of [-1, 1]) { const c = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), hornMat); c.position.set(cap * HW, HY, HZ - 0.02); grp.add(c); }
  const water = new THREE.Mesh(new THREE.CircleGeometry(0.55, 48), new THREE.MeshPhysicalMaterial({ color: '#bcd8ff', transparent: true, opacity: 0.32, roughness: 0.02, transmission: 0.6, depthWrite: false }));
  water.rotation.x = -Math.PI / 2; water.position.set(0, -1.02, -0.05); water.scale.set(1, 0.8, 1); grp.add(water);
  const sand = cloud(40, () => { const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * 0.5; return [Math.cos(a) * r, -1.05, -0.05 + Math.sin(a) * r * 0.8]; }, { size: 0.05, tex: 'star', color: '#fff4d8' }); grp.add(sand);
  grp.userData.update = (t) => { lid.rotation.x = -1.2 + Math.sin(t * 0.6) * 0.07; updateWalls(); nacre.iridescenceThicknessRange = [200 + 120 * Math.sin(t * 0.7), 800]; sand.material.opacity = 0.4 + 0.5 * Math.abs(Math.sin(t * 1.9)); water.material.opacity = 0.28 + 0.06 * Math.sin(t * 1.4); };
  return grp;
}
function createGem(gem) {
  const group = new THREE.Group();
  const mesh = new THREE.Mesh(gemGeometry(gem), makeMaterial(gem));
  group.add(mesh);
  const extras = new THREE.Group(); group.add(extras);
  const structure = new THREE.Group(); group.add(structure); // bleibt auch beim Schleifen und Polieren sichtbar
  const m = mesh.material;
  if (mesh.geometry.attributes.color && !m.vertexColors) { m.vertexColors = true; m.color.set('#ffffff'); }
  {
    const [cl, cb] = gem.colors.map((c) => new THREE.Color(c));
    // Innere Spiegelungen: eine glänzende Innenseite, die durch den Stein hindurch gebrochen wird
    if (m.transmission > 0.3) {
      const inner = new THREE.Mesh(mesh.geometry, new THREE.MeshStandardMaterial({ color: cl.clone().lerp(cb, 0.55), metalness: 1, roughness: 0.06, envMapIntensity: 1.6, side: THREE.BackSide, vertexColors: m.vertexColors }));
      inner.scale.setScalar(0.93); extras.add(inner);
    }
    // feine Lichtkanten auf den Facetten
    if (!SMOOTH_CUTS.has(gem.cut)) {
      const lines = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 20), new THREE.LineBasicMaterial({ color: cl.clone().lerp(new THREE.Color('#ffffff'), 0.5), transparent: true, opacity: gem.cut === 'druse' ? 0.12 : 0.22, blending: THREE.AdditiveBlending, depthWrite: false }));
      lines.scale.setScalar(1.002); extras.add(lines);
    }
  }
  mesh.geometry.computeBoundingBox();
  const bb = mesh.geometry.boundingBox, size = bb.getSize(v3());
  const ins = [size.x * 0.28, size.y * 0.28, size.z * 0.28];
  const [L, B, D] = gem.colors.map((c) => new THREE.Color(c));
  const up = [];
  const az = (cam) => Math.atan2(cam.position.x, cam.position.z);

  for (const f of gem.look.fx) {
    if (f === 'phantom') {
      extras.add(cloud(16, () => rndIn(ins[0], ins[1] * 1.3, ins[2]), { size: 0.22, color: '#ffffff', opacity: 0.35, inner: true }));
    } else if (f === 'funken') {
      const p = cloud(22, () => { const a = Math.random() * TAU; return [Math.cos(a) * size.x * 0.55, (Math.random() - 0.3) * size.y, Math.sin(a) * size.z * 0.55]; }, { size: 0.2, color: L, tex: 'star' });
      extras.add(p); up.push((t) => { p.material.opacity = 0.4 + 0.6 * Math.abs(Math.sin(t * 2.2)); p.rotation.y = t * 0.3; });
    } else if (f === 'glut') {
      const base = m.emissiveIntensity; up.push((t) => { m.emissiveIntensity = base + Math.sin(t * 3) * 0.12 + Math.sin(t * 7.3) * 0.05; });
    } else if (f === 'geode') {
      structure.add(geodeShell(gem));
    } else if (f === 'blasen') {
      const p = cloud(40, () => rndIn(ins[0] * 0.8, ins[1] * 1.4, ins[2] * 0.8), { size: 0.06, color: '#ffffff', additive: false, opacity: 0.7, inner: true });
      extras.add(p);
      up.push((t, dt) => { const a = p.geometry.attributes.position; for (let i = 0; i < a.count; i++) { let y = a.getY(i) + dt * 0.18; if (y > ins[1] * 1.4) y = -ins[1] * 1.4; a.setY(i, y); } a.needsUpdate = true; });
    } else if (f === 'einschluss') {
      extras.add(cloud(60, () => rndIn(ins[0] * 1.2, ins[1] * 0.6, ins[2] * 1.2), { size: 0.09, color: D, additive: false, opacity: 0.55, inner: true }));
    } else if (f === 'blickwechsel') {
      const blue = new THREE.Color('#2a52e8');
      up.push((t, dt, cam) => { const k = (Math.sin(az(cam) * 1.5) + 1) / 2; m.color.copy(blue).lerp(B, k); m.emissive.copy(m.color); m.attenuationColor.copy(new THREE.Color('#0e1a6a')).lerp(D, k); });
    } else if (f === 'mondschein') {
      m.emissive.set('#9ac0ff');
      up.push((t, dt, cam) => { m.emissiveIntensity = 0.06 + 0.5 * Math.pow(Math.max(0, Math.sin(az(cam) * 2 + t * 0.7)), 3); });
    } else if (f === 'labradoreszenz') {
      up.push((t, dt, cam) => { const k = (Math.sin(az(cam) * 2.5 + t * 0.4) + 1) / 2; m.iridescenceThicknessRange = [120 + k * 500, 900]; m.iridescence = 0.4 + k * 0.6; });
    } else if (f === 'glitzer') {
      const p = cloud(140, () => rndIn(ins[0] * 1.4, ins[1] * 0.7, ins[2] * 1.4), { size: 0.09, color: '#ffb070', tex: 'star', inner: true });
      extras.add(p); up.push((t) => { p.material.opacity = 0.55 + 0.45 * Math.sin(t * 4); p.rotation.y = t * 0.2; });
    } else if (f === 'farbwechsel') {
      const g = B.clone(), r = D.clone(), dg = new THREE.Color('#0a4a2a'), dr = new THREE.Color('#4a0a24');
      up.push((t) => { const k = (Math.sin(t * 0.9) + 1) / 2; m.color.copy(g).lerp(r, k); m.emissive.copy(m.color); m.attenuationColor.copy(dg).lerp(dr, k); });
    } else if (f === 'neon') {
      const h = billboard('glow', B, 4.2, 0.6); extras.add(h);
      up.push((t) => { m.emissiveIntensity = 0.7 + 0.25 * Math.sin(t * 2.4); h.material.opacity = 0.45 + 0.15 * Math.sin(t * 2.4); });
    } else if (f === 'goldfassung') {
      const gold = new THREE.MeshStandardMaterial({ color: '#e8c86a', metalness: 1, roughness: 0.22 });
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.34, 20, 1, true), gold); cap.position.y = bb.max.y - 0.12;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.035, 14, 36), gold); ring.position.y = bb.max.y + 0.15;
      const bead = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), gold); bead.position.y = bb.max.y + 0.03;
      structure.add(cap, ring, bead);
    } else if (f === 'regenbogen') {
      const p = cloud(46, (i, c) => { c.setHSL(i / 46, 1, 0.65); const a = Math.random() * TAU, r = 1.2 + Math.random() * 0.6; return [Math.cos(a) * r, (Math.random() - 0.5) * 1.6, Math.sin(a) * r]; }, { size: 0.2, tex: 'star', vertexColors: true });
      extras.add(p); up.push((t) => { p.rotation.y = -t * 0.4; p.material.opacity = 0.5 + 0.5 * Math.abs(Math.sin(t * 1.7)); });
    } else if (f === 'flammen') {
      const p = cloud(80, (i, c) => { c.setHSL(0.02 + Math.random() * 0.1, 1, 0.55); return rndIn(ins[0] * 0.9, ins[1] * 1.3, ins[2] * 0.9); }, { size: 0.2, vertexColors: true, inner: true, opacity: 0.8 });
      extras.add(p);
      up.push((t, dt) => {
        const a = p.geometry.attributes.position, b = p.geometry.userData.base;
        for (let i = 0; i < a.count; i++) { let y = a.getY(i) + dt * (0.35 + (i % 5) * 0.06); if (y > ins[1] * 1.4) y = -ins[1] * 1.4; a.setY(i, y); a.setX(i, b[i * 3] * (1 - (y / (ins[1] * 1.4) + 1) * 0.35) + Math.sin(t * 5 + i) * 0.03); }
        a.needsUpdate = true;
      });
    } else if (f === 'strahlen') {
      const r = billboard('rays', L.clone().lerp(B, 0.5), 5.2, 0.75); r.renderOrder = -1; extras.add(r);
      up.push((t) => { r.material.rotation = t * 0.25; r.material.opacity = 0.32 + 0.12 * Math.sin(t * 1.5); });
    } else if (f === 'schockwelle') {
      const rings = [0, 1, 2].map(() => { const s = billboard('ring', D, 1, 1); extras.add(s); return s; });
      up.push((t) => rings.forEach((s, i) => { const k = ((t * 0.45 + i / 3) % 1); s.scale.setScalar(1.6 + k * 4.2); s.material.opacity = (1 - k) * 0.5; }));
    } else if (f === 'nebel') {
      const p = cloud(110, (i, c) => { c.copy([L, B, D, new THREE.Color('#5ac8ff')][i % 4]); return rndIn(ins[0] * 1.3, ins[1] * 1.2, ins[2] * 1.3); }, { size: 0.42, vertexColors: true, inner: true, opacity: 0.5 });
      const s = cloud(30, () => rndIn(ins[0], ins[1], ins[2]), { size: 0.08, tex: 'star', inner: true });
      extras.add(p, s); up.push((t) => { p.rotation.y = t * 0.25; s.rotation.y = -t * 0.15; });
    } else if (f === 'schweif') {
      const n = 220;
      const p = cloud(n, (i, c) => { c.copy(L).lerp(B, Math.random()); return [0, 0, 0]; }, { size: 0.12, tex: 'star', vertexColors: true });
      const life = Float32Array.from({ length: n }, () => Math.random()), off = Array.from({ length: n }, () => rndIn(1, 1, 1));
      const baseCol = p.geometry.attributes.color.array.slice();
      extras.add(p);
      up.push((t, dt) => {
        const a = p.geometry.attributes.position, col = p.geometry.attributes.color;
        for (let i = 0; i < n; i++) {
          life[i] = (life[i] + dt * 0.28) % 1; const k = life[i];
          a.setXYZ(i, -0.5 - k * 3.4, 0.15 + k * 0.7 + off[i][1] * k * 0.5, off[i][2] * (0.25 + k * 0.6));
          const fade = 1 - k; col.setXYZ(i, baseCol[i * 3] * fade, baseCol[i * 3 + 1] * fade, baseCol[i * 3 + 2] * fade);
        }
        a.needsUpdate = true; col.needsUpdate = true;
      });
    } else if (f === 'polarlicht') {
      up.push((t) => { if (m.map) m.map.offset.x = t * 0.04; });
    } else if (f === 'galaxie') {
      const n = 320;
      const p = cloud(n, (i, c) => {
        const r = Math.pow(Math.random(), 0.7), arm = i % 2 ? Math.PI : 0, a = r * 5.5 + arm + (Math.random() - 0.5) * 0.6;
        c.copy(L).lerp(i % 3 ? B : D, r);
        return [Math.cos(a) * r * size.x * 0.3, (Math.random() - 0.5) * 0.06, Math.sin(a) * r * size.y * 0.3];
      }, { size: 0.09, tex: 'star', vertexColors: true, inner: true });
      const core = billboard('glow', L, 0.55, 0.6); core.renderOrder = 4; core.material.depthTest = false;
      p.rotation.x = Math.PI / 2; extras.add(p, core); up.push((t) => { p.rotation.z = t * 0.5; });
    } else if (f === 'puls') {
      up.push((t) => { const k = t % 1.4, beat = Math.exp(-k * 9) + 0.6 * Math.exp(-Math.max(0, k - 0.28) * 9) * (k > 0.28 ? 1 : 0); mesh.scale.setScalar(1 + beat * 0.05); m.emissiveIntensity = 0.14 + beat * 0.5; });
    } else if (f === 'akkretion') {
      const disk = new THREE.Mesh(new THREE.RingGeometry(0.85, 2.0, 128, 1), new THREE.MeshBasicMaterial({ map: sprite('disk'), transparent: true, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
      disk.rotation.x = -Math.PI / 2 + 0.32;
      const rim = billboard('glow', D, 2.3, 0.85);
      extras.add(rim, disk); up.push((t) => { disk.rotation.z = t * 0.6; });
    } else if (f === 'mysterium') {
      const qs = Array.from({ length: 7 }, (_, i) => { const sp = billboard('q', '#ffffff', 0.4, 0.85); sp.userData.a = (i / 7) * TAU; extras.add(sp); return sp; });
      const smoke = cloud(60, () => { const a = Math.random() * TAU, rr = 0.8 + Math.random() * 0.9; return [Math.cos(a) * rr, (Math.random() - 0.5) * 2, Math.sin(a) * rr]; }, { size: 0.6, color: '#2a1050', additive: false, opacity: 0.45 });
      extras.add(smoke);
      const others = GEMS.filter((g) => g.id !== MYSTERY);
      let nextGlitch = 2, glitchEnd = 0; const flash = new THREE.Color();
      up.push((t) => {
        const hue = (t * 0.12) % 1;
        qs.forEach((sp, i) => {
          const a = sp.userData.a + t * 0.6;
          sp.position.set(Math.cos(a) * 1.55, Math.sin(t * 1.3 + i) * 0.5, Math.sin(a) * 1.55);
          sp.material.color.setHSL((hue + i / 7) % 1, 0.9, 0.7);
          sp.scale.setScalar(0.32 + 0.12 * Math.sin(t * 3 + i));
        });
        smoke.rotation.y = -t * 0.2;
        if (t > nextGlitch) { glitchEnd = t + 0.12 + Math.random() * 0.1; nextGlitch = t + 1.2 + Math.random() * 2; flash.set(others[Math.floor(Math.random() * others.length)].colors[1]); }
        if (t < glitchEnd) {
          mesh.position.set((Math.random() - 0.5) * 0.14, (Math.random() - 0.5) * 0.06, 0);
          mesh.scale.set(1 + Math.random() * 0.12, 1 - Math.random() * 0.08, 1);
          m.emissive.copy(flash); m.emissiveIntensity = 0.9; m.color.copy(flash);
        } else {
          mesh.position.set(0, 0, 0); mesh.scale.set(1, 1, 1);
          m.color.copy(B); m.emissive.setHSL(hue, 0.85, 0.5); m.emissiveIntensity = 0.32 + 0.1 * Math.sin(t * 2);
        }
      });
    } else if (f === 'prismalicht') {
      // Prismaherz: Farbe wandert durch alle Töne, die Form atmet und verzieht sich, ein Regenbogen-Strahlenkranz dreht sich
      m.iridescence = 1; m.iridescenceIOR = 2; m.dispersion = 8;
      const rays = billboard('rays', '#ffffff', 4.2, 0.4); rays.position.z = -0.6; rays.renderOrder = -1; extras.add(rays);
      const sp = cloud(60, (i, c) => { c.setHSL(i / 60, 1, 0.65); const a = Math.random() * TAU, r = 1.3 + Math.random() * 0.4; return [Math.cos(a) * r, (Math.random() - 0.5) * 1.2, Math.sin(a) * r]; }, { size: 0.14, tex: 'star', vertexColors: true });
      extras.add(sp);
      up.push((t) => {
        m.color.setHSL((t * 0.08) % 1, 0.7, 0.75); m.emissive.setHSL((t * 0.08 + 0.5) % 1, 1, 0.5); m.emissiveIntensity = 0.25;
        mesh.scale.set(1 + 0.06 * Math.sin(t * 0.9), 1 + 0.06 * Math.sin(t * 0.9 + 2), 1 + 0.08 * Math.sin(t * 0.7 + 4));
        rays.material.rotation = t * 0.3; rays.material.color.setHSL((t * 0.1) % 1, 1, 0.7); sp.rotation.y = t * 0.5;
      });
    } else if (f === 'perlglanz') {
      m.color.set('#7e727e'); m.roughness = 0.3; m.clearcoat = 0.6; m.iridescence = 0.8; m.iridescenceIOR = 1.5; m.iridescenceThicknessRange = [250, 800];
      m.sheen = 0.4; m.sheenColor = new THREE.Color('#ffc8e8'); m.sheenRoughness = 0.5; m.emissiveIntensity = 0; m.envMapIntensity = 0.5;
      const lustre = billboard('glow', '#ffffff', 0.22, 0.25); lustre.renderOrder = 6; extras.add(lustre);
      const rim = new THREE.Mesh(mesh.geometry, new THREE.MeshBasicMaterial({ color: '#ffe0f4', transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide }));
      rim.scale.setScalar(1.04); rim.material.opacity = 0.08; extras.add(rim);
      up.push((t, dt, cam) => {
        m.iridescenceThicknessRange = [250 + 150 * Math.sin(t * 0.8), 800 + 100 * Math.sin(t * 0.5)];
        m.sheenColor.setHSL(0.9 + 0.08 * Math.sin(t * 0.6), 0.8, 0.85);
        mesh.rotation.y = t * 0.25; mesh.position.y = Math.sin(t * 1.1) * 0.02;
        // Glanzpunkt wandert mit dem Blick über die Perle
        const a = cam ? Math.atan2(cam.position.x, cam.position.z) : 0;
        lustre.position.set(-0.1 + Math.sin(a) * 0.06, -0.53 + mesh.position.y, 0.34); lustre.material.opacity = 0.2 + 0.08 * Math.sin(t * 1.7);
        rim.material.opacity = 0.03 + 0.02 * Math.sin(t * 1.3);
      });
    } else if (f === 'muschel') {
      const shell = scallopShell(); structure.add(shell); up.push((t) => shell.userData.update(t));
    } else if (f === 'mondtraenen') {
      // Mondsichel, Mondstrahl, Sterne und Mondtränen, die in die Muschel fallen und Wellen schlagen
      const moonTex = canvasTex('mondsichel', 256, (x, S) => {
        x.clearRect(0, 0, S, S);
        x.fillStyle = '#eef2ff'; x.beginPath(); x.arc(S * 0.5, S * 0.5, S * 0.3, 0, TAU); x.fill();
        x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.arc(S * 0.66, S * 0.4, S * 0.27, 0, TAU); x.fill();
        x.globalCompositeOperation = 'destination-over';
        const g2 = x.createRadialGradient(S * 0.42, S * 0.56, S * 0.1, S * 0.42, S * 0.56, S * 0.5); g2.addColorStop(0, 'rgba(200,215,255,.35)'); g2.addColorStop(1, 'rgba(200,215,255,0)'); x.fillStyle = g2; x.fillRect(0, 0, S, S);
      });
      const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTex, transparent: true, depthWrite: false })); moon.scale.setScalar(1.3); moon.position.set(0.9, 1.55, -1.2); extras.add(moon);
      const beam = new THREE.Mesh(new THREE.ConeGeometry(0.75, 3, 32, 1, true), new THREE.MeshBasicMaterial({ color: '#cfe0ff', transparent: true, opacity: 0.04, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      beam.position.set(0, 1.2, 0); extras.add(beam);
      const stars = cloud(40, () => [(Math.random() - 0.5) * 3.6, 0.4 + Math.random() * 1.8, -0.8 - Math.random() * 0.6], { size: 0.1, tex: 'star', color: '#e8eeff' }); extras.add(stars);
      const tearGeo = new THREE.SphereGeometry(0.06, 16, 12); tearGeo.scale(1, 1.6, 1); tearGeo.translate(0, 0.04, 0);
      const tearMat = new THREE.MeshPhysicalMaterial({ color: '#dfe8ff', emissive: '#9ab8ff', emissiveIntensity: 0.9, roughness: 0.05, transmission: 0.5, thickness: 0.1 });
      const tears = [0, 1, 2].map((i) => { const tr = new THREE.Mesh(tearGeo, tearMat); tr.userData = { ph: i / 3, x: (i - 1) * 0.28, z: 0.05 + (i % 2) * 0.12 }; extras.add(tr); return tr; });
      const ripples = tears.map(() => { const r = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 48), new THREE.MeshBasicMaterial({ color: '#cfe0ff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); r.rotation.x = -Math.PI / 2; extras.add(r); return r; });
      const splash = cloud(30, () => [0, -99, 0], { size: 0.07, tex: 'star', color: '#e8f0ff' }); extras.add(splash);
      const floorY = -1.01;
      up.push((t) => {
        moon.material.opacity = 0.75 + 0.2 * Math.sin(t * 0.7); beam.material.opacity = 0.03 + 0.02 * Math.sin(t * 0.9);
        stars.material.opacity = 0.5 + 0.5 * Math.abs(Math.sin(t * 1.3));
        tears.forEach((tr, i) => {
          const u = tr.userData, k = (t * 0.3 + u.ph) % 1, fall = Math.min(1, k / 0.55);
          tr.position.set(u.x, 2.2 - fall * fall * (2.2 - floorY), u.z); tr.visible = k < 0.55;
          const rk = k >= 0.55 ? (k - 0.55) / 0.45 : -1, rp = ripples[i];
          if (rk >= 0) { rp.position.set(u.x, floorY + 0.01, u.z); rp.scale.setScalar(0.05 + rk * 0.45); rp.material.opacity = (1 - rk) * 0.7; } else rp.material.opacity = 0;
          if (rk >= 0 && rk < 0.05) { const sa = splash.geometry.attributes.position; for (let j = 0; j < 10; j++) sa.setXYZ((i * 10 + j) % 30, u.x + (Math.random() - 0.5) * 0.2, floorY + Math.random() * 0.25, u.z + (Math.random() - 0.5) * 0.2); sa.needsUpdate = true; }
        });
        const sa = splash.geometry.attributes.position; for (let j = 0; j < sa.count; j++) sa.setY(j, sa.getY(j) + 0.004); sa.needsUpdate = true;
      });
    } else if (f === 'urknall') {
      const core = billboard('glow', '#fff4d0', 1.2, 1); core.renderOrder = 4; core.material.depthTest = false;
      const n = 160, dirs = Array.from({ length: n }, () => v3(...rndIn(1, 1, 1)).normalize());
      const p = cloud(n, (i, c) => { c.setHSL(0.08 + Math.random() * 0.85, 1, 0.7); return [0, 0, 0]; }, { size: 0.12, tex: 'star', vertexColors: true });
      extras.add(core, p);
      up.push((t) => {
        const k = (t * 0.4) % 1, r = Math.pow(k, 0.6) * 2.6, a = p.geometry.attributes.position;
        for (let i = 0; i < n; i++) a.setXYZ(i, dirs[i].x * r, dirs[i].y * r, dirs[i].z * r);
        a.needsUpdate = true; p.material.opacity = 1 - k;
        core.scale.setScalar(0.8 + Math.exp(-k * 6) * 1.6);
      });
    }
  }
  // Lichtblitze: kleine Sterne, die auf zufälligen Kanten aufblitzen (mehr, je seltener der Stein)
  {
    const pos = mesh.geometry.attributes.position, nor = mesh.geometry.attributes.normal;
    const ti = tierById[gem.tier]?.index ?? 3, white = new THREE.Color('#ffffff');
    const place = (sp) => { const k = Math.floor(Math.random() * pos.count); sp.position.set(pos.getX(k) + nor.getX(k) * 0.05, pos.getY(k) + nor.getY(k) * 0.05, pos.getZ(k) + nor.getZ(k) * 0.05); };
    const gl = Array.from({ length: 4 + ti }, (_, i) => {
      const sp = billboard('star', i % 3 === 0 ? L : white, 0.001, 1);
      sp.userData = { ph: Math.random() * 4, dur: 1.3 + Math.random() * 1.6, size: 0.3 + Math.random() * 0.35, k: 0 };
      place(sp); extras.add(sp); return sp;
    });
    up.push((t) => {
      for (const sp of gl) {
        const u = sp.userData, k = ((t + u.ph) / u.dur) % 1;
        if (k < u.k) place(sp);
        u.k = k;
        const a = k < 0.45 ? Math.pow(Math.sin(Math.PI * k / 0.45), 3) : 0;
        sp.scale.setScalar(0.001 + a * u.size); sp.material.rotation = t * 1.4 + u.ph;
      }
    });
  }
  return { group, mesh, extras, structure, update: (t, dt, cam) => up.forEach((u) => u(t, dt, cam)) };
}

// ── Hintergrund (Juwelnebel) ───────────────────────────────────────────────
function nebulaTexture(w = 1024, h = 768, tint = '#7b6cff') {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const x = cv.getContext('2d');
  const bg = x.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#120e1e'); bg.addColorStop(1, '#07060c');
  x.fillStyle = bg; x.fillRect(0, 0, w, h);
  const blob = (cx, cy, r, col, a) => { const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, col + a); g.addColorStop(1, col + '00'); x.fillStyle = g; x.fillRect(0, 0, w, h); };
  blob(w * 0.25, h * 0.3, w * 0.5, '#5a2a9a', '66');
  blob(w * 0.8, h * 0.2, w * 0.4, '#1a6a8a', '55');
  blob(w * 0.6, h * 0.9, w * 0.55, tint.slice(0, 7), '44');
  blob(w * 0.5, h * 0.55, w * 0.25, '#d9b26a', '22');
  const rnd = seeded(7);
  for (let i = 0; i < 380; i++) { x.fillStyle = `rgba(255,255,255,${0.25 + rnd() * 0.6})`; x.beginPath(); x.arc(rnd() * w, rnd() * h, rnd() * 1.4 + 0.2, 0, 7); x.fill(); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ── Juice: Partikel, Einmal-Effekte, Ton ───────────────────────────────────
class Burst {
  constructor(n = 700) {
    this.n = n; this.i = 0;
    this.pos = new Float32Array(n * 3); this.col = new Float32Array(n * 3); this.base = new Float32Array(n * 3);
    this.vel = new Float32Array(n * 3); this.life = new Float32Array(n); this.max = new Float32Array(n);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.points = new THREE.Points(g, new THREE.PointsMaterial({ map: sprite('star'), size: 0.17, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.points.frustumCulled = false; this.points.renderOrder = 6;
  }
  spawn(count, origin, colors, speed = 3, lift = 0.8) {
    for (let k = 0; k < count; k++) {
      const i = this.i++ % this.n, d = v3(...rndIn(1, 1, 1)).normalize(), sp = speed * (0.35 + Math.random() * 0.8);
      this.pos.set([origin.x, origin.y, origin.z], i * 3);
      this.vel.set([d.x * sp, d.y * sp + lift, d.z * sp], i * 3);
      this.life[i] = this.max[i] = 0.7 + Math.random() * 1.0;
      colors[Math.floor(Math.random() * colors.length)].toArray(this.base, i * 3);
    }
  }
  update(dt) {
    const drag = Math.exp(-dt * 1.9);
    for (let i = 0; i < this.n; i++) {
      const o = i * 3;
      if (this.life[i] <= 0) { this.col[o] = this.col[o + 1] = this.col[o + 2] = 0; continue; }
      this.life[i] -= dt;
      this.vel[o] *= drag; this.vel[o + 1] = this.vel[o + 1] * drag - 2.4 * dt; this.vel[o + 2] *= drag;
      this.pos[o] += this.vel[o] * dt; this.pos[o + 1] += this.vel[o + 1] * dt; this.pos[o + 2] += this.vel[o + 2] * dt;
      const f = Math.max(0, this.life[i] / this.max[i]), tw = 0.7 + 0.3 * Math.sin(i + this.life[i] * 30);
      this.col[o] = this.base[o] * f * tw; this.col[o + 1] = this.base[o + 1] * f * tw; this.col[o + 2] = this.base[o + 2] * f * tw;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.color.needsUpdate = true;
  }
}

let userActed = false;
const Sound = {
  ctx: null, master: null,
  on: (() => { try { return localStorage.getItem('schleiferei-ton') !== 'aus'; } catch (e) { return true; } })(),
  ensure() {
    if (!this.on || !userActed) return null;
    try {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.master = this.ctx.createGain(); this.master.gain.value = 0.32; this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return this.ctx;
    } catch (e) { return null; }
  },
  tone(f, delay, dur, type = 'sine', g = 0.2) {
    const c = this.ensure(); if (!c) return;
    const t0 = c.currentTime + delay, o = c.createOscillator(), a = c.createGain();
    o.type = type; o.frequency.value = f;
    a.gain.setValueAtTime(0.0001, t0); a.gain.exponentialRampToValueAtTime(g, t0 + 0.012); a.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(a).connect(this.master); o.start(t0); o.stop(t0 + dur + 0.05);
  },
  chime(ti) {
    const base = 392 * Math.pow(2, ti / 10), steps = [0, 4, 7, 12, 16, 19, 24, 28], n = 3 + Math.floor(ti / 2);
    for (let i = 0; i < n; i++) {
      const f = base * Math.pow(2, steps[i % steps.length] / 12);
      this.tone(f, i * 0.07, 1.1 + ti * 0.12, 'sine', 0.15);
      this.tone(f * 2.005, i * 0.07, 0.5, 'triangle', 0.035);
    }
    if (ti >= 7) { this.tone(base * 4, n * 0.07 + 0.06, 1.8, 'sine', 0.05); this.tone(base * 6, n * 0.07 + 0.12, 1.4, 'sine', 0.03); }
  },
  tick(ti, combo = 1) {
    const f = 1150 * Math.pow(2, (Math.min(combo, 16) - 1) / 12) * (1 + ti * 0.015);
    this.tone(f, 0, 0.14, 'triangle', 0.11); this.tone(f * 1.5, 0.025, 0.12, 'sine', 0.05);
  },
  whoosh(dur) {
    const c = this.ensure(); if (!c) return;
    const len = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain(), t0 = c.currentTime;
    src.buffer = buf; bp.type = 'bandpass'; bp.Q.value = 1.4;
    bp.frequency.setValueAtTime(250, t0); bp.frequency.exponentialRampToValueAtTime(3200, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.16, t0 + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(bp).connect(g).connect(this.master); src.start(t0);
  },
};


const elasticOut = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * (TAU / 3)) + 1);
const VIOLET = [new THREE.Color('#b450ff'), new THREE.Color('#e8d8ff'), new THREE.Color('#6a3ab0')];


// Fundliste (bleibt im Browser)
const finds = (() => { try { return JSON.parse(localStorage.getItem('schleiferei-funde') || '[]'); } catch (e) { return []; } })();
let newFind = false;
function logFind(gem, wt, val, muts = []) {
  finds.unshift({ id: gem.id, g: wt.grams, w: wt.cls.id, v: val, m: muts.map((m) => (m.inc ? `einschluss:${m.inc.id}` : m.id)) });
  finds.length = Math.min(finds.length, 50);
  try { localStorage.setItem('schleiferei-funde', JSON.stringify(finds)); } catch (e) { /* egal */ }
  newFind = true;
}

const fmtNum = (v) => v >= 1e9 ? `${(v / 1e9).toLocaleString('de-DE', { maximumFractionDigits: 2 })} Mrd.` : v >= 1e6 ? `${(v / 1e6).toLocaleString('de-DE', { maximumFractionDigits: 2 })} Mio.` : nf.format(Math.round(v));
function bumpEl(el) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
function countUp(el, target, suffix) {
  if (!target) { el.textContent = '?' + suffix; bumpEl(el); return; }
  const t0 = performance.now(), dur = 900;
  const step = (now) => {
    const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
    el.textContent = fmtNum(target * e) + suffix;
    if (k < 1) requestAnimationFrame(step); else bumpEl(el);
  };
  requestAnimationFrame(step);
}
function revealInto(el, gem, { weight = null, keep = false, muts = [] } = {}) {
  const t = tierById[gem.tier];
  el.style.setProperty('--tc', t.color); el.textContent = '';
  const add = (cls, txt) => { const s = document.createElement('span'); s.className = cls; s.textContent = txt; el.appendChild(s); };
  add('r-tier', t.name); add('r-name', gem.name);
  if (weight) { add('r-weight', `${fmtGrams(weight.grams)} · ${weight.cls.name}`); el.style.setProperty('--wc', weight.cls.color); }
  if (muts.length) { add('r-mut', muts.map((m) => `${m.name} ×${m.mult.toLocaleString('de-DE')}`).join(' + ')); el.style.setProperty('--mc', muts[muts.length - 1].color); }
  else if (gem.isNew && gem.id !== MYSTERY) add('r-new', 'NEU ENTDECKT');
  el.classList.remove('play'); el.style.opacity = '';
  void el.offsetWidth;
  if (keep && !reduceMotion) { el.style.opacity = '1'; el.animate([{ opacity: 0, transform: 'scale(1.6)', filter: 'blur(10px)' }, { opacity: 1, transform: 'scale(.95)', filter: 'blur(0)', offset: 0.6 }, { opacity: 1, transform: 'none' }], { duration: 600, easing: 'cubic-bezier(.2,.9,.2,1)' }); }
  else if (keep) el.style.opacity = '1';
  else el.classList.add('play');
}

// Ein Kristall aus dem ?-Stein, nach der eigenen Chance jedes Kristalls
function rollGem() {
  const pool = GEMS.filter((g) => g.id !== MYSTERY);
  let roll = Math.random() * pool.reduce((sum, g) => sum + g.chance, 0);
  return pool.find((g) => (roll -= g.chance) <= 0) || pool[0];
}

// Jede Mutation hat ihren eigenen Klang
const MUT_SOUND = {
  rissig: () => { Sound.whoosh(0.15); Sound.tone(70, 0, 0.4, 'sawtooth', 0.12); Sound.tone(140, 0.05, 0.25, 'square', 0.04); },
  glaenzend: () => [0, 0.06, 0.12, 0.18].forEach((d, i) => Sound.tone(1800 + i * 400, d, 0.5, 'sine', 0.05)),
  einschluss: () => [262, 330, 392].forEach((f, i) => Sound.tone(f, i * 0.05, 1.2, 'triangle', 0.08)),
  magmakern: () => { Sound.tone(50, 0, 1.2, 'sawtooth', 0.12); Sound.whoosh(0.8); Sound.tone(90, 0.2, 0.8, 'triangle', 0.1); },
  giftkristall: () => { Sound.tone(220, 0, 0.5, 'sine', 0.08); Sound.tone(233, 0.05, 0.5, 'sine', 0.08); Sound.whoosh(0.4); },
  eisherz: () => { [2637, 3136, 3520].forEach((f, i) => Sound.tone(f, i * 0.07, 0.8, 'sine', 0.05)); Sound.tone(110, 0, 1, 'sine', 0.1); },
  blitzkristall: () => { Sound.whoosh(0.12); Sound.tone(80, 0, 0.9, 'sawtooth', 0.18); Sound.tone(1600, 0, 0.15, 'square', 0.04); },
  bluetenkristall: () => [523, 659, 784, 1047].forEach((f, i) => Sound.tone(f, i * 0.08, 0.9, 'sine', 0.07)),
  regenbogen: () => [523, 587, 659, 698, 784, 880, 988].forEach((f, i) => Sound.tone(f, i * 0.06, 0.6, 'sine', 0.07)),
  gigant: () => { Sound.tone(45, 0, 1.2, 'sine', 0.35); Sound.tone(60, 0.05, 1, 'triangle', 0.2); Sound.whoosh(0.6); },
  phoenix: () => { [440, 554, 659, 880, 1109].forEach((f, i) => Sound.tone(f, i * 0.07, 1, 'sawtooth', 0.04)); Sound.whoosh(0.9); },
  dimensionsriss: () => { Sound.tone(36, 0, 1.6, 'sawtooth', 0.15); Sound.tone(37.5, 0, 1.6, 'sawtooth', 0.15); [1760, 2349].forEach((f, i) => Sound.tone(f, 0.3 + i * 0.1, 0.8, 'sine', 0.04)); },
};

function freeDispose(obj) { obj.traverse((o) => { if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach((m) => m.dispose()); }); }

function crackTexture(width = 4) {
  return canvasTex('risse' + width, 512, (x, S) => {
    x.fillStyle = '#000'; x.fillRect(0, 0, S, S);
    const rnd = seeded(31);
    x.strokeStyle = '#fff'; x.shadowColor = '#fff'; x.shadowBlur = 6; x.lineCap = 'round';
    const crack = (px, py, ang, len, w, depth) => {
      x.lineWidth = w; x.beginPath(); x.moveTo(px, py);
      for (let i = 0; i < 8; i++) { ang += (rnd() - 0.5) * 0.9; px += Math.cos(ang) * len / 8; py += Math.sin(ang) * len / 8; x.lineTo(px, py); if (depth < 2 && rnd() < 0.25) { x.stroke(); crack(px, py, ang + (rnd() - 0.5) * 2, len * 0.5, w * 0.6, depth + 1); x.beginPath(); x.moveTo(px, py); x.lineWidth = w; } }
      x.stroke();
    };
    for (let i = 0; i < 9; i++) crack(S / 2 + (rnd() - 0.5) * 80, S / 2 + (rnd() - 0.5) * 120, rnd() * TAU, 160 + rnd() * 140, width, 0);
  });
}

// Mutationen werden beim Öffnen verdeckt gewürfelt
function rollMutations() {
  const out = [];
  for (let r = 0; r < MUT_ROLLS && out.length < MUT_MAX; r++) {
    let roll = Math.random() * 100;
    for (const m of POLISH_MUTATIONS.filter((x) => !out.some((y) => y.id === x.id))) { roll -= m.chance * MUT_ROLL; if (roll <= 0) { out.push(makeMut(m.id)); break; } }
  }
  return out;
}

// Sichtbare Effekte jeder Mutation am Kristall
function stripeTexture() {
  return canvasTex('katzenauge', 256, (x, S) => {
    x.fillStyle = '#000'; x.fillRect(0, 0, S, S);
    const g = x.createLinearGradient(S * 0.36, 0, S * 0.64, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.42, 'rgba(255,255,255,.7)'); g.addColorStop(0.5, 'rgba(255,255,255,1)'); g.addColorStop(0.58, 'rgba(255,255,255,.7)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, S, S);
  });
}
function silkTexture() {
  return canvasTex('seide', 256, (x, S) => {
    x.fillStyle = '#000'; x.fillRect(0, 0, S, S);
    const rnd = seeded(41);
    for (let i = 0; i < 160; i++) { x.strokeStyle = `rgba(255,255,255,${0.15 + rnd() * 0.35})`; x.lineWidth = 0.6 + rnd(); const xx = rnd() * S; x.beginPath(); x.moveTo(xx, 0); x.lineTo(xx + (rnd() - 0.5) * 12, S); x.stroke(); }
  });
}
// Was im Bernstein eingeschlossen ist. Alle Modelle schauen nach +z (zur Kamera), Größe etwa ±0,16.
function buildInclusion(inc) {
  const g = new THREE.Group(), rnd = seeded(INCLUSIONS.indexOf(inc) + 7);
  const M = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, depthTest: false, emissive: new THREE.Color(c).multiplyScalar(0.12), envMapIntensity: 0.6, ...o });
  const P = (geo, mat, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, parent = g) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.renderOrder = 7; parent.add(m); return m; };
  const sph = (r, w = 16, h = 12) => new THREE.SphereGeometry(r, w, h);
  const limb = (mat, from, to, r1, r2, parent = g) => { const d = to.clone().sub(from), m = new THREE.Mesh(new THREE.CylinderGeometry(r2, r1, d.length(), 6), mat); m.position.copy(from).add(to).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(v3(0, 1, 0), d.normalize()); m.renderOrder = 7; parent.add(m); return m; };
  let update = () => {};
  switch (inc.id) {
    case 'dreck': {
      const browns = ['#6a5034', '#4a3622', '#7a5e3e', '#3a2a1a'].map((c) => M(c, { roughness: 1, flatShading: true }));
      for (let i = 0; i < 14; i++) { const r = 0.025 + rnd() * 0.045; P(new THREE.DodecahedronGeometry(r, 0), browns[i % 4], (rnd() - 0.5) * 0.2, (rnd() - 0.5) * 0.13, (rnd() - 0.5) * 0.06).rotation.set(rnd() * 3, rnd() * 3, 0); }
      const pebble = M('#8a8690', { roughness: 0.8 }); for (let i = 0; i < 4; i++) P(sph(0.014 + rnd() * 0.01, 10, 8), pebble, (rnd() - 0.5) * 0.22, (rnd() - 0.5) * 0.15, 0.04, 1, 0.8, 0.8);
      const root = M('#c8b088', { roughness: 0.9 });
      for (let i = 0; i < 3; i++) { const pts = Array.from({ length: 6 }, (_, k) => v3(-0.05 + i * 0.04 + Math.sin(k + i) * 0.02, 0.06 + k * 0.025, 0.03)); P(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.003, 4), root); }
      const wormPts = Array.from({ length: 9 }, (_, k) => v3(-0.13 + k * 0.032, -0.02 + Math.sin(k * 1.3) * 0.025, 0.05));
      const wormMat = M('#d88a8a', { roughness: 0.35, emissive: '#5a2020', emissiveIntensity: 0.3 });
      const worm = P(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(wormPts), 40, 0.011, 8), wormMat);
      P(sph(0.011), wormMat, wormPts[8].x, wormPts[8].y, 0.05);
      update = (t) => { worm.position.y = Math.sin(t * 2) * 0.006; worm.rotation.z = Math.sin(t * 1.5) * 0.05; };
      break;
    }
    case 'kronkorken': {
      const top = canvasTex('kronkorken-deckel', 256, (x, S) => {
        const c = S / 2; x.fillStyle = '#c8202a'; x.fillRect(0, 0, S, S);
        x.strokeStyle = '#fff'; x.lineWidth = 10; x.beginPath(); x.arc(c, c, S * 0.36, 0, TAU); x.stroke();
        x.fillStyle = '#fff'; x.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? S * 0.1 : S * 0.22; x.lineTo(c + Math.cos(a) * r, c - S * 0.04 + Math.sin(a) * r); } x.fill();
        x.font = `800 ${S * 0.11}px system-ui, sans-serif`; x.textAlign = 'center'; x.fillText('ZISCH', c, c + S * 0.27);
      });
      const geo = new THREE.CylinderGeometry(0.13, 0.13, 0.035, 48, 2), p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z); if (r > 0.12) { const a = Math.atan2(z, x), k = 1 + 0.075 * Math.sign(Math.sin(a * 21)); p.setX(i, x * k); p.setZ(i, z * k); if (p.getY(i) < 0) p.setY(i, p.getY(i) - 0.012); } }
      geo.computeVertexNormals();
      const side = M('#d8d8e0', { metalness: 0.9, roughness: 0.25 }), face = new THREE.MeshStandardMaterial({ map: top, metalness: 0.1, roughness: 0.75, depthTest: false, color: '#b8b0b0', envMapIntensity: 0.25 });
      const cap = P(geo, [side, face, side]); cap.rotation.x = Math.PI / 2 - 0.25;
      update = (t) => { cap.rotation.z = Math.sin(t * 0.8) * 0.2; cap.rotation.x = Math.PI / 2 - 0.25 + Math.sin(t * 0.6) * 0.1; };
      break;
    }
    case 'schraube': {
      const rust = M('#8a4a20', { metalness: 0.5, roughness: 0.85 }), rust2 = M('#c0703a', { metalness: 0.4, roughness: 0.8 }), dark = M('#2a1408');
      const s2 = new THREE.Group(); g.add(s2);
      P(new THREE.CylinderGeometry(0.022, 0.012, 0.26, 14), rust, 0, -0.02, 0, 1, 1, 1, s2);
      P(new THREE.ConeGeometry(0.012, 0.03, 10), rust, 0, -0.165, 0, 1, -1, 1, s2);
      P(new THREE.CylinderGeometry(0.055, 0.05, 0.026, 24), rust2, 0, 0.12, 0, 1, 1, 1, s2);
      P(new THREE.BoxGeometry(0.08, 0.01, 0.014), dark, 0, 0.134, 0, 1, 1, 1, s2); P(new THREE.BoxGeometry(0.014, 0.01, 0.08), dark, 0, 0.134, 0, 1, 1, 1, s2);
      const helix = new THREE.CatmullRomCurve3(Array.from({ length: 90 }, (_, i) => { const k = i / 89, r = 0.022 - k * 0.01; return v3(Math.cos(i * 0.62) * r, 0.1 - k * 0.25, Math.sin(i * 0.62) * r); }));
      P(new THREE.TubeGeometry(helix, 220, 0.0065, 5), rust2, 0, 0, 0, 1, 1, 1, s2);
      for (let i = 0; i < 6; i++) P(sph(0.008, 6, 5), M('#d08040', { roughness: 1 }), (rnd() - 0.5) * 0.04, -0.12 + rnd() * 0.2, 0.02, 1, 1, 0.5, s2);
      s2.rotation.set(0.5, 0, 0.75); s2.scale.setScalar(1.35);
      update = (t) => { s2.rotation.y = t * 0.5; };
      break;
    }
    case 'blatt': {
      const tex = canvasTex('blatt', 256, (x, S) => {
        const g2 = x.createLinearGradient(0, 0, S, S); g2.addColorStop(0, '#5a8a20'); g2.addColorStop(0.6, '#3e6a18'); g2.addColorStop(1, '#8a5a18'); x.fillStyle = g2; x.fillRect(0, 0, S, S);
        x.strokeStyle = 'rgba(230,240,180,.85)'; x.lineWidth = 5; x.beginPath(); x.moveTo(S / 2, S); x.lineTo(S / 2, 0); x.stroke();
        x.lineWidth = 2.5; for (let i = 0; i < 8; i++) for (const sd of [-1, 1]) { const y = S * (0.88 - i * 0.1); x.beginPath(); x.moveTo(S / 2, y); x.quadraticCurveTo(S / 2 + sd * S * 0.18, y - S * 0.06, S / 2 + sd * S * 0.4, y - S * 0.14); x.stroke(); }
        x.fillStyle = 'rgba(90,60,20,.35)'; const r = seeded(4); for (let i = 0; i < 12; i++) { x.beginPath(); x.arc(r() * S, r() * S, 3 + r() * 8, 0, TAU); x.fill(); }
      });
      const sh = new THREE.Shape(); sh.moveTo(0, -0.16); sh.bezierCurveTo(0.13, -0.09, 0.12, 0.09, 0, 0.17); sh.bezierCurveTo(-0.12, 0.09, -0.13, -0.09, 0, -0.16);
      const geo = new THREE.ShapeGeometry(sh, 24); planarUV(geo, 'xy');
      const leaf = P(geo, new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.8, depthTest: false, emissive: '#1a2a08', emissiveIntensity: 0.1, envMapIntensity: 0.3 }));
      P(new THREE.CylinderGeometry(0.004, 0.006, 0.08, 6), M('#6a5a2a'), 0, -0.2, 0);
      update = (t) => { leaf.rotation.y = Math.sin(t * 0.8) * 0.35; leaf.rotation.z = Math.sin(t * 0.6) * 0.1; };
      break;
    }
    case 'fliege': {
      // von oben gesehen: Kopf oben, Flügel zur Seite
      const chit = (c, e) => M(c, { roughness: 0.3, metalness: 0.25, emissive: e || '#000000', emissiveIntensity: 0.35 });
      const dark = chit('#2a1a0c', '#140a04'), band = chit('#a86a28', '#3a2008'), eyeM = chit('#c41818', '#6a0808');
      P(sph(0.042), dark, 0, 0.02, 0, 1.1, 1.2, 0.8);
      P(sph(0.032), dark, 0, 0.08, 0.005);
      P(sph(0.019), eyeM, 0.026, 0.088, 0.01); P(sph(0.019), eyeM, -0.026, 0.088, 0.01);
      [0, 1, 2, 3].forEach((i) => P(sph(0.038 - i * 0.006), i % 2 ? band : dark, 0, -0.035 - i * 0.03, 0, 1, 0.75, 0.7));
      for (const sd of [-1, 1]) for (const y of [0.04, 0.015, -0.01]) { const a = v3(sd * 0.03, y, -0.01), b = v3(sd * 0.075, y + (y - 0.015) * 0.6, -0.02), c = v3(sd * 0.1, y - 0.03, -0.025); limb(dark, a, b, 0.004, 0.003); limb(dark, b, c, 0.003, 0.002); }
      const wingMat = new THREE.MeshBasicMaterial({ map: wingTexture(), transparent: true, opacity: 0.9, depthTest: false, side: THREE.DoubleSide });
      const wings = [-1, 1].map((sd) => { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.075, 0.17), wingMat); w.geometry.translate(0, -0.085, 0); w.position.set(sd * 0.025, 0.035, 0.03); w.rotation.z = sd * 0.55; w.renderOrder = 8; g.add(w); return w; });
      update = (t) => { const tw = (t % 3.1) < 0.3 ? Math.sin((t % 3.1) * 70) * 0.18 : 0; wings.forEach((w, i) => { w.rotation.z = (i ? 1 : -1) * (0.55 + tw); }); };
      break;
    }
    case 'spinne': {
      const body = M('#2a120a', { roughness: 0.3, metalness: 0.2 }), leg = M('#1e0e08', { roughness: 0.4 }), red = M('#e03a1a', { emissive: '#801808', emissiveIntensity: 0.6 });
      P(sph(0.06), body, 0, -0.05, 0, 1, 1.15, 0.7);
      P(sph(0.016), red, 0, -0.035, 0.04, 1, 0.7, 0.4); P(sph(0.016), red, 0, -0.07, 0.04, 1, 0.7, 0.4);
      P(sph(0.04), body, 0, 0.035, 0, 1, 1, 0.7);
      const eye = M('#ff4020', { emissive: '#ff2010', emissiveIntensity: 0.9 }); [[-0.012, 0.065], [0.012, 0.065], [-0.022, 0.058], [0.022, 0.058]].forEach(([x, y]) => P(sph(0.007), eye, x, y, 0.025));
      const legs = [];
      for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) {
        const lg = new THREE.Group(); lg.position.set(sd * 0.03, 0.05 - i * 0.022, 0); g.add(lg);
        const ang = (0.9 - i * 0.55), knee = v3(sd * Math.cos(ang) * 0.08, Math.sin(ang) * 0.08, 0.02), foot = v3(sd * Math.cos(ang - 0.5) * 0.15, Math.sin(ang - 0.5) * 0.15 - 0.03, -0.02);
        limb(leg, v3(0, 0, 0), knee, 0.006, 0.005, lg); limb(leg, knee, foot, 0.005, 0.002, lg); legs.push(lg);
      }
      update = (t) => { const tw = (t % 2.7) < 0.45; legs.forEach((l, i) => { l.rotation.z = tw ? Math.sin(t * 40 + i) * 0.1 : Math.sin(t + i) * 0.02; }); };
      break;
    }
    case 'ammonit': {
      const shell = new THREE.MeshPhysicalMaterial({ color: '#c89a60', roughness: 0.35, iridescence: 0.7, iridescenceIOR: 1.6, emissive: '#3a2810', emissiveIntensity: 0.12, envMapIntensity: 0.6, depthTest: false });
      const rib = new THREE.MeshPhysicalMaterial({ color: '#6a4220', roughness: 0.4, iridescence: 0.5, emissive: '#1a0c04', emissiveIntensity: 0.1, envMapIntensity: 0.5, depthTest: false });
      for (let i = 0; i < 90; i++) { const th = i * 0.26, r = 0.007 * Math.exp(0.088 * th), s3 = r * 0.6; P(sph(s3, 12, 8), i % 3 === 0 ? rib : shell, Math.cos(th) * r, Math.sin(th) * r, 0, 1, 1, 0.7); }
      P(sph(0.012), rib, 0, 0, 0.004); g.scale.setScalar(1.8);
      update = (t) => { shell.iridescenceThicknessRange = [150 + 250 * (Math.sin(t) + 1) / 2, 800]; g.rotation.z = t * 0.15; };
      break;
    }
    case 'trilobit': {
      const stone = M('#5e5868', { roughness: 0.6, metalness: 0.1 }), axial = M('#36323e', { roughness: 0.5 }), eyeM = M('#e8d8a0', { emissive: '#6a5a20', emissiveIntensity: 0.5 });
      P(sph(0.075, 24, 12), stone, 0, 0.1, 0, 1.25, 0.7, 0.4);
      P(sph(0.03), axial, 0, 0.11, 0.02, 0.9, 1.1, 0.6);
      P(sph(0.013), eyeM, 0.045, 0.105, 0.02, 1.4, 0.8, 0.6); P(sph(0.013), eyeM, -0.045, 0.105, 0.02, 1.4, 0.8, 0.6);
      const segs = Array.from({ length: 9 }, (_, i) => {
        const sg = new THREE.Group(); sg.position.y = 0.055 - i * 0.021; g.add(sg);
        const w = 0.085 - i * 0.004;
        P(sph(0.016, 12, 8), axial, 0, 0, 0.018, 1.2, 0.6, 0.8, sg);
        for (const sd of [-1, 1]) P(sph(0.02, 12, 8), stone, sd * w * 0.55, 0, 0, w / 0.04, 0.45, 0.4, sg);
        return sg;
      });
      P(sph(0.045, 18, 10), stone, 0, -0.15, 0, 1.15, 0.55, 0.35);
      update = (t) => { segs.forEach((sg, i) => { sg.rotation.z = Math.sin(t * 2 - i * 0.5) * 0.04; sg.position.z = Math.sin(t * 2 - i * 0.6) * 0.004; }); };
      break;
    }
    case 'dinoei': {
      const tex = canvasTex('dinoei', 256, (x, S) => { x.fillStyle = '#ecdcb4'; x.fillRect(0, 0, S, S); const r = seeded(3); for (let i = 0; i < 300; i++) { x.fillStyle = r() < 0.6 ? 'rgba(120,80,40,.6)' : 'rgba(80,110,70,.45)'; x.beginPath(); x.arc(r() * S, r() * S, 1 + r() * 6, 0, TAU); x.fill(); } });
      const eggMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, emissive: '#ff7a1a', emissiveMap: crackTexture(5), emissiveIntensity: 0.6, depthTest: false });
      const egg = P(sph(0.12, 32, 24), eggMat, 0, -0.02, 0, 1, 1.3, 1);
      // ein kleiner Saurier schaut oben aus der Schale
      const skin = M('#5aa04a', { roughness: 0.45, emissive: '#1a3a10', emissiveIntensity: 0.4 });
      const head = new THREE.Group(); head.position.set(0.02, 0.13, 0.03); head.scale.setScalar(1.45); g.add(head);
      P(sph(0.04), skin, 0, 0, 0, 1, 0.9, 0.9, head);
      P(sph(0.03), skin, 0.035, -0.008, 0.012, 1.4, 0.7, 0.8, head);
      P(sph(0.011), M('#ffffff', { roughness: 0.2 }), 0.01, 0.018, 0.03, 1, 1, 1, head); P(sph(0.006), M('#101010'), 0.014, 0.019, 0.04, 1, 1, 1, head);
      for (let i = 0; i < 3; i++) P(new THREE.ConeGeometry(0.008, 0.02, 5), M('#3a7a30'), -0.015 + i * 0.012, 0.035, -0.01, 1, 1, 1, head);
      const shellBits = M('#ecdcb4', { roughness: 0.6 }); for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI - 0.2; P(new THREE.TetrahedronGeometry(0.02), shellBits, Math.cos(a) * 0.07, 0.12 + Math.sin(a) * 0.02, 0.01).rotation.set(rnd() * 3, rnd() * 3, 0); }
      const glow = billboard('glow', '#ff8a3d', 0.55, 0.6); glow.material.depthTest = false; glow.renderOrder = 6; g.add(glow);
      update = (t) => {
        const ph = t % 1.2, beat = Math.exp(-ph * 8) + (ph > 0.25 ? 0.5 * Math.exp(-(ph - 0.25) * 8) : 0);
        egg.scale.set(1 + beat * 0.04, 1.3 + beat * 0.05, 1 + beat * 0.04); eggMat.emissiveIntensity = 0.4 + beat * 1.2; glow.material.opacity = 0.3 + beat * 0.5;
        const peek = Math.max(0, Math.sin(t * 0.9)); head.position.y = 0.09 + peek * 0.05; head.rotation.z = Math.sin(t * 2) * 0.15;
      };
      break;
    }
  }
  // durchsichtig markieren, damit der Einschluss nach dem Bernstein gezeichnet wird (sonst verdeckt ihn der Bernstein)
  g.traverse((o) => { if (o.material) [].concat(o.material).forEach((m) => { m.transparent = true; m.depthTest = false; }); if (o.isMesh || o.isSprite) o.renderOrder = Math.max(o.renderOrder, 7); });
  g.userData.update = update;
  return g;
}
// Teilt eine (nicht indizierte) Geometrie in Scherben: jedes Dreieck gehört zur nächsten Richtung von k Zufallsrichtungen
function splitShards(geo, ctr, k) {
  const p = geo.attributes.position, names = ['position', 'normal', 'color', 'uv'].filter((n) => geo.attributes[n]);
  const seeds = Array.from({ length: k }, () => v3(...rndIn(1, 1, 1)).normalize());
  const buckets = seeds.map(() => Object.fromEntries(names.map((n) => [n, []])));
  const c = v3();
  for (let f = 0; f < p.count; f += 3) {
    c.set(0, 0, 0); for (let j = 0; j < 3; j++) c.add(v3(p.getX(f + j), p.getY(f + j), p.getZ(f + j)));
    c.divideScalar(3).sub(ctr).normalize();
    let best = 0, bd = -2; seeds.forEach((sd, i) => { const d = sd.dot(c); if (d > bd) { bd = d; best = i; } });
    for (let j = 0; j < 3; j++) for (const n of names) { const at = geo.attributes[n]; for (let q = 0; q < at.itemSize; q++) buckets[best][n].push(at.array[(f + j) * at.itemSize + q]); }
  }
  return buckets.map((bk, i) => {
    if (!bk.position.length) return null;
    const g = new THREE.BufferGeometry();
    for (const n of names) g.setAttribute(n, new THREE.Float32BufferAttribute(bk[n], geo.attributes[n].itemSize));
    g.userData.dir = seeds[i]; return g;
  }).filter(Boolean);
}
// Insektenflügel mit Adern
function wingTexture() {
  return canvasTex('fluegel', 128, (x, S) => {
    x.clearRect(0, 0, S, S);
    x.fillStyle = 'rgba(225,235,255,.38)'; x.beginPath(); x.ellipse(S / 2, S / 2, S * 0.42, S * 0.48, 0, 0, TAU); x.fill();
    x.strokeStyle = 'rgba(70,55,40,.75)'; x.lineWidth = 1.6;
    x.beginPath(); x.ellipse(S / 2, S / 2, S * 0.42, S * 0.48, 0, 0, TAU); x.stroke();
    x.lineWidth = 1.1;
    for (let i = 0; i < 6; i++) { const a = -0.6 + i * 0.24; x.beginPath(); x.moveTo(S / 2, S * 0.04); x.quadraticCurveTo(S / 2 + Math.sin(a) * S * 0.3, S * 0.5, S / 2 + Math.sin(a) * S * 0.4, S * 0.92); x.stroke(); }
    for (let i = 0; i < 5; i++) { const y = S * (0.25 + i * 0.14); x.beginPath(); x.moveTo(S * 0.15, y); x.lineTo(S * 0.85, y + 4); x.stroke(); }
  });
}
function applyMutFx(o, mut) {
  const g = o.mutGroup, mesh = o.crystal.mesh, gem = o.gem, add = (x) => { g.add(x); return x; };
  mesh.geometry.computeBoundingBox();
  const bb = mesh.geometry.boundingBox, size = bb.getSize(v3()), ctr = bb.getCenter(v3()), R = Math.max(size.x, size.y, size.z) / 2;
  const mod = (fn) => o.mutMods.push(fn);
  const ups = (fn) => o.mutUp.push(fn);
  const az = (cam) => (cam ? Math.atan2(cam.position.x, cam.position.z) : 0);
  const overlay = (tex, color, opacity = 1, { blending = THREE.AdditiveBlending, alpha = false, scale = 1.012, side = THREE.FrontSide } = {}) => {
    const geo = mesh.geometry.clone(); planarUV(geo, 'xy');
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending, side });
    if (alpha) mat.alphaMap = tex; else if (tex) mat.map = tex;
    const ov = new THREE.Mesh(geo, mat); ov.scale.setScalar(scale); ov.renderOrder = 4; return add(ov);
  };
  const surfacePoints = (n) => {
    const p = mesh.geometry.attributes.position, nr = mesh.geometry.attributes.normal, out = [];
    for (let i = 0; i < n; i++) {
      const k = Math.floor(Math.random() * (p.count / 3)) * 3, c = v3(), nn = v3();
      for (let j = 0; j < 3; j++) { c.add(v3(p.getX(k + j), p.getY(k + j), p.getZ(k + j))); nn.add(v3(nr.getX(k + j), nr.getY(k + j), nr.getZ(k + j))); }
      out.push([c.divideScalar(3), nn.normalize()]);
    }
    return out;
  };
  // Sternblitze, die nacheinander auf der Oberfläche aufblitzen
  const flares = (n, color, sizeMul = 1) => {
    const list = surfacePoints(n).map(([c, nn]) => {
      const sp = add(billboard('star', color, 0.001, 1)); sp.position.copy(c).addScaledVector(nn, 0.05); sp.renderOrder = 6;
      sp.userData = { ph: Math.random() * 5, dur: 0.9 + Math.random() * 1.4 }; return sp;
    });
    ups((t) => list.forEach((sp) => { const u = sp.userData, k = ((t + u.ph) / u.dur) % 1, a = k < 0.35 ? Math.pow(Math.sin(Math.PI * k / 0.35), 2) : 0; sp.scale.setScalar(0.001 + a * R * 0.55 * sizeMul); sp.material.rotation = t * 0.8 + u.ph; }));
  };
  const halo = (color, scale, opacity, z = -0.6) => { const h = add(billboard('glow', color, scale * R, opacity)); h.position.copy(ctr).setZ(z); h.renderOrder = -1; return h; };
  const [L, B, D] = gem.colors.map((c) => new THREE.Color(c));
  switch (mut.id) {
    case 'rissig': {
      // Der Kristall ist in Scherben zersprungen, die von einem Lichtkern zusammengehalten werden.
      const live = mutHooks.isLive(o), born = performance.now() / 1000;
      mod((m) => { m.roughness = Math.max(m.roughness, 0.2); m.color.lerp(new THREE.Color('#9a948c'), 0.12); });
      const full = mesh.geometry.clone(); planarUV(full, 'xy');
      const shardGeos = splitShards(full, ctr, 9);
      const darkMat = new THREE.MeshBasicMaterial({ color: '#120a04', alphaMap: crackTexture(11), transparent: true, opacity: 0.9, depthWrite: false });
      const glowMat = new THREE.MeshBasicMaterial({ map: crackTexture(5), color: L.clone().lerp(new THREE.Color('#fff4dc'), 0.6), transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending });
      const shards = shardGeos.map((sg) => {
        const sh = add(new THREE.Mesh(sg, mesh.material));
        const d1 = new THREE.Mesh(sg, darkMat); d1.scale.setScalar(1.008); d1.renderOrder = 4;
        const d2 = new THREE.Mesh(sg, glowMat); d2.scale.setScalar(1.012); d2.renderOrder = 5;
        sh.add(d1, d2); sh.userData = { dir: sg.userData.dir, ph: Math.random() * TAU, spin: v3(...rndIn(1, 1, 1)).normalize() };
        return sh;
      });
      mesh.visible = false;
      o.crystal.extras.children.forEach((c) => { if (c.isLineSegments) c.visible = false; });
      // glühender Kern, der durch die Spalten scheint
      const core = add(new THREE.Mesh(new THREE.IcosahedronGeometry(R * 0.42, 2), new THREE.MeshBasicMaterial({ color: L.clone().lerp(new THREE.Color('#ffffff'), 0.65) })));
      core.position.copy(ctr);
      const coreGlow = halo(L.clone().lerp(new THREE.Color('#fff4dc'), 0.5), 2.2, 0.35, ctr.z);
      const coreCracks = add(new THREE.Mesh(new THREE.IcosahedronGeometry(R * 0.44, 2), new THREE.MeshBasicMaterial({ map: crackTexture(4), color: L.clone().lerp(new THREE.Color('#ffffff'), 0.3), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }))); coreCracks.position.copy(ctr);
      const coreLight = add(new THREE.PointLight(L.clone().lerp(new THREE.Color('#ffffff'), 0.5), 3, R * 4)); coreLight.position.copy(ctr);
      const leaks = shardGeos.slice(0, 7).map((sg) => { const r = add(billboard('rays', L.clone().lerp(new THREE.Color('#fff4dc'), 0.5), R * 1.1, 0)); r.position.copy(ctr).addScaledVector(sg.userData.dir, R * 0.95); r.renderOrder = 6; r.userData.ph = Math.random() * 6; return r; });
      // Splitter, die um den Kristall taumeln, und Staub, der abbröckelt
      const debris = Array.from({ length: 16 }, (_, i) => { const d = add(new THREE.Mesh(new THREE.TetrahedronGeometry(R * (0.04 + Math.random() * 0.05)), mesh.material)); d.userData = { a: (i / 16) * TAU, r: R * (1.25 + Math.random() * 0.35), y: (Math.random() - 0.5) * R * 1.2, s: 0.25 + Math.random() * 0.35 }; return d; });
      const flakes = add(cloud(30, () => { const [c] = surfacePoints(1)[0]; return c.toArray(); }, { size: 0.06, color: '#d8d0c4', additive: false, opacity: 0.85 }));
      const fbase = flakes.geometry.userData.base;
      ups((t, dt) => {
        const age = performance.now() / 1000 - born;
        const surge = Math.exp(-(t % 4) * 5), boom = (t % 7) < 1.1 ? Math.sin(((t % 7) / 1.1) * Math.PI) * Math.exp(-((t % 7) / 1.1) * 2) * 0.6 : 0, kick = (live ? Math.exp(-age * 2.6) * Math.cos(age * 11) * 0.55 : 0) + surge * 0.12 + boom;
        coreCracks.rotation.set(t * 0.4, t * 0.6, 0); coreCracks.material.opacity = 0.5 + 0.5 * boom + 0.3 * surge;
        const pulse = (Math.sin(t * 2.2) + 1) / 2;
        shards.forEach((sh) => {
          const u = sh.userData, off = R * (0.05 + 0.025 * Math.sin(t * 1.4 + u.ph)) + R * kick;
          sh.position.copy(u.dir).multiplyScalar(off);
          sh.quaternion.setFromAxisAngle(u.spin, Math.sin(t * 0.9 + u.ph) * 0.03 + kick * 0.25);
        });
        glowMat.opacity = 0.35 + 0.45 * pulse * pulse + surge * 0.4;
        core.scale.setScalar(0.85 + 0.12 * pulse); coreGlow.material.opacity = 0.2 + 0.25 * pulse; coreLight.intensity = 2 + 2.5 * pulse + (live ? Math.exp(-age * 3) * 10 : 0);
        leaks.forEach((r) => { r.material.opacity = 0.12 + 0.4 * Math.pow((Math.sin(t * 1.8 + r.userData.ph) + 1) / 2, 3); r.material.rotation = t * 0.3 + r.userData.ph; });
        debris.forEach((d) => { const u = d.userData, a = u.a + t * u.s; d.position.set(ctr.x + Math.cos(a) * u.r, ctr.y + u.y + Math.sin(t + u.a) * 0.06, ctr.z + Math.sin(a) * u.r); d.rotation.set(t * u.s * 3, t * u.s * 2, 0); });
        const a = flakes.geometry.attributes.position;
        for (let i = 0; i < a.count; i++) { const k = ((t * 0.35 + i * 0.137) % 1); a.setXYZ(i, fbase[i * 3] * (1 + k * 0.25), fbase[i * 3 + 1] - k * 1.2, fbase[i * 3 + 2] * (1 + k * 0.25)); }
        a.needsUpdate = true;
      });
      break;
    }
    case 'glaenzend': {
      // Spiegelglanz: blendende Lichtstreifen, Linsenreflexe, Glanzexplosionen, Glitzerregen und ein Spiegelbild
      mod((m) => { m.roughness = 0; m.clearcoat = 1; m.clearcoatRoughness = 0; m.envMapIntensity = 4; m.specularIntensity = 1; });
      const s1 = add(billboard('glow', '#ffffff', 1, 0)), s2 = add(billboard('glow', '#ffffff', 1, 0));
      [s1, s2].forEach((s, i) => { s.scale.set(0.38 * R, 3.6 * R, 1); s.material.rotation = i ? -0.5 : 0.6; s.renderOrder = 6; });
      flares(16, '#ffffff', 1.25);
      const h = halo('#ffffff', 3.2, 0.2);
      const chrome = overlay(null, '#ffffff', 0.2, { scale: 1.035, side: THREE.BackSide });
      const trail = add(cloud(28, () => [0, 0, 0], { size: 0.13, tex: 'star', color: '#ffffff' }));
      // Linsenreflex: waagerechter Streifen und farbige Geisterpunkte, wenn der Lichtstreifen die Mitte kreuzt
      const streak = add(billboard('glow', '#dff2ff', 1, 0)); streak.scale.set(R * 7, R * 0.07, 1); streak.position.set(ctr.x, ctr.y, R + 0.35); streak.renderOrder = 8;
      const ghosts = ['#9ad0ff', '#c79bff', '#ffcf8a', '#9affd6'].map((c, i) => { const g2 = add(billboard('glow', c, R * (0.25 + i * 0.12), 0)); g2.renderOrder = 8; g2.userData.k = -0.6 - i * 0.45; return g2; });
      const burstRays = add(billboard('rays', '#ffffff', 1, 0)); burstRays.position.set(ctr.x, ctr.y, R + 0.3); burstRays.renderOrder = 7;
      const glitter = add(cloud(70, () => [ctr.x + (Math.random() - 0.5) * R * 3, ctr.y + (Math.random() - 0.5) * R * 3, ctr.z + (Math.random() - 0.5) * R * 2.2], { size: 0.08, tex: 'star', color: '#ffffff' }));
      // Spiegelbild unter dem Kristall
      const refl = add(new THREE.Mesh(mesh.geometry, new THREE.MeshBasicMaterial({ color: B.clone().lerp(new THREE.Color('#ffffff'), 0.35), transparent: true, opacity: 0.16, depthWrite: false })));
      refl.scale.set(1, -1, 1); refl.position.y = 2 * (bb.min.y - 0.04);
      const orbitDot = add(billboard('star', '#ffffff', R * 0.5, 1)); orbitDot.renderOrder = 8;
      const orbitTrail = add(cloud(30, () => [0, 0, 0], { size: 0.12, tex: 'star', color: '#ffffff' }));
      const floorShine = add(new THREE.Mesh(new THREE.CircleGeometry(R * 1.4, 48), new THREE.MeshBasicMaterial({ map: sprite('glow'), color: '#ffffff', transparent: true, opacity: 0.25, depthWrite: false, blending: THREE.AdditiveBlending })));
      floorShine.rotation.x = -Math.PI / 2; floorShine.position.y = bb.min.y - 0.04;
      ups((t, dt) => {
        const k1 = (t % 2.6) / 1.1, k2 = ((t + 1.3) % 2.6) / 1.1;
        s1.position.set(ctr.x + (k1 * 2 - 1) * R * 1.4, ctr.y, R + 0.25); s1.material.opacity = k1 < 1 ? Math.sin(Math.PI * k1) * 0.7 : 0;
        s2.position.set(ctr.x - (k2 * 2 - 1) * R * 1.4, ctr.y, R + 0.25); s2.material.opacity = k2 < 1 ? Math.sin(Math.PI * k2) * 0.45 : 0;
        const cross = k1 < 1 ? Math.max(0, 1 - Math.abs(k1 - 0.5) * 4) : 0;
        streak.material.opacity = cross * 0.85;
        ghosts.forEach((g2) => { const kk = g2.userData.k * (k1 - 0.5); g2.position.set(ctr.x + kk * R * 2.2, ctr.y - kk * R * 1.2, R + 0.4); g2.material.opacity = cross * 0.45; });
        const bt = t % 3.2, b = bt < 0.5 ? Math.sin(bt / 0.5 * Math.PI) : 0;
        burstRays.scale.setScalar(R * (1.5 + b * 3.5)); burstRays.material.opacity = b * 0.8; burstRays.material.rotation = t * 0.5;
        const a = trail.geometry.attributes.position;
        for (let i = 0; i < a.count; i++) { const kk = k1 - i * 0.03; a.setXYZ(i, ctr.x + (kk * 2 - 1) * R * 1.4 + Math.sin(i * 7) * 0.06, ctr.y + (i % 5 - 2) * R * 0.18, R + 0.3); }
        a.needsUpdate = true; trail.material.opacity = k1 < 1.2 ? 0.9 : 0;
        const ga = glitter.geometry.attributes.position;
        for (let i = 0; i < ga.count; i++) { let y = ga.getY(i) - dt * (0.25 + (i % 5) * 0.06); if (y < ctr.y - R * 1.5) y = ctr.y + R * 1.5; ga.setY(i, y); }
        ga.needsUpdate = true; glitter.material.opacity = 0.5 + 0.5 * Math.abs(Math.sin(t * 4));
        chrome.material.opacity = 0.1 + 0.06 * Math.sin(t * 2.4); h.material.opacity = 0.08 + 0.05 * Math.sin(t * 2) + b * 0.15;
        floorShine.material.opacity = 0.2 + 0.15 * cross + 0.2 * b;
        const oa = orbitTrail.geometry.attributes.position, op = (tt) => v3(ctr.x + Math.cos(tt * 2.2) * R * 1.25, ctr.y + Math.sin(tt * 1.1) * R * 0.4, ctr.z + Math.sin(tt * 2.2) * R * 1.25);
        orbitDot.position.copy(op(t)); orbitDot.material.rotation = t * 3; orbitDot.scale.setScalar(R * (0.4 + 0.15 * Math.sin(t * 9)));
        for (let i = 0; i < oa.count; i++) { const pp = op(t - i * 0.025); oa.setXYZ(i, pp.x, pp.y, pp.z); }
        oa.needsUpdate = true; orbitTrail.material.opacity = 0.7;
        mesh.material.envMapIntensity = 4 + 2 * b;
      });
      break;
    }
    case 'einschluss': {
      // Bernstein mit wechselndem Inhalt: Müll, Pflanzen, Insekten oder seltene Fossilien. Je seltener, desto prächtiger.
      const inc = mut.inc || INC_BY_ID.fliege, rare = INCLUSIONS.indexOf(inc) / (INCLUSIONS.length - 1), junk = inc.kind === 'Müll';
      const amber = new THREE.MeshStandardMaterial({ color: junk ? '#7a5020' : '#b8701c', emissive: junk ? '#2a1606' : '#6a3008', emissiveIntensity: 0.5 + rare * 0.4, roughness: 0.4, transparent: true, opacity: 0.85, depthTest: false, side: THREE.BackSide, envMapIntensity: 0.3 });
      const amberFront = new THREE.MeshBasicMaterial({ color: junk ? '#8a5a20' : '#c87a20', transparent: true, opacity: junk ? 0.22 : 0.14, depthTest: false, depthWrite: false });
      const dropGeo = new THREE.IcosahedronGeometry(R * 0.46, 4), dp = dropGeo.attributes.position;
      for (let i = 0; i < dp.count; i++) { const x = dp.getX(i), y = dp.getY(i), z = dp.getZ(i), k = 1 + 0.08 * Math.sin(x * 9 / R) * Math.cos(z * 7 / R) + 0.05 * Math.sin(y * 11 / R); dp.setXYZ(i, x * k, y * k * 0.92, z * k); }
      dropGeo.computeVertexNormals();
      const blob = add(new THREE.Mesh(dropGeo, amber)); blob.position.copy(ctr); blob.renderOrder = 5;
      const specks = add(cloud(40, () => { const v = v3(...rndIn(1, 1, 1)).multiplyScalar(R * 0.4); return v.add(ctr).toArray(); }, { size: 0.035, color: '#3a2008', additive: false, opacity: 0.7, inner: true }));
      const shine = add(billboard('glow', '#ffffff', R * 0.35, 0.55)); shine.position.set(ctr.x - R * 0.16, ctr.y + R * 0.2, ctr.z + R * 0.5); shine.renderOrder = 10; shine.material.depthTest = false;
      const blobFront = add(new THREE.Mesh(dropGeo, amberFront)); blobFront.position.copy(ctr); blobFront.renderOrder = 9;
      const ambHalo = halo(junk ? '#8a6a3a' : '#ffb040', 2 + rare * 1.2, 0.12 + rare * 0.12, ctr.z);
      const rays = halo(inc.color, 1, 0.08 + rare * 0.18, ctr.z - 0.05); rays.material.map = sprite('rays'); rays.scale.set(R * (2.4 + rare * 2.4), R * (2.4 + rare * 2.4), 1);
      // der Einschluss dreht sich immer zur Kamera und hat ein eigenes Licht, damit man ihn gut erkennt
      const holder = new THREE.Group(); holder.position.copy(ctr); add(holder);
      const model = buildInclusion(inc); model.scale.multiplyScalar(R * 1.75); holder.add(model);
      const key = new THREE.PointLight(0xffffff, 1.3, R * 2); key.position.set(0, R * 0.2, R * 0.6); holder.add(key);
      // Namensschild unter dem Bernstein
      const tag = add(new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex('schild-' + inc.id, 256, (x, S) => {
        x.clearRect(0, 0, S, S); x.fillStyle = 'rgba(15,13,20,.78)'; x.strokeStyle = inc.color; x.lineWidth = 4;
        x.beginPath(); x.roundRect(8, S * 0.3, S - 16, S * 0.4, 30); x.fill(); x.stroke();
        x.fillStyle = inc.color; x.font = `700 ${S * 0.1}px system-ui, sans-serif`; x.textAlign = 'center'; x.fillText(inc.kind.toUpperCase(), S / 2, S * 0.45);
        x.fillStyle = '#ffffff'; x.font = `700 ${S * (inc.name.length > 16 ? 0.085 : 0.11)}px system-ui, sans-serif`; x.fillText(inc.name, S / 2, S * 0.61);
      }), transparent: true, depthTest: false })));
      tag.scale.set(R * 1.1, R * 1.1, 1); tag.position.set(ctr.x, ctr.y - R * 0.68, ctr.z + R * 0.3); tag.renderOrder = 10;
      const motes = add(cloud(Math.round(20 + rare * 60), () => { const v = v3(...rndIn(1, 1, 1)).normalize().multiplyScalar(R * (0.32 + Math.random() * 0.4)); return v.add(ctr).toArray(); }, { size: 0.08, tex: 'star', color: junk ? '#a89070' : '#ffd27a', inner: true }));
      const bub = add(cloud(22, () => [ctr.x + (Math.random() - 0.5) * R * 0.36, ctr.y + (Math.random() - 0.5) * R * 0.5, ctr.z + (Math.random() - 0.5) * R * 0.36], { size: 0.05, color: '#fff6e0', additive: false, opacity: 0.9, inner: true }));
      const nDrops = junk ? 0 : 3 + Math.round(rare * 5);
      const drops = Array.from({ length: nDrops }, (_, i) => { const d = add(new THREE.Mesh(new THREE.SphereGeometry(R * 0.06, 14, 10), new THREE.MeshPhysicalMaterial({ color: '#f0a030', emissive: '#a05010', emissiveIntensity: 0.5, roughness: 0.1, clearcoat: 1 }))); d.scale.set(1, 1.25, 1); d.userData.a = (i / nDrops) * TAU; return d; });
      const light = add(new THREE.PointLight(junk ? 0xb08050 : 0xffaa44, 1.2 + rare * 1, R * 3.5)); light.position.copy(ctr);
      // seltene Fossilien bekommen einen goldenen Glorienschein
      const glory = rare >= 0.75 ? add(billboard('ring', inc.color, R * 1.5, 0.5)) : null;
      if (glory) { glory.position.copy(ctr); glory.renderOrder = 6; }
      ups((t, dt, cam) => {
        blob.rotation.y = t * 0.2; blobFront.rotation.y = t * 0.2; model.userData.update(t);
        const breath = 1 + 0.03 * Math.sin(t * 1.6); blob.scale.setScalar(breath); blobFront.scale.setScalar(breath); specks.rotation.y = t * 0.2; shine.material.opacity = 0.4 + 0.2 * Math.sin(t * 2.2);
        if (cam) { holder.lookAt(cam.position); holder.rotateY(Math.sin(t * 0.7) * 0.35); holder.rotateX(Math.sin(t * 0.5) * 0.12); }
        tag.material.opacity = 0.85 + 0.15 * Math.sin(t * 2);
        motes.rotation.y = -t * 0.5; amber.emissiveIntensity = 0.35 + rare * 0.5 + 0.15 * Math.sin(t * 2); light.intensity = 1 + rare * 1 + 0.4 * Math.sin(t * 2);
        rays.material.rotation = t * 0.15; ambHalo.material.opacity = 0.12 + rare * 0.12 + 0.05 * Math.sin(t * 2);
        drops.forEach((d) => { const a = d.userData.a + t * 0.5; d.position.set(ctr.x + Math.cos(a) * R * 1.35, ctr.y + Math.sin(a * 2) * R * 0.25, ctr.z + Math.sin(a) * R * 1.35); });
        if (glory) { glory.scale.setScalar(R * (1.4 + 0.15 * Math.sin(t * 2))); glory.material.opacity = 0.35 + 0.2 * Math.sin(t * 2.5); }
        const a = bub.geometry.attributes.position;
        for (let i = 0; i < a.count; i++) { let y = a.getY(i) + dt * 0.12; if (y > ctr.y + R * 0.28) y = ctr.y - R * 0.28; a.setY(i, y); }
        a.needsUpdate = true;
      });
      break;
    }
    case 'magmakern': {
      // Magmakern: dunkles Basaltgestein mit pulsierenden Lavaadern, Lava tropft herab, Rauch und Glut steigen auf
      const live = mutHooks.isLive(o), born = performance.now() / 1000;
      mod((m) => { m.color.lerp(new THREE.Color('#2a1812'), 0.55); m.roughness = Math.max(m.roughness, 0.45); m.transmission *= 0.4; m.emissive.set('#ff4a0a'); m.emissiveMap = crackTexture(7); m.emissiveIntensity = 1.1; });
      const veins = overlay(crackTexture(9), '#ff7a1a', 0.85);
      const core = halo('#ff5a10', 2.6, 0.35);
      const light = add(new THREE.PointLight(0xff6a1a, 3, R * 4)); light.position.copy(ctr);
      const drips = add(cloud(26, () => { const [c] = surfacePoints(1)[0]; return [c.x, bb.min.y + Math.random() * 0.2, c.z]; }, { size: 0.13, tex: 'dot', color: '#ff8a2a' }));
      const dBase = drips.geometry.userData.base;
      const smoke = add(cloud(40, () => [ctr.x + (Math.random() - 0.5) * R, bb.max.y, ctr.z + (Math.random() - 0.5) * R], { size: 0.7, color: '#2a2220', additive: false, opacity: 0.35 }));
      const embers = add(cloud(60, () => [ctr.x + (Math.random() - 0.5) * R * 1.6, ctr.y, ctr.z + (Math.random() - 0.5) * R * 1.6], { size: 0.07, tex: 'star', color: '#ffb040' }));
      const pool = add(new THREE.Mesh(new THREE.CircleGeometry(R * 1.1, 48), new THREE.MeshBasicMaterial({ map: crackTexture(6), color: '#ff5a10', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })));
      pool.rotation.x = -Math.PI / 2; pool.position.y = bb.min.y - 0.04;
      ups((t, dt) => {
        const age = performance.now() / 1000 - born, beat = Math.pow(Math.max(0, Math.sin(t * 3.1)), 6), erupt = live ? Math.exp(-age * 2) : 0;
        veins.material.opacity = 0.55 + 0.4 * beat + erupt * 0.4; mesh.material.emissiveIntensity = 0.8 + 0.9 * beat + erupt;
        core.material.opacity = 0.25 + 0.2 * beat; light.intensity = 2.2 + 2.5 * beat + erupt * 8; pool.material.opacity = 0.45 + 0.3 * beat;
        const da = drips.geometry.attributes.position;
        for (let i = 0; i < da.count; i++) { const k = (t * 0.45 + i * 0.173) % 1; da.setXYZ(i, dBase[i * 3], bb.min.y - k * k * 0.6, dBase[i * 3 + 2]); }
        da.needsUpdate = true;
        const sa = smoke.geometry.attributes.position;
        for (let i = 0; i < sa.count; i++) { let y = sa.getY(i) + dt * (0.3 + (i % 5) * 0.06); if (y > bb.max.y + R * 2) y = bb.max.y; sa.setY(i, y); sa.setX(i, sa.getX(i) + Math.sin(t + i) * dt * 0.1); }
        sa.needsUpdate = true;
        const ea = embers.geometry.attributes.position;
        for (let i = 0; i < ea.count; i++) { let y = ea.getY(i) + dt * (0.6 + (i % 4) * 0.2); if (y > bb.max.y + R * 1.5) y = bb.min.y; ea.setY(i, y); }
        ea.needsUpdate = true; embers.material.opacity = 0.6 + 0.4 * Math.sin(t * 6);
      });
      break;
    }
    case 'giftkristall': {
      // Giftkristall: giftgrünes Leuchten, Blasen wachsen und platzen, Säure tropft und zischt in einer Pfütze
      mod((m) => { m.color.lerp(new THREE.Color('#5aff2a'), 0.35); m.emissive.set('#3aff1a'); m.emissiveIntensity = 0.35; });
      const toxic = new THREE.Color('#7aff3a');
      const bubbleMat = new THREE.MeshPhysicalMaterial({ color: '#9aff6a', transmission: 0.6, roughness: 0.05, thickness: 0.1, transparent: true, opacity: 0.75, emissive: '#3aff1a', emissiveIntensity: 0.4, iridescence: 0.8 });
      const bubbles = surfacePoints(12).map(([c, n], i) => { const b = add(new THREE.Mesh(new THREE.SphereGeometry(R * 0.07, 16, 12), bubbleMat)); b.userData = { c, n, ph: i * 0.37 }; return b; });
      const pops = add(cloud(60, () => [0, -99, 0], { size: 0.06, color: toxic }));
      const drips = add(cloud(14, () => { const [c] = surfacePoints(1)[0]; return [c.x, bb.min.y, c.z]; }, { size: 0.12, tex: 'dot', color: '#8aff4a' }));
      const dBase = drips.geometry.userData.base;
      const puddle = add(new THREE.Mesh(new THREE.CircleGeometry(R * 1.2, 48), new THREE.MeshBasicMaterial({ map: sprite('glow'), color: '#5aff2a', transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending })));
      puddle.rotation.x = -Math.PI / 2; puddle.position.y = bb.min.y - 0.05;
      const fumes = add(cloud(36, () => [ctr.x + (Math.random() - 0.5) * R * 2.2, bb.min.y + Math.random() * R * 0.4, ctr.z + (Math.random() - 0.5) * R * 2.2], { size: 0.6, color: '#4aa02a', opacity: 0.2 }));
      const h = halo('#5aff2a', 2.6, 0.22);
      let popIdx = 0;
      ups((t, dt) => {
        mesh.material.emissiveIntensity = 0.3 + 0.2 * Math.sin(t * 2.4);
        bubbles.forEach((b) => {
          const u = b.userData, k = (t * 0.35 + u.ph) % 1, s3 = k < 0.85 ? k / 0.85 : 0;
          b.scale.setScalar(Math.max(0.001, 0.4 + s3 * 1.2)); b.position.copy(u.c).addScaledVector(u.n, R * 0.05 + s3 * R * 0.08);
          if (k > 0.85 && !u.popped) { u.popped = true; const pa = pops.geometry.attributes.position; for (let j = 0; j < 5; j++) { const v = b.position.clone().add(v3(...rndIn(0.1, 0.1, 0.1))); pa.setXYZ((popIdx++) % 60, v.x, v.y, v.z); } pa.needsUpdate = true; }
          if (k < 0.85) u.popped = false;
        });
        const pa = pops.geometry.attributes.position; for (let i = 0; i < pa.count; i++) pa.setY(i, pa.getY(i) + dt * 0.3); pa.needsUpdate = true;
        const da = drips.geometry.attributes.position;
        for (let i = 0; i < da.count; i++) { const k = (t * 0.5 + i * 0.211) % 1; da.setXYZ(i, dBase[i * 3], bb.min.y - k * k * (R * 0.6), dBase[i * 3 + 2]); }
        da.needsUpdate = true;
        puddle.material.opacity = 0.35 + 0.15 * Math.sin(t * 3); puddle.scale.setScalar(1 + 0.05 * Math.sin(t * 2));
        fumes.rotation.y = t * 0.15; h.material.opacity = 0.18 + 0.08 * Math.sin(t * 2.4);
      });
      break;
    }
    case 'eisherz': {
      // Eisherz: eine Frostschale umhüllt den Kristall, darin pocht ein blaues Herz, Eiszapfen wachsen, Schnee fällt
      const live = mutHooks.isLive(o), born = performance.now() / 1000;
      mod((m) => { m.color.lerp(new THREE.Color('#dff6ff'), 0.3); });
      const frostTex = canvasTex('frost', 256, (x, S) => { x.fillStyle = '#000'; x.fillRect(0, 0, S, S); const r = seeded(23); x.strokeStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 70; i++) { const cx = r() * S, cy = r() * S, l = 6 + r() * 18; x.lineWidth = 1 + r(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a) * l, cy + Math.sin(a) * l); x.stroke(); } } });
      const shell = overlay(frostTex, '#e8f8ff', 0.7, { scale: 1.05 });
      const shell2 = overlay(null, '#bfe8ff', 0.15, { scale: 1.08, side: THREE.BackSide });
      const heart = add(billboard('glow', '#5ac8ff', R * 1.1, 0.6)); heart.position.copy(ctr); heart.renderOrder = 6; heart.material.depthTest = false;
      const ice = new THREE.MeshPhysicalMaterial({ color: '#dff6ff', roughness: 0.05, transmission: 0.7, thickness: 0.3, ior: 1.31, envMapIntensity: 2 });
      const icicles = Array.from({ length: 11 }, (_, i) => { const a = (i / 11) * TAU + Math.random() * 0.3, len = R * (0.25 + Math.random() * 0.35), c = add(new THREE.Mesh(new THREE.ConeGeometry(R * 0.05, len, 7), ice)); c.rotation.x = Math.PI; c.userData = { len, x: Math.cos(a) * R * 0.6, z: Math.sin(a) * R * 0.6, d: i * 0.06 }; return c; });
      const drip = add(cloud(11, (i) => [icicles[i].userData.x, bb.min.y, icicles[i].userData.z], { size: 0.08, tex: 'dot', color: '#cfefff' }));
      const snow = add(cloud(90, () => [ctr.x + (Math.random() - 0.5) * R * 3.4, ctr.y + (Math.random() - 0.5) * R * 3, ctr.z + (Math.random() - 0.5) * R * 2], { size: 0.07, tex: 'dot', color: '#ffffff', opacity: 0.9 }));
      const flakes = Array.from({ length: 6 }, (_, i) => { const f = add(billboard('star', '#dff6ff', R * 0.3, 0.8)); f.userData.a = (i / 6) * TAU; return f; });
      const mist = add(cloud(30, () => { const a = Math.random() * TAU, r = R * (0.8 + Math.random() * 0.8); return [ctr.x + Math.cos(a) * r, bb.min.y + Math.random() * 0.2, ctr.z + Math.sin(a) * r]; }, { size: 0.5, color: '#dff6ff', opacity: 0.18 }));
      ups((t, dt) => {
        const age = performance.now() / 1000 - born, ph = t % 1.4, beat = Math.exp(-ph * 7) + (ph > 0.3 ? 0.6 * Math.exp(-(ph - 0.3) * 7) : 0);
        heart.scale.setScalar(R * (0.9 + beat * 0.5)); heart.material.opacity = 0.35 + beat * 0.5;
        shell.material.opacity = 0.55 + 0.15 * Math.sin(t * 1.3); shell2.material.opacity = 0.12 + 0.06 * beat;
        icicles.forEach((c) => { const u = c.userData, g2 = live ? Math.min(1, Math.max(0, (age - u.d) / 0.8)) : 1; c.scale.set(1, Math.max(0.001, g2), 1); c.position.set(u.x, bb.min.y + R * 0.05 - u.len * 0.5 * g2, u.z); });
        const dra = drip.geometry.attributes.position;
        for (let i = 0; i < dra.count; i++) { const u = icicles[i].userData, k = (t * 0.4 + i * 0.29) % 1; dra.setXYZ(i, u.x, bb.min.y - u.len - k * k * R * 0.6, u.z); }
        dra.needsUpdate = true;
        const sa = snow.geometry.attributes.position;
        for (let i = 0; i < sa.count; i++) { let y = sa.getY(i) - dt * (0.25 + (i % 5) * 0.05); if (y < ctr.y - R * 1.5) y = ctr.y + R * 1.5; sa.setY(i, y); sa.setX(i, sa.getX(i) + Math.sin(t * 1.5 + i) * dt * 0.05); }
        sa.needsUpdate = true;
        flakes.forEach((f, i) => { const a = f.userData.a + t * 0.4; f.position.set(ctr.x + Math.cos(a) * R * 1.4, ctr.y + Math.sin(t + i) * R * 0.4, ctr.z + Math.sin(a) * R * 1.4); f.material.rotation = t + i; });
        mist.rotation.y = t * 0.1;
      });
      break;
    }
    case 'blitzkristall': {
      // Blitzkristall: lädt sich alle drei Sekunden auf und entlädt sich in Blitzen, ein Plasmaring kreist, Funken springen
      mod((m) => { m.emissive.set('#ffe94a'); m.emissiveIntensity = 0.15; });
      const boltMat = new THREE.LineBasicMaterial({ color: '#fffbe0', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
      const boltMat2 = new THREE.LineBasicMaterial({ color: '#ffe94a', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
      const bolts = Array.from({ length: 7 }, (_, i) => { const g2 = new THREE.BufferGeometry(); g2.setAttribute('position', new THREE.BufferAttribute(new Float32Array(14 * 3), 3)); const l = add(new THREE.Line(g2, i % 2 ? boltMat2 : boltMat)); l.renderOrder = 8; return l; });
      const ring = add(new THREE.Mesh(new THREE.TorusGeometry(R * 1.25, 0.025, 8, 100), new THREE.MeshBasicMaterial({ color: '#ffe94a', transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }))); ring.position.copy(ctr);
      const charge = add(cloud(60, () => [0, 0, 0], { size: 0.1, tex: 'star', color: '#fff6a0' }));
      const cStart = Array.from({ length: 60 }, () => v3(...rndIn(1, 1, 1)).normalize().multiplyScalar(R * (1.6 + Math.random())));
      const flash = halo('#fff6c0', 3.4, 0);
      const sparks = add(cloud(30, () => rndIn(R, R, R), { size: 0.12, tex: 'star', color: '#ffe94a' }));
      const jag = (l, from, to, spread) => { const p = l.geometry.attributes.position; for (let i = 0; i < 14; i++) { const k = i / 13, pt = from.clone().lerp(to, k); if (i > 0 && i < 13) pt.add(v3(...rndIn(spread, spread, spread))); p.setXYZ(i, pt.x, pt.y, pt.z); } p.needsUpdate = true; };
      let lastJag = 0;
      ups((t) => {
        const cyc = t % 3, chargeK = Math.min(1, cyc / 2.4), dis = cyc > 2.4 ? 1 - (cyc - 2.4) / 0.6 : 0;
        const ca = charge.geometry.attributes.position;
        for (let i = 0; i < 60; i++) { const p = cStart[i].clone().multiplyScalar(1 - chargeK * 0.8); ca.setXYZ(i, ctr.x + p.x, ctr.y + p.y, ctr.z + p.z); }
        ca.needsUpdate = true; charge.material.opacity = cyc < 2.4 ? 0.3 + chargeK * 0.7 : 0;
        mesh.material.emissiveIntensity = 0.1 + chargeK * 0.3 + dis * 0.9;
        if (t - lastJag > 0.07) {
          lastJag = t;
          bolts.forEach((l, i) => { const dir = v3(...rndIn(1, 1, 1)).normalize(); const to = dis > 0 ? ctr.clone().addScaledVector(dir, R * (1.8 + Math.random())) : ctr.clone().addScaledVector(dir, R * 0.9); jag(l, ctr.clone().addScaledVector(dir, R * 0.3), to, dis > 0 ? 0.12 : 0.05); });
          const sa = sparks.geometry.attributes.position; for (let i = 0; i < sa.count; i++) { const v = v3(...rndIn(1, 1, 1)).normalize().multiplyScalar(R * (0.9 + Math.random() * 0.5)); sa.setXYZ(i, ctr.x + v.x, ctr.y + v.y, ctr.z + v.z); } sa.needsUpdate = true;
        }
        boltMat.opacity = dis > 0 ? dis : (Math.random() < 0.15 ? 0.5 : 0); boltMat2.opacity = boltMat.opacity * 0.8;
        flash.material.opacity = dis * 0.6; sparks.material.opacity = 0.4 + dis * 0.6;
        ring.rotation.set(1.2 + Math.sin(t) * 0.3, t * 1.5, 0); ring.material.opacity = 0.4 + 0.3 * chargeK;
      });
      break;
    }
    case 'bluetenkristall': {
      // Blütenkristall: Kristallblumen öffnen und schließen sich auf dem Stein, Blütenblätter wehen davon, Pollen funkeln
      const petalMat = new THREE.MeshPhysicalMaterial({ color: '#ffb8e0', roughness: 0.1, transmission: 0.4, thickness: 0.1, emissive: '#ff6ab8', emissiveIntensity: 0.25, iridescence: 0.6, side: THREE.DoubleSide });
      const centerMat = new THREE.MeshStandardMaterial({ color: '#ffd23a', emissive: '#ffa020', emissiveIntensity: 0.6, roughness: 0.3 });
      const leafMat = new THREE.MeshPhysicalMaterial({ color: '#5ad86a', roughness: 0.15, transmission: 0.3, emissive: '#1a6a2a', emissiveIntensity: 0.25, side: THREE.DoubleSide });
      const petalGeo = new THREE.SphereGeometry(R * 0.17, 12, 8); petalGeo.scale(0.55, 0.12, 1); petalGeo.translate(0, 0, R * 0.15);
      const flowers = surfacePoints(10).map(([c, n], fi) => {
        const f = new THREE.Group(); f.position.copy(c); f.quaternion.setFromUnitVectors(v3(0, 1, 0), n); add(f);
        const petals = Array.from({ length: 6 }, (_, i) => { const p2 = new THREE.Group(); p2.rotation.y = (i / 6) * TAU; const m = new THREE.Mesh(petalGeo, petalMat); p2.add(m); f.add(p2); return p2; });
        const center = new THREE.Mesh(new THREE.SphereGeometry(R * 0.06, 12, 10), centerMat); center.position.y = R * 0.02; f.add(center);
        for (let k = 0; k < 2; k++) { const lf = new THREE.Mesh(petalGeo, leafMat); lf.rotation.set(0.3, (k ? 1 : -1) * 2.2, 0); lf.scale.setScalar(1.2); f.add(lf); }
        f.userData = { petals, ph: fi * 0.6 }; return f;
      });
      const drift = add(cloud(40, () => [0, 0, 0], { size: 0.12, tex: 'dot', color: '#ffb8e0' }));
      const pollen = add(cloud(40, () => { const v = v3(...rndIn(1, 1, 1)).normalize().multiplyScalar(R * (1 + Math.random() * 0.4)); return v.add(ctr).toArray(); }, { size: 0.07, tex: 'star', color: '#ffe08a' }));
      const h = halo('#ff8ad8', 2.6, 0.2);
      ups((t) => {
        flowers.forEach((f) => { const open = 0.5 + 0.5 * Math.sin(t * 0.8 + f.userData.ph); f.userData.petals.forEach((p2) => { p2.children[0].rotation.x = -0.15 - (1 - open) * 1.2; }); f.scale.setScalar(0.85 + open * 0.25); });
        const da = drift.geometry.attributes.position;
        for (let i = 0; i < da.count; i++) { const k = (t * 0.15 + i / da.count) % 1, a = i * 1.7 + k * 4; da.setXYZ(i, ctr.x + Math.cos(a) * R * (0.6 + k * 1.6), ctr.y + R * 0.6 - k * R * 1.8 + Math.sin(k * 9 + i) * 0.1, ctr.z + Math.sin(a) * R * (0.6 + k * 1.6)); }
        da.needsUpdate = true; drift.material.opacity = 0.85;
        pollen.rotation.y = t * 0.3; pollen.material.opacity = 0.4 + 0.6 * Math.abs(Math.sin(t * 2)); h.material.opacity = 0.16 + 0.06 * Math.sin(t * 1.5);
      });
      break;
    }
    case 'phoenix': {
      // PREMIUM · Phoenix: Feuerflügel schlagen hinter dem Kristall, ein Flammenkranz brennt, alle acht Sekunden zerfällt er
      // zu Asche und ersteht in einer Feuerexplosion neu
      const live = mutHooks.isLive(o);
      const wingTex = canvasTex('phoenixfluegel', 256, (x, S) => {
        x.clearRect(0, 0, S, S);
        for (let i = 0; i < 9; i++) {
          const a = -0.2 + i * 0.16, g2 = x.createLinearGradient(0, S, Math.cos(a) * S, S - Math.sin(a) * S);
          g2.addColorStop(0, 'rgba(255,240,180,1)'); g2.addColorStop(0.4, 'rgba(255,150,30,.95)'); g2.addColorStop(0.8, 'rgba(220,40,20,.7)'); g2.addColorStop(1, 'rgba(120,10,10,0)');
          x.fillStyle = g2; x.beginPath(); x.moveTo(0, S); x.quadraticCurveTo(Math.cos(a - 0.08) * S * 0.6, S - Math.sin(a - 0.08) * S * 0.6, Math.cos(a) * S * (0.85 + (i % 3) * 0.05), S - Math.sin(a) * S * (0.85 + (i % 3) * 0.05)); x.quadraticCurveTo(Math.cos(a + 0.08) * S * 0.6, S - Math.sin(a + 0.08) * S * 0.6, 0, S); x.fill();
        }
      });
      const wingMat = new THREE.MeshBasicMaterial({ map: wingTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
      const wings = [-1, 1].map((sd) => {
        const pivot = new THREE.Group(); pivot.position.set(ctr.x + sd * R * 0.2, ctr.y + R * 0.1, ctr.z - R * 0.4); add(pivot);
        const w = new THREE.Mesh(new THREE.PlaneGeometry(R * 2.6, R * 2.6), wingMat); w.position.set(sd * R * 1.3, R * 1.0, 0); w.scale.x = sd; pivot.add(w); w.renderOrder = -1;
        pivot.userData.sd = sd; return pivot;
      });
      const flames = add(cloud(90, (i, c) => { c.setHSL(0.02 + Math.random() * 0.1, 1, 0.55); return [0, 0, 0]; }, { size: 0.22, tex: 'dot', vertexColors: true, opacity: 0.85 }));
      const fBase = Array.from({ length: 90 }, () => { const a = Math.random() * TAU; return [Math.cos(a) * R * (0.6 + Math.random() * 0.5), Math.sin(a) * R * (0.6 + Math.random() * 0.5), Math.random()]; });
      const tail = add(cloud(50, (i, c) => { c.setHSL(0.05 + Math.random() * 0.08, 1, 0.6); return [0, 0, 0]; }, { size: 0.14, tex: 'star', vertexColors: true }));
      const ash = add(cloud(60, () => [0, -99, 0], { size: 0.08, color: '#5a5450', additive: false, opacity: 0.8 }));
      const haloRing = add(billboard('ring', '#ffd23a', R * 2.4, 0.6)); haloRing.position.set(ctr.x, ctr.y + R * 0.1, ctr.z - R * 0.3); haloRing.renderOrder = -1;
      const glow = halo('#ff7a1a', 3.6, 0.35);
      const light = add(new THREE.PointLight(0xff7a2a, 3, R * 5)); light.position.copy(ctr);
      let reborn = false;
      ups((t, dt) => {
        const flap = Math.sin(t * 2.6);
        wings.forEach((p2) => { p2.rotation.y = p2.userData.sd * (0.35 + flap * 0.35); p2.rotation.z = p2.userData.sd * flap * 0.08; });
        const fa = flames.geometry.attributes.position;
        for (let i = 0; i < 90; i++) { const b = fBase[i], k = (t * 0.7 + b[2]) % 1; fa.setXYZ(i, ctr.x + b[0] * (1 - k * 0.5), ctr.y + b[1] * 0.4 - R * 0.5 + k * R * 1.8, ctr.z + Math.sin(i) * R * 0.3); }
        fa.needsUpdate = true;
        const ta = tail.geometry.attributes.position;
        for (let i = 0; i < 50; i++) { const k = (t * 0.4 + i / 50) % 1; ta.setXYZ(i, ctr.x + Math.sin(k * 6 + i) * R * 0.3 * k, bb.min.y - k * R * 1.4, ctr.z - R * 0.2 + Math.cos(i) * 0.1); }
        ta.needsUpdate = true;
        // Wiedergeburt: 6,5 s brennen, 1 s Asche, dann Explosion
        const cyc = t % 8, ashK = cyc > 6.5 && cyc < 7.5 ? (cyc - 6.5) : 0;
        mesh.scale.setScalar(1 - ashK * 0.25 + (cyc < 0.4 ? Math.sin(cyc / 0.4 * Math.PI) * 0.15 : 0));
        mesh.material.emissive.set(ashK > 0 ? '#ff3a00' : '#ff8a2a'); mesh.material.emissiveIntensity = 0.2 + ashK * 1.2 + (cyc < 0.4 ? (1 - cyc / 0.4) * 1.5 : 0);
        const aa = ash.geometry.attributes.position;
        if (ashK > 0) { for (let i = 0; i < aa.count; i++) { const v = v3(...rndIn(R, R * 0.6, R)); aa.setXYZ(i, ctr.x + v.x, ctr.y + v.y - ashK * R, ctr.z + v.z); } aa.needsUpdate = true; ash.material.opacity = 0.8 * (1 - ashK); }
        else ash.material.opacity = 0;
        if (cyc < 0.1 && !reborn && live) { reborn = true; mutHooks.burst(140, ctr.clone(), [new THREE.Color('#ffd23a'), new THREE.Color('#ff7a1a'), new THREE.Color('#ff3a1a')], 4, 1.4); mutHooks.kick(-3); }
        if (cyc > 0.5) reborn = false;
        haloRing.material.opacity = 0.45 + 0.2 * Math.sin(t * 2); haloRing.material.rotation = t * 0.3;
        glow.material.opacity = 0.3 + 0.15 * Math.sin(t * 3) + (cyc < 0.4 ? 0.4 : 0); light.intensity = 2.5 + Math.sin(t * 8) * 0.6;
      });
      break;
    }
    case 'dimensionsriss': {
      // PREMIUM · Dimensionsriss: hinter dem Kristall reißt der Raum auf, dahinter wirbelt eine fremde Welt. Splitter der
      // Realität schweben herum, Teilchen werden in den Riss gesogen, der Kristall flackert zwischen den Welten
      const live = mutHooks.isLive(o), born = performance.now() / 1000;
      const worldTex = canvasTex('andere-welt', 256, (x, S) => {
        const g2 = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S * 0.7); g2.addColorStop(0, '#ffffff'); g2.addColorStop(0.15, '#7af0ff'); g2.addColorStop(0.45, '#7a2ae8'); g2.addColorStop(1, '#10021e'); x.fillStyle = g2; x.fillRect(0, 0, S, S);
        const r = seeded(51); for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(255,255,255,${r()})`; x.beginPath(); x.arc(r() * S, r() * S, r() * 1.8, 0, TAU); x.fill(); }
        x.strokeStyle = 'rgba(122,240,255,.35)'; x.lineWidth = 3; for (let i = 0; i < 8; i++) { x.beginPath(); x.arc(S / 2, S / 2, S * (0.08 + i * 0.07), i, i + 3.5); x.stroke(); }
      });
      worldTex.wrapS = worldTex.wrapT = THREE.RepeatWrapping; worldTex.center.set(0.5, 0.5);
      const sh = new THREE.Shape(), pts = [];
      for (let i = 0; i <= 12; i++) { const y = -1 + i / 6; pts.push([0.18 + (i % 2 ? 0.12 : 0) + Math.sin(i * 2.3) * 0.05, y]); }
      sh.moveTo(0, -1.15); pts.forEach(([x, y]) => sh.lineTo(x * (1 - Math.abs(y) * 0.5), y)); sh.lineTo(0, 1.15); [...pts].reverse().forEach(([x, y]) => sh.lineTo(-x * (1 - Math.abs(y) * 0.5) - 0.04, y)); sh.lineTo(0, -1.15);
      const riftGeo = new THREE.ShapeGeometry(sh, 4); planarUV(riftGeo, 'xy');
      const rift = add(new THREE.Mesh(riftGeo, new THREE.MeshBasicMaterial({ map: worldTex, transparent: true, depthWrite: false, side: THREE.DoubleSide })));
      rift.position.set(ctr.x, ctr.y, ctr.z - R * 0.9); rift.scale.set(R * 1.6, R * 1.6, 1); rift.renderOrder = -1;
      const edgePts = sh.getPoints(); const edge = add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(edgePts.map((pp) => v3(pp.x, pp.y, 0))), new THREE.LineBasicMaterial({ color: '#d8f8ff', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })));
      edge.position.copy(rift.position); edge.scale.copy(rift.scale);
      const edgeGlow = add(billboard('glow', '#9a5aff', 1, 0.5)); edgeGlow.position.copy(rift.position); edgeGlow.scale.set(R * 1.4, R * 3.6, 1); edgeGlow.renderOrder = -2;
      const shardMat = new THREE.MeshBasicMaterial({ map: worldTex, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false });
      const shards = Array.from({ length: 9 }, (_, i) => { const tri = new THREE.Shape([new THREE.Vector2(0, 0.2), new THREE.Vector2(0.15, -0.12), new THREE.Vector2(-0.12, -0.1)]); const g2 = new THREE.ShapeGeometry(tri); planarUV(g2, 'xy'); const m = add(new THREE.Mesh(g2, shardMat)); m.scale.setScalar(R * (0.8 + Math.random() * 0.6)); m.userData = { a: (i / 9) * TAU, r: R * (1.3 + Math.random() * 0.5), y: (Math.random() - 0.5) * R * 1.4, s: 0.2 + Math.random() * 0.3 }; return m; });
      const suck = add(cloud(70, () => [0, 0, 0], { size: 0.09, tex: 'star', color: '#9af0ff' }));
      const sStart = Array.from({ length: 70 }, () => v3(...rndIn(1, 1, 0.6)).normalize().multiplyScalar(R * (1.8 + Math.random())));
      const ghostR = add(new THREE.Mesh(mesh.geometry, new THREE.MeshBasicMaterial({ color: '#ff2a6a', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })));
      const ghostB = add(new THREE.Mesh(mesh.geometry, new THREE.MeshBasicMaterial({ color: '#2a8aff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })));
      let glitchUntil = 0;
      ups((t, dt) => {
        const age = performance.now() / 1000 - born, open = live ? elasticOut(Math.min(1, age / 1.2)) : 1;
        rift.scale.set(R * 1.6 * Math.max(0.02, open) * (1 + 0.05 * Math.sin(t * 3)), R * 1.6, 1); edge.scale.copy(rift.scale);
        worldTex.rotation = t * 0.3; worldTex.offset.set(Math.sin(t * 0.2) * 0.05, t * 0.02);
        edge.material.opacity = 0.6 + 0.4 * Math.random(); edgeGlow.material.opacity = (0.35 + 0.2 * Math.sin(t * 2)) * open;
        shards.forEach((m) => { const u = m.userData, a = u.a + t * u.s; m.position.set(ctr.x + Math.cos(a) * u.r, ctr.y + u.y + Math.sin(t + u.a) * 0.1, ctr.z + Math.sin(a) * u.r * 0.6); m.rotation.set(t * u.s * 2, t * u.s * 3, t * u.s); });
        const sa = suck.geometry.attributes.position;
        for (let i = 0; i < 70; i++) { const k = (t * 0.3 + i / 70) % 1, p = sStart[i].clone().multiplyScalar(1 - k); sa.setXYZ(i, rift.position.x + p.x, rift.position.y + p.y, rift.position.z + p.z * 0.3); }
        sa.needsUpdate = true;
        if (t > glitchUntil + 1.5 && Math.random() < 0.02) glitchUntil = t + 0.18;
        const gl = t < glitchUntil;
        ghostR.position.set(gl ? 0.08 : 0, 0, 0); ghostB.position.set(gl ? -0.08 : 0, 0, 0); ghostR.material.opacity = gl ? 0.5 : 0; ghostB.material.opacity = gl ? 0.5 : 0;
        mesh.position.x = gl ? (Math.random() - 0.5) * 0.1 : 0;
      });
      break;
    }
    case 'regenbogen': {
      // Regenbogen: Doppelregenbogen hinter dem Kristall, Prismenfächer, kreisende Glasprismen mit Lichtzerlegung,
      // bunte Lichtstrahlen, die sich drehen, Farbbänder auf dem Kristall und ein feiner Regen, durch den das Licht fällt
      const live = mutHooks.isLive(o), born = performance.now() / 1000;
      mod((m) => { m.iridescence = 1; m.iridescenceIOR = 2; m.dispersion = Math.max(m.dispersion || 0, 3); });
      const arc = (r, i, n, outer) => { const g2 = new THREE.TorusGeometry(r, outer ? 0.022 : 0.032, 6, 140, Math.PI); return add(new THREE.Mesh(g2, new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL((outer ? (n - 1 - i) : i) / n * 0.8, 1, 0.55), transparent: true, opacity: outer ? 0.3 : 0.55, blending: THREE.AdditiveBlending, depthWrite: false }))); };
      const arcs = [];
      for (let i = 0; i < 7; i++) { const a = arc(R * (1.9 - i * 0.065), i, 7, false); a.position.set(ctr.x, bb.min.y, ctr.z - 0.6); arcs.push(a); }
      for (let i = 0; i < 7; i++) { const a = arc(R * (2.55 - i * 0.05), i, 7, true); a.position.set(ctr.x, bb.min.y, ctr.z - 0.7); arcs.push(a); }
      const ringGeo = new THREE.TorusGeometry(R * 1.35, 0.035, 8, 160), rcol = new Float32Array(ringGeo.attributes.position.count * 3), rc = new THREE.Color();
      for (let i = 0; i < ringGeo.attributes.position.count; i++) { rc.setHSL(((Math.atan2(ringGeo.attributes.position.getY(i), ringGeo.attributes.position.getX(i)) / TAU) + 1) % 1, 1, 0.6); rc.toArray(rcol, i * 3); }
      ringGeo.setAttribute('color', new THREE.BufferAttribute(rcol, 3));
      const ring = add(new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ vertexColors: true }))); ring.position.copy(ctr); ring.rotation.x = 1.25;
      const groundTex = canvasTex('regenbogenboden', 256, (x, S) => { x.clearRect(0, 0, S, S); for (let i = 0; i < 7; i++) { x.strokeStyle = `hsla(${i * 45},100%,60%,.85)`; x.lineWidth = 9; x.beginPath(); x.arc(S / 2, S / 2, S * 0.2 + i * 10, 0, TAU); x.stroke(); } });
      const ground = add(new THREE.Mesh(new THREE.CircleGeometry(R * 1.7, 64), new THREE.MeshBasicMaterial({ map: groundTex, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false })));
      ground.rotation.x = -Math.PI / 2; ground.position.y = bb.min.y - 0.04;
      const bandTex = canvasTex('regenbogenband', 256, (x, S) => { const g2 = x.createLinearGradient(0, 0, S, S); for (let i = 0; i <= 6; i++) g2.addColorStop(i / 6, `hsl(${i * 50},100%,60%)`); x.fillStyle = g2; x.fillRect(0, 0, S, S); });
      bandTex.wrapS = bandTex.wrapT = THREE.RepeatWrapping;
      const bandOv = overlay(bandTex, '#ffffff', 0.22);
      const prismMat = new THREE.MeshPhysicalMaterial({ color: '#ffffff', transmission: 1, roughness: 0, ior: 1.9, thickness: 0.3, dispersion: 8, envMapIntensity: 2, iridescence: 0.6 });
      const prisms = Array.from({ length: 5 }, (_, i) => { const pm = add(new THREE.Mesh(new THREE.ConeGeometry(R * 0.09, R * 0.2, 3), prismMat)); pm.userData.a = (i / 5) * TAU; return pm; });
      const beams = Array.from({ length: 6 }, (_, i) => { const b = add(billboard('glow', '#ffffff', 1, 0.4)); b.scale.set(R * 3.6, R * 0.06, 1); b.position.copy(ctr).setZ(ctr.z - 0.3); b.renderOrder = -1; b.userData.i = i; return b; });
      const sp = add(cloud(90, (i, cc) => { cc.setHSL(i / 90, 1, 0.62); const a = Math.random() * TAU, r = R * (1.1 + Math.random() * 0.5); return [ctr.x + Math.cos(a) * r, ctr.y + (Math.random() - 0.5) * R * 1.4, ctr.z + Math.sin(a) * r]; }, { size: 0.15, tex: 'star', vertexColors: true }));
      const rain = add(cloud(70, () => [ctr.x + (Math.random() - 0.5) * R * 4, ctr.y + (Math.random() - 0.5) * R * 3, ctr.z - 0.4 - Math.random() * 0.5], { size: 0.05, color: '#cfe8ff', opacity: 0.55 }));
      const beamIn = add(billboard('glow', '#ffffff', 1, 0.7)); beamIn.scale.set(R * 2.6, R * 0.12, 1); beamIn.position.set(ctr.x - R * 1.5, ctr.y + R * 0.2, ctr.z + 0.2); beamIn.renderOrder = 6;
      const fan = Array.from({ length: 7 }, (_, i) => { const b = add(billboard('glow', new THREE.Color().setHSL(i / 7 * 0.8, 1, 0.55), 1, 0.65)); b.scale.set(R * 2.8, R * 0.11, 1); b.renderOrder = 6; b.userData.i = i; return b; });
      const h = halo('#ff7ad9', 3, 0.22);
      ups((t, dt) => {
        const age = performance.now() / 1000 - born, grow = live ? elasticOut(Math.min(1, age / 1.2)) : 1;
        arcs.forEach((a, i) => { a.scale.setScalar(Math.max(0.001, grow * (1 + 0.035 * Math.sin(t * 2.2 + i * 0.6)))); a.material.opacity = (i < 7 ? 0.5 : 0.26) * (1 + 0.3 * Math.sin(t * 2 + i)) * Math.min(1, grow); a.material.color.setHSL(((i % 7) / 7 * 0.8 + t * 0.06) % 1, 1, 0.58); });
        ground.rotation.z = t * 0.3; ground.material.opacity = 0.4 + 0.2 * Math.sin(t * 1.7);
        fan.forEach((b) => { const a = -0.25 + b.userData.i * 0.08 + Math.sin(t) * 0.03; b.material.rotation = a; b.position.set(ctr.x + R * 1.5 * Math.cos(a), ctr.y + R * 1.5 * Math.sin(a) - R * 0.1, ctr.z + 0.2); b.material.opacity = 0.45 + 0.2 * Math.sin(t * 2 + b.userData.i); });
        beams.forEach((b) => { b.material.rotation = t * 0.4 + b.userData.i * (Math.PI / 6); b.material.color.setHSL((t * 0.12 + b.userData.i / 6) % 1, 1, 0.6); b.material.opacity = 0.25 + 0.15 * Math.sin(t * 2 + b.userData.i); });
        prisms.forEach((pm, i) => { const a = pm.userData.a + t * 0.55; pm.position.set(ctr.x + Math.cos(a) * R * 1.55, ctr.y + Math.sin(a * 2 + i) * R * 0.3, ctr.z + Math.sin(a) * R * 1.55); pm.rotation.set(t + i, t * 1.4, 0); });
        ring.rotation.z = t * 0.7; ring.rotation.x = 1.25 + Math.sin(t * 0.8) * 0.15; sp.rotation.y = t * 0.6; sp.position.y = Math.sin(t) * 0.1;
        h.material.color.setHSL((t * 0.15) % 1, 0.9, 0.6);
        bandOv.material.map.offset.set(t * 0.08, t * 0.05);
        mesh.material.iridescenceThicknessRange = [100 + 300 * (Math.sin(t) + 1) / 2, 900];
        const ra = rain.geometry.attributes.position;
        for (let i = 0; i < ra.count; i++) { let y = ra.getY(i) - dt * (1.6 + (i % 4) * 0.3); if (y < ctr.y - R * 1.5) y = ctr.y + R * 1.5; ra.setY(i, y); }
        ra.needsUpdate = true;
      });
      break;
    }
    case 'gigant': {
      // Riesenkristall: wächst gewaltig, Felsspitzen brechen aus dem Boden, glühende Risse, Felsbrocken kreisen, Schockwellen
      const live = mutHooks.isLive(o), born = performance.now() / 1000;
      o.bigScale = 1.3;
      const floorY = bb.min.y - 0.05;
      const cracks = add(new THREE.Mesh(new THREE.CircleGeometry(R * 1.8, 48), new THREE.MeshBasicMaterial({ map: crackTexture(6), color: '#ff7a2a', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })));
      cracks.rotation.x = -Math.PI / 2; cracks.position.y = floorY;
      const heat = add(new THREE.Mesh(new THREE.CircleGeometry(R * 1.3, 48), new THREE.MeshBasicMaterial({ map: sprite('glow'), color: '#ff5a1a', transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending })));
      heat.rotation.x = -Math.PI / 2; heat.position.y = floorY + 0.01;
      const rockM = new THREE.MeshStandardMaterial({ color: '#5a4a3a', roughness: 0.95, flatShading: true, emissive: '#ff5a1a', emissiveIntensity: 0.1 });
      const spikes = Array.from({ length: 9 }, (_, i) => { const a = (i / 9) * TAU + Math.random() * 0.3, sp2 = add(new THREE.Mesh(new THREE.ConeGeometry(R * (0.1 + Math.random() * 0.08), R * (0.5 + Math.random() * 0.5), 5), rockM)); sp2.userData = { a, r: R * (1.15 + Math.random() * 0.3), d: i * 0.05 }; sp2.rotation.z = (Math.random() - 0.5) * 0.5; return sp2; });
      const rocks = Array.from({ length: 14 }, (_, i) => { const r = add(new THREE.Mesh(new THREE.DodecahedronGeometry(0.06 + Math.random() * 0.09, 0), rockM)); r.userData = { a: (i / 14) * TAU, rr: R * (1.4 + Math.random() * 0.4), y: floorY + 0.2 + Math.random() * R * 0.8, s: 0.3 + Math.random() * 0.4 }; return r; });
      const wave = add(new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 64), new THREE.MeshBasicMaterial({ color: '#ffb070', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })));
      wave.rotation.x = -Math.PI / 2; wave.position.y = floorY + 0.01;
      const dust = add(cloud(60, () => { const a = Math.random() * TAU, r = R * (0.8 + Math.random() * 1.3); return [Math.cos(a) * r, floorY + Math.random() * 0.4, Math.sin(a) * r]; }, { size: 0.5, color: '#a08060', additive: false, opacity: 0.25 }));
      const embers = add(cloud(40, () => [ctr.x + (Math.random() - 0.5) * R * 2.4, floorY + Math.random() * R, ctr.z + (Math.random() - 0.5) * R * 2.4], { size: 0.07, tex: 'star', color: '#ffa040' }));
      ups((t, dt) => {
        const age = performance.now() / 1000 - born;
        spikes.forEach((sp2) => { const u = sp2.userData, k = live ? elasticOut(Math.min(1, Math.max(0, age - 0.3 - u.d) / 0.5)) : 1, hgt = sp2.geometry.parameters.height; sp2.position.set(Math.cos(u.a) * u.r, floorY + hgt * 0.5 * k - hgt * 0.5 * (1 - k), Math.sin(u.a) * u.r); const stomp = 1 + Math.exp(-(t % 3) * 6) * 0.3; sp2.scale.set(Math.max(0.001, k), Math.max(0.001, k * stomp), Math.max(0.001, k)); });
        cracks.material.opacity = 0.55 + 0.35 * Math.sin(t * 2.5); heat.material.opacity = 0.3 + 0.15 * Math.sin(t * 3);
        rocks.forEach((r) => { const u = r.userData, a = u.a + t * u.s; r.position.set(Math.cos(a) * u.rr, u.y + Math.sin(t * 1.3 + u.a) * 0.08 + Math.exp(-(t % 3) * 6) * 0.15, Math.sin(a) * u.rr); r.rotation.set(t * u.s, t, 0); });
        const k = (t % 3) / 3; wave.scale.setScalar(R * (0.5 + k * 2.6)); wave.material.opacity = (1 - k) * 0.6;
        dust.rotation.y = t * 0.1;
        const ea = embers.geometry.attributes.position;
        for (let i = 0; i < ea.count; i++) { let y = ea.getY(i) + dt * 0.4; if (y > floorY + R * 1.4) y = floorY; ea.setY(i, y); }
        ea.needsUpdate = true;
        if (live && (t % 3) < 0.05) mutHooks.kick(-1.5);
      });
      break;
    }
  }
  // Jede Mutation bekommt eine sich drehende Aura am Boden und einen Funkenwirbel in ihrer Farbe
  const ai = (g.userData.auraN = (g.userData.auraN || 0) + 1) - 1, mc = new THREE.Color(mut.color);
  const aura = add(new THREE.Mesh(new THREE.RingGeometry(R * (1.05 + ai * 0.2), R * (1.22 + ai * 0.2), 96), new THREE.MeshBasicMaterial({ map: auraTexture(), color: mc, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })));
  aura.rotation.x = -Math.PI / 2; aura.position.set(ctr.x, bb.min.y - 0.03, ctr.z);
  const swirl = add(cloud(34, () => [0, 0, 0], { size: 0.1, tex: 'star', color: mc }));
  ups((t) => {
    aura.rotation.z = t * (0.35 + ai * 0.2) * (ai ? -1 : 1); aura.material.opacity = 0.45 + 0.25 * Math.sin(t * 2 + ai);
    const a = swirl.geometry.attributes.position, n = a.count;
    for (let i = 0; i < n; i++) { const k = (t * 0.22 + i / n) % 1, ang = k * TAU * 2 + i * 0.4 + ai * Math.PI, r = R * (1.12 + ai * 0.2) * (1 - k * 0.25); a.setXYZ(i, ctr.x + Math.cos(ang) * r, bb.min.y + k * size.y * 1.15, ctr.z + Math.sin(ang) * r); }
    a.needsUpdate = true; swirl.material.opacity = 0.75;
  });
}
function auraTexture() {
  return canvasTex('aura', 256, (x, S) => {
    const c = S / 2; x.translate(c, c); x.strokeStyle = 'rgba(255,255,255,.9)'; x.fillStyle = '#fff';
    x.lineWidth = 2; x.beginPath(); x.arc(0, 0, 112, 0, TAU); x.stroke(); x.beginPath(); x.arc(0, 0, 125, 0, TAU); x.stroke();
    for (let i = 0; i < 24; i++) { x.save(); x.rotate((i / 24) * TAU); x.translate(0, -118.5); x.beginPath(); if (i % 3 === 0) { x.moveTo(0, -5); x.lineTo(4, 0); x.lineTo(0, 5); x.lineTo(-4, 0); } else x.arc(0, 0, 2, 0, TAU); x.fill(); x.restore(); }
  });
}

function disposeGroup(g) {
  g.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) [].concat(o.material).forEach((m) => m.dispose()); });
}



addEventListener('pointerdown', () => { userActed = true; }, { capture: true });
addEventListener('keydown', () => { userActed = true; }, { capture: true });
function consumeNewFind() { const v = newFind; newFind = false; return v; }

export {
  BUILD,
  Burst,
  CHANCE,
  CUTS,
  FXS,
  GEMS,
  GEM_FACTOR,
  GEODE_TILT,
  GRAMS,
  INCLUSIONS,
  INC_BY_ID,
  MATS,
  MAT_PARAMS,
  MUT_MAX,
  MUT_PREVIEW,
  MUT_ROLL,
  MUT_ROLLS,
  MUT_SOUND,
  MYSTERY,
  NEW,
  OLD,
  POLISH_MUTATIONS,
  POLISH_PX,
  REVEAL_AT,
  SHAPE,
  SMOOTH_CUTS,
  SPRITE,
  Sound,
  TAU,
  TEXS,
  TIERS,
  V2,
  VIOLET,
  WEIGHTS,
  agateTexture,
  applyMutFx,
  auraTexture,
  baseGeometry,
  billboard,
  brilliant,
  buildInclusion,
  bumpEl,
  cabochon,
  canvasTex,
  causticTexture,
  classRange,
  cloud,
  consumeNewFind,
  countUp,
  crackTexture,
  createGem,
  disposeGroup,
  elasticOut,
  extruded,
  finds,
  finish,
  fmtChance,
  fmtGrams,
  fmtNum,
  fmtPct,
  fmtValue,
  foundValue,
  freeDispose,
  gemById,
  gemGeometry,
  geoCache,
  geoNoise,
  geodeShell,
  hexCrystal,
  logFind,
  lookText,
  makeMaterial,
  makeMut,
  mix,
  mutById,
  mutHooks,
  mutLabel,
  mutMult,
  nebulaTexture,
  newFind,
  nf,
  normalize2,
  pixelTex,
  placed,
  planarUV,
  polarFn,
  polyOutline,
  reduceMotion,
  revealInto,
  rgb,
  ringCut,
  rndIn,
  rollGem,
  rollInclusion,
  rollMutations,
  rollWeight,
  roundG,
  sample,
  scallopShell,
  seeded,
  silkTexture,
  smoothen,
  splitShards,
  sprite,
  starOutline,
  stepCut,
  stripeTexture,
  surface,
  texCache,
  tierById,
  triGeo,
  userActed,
  v3,
  wingTexture,
  wrap,
};
