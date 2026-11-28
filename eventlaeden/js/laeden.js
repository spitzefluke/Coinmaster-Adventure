// Event-Läden: Vorschau aller Event-Shops (3D-Stand, Shopbesitzer, Shop-Fenster mit Kaufen, Adventskalender).
// Inhalte sind fest; ändern lässt sich nur, in welchem Zeitraum ein Event kommt (Admins, gespeichert in Supabase:
// eventlaeden/supabase.sql). Münzen, Käufe und geöffnete Türchen liegen nur im localStorage dieses Browsers.
// Three.js r128 kommt als globales THREE aus index.html.
import { pixelRatio } from '../../js/settings.js';

const T = THREE;
const PY = 1.2;                 // Höhe der Podest-Oberfläche
const $ = s => document.querySelector(s);
const clone = o => JSON.parse(JSON.stringify(o));

/* ---------- Kataloge ---------- */
const HATS = {none:'Kein Hut',party:'Partyhut',top:'Zylinder',cap:'Kappe',heartband:'Herz-Haarreif',jester:'Narrenkappe',bunny:'Hasenohren',sun:'Strohhut & Sonnenbrille',tyrol:'Trachtenhut',witch:'Hexenhut',pilgrim:'Pilgerhut',mitre:'Bischofsmütze',santa:'Weihnachtsmütze'};
const PATTERNS = {plain:'Einfarbig',stripes:'Streifen',check:'Karo',harlequin:'Harlekin',splash:'Farbkleckse'};
const PARTICLES = {none:'Keine',snow:'Schnee',confetti:'Konfetti',hearts:'Herzen',clover:'Kleeblätter',petals:'Blütenblätter',powder:'Farbpulver',bubbles:'Seifenblasen',leaves:'Herbstlaub',bats:'Fledermäuse',sparkle:'Funkeln'};
const SHAPES = {geschenk:'Geschenk',kugel:'Kugel',ei:'Ei',eis:'Eis',herz:'Herz',stern:'Stern',tasse:'Tasse / Krug',kerze:'Kerze',kuerbis:'Kürbis',laterne:'Laterne',klee:'Kleeblatt',bonbon:'Bonbon',brezel:'Brezel',rakete:'Rakete',krone:'Krone',partyhut:'Partyhut',blume:'Blume',muenze:'Münze',fahne:'Fähnchen',kuchen:'Kuchen',stiefel:'Stiefel',zuckerstange:'Zuckerstange'};
const DECOR = {rockets:'Raketen',balloons:'Luftballons',lanterns:'Laternen',bunting:'Wimpelkette',lights:'Lichterkette',hearts:'Herz-Deko',rainbow:'Regenbogen',potofgold:'Goldtopf',eggs:'Ostereier',flowers:'Blumen',powderbowls:'Farbschalen',parasol:'Sonnenschirm',palm:'Palme',flags:'Fahnen',barrels:'Holzfässer',pumpkins:'Kürbisse',graves:'Grabsteine',haybales:'Strohballen',wreath:'Adventskranz',boots:'Nikolausstiefel',xmastree:'Weihnachtsbaum',gifts:'Geschenke',snowman:'Schneemann'};
const RING_DECOR = ['rockets','balloons','hearts','potofgold','eggs','flowers','powderbowls','flags','barrels','pumpkins','graves','haybales','boots','gifts'];
const INNER_DECOR = ['xmastree','palm','snowman','parasol'];

/* ---------- Event-Vorlagen ---------- */
function ev(id,name,dateText,o){return Object.assign({id,name,dateText,builtin:true},o);}
const I=(name,price,shape,color)=>({name,price,shape,color});
const BUILTIN = [
 ev('silvester','Silvester & Neujahr','31.12. bis 1.1.',{night:true,sky:['#090d2b','#2c1a52'],ground:'#1b2035',podium:'#2a2e45',trim:'#d9b44a',
   shop:{sign:'Prosit Neujahr',wall:'#22223a',roof:'#151522',roof2:'#d9b44a',counter:'#2e2e48',signBg:'#141420',signFg:'#ffd65e'},
   avatar:{skin:'#f1c9a5',shirt:'#1c1c24',shirt2:'#d9b44a',shirt3:'#ffffff',pattern:'plain',pants:'#2b2b36',hat:'top',hatColor:'#16161c',hatColor2:'#d9b44a'},
   particles:'confetti',fireworks:true,palette:['#ffd65e','#c9d1e8','#ff5fa2'],decor:['rockets','balloons','lights'],
   items:[I('Partyhut',35,'partyhut','#ffd65e'),I('Glücksklee',15,'klee','#3fae5a'),I('Wunderkerzen',20,'stern','#ffe28a'),I('Tischrakete',45,'rakete','#ff5fa2'),I('Glücksmünze',10,'muenze','#d9b44a')]}),
 ev('cny','Chinesisches Neujahr','Januar oder Februar',{night:true,sky:['#24060a','#8f1d17'],ground:'#3a0d0d',podium:'#7d1414',trim:'#f2c14e',
   shop:{sign:'新年快乐',wall:'#b3161b',roof:'#7a0f12',roof2:'#f2c14e',counter:'#8f1418',signBg:'#7a0f12',signFg:'#ffd66b'},
   avatar:{skin:'#f2cfa8',shirt:'#c8161d',shirt2:'#f2c14e',shirt3:'#ffffff',pattern:'plain',pants:'#2b1a10',hat:'cap',hatColor:'#a3121a',hatColor2:'#f2c14e'},
   particles:'sparkle',fireworks:true,palette:['#e0242b','#f2c14e','#ff8a3d'],decor:['lanterns','bunting','rockets'],
   items:[I('Rote Umschläge',18,'geschenk','#d4161d'),I('Laterne',40,'laterne','#e0242b'),I('Mandarinen',8,'kugel','#ff8a1f'),I('Glückskrone',60,'krone','#f2c14e'),I('Glücksmünze',12,'muenze','#f2c14e')]}),
 ev('valentin','Valentinstag','14.2.',{night:false,sky:['#ff9fbd','#ffe4ec'],ground:'#f4c9d6',podium:'#fff5f8',trim:'#e8496b',
   shop:{sign:'Valentins-Shop',wall:'#ffd3df',roof:'#e8496b',roof2:'#ffffff',counter:'#f7a8bf',signBg:'#e8496b',signFg:'#ffffff'},
   avatar:{skin:'#f5d0b0',shirt:'#e8496b',shirt2:'#ffffff',shirt3:'#ff9fbd',pattern:'plain',pants:'#5b2a3c',hat:'heartband',hatColor:'#c2185b',hatColor2:'#ff4d79'},
   particles:'hearts',fireworks:false,palette:['#ff4d79','#ff9fbd','#c2185b'],decor:['hearts','balloons'],
   items:[I('Herzkissen',30,'herz','#ff4d79'),I('Pralinen',25,'geschenk','#c2185b'),I('Rote Rose',15,'blume','#e3123b'),I('Liebesbonbon',5,'bonbon','#ff9fbd')]}),
 ev('karneval','Karneval & Fasching','11.11. bis Aschermittwoch',{night:false,sky:['#2f97ff','#c4e8ff'],ground:'#7cc4ff',podium:'#ffffff',trim:'#e53935',
   shop:{sign:'Helau & Alaaf!',wall:'#ffe14d',roof:'#e53935',roof2:'#1e88e5',counter:'#43a047',signBg:'#1e88e5',signFg:'#ffe14d'},
   avatar:{skin:'#f1c9a5',shirt:'#e53935',shirt2:'#ffe14d',shirt3:'#1e88e5',pattern:'harlequin',pants:'#43a047',hat:'jester',hatColor:'#e53935',hatColor2:'#1e88e5'},
   particles:'confetti',fireworks:false,palette:['#e53935','#ffe14d','#1e88e5'],decor:['bunting','balloons'],
   items:[I('Narrenkrone',45,'krone','#ffe14d'),I('Kamelle',3,'bonbon','#e53935'),I('Clownsnase',10,'kugel','#ff2d2d'),I('Konfetti-Kanone',30,'rakete','#1e88e5')]}),
 ev('stpatrick',"St. Patrick's Day",'17.3.',{night:false,sky:['#4fa865','#dcf5cd'],ground:'#4caf50',podium:'#e8f5e9',trim:'#1b5e20',
   shop:{sign:"St. Patrick's",wall:'#2e7d32',roof:'#1b5e20',roof2:'#ffffff',counter:'#795548',signBg:'#1b5e20',signFg:'#ffd54f'},
   avatar:{skin:'#f6d3b8',shirt:'#2e7d32',shirt2:'#ffffff',shirt3:'#ffd54f',pattern:'plain',pants:'#1b3d1d',hat:'top',hatColor:'#2e7d32',hatColor2:'#ffd54f'},
   particles:'clover',fireworks:false,palette:['#43a047','#ffd54f','#ffffff'],decor:['rainbow','potofgold','flowers'],
   items:[I('Kleeblatt',7,'klee','#43a047'),I('Goldmünze',20,'muenze','#ffcf33'),I('Grüner Krug',25,'tasse','#2e7d32'),I('Glückshut',40,'partyhut','#2e7d32')]}),
 ev('ostern','Ostern','März oder April',{night:false,sky:['#98d6ff','#fff4c9'],ground:'#a5d66f',podium:'#fffaf0',trim:'#f8a5c2',
   shop:{sign:'Oster-Shop',wall:'#fff6dc',roof:'#f8a5c2',roof2:'#b3e5fc',counter:'#c5e1a5',signBg:'#ffffff',signFg:'#7e57c2'},
   avatar:{skin:'#f5d0b0',shirt:'#b39ddb',shirt2:'#ffffff',shirt3:'#ffe082',pattern:'plain',pants:'#7986cb',hat:'bunny',hatColor:'#ffffff',hatColor2:'#f8a5c2'},
   particles:'petals',fireworks:false,palette:['#f8a5c2','#81d4fa','#ffe082'],decor:['eggs','flowers','gifts'],
   items:[I('Bemaltes Ei',6,'ei','#81d4fa'),I('Schoko-Ei',8,'ei','#8d5a3b'),I('Tulpe',9,'blume','#f06292'),I('Osterbonbon',3,'bonbon','#ffe082')]}),
 ev('holi','Holi, Fest der Farben','Februar oder März',{night:false,sky:['#ffc847','#fff1d6'],ground:'#f3dfbf',podium:'#ffffff',trim:'#ff4fa3',
   shop:{sign:'Holi Hai!',wall:'#fffaf2',roof:'#ff4fa3',roof2:'#ffd23f',counter:'#3ec6ff',signBg:'#7a2cff',signFg:'#ffd23f'},
   avatar:{skin:'#c9926b',shirt:'#ffffff',shirt2:'#ff4fa3',shirt3:'#3ec6ff',pattern:'splash',pants:'#f5f5f5',hat:'none',hatColor:'#ff4fa3',hatColor2:'#ffd23f'},
   particles:'powder',fireworks:false,palette:['#ff4fa3','#ffd23f','#3ec6ff','#7a2cff','#2ee07b'],decor:['powderbowls','bunting','flowers'],
   items:[I('Pink-Pulver',5,'kugel','#ff4fa3'),I('Gelb-Pulver',5,'kugel','#ffd23f'),I('Blau-Pulver',5,'kugel','#3ec6ff'),I('Gujiya',8,'bonbon','#e0a458'),I('Wasserrakete',25,'rakete','#2ee07b')]}),
 ev('sommer','Sommeranfang & Sommerferien','ab 21.6.',{night:false,sky:['#1ea1ff','#c2f1ff'],ground:'#f0d59a',podium:'#ffffff',trim:'#00a6c7',
   shop:{sign:'Sommer-Shop',wall:'#ffffff',roof:'#ff6f61',roof2:'#ffffff',counter:'#00a6c7',signBg:'#00a6c7',signFg:'#ffffff'},
   avatar:{skin:'#e9b98f',shirt:'#ffb300',shirt2:'#ff6f61',shirt3:'#ffffff',pattern:'plain',pants:'#1e88e5',hat:'sun',hatColor:'#e9cf8a',hatColor2:'#ff6f61'},
   particles:'bubbles',fireworks:false,palette:['#ff6f61','#ffd54f','#00a6c7'],decor:['parasol','palm','balloons'],
   items:[I('Erdbeer-Eis',4,'eis','#ff7aa2'),I('Wasserball',12,'kugel','#ffd54f'),I('Limonade',6,'tasse','#ffe76b'),I('Seestern',9,'stern','#ff8a65')]}),
 ev('einheit','Tag der Deutschen Einheit','3.10.',{night:false,sky:['#78adff','#e5efff'],ground:'#7cb342',podium:'#f5f5f5',trim:'#1a1a1a',
   shop:{sign:'3. Oktober',wall:'#f4f4f4',roof:'#1a1a1a',roof2:'#dd0000',counter:'#ffce00',signBg:'#1a1a1a',signFg:'#ffce00'},
   avatar:{skin:'#f1c9a5',shirt:'#1a1a1a',shirt2:'#dd0000',shirt3:'#ffce00',pattern:'stripes',pants:'#263238',hat:'none',hatColor:'#1a1a1a',hatColor2:'#ffce00'},
   particles:'confetti',fireworks:false,palette:['#1a1a1a','#dd0000','#ffce00'],decor:['flags','bunting','balloons'],
   items:[I('Fähnchen',4,'fahne','#dd0000'),I('Mauerstück',30,'geschenk','#9e9e9e'),I('Anstecker',6,'muenze','#ffce00'),I('Festtagsbrezel',5,'brezel','#a0612b')]}),
 ev('oktoberfest','Oktoberfest','Mitte Sept. bis Anfang Okt.',{night:false,sky:['#5aa7ff','#e2f1ff'],ground:'#8bc34a',podium:'#f6efe3',trim:'#1565c0',
   shop:{sign:"O'zapft is!",wall:'#8d6e63',roof:'#1565c0',roof2:'#ffffff',counter:'#6d4c41',signBg:'#ffffff',signFg:'#1565c0'},
   avatar:{skin:'#f3c9a3',shirt:'#ffffff',shirt2:'#d32f2f',shirt3:'#ffffff',pattern:'check',pants:'#6d4c41',hat:'tyrol',hatColor:'#3e5b2e',hatColor2:'#f5f5f5'},
   particles:'confetti',fireworks:false,palette:['#1565c0','#ffffff','#90caf9'],decor:['bunting','barrels','haybales'],
   items:[I('Brezn',4,'brezel','#a0612b'),I('Lebkuchenherz',9,'herz','#8d4e24'),I('Maßkrug',14,'tasse','#e3edf5'),I('Trachtenhut',55,'partyhut','#3e5b2e')]}),
 ev('halloween','Halloween','31.10.',{night:true,sky:['#100820','#3b1f50'],ground:'#1f1a26',podium:'#2c2433',trim:'#ff7a1a',
   shop:{sign:'Grusel-Shop',wall:'#2b2136',roof:'#ff7a1a',roof2:'#141414',counter:'#3c2f4a',signBg:'#141414',signFg:'#ff7a1a'},
   avatar:{skin:'#bfe3b4',shirt:'#5e2b8c',shirt2:'#ff7a1a',shirt3:'#141414',pattern:'plain',pants:'#1a1a1a',hat:'witch',hatColor:'#16121c',hatColor2:'#9c4dff'},
   particles:'bats',fireworks:false,palette:['#ff7a1a','#9c4dff','#7cff6b'],decor:['pumpkins','graves','lights'],
   items:[I('Kürbislaterne',20,'kuerbis','#ff7a1a'),I('Süßes',3,'bonbon','#9c4dff'),I('Hexenkessel',35,'tasse','#1d1d1d'),I('Spukhut',40,'partyhut','#16121c')]}),
 ev('thanksgiving','Thanksgiving','4. Donnerstag im November',{night:false,sky:['#ffab5e','#ffe8c4'],ground:'#a17d3e',podium:'#f3e3c8',trim:'#a0461f',
   shop:{sign:'Thanksgiving',wall:'#a1662f',roof:'#c0392b',roof2:'#f39c12',counter:'#7a4a22',signBg:'#5d3418',signFg:'#ffcf73'},
   avatar:{skin:'#f1c9a5',shirt:'#3a2a20',shirt2:'#ffffff',shirt3:'#c0392b',pattern:'plain',pants:'#2d2018',hat:'pilgrim',hatColor:'#1d1814',hatColor2:'#e0b13c'},
   particles:'leaves',fireworks:false,palette:['#e67e22','#c0392b','#f1c40f'],decor:['haybales','pumpkins','flowers'],
   items:[I('Kürbiskuchen',18,'kuchen','#e67e22'),I('Zierkürbis',9,'kuerbis','#f39c12'),I('Apfel',3,'kugel','#c0392b'),I('Cider',6,'tasse','#b5651d')]}),
 ev('advent','Advent & Nikolaus','1. Advent bis 23.12. · Nikolaus 6.12.',{night:true,sky:['#16244a','#4e5d8a'],ground:'#e8eef7',podium:'#ffffff',trim:'#b71c1c',
   shop:{sign:'Adventsmarkt',wall:'#8d5a3b',roof:'#f4f8ff',roof2:'#b71c1c',counter:'#6d4027',signBg:'#5a3420',signFg:'#ffe1a8'},
   avatar:{skin:'#f3cfb3',shirt:'#b71c1c',shirt2:'#ffd166',shirt3:'#ffffff',pattern:'plain',pants:'#9a1515',hat:'mitre',hatColor:'#c62828',hatColor2:'#ffd166'},
   particles:'snow',fireworks:false,palette:['#ffd166','#b71c1c','#ffffff'],decor:['wreath','boots','lights'],
   items:[I('Lebkuchen',6,'herz','#8d4e24'),I('Nikolausstiefel',22,'stiefel','#b71c1c'),I('Kinderpunsch',5,'tasse','#c62828'),I('Bienenwachskerze',9,'kerze','#ffd166')]}),
 ev('weihnachten','Weihnachten','24. bis 26.12.',{night:true,sky:['#0c1a3a','#2c4a7d'],ground:'#f2f6ff',podium:'#ffffff',trim:'#1b5e20',
   shop:{sign:'Frohe Weihnachten',wall:'#c62828',roof:'#ffffff',roof2:'#2e7d32',counter:'#8d5a3b',signBg:'#1b5e20',signFg:'#ffffff'},
   avatar:{skin:'#f1c9a5',shirt:'#c62828',shirt2:'#ffffff',shirt3:'#2e7d32',pattern:'plain',pants:'#2b2b2b',hat:'santa',hatColor:'#d32f2f',hatColor2:'#ffffff'},
   particles:'snow',fireworks:false,palette:['#d32f2f','#ffd54f','#2e7d32'],decor:['xmastree','gifts','snowman','lights'],
   items:[I('Geschenk',25,'geschenk','#d32f2f'),I('Christbaumkugel',8,'kugel','#ffd54f'),I('Zuckerstange',4,'zuckerstange','#ffffff'),I('Weihnachtsstern',15,'stern','#ffd54f'),I('Lebkuchen',5,'herz','#8d4e24')]}),
];

const EVENT_SPECIALS_IDS={silvester:['glamour','raketenstand','neon'],cny:['drache','loewen','pagode3'],valentin:['rosenranken','pralinen','herzballons'],karneval:['konfettikanonen','luftschlangen','mottowagen'],stpatrick:['kleeblattdach','muenzregen','steinmauer'],ostern:['eierdach','riesenhase','blumenwiese','osterkoerbe'],holi:['farbexplosion','ringelblumen','farbzelt','pulverpyramiden'],sommer:['surfbretter','tikifackeln','eistheke','sandsockel'],einheit:['torfront','mauergraffiti','fahnenbogen','festbeleuchtung'],oktoberfest:['rautendach','lebkuchenwand','fasstheke','breznschild'],halloween:['geister','kesselnebel','augenfenster','toterbaum'],thanksgiving:['erntekranz','truthahn','vogelscheuche','maisbuendel'],advent:['riesenkalender','schneedach','lebkuchenhaus','kalenderfenster','schlitten'],weihnachten:['rentiere','geschenkberg','glitzerschnee','krippe']};
const VBASE={face:'klassisch',eyeColor:'#5b3a1e',hair:'none',hairColor:'#3b2a1e',skin:'#f1c9a5',shirt:'#ffffff',shirt2:'#cccccc',shirt3:'#888888',pattern:'plain',pants:'#333333',hat:'none',hatColor:'#333333',hatColor2:'#ffffff'};
const STAND={
 silvester:['pavillon',['schildlichter','thekenstoff','lametta','sterngirlande','uhr'],{skin:'#c58c64',face:'froh',eyeColor:'#4a2c14',hair:'locken',hairColor:'#2a1a12',shirt:'#ffffff',pants:'#1c1c24',hat:'party',hatColor:'#d9b44a',hatColor2:'#ffffff'}],
 cny:['pagode',['schildlichter'],{skin:'#f2cfa8',shirt:'#f2c14e',pants:'#7a0f12',hat:'cap',hatColor:'#c8161d',hatColor2:'#f2c14e'}],
 valentin:['pavillon',['blumengirlande','blumen'],{skin:'#8d5a3b',shirt:'#ffffff',pants:'#e8496b',hat:'heartband',hatColor:'#ffffff',hatColor2:'#e8496b'}],
 karneval:['zelt',['wimpel'],{skin:'#f5d0b0',shirt:'#1e88e5',shirt2:'#ffffff',shirt3:'#e53935',pattern:'stripes',pants:'#ffe14d',hat:'party',hatColor:'#43a047',hatColor2:'#ffe14d'}],
 stpatrick:['kiosk',['blumen','wimpel'],{skin:'#f6d3b8',shirt:'#43a047',shirt2:'#2e7d32',pattern:'check',pants:'#5d4037',hat:'top',hatColor:'#1b5e20',hatColor2:'#ffd54f'}],
 ostern:['huette',['blumen','blumengirlande'],{skin:'#e9b98f',shirt:'#ffe082',pants:'#81d4fa',hat:'bunny',hatColor:'#f5e6d3',hatColor2:'#f8a5c2'}],
 holi:['zelt',['blumengirlande'],{skin:'#8d5a3b',shirt:'#ffffff',shirt2:'#ffd23f',shirt3:'#2ee07b',pattern:'splash',pants:'#ffffff'}],
 sommer:['strandbar',['blumengirlande'],{skin:'#c68a5d',shirt:'#ff6f61',shirt2:'#ffffff',shirt3:'#ff6f61',pattern:'stripes',pants:'#ffd54f',hat:'cap',hatColor:'#00a6c7',hatColor2:'#ffffff'}],
 einheit:['kiosk',['wimpel','schildlichter'],{skin:'#f1c9a5',shirt:'#dd0000',pants:'#1a1a1a',hat:'cap',hatColor:'#1a1a1a',hatColor2:'#ffce00'}],
 oktoberfest:['huette',['wimpel','blumen'],{skin:'#f5d0b0',shirt:'#2e7d32',pants:'#1565c0',hat:'none'}],
 halloween:['spukhaus',['spinnweben','laternen'],{skin:'#d9d2ea',shirt:'#141414',pants:'#141414',hat:'top',hatColor:'#141414',hatColor2:'#b71c1c'}],
 thanksgiving:['scheune',['blumengirlande','laternen'],{skin:'#a86d4a',shirt:'#c0392b',shirt2:'#3a2a20',pattern:'check',pants:'#3e5b8a',hat:'cap',hatColor:'#7a4a22',hatColor2:'#f1c40f'}],
 advent:['huette',['girlande','eiszapfen','schildlichter'],{skin:'#f3cfb3',shirt:'#5d4037',pants:'#3e2723',hat:'santa',hatColor:'#2e6b34',hatColor2:'#ffffff'}],
 weihnachten:['huette',['girlande','eiszapfen'],{skin:'#e0ac83',shirt:'#2e7d32',pants:'#d32f2f',hat:'party',hatColor:'#2e7d32',hatColor2:'#ffd54f'}],
};
BUILTIN.forEach(b=>{const [st,ex,v]=STAND[b.id];b.shop.style=st;b.shop.extras=ex;b.vendor=Object.assign({},VBASE,v);b.vendorOn=true;b.items=b.items.map(({shape,color})=>({shape,color}));});
const TALK={
 silvester:[{name:'Fiona Funkel',greet:'Prosit! Schon bereit für den Countdown?',idle:'Noch ein paar Stunden bis Mitternacht …',bye:'Guten Rutsch!',click:'Willkommen im Neujahrs-Pavillon!',thanks:'Viel Glück fürs neue Jahr!'},{title:'Neujahrs-Pavillon',subtitle:'Alles für die Silvesternacht',button:'Ansehen',close:'Schließen',bg:'#0d1030',panel:'#1c1f3f',accent:'#ffd65e',text:'#ffffff',radius:'rund'}],
 cny:[{name:'Meister Lin',greet:'新年快乐! Frohes neues Jahr!',idle:'Die Laternen leuchten heute besonders schön.',bye:'Viel Glück und Wohlstand!',click:'Tritt ein in meine Pagode!',thanks:'Möge das Glück dich begleiten!'},{title:'Laternen-Pagode',subtitle:'Glücksbringer zum Neujahrsfest',button:'Ansehen',close:'Schließen',bg:'#3a0808',panel:'#7a0f12',accent:'#f2c14e',text:'#fff4dc',radius:'eckig'}],
 valentin:[{name:'Rosa',greet:'Hallo! Suchst du etwas für dein Herzblatt?',idle:'Liebe liegt in der Luft …',bye:'Einen schönen Valentinstag!',click:'Willkommen im Herz-Pavillon!',thanks:'Das kommt von Herzen!'},{title:'Herz-Pavillon',subtitle:'Kleine Zeichen der Zuneigung',button:'Ansehen',close:'Schließen',bg:'#fff0f4',panel:'#ffffff',accent:'#e8496b',text:'#5b2a3c',radius:'rund'}],
 karneval:[{name:'Jupp Jeck',greet:'Helau und Alaaf! Komm näher!',idle:'Wo sind nur meine Kamelle hin?',bye:'Tschö und bis Rosenmontag!',click:'Hereinspaziert ins Narrenzelt!',thanks:'Dreimal Helau!'},{title:'Narrenzelt',subtitle:'Kostüme, Kamelle, Konfetti',button:'Ansehen',close:'Schließen',bg:'#1e88e5',panel:'#ffffff',accent:'#e53935',text:'#1a1a1a',radius:'pixel'}],
 stpatrick:[{name:'Finn',greet:'Hallo! Auf der Suche nach Glück?',idle:'Irgendwo am Ende des Regenbogens …',bye:'Möge dir das Glück hold sein!',click:'Willkommen in Finns Glückskiosk!',thanks:'Ein Kleeblatt für dich!'},{title:'Finns Glückskiosk',subtitle:'Alles in Grün',button:'Ansehen',close:'Schließen',bg:'#1b3d1d',panel:'#2e7d32',accent:'#ffd54f',text:'#ffffff',radius:'rund'}],
 ostern:[{name:'Hanni Hase',greet:'Frohe Ostern! Schon Eier gefunden?',idle:'Psst, im Gras ist noch eins versteckt.',bye:'Fröhliches Eiersuchen!',click:'Willkommen in der Osterhütte!',thanks:'Frisch bemalt, nur für dich!'},{title:'Osterhütte',subtitle:'Bunte Eier und Frühlingsblumen',button:'Ansehen',close:'Schließen',bg:'#fff8e6',panel:'#ffffff',accent:'#7e57c2',text:'#3f2d63',radius:'rund'}],
 holi:[{name:'Priya',greet:'Holi Hai! Lust auf Farbe?',idle:'Pink oder Gelb … warum nicht beides?',bye:'Bleib bunt!',click:'Willkommen im Farbenzelt!',thanks:'Viel Spaß beim Werfen!'},{title:'Farbenzelt',subtitle:'Gulal in allen Farben',button:'Ansehen',close:'Schließen',bg:'#fff3d6',panel:'#ffffff',accent:'#ff4fa3',text:'#3d1a4f',radius:'rund'}],
 sommer:[{name:'Kai',greet:'Hey! Endlich Sommerferien!',idle:'Heute wird’s richtig heiß.',bye:'Schöne Ferien!',click:'Willkommen an Kais Strandbar!',thanks:'Lass es dir schmecken!'},{title:'Kais Strandbar',subtitle:'Erfrischung und Strandspaß',button:'Ansehen',close:'Schließen',bg:'#e0f7ff',panel:'#ffffff',accent:'#00a6c7',text:'#0b3a4a',radius:'rund'}],
 einheit:[{name:'Greta',greet:'Hallo! Schön, dass du zum Feiertag da bist.',idle:'Ein schöner Tag zum Feiern.',bye:'Einen schönen Feiertag!',click:'Willkommen am Einheits-Kiosk!',thanks:'Danke dir!'},{title:'Einheits-Kiosk',subtitle:'Zum 3. Oktober',button:'Ansehen',close:'Schließen',bg:'#f4f4f4',panel:'#ffffff',accent:'#dd0000',text:'#1a1a1a',radius:'eckig'}],
 oktoberfest:[{name:'Resi',greet:'Servus! Grüß Gott!',idle:'Die Brezn san heit bsonders guad.',bye:'Pfiat di!',click:'Griaß di in der Wiesn-Hüttn!',thanks:'Lass da’s schmecka!'},{title:'Wiesn-Hüttn',subtitle:'Brezn, Herzerl und Tracht',button:'Ansehen',close:'Schließen',bg:'#e3f2ff',panel:'#ffffff',accent:'#1565c0',text:'#0d2b4f',radius:'eckig'}],
 halloween:[{name:'Graf Gruselig',greet:'Buuuh! Süßes oder Saures?',idle:'Hast du das auch gehört?',bye:'Schlaf gut … wenn du kannst!',click:'Willkommen in meinem Spukhaus …',thanks:'Muahaha, gute Wahl!'},{title:'Spukhaus',subtitle:'Gruseliges für die Geisternacht',button:'Ansehen',close:'Schließen',bg:'#120a1f',panel:'#2b2136',accent:'#ff7a1a',text:'#f3e9ff',radius:'pixel'}],
 thanksgiving:[{name:'Martha',greet:'Happy Thanksgiving! Komm rein!',idle:'Der Kürbiskuchen ist gleich fertig.',bye:'Schönes Erntefest!',click:'Willkommen in der Erntescheune!',thanks:'Frisch vom Feld!'},{title:'Erntescheune',subtitle:'Herbstliches aus der Scheune',button:'Ansehen',close:'Schließen',bg:'#fff1dc',panel:'#ffffff',accent:'#c0392b',text:'#3e2516',radius:'eckig'}],
 advent:[{name:'Elias',greet:'Grüß dich! Ist dein Stiefel schon geputzt?',idle:'Bald kommt der Nikolaus …',bye:'Eine schöne Adventszeit!',click:'Willkommen am Adventsmarkt!',thanks:'Frisch gebacken!'},{title:'Adventsmarkt',subtitle:'Lebkuchen, Kerzen und Punsch',button:'Ansehen',close:'Schließen',bg:'#16244a',panel:'#24335f',accent:'#ffd166',text:'#fdf6e3',radius:'rund'}],
 weihnachten:[{name:'Wichtel Wim',greet:'Ho ho ho! Frohe Weihnachten!',idle:'Hast du schon alle Geschenke?',bye:'Frohe Festtage!',click:'Willkommen in der Weihnachtshütte!',thanks:'Gut eingepackt!'},{title:'Weihnachtshütte',subtitle:'Geschenke und Glanz',button:'Ansehen',close:'Schließen',bg:'#0c1a3a',panel:'#c62828',accent:'#ffd54f',text:'#ffffff',radius:'rund'}],
};
BUILTIN.forEach(b=>{b.talk=TALK[b.id][0];b.ui=TALK[b.id][1];});
const RARITY={gewoehnlich:['Gewöhnlich','#9aa6bf',6],selten:['Selten','#3ea6ff',4],episch:['Episch','#b36bff',2],legendaer:['Legendär','#ffb300',1]};
const RK=['gewoehnlich','selten','episch','legendaer'];
const INTERVALS={'30':'30 Sekunden','60':'1 Minute','300':'5 Minuten','900':'15 Minuten','3600':'1 Stunde','21600':'6 Stunden','86400':'24 Stunden'};
const PATTERNS_UI={keine:'Kein Muster',streifen:'Streifen',punkte:'Punkte',sterne:'Sterne',herzen:'Herzen',raute:'Raute'};
const P=(name,shape,color,r)=>({name,shape,color,rarity:RK[r]});
const POOL={
 silvester:[['Partyhut','partyhut','#ffd65e',0],['Glücksklee','klee','#3fae5a',0],['Wunderkerze','stern','#ffe28a',1],['Tischrakete','rakete','#ff5fa2',1],['Glücksmünze','muenze','#d9b44a',0],['Goldene Krone','krone','#d9b44a',3],['Konfetti-Bonbon','bonbon','#c9d1e8',0],['Mitternachts-Geschenk','geschenk','#1c1c24',2]],
 cny:[['Rote Umschläge','geschenk','#d4161d',0],['Laterne','laterne','#e0242b',1],['Mandarine','kugel','#ff8a1f',0],['Glückskrone','krone','#f2c14e',3],['Goldmünze','muenze','#f2c14e',0],['Glücksbonbon','bonbon','#e0242b',0],['Feuerwerksrakete','rakete','#f2c14e',2],['Teeschale','tasse','#c8161d',1]],
 valentin:[['Herzkissen','herz','#ff4d79',1],['Pralinen','geschenk','#c2185b',0],['Rote Rose','blume','#e3123b',0],['Liebesbonbon','bonbon','#ff9fbd',0],['Goldenes Herz','herz','#ffd54f',3],['Kakaotasse','tasse','#8d4e24',0],['Herzkrone','krone','#ff4d79',2],['Sternenwunsch','stern','#ff9fbd',1]],
 karneval:[['Narrenkrone','krone','#ffe14d',2],['Kamelle','bonbon','#e53935',0],['Clownsnase','kugel','#ff2d2d',0],['Konfetti-Kanone','rakete','#1e88e5',1],['Narrenhut','partyhut','#43a047',1],['Goldener Orden','muenze','#ffe14d',3],['Strüßje','blume','#e53935',0],['Pappnasen-Paket','geschenk','#1e88e5',0]],
 stpatrick:[['Kleeblatt','klee','#43a047',0],['Goldmünze','muenze','#ffcf33',1],['Grüner Krug','tasse','#2e7d32',0],['Glückshut','partyhut','#2e7d32',1],['Goldenes Kleeblatt','klee','#ffd54f',3],['Regenbogenbonbon','bonbon','#fb8c00',0],['Kobold-Geschenk','geschenk','#2e7d32',2],['Wiesenblume','blume','#66bb6a',0]],
 ostern:[['Bemaltes Ei','ei','#81d4fa',0],['Schoko-Ei','ei','#8d5a3b',0],['Tulpe','blume','#f06292',0],['Osterbonbon','bonbon','#ffe082',0],['Goldenes Ei','ei','#ffd54f',3],['Osterkörbchen','geschenk','#c5e1a5',1],['Frühlingsstern','stern','#f8a5c2',1],['Glitzer-Ei','ei','#b39ddb',2]],
 holi:[['Pink-Pulver','kugel','#ff4fa3',0],['Gelb-Pulver','kugel','#ffd23f',0],['Blau-Pulver','kugel','#3ec6ff',0],['Grün-Pulver','kugel','#2ee07b',1],['Gujiya','bonbon','#e0a458',0],['Wasserrakete','rakete','#2ee07b',1],['Ringelblume','blume','#ff9800',0],['Regenbogen-Stern','stern','#7a2cff',3],['Farbkrone','krone','#ff4fa3',2]],
 sommer:[['Erdbeer-Eis','eis','#ff7aa2',0],['Zitronen-Eis','eis','#ffe76b',0],['Wasserball','kugel','#ffd54f',1],['Limonade','tasse','#ffe76b',0],['Seestern','stern','#ff8a65',1],['Sonnenkrone','krone','#ffb300',3],['Strandblume','blume','#ff6f61',0],['Sommer-Paket','geschenk','#00a6c7',2]],
 einheit:[['Fähnchen','fahne','#dd0000',0],['Mauerstück','geschenk','#9e9e9e',2],['Anstecker','muenze','#ffce00',0],['Festtagsbrezel','brezel','#a0612b',0],['Einheits-Stern','stern','#ffce00',1],['Jubiläumsmünze','muenze','#ffd54f',3],['Feierbonbon','bonbon','#dd0000',0],['Festkrug','tasse','#1a1a1a',1]],
 oktoberfest:[['Brezn','brezel','#a0612b',0],['Lebkuchenherz','herz','#8d4e24',0],['Maßkrug','tasse','#e3edf5',1],['Trachtenhut','partyhut','#3e5b2e',1],['Goldene Brezn','brezel','#ffcf33',3],['Edelweiß','blume','#ffffff',2],['Zuckerl','bonbon','#1565c0',0],['Wiesn-Herz','herz','#e53935',0]],
 halloween:[['Kürbislaterne','kuerbis','#ff7a1a',0],['Süßes','bonbon','#9c4dff',0],['Hexenkessel','tasse','#1d1d1d',1],['Spukhut','partyhut','#16121c',1],['Geisterkugel','kugel','#7cff6b',2],['Gruselkrone','krone','#9c4dff',3],['Fledermaus-Bonbon','bonbon','#1d1d1d',0],['Grabkerze','kerze','#ff7a1a',0]],
 thanksgiving:[['Kürbiskuchen','kuchen','#e67e22',1],['Zierkürbis','kuerbis','#f39c12',0],['Apfel','kugel','#c0392b',0],['Cider','tasse','#b5651d',0],['Goldener Kürbis','kuerbis','#ffd54f',3],['Herbstblume','blume','#e67e22',0],['Erntekrone','krone','#c0392b',2],['Maisbonbon','bonbon','#f1c40f',0]],
 advent:[['Lebkuchen','herz','#8d4e24',0],['Nikolausstiefel','stiefel','#b71c1c',1],['Kinderpunsch','tasse','#c62828',0],['Bienenwachskerze','kerze','#ffd166',0],['Goldener Stern','stern','#ffd166',2],['Zuckerstange','zuckerstange','#ffffff',0],['Advents-Geschenk','geschenk','#2e6b34',1],['Silberner Stiefel','stiefel','#c0c7d0',3]],
 weihnachten:[['Geschenk','geschenk','#d32f2f',0],['Christbaumkugel','kugel','#ffd54f',0],['Zuckerstange','zuckerstange','#ffffff',0],['Weihnachtsstern','stern','#ffd54f',1],['Lebkuchen','herz','#8d4e24',0],['Silberkugel','kugel','#c0c7d0',1],['Engelskrone','krone','#ffd54f',3],['Großes Geschenk','geschenk','#2e7d32',2]],
};
const UIX={silvester:['sterne','300','Frische Ware für die Silvesternacht!'],cny:['punkte','300','Neue Glücksbringer sind eingetroffen!'],valentin:['herzen','300','Neue Herzensstücke sind da!'],karneval:['streifen','60','Nachschub für alle Jecken!'],stpatrick:['punkte','300','Neues Glück im Regal!'],ostern:['punkte','300','Der Osterhase hat nachgeliefert!'],holi:['punkte','60','Frische Farben sind da!'],sommer:['streifen','300','Neue Sommer-Schätze!'],einheit:['streifen','900','Neue Festtagsware ist da!'],oktoberfest:['raute','300','Frische Ware, frisch g’liefert!'],halloween:['sterne','300','Neue Gruselware … muahaha!'],thanksgiving:['streifen','900','Frisch geerntet und neu im Regal!'],advent:['sterne','300','Neue Leckereien am Adventsmarkt!'],weihnachten:['sterne','300','Der Weihnachtsmann hat nachgeliefert!']};
BUILTIN.forEach(b=>{b.pool=POOL[b.id].map(a=>P(...a));const x=UIX[b.id];Object.assign(b.ui,{pattern:x[0],interval:x[1],slots:'5'});b.talk.restock=x[2];});
const ITYPES={item:'Gegenstand',hut:'Hut',aura:'Aura',emote:'Emote'};
const EMOTES={tanzen:'Tanzen',huepfen:'Hüpfen',drehen:'Drehen',winken:'Winken'};
const PRICE={gewoehnlich:25,selten:60,episch:150,legendaer:400};
const COSM={silvester:['party','Glitzer-Partyhut','Funkenregen','huepfen','Countdown-Hüpfer'],cny:['cap','Glückskappe','Drachenfunken','drehen','Drachentanz'],valentin:['heartband','Herz-Haarreif','Herzchen-Wolke','winken','Luftkuss'],karneval:['jester','Narrenkappe','Konfetti-Wirbel','tanzen','Schunkeln'],stpatrick:['top','Kobold-Zylinder','Kleeblatt-Glanz','tanzen','Irischer Stepptanz'],ostern:['bunny','Hasenohren','Frühlingsblüten','huepfen','Hasenhüpfer'],holi:['party','Farbenhut','Farbwolke','drehen','Farbwirbel'],sommer:['sun','Strohhut & Brille','Sonnenglitzer','tanzen','Strandtanz'],einheit:['cap','Feiertags-Kappe','Schwarz-Rot-Gold-Funken','winken','Fähnchenschwenken'],oktoberfest:['tyrol','Trachtenhut','Brezn-Glanz','tanzen','Schuhplattler'],halloween:['witch','Hexenhut','Geisternebel','drehen','Gruseldreher'],thanksgiving:['pilgrim','Pilgerhut','Herbstlaub-Wirbel','winken','Danke-Winken'],advent:['mitre','Nikolausmütze','Schneeflocken','huepfen','Stiefel-Hüpfer'],weihnachten:['santa','Weihnachtsmütze','Sternenstaub','tanzen','Weihnachtstanz']};
BUILTIN.forEach(b=>{const c=COSM[b.id],p=b.palette;b.pool.forEach(it=>{it.type='item';it.price=PRICE[it.rarity];});
  b.pool.push({name:c[1],type:'hut',hat:c[0],color:p[0],color2:p[1]||'#ffffff',shape:'krone',rarity:'episch',price:180},{name:c[2],type:'aura',color:p[0],color2:p[1]||'#ffffff',shape:'stern',rarity:'selten',price:90},{name:c[4],type:'emote',emote:c[3],color:p[0],shape:'kugel',rarity:'legendaer',price:350});});

const RADII={rund:'Rund',eckig:'Eckig',pixel:'Pixel / Comic'};
BUILTIN.forEach(b=>{b.avatar=Object.assign({face:'klassisch',eyeColor:'#5b3a1e',hair:'none',hairColor:'#3b2a1e'},b.avatar);});
BUILTIN.forEach(b=>{b.shop.extras=b.shop.extras.concat(EVENT_SPECIALS_IDS[b.id]||[]);});
const FALLBACK={shop:{style:'kiosk',extras:[]},vendor:VBASE,avatar:BUILTIN[0].avatar,talk:{restock:'Neue Ware ist da!',name:'Shopbesitzer',greet:'Hallo und willkommen!',idle:'Schau dich ruhig um.',bye:'Bis bald!',click:'Willkommen an meinem Stand!',thanks:'Gute Wahl!'},ui:{pattern:'punkte',interval:'300',slots:'5',title:'',subtitle:'',button:'Ansehen',close:'Schließen',bg:'#1a1d29',panel:'#222637',accent:'#ffc93c',text:'#ffffff',radius:'rund'}};
function normalize(e){const b=BUILTIN.find(x=>x.id===e.id)||FALLBACK;for(const k of ['shop','avatar','vendor','talk','ui'])e[k]=Object.assign(clone(b[k]||{}),e[k]||{});
  if(!Array.isArray(e.shop.extras))e.shop.extras=[];if(e.vendorOn===undefined)e.vendorOn=true;if(!Array.isArray(e.items))e.items=[];e.items=e.items.map(({shape,color})=>({shape,color}));if(!Array.isArray(e.decor))e.decor=[];if(!Array.isArray(e.pool))e.pool=clone(b.pool||(e.items||[]).map(it=>({name:SHAPES[it.shape]||it.shape,shape:it.shape,color:it.color,rarity:'gewoehnlich'})));if(!Array.isArray(e.palette)||!e.palette.length)e.palette=['#ffffff'];e.pool.forEach(it=>{if(!it.type)it.type='item';if(it.price==null||it.price==='')it.price=PRICE[it.rarity]||25;});if(e.shop.calEarly===undefined)e.shop.calEarly=true;return e;}

/* ---------- Datumslogik ---------- */
const D=(y,m,d)=>new Date(y,m-1,d);
const addD=(d,n)=>new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);
function easter(y){const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=((h+l-7*m+114)%31)+1;return D(y,mo,da);}
const CNY={2025:[1,29],2026:[2,17],2027:[2,6],2028:[1,26],2029:[2,13],2030:[2,3]};
const HOLI={2025:[3,14],2026:[3,4],2027:[3,22],2028:[3,11],2029:[3,1],2030:[3,20]};
const WHEN={
 silvester:y=>[D(y,12,31),D(y+1,1,1)],
 cny:y=>CNY[y]&&[D(y,...CNY[y]),addD(D(y,...CNY[y]),14)],
 valentin:y=>[D(y,2,14),D(y,2,14)],
 karneval:y=>{const e=easter(y);return[addD(e,-52),addD(e,-46)];},
 stpatrick:y=>[D(y,3,17),D(y,3,17)],
 ostern:y=>{const e=easter(y);return[addD(e,-2),addD(e,1)];},
 holi:y=>HOLI[y]&&[addD(D(y,...HOLI[y]),-1),D(y,...HOLI[y])],
 sommer:y=>[D(y,6,21),D(y,9,15)],
 einheit:y=>[D(y,10,3),D(y,10,3)],
 oktoberfest:y=>{let s=D(y,10,1);while(s.getDay()!==0)s=addD(s,1);const end=s<D(y,10,3)?D(y,10,3):s;return[addD(s,-15),end];},
 halloween:y=>[D(y,10,31),D(y,10,31)],
 thanksgiving:y=>{let d=D(y,11,1);while(d.getDay()!==4)d=addD(d,1);d=addD(d,21);return[d,d];},
 advent:y=>{let a4=D(y,12,24);while(a4.getDay()!==0)a4=addD(a4,-1);return[addD(a4,-21),D(y,12,23)];},
 weihnachten:y=>[D(y,12,24),D(y,12,26)],
};
const now=new Date(); const TODAY=D(now.getFullYear(),now.getMonth()+1,now.getDate());
let ZEIT={};
function rangeFor(id,y){const z=ZEIT[id];if(z&&z.modus==='aus')return null;if(z&&z.modus==='fest'&&/^\d{2}-\d{2}$/.test(z.start)&&/^\d{2}-\d{2}$/.test(z.ende)){const [sm,sd]=z.start.split('-').map(Number),[em,ed]=z.ende.split('-').map(Number);const a=D(y,sm,sd);let b=D(y,em,ed);if(b<a)b=D(y+1,em,ed);return[a,b];}const f=WHEN[id];return f?f(y):null;}
function nextOcc(id){const Y=TODAY.getFullYear();for(const y of [Y-1,Y,Y+1,Y+2]){const r=rangeFor(id,y);if(r&&r[1]>=TODAY)return r;}return null;}
const pad=n=>String(n).padStart(2,'0');
const fmt=d=>`${d.getDate()}.${d.getMonth()+1}.${d.getFullYear()}`;
function fmtRange([a,b]){if(+a===+b)return fmt(a);if(a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth())return `${a.getDate()}.–${fmt(b)}`;if(a.getFullYear()===b.getFullYear())return `${a.getDate()}.${a.getMonth()+1}.–${fmt(b)}`;return `${fmt(a)} – ${fmt(b)}`;}
function status(r){if(!r)return null;if(r[0]<=TODAY&&TODAY<=r[1])return{cls:'live',txt:'Läuft gerade',days:0};const d=Math.round((r[0]-TODAY)/864e5);return{cls:d<=14?'soon':'',txt:d===1?'morgen':`in ${d} Tagen`,days:d};}
$('#todayLbl').textContent='Heute '+`${pad(TODAY.getDate())}.${pad(TODAY.getMonth()+1)}.${TODAY.getFullYear()}`;

/* ---------- Speicher (nur in diesem Browser: Münzen, Käufe, Türchen, zuletzt gewähltes Event) ---------- */
const KEY='coinmaster.eventlaeden';
let store={current:null};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s==='object')store=Object.assign(store,s);}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(store));}catch(e){}}
function getEvent(id){const b=BUILTIN.find(e=>e.id===id);return b?normalize(clone(b)):null;}
function allIds(){return BUILTIN.map(e=>e.id);}

let cur=null;
function pickDefault(){
  if(store.current&&getEvent(store.current))return store.current;
  let best=null,bd=1e9;for(const e of BUILTIN){const s=status(nextOcc(e.id));if(s&&s.days<bd){bd=s.days;best=e.id;}}return best||'weihnachten';
}

/* ---------- Three.js Grundgerüst ---------- */
const canvas=$('#c'); const stage=$('#stage');
const renderer=new T.WebGLRenderer({canvas,antialias:true});
renderer.setPixelRatio(pixelRatio());
renderer.shadowMap.enabled=true; renderer.shadowMap.type=T.PCFSoftShadowMap;
const scene=new T.Scene();
const camera=new T.PerspectiveCamera(42,1,0.1,400);
const hemi=new T.HemisphereLight(0xffffff,0x555566,0.75); scene.add(hemi);
const sun=new T.DirectionalLight(0xffffff,0.85); sun.position.set(12,22,10); sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048); Object.assign(sun.shadow.camera,{left:-14,right:14,top:14,bottom:-14,near:1,far:60}); sun.shadow.bias=-0.0006; scene.add(sun);
const shopLight=new T.PointLight(0xffc27a,0,12,2); shopLight.position.set(0,PY+2.4,0.6); scene.add(shopLight);

const M=(color,o={})=>new T.MeshStandardMaterial(Object.assign({color,roughness:.72,metalness:0},o));
function mesh(geo,mat,x=0,y=0,z=0,parent){const m=new T.Mesh(geo,(typeof mat==='string'||typeof mat==='number')?M(mat):mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;if(parent)parent.add(m);return m;}
const BX=(w,h,d)=>new T.BoxGeometry(w,h,d);
const CY=(rt,rb,h,s=20)=>new T.CylinderGeometry(rt,rb,h,s);
const SP=(r,w=18,h=14)=>new T.SphereGeometry(r,w,h);
function canvasTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.anisotropy=4;return t;}
const glow=(c,i=1)=>M(c,{emissive:c,emissiveIntensity:i,roughness:.4});

// Statische Bühne
const ground=mesh(new T.CircleGeometry(90,64),'#888',0,0,0,scene); ground.rotation.x=-Math.PI/2; ground.castShadow=false;
const podium=mesh(CY(9,9.4,PY,64),'#fff',0,PY/2,0,scene);
const podiumTrim=mesh(CY(9.06,9.06,0.16,64),'#d4af37',0,PY-0.12,0,scene);
const podiumBase=mesh(CY(9.6,9.8,0.22,64),'#ccc',0,0.11,0,scene);
const steps=new T.Group(); scene.add(steps);
for(let i=0;i<3;i++){mesh(BX(3.2,PY*(i+1)/3,0.55),'#fff',0,PY*(i+1)/6,9.75-i*0.5,steps);}

const themeG=new T.Group(); scene.add(themeG);
const walker=new T.Group(); scene.add(walker);
let anims=[];

function disposeTree(o){o.traverse(n=>{if(n.geometry)n.geometry.dispose();if(n.material){(Array.isArray(n.material)?n.material:[n.material]).forEach(m=>{if(m.map)m.map.dispose();if(m.emissiveMap&&m.emissiveMap!==m.map)m.emissiveMap.dispose();m.dispose();});}});}
function clearGroup(g){for(const c of [...g.children]){g.remove(c);disposeTree(c);}}

/* ---------- Formen ---------- */
function heartShape(){const s=new T.Shape();s.moveTo(0,-0.5);s.bezierCurveTo(-0.12,-0.36,-0.5,-0.16,-0.5,0.14);s.bezierCurveTo(-0.5,0.42,-0.18,0.52,0,0.3);s.bezierCurveTo(0.18,0.52,0.5,0.42,0.5,0.14);s.bezierCurveTo(0.5,-0.16,0.12,-0.36,0,-0.5);return s;}
function starShape(n=5,r1=.5,r2=.22){const s=new T.Shape();for(let i=0;i<n*2;i++){const r=i%2?r2:r1,a=i*Math.PI/n+Math.PI/2;const x=Math.cos(a)*r,y=Math.sin(a)*r;i?s.lineTo(x,y):s.moveTo(x,y);}s.closePath();return s;}
const ext=(shape,depth=.14)=>{const g=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.04,bevelThickness:.04,bevelSegments:2,curveSegments:14});g.center();return g;};
function stripeTex(cols,dir='v',n=8){return canvasTex(128,128,(x,w,h)=>{for(let i=0;i<n;i++){x.fillStyle=cols[i%cols.length];dir==='v'?x.fillRect(i*w/n,0,w/n+1,h):x.fillRect(0,i*h/n,w,h/n+1);}});}

function makeItem(shape,c,pal){
  const g=new T.Group();
  switch(shape){
  case 'geschenk':{mesh(BX(.5,.42,.5),c,0,.21,0,g);const r='#fff3c4';mesh(BX(.52,.43,.09),r,0,.21,0,g);mesh(BX(.09,.43,.52),r,0,.21,0,g);const b1=mesh(new T.TorusGeometry(.08,.03,6,14),r,-.07,.46,0,g);b1.rotation.y=.5;const b2=mesh(new T.TorusGeometry(.08,.03,6,14),r,.07,.46,0,g);b2.rotation.y=-.5;break;}
  case 'kugel':mesh(SP(.24),M(c,{roughness:.25,metalness:.25}),0,.24,0,g);mesh(CY(.06,.06,.08,10),'#d8c27a',0,.5,0,g);break;
  case 'ei':{const e=mesh(SP(.2,20,16),c,0,.27,0,g);e.scale.y=1.35;const b=mesh(new T.TorusGeometry(.2,.03,6,26),'#ffffff',0,.27,0,g);b.rotation.x=Math.PI/2;break;}
  case 'eis':{const k=mesh(new T.ConeGeometry(.15,.38,14),'#d9a35b',0,.19,0,g);k.rotation.x=Math.PI;mesh(SP(.17),c,0,.42,0,g);mesh(SP(.04,8,6),'#d81b60',0,.6,0,g);break;}
  case 'herz':{const m=mesh(ext(heartShape()),c,0,.3,0,g);m.scale.setScalar(.6);break;}
  case 'stern':{const m=mesh(ext(starShape()),M(c,{emissive:c,emissiveIntensity:.25}),0,.32,0,g);m.scale.setScalar(.65);break;}
  case 'tasse':mesh(CY(.16,.15,.36),c,0,.18,0,g);mesh(new T.TorusGeometry(.1,.03,8,16),c,.17,.18,0,g);mesh(CY(.155,.155,.05),'#fff8e1',0,.37,0,g);break;
  case 'kerze':mesh(CY(.17,.19,.05),'#c9a227',0,.025,0,g);mesh(CY(.08,.08,.4),c,0,.24,0,g);mesh(new T.ConeGeometry(.05,.13,8),glow('#ffb300',1.2),0,.5,0,g);break;
  case 'kuerbis':{const p=mesh(SP(.25,16,12),c,0,.2,0,g);p.scale.y=.78;mesh(CY(.03,.04,.12,8),'#4e6b2a',0,.42,0,g);break;}
  case 'laterne':{const b=mesh(SP(.22,16,12),glow(c,.45),0,.27,0,g);b.scale.y=.95;mesh(CY(.12,.12,.06),'#f2c14e',0,.5,0,g);mesh(CY(.12,.12,.06),'#f2c14e',0,.04,0,g);break;}
  case 'klee':{for(let i=0;i<3;i++){const a=Math.PI/2+i*2*Math.PI/3;const l=mesh(SP(.13,14,10),c,Math.cos(a)*.12,.4+Math.sin(a)*.12,0,g);l.scale.z=.35;}mesh(BX(.04,.3,.04),'#2e7d32',0,.15,0,g);break;}
  case 'bonbon':{const b=mesh(SP(.16),c,0,.18,0,g);b.scale.x=1.3;const l=mesh(new T.ConeGeometry(.1,.16,10),c,-.28,.18,0,g);l.rotation.z=-Math.PI/2;const r=mesh(new T.ConeGeometry(.1,.16,10),c,.28,.18,0,g);r.rotation.z=Math.PI/2;break;}
  case 'brezel':{const b=mesh(new T.TorusKnotGeometry(.15,.05,64,8,2,3),c,0,.28,0,g);b.scale.z=.55;break;}
  case 'rakete':mesh(CY(.08,.08,.38),c,0,.26,0,g);mesh(new T.ConeGeometry(.08,.16,12),'#ffffff',0,.53,0,g);for(let i=0;i<3;i++){const f=mesh(BX(.02,.12,.12),'#ffffff',Math.cos(i*2.1)*.08,.1,Math.sin(i*2.1)*.08,g);f.rotation.y=-i*2.1;}break;
  case 'krone':{const m=M(c,{metalness:.6,roughness:.3,side:T.DoubleSide});mesh(new T.CylinderGeometry(.22,.22,.18,18,1,true),m,0,.12,0,g);for(let i=0;i<6;i++){const a=i*Math.PI/3;mesh(new T.ConeGeometry(.05,.16,8),m,Math.cos(a)*.21,.29,Math.sin(a)*.21,g);}mesh(SP(.04),'#e53935',0,.13,.22,g);break;}
  case 'partyhut':mesh(new T.ConeGeometry(.19,.48,16),c,0,.24,0,g);mesh(SP(.06),'#ffffff',0,.5,0,g);break;
  case 'blume':{mesh(CY(.02,.02,.42,6),'#3f8f3a',0,.21,0,g);for(let i=0;i<6;i++){const a=i*Math.PI/3;const p=mesh(SP(.08,10,8),c,Math.cos(a)*.1,.46+Math.sin(a)*.1,0,g);p.scale.z=.4;}mesh(SP(.06,10,8),'#ffd54f',0,.46,.02,g);break;}
  case 'muenze':{const m=mesh(CY(.22,.22,.06,24),M(c,{metalness:.7,roughness:.3}),0,.24,0,g);m.rotation.x=Math.PI/2;break;}
  case 'fahne':{mesh(CY(.015,.015,.6,6),'#6d4c41',0,.3,0,g);const t=canvasTex(64,48,(x,w,h)=>{const p=pal&&pal.length>=3?pal:[c,c,c];for(let i=0;i<3;i++){x.fillStyle=p[i];x.fillRect(0,i*h/3,w,h/3+1);}});mesh(BX(.34,.22,.01),new T.MeshStandardMaterial({map:t}),.18,.48,0,g);break;}
  case 'kuchen':mesh(CY(.26,.24,.13,24),c,0,.08,0,g);{const r=mesh(new T.TorusGeometry(.24,.04,8,28),'#d9a35b',0,.15,0,g);r.rotation.x=Math.PI/2;}mesh(SP(.06,10,8),'#fffbee',0,.18,0,g);break;
  case 'stiefel':mesh(BX(.2,.32,.2),c,0,.24,0,g);mesh(BX(.32,.13,.2),c,.06,.065,0,g);mesh(BX(.24,.09,.24),'#ffffff',0,.43,0,g);break;
  case 'zuckerstange':{const t=stripeTex(['#e53935','#ffffff'],'h',10);const m=new T.MeshStandardMaterial({map:t});mesh(CY(.04,.04,.42,12),m,0,.21,0,g);const h=mesh(new T.TorusGeometry(.09,.04,8,16,Math.PI),m,.09,.42,0,g);break;}
  default:mesh(BX(.4,.4,.4),c,0,.2,0,g);
  }
  return g;
}

/* ---------- Stand ---------- */
const STYLES={kiosk:'Kiosk mit Markise',huette:'Holzhütte',pagode:'Pagode',strandbar:'Strandbar',zelt:'Festzelt',pavillon:'Pavillon',spukhaus:'Spukhaus',scheune:'Scheune'};
const EXTRAS={girlande:'Tannengirlande',blumengirlande:'Blumengirlande',eiszapfen:'Eiszapfen',spinnweben:'Spinnweben',blumen:'Blumenkästen',schildlichter:'Schild-Lichter',wimpel:'Wimpel',laternen:'Laternen am Stand',thekenstoff:'Thekenverkleidung',lametta:'Lametta',sterngirlande:'Sternenvorhang',uhr:'Mitternachtsuhr'};
const SHOP={W:5.6,D:3.4};
let EAVE={y:PY+3,z:2,w:6};
function signTexture(text,bg,fg,ratio){const H=Math.max(110,Math.min(512,Math.round(1024/ratio)));return canvasTex(1024,H,(x,w,h)=>{x.fillStyle=bg;x.fillRect(0,0,w,h);x.strokeStyle=fg;x.globalAlpha=.35;x.lineWidth=8;x.strokeRect(12,12,w-24,h-24);x.globalAlpha=1;
  let size=Math.round(h*.62);x.textAlign='center';x.textBaseline='middle';const fam='"Lilita One", "Arial Black", Impact, sans-serif';
  do{x.font=`${size}px ${fam}`;size-=4;}while(x.measureText(text).width>w-80&&size>20);
  x.fillStyle='rgba(0,0,0,.25)';x.fillText(text,w/2+4,h/2+7);x.fillStyle=fg;x.fillText(text,w/2,h/2+3);});}
function addSign(e,g,o){const s=e.shop;const sg=new T.Group();sg.position.set(o.x||0,o.y,o.z);sg.rotation.x=-(o.tilt||0);sg.rotation.z=o.rotZ||0;g.add(sg);
  mesh(BX(o.w,o.h,.2),s.signBg,0,0,0,sg);
  if(o.legs)for(const sx of [-1,1])mesh(BX(.14,o.legs,.14),e.trim,sx*o.w*.34,-o.h/2-o.legs/2+.05,-.02,sg);
  const tex=signTexture(s.sign||e.name,s.signBg,s.signFg,o.w/o.h);
  const sp=new T.Mesh(new T.PlaneGeometry(o.w*.95,o.h*.88),new T.MeshStandardMaterial({map:tex,roughness:.6,emissive:e.night?0xffffff:0x000000,emissiveMap:tex,emissiveIntensity:e.night?.35:0}));sp.position.z=.105;sg.add(sp);
  return {g:sg,w:o.w,h:o.h};}
function plankTex(c){return canvasTex(128,128,(x,w,h)=>{x.fillStyle=c;x.fillRect(0,0,w,h);x.fillStyle='rgba(0,0,0,.2)';for(let i=1;i<8;i++)x.fillRect(0,i*16-1,w,2);x.fillStyle='rgba(255,255,255,.07)';for(let i=0;i<8;i++)x.fillRect((i*37)%w,i*16+4,30,3);});}
const plank=c=>new T.MeshStandardMaterial({map:plankTex(c),roughness:.85});
function walls(g,yb,H,mat){const {W,D}=SHOP;mesh(BX(W,H,.2),mat,0,yb+H/2,-D/2+.1,g);mesh(BX(.2,H,D-.2),mat,-W/2+.1,yb+H/2,0,g);mesh(BX(.2,H,D-.2),mat,W/2-.1,yb+H/2,0,g);}
function frontPosts(g,yb,H,c){const {W,D}=SHOP;for(const sx of [-1,1])mesh(BX(.22,H,.22),c,sx*(W/2-.11),yb+H/2,D/2-.11,g);}
function halfDisc(r,c,parent,x,y,z,tilt=0){const m=mesh(new T.CylinderGeometry(r,r,.07,16,1,false,Math.PI/2,Math.PI),c,x,y,z,parent);m.rotation.x=-Math.PI/2-tilt;m.castShadow=false;return m;}
function scallopRow(g,[x1,z1],[x2,z2],y,n,cols,r=.29){const rg=new T.Group();rg.position.set((x1+x2)/2,y,(z1+z2)/2);rg.rotation.y=-Math.atan2(z2-z1,x2-x1);g.add(rg);const L=Math.hypot(x2-x1,z2-z1);for(let i=0;i<n;i++)halfDisc(r,cols[i%cols.length],rg,-L/2+L*(i+.5)/n,0,.02);}
function pyramid(g,y,rb,rt,h,sx,sz,mat,open){const tg=new T.Group();tg.position.y=y;tg.scale.set(sx,1,sz);g.add(tg);const m=mesh(new T.CylinderGeometry(rt,rb,h,4,1,open),mat,0,0,0,tg);m.rotation.y=Math.PI/4;return {ax:rb*Math.SQRT1_2*sx,az:rb*Math.SQRT1_2*sz};}
// Satteldach, First entlang x
function gable(e,g,yb,H,{rise,over,color,gambrel,endMat,roofMat}){
  const {W,D}=SHOP;const hd=D/2+over,L=W+.8;
  const prof=gambrel?[[hd,0],[D/4,rise*.68],[0,rise]]:[[hd,0],[0,rise]];
  const rm=roofMat||M(color,{roughness:.8});
  for(const sz of [1,-1])for(let i=0;i<prof.length-1;i++){const [z1,y1]=prof[i],[z2,y2]=prof[i+1];const len=Math.hypot(z1-z2,y2-y1);const a=Math.atan2(y2-y1,z1-z2);const p=mesh(BX(L,.16,len+.08),rm,0,yb+H+(y1+y2)/2,sz*(z1+z2)/2,g);p.rotation.x=sz*a;}
  const roofY=z=>{z=Math.abs(z);for(let i=0;i<prof.length-1;i++){const [z1,y1]=prof[i],[z2,y2]=prof[i+1];if(z<=z1&&z>=z2)return y1+(y2-y1)*(z1-z)/(z1-z2);}return rise;};
  const inner=prof.filter(p=>p[0]<D/2-1e-3);
  const pts=[[D/2,0],[D/2,roofY(D/2)],...inner,...inner.slice(0,-1).reverse().map(([z,y])=>[-z,y]),[-D/2,roofY(D/2)],[-D/2,0]];
  const sh=new T.Shape();pts.forEach(([x,y],i)=>i?sh.lineTo(x,y):sh.moveTo(x,y));
  for(const sx of [-1,1]){const m=mesh(new T.ExtrudeGeometry(sh,{depth:.2,bevelEnabled:false}),endMat||M(e.shop.wall),sx*(W/2-.1)-.1,yb+H,0,g);m.rotation.y=Math.PI/2;}
  mesh(BX(L+.1,.2,.2),e.trim,0,yb+H+rise+.04,0,g);
  return {y:yb+H-.08,z:hd,w:L};
}
const STYLE_BUILD={
 kiosk(e,g,yb){const s=e.shop,{W,D}=SHOP,H=2.8;walls(g,yb,H,M(s.wall));frontPosts(g,yb,H+.1,e.trim);
   mesh(BX(W+.6,.28,D+.6),s.roof,0,yb+H+.14,0,g);
   const aw=new T.Group();aw.position.set(0,yb+H+.02,D/2+.25);aw.rotation.x=.22;g.add(aw);
   mesh(BX(W+.8,.08,1.1),new T.MeshStandardMaterial({map:stripeTex([s.roof,s.roof2],'v',10),roughness:.8}),0,0,.55,aw);
   for(let i=0;i<10;i++)halfDisc(.29,i%2?s.roof2:s.roof,aw,-(W+.8)/2+.33+i*(W+.8-.66)/9,-.02,1.1,.22);
   return{eave:{y:yb+H-.26,z:D/2+1.33,w:W+.8},sign:{y:yb+H+1.0,z:D/2-.4,w:W*.86,h:1.2,legs:.7}};},
 huette(e,g,yb){const s=e.shop,{W,D}=SHOP,H=2.5;const pm=has(e,'lebkuchenhaus')?new T.MeshStandardMaterial({map:gingerTex(),roughness:.7}):plank(s.wall);walls(g,yb,H,pm);frontPosts(g,yb,H,e.trim);mesh(BX(W,.4,.22),pm,0,yb+H-.2,D/2-.11,g);
   const r=1.25;const E=gable(e,g,yb,H,{rise:r,over:.55,color:s.roof,endMat:pm,roofMat:has(e,'rautendach')?new T.MeshStandardMaterial({map:diamondTex(),roughness:.6}):null});
   mesh(BX(W+.9,.14,.14),s.roof2,0,E.y-.02,E.z,g);
   for(const sx of[-1,1]){mesh(BX(.9,.75,.06),'#ffe8b0',sx*(W/2+.02),yb+1.6,0,g).rotation.y=Math.PI/2;mesh(BX(1.0,.08,.1),e.trim,sx*(W/2+.05),yb+1.6,0,g).rotation.y=Math.PI/2;mesh(BX(.08,.85,.1),e.trim,sx*(W/2+.05),yb+1.6,0,g);}
   return{eave:E,sign:{y:yb+H+r+.85,z:0,w:W*.8,h:1.0,legs:.5}};},
 pagode(e,g,yb){const s=e.shop,{W,D}=SHOP,H=3.3;mesh(BX(W,H,.2),s.wall,0,yb+H/2,-D/2+.1,g);
   for(const sx of[-1,1])for(const sz of[-1,1])mesh(CY(.16,.18,H,12),s.wall,sx*(W/2-.15),yb+H/2,sz*(D/2-.15),g);
   const lt=canvasTex(64,64,(x,w,h)=>{x.fillStyle=s.roof2;x.fillRect(0,0,w,h);x.strokeStyle=s.wall;x.lineWidth=6;for(let i=0;i<=4;i++){x.beginPath();x.moveTo(i*16,0);x.lineTo(i*16,h);x.moveTo(0,i*16);x.lineTo(w,i*16);x.stroke();}});lt.wrapS=lt.wrapT=T.RepeatWrapping;lt.repeat.set(3,1);
   for(const sx of[-1,1])mesh(BX(.08,1.1,D-.4),new T.MeshStandardMaterial({map:lt}),sx*(W/2-.15),yb+H-.95,0,g);
   mesh(BX(W,.75,.24),s.wall,0,yb+H-.37,D/2-.15,g);
   const gold=M('#f2c14e',{metalness:.5,roughness:.35});
   const t1=pyramid(g,yb+H+.35,4.0,2.2,.7,1.27,.88,M(s.roof,{roughness:.6}));mesh(BX(t1.ax*2+.1,.12,t1.az*2+.1),s.roof2,0,yb+H+.02,0,g);
   const corner=(y,ax,az)=>{for(const sx of[-1,1])for(const sz of[-1,1]){const c=mesh(new T.ConeGeometry(.1,.55,8),gold,sx*ax,y+.15,sz*az,g);c.rotation.z=-sx*.75;c.rotation.x=sz*.75;}};corner(yb+H,t1.ax,t1.az);
   mesh(BX(2.6,.55,1.6),s.wall,0,yb+H+.95,0,g);
   const t2=pyramid(g,yb+H+1.5,2.4,.9,.6,1.27,.88,M(s.roof,{roughness:.6}));corner(yb+H+1.2,t2.ax,t2.az);
   let fy=yb+H+2.05;if(has(e,'pagode3')){mesh(BX(1.5,.5,1.0),s.wall,0,yb+H+2.05,0,g);const t3=pyramid(g,yb+H+2.55,1.45,.45,.55,1.27,.88,M(s.roof,{roughness:.6}));corner(yb+H+2.28,t3.ax,t3.az);fy=yb+H+3.05;
     [[t1.ax,t1.az,yb+H],[t2.ax,t2.az,yb+H+1.2]].forEach(([ax,az,y])=>{for(const sx of[-1,1])for(const sz of[-1,1]){mesh(CY(.008,.008,.25,4),'#888',sx*ax,y-.12,sz*az,g);const b=mesh(new T.ConeGeometry(.09,.16,10),gold,sx*ax,y-.3,sz*az,g);const ph=sx+sz*2;anims.push(t=>{b.rotation.z=Math.sin(t*3+ph)*.25;});}});}
   mesh(CY(.06,.06,.6,8),gold,0,fy,0,g);mesh(SP(.15),gold,0,fy+.35,0,g);
   return{eave:{y:yb+H-.02,z:t1.az,w:t1.ax*2-.4},sign:{y:yb+H-.37,z:D/2-.02,w:W-.8,h:.62}};},
 strandbar(e,g,yb){const s=e.shop,{W,D}=SHOP,H=2.6;const bam='#c9a35a';
   for(const sx of[-1,1])for(const sz of[-1,1]){const x=sx*(W/2-.15),z=sz*(D/2-.15);mesh(CY(.11,.11,H,10),bam,x,yb+H/2,z,g);for(let k=1;k<5;k++){const r=mesh(new T.TorusGeometry(.115,.025,6,12),'#9c7a3a',x,yb+k*H/5,z,g);r.rotation.x=Math.PI/2;}}
   mesh(BX(W,1.5,.12),plank(s.wall),0,yb+.75,-D/2+.1,g);
   const th=pyramid(g,yb+H+.7,4.2,.05,1.4,1.25,.9,M(s.roof,{roughness:1}));mesh(SP(.18,10,8),s.roof2,0,yb+H+1.42,0,g);
   const {ax,az}=th;const segs=[[[-ax,az],[ax,az]],[[ax,az],[ax,-az]],[[ax,-az],[-ax,-az]],[[-ax,-az],[-ax,az]]];const n=150;const inst=new T.InstancedMesh(BX(.09,1,.04),M(s.roof2,{roughness:1}),n);const dm=new T.Object3D();const per=4*(ax+az);const r=seeded(11);
   for(let i=0;i<n;i++){let d=i/n*per,seg=0;const lens=segs.map(([a,b])=>Math.hypot(b[0]-a[0],b[1]-a[1]));while(d>lens[seg]){d-=lens[seg];seg++;}const [a,b]=segs[seg];const t=d/lens[seg];const l=.3+r()*.25;dm.position.set(a[0]+(b[0]-a[0])*t,yb+H-l/2+.02,a[1]+(b[1]-a[1])*t);dm.rotation.set(0,-Math.atan2(b[1]-a[1],b[0]-a[0]),0);dm.scale.set(1,l,1);dm.updateMatrix();inst.setMatrixAt(i,dm.matrix);}
   inst.castShadow=true;g.add(inst);
   return{eave:{y:yb+H-.45,z:az,w:ax*2},sign:{y:yb+H+1.0,z:az-.35,w:3.8,h:.9,legs:.55}};},
 zelt(e,g,yb){const s=e.shop,{W,D}=SHOP,H=2.7;for(const sx of[-1,1])for(const sz of[-1,1])mesh(CY(.08,.08,H,8),e.trim,sx*(W/2-.1),yb+H/2,sz*(D/2-.1),g);
   const spl=has(e,'farbzelt');mesh(BX(W,H,.06),new T.MeshStandardMaterial({map:spl?splatTex([s.wall,s.roof2],e.palette):stripeTex([s.wall,s.roof2],'v',10)}),0,yb+H/2,-D/2+.08,g);
   const tm=new T.MeshStandardMaterial({map:spl?splatTex([s.roof,s.roof2],e.palette):stripeTex([s.roof,s.roof2],'v',12),side:T.DoubleSide,roughness:.8});
   const p=pyramid(g,yb+H+1.0,4.3,.02,2.0,1.22,.85,tm,true);const {ax,az}=p;const cols=[s.roof,s.roof2];
   scallopRow(g,[-ax,az],[ax,az],yb+H,13,cols);scallopRow(g,[ax,az],[ax,-az],yb+H,9,cols);scallopRow(g,[ax,-az],[-ax,-az],yb+H,13,cols);scallopRow(g,[-ax,-az],[-ax,az],yb+H,9,cols);
   mesh(CY(.04,.04,.9,6),'#eeeeee',0,yb+H+2.3,0,g);const fg=new T.BufferGeometry();fg.setAttribute('position',new T.Float32BufferAttribute([0,0,0,0,-.4,0,.75,-.2,0],3));fg.computeVertexNormals();const fl=mesh(fg,M(pc(e,0),{side:T.DoubleSide}),0,yb+H+2.72,0,g);anims.push(t=>{fl.rotation.y=Math.sin(t*2)*.4;});
   return{eave:{y:yb+H-.28,z:az+.03,w:ax*2},sign:{y:yb+H+1.05,z:az-.45,w:3.6,h:.9,legs:.6}};},
 pavillon(e,g,yb){const s=e.shop,{W,D}=SHOP,H=2.8;for(const sx of[-1,1])for(const sz of[-1,1]){const x=sx*(W/2-.15),z=sz*(D/2-.15);mesh(CY(.12,.14,H,12),e.trim,x,yb+H/2,z,g);mesh(BX(.36,.14,.36),e.trim,x,yb+H-.07,z,g);mesh(BX(.36,.14,.36),e.trim,x,yb+.07,z,g);}
   const dg=new T.Group();dg.position.y=yb+H;dg.scale.set(3.4,1.6,2.4);g.add(dg);const dt=stripeTex([s.roof,s.roof2],'v',16);mesh(new T.SphereGeometry(1,32,12,0,Math.PI*2,0,Math.PI/2),new T.MeshStandardMaterial({map:dt,roughness:.6}),0,0,0,dg);
   const n=22;for(let i=0;i<n;i++){const a=i/n*Math.PI*2;const x=3.4*Math.cos(a),z=2.4*Math.sin(a);const rg=new T.Group();rg.position.set(x,yb+H,z);rg.rotation.y=-Math.atan2(-2.4*Math.cos(a),3.4*Math.sin(a));g.add(rg);halfDisc(.3,i%2?s.roof2:s.roof,rg,0,0,0);}
   const gold=M('#f2c14e',{metalness:.5,roughness:.35});mesh(CY(.05,.05,.45,8),gold,0,yb+H+1.75,0,g);mesh(SP(.22,14,10),M(pc(e,0),{roughness:.3}),0,yb+H+2.05,0,g);
   for(const sx of[-1,1]){const c=mesh(CY(.16,.4,H-.3,12),s.roof2,sx*(W/2-.12),yb+(H-.3)/2,D/2-.12,g);mesh(new T.TorusGeometry(.2,.05,6,14),'#f2c14e',sx*(W/2-.12),yb+1.2,D/2-.12,g).rotation.x=Math.PI/2;}
   return{eave:{y:yb+H-.28,z:2.42,w:6.4},sign:{y:yb+H+.62,z:2.2,w:3.6,h:.85,tilt:.5}};},
 spukhaus(e,g,yb){const s=e.shop,{W,D}=SHOP,H=3.0;const pm=plank(s.wall);walls(g,yb,H,pm);frontPosts(g,yb,H,'#2a2230');mesh(BX(W,.5,.22),pm,0,yb+H-.25,D/2-.11,g);
   const rg=new T.Group();rg.rotation.z=.04;g.add(rg);const E=gable(e,rg,yb,H,{rise:2.1,over:.4,color:s.roof,endMat:pm});
   mesh(BX(.5,1.4,.5),'#4a3f48',1.5,yb+H+1.6,-.7,rg).rotation.z=-.08;
   const win=glow(pc(e,1),.9);for(const sx of[-1,1]){const w=mesh(new T.CircleGeometry(.36,20),win,sx*(W/2+.01),yb+1.9,-.2,g);w.rotation.y=sx*Math.PI/2;mesh(BX(.06,.06,.78),'#16121c',sx*(W/2+.03),yb+1.9,-.2,g);mesh(BX(.06,.78,.06),'#16121c',sx*(W/2+.03),yb+1.9,-.2,g);
     const a=mesh(new T.CircleGeometry(.26,16),win,sx*(W/2+.02),yb+H+.75,0,rg);a.rotation.y=sx*Math.PI/2;}
   [[-2.1,yb+H-.3,.4],[1.9,yb+H-.18,-.3],[0,yb+.4,.15]].forEach(([x,y,r])=>{const b=mesh(BX(1.1,.16,.06),'#3a2f3a',x,y,D/2+.02,g);b.rotation.z=r;});
   return{eave:{y:E.y+.05,z:E.z,w:E.w},sign:{y:yb+H+2.1+.85,z:0,x:.15,w:W*.75,h:1.0,legs:.55,rotZ:-.08}};},
 scheune(e,g,yb){const s=e.shop,{W,D}=SHOP,H=2.4;const pm=plank(s.wall);walls(g,yb,H,pm);const wt='#f3efe6';frontPosts(g,yb,H,wt);mesh(BX(W,.45,.22),pm,0,yb+H-.22,D/2-.11,g);mesh(BX(W,.08,.24),wt,0,yb+H-.45,D/2-.11,g);
   const a=Math.atan2(H,D-.3),L=Math.hypot(H,D-.3);for(const sx of[-1,1]){for(const k of[-1,1]){const b=mesh(BX(.05,.14,L),wt,sx*(W/2+.01),yb+H/2,0,g);b.rotation.x=k*a;}mesh(BX(.06,H,.14),wt,sx*(W/2+.01),yb+H/2,-D/2+.07,g);}
   const E=gable(e,g,yb,H,{rise:1.7,over:.45,color:s.roof,gambrel:true,endMat:pm});
   for(const sx of[-1,1]){const x=sx*(W/2+.03);mesh(BX(.04,.75,.75),'#7a2a1d',x,yb+H+.55,0,g);for(const k of[-1,1]){const b=mesh(BX(.05,.08,1.0),wt,x+sx*.01,yb+H+.55,0,g);b.rotation.x=k*Math.PI/4;}}
   return{eave:E,sign:{y:yb+H+1.7+.8,z:0,w:W*.72,h:.95,legs:.5}};},
};

/* ---------- Details am Stand ---------- */
function swagCurve(E,drop,n=3){const pts=[];const N=n*10;for(let i=0;i<=N;i++){const t=i/N;const x=-E.w/2+.2+t*(E.w-.4);const sag=Math.abs(Math.sin(t*n*Math.PI))*drop;pts.push(new T.Vector3(x,E.y-.04-sag,E.z+.06));}return new T.CatmullRomCurve3(pts);}
const EXB={
 thekenstoff(e,g){const {W,D}=SHOP,yb=PY+.2;const c1=pc(e,0),c2=e.shop.signBg||'#111';
   const t=canvasTex(512,128,(x,w,h)=>{x.fillStyle=c2;x.fillRect(0,0,w,h);for(let i=0;i<16;i++){const gx=x.createLinearGradient(i*32,0,i*32+32,0);gx.addColorStop(0,'rgba(0,0,0,.35)');gx.addColorStop(.5,'rgba(255,255,255,.12)');gx.addColorStop(1,'rgba(0,0,0,.35)');x.fillStyle=gx;x.fillRect(i*32,0,32,h);}
     x.fillStyle=c1;x.fillRect(0,0,w,14);x.fillRect(0,h-10,w,10);for(let i=0;i<40;i++){x.beginPath();x.arc(i*13+6,14,6,0,Math.PI);x.fill();}
     x.globalAlpha=.9;for(let i=0;i<60;i++){x.fillStyle=i%2?c1:'#ffffff';x.beginPath();x.arc((i*97)%w,30+((i*53)%80),i%3?1.6:2.6,0,7);x.fill();}});
   const m=new T.MeshStandardMaterial({map:t,roughness:.45,metalness:.25,emissive:e.night?0xffffff:0,emissiveMap:t,emissiveIntensity:e.night?.12:0});
   mesh(BX(W+.04,1.0,.04),m,0,yb+.52,D/2+.02,g);for(const sx of[-1,1])mesh(BX(.04,1.0,.72),m,sx*(W/2+.02),yb+.52,D/2-.35,g);},
 lametta(e,g,E){const n=170;const r=seeded(5);const inst=new T.InstancedMesh(BX(.035,1,.012),M(pc(e,0),{metalness:.85,roughness:.18,emissive:pc(e,0),emissiveIntensity:e.night?.35:.1}),n);const dm=new T.Object3D();
   for(let i=0;i<n;i++){const l=.12+r()*.12;dm.position.set(-E.w/2+.05+i*(E.w-.1)/(n-1),E.y-.02-l/2,E.z+.05+r()*.03);dm.rotation.set(0,r()*3,(r()-.5)*.15);dm.scale.set(1,l,1);dm.updateMatrix();inst.setMatrixAt(i,dm.matrix);}
   g.add(inst);anims.push(t=>{inst.rotation.z=Math.sin(t*1.7)*.004;});},
 sterngirlande(e,g,E){const r=seeded(9);const n=11;for(let i=0;i<n;i++){if(i>=4&&i<=6)continue;const x=-E.w/2+.35+i*(E.w-.7)/(n-1);const l=.3+r()*.55;mesh(CY(.008,.008,l,4),'#cfcfcf',x,E.y-l/2,E.z+.12,g).castShadow=false;
   const st=mesh(ext(starShape(),.06),glow(i%2?pc(e,0):'#ffffff',.9),x,E.y-l-.12,E.z+.12,g);st.scale.setScalar(.36);st.castShadow=false;const ph=i;anims.push(t=>{st.rotation.y=Math.sin(t*1.3+ph)*.6;});}},
 uhr(e,g,E,S){if(!S)return;const cg=new T.Group();cg.position.set(0,S.h/2+.75,.02);S.g.add(cg);
   mesh(BX(.12,.5,.12),e.trim,0,-.5,-.05,cg);const rim=M(pc(e,0),{metalness:.6,roughness:.3});mesh(CY(.62,.62,.16,32),rim,0,0,0,cg).rotation.x=Math.PI/2;
   const ft=canvasTex(256,256,(x,w,h)=>{x.fillStyle='#fffaf0';x.beginPath();x.arc(128,128,124,0,7);x.fill();x.fillStyle='#1c1c24';x.font='700 34px Nunito, sans-serif';x.textAlign='center';x.textBaseline='middle';for(let k=1;k<=12;k++){const a=k/12*Math.PI*2-Math.PI/2;x.fillText(k,128+Math.cos(a)*96,128+Math.sin(a)*96);}});
   const face=new T.Mesh(new T.CircleGeometry(.54,32),new T.MeshStandardMaterial({map:ft,emissive:0xffffff,emissiveMap:ft,emissiveIntensity:e.night?.45:0}));face.position.z=.085;cg.add(face);
   const hand=(len,wd,c)=>{const p=new T.Group();p.position.z=.1;cg.add(p);mesh(BX(wd,len,.02),c,0,len/2-.04,0,p);return p;};
   const hh=hand(.3,.06,'#1c1c24');const mh=hand(.44,.04,'#1c1c24');const sh=hand(.46,.018,'#d32f2f');hh.rotation.z=.05;
   anims.push(t=>{mh.rotation.z=.12-((t*.02)%0.12);sh.rotation.z=-t*1.05;});mesh(SP(.04,8,6),pc(e,0),0,0,.12,cg);},
 girlande(e,g,E){const c=swagCurve(E,.42);mesh(new T.TubeGeometry(c,100,.11,7,false),M('#2e6b34',{roughness:.95}),0,0,0,g);for(let i=0;i<=14;i++){const p=c.getPoint(i/14);mesh(SP(.085,10,8),glow(pc(e,i),.3),p.x,p.y-.1,p.z+.06,g);}
   for(const t of [1/6,.5,5/6]){const p=c.getPoint(t);mesh(SP(.1,8,6),'#d32f2f',p.x,p.y+.02,p.z+.12,g);for(const sx of[-1,1]){const b=mesh(new T.ConeGeometry(.09,.22,8),'#d32f2f',p.x+sx*.13,p.y+.02,p.z+.12,g);b.rotation.z=sx*Math.PI/2;}}},
 blumengirlande(e,g,E){const c=swagCurve(E,.38);const n=48;for(let i=0;i<n;i++){const p=c.getPoint(i/(n-1));const m=mesh(SP(.11,10,8),M(pc(e,i),{roughness:.9}),p.x,p.y,p.z,g);m.castShadow=false;}},
 eiszapfen(e,g,E){const mt=M('#dff3ff',{roughness:.15,transparent:true,opacity:.85,emissive:'#9fd4ff',emissiveIntensity:.15});const r=seeded(3);for(let i=0;i<28;i++){const x=-E.w/2+.15+i*(E.w-.3)/27;const l=.18+r()*.4;const c=mesh(new T.ConeGeometry(.05,l,6),mt,x,E.y-.04-l/2,E.z+.02,g);c.rotation.x=Math.PI;c.castShadow=false;}},
 spinnweben(e,g,E){for(const sx of[-1,1]){const pos=[];const cx=sx*(E.w/2-.3),cy=E.y-.05,R=1.05;const A=[0,.31,.63,.94,1.26,1.57];const P=(a,r)=>[cx-sx*Math.sin(a)*r,cy-Math.cos(a)*r,0];
   A.forEach(a=>pos.push(cx,cy,0,...P(a,R)));for(let ring=1;ring<=4;ring++){const rr=R*ring/4.4;for(let k=0;k<5;k++){const m=(A[k]+A[k+1])/2;pos.push(...P(A[k],rr),...P(m,rr*.85),...P(m,rr*.85),...P(A[k+1],rr));}}
   const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));const l=new T.LineSegments(geo,new T.LineBasicMaterial({color:'#ecebf5',transparent:true,opacity:.85}));l.position.z=E.z+.08;g.add(l);
   const sp=mesh(SP(.09,8,6),'#111',cx-sx*.45,cy-.55,E.z+.1,g);const sy=cy-.55;anims.push(t=>{sp.position.y=sy+Math.sin(t*.9+sx)*.15;});}},
 blumen(e,g){const {D}=SHOP;const yb=PY+.2;for(const sx of[-1,1]){const x=sx*1.55;mesh(BX(1.5,.32,.36),plank('#7a4a22'),x,yb+.72,D/2+.18,g);for(let k=0;k<5;k++){const f=makeItem('blume',pc(e,k+(sx>0?1:0)));f.scale.setScalar(1.05);f.position.set(x-.56+k*.28,yb+.86,D/2+.18);g.add(f);}}},
 wimpel(e,g,E){const c=swagCurve(E,.22,2);mesh(new T.TubeGeometry(c,60,.015,4,false),'#eeeeee',0,0,0,g);const n=16;for(let i=0;i<n;i++){const p=c.getPoint((i+.5)/n);const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute([-.14,0,0,.14,0,0,0,-.32,0],3));geo.computeVertexNormals();const f=mesh(geo,M(pc(e,i),{side:T.DoubleSide}),p.x,p.y,p.z+.03,g);f.castShadow=false;}},
 laternen(e,g,E){for(const sx of[-1,1]){const x=sx*(E.w/2-.35);mesh(CY(.012,.012,.45,4),'#222',x,E.y-.22,E.z,g);const l=makeItem('laterne',pc(e,0));l.scale.setScalar(1.6);l.position.set(x,E.y-1.25,E.z);g.add(l);anims.push(t=>{l.rotation.z=Math.sin(t*1.6+sx)*.07;});}},
 schildlichter(e,g,E,S){if(!S)return;const bulbs=[];const {w,h}=S;const per=2*(w+h);const n=Math.round(per/.3);for(let i=0;i<n;i++){let d=i/n*per,x,y;if(d<w){x=-w/2+d;y=h/2;}else if((d-=w)<h){x=w/2;y=h/2-d;}else if((d-=h)<w){x=w/2-d;y=-h/2;}else{d-=w;x=-w/2;y=-h/2+d;}const b=mesh(SP(.055,8,6),glow(i%2?'#fff3c4':pc(e,0),1),x,y,.13,S.g);b.castShadow=false;bulbs.push(b);}
   anims.push(t=>bulbs.forEach((b,i)=>{b.material.emissiveIntensity=Math.sin(t*3+i*.9)>0?1.1:.3;}));},
};


/* ---------- Stand-Specials je Event ---------- */
const SPECIALS={glamour:'Glamour-Pavillon',raketenstand:'Feuerwerks-Bude',neon:'Neon-Leuchtschrift',drache:'Drache auf dem Dach',loewen:'Löwenwächter',pagode3:'Dritte Dachstufe',rosenranken:'Rosenranken',pralinen:'Pralinen-Schaufenster',herzballons:'Herz-Ballons',konfettikanonen:'Konfetti-Kanonen',luftschlangen:'Luftschlangen',mottowagen:'Mottowagen-Front',kleeblattdach:'Kleeblatt-Dach',muenzregen:'Goldmünzen-Regen',steinmauer:'Steinmauer-Sockel',eierdach:'Eierschalen-Dach',riesenhase:'Riesen-Hase',blumenwiese:'Blumenwiese',osterkoerbe:'Osterkörbe',farbexplosion:'Farbexplosion',ringelblumen:'Ringelblumen-Girlanden',farbzelt:'Farbgesprenkeltes Zelt',pulverpyramiden:'Pulver-Pyramiden',surfbretter:'Surfbretter',tikifackeln:'Tiki-Fackeln',eistheke:'Eis-Theke',sandsockel:'Sandstrand-Sockel',torfront:'Brandenburger-Tor-Front',mauergraffiti:'Mauerstück mit Graffiti',fahnenbogen:'Fahnen-Bogen',festbeleuchtung:'Festbeleuchtung',rautendach:'Rautendach',lebkuchenwand:'Lebkuchenherzen-Wand',fasstheke:'Fass-Theke',breznschild:'Brezn-Schild',geister:'Geister',kesselnebel:'Kessel mit Nebel',augenfenster:'Augen in den Fenstern',toterbaum:'Toter Baum',erntekranz:'Erntekranz am Giebel',truthahn:'Truthahn-Figur',vogelscheuche:'Vogelscheuche',maisbuendel:'Maiskolben-Bündel',riesenkalender:'Riesen-Adventskalender (3D, Hintergrund)',schneedach:'Schneedach mit Rauch',lebkuchenhaus:'Lebkuchenhaus-Look',kalenderfenster:'Adventskalender-Fenster',schlitten:'Nikolaus-Schlitten',rentiere:'Rentier-Figuren',geschenkberg:'Geschenkberg',glitzerschnee:'Glitzernder Schneedach-Rand',krippe:'Krippen-Ecke'};
const EVENT_SPECIALS={silvester:['glamour','raketenstand','neon'],cny:['drache','loewen','pagode3'],valentin:['rosenranken','pralinen','herzballons'],karneval:['konfettikanonen','luftschlangen','mottowagen'],stpatrick:['kleeblattdach','muenzregen','steinmauer'],ostern:['eierdach','riesenhase','blumenwiese','osterkoerbe'],holi:['farbexplosion','ringelblumen','farbzelt','pulverpyramiden'],sommer:['surfbretter','tikifackeln','eistheke','sandsockel'],einheit:['torfront','mauergraffiti','fahnenbogen','festbeleuchtung'],oktoberfest:['rautendach','lebkuchenwand','fasstheke','breznschild'],halloween:['geister','kesselnebel','augenfenster','toterbaum'],thanksgiving:['erntekranz','truthahn','vogelscheuche','maisbuendel'],advent:['riesenkalender','schneedach','lebkuchenhaus','kalenderfenster','schlitten'],weihnachten:['rentiere','geschenkberg','glitzerschnee','krippe']};
const has=(e,k)=>(e.shop.extras||[]).includes(k);
const GR=(g,x,y,z,ry=0,s=1)=>{const o=new T.Group();o.position.set(x,y,z);o.rotation.y=ry;o.scale.setScalar(s);g.add(o);return o;};
const tube=(pts,r,mat,g,closed=false,seg)=>{const c=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(p[0],p[1],p[2])),closed);return mesh(new T.TubeGeometry(c,seg||Math.max(24,pts.length*10),r,8,closed),mat,0,0,0,g);};
const metal=c=>M(c,{metalness:.65,roughness:.28});
function emitter(g,{n=200,size=.3,tex='dot',additive=false,opacity=1}){const pos=new Float32Array(n*3),col=new Float32Array(n*3),vel=new Float32Array(n*3),life=new Float32Array(n),base=new Float32Array(n*3);
  for(let i=0;i<n;i++)pos[i*3+1]=-200;
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));geo.setAttribute('color',new T.BufferAttribute(col,3));
  const mat=new T.PointsMaterial({size,map:spriteTex(tex),vertexColors:true,transparent:true,opacity,depthWrite:false,blending:additive?T.AdditiveBlending:T.NormalBlending,alphaTest:additive?0:.03});
  const pts=new T.Points(geo,mat);pts.frustumCulled=false;g.add(pts);let idx=0;const tmp=new T.Color();
  return{emit(x,y,z,vx,vy,vz,c,l){const i=idx;idx=(idx+1)%n;pos[i*3]=x;pos[i*3+1]=y;pos[i*3+2]=z;vel[i*3]=vx;vel[i*3+1]=vy;vel[i*3+2]=vz;tmp.set(c);base[i*3]=tmp.r;base[i*3+1]=tmp.g;base[i*3+2]=tmp.b;col.set([tmp.r,tmp.g,tmp.b],i*3);life[i]=l;},
    step(dt,grav=-4,drag=.98,floor=-99){for(let i=0;i<n;i++){if(life[i]<=0)continue;life[i]-=dt;if(life[i]<=0){pos[i*3+1]=-200;continue;}vel[i*3+1]+=grav*dt;for(let a=0;a<3;a++){vel[i*3+a]*=drag;pos[i*3+a]+=vel[i*3+a]*dt;}
      if(pos[i*3+1]<floor){pos[i*3+1]=floor;vel[i*3]=vel[i*3+1]=vel[i*3+2]=0;}
      if(additive){const f=Math.min(1,life[i]);for(let a=0;a<3;a++)col[i*3+a]=base[i*3+a]*f;}}
      geo.attributes.position.needsUpdate=true;geo.attributes.color.needsUpdate=true;}};}
const rnd=Math.random;
function textTex(text,{w=512,h=128,font='Lilita One',color='#fff',glow=null,size=86,bg=null}){return canvasTex(w,h,(x,W,H)=>{if(bg){x.fillStyle=bg;x.fillRect(0,0,W,H);}x.textAlign='center';x.textBaseline='middle';x.font=`${size}px "${font}", "Arial Black", sans-serif`;if(glow){x.shadowColor=glow;x.shadowBlur=28;for(let i=0;i<3;i++){x.fillStyle=glow;x.fillText(text,W/2,H/2+4);}x.shadowBlur=0;}x.fillStyle=color;x.fillText(text,W/2,H/2+4);});}
function gingerTex(){return canvasTex(256,256,(x,w,h)=>{x.fillStyle='#a8622a';x.fillRect(0,0,w,h);x.fillStyle='rgba(0,0,0,.08)';for(let i=0;i<220;i++){x.beginPath();x.arc(Math.random()*w,Math.random()*h,1.4,0,7);x.fill();}
  x.strokeStyle='#fffaf0';x.lineWidth=7;x.lineCap='round';x.beginPath();for(let i=0;i<=16;i++){const xx=i*16;x.moveTo(xx,10);x.quadraticCurveTo(xx+8,26,xx+16,10);}x.stroke();x.beginPath();for(let i=0;i<=16;i++){const xx=i*16;x.moveTo(xx,h-10);x.quadraticCurveTo(xx+8,h-26,xx+16,h-10);}x.stroke();
  const cs=['#e53935','#43a047','#fdd835','#1e88e5','#ffffff'];for(let i=0;i<14;i++){x.fillStyle=cs[i%5];x.beginPath();x.arc(20+(i*53)%220,60+((i*37)%140),7,0,7);x.fill();}
  x.lineWidth=4;x.strokeRect(78,70,100,110);x.beginPath();x.moveTo(128,70);x.lineTo(128,180);x.moveTo(78,125);x.lineTo(178,125);x.stroke();});}
function diamondTex(){const t=canvasTex(128,128,(x,w,h)=>{x.fillStyle='#ffffff';x.fillRect(0,0,w,h);x.fillStyle='#1f6fd1';for(let i=-1;i<5;i++)for(let j=-1;j<5;j++){if((i+j)%2)continue;x.beginPath();const cx=i*32+16,cy=j*32+16;x.moveTo(cx,cy-16);x.lineTo(cx+16,cy);x.lineTo(cx,cy+16);x.lineTo(cx-16,cy);x.fill();}});t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(4,2);return t;}
function splatTex(cols,pal){return canvasTex(256,256,(x,w,h)=>{for(let i=0;i<12;i++){x.fillStyle=cols[i%cols.length];x.fillRect(i*w/12,0,w/12+1,h);}const r=seeded(21);for(let i=0;i<46;i++){x.fillStyle=pal[i%pal.length];x.globalAlpha=.9;const cx=r()*w,cy=r()*h,rr=6+r()*18;x.beginPath();x.arc(cx,cy,rr,0,7);x.fill();for(let k=0;k<5;k++){x.beginPath();x.arc(cx+(r()-.5)*rr*3,cy+(r()-.5)*rr*3,2+r()*4,0,7);x.fill();}if(r()>.6){x.fillRect(cx-2,cy,4,10+r()*30);}}x.globalAlpha=1;});}
function wickerTex(){const t=canvasTex(64,64,(x,w,h)=>{x.fillStyle='#b07a3c';x.fillRect(0,0,w,h);x.strokeStyle='#7a4f22';x.lineWidth=3;for(let i=0;i<8;i++){x.beginPath();x.moveTo(0,i*8+4);for(let j=0;j<=8;j++)x.lineTo(j*8,i*8+4+((i+j)%2?2:-2));x.stroke();}});t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(4,1);return t;}

const SPX={
 /* Silvester */
 glamour(e,g){const {W,D}=SHOP,yb=PY+.2;const gold=metal('#d9b44a');
   for(const sx of[-1,1])for(const sz of[-1,1]){const x=sx*(W/2-.15),z=sz*(D/2-.15);mesh(CY(.2,.22,2.5,18),gold,x,yb+1.4,z,g);mesh(BX(.5,.18,.5),gold,x,yb+2.72,z,g);mesh(BX(.5,.16,.5),gold,x,yb+.08,z,g);for(let k=0;k<3;k++){const r=mesh(new T.TorusGeometry(.215,.025,6,18),'#fff1b8',x,yb+.6+k*.9,z,g);r.rotation.x=Math.PI/2;}}
   const vel=M('#6e0b1c',{roughness:.95});for(const sx of[-1,1]){const c=mesh(new T.CylinderGeometry(.18,.6,2.45,16,1,true),vel,sx*(W/2-.5),yb+1.35,D/2-.05,g);c.material.side=T.DoubleSide;const tie=mesh(new T.TorusGeometry(.26,.06,8,18),gold,sx*(W/2-.5),yb+1.0,D/2-.05,g);tie.rotation.x=Math.PI/2;mesh(SP(.09,8,6),gold,sx*(W/2-.5),yb+.75,D/2+.22,g);}
   tube([[-W/2+.3,yb+2.75,D/2+.1],[-1.4,yb+2.35,D/2+.18],[0,yb+2.55,D/2+.2],[1.4,yb+2.35,D/2+.18],[W/2-.3,yb+2.75,D/2+.1]],.1,vel,g);
   const mt=canvasTex(128,64,(x,w,h)=>{x.fillStyle='#8f96a3';x.fillRect(0,0,w,h);for(let i=0;i<16;i++)for(let j=0;j<8;j++){const v=160+Math.random()*95|0;x.fillStyle=`rgb(${v},${v},${v+10})`;x.fillRect(i*8+1,j*8+1,6,6);}});
   const ball=mesh(SP(.36,24,16),new T.MeshStandardMaterial({map:mt,metalness:.95,roughness:.12,emissive:0x333344,emissiveMap:mt}),0,yb+2.95,-.55,g);mesh(CY(.008,.008,.9,4),'#cccccc',0,yb+3.7,-.55,g);anims.push((t)=>{ball.rotation.y=t*.9;});},
 raketenstand(e,g){const {W,D}=SHOP,yb=PY+.2;const r=GR(g,3.8,PY,-1.3,-.5);const wood=M('#6d4027');mesh(BX(1.4,.12,.9),wood,0,.06,0,r);mesh(BX(1.4,.1,.9),wood,0,.8,0,r);for(const sx of[-1,1])for(const sz of[-1,1])mesh(BX(.08,.9,.08),wood,sx*.64,.45,sz*.38,r);
   for(let i=0;i<6;i++){const k=makeItem('rakete',pc(e,i));k.scale.setScalar(2.4);k.position.set(-.5+(i%3)*.5,.85,i<3?-.2:.2);k.rotation.z=(i-2.5)*.05;r.add(k);}
   const lbl=new T.Mesh(new T.PlaneGeometry(1.3,.32),new T.MeshStandardMaterial({map:textTex('FEUERWERK',{w:512,h:128,size:78,color:'#ffd65e',bg:'#16161f'})}));lbl.position.set(0,.42,.46);r.add(lbl);
   const em=emitter(g,{n:320,size:.16,additive:true});let acc=0;const top=yb+2.8+2.25;
   anims.push((t,dt)=>{acc+=dt;while(acc>.03){acc-=.03;for(let k=0;k<3;k++){const a=rnd()*Math.PI*2,s=1.2+rnd()*1.6;em.emit(0,top,0,Math.cos(a)*s,2.4+rnd()*1.8,Math.sin(a)*s,rnd()>.5?'#ffd65e':'#fff3c4',1.1+rnd()*.5);}}em.step(dt,-4,.985);});},
 neon(e,g){const yb=PY+.2;const occ=nextOcc('silvester');const txt=e.id==='silvester'&&occ?String(occ[1].getFullYear()):(e.shop.sign||e.name);
   const tex=textTex(txt,{w:512,h:200,size:150,color:'#ffffff',glow:pc(e,2)||'#ff4fd8'});const m=new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false});const p=new T.Mesh(new T.PlaneGeometry(2.8,1.1),m);p.position.set(0,yb+2.8+2.55,-.95);g.add(p);
   for(const sx of[-1,1])mesh(CY(.03,.03,.9,6),'#888',sx*.9,yb+2.8+1.75,-.95,g);
   anims.push(t=>{const ph=t%4;m.opacity=ph<.12||(ph>.3&&ph<.38)?.25:1;});},
 /* Chinesisches Neujahr */
 drache(e,g){const yb=PY+.2,H=3.3;const dg=new T.Group();g.add(dg);const pts=[];for(let i=0;i<=40;i++){const t=i/40;const a=-.6+t*Math.PI*2.05;const rr=1-.3*t;pts.push([Math.cos(a)*3.05*rr,yb+H+.75+t*1.15+.16*Math.sin(t*22),Math.sin(a)*2.15*rr]);}
   const bodyT=stripeTex(['#c8161d','#e0242b','#f2c14e','#e0242b'],'v',48);const bm=new T.MeshStandardMaterial({map:bodyT,roughness:.45,metalness:.2});tube(pts,.17,bm,dg,false,160);
   const gold=metal('#f2c14e');for(let i=2;i<40;i+=2){const [x,y,z]=pts[i];const sp=mesh(new T.ConeGeometry(.07,.22,6),gold,x,y+.18,z,dg);sp.castShadow=false;}
   const [tx,ty,tz]=pts[0];mesh(SP(.12,10,8),gold,tx,ty,tz,dg);
   const [hx,hy,hz]=pts[40],[px,py,pz]=pts[38];const hd=new T.Group();hd.position.set(hx,hy,hz);hd.lookAt(hx+(hx-px),hy+(hy-py),hz+(hz-pz));dg.add(hd);
   const red=M('#c8161d',{roughness:.4});mesh(BX(.42,.34,.55),red,0,.05,.15,hd);mesh(BX(.32,.18,.4),red,0,-.02,.5,hd);const jaw=mesh(BX(.3,.08,.38),'#f2c14e',0,-.16,.42,hd);
   for(const sx of[-1,1]){const h=mesh(new T.ConeGeometry(.05,.38,8),gold,sx*.13,.32,-.02,hd);h.rotation.x=-.7;mesh(SP(.06,8,6),glow('#ffe14d',1.2),sx*.17,.15,.32,hd);const w=mesh(CY(.01,.005,.7,4),gold,sx*.2,-.05,.75,hd);w.rotation.z=sx*1.1;w.rotation.x=.4;}
   mesh(SP(.06,8,6),'#ffffff',0,.08,.72,hd);
   anims.push(t=>{dg.position.y=Math.sin(t*1.2)*.06;jaw.rotation.x=Math.max(0,Math.sin(t*2))*.25;});},
 loewen(e,g){const yb=PY+.2;const gold=metal('#e2b23c');for(const sx of[-1,1]){const l=GR(g,sx*2.75,PY,2.85,sx*-.15,1.05);mesh(BX(1.0,.5,1.0),'#8f1418',0,.25,0,l);mesh(BX(.6,.55,.85),gold,0,.78,-.05,l);mesh(BX(.5,.4,.3),gold,0,.7,.4,l);
     mesh(BX(.12,.45,.12),gold,-.17,.72,.42,l);mesh(BX(.12,.45,.12),gold,.17,.72,.42,l);const hd=GR(l,0,1.35,.3);mesh(BX(.52,.48,.42),gold,0,0,0,hd);
     for(let k=0;k<10;k++){const a=k/10*Math.PI*2;mesh(SP(.13,8,6),metal('#c58c1c'),Math.cos(a)*.3,Math.sin(a)*.28,-.08,hd);}
     mesh(BX(.3,.12,.08),'#b71c1c',0,-.12,.22,hd);for(const ex of[-1,1])mesh(SP(.05,8,6),'#111',ex*.12,.08,.22,hd);mesh(SP(.17,12,10),metal('#f2c14e'),sx*.22,.65,.62,l);mesh(BX(.2,.3,.2),gold,0,.9,-.45,l);}},
 pagode3(){},
 /* Valentinstag */
 rosenranken(e,g){const {W,D}=SHOP,yb=PY+.2,H=2.8;const vine=M('#2e6b2f',{roughness:.9});const rose=['#e3123b','#ff4d79','#c2185b'];
   for(const sx of[-1,1])for(const sz of[-1,1]){const x=sx*(W/2-.15),z=sz*(D/2-.15);const pts=[];for(let i=0;i<=30;i++){const t=i/30,a=t*Math.PI*9;pts.push([x+Math.cos(a)*.22,yb+.1+t*(H-.2),z+Math.sin(a)*.22]);}tube(pts,.03,vine,g,false,120);
     for(let i=2;i<30;i+=3){const [px,py,pz]=pts[i];mesh(SP(.1,10,8),rose[i%3],px,py,pz,g).castShadow=false;const lf=mesh(SP(.07,8,6),vine,px+.06,py-.08,pz,g);lf.scale.set(1,.4,.6);}}
   for(let i=0;i<26;i++){const a=i/26*Math.PI*2;mesh(SP(.11,10,8),rose[i%3],3.4*Math.cos(a),yb+H+.04,2.4*Math.sin(a),g).castShadow=false;}},
 pralinen(e,g){const {W,D}=SHOP,yb=PY+.2;const z=D/2-.35,y=yb+1.24;const gold=metal('#d9b44a');mesh(BX(W-.6,.06,.66),gold,0,y,z,g);
   const gl=new T.MeshStandardMaterial({color:'#e8f6ff',transparent:true,opacity:.22,roughness:.05,metalness:.1,depthWrite:false});mesh(BX(W-.7,.52,.6),gl,0,y+.29,z,g).castShadow=false;
   for(const sx of[-1,1])for(const sz of[-1,1])mesh(BX(.04,.55,.04),gold,sx*(W/2-.35),y+.29,z+sz*.3,g);mesh(BX(W-.7,.04,.04),gold,0,y+.56,z+.3,g);
   const pc2=['#5d3417','#8d5a3b','#ff9fbd','#fff3e0','#c2185b'];for(let i=0;i<14;i++){const x=-2.1+i*.32;const k=i%3;if(k===0)mesh(SP(.08,10,8),pc2[i%5],x,y+.12,z+.12,g);else if(k===1)mesh(BX(.13,.1,.13),pc2[(i+2)%5],x,y+.1,z+.12,g);else{mesh(CY(.06,.08,.1,10),pc2[i%5],x,y+.1,z+.12,g);}}
   for(let i=0;i<5;i++){const x=-2+i*1;mesh(CY(.09,.07,.12,12),'#f8bbd0',x,y+.1,z-.12,g);mesh(SP(.1,10,8),'#fff0f5',x,y+.2,z-.12,g);mesh(SP(.035,8,6),'#e3123b',x,y+.3,z-.12,g);}},
 herzballons(e,g){const yb=PY+.2,H=2.8;for(let i=0;i<6;i++){const a=i/6*Math.PI*2+.3;const bx=Math.cos(a)*1.6,bz=Math.sin(a)*1.1,by=yb+H+2.2+(i%3)*.35;const h=mesh(ext(heartShape(),.22),M(pc(e,i),{roughness:.3,metalness:.1}),bx,by,bz,g);h.scale.setScalar(.75);
   mesh(CY(.006,.006,1.0,4),'#eeeeee',bx*.85,by-.7,bz*.85,g);const ph=i;anims.push(t=>{h.position.y=by+Math.sin(t*1.3+ph)*.1;h.rotation.y=Math.sin(t*.7+ph)*.5;});}},
 /* Karneval */
 konfettikanonen(e,g){const yb=PY+.2;const cans=[];for(const sx of[-1,1]){const c=GR(g,sx*3.35,PY,2.0);for(const wz of[-.3,.3]){const w=mesh(CY(.28,.28,.1,16),'#6d4027',0,.28,wz,c);w.rotation.x=Math.PI/2;mesh(CY(.06,.06,.12,8),'#ffd54f',0,.28,wz*1.1,c);}
     const dir=new T.Vector3(sx*.5,.85,.25).normalize();const b=mesh(CY(.16,.22,1.0,16),M(pc(e,sx>0?0:2),{metalness:.4,roughness:.35}),0,0,0,c);b.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir);b.position.copy(dir.clone().multiplyScalar(.35)).add(new T.Vector3(0,.42,0));
     const ring=mesh(new T.TorusGeometry(.17,.04,6,16),'#ffd54f',0,0,0,c);ring.quaternion.copy(b.quaternion);ring.rotateX(Math.PI/2);ring.position.copy(dir.clone().multiplyScalar(.85)).add(new T.Vector3(0,.42,0));
     cans.push({mouth:c.position.clone().add(dir.clone().multiplyScalar(.9)).add(new T.Vector3(0,.42,0)),dir,b});}
   const em=emitter(g,{n:500,size:.2,tex:'square'});let tm=1,which=0;
   anims.push((t,dt)=>{tm-=dt;if(tm<=0){tm=2.2;const c=cans[which];which=1-which;for(let k=0;k<80;k++){const s=5+rnd()*3;em.emit(c.mouth.x,c.mouth.y,c.mouth.z,c.dir.x*s+(rnd()-.5)*2.4,c.dir.y*s+(rnd()-.5)*1.5,c.dir.z*s+(rnd()-.5)*2.4,pc(e,k),3.2);}c.b.scale.y=.8;}
     cans.forEach(c=>{c.b.scale.y+=(1-c.b.scale.y)*.15;});em.step(dt,-3.2,.975,PY+.05);});},
 luftschlangen(e,g,E){const mk=(x,z,len,c)=>{const pts=[];const turns=4.5;for(let i=0;i<=36;i++){const t=i/36,a=t*turns*Math.PI*2;pts.push([x+Math.cos(a)*.08,E.y-t*len,z+Math.sin(a)*.08]);}tube(pts,.018,M(c,{roughness:.6}),g,false,100).castShadow=false;};
   for(let i=0;i<11;i++){const x=-E.w/2+.3+i*(E.w-.6)/10;mk(x,E.z+.02,.7+(i%3)*.3,pc(e,i));}for(const sx of[-1,1])for(let i=0;i<5;i++)mk(sx*E.w/2,-E.z+.4+i*(2*E.z-.8)/4,.6+(i%2)*.35,pc(e,i+1));},
 mottowagen(e,g){const {W,D}=SHOP,yb=PY+.2;const tx=canvasTex(512,128,(x,w,h)=>{x.fillStyle=pc(e,1);x.fillRect(0,0,w,h);for(let i=0;i<12;i++){x.fillStyle=i%2?pc(e,0):pc(e,2);x.beginPath();x.moveTo(i*44,h);x.lineTo(i*44+22,30);x.lineTo(i*44+44,h);x.fill();}x.fillStyle='#ffffff';x.font='64px "Lilita One", sans-serif';x.textAlign='center';x.fillText('HELAU!',w/2,62);});
   mesh(BX(W+.1,1.05,.1),new T.MeshStandardMaterial({map:tx}),0,yb+.52,D/2+.06,g);for(let i=0;i<14;i++)mesh(SP(.09,8,6),pc(e,i),-W/2+.2+i*(W-.4)/13,yb+1.08,D/2+.12,g);
   for(const sx of[-1,1])for(const wz of[D/2-.55,-D/2+.6]){const wg=GR(g,sx*(W/2+.16),PY+.62,wz);const rim=mesh(new T.TorusGeometry(.55,.07,8,24),'#6d4027',0,0,0,wg);rim.rotation.y=Math.PI/2;for(let k=0;k<6;k++){const sp=mesh(BX(.05,1.0,.05),'#ffd54f',0,0,0,wg);sp.rotation.x=k*Math.PI/6;}mesh(CY(.12,.12,.16,12),'#e53935',0,0,0,wg).rotation.z=Math.PI/2;}
   const db=mesh(BX(.12,.12,1.4),'#6d4027',0,PY+.5,D/2+.75,g);db.rotation.x=.25;},
 /* St. Patrick */
 kleeblattdach(e,g){const {D}=SHOP,yb=PY+.2;const cg=GR(g,0,yb+2.8+2.45,D/2-.4,0,1);const gm=M('#2fa84f',{roughness:.45});const edge=metal('#ffd54f');
   for(let i=0;i<3;i++){const p=new T.Group();p.rotation.z=i*2*Math.PI/3;cg.add(p);const h=mesh(ext(heartShape(),.14),gm,0,.48,0,p);h.rotation.z=Math.PI;h.scale.setScalar(.95);}mesh(SP(.12,10,8),edge,0,0,.1,cg);
   const st=mesh(CY(.05,.07,.7,8),'#1b5e20',.15,-.6,0,cg);st.rotation.z=.3;anims.push(t=>{cg.rotation.y=t*.8;});},
 muenzregen(e,g){const yb=PY+.2;const em=emitter(g,{n:260,size:.22,tex:'coin'});let tm=1.5;
   anims.push((t,dt)=>{tm-=dt;if(tm<=0){tm=5.5;for(let k=0;k<70;k++)em.emit((rnd()-.5)*5.5,yb+6.5+rnd()*2,(rnd()-.5)*3.4,(rnd()-.5)*.6,-1-rnd(),(rnd()-.5)*.6,rnd()>.5?'#ffcf33':'#ffe082',3.2);}em.step(dt,-5,.99,yb+3.12);});},
 steinmauer(e,g){const {W,D}=SHOP;const r=seeded(17);const X=W/2+.5,Z=D/2+.5;const stones=['#8d8f96','#9ea1a8','#7c7e85','#a9a59c'];
   const seg=(x1,z1,x2,z2)=>{const L=Math.hypot(x2-x1,z2-z1),n=Math.round(L/.48);for(let c=0;c<2;c++)for(let i=0;i<n;i++){const t=(i+.5+(c?.5:0))/n;if(t>1)continue;const x=x1+(x2-x1)*t,z=z1+(z2-z1)*t;const s=mesh(BX(.44+r()*.1,.24,.32+r()*.08),stones[(i+c)%4],x,PY+.13+c*.25,z,g);s.rotation.y=Math.atan2(x2-x1,z2-z1)+Math.PI/2+(r()-.5)*.15;
     if(r()>.6){const m=mesh(SP(.12,8,6),'#5a8f3a',x+(r()-.5)*.2,PY+.38+c*.25,z,g);m.scale.set(1.3,.4,1);}}};
   seg(-X,Z,X,Z);seg(X,Z,X,-Z);seg(-X,-Z,-X,Z);seg(X,-Z,-X,-Z);},
 /* Ostern */
 eierdach(e,g,E,S){const yb=PY+.2,H=2.5;const t=canvasTex(512,256,(x,w,h)=>{x.fillStyle='#fff6e0';x.fillRect(0,0,w,h);const c=e.palette;for(let b=0;b<4;b++){x.fillStyle=c[b%c.length];x.beginPath();const y0=30+b*55;for(let i=0;i<=32;i++){const xx=i*16;x.lineTo(xx,y0+(i%2?14:0));}for(let i=32;i>=0;i--){const xx=i*16;x.lineTo(xx,y0+22+(i%2?14:0));}x.fill();}for(let i=0;i<40;i++){x.fillStyle=c[(i+1)%c.length];x.beginPath();x.arc((i*61)%w,(i*29)%h,5,0,7);x.fill();}});
   const sh=mesh(new T.SphereGeometry(1,40,18,0,Math.PI*2,0,Math.PI/2),new T.MeshStandardMaterial({map:t,side:T.DoubleSide,roughness:.5}),0,yb+H-.08,0,g);sh.scale.set(3.55,2.2,2.55);
   for(let i=0;i<34;i++){const a=i/34*Math.PI*2;const c=mesh(new T.ConeGeometry(.16,.34,4),'#fff6e0',3.55*Math.cos(a),yb+H-.18,2.55*Math.sin(a),g);c.rotation.x=Math.PI;c.castShadow=false;}
   if(S){S.g.position.y+=1.1;for(const sx of[-1,1])mesh(BX(.12,1.3,.12),e.trim,sx*S.w*.34,-S.h/2-.9,-.02,S.g);}
   const cap=mesh(new T.SphereGeometry(.7,20,10,0,Math.PI*2,0,Math.PI/2.4),new T.MeshStandardMaterial({map:t,side:T.DoubleSide}),-3.2,PY+.35,2.6,g);cap.rotation.z=2.4;},
 riesenhase(e,g){const h=GR(g,3.85,PY,1.05,-.55,1);const ch=M('#6d3f1f',{roughness:.28,metalness:.15});const b=mesh(SP(.85,24,18),ch,0,.95,0,h);b.scale.set(1,1.15,.9);for(const sx of[-1,1]){const f=mesh(SP(.32,14,10),ch,sx*.4,.18,.45,h);f.scale.set(.8,.5,1.3);}
   mesh(SP(.55,24,18),ch,0,2.1,.12,h);const ears=[];for(const sx of[-1,1]){const ep=GR(h,sx*.22,2.5,.05);ep.rotation.z=sx*-.18;mesh(BX(.24,1.0,.13),ch,0,.5,0,ep);mesh(BX(.12,.8,.02),'#f8a5c2',0,.48,.07,ep);ears.push(ep);}
   for(const sx of[-1,1]){mesh(SP(.09,10,8),'#ffffff',sx*.2,2.22,.6,h);mesh(SP(.05,8,6),'#1d1d24',sx*.2,2.22,.68,h);}mesh(SP(.07,8,6),'#f48fb1',0,2.05,.66,h);mesh(SP(.18,10,8),'#fff3e0',0,1.95,.58,h).scale.set(1.3,.7,.6);
   const rb=mesh(new T.TorusGeometry(.42,.07,8,24),'#e53935',0,1.62,.12,h);rb.rotation.x=Math.PI/2;mesh(SP(.12,12,10),metal('#ffd54f'),0,1.55,.55,h);mesh(SP(.22,10,8),'#fff3e0',0,.9,-.78,h);
   anims.push(t=>{ears[0].rotation.z=.18+Math.sin(t*2.2)*.12;ears[1].rotation.z=-.18-Math.max(0,Math.sin(t*2.2+1))*.25;});},
 blumenwiese(e,g){const r=seeded(31);const tul=['#f06292','#e53935','#ffb300','#ba68c8','#ff7043'];for(let i=0;i<54;i++){const a=r()*Math.PI*2,rad=3.7+r()*1.6;const x=Math.sin(a)*rad,z=Math.cos(a)*rad;if(Math.abs(x)<1.8&&z>0)continue;
     const f=GR(g,x,PY,z,r()*3);mesh(CY(.018,.018,.42,5),'#3f8f3a',0,.21,0,f);const lf=mesh(SP(.07,8,6),'#4caf50',.05,.12,0,f);lf.scale.set(.5,1.6,.3);
     if(i%3){const c=mesh(SP(.09,10,8),tul[i%5],0,.47,0,f);c.scale.y=1.4;}else{for(let k=0;k<6;k++){const p=mesh(SP(.06,8,6),'#fff59d',Math.cos(k)*.08,.46,Math.sin(k)*.08,f);p.scale.y=.3;}mesh(CY(.04,.05,.09,8),'#ffa000',0,.49,0,f);}}
   for(let i=0;i<5;i++){const bf=new T.Group();g.add(bf);const wm=M(pc(e,i),{side:T.DoubleSide,roughness:.5});const wl=new T.Mesh(new T.CircleGeometry(.16,12),wm),wr=new T.Mesh(new T.CircleGeometry(.16,12),wm);wl.position.x=-.15;wr.position.x=.15;const pl=new T.Group(),pr=new T.Group();pl.add(wl);pr.add(wr);bf.add(pl,pr);mesh(BX(.04,.04,.2),'#333',0,0,0,bf);
     const ph=i*1.3,R=4.2+i*.25;anims.push(t=>{const a=t*.35+ph;bf.position.set(Math.sin(a)*R,PY+1.2+Math.sin(t*1.7+ph)*.4,Math.cos(a)*R);bf.rotation.y=a+Math.PI/2;const f=Math.sin(t*14+ph)*.9;pl.rotation.z=-f;pr.rotation.z=f;});}},
 osterkoerbe(e,g,E){const wk=new T.MeshStandardMaterial({map:wickerTex(),side:T.DoubleSide,roughness:.9});for(let i=0;i<3;i++){const x=-1.8+i*1.8;const b=GR(g,x,E.y-1.0,E.z+.05);mesh(CY(.012,.012,.55,4),'#5d4037',0,.73,0,b);
     mesh(new T.CylinderGeometry(.34,.25,.3,16,1,true),wk,0,0,0,b);mesh(CY(.25,.25,.03,16),'#7a4f22',0,-.14,0,b);const hd=mesh(new T.TorusGeometry(.32,.03,6,16,Math.PI),'#7a4f22',0,.1,0,b);
     mesh(SP(.2,10,6),'#8bc34a',0,.08,0,b).scale.y=.3;for(let k=0;k<3;k++){const eg=makeItem('ei',pc(e,i+k));eg.scale.setScalar(.75);eg.position.set(-.14+k*.14,.02,(k%2)*.06);b.add(eg);}const ph=i;anims.push(t=>{b.rotation.z=Math.sin(t*1.4+ph)*.05;});}},
 /* Holi */
 farbexplosion(e,g){const yb=PY+.2;const em=emitter(g,{n:420,size:1.1,tex:'soft',opacity:.75});let tm=.5;
   anims.push((t,dt)=>{tm-=dt;if(tm<=0){tm=2.4;const c=pc(e,Math.floor(rnd()*9));const ox=(rnd()-.5)*3;for(let k=0;k<60;k++){const a=rnd()*Math.PI*2,u=rnd()*2-1,s=1.5+rnd()*2.2;em.emit(ox,yb+4.6,(rnd()-.5),Math.cos(a)*s*Math.sqrt(1-u*u),Math.abs(u)*s+.6,Math.sin(a)*s*Math.sqrt(1-u*u),k%4?c:pc(e,k),2.4+rnd());}}em.step(dt,-.5,.955);});},
 ringelblumen(e,g,E){const {W,D}=SHOP,yb=PY+.2,H=2.7;const cs=['#ff9800','#ffc107','#ff6f00'];for(const sx of[-1,1])for(const sz of[1,-1]){const x=sx*(W/2-.1),z=sz*(D/2-.1);for(let i=0;i<22;i++)mesh(SP(.1,8,6),cs[i%3],x+Math.cos(i*1.7)*.11,yb+.25+i*(H-.3)/21,z+Math.sin(i*1.7)*.11,g).castShadow=false;}
   for(let s=0;s<7;s++){const x=-E.w/2+.4+s*(E.w-.8)/6;for(let i=0;i<9;i++)mesh(SP(.085,8,6),cs[(i+s)%3],x,E.y-.05-i*.15,E.z+.03,g).castShadow=false;}},
 farbzelt(){},
 pulverpyramiden(e,g){const {D}=SHOP,yb=PY+.2;for(let i=0;i<5;i++){const x=-2.2+i*1.1;mesh(CY(.3,.22,.14,18),metal('#c99a3e'),x,yb+1.29,D/2-.35,g);mesh(new T.ConeGeometry(.27,.42,18),M(pc(e,i),{roughness:1}),x,yb+1.57,D/2-.35,g);}},
 /* Sommer */
 surfbretter(e,g){const sp=[[3.4,-1.1,-.22,0],[3.5,.15,-.18,1],[-3.4,.55,.2,2]];sp.forEach(([x,z,tilt,i])=>{const t=canvasTex(64,256,(c,w,h)=>{c.fillStyle='#ffffff';c.fillRect(0,0,w,h);c.fillStyle=pc(e,i);c.fillRect(0,0,w,h*.45);c.fillStyle=pc(e,i+1);c.fillRect(w*.42,0,w*.16,h);});
   const b=GR(g,x,PY+1.35,z);b.rotation.z=tilt;const bd=mesh(SP(1,24,16),new T.MeshStandardMaterial({map:t,roughness:.35}),0,0,0,b);bd.scale.set(.06,1.35,.33);mesh(BX(.12,.18,.04),'#333',Math.sign(-x)*.07,-1.0,0,b);});},
 tikifackeln(e,g){const night=!!e.night;[[3.4,2.3],[-3.4,2.3],[3.4,-2.1],[-3.4,-2.1]].forEach(([x,z],i)=>{const f=GR(g,x,PY,z);mesh(CY(.06,.07,2.2,8),'#c9a35a',0,1.1,0,f);for(let k=1;k<5;k++){const r=mesh(new T.TorusGeometry(.065,.015,6,10),'#9c7a3a',0,k*.45,0,f);r.rotation.x=Math.PI/2;}
   mesh(new T.CylinderGeometry(.16,.08,.25,10),'#5d4037',0,2.28,0,f);const f1=mesh(new T.ConeGeometry(.14,.5,10),glow('#ff9800',1.6),0,2.62,0,f),f2=mesh(new T.ConeGeometry(.08,.34,8),glow('#ffeb3b',1.8),0,2.56,0,f);f1.castShadow=f2.castShadow=false;
   if(night&&i<2){const pl=new T.PointLight(0xff9a3c,1.2,7,2);pl.position.set(0,2.7,0);f.add(pl);}const ph=i;anims.push(t=>{f1.scale.set(1+Math.sin(t*13+ph)*.1,1+Math.sin(t*9+ph)*.18,1);f2.scale.y=1+Math.sin(t*17+ph)*.2;});});},
 eistheke(e,g){const {W,D}=SHOP,yb=PY+.2;const z=D/2-.35,y=yb+1.24;mesh(BX(W-.6,.08,.66),'#e0f7fa',0,y,z,g);const ic=['#ff7aa2','#ffe76b','#a5d6a7','#8d5a3b','#fff3e0','#ba68c8'];
   for(let i=0;i<6;i++){const x=-2.1+i*.84;mesh(BX(.7,.22,.5),'#cfd8dc',x,y+.12,z,g);const s=mesh(SP(.27,14,10),ic[i],x,y+.26,z,g);s.scale.set(1.15,.6,.85);}
   const gl=new T.MeshStandardMaterial({color:'#e8f6ff',transparent:true,opacity:.22,roughness:.05,depthWrite:false});const lid=mesh(BX(W-.7,.04,.66),gl,0,y+.55,z+.08,g);lid.rotation.x=-.35;lid.castShadow=false;mesh(BX(W-.7,.36,.03),gl,0,y+.3,z-.32,g).castShadow=false;},
 sandsockel(e,g){mesh(CY(4.7,4.9,.12,48),M('#f0d59a',{roughness:1}),0,PY+.06,0,g).castShadow=false;const r=seeded(7);for(let i=0;i<16;i++){const a=r()*Math.PI*2,rad=3.3+r()*1.3;const s=mesh(SP(.12,10,6,0,Math.PI*2,0,Math.PI/2),['#ffccbc','#fff3e0','#f8bbd0'][i%3],Math.sin(a)*rad,PY+.12,Math.cos(a)*rad,g);s.scale.set(1,.5,1.2);}
   const c=GR(g,-3.1,PY+.12,2.75,.3);const sand=M('#e6c07b',{roughness:1});mesh(BX(1.1,.35,1.1),sand,0,.17,0,c);for(const sx of[-1,1])for(const sz of[-1,1]){mesh(CY(.17,.2,.75,10),sand,sx*.45,.45,sz*.45,c);mesh(new T.ConeGeometry(.2,.3,10),sand,sx*.45,.97,sz*.45,c);}mesh(CY(.28,.3,.9,12),sand,0,.65,0,c);mesh(CY(.01,.01,.5,4),'#795548',0,1.35,0,c);mesh(BX(.25,.15,.01),pc(e,0),.13,1.52,0,c);
   const st=makeItem('stern','#ff8a65');st.scale.setScalar(1.4);st.rotation.x=-Math.PI/2;st.position.set(2.9,PY+.1,3.2);g.add(st);},
 /* Tag der Deutschen Einheit */
 torfront(e,g,E,S){const {D}=SHOP,yb=PY+.2;if(S){S.g.position.y+=1.05;for(const sx of[-1,1])mesh(BX(.12,1.1,.12),e.trim,sx*S.w*.34,-S.h/2-1.2,-.02,S.g);}const st=M('#e8e0cc',{roughness:.85});const z=D/2+1.6;[-3.05,-2.25,2.25,3.05].forEach(x=>{mesh(BX(.5,.18,.5),st,x,yb+.09,z,g);mesh(CY(.17,.2,2.6,16),st,x,yb+1.45,z,g);mesh(BX(.46,.16,.46),st,x,yb+2.83,z,g);});
   mesh(BX(6.7,.38,.7),st,0,yb+3.1,z,g);mesh(BX(6.8,.08,.74),'#d6ccb2',0,yb+2.92,z,g);mesh(BX(2.2,.45,.6),st,0,yb+3.5,z,g);
   const q=GR(g,0,yb+3.73,z,0,.55);const ver=M('#6b8f71',{roughness:.5,metalness:.4});mesh(BX(.7,.5,.5),ver,0,.3,-.2,q);for(let i=0;i<4;i++){const h=GR(q,-.75+i*.5,0,.35);mesh(BX(.22,.28,.6),ver,0,.55,0,h);mesh(BX(.14,.38,.14),ver,0,.85,.3,h).rotation.x=-.5;mesh(BX(.12,.14,.26),ver,0,1.0,.42,h);for(const lx of[-1,1])for(const lz of[-1,1])mesh(BX(.05,.42,.05),ver,lx*.07,.2,lz*.22,h);}
   mesh(CY(.03,.03,.8,6),ver,0,1.2,-.2,q);const v=mesh(ext(starShape(4,.3,.12),.06),ver,0,1.7,-.2,q);v.scale.setScalar(.9);},
 mauergraffiti(e,g){const w=GR(g,-3.9,PY,-1.25,.55);const t=canvasTex(256,640,(x,W,H)=>{x.fillStyle='#b9bab5';x.fillRect(0,0,W,H);for(let i=0;i<400;i++){x.fillStyle=`rgba(0,0,0,${Math.random()*.08})`;x.fillRect(Math.random()*W,Math.random()*H,3,3);}
   const cs=['#ff4081','#ffeb3b','#00e5ff','#76ff03','#ff9100','#d500f9'];for(let i=0;i<9;i++){x.fillStyle=cs[i%6];x.globalAlpha=.85;x.beginPath();x.ellipse(40+(i*71)%180,120+(i*97)%460,30+(i%3)*18,20+(i%2)*25,i,0,7);x.fill();}x.globalAlpha=1;
   x.save();x.translate(W/2,H/2);x.rotate(-Math.PI/2);x.font='92px "Lilita One", sans-serif';x.textAlign='center';x.textBaseline='middle';x.lineWidth=12;x.strokeStyle='#111';x.strokeText('FREIHEIT',0,0);x.fillStyle='#ffeb3b';x.fillText('FREIHEIT',0,0);x.restore();});
   const cm=new T.MeshStandardMaterial({map:t,roughness:.9});mesh(BX(1.25,3.0,.22),cm,0,1.65,0,w);mesh(BX(1.25,.28,1.0),'#a7a8a3',0,.14,.3,w);const top=mesh(CY(.16,.16,1.25,12),'#a7a8a3',0,3.2,0,w);top.rotation.z=Math.PI/2;},
 fahnenbogen(e,g){const z=-2.25;const arc=mesh(new T.TorusGeometry(3.95,.07,8,48,Math.PI),metal('#d0d4da'),0,PY+.2,z,g);const ft=canvasTex(48,32,(x,w,h)=>{for(let i=0;i<3;i++){x.fillStyle=pc(e,i);x.fillRect(0,i*h/3,w,h/3+1);}});const fm=new T.MeshStandardMaterial({map:ft,side:T.DoubleSide});
   for(let i=1;i<14;i++){const a=i/14*Math.PI;const x=Math.cos(a)*3.95,y=PY+.2+Math.sin(a)*3.95;const fg=GR(g,x,y-.02,z+.05);const f=new T.Mesh(new T.PlaneGeometry(.42,.28),fm);f.position.set(.21,-.15,0);fg.add(f);fg.rotation.z=a-Math.PI/2;const ph=i;anims.push(t=>{fg.rotation.y=Math.sin(t*2+ph)*.25;});}},
 festbeleuchtung(e,g,E){const {W,D}=SHOP,yb=PY+.2,H=2.8;const bulbs=[];const add=(x,y,z,i)=>{const b=mesh(SP(.075,8,6),glow(pc(e,i),1),x,y,z,g);b.castShadow=false;bulbs.push(b);};
   for(let i=0;i<20;i++)add(-W/2-.3+i*(W+.6)/19,yb+H+.32,D/2+.31,i);for(const sx of[-1,1])for(let i=0;i<10;i++)add(sx*(W/2+.31),yb+H+.32,-D/2-.3+i*(D+.6)/9,i);for(let i=0;i<20;i++)add(-E.w/2+.1+i*(E.w-.2)/19,E.y-.02,E.z+.05,i+1);
   anims.push(t=>{const k=Math.floor(t*6);bulbs.forEach((b,i)=>{b.material.emissiveIntensity=(i+k)%3===0?1.4:.35;});});},
 /* Oktoberfest */
 rautendach(){},
 lebkuchenwand(e,g){const {W,D}=SHOP,yb=PY+.2;const words=['Servus','I mog di','Wiesn','Herzerl','Prost','Zuckerl','Gaudi'];
   const ht=w=>canvasTex(256,256,(x,cw,ch)=>{x.translate(128,132);x.scale(2.3,-2.3);x.beginPath();x.moveTo(0,-50);x.bezierCurveTo(-12,-36,-50,-16,-50,14);x.bezierCurveTo(-50,42,-18,52,0,30);x.bezierCurveTo(18,52,50,42,50,14);x.bezierCurveTo(50,-16,12,-36,0,-50);x.fillStyle='#9a5a26';x.fill();x.lineWidth=4;x.strokeStyle='#fffaf0';x.setLineDash([4,3]);x.stroke();x.setTransform(1,0,0,1,0,0);
     x.fillStyle='#fffaf0';x.font='34px "Lilita One", sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(w,128,120);const cs=['#e53935','#43a047','#1e88e5','#fdd835'];for(let i=0;i<6;i++){x.fillStyle=cs[i%4];x.beginPath();x.arc(70+i*23,165+(i%2)*10,6,0,7);x.fill();}});
   for(let i=0;i<7;i++){const x=-W/2+.45+i*(W-.9)/6;const big=i%3===1;const s=big?.85:.65;const hg=GR(g,x,yb+.56+(i%2)*.08,D/2+.06);const p=new T.Mesh(new T.PlaneGeometry(s,s),new T.MeshStandardMaterial({map:ht(words[i]),transparent:true,alphaTest:.1}));hg.add(p);
     const rb=tube([[-s*.3,s*.28,0],[0,s*.6,.02],[s*.3,s*.28,0]],.012,M(['#e53935','#1e88e5','#43a047'][i%3]),hg);rb.castShadow=false;const ph=i;anims.push(t=>{hg.rotation.z=Math.sin(t*1.5+ph)*.05;});}},
 fasstheke(e,g){const {W,D}=SHOP,yb=PY+.2;const pts=[];for(let i=0;i<=10;i++){const t=i/10;pts.push(new T.Vector2(.42+Math.sin(t*Math.PI)*.08,t*1.15-.575));}const bt=stripeTex(['#8d5a2b','#7a4a22','#9c6630'],'v',18);const bm=new T.MeshStandardMaterial({map:bt,roughness:.8});
   [-1.9,0,1.9].forEach(x=>{const b=mesh(new T.LatheGeometry(pts,24),bm,x,yb+.575,D/2+.02,g);for(const hy of[-.38,.38]){const r=mesh(new T.TorusGeometry(.48,.03,6,24),'#555',x,yb+.575+hy,D/2+.02,g);r.rotation.x=Math.PI/2;}mesh(CY(.06,.06,.1,8),'#c9a227',x,yb+.4,D/2+.52,g).rotation.x=Math.PI/2;});
   mesh(BX(W+.3,.12,1.45),'#6d4027',0,yb+1.22,D/2-.1,g);},
 breznschild(e,g,E,S){if(!S)return;const k=mesh(new T.TorusKnotGeometry(.55,.16,140,12,2,3),M('#d9a23a',{metalness:.55,roughness:.32}),0,S.h/2+.95,-.05,S.g);k.scale.set(1.25,1,.45);
   for(let i=0;i<20;i++){const a=i*2.4;mesh(BX(.04,.04,.04),'#ffffff',Math.cos(a)*.7,S.h/2+.95+Math.sin(a*1.3)*.5,.12,S.g).castShadow=false;}for(const sx of[-1,1])mesh(CY(.015,.015,.5,4),'#888',sx*S.w*.3,S.h/2+.25,0,S.g);},
 /* Halloween */
 geister(e,g){for(let i=0;i<3;i++){const gh=new T.Group();g.add(gh);const m=M('#f5f5ff',{transparent:true,opacity:.78,emissive:'#d9e1ff',emissiveIntensity:.45,roughness:.6});mesh(SP(.38,16,12),m,0,.55,0,gh);
   const body=new T.CylinderGeometry(.38,.55,.9,18,4,true);const p=body.attributes.position;for(let v=0;v<p.count;v++){const y=p.getY(v);if(y<-.4){const a=Math.atan2(p.getZ(v),p.getX(v));p.setY(v,y+Math.sin(a*6)*.1);}}body.computeVertexNormals();const bm=mesh(body,m,0,.1,0,gh);bm.material.side=T.DoubleSide;
   for(const sx of[-1,1]){const ey=mesh(SP(.07,8,6),'#111',sx*.13,.62,.33,gh);ey.scale.y=1.5;}mesh(SP(.06,8,6),'#111',0,.45,.35,gh);
   const ph=i*2.1,R=4.3;anims.push(t=>{const a=t*.4+ph;gh.position.set(Math.sin(a)*R,PY+3+Math.sin(t*1.6+ph)*.35+i*.3,Math.cos(a)*R);gh.rotation.y=a+Math.PI/2;gh.rotation.z=Math.sin(t*2+ph)*.12;});}},
 kesselnebel(e,g){const k=GR(g,-2.7,PY,2.9,.4);for(let i=0;i<3;i++){const l=mesh(CY(.06,.07,.9,8),'#4e342e',0,.12,0,k);l.rotation.z=Math.PI/2;l.rotation.y=i*Math.PI/3;}const f1=mesh(new T.ConeGeometry(.22,.5,10),glow('#ff7a1a',1.6),0,.35,0,k);f1.castShadow=false;
   const pot=mesh(new T.SphereGeometry(.6,20,14,0,Math.PI*2,.5,Math.PI-.5),M('#1d1b22',{roughness:.45,metalness:.4,side:T.DoubleSide}),0,.95,0,k);const rim=mesh(new T.TorusGeometry(.53,.06,8,24),'#2b2833',0,1.48,0,k);rim.rotation.x=Math.PI/2;
   const liq=mesh(new T.CircleGeometry(.5,24),glow('#7cff6b',.9),0,1.44,0,k);liq.rotation.x=-Math.PI/2;const bubs=[];for(let i=0;i<5;i++){const b=mesh(SP(.07,8,6),glow('#a6ff8f',.8),(Math.random()-.5)*.6,1.47,(Math.random()-.5)*.6,k);bubs.push(b);}
   const em=emitter(g,{n:240,size:1.0,tex:'soft',opacity:.42});const wp=new T.Vector3();k.updateMatrixWorld();let acc=0;
   anims.push((t,dt)=>{f1.scale.y=1+Math.sin(t*14)*.2;bubs.forEach((b,i)=>{const s=(t*1.3+i*.37)%1;b.scale.setScalar(s*1.5);});acc+=dt;k.getWorldPosition(wp);while(acc>.08){acc-=.08;em.emit(wp.x+(rnd()-.5)*.6,wp.y+1.5,wp.z+(rnd()-.5)*.6,(rnd()-.5)*.3,.5+rnd()*.4,(rnd()-.5)*.3,rnd()>.4?'#8dff7a':'#5fd36b',3.2);}em.step(dt,.05,.985);});},
 augenfenster(e,g){const {W}=SHOP,yb=PY+.2,H=3.0;const pairs=[];const mk=(x,y,z,ry,s)=>{const p=GR(g,x,y,z,ry,s);const eyes=[];for(const sx of[-1,1]){const w=mesh(SP(.1,12,8),glow('#ffe14d',1.2),sx*.13,0,0,p);const pu=mesh(SP(.045,8,6),'#111',sx*.13,0,.08,p);eyes.push([w,pu]);}pairs.push({p,eyes,ph:Math.random()*10});};
   for(const sx of[-1,1])mk(sx*(W/2+.08),yb+1.92,-.2,sx*Math.PI/2,1);for(const sx of[-1,1])mk(sx*(W/2+.1)+.14,yb+H+.77,0,sx*Math.PI/2,.8);
   anims.push(t=>{pairs.forEach(({eyes,ph})=>{const bl=((t+ph)%4)<.15?.1:1;const lx=Math.sin(t*.7+ph)*.04;eyes.forEach(([w,pu])=>{w.scale.y=bl;pu.scale.y=bl;pu.position.x=pu.position.x>0?.13+lx:-.13+lx;});});});},
 toterbaum(e,g){const tr=GR(g,3.95,PY,-1.5,.3);const bark=M('#3b3036',{roughness:.95});const br=(par,len,rad,depth,seed)=>{const seg=mesh(CY(rad*.6,rad,len,7),bark,0,len/2,0,par);if(depth<=0)return;for(let k=0;k<(depth>2?2:3);k++){const pv=new T.Group();pv.position.y=len*(.65+k*.15);pv.rotation.z=(k%2?1:-1)*(.5+((seed+k)%3)*.2);pv.rotation.y=k*2.1+seed;par.add(pv);br(pv,len*.62,rad*.6,depth-1,seed+k+1);}};
   br(tr,1.6,.3,3,1);const crow=GR(tr,.55,2.75,.25,-.6);const black=M('#121214',{roughness:.5});const b=mesh(SP(.2,12,10),black,0,0,0,crow);b.scale.set(1,.85,1.5);const hd=GR(crow,0,.18,.26);mesh(SP(.12,10,8),black,0,0,0,hd);mesh(new T.ConeGeometry(.04,.16,6),'#9e9e9e',0,-.02,.15,hd).rotation.x=Math.PI/2;mesh(SP(.025,6,6),glow('#ff3d00',1.2),.06,.04,.08,hd);
   mesh(BX(.05,.05,.35),black,0,-.05,-.35,crow).rotation.x=.4;anims.push(t=>{hd.rotation.y=Math.sin(t*.9)>.6?.7:Math.sin(t*.9)<-.6?-.7:0;});},
 /* Thanksgiving */
 erntekranz(e,g){const {W}=SHOP,yb=PY+.2,H=2.4;const leaf=['#e67e22','#c0392b','#f1c40f','#8d5524','#d35400'];for(const sx of[-1,1]){const w=GR(g,sx*(W/2+.1),yb+H+.55,0,sx*Math.PI/2);for(let i=0;i<28;i++){const a=i/28*Math.PI*2;const l=mesh(SP(.13,8,6),leaf[i%5],Math.cos(a)*.62,Math.sin(a)*.62,0,w);l.scale.set(1.2,.7,.35);l.rotation.z=a;}
   for(let i=0;i<6;i++){const a=i/6*Math.PI*2+.26;const c=mesh(CY(.06,.05,.3,8),'#f1c40f',Math.cos(a)*.62,Math.sin(a)*.62,.08,w);c.rotation.z=a;}mesh(BX(.28,.16,.06),'#8e2a1c',0,-.66,.1,w);for(const bx of[-1,1]){const t=mesh(new T.ConeGeometry(.08,.3,6),'#8e2a1c',bx*.08,-.85,.1,w);t.rotation.z=bx*.3;}}},
 truthahn(e,g){const tk=GR(g,3.9,PY,1.25,-.7,1.05);const brown=M('#6d4027',{roughness:.8});const b=mesh(SP(.55,18,14),brown,0,.85,0,tk);b.scale.set(.9,1,1.05);for(const sx of[-1,1]){mesh(CY(.03,.03,.45,6),'#ff9800',sx*.18,.25,0,tk);mesh(BX(.18,.03,.2),'#ff9800',sx*.18,.03,.08,tk);}
   const fan=GR(tk,0,1.0,-.35);const fc=['#8d4e24','#d35400','#c0392b','#f39c12','#6d4027'];const feathers=[];for(let i=0;i<9;i++){const a=-1.2+i*.3;const fp=new T.Group();fp.rotation.z=a;fan.add(fp);const f=mesh(SP(.22,10,8),fc[i%5],0,.55,0,fp);f.scale.set(.55,1.9,.12);mesh(SP(.06,8,6),'#fff8e1',0,.95,.02,fp).scale.set(1,1.4,.5);feathers.push(fp);}fan.rotation.x=-.2;
   const nk=mesh(CY(.1,.14,.45,10),brown,0,1.3,.38,tk);nk.rotation.x=.3;const hd=GR(tk,0,1.58,.48);mesh(SP(.15,12,10),'#b0796a',0,0,0,hd);mesh(new T.ConeGeometry(.05,.14,8),'#ffb300',0,-.02,.17,hd).rotation.x=Math.PI/2;const wt=mesh(SP(.05,8,6),'#e53935',.02,-.12,.12,hd);wt.scale.y=2;for(const sx of[-1,1])mesh(SP(.03,6,6),'#111',sx*.08,.05,.11,hd);
   anims.push(t=>{const s=1+Math.sin(t*1.5)*.06;feathers.forEach((f,i)=>{f.rotation.z=(-1.2+i*.3)*s;});hd.rotation.y=Math.sin(t*.8)*.4;});},
 vogelscheuche(e,g){const s=GR(g,-3.95,PY,1.2,.6);const wood=M('#7a5230');mesh(CY(.06,.07,2.9,8),wood,0,1.45,0,s);mesh(BX(1.8,.1,.1),wood,0,2.05,0,s);const ck=canvasTex(64,64,(x,w,h)=>{x.fillStyle='#c62828';x.fillRect(0,0,w,h);x.fillStyle='rgba(0,0,0,.45)';for(let i=0;i<4;i++){x.fillRect(i*16,0,6,h);x.fillRect(0,i*16,w,6);}});
   const sm=new T.MeshStandardMaterial({map:ck});mesh(BX(.75,.9,.4),sm,0,1.75,0,s);mesh(BX(1.5,.24,.26),sm,0,2.05,0,s);const straw=M('#e0b84a',{roughness:1});for(const sx of[-1,1])for(let k=0;k<4;k++){const c=mesh(new T.ConeGeometry(.04,.3,5),straw,sx*(.82+k*.03),2.0+(k-1.5)*.05,0,s);c.rotation.z=sx*-1.4;}for(let k=0;k<6;k++){const c=mesh(new T.ConeGeometry(.04,.32,5),straw,-.25+k*.1,1.22,0,s);c.rotation.x=Math.PI;}
   const ft=canvasTex(128,128,(x,w,h)=>{x.fillStyle='#d2b48c';x.fillRect(0,0,w,h);x.strokeStyle='rgba(90,60,30,.4)';for(let i=0;i<16;i++){x.beginPath();x.moveTo(i*8,0);x.lineTo(i*8,h);x.stroke();}x.fillStyle='#222';x.beginPath();x.arc(42,52,9,0,7);x.arc(86,52,9,0,7);x.fill();x.strokeStyle='#222';x.lineWidth=4;x.beginPath();x.moveTo(36,88);x.lineTo(92,88);x.stroke();for(let i=0;i<6;i++){x.beginPath();x.moveTo(40+i*10,82);x.lineTo(40+i*10,94);x.stroke();}x.fillStyle='#e65100';x.beginPath();x.moveTo(64,60);x.lineTo(58,76);x.lineTo(70,76);x.fill();});
   const hd=mesh(SP(.33,18,14),new T.MeshStandardMaterial({map:ft}),0,2.55,0,s);hd.rotation.y=-Math.PI/2;mesh(CY(.62,.62,.04,20),straw,0,2.82,0,s);const cr=mesh(new T.ConeGeometry(.32,.45,14),straw,0,3.05,0,s);mesh(CY(.33,.33,.08,14),'#c62828',0,2.88,0,s);
   anims.push(t=>{s.rotation.z=Math.sin(t*.9)*.025;});},
 maisbuendel(e,g){const {W,D}=SHOP,yb=PY+.2;for(const sx of[-1,1]){const b=GR(g,sx*(W/2+.12),PY,D/2+.12);for(let k=0;k<7;k++){const a=k/7*Math.PI*2;const st=GR(b,Math.cos(a)*.18,0,Math.sin(a)*.18);st.rotation.z=Math.cos(a)*.12;st.rotation.x=Math.sin(a)*.12;mesh(CY(.035,.05,2.4,6),'#c9a96e',0,1.2,0,st);for(let l=0;l<3;l++){const lf=mesh(BX(.06,.7,.02),'#b8955a',.12,1.0+l*.5,0,st);lf.rotation.z=-.6;}}
   const band=mesh(new T.TorusGeometry(.26,.04,6,16),'#e65100',0,1.1,0,b);band.rotation.x=Math.PI/2;for(let k=0;k<3;k++){const c=mesh(CY(.07,.06,.38,8),['#f1c40f','#e67e22','#c0392b'][k],(k-1)*.15,.9,.28,b);c.rotation.x=.2;}}},
 /* Advent */
 riesenkalender(e,g){const k=GR(g,0,0,-17,0,.85);const BW=12,BH=7,BD=2.2,y0=.7;const day=TODAY.getMonth()===11?TODAY.getDate():0;
   const wood=M('#4a2a14',{roughness:.85});const gold=metal('#ffd166');mesh(BX(BW+1.2,y0,BD+1.2),wood,0,y0/2,0,k);mesh(BX(BW+1.4,.12,BD+1.4),M('#f4f8ff',{roughness:.95}),0,y0+.02,0,k);
   const bt=canvasTex(512,512,(x,w,h)=>{const gr=x.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#a01d1d');gr.addColorStop(1,'#5e0f12');x.fillStyle=gr;x.fillRect(0,0,w,h);x.strokeStyle='rgba(255,255,255,.18)';x.lineWidth=2;for(let i=0;i<26;i++){const cx=Math.random()*w,cy=Math.random()*h,r=6+Math.random()*10;x.beginPath();for(let a=0;a<6;a++){x.moveTo(cx,cy);x.lineTo(cx+Math.cos(a*Math.PI/3)*r,cy+Math.sin(a*Math.PI/3)*r);}x.stroke();}});
   const body=new T.MeshStandardMaterial({map:bt,roughness:.7,emissive:0xffffff,emissiveMap:bt,emissiveIntensity:e.night?.12:0});mesh(BX(BW,BH,BD),body,0,y0+BH/2,0,k);
   for(const sx of[-1,1]){const cn=GR(k,sx*(BW/2+.3),y0,BD/2-.2);mesh(new T.CylinderGeometry(.28,.28,BH+.4,16),new T.MeshStandardMaterial({map:stripeTex(['#e53935','#ffffff'],'h',22)}),0,(BH+.4)/2,0,cn);const ball=mesh(SP(.38,16,12),gold,0,BH+.7,0,cn);}
   mesh(BX(BW+.2,.25,.25),gold,0,y0+BH,BD/2+.02,k);mesh(BX(BW+.2,.25,.25),gold,0,y0+.12,BD/2+.02,k);
   const rise=2.6,hd=BD/2+.6,L=BW+1.2,len=Math.hypot(hd,rise),ang=Math.atan2(rise,hd);const rf=M('#2e6b34',{roughness:.8}),sn=M('#f7fbff',{roughness:.95});
   for(const sz of[1,-1]){const p=mesh(BX(L,.25,len),rf,0,y0+BH+rise/2,sz*hd/2,k);p.rotation.x=sz*ang;const s=mesh(BX(L+.1,.2,len*.55),sn,0,y0+BH+rise*.78+.16,sz*hd*.22,k);s.rotation.x=sz*ang;}
   const sh=new T.Shape();sh.moveTo(-BD/2,0);sh.lineTo(BD/2,0);sh.lineTo(0,rise*(1-(hd-BD/2)/hd)+.0);sh.closePath();for(const sx of[-1,1]){const gm=mesh(new T.ExtrudeGeometry(sh,{depth:.2,bevelEnabled:false}),body,sx*(BW/2-.1)-.1,y0+BH,0,k);gm.rotation.y=Math.PI/2;}
   const gsh=new T.Shape();gsh.moveTo(-BW/2,0);gsh.lineTo(BW/2,0);gsh.lineTo(0,rise*.92);gsh.closePath();const gab=mesh(new T.ExtrudeGeometry(gsh,{depth:.15,bevelEnabled:false}),body,0,y0+BH,BD/2-.15,k);
   const ttl=new T.Mesh(new T.PlaneGeometry(6.4,1.1),new T.MeshStandardMaterial({map:textTex('Adventskalender',{w:1024,h:180,size:130,color:'#ffd166',bg:'#3a0a0c'}),emissive:0xffffff,emissiveIntensity:0}));ttl.material.emissiveMap=ttl.material.map;ttl.material.emissiveIntensity=e.night?.6:.15;ttl.position.set(0,y0+BH+.95,BD/2+.02);k.add(ttl);mesh(BX(6.7,1.35,.12),gold,0,y0+BH+.95,BD/2-.05,k);
   const st=mesh(ext(starShape(5,.5,.21),.25),glow('#ffd54f',1.3),0,y0+BH+rise+.75,0,k);st.scale.setScalar(1.6);
   const bulbs=[];for(const sz of[1,-1])for(let i=0;i<=14;i++){const t=i/14;const x=-L/2+t*L;const b=mesh(SP(.11,8,6),glow(['#ffd54f','#e53935','#43a047','#ffffff'][i%4],1),x,y0+BH-.08,sz*(hd+.05),k);b.castShadow=false;bulbs.push(b);}
   const icons=['stern','geschenk','kugel','herz','kerze','zuckerstange','stiefel','kuchen'];const order=[7,15,2,20,11,23,4,18,9,1,13,22,16,6,24,10,3,19,12,21,8,14,5,17];const cw=(BW-1.2)/6,ch=(BH-1.0)/4;const spin=[];
   for(let r=0;r<4;r++)for(let c=0;c<6;c++){const n=order[r*6+c];const cx=-BW/2+.6+cw*(c+.5),cy=y0+BH-.55-ch*(r+.5),dw=cw-.28,dh=ch-.26,fz=BD/2;
     mesh(BX(dw+.16,dh+.16,.14),gold,cx,cy,fz+.03,k);mesh(BX(dw,dh,.5),M('#2b0a0a',{roughness:.9}),cx,cy,fz-.18,k);
     const hinge=GR(k,cx-dw/2,cy,fz+.14);const dt=canvasTex(160,128,(x,w,h)=>{x.fillStyle=n===24?'#ffd166':(n%3===0?'#2e6b34':n%3===1?'#c62828':'#1e5aa8');x.fillRect(0,0,w,h);x.strokeStyle='#ffd166';x.lineWidth=7;x.strokeRect(5,5,w-10,h-10);x.fillStyle=n===24?'#5e0f12':'#fff8e1';x.font='76px "Lilita One", sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(n,w/2,h/2+4);});
     const dm=new T.MeshStandardMaterial({map:dt,roughness:.55});const door=mesh(BX(dw,dh,.12),dm,dw/2,0,0,hinge);const knob=mesh(SP(.06,8,6),gold,dw-.14,0,.08,hinge);door.userData.calDoor=n;knob.userData.calDoor=n;const ent={big:true,hinge,dm,k,cx,cy,fz,dw,dh};(calDoors[n]=calDoors[n]||[]).push(ent);
     if(calOpenedFor(e).includes(n))calShowOpen(n,true);else if(canOpenDoor(e,n)){anims.push(t=>{if(ent.glowOff)return;dm.emissive.set('#ffd166');dm.emissiveIntensity=.06+Math.max(0,Math.sin(t*2.4+n))*.22;});}}
   anims.push(t=>{st.rotation.y=t*.6;spin.forEach((s,i)=>{s.rotation.y=t+i;});const kk=Math.floor(t*3);bulbs.forEach((b,i)=>{b.material.emissiveIntensity=(i+kk)%4===0?1.5:.45;});});
   if(e.night){const pl=new T.PointLight(0xffd8a0,1.4,20,2);pl.position.set(0,y0+BH*.6,BD/2+3.5);k.add(pl);}},
 schneedach(e,g){const {W,D}=SHOP,yb=PY+.2,H=2.5,rise=1.25,hd=D/2+.55,L=W+.95;const sn=M('#f7fbff',{roughness:.95});const len=Math.hypot(hd,rise),a=Math.atan2(rise,hd);
   for(const sz of[1,-1]){const p=mesh(BX(L,.3,len+.1),sn,0,yb+H+rise/2+.2,sz*hd/2,g);p.rotation.x=sz*a;}const r=seeded(5);for(let i=0;i<16;i++){for(const sz of[1,-1]){const l=mesh(SP(.24,10,8),sn,-L/2+.2+i*(L-.4)/15,yb+H+.12,sz*(hd+.02),g);l.scale.set(1.2,.55,.8);}}for(let i=0;i<8;i++){const l=mesh(SP(.3,10,8),sn,-L/2+.4+i*(L-.8)/7,yb+H+rise+.3,0,g);l.scale.set(1.3,.5,1);}
   const bt=canvasTex(64,64,(x,w,h)=>{x.fillStyle='#8e3b2a';x.fillRect(0,0,w,h);x.fillStyle='#d7c4b0';for(let j=0;j<8;j++){x.fillRect(0,j*8,w,1.5);for(let i=0;i<4;i++)x.fillRect(((j%2)*8+i*16),j*8,1.5,8);}});
   const cx=1.6,cz=-.65;mesh(BX(.55,1.4,.55),new T.MeshStandardMaterial({map:bt}),cx,yb+H+rise*.6+.5,cz,g);mesh(BX(.68,.22,.68),sn,cx,yb+H+rise*.6+1.25,cz,g);
   const em=emitter(g,{n:160,size:1.0,tex:'soft',opacity:.4});let acc=0;const top=yb+H+rise*.6+1.35;anims.push((t,dt)=>{acc+=dt;while(acc>.14){acc-=.14;em.emit(cx+(rnd()-.5)*.2,top,cz,(rnd()-.3)*.25,.55+rnd()*.25,(rnd()-.5)*.2,rnd()>.5?'#e3e7ee':'#c9ced8',4.5);}em.step(dt,.03,.99);});},
 lebkuchenhaus(e,g,E){const ic=M('#fffaf0',{roughness:.6});const pts=[];for(let i=0;i<=40;i++){const t=i/40;pts.push([-E.w/2+.1+t*(E.w-.2),E.y-.12-Math.abs(Math.sin(t*Math.PI*10))*.16,E.z+.04]);}tube(pts,.05,ic,g,false,200);
   const gd=['#e53935','#43a047','#fdd835','#1e88e5','#ff80ab'];for(let i=0;i<9;i++){const x=-E.w/2+.4+i*(E.w-.8)/8;const d=mesh(SP(.12,10,8),M(gd[i%5],{roughness:.25}),x,E.y+.06,E.z+.02,g);d.scale.y=.75;}
   const {W,D}=SHOP,yb=PY+.2;for(const sx of[-1,1]){const cn=GR(g,sx*(W/2+.25),PY,D/2+.25);mesh(new T.CylinderGeometry(.07,.07,2.6,12),new T.MeshStandardMaterial({map:stripeTex(['#e53935','#ffffff'],'h',14)}),0,1.3,0,cn);const h=mesh(new T.TorusGeometry(.18,.07,8,16,Math.PI),M('#e53935'),-sx*.18,2.6,0,cn);if(sx>0)h.rotation.y=Math.PI;}},
 kalenderfenster(e,g){const {W}=SHOP,yb=PY+.2;const day=TODAY.getMonth()===11?TODAY.getDate():0;const fr=GR(g,W/2+.02,0,0,Math.PI/2);mesh(BX(3.0,1.02,.04),'#5a3420',0,yb+.72,0,fr);
   for(let i=0;i<24;i++){const c=i%8,r=Math.floor(i/8);const n=i+1;const x=-1.31+c*.375,y=yb+1.1-r*.33;const hinge=GR(fr,x-.16,y,.03);const dt=canvasTex(64,48,(cx,w,h)=>{cx.fillStyle=n%2?'#c62828':'#2e6b34';cx.fillRect(0,0,w,h);cx.fillStyle='#fff8e1';cx.font='30px "Lilita One", sans-serif';cx.textAlign='center';cx.textBaseline='middle';cx.fillText(n,w/2,h/2+2);});
     const sdm=new T.MeshStandardMaterial({map:dt});const sd=mesh(BX(.32,.27,.03),sdm,.16,0,0,hinge);sd.userData.calDoor=n;(calDoors[n]=calDoors[n]||[]).push({big:false,hinge,dm:sdm,x,y,fr});if(calOpenedFor(e).includes(n)){hinge.rotation.y=-1.6;mesh(BX(.28,.23,.01),glow('#ffd166',.7),x,y,.0,fr);}}},
 schlitten(e,g){const s=GR(g,3.9,PY,1.15,-.9);const gold=metal('#ffd54f');for(const sx of[-1,1]){const pts=[[sx*.45,.08,-.9],[sx*.45,.05,.5],[sx*.45,.25,.95],[sx*.45,.6,.95],[sx*.45,.55,.7]];tube(pts,.04,gold,s,false,60);for(const z of[-.6,.3])mesh(CY(.03,.03,.45,6),gold,sx*.45,.3,z,s);}
   const red=M('#c62828',{roughness:.4});mesh(BX(1.0,.45,1.3),red,0,.75,-.1,s);mesh(BX(1.0,.7,.15),red,0,1.0,-.75,s);mesh(BX(1.04,.06,1.34),gold,0,.99,-.1,s);const sk=mesh(SP(.45,14,12),'#8d6e63',0,1.25,-.25,s);sk.scale.set(1,1.15,.9);mesh(new T.TorusGeometry(.14,.04,6,12),'#ffd54f',0,1.68,-.25,s).rotation.x=Math.PI/2;
   [['geschenk','#2e7d32',-.2],['geschenk','#ffd54f',.18],['zuckerstange','#ffffff',0]].forEach(([sh,c,x],i)=>{const it=makeItem(sh,c);it.scale.setScalar(1.4);it.position.set(x,1.55+i*.05,-.35);s.add(it);});},
 /* Weihnachten */
 rentiere(e,g){[[-2.95,3.1,.45,true],[-3.85,2.15,.75,false]].forEach(([x,z,ry,rn])=>{const r=GR(g,x,PY,z,ry,1);const br=M('#8d5a3b',{roughness:.8});mesh(BX(.5,.5,1.1),br,0,1.0,0,r);for(const lx of[-1,1])for(const lz of[-1,1])mesh(BX(.11,.8,.11),br,lx*.17,.4,lz*.4,r);mesh(SP(.13,8,6),'#fff8e1',0,1.15,-.58,r);
   const nk=mesh(BX(.22,.6,.22),br,0,1.45,.45,r);nk.rotation.x=.45;const hd=GR(r,0,1.78,.65);mesh(BX(.3,.3,.4),br,0,0,0,hd);mesh(BX(.22,.2,.22),'#a1755a',0,-.06,.26,hd);mesh(SP(.07,10,8),rn?glow('#ff1744',1.4):M('#3e2723'),0,-.02,.38,hd);for(const sx of[-1,1]){mesh(SP(.04,6,6),'#111',sx*.1,.08,.18,hd);const an=GR(hd,sx*.12,.15,-.05);an.rotation.z=sx*-.4;mesh(CY(.025,.03,.5,6),'#d7b98e',0,.25,0,an);const tw=mesh(CY(.02,.025,.25,6),'#d7b98e',sx*.1,.35,0,an);tw.rotation.z=sx*-.8;}
   const hb=mesh(new T.TorusGeometry(.3,.05,6,16),'#c62828',0,1.25,.3,r);hb.rotation.x=Math.PI/2.4;mesh(SP(.06,8,6),metal('#ffd54f'),0,1.05,.52,r);anims.push(t=>{hd.rotation.x=Math.sin(t*1.1+x)*.12;});});},
 geschenkberg(e,g){const r=seeded(13);const cs=['#d32f2f','#2e7d32','#ffd54f','#1e88e5','#ffffff','#8e24aa'];const b=GR(g,4.0,PY,-2.0,.4);let y=0;[[3,1.0],[3,.85],[2,.75],[1,.7]].forEach(([n,s],l)=>{for(let i=0;i<n;i++){const gf=makeItem('geschenk',cs[Math.floor(r()*6)]);const sc=s*2.6*(0.85+r()*.3);gf.scale.setScalar(sc);gf.position.set((i-(n-1)/2)*s*1.25,y,(r()-.5)*.3);gf.rotation.y=r()*1.2;b.add(gf);}y+=s*1.12;});
   const st=mesh(ext(starShape()),glow('#ffd54f',1.1),0,y+.4,0,b);st.scale.setScalar(.6);anims.push(t=>{st.rotation.y=t;});},
 glitzerschnee(e,g,E){const sn=M('#ffffff',{roughness:.4,emissive:'#dfefff',emissiveIntensity:.15});const pts=[];for(let i=0;i<=30;i++){const t=i/30;pts.push([-E.w/2+t*E.w,E.y+.08+Math.sin(t*37)*.03,E.z+.03]);}tube(pts,.11,sn,g,false,120);
   const sp=new Float32Array(90*3);for(let i=0;i<90;i++){sp[i*3]=-E.w/2+Math.random()*E.w;sp[i*3+1]=E.y+.12+Math.random()*.25;sp[i*3+2]=E.z+(Math.random()-.5)*.4;}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(sp,3));const pm=new T.PointsMaterial({size:.16,map:spriteTex('star'),color:'#ffffff',transparent:true,depthWrite:false,blending:T.AdditiveBlending});const pp=new T.Points(geo,pm);g.add(pp);anims.push(t=>{pm.opacity=.45+Math.abs(Math.sin(t*3))*.55;pm.size=.12+Math.abs(Math.sin(t*2.3))*.08;});
   const {W,D}=SHOP;for(const sx of[-1,1]){const cn=GR(g,sx*(W/2+.3),PY,D/2+.3);mesh(new T.CylinderGeometry(.08,.08,3.0,12),new T.MeshStandardMaterial({map:stripeTex(['#e53935','#ffffff'],'h',16)}),0,1.5,0,cn);const h=mesh(new T.TorusGeometry(.2,.08,8,16,Math.PI),M('#e53935'),sx*.2,3.0,0,cn);if(sx<0)h.rotation.y=Math.PI;}},
 krippe(e,g){const k=GR(g,2.95,PY,3.05,-.5);const wood=M('#6d4c2a',{roughness:.9});for(const sx of[-1,1])for(const sz of[-1,1])mesh(BX(.1,1.4,.1),wood,sx*.7,.7,sz*.45,k);mesh(BX(1.5,.9,.06),plank('#7a5230'),0,.55,-.48,k);const rf=mesh(BX(1.7,.08,1.2),M('#d9b45a',{roughness:1}),0,1.5,0,k);rf.rotation.x=-.22;
   const mg=GR(k,0,0,.05);mesh(BX(.6,.08,.32),wood,0,.35,0,mg);for(const sx of[-1,1]){const l=mesh(BX(.06,.35,.06),wood,sx*.25,.17,0,mg);l.rotation.z=sx*.3;}mesh(BX(.55,.1,.28),M('#e0c068',{roughness:1}),0,.44,0,mg);const lg=mesh(SP(.14,12,10),glow('#fff3c4',.9),0,.52,0,mg);lg.scale.set(1.3,.6,.8);
   mesh(CY(.02,.02,1.1,6),'#9e9e9e',0,2.0,.2,k);const st=mesh(ext(starShape(5,.5,.2),.08),glow('#ffd54f',1.4),0,2.65,.2,k);st.scale.setScalar(.55);
   const sh=GR(k,.95,0,.55,-.6);const wool=M('#f5f5f5',{roughness:1});for(let i=0;i<7;i++)mesh(SP(.16,10,8),wool,(i%3-1)*.14,.38+(i>3?.1:0),Math.floor(i/3)*.12-.1,sh);mesh(BX(.14,.16,.18),'#3e3e3e',0,.45,.28,sh);for(const lx of[-1,1])for(const lz of[-1,1])mesh(BX(.05,.25,.05),'#3e3e3e',lx*.1,.12,lz*.12,sh);
   anims.push(t=>{st.rotation.y=t*.7;lg.material.emissiveIntensity=.7+Math.sin(t*2)*.2;});},
};
Object.assign(EXB,SPX);

function buildShop(e,g){
  const s=e.shop,{W,D}=SHOP,yb=PY+.2;const st=STYLE_BUILD[s.style]?s.style:'kiosk';
  mesh(BX(W+.4,.2,D+.4),e.trim,0,PY+.1,0,g);
  mesh(BX(W,1.1,.7),s.counter,0,yb+.55,D/2-.35,g);
  mesh(BX(W+.2,.12,.95),e.trim,0,yb+1.16,D/2-.35,g);
  for(const hy of [1.35,2.15])mesh(BX(W-.6,.1,.6),e.trim,0,yb+hy,-D/2+.5,g);
  for(const sx of[-1,1])mesh(BX(.1,2.2,.1),e.trim,sx*(W/2-.45),yb+1.1,-D/2+.25,g);
  const info=STYLE_BUILD[st](e,g,yb);EAVE=info.eave;
  const S=addSign(e,g,info.sign);
  (s.extras||[]).forEach(k=>EXB[k]&&EXB[k](e,g,EAVE,S));
  // Deko-Artikel auf Theke und Regal
  const items=(e.items||[]).slice(0,6);
  const wreath=(e.decor||[]).includes('wreath');
  const spots=[];
  (wreath?[-1.7,1.7]:[-1.7,0,1.7]).forEach(x=>spots.push([x,yb+1.4,-D/2+.45]));[-1.7,0,1.7].forEach(x=>spots.push([x,yb+2.2,-D/2+.45]));
  items.forEach((it,i)=>{const [x,y,z]=spots[i];const m=makeItem(it.shape,it.color,e.palette);m.position.set(x,y,z);m.scale.setScalar(1.1);g.add(m);
    const ph=i*1.7;anims.push(t=>{m.rotation.y=Math.sin(t*.8+ph)*.5;});});
}

/* ---------- Deko ---------- */
const RING_R=7.75;
const polar=(a,r=RING_R)=>[Math.sin(a)*r,Math.cos(a)*r];
function sectorAngles(i,n,k){const a0=.62,span=Math.PI*2-2*a0,w=span/n;const out=[];for(let j=0;j<k;j++)out.push(a0+i*w+w*(j+.5)/k);return out;}
const pc=(e,i)=>e.palette[i%e.palette.length];

const builders={
 rockets(e,g,A){A.forEach((a,i)=>{const [x,z]=polar(a);const r=new T.Group();r.position.set(x,PY,z);r.rotation.z=(i%2?.08:-.08);g.add(r);
   mesh(CY(.03,.03,1.3,6),'#8d6e63',0,.65,0,r);mesh(CY(.14,.14,.7,14),pc(e,i),.17,1.15,0,r);mesh(new T.ConeGeometry(.14,.3,14),'#ffffff',.17,1.65,0,r);mesh(CY(.15,.15,.08,14),'#ffd54f',.17,.84,0,r);});},
 balloons(e,g,A){A.forEach((a,i)=>{const [x,z]=polar(a);const b=new T.Group();b.position.set(x,PY,z);g.add(b);mesh(BX(.25,.18,.25),'#666',0,.09,0,b);
   for(let j=0;j<3;j++){const ox=(j-1)*.42,oz=(j%2)*.25,h=2.6+j*.35;const ln=mesh(CY(.008,.008,h-.2,4),'#e0e0e0',ox/2,h/2,oz/2,b);ln.rotation.z=-ox*.15;const bl=mesh(SP(.36,18,14),M(pc(e,i+j),{roughness:.3}),ox,h+.25,oz,b);bl.scale.y=1.18;const ph=i*2+j;anims.push(t=>{bl.position.y=h+.25+Math.sin(t*1.4+ph)*.08;});}});},
 hearts(e,g,A){A.forEach((a,i)=>{const [x,z]=polar(a);mesh(CY(.05,.05,1.2,8),'#ffffff',x,PY+.6,z,g);const h=mesh(ext(heartShape(),.2),M(pc(e,i),{roughness:.35}),x,PY+1.6,z,g);h.scale.setScalar(1.1);h.rotation.y=a;const ph=i;anims.push(t=>{const s=1.1+Math.sin(t*3+ph)*.06;h.scale.setScalar(s);});});},
 potofgold(e,g,A){A.forEach((a,i)=>{const [x,z]=polar(a);const p=new T.Group();p.position.set(x,PY,z);g.add(p);const pot=mesh(SP(.55,18,12),'#1d1d1d',0,.5,0,p);pot.scale.y=.85;mesh(new T.TorusGeometry(.45,.07,8,24),'#2b2b2b',0,.9,0,p).rotation.x=Math.PI/2;
   const gold=M('#ffcf33',{metalness:.7,roughness:.3});mesh(CY(.44,.44,.1,20),gold,0,.9,0,p);for(let k=0;k<7;k++){mesh(CY(.1,.1,.04,12),gold,Math.cos(k*.9)*.25,.98+(k%3)*.04,Math.sin(k*.9)*.25,p);}for(let k=0;k<4;k++){mesh(CY(.1,.1,.04,12),gold,Math.cos(k*1.7)*.8,.03,Math.sin(k*1.7)*.8,p);}});},
 eggs(e,g,A){A.forEach((a,i)=>{const [x,z]=polar(a);const n=mesh(new T.TorusGeometry(.42,.14,8,20),'#9c7a4a',x,PY+.14,z,g);n.rotation.x=Math.PI/2;for(let k=0;k<4;k++){const eg=makeItem('ei',pc(e,i+k));eg.scale.setScalar(1.3);eg.position.set(x+Math.cos(k*1.6)*.22,PY+.05,z+Math.sin(k*1.6)*.22);eg.rotation.z=(k-1.5)*.2;g.add(eg);}});},
 flowers(e,g,A){A.forEach((a,i)=>{const [x,z]=polar(a);mesh(CY(.45,.38,.35,16),'#b5653a',x,PY+.17,z,g);mesh(CY(.42,.42,.04,16),'#5d4037',x,PY+.35,z,g);for(let k=0;k<5;k++){const f=makeItem('blume',pc(e,i+k));f.scale.setScalar(1.5);f.position.set(x+Math.cos(k*1.25)*.22,PY+.35,z+Math.sin(k*1.25)*.22);g.add(f);}});},
 powderbowls(e,g,A){A.forEach((a,i)=>{const [x,z]=polar(a);mesh(CY(.55,.38,.28,20),M('#c99a3e',{metalness:.5,roughness:.35}),x,PY+.14,z,g);const pile=mesh(new T.ConeGeometry(.5,.45,20),M(pc(e,i),{roughness:1}),x,PY+.5,z,g);pile.scale.y=.9;});},
 flags(e,g,A){A.forEach((a,i)=>{const [x,z]=polar(a);mesh(CY(.05,.06,3.4,8),'#cfd8dc',x,PY+1.7,z,g);mesh(SP(.09),'#ffd54f',x,PY+3.45,z,g);const t=canvasTex(96,64,(c,w,h)=>{for(let k=0;k<3;k++){c.fillStyle=pc(e,k);c.fillRect(0,k*h/3,w,h/3+1);}});const pv=new T.Group();pv.position.set(x,PY+2.9,z);pv.rotation.y=a+Math.PI/2;g.add(pv);const f=mesh(new T.PlaneGeometry(1.4,.85,8,1),new T.MeshStandardMaterial({map:t,side:T.DoubleSide}),.72,0,0,pv);const ph=i;const pos=f.geometry.attributes.position;const base=pos.array.slice();anims.push(tt=>{for(let v=0;v<pos.count;v++){const px=base[v*3];pos.array[v*3+2]=Math.sin(tt*4+px*3+ph)*.08*(px+.7);}pos.needsUpdate=true;});});},
 barrels(e,g,A){A.forEach((a,i)=>{const [x,z]=polar(a);const b=new T.Group();b.position.set(x,PY,z);b.rotation.y=a+Math.PI/2;g.add(b);const bar=mesh(CY(.42,.42,.9,18),'#8d5a2b',0,.42,0,b);bar.rotation.z=Math.PI/2;for(const ox of [-.3,.3]){const r=mesh(new T.TorusGeometry(.43,.03,6,20),'#555',ox,.42,0,b);r.rotation.y=Math.PI/2;}mesh(CY(.05,.05,.12,8),'#c9a227',.46,.42,0,b).rotation.z=Math.PI/2;});},
 pumpkins(e,g,A){A.forEach((a,i)=>{const [x,z]=polar(a);const p=new T.Group();p.position.set(x,PY,z);p.rotation.y=a;g.add(p);const r=.5+(i%2)*.12;const b=mesh(SP(r,18,14),'#f07c13',0,r*.8,0,p);b.scale.y=.8;for(let k=0;k<6;k++){const s=mesh(SP(r*.98,10,10),'#e86f0c',0,r*.8,0,p);s.scale.set(.35,.79,.98);s.rotation.y=k*Math.PI/6;}mesh(CY(.05,.07,.22,8),'#4e6b2a',0,r*1.5,0,p);
   const eye=glow('#ffd54f',1.3);for(const sx of [-1,1]){const ey=mesh(new T.ConeGeometry(.1,.14,3),eye,sx*.17,r*.95,r*.78,p);}const mo=mesh(BX(.36,.07,.05),eye,0,r*.6,r*.8,p);});},
 graves(e,g,A){A.forEach((a,i)=>{const [x,z]=polar(a);const s=new T.Group();s.position.set(x,PY,z);s.rotation.y=a;s.rotation.z=(i%2?.06:-.05);g.add(s);mesh(BX(.8,.8,.22),'#7d7a86',0,.4,0,s);const top=mesh(new T.CylinderGeometry(.4,.4,.22,18,1,false,-Math.PI/2,Math.PI),'#7d7a86',0,.8,0,s);top.rotation.x=-Math.PI/2;mesh(BX(.08,.36,.03),'#5d5a66',0,.62,.12,s);mesh(BX(.24,.07,.03),'#5d5a66',0,.68,.12,s);mesh(BX(1,.08,.5),'#3a3340',0,.04,.15,s);});},
 haybales(e,g,A){A.forEach((a,i)=>{const [x,z]=polar(a);const s=new T.Group();s.position.set(x,PY,z);s.rotation.y=a+Math.PI/2;g.add(s);const hay=M('#d8b04a',{roughness:1});mesh(BX(1.1,.6,.65),hay,-.3,.3,0,s);mesh(BX(1.1,.6,.65),hay,.45,.3,.1,s);mesh(BX(1.1,.6,.65),hay,.05,.9,.05,s);for(const ox of [-.6,-.05,.15,.75])mesh(BX(.04,.62,.67),'#9c7a2a',ox,.3,0,s);const pk=makeItem('kuerbis',pc(e,i));pk.scale.setScalar(1.6);pk.position.set(.1,1.2,.05);s.add(pk);});},
 boots(e,g,A){A.forEach((a,i)=>{const [x,z]=polar(a);const s=new T.Group();s.position.set(x,PY,z);s.rotation.y=a;g.add(s);const bt=makeItem('stiefel','#b71c1c');bt.scale.setScalar(2.6);s.add(bt);for(let k=0;k<3;k++){const it=makeItem(['bonbon','stern','kugel'][k],['#e53935','#ffd166','#ff8a1f'][k]);it.scale.setScalar(.9);it.position.set(-.15+k*.15,1.1,0);s.add(it);}});},
 gifts(e,g,A){A.forEach((a,i)=>{const [x,z]=polar(a);const s=new T.Group();s.position.set(x,PY,z);s.rotation.y=a;g.add(s);[[0,0,1.8],[.55,.1,1.3],[-.45,.25,1.1]].forEach(([ox,oz,sc],k)=>{const gf=makeItem('geschenk',pc(e,i+k));gf.scale.setScalar(sc);gf.position.set(ox,0,oz);gf.rotation.y=k*.5;s.add(gf);});});},
 xmastree(e,g,[x,z]){const t=new T.Group();t.position.set(x,PY,z);t.scale.setScalar(.82);g.add(t);mesh(CY(.25,.3,.7,10),'#5d4037',0,.35,0,t);const gr=M('#1f6b37',{roughness:.85});[[1.5,1.6,1.3],[1.15,1.4,2.3],[.8,1.2,3.2]].forEach(([r,h,y])=>mesh(new T.ConeGeometry(r,h,14),gr,0,y,0,t));
   for(let k=0;k<16;k++){const lev=k%3,ang=k*2.4;const r=[1.15,.85,.55][lev]*.95,y=[1.0,2.0,2.95][lev];mesh(SP(.11,10,8),glow(pc(e,k),.5),Math.cos(ang)*r,y,Math.sin(ang)*r,t);}
   const st=mesh(ext(starShape()),glow('#ffd54f',1.2),0,4.05,0,t);st.scale.setScalar(.9);anims.push(tt=>{st.rotation.y=tt*.8;});},
 palm(e,g,[x,z]){const p=new T.Group();p.position.set(x,PY,z);g.add(p);for(let k=0;k<6;k++){mesh(CY(.17-k*.015,.2-k*.015,.62,10),k%2?'#8d6e4a':'#a1825a',k*.07,.3+k*.6,0,p).rotation.z=-.07;}
   const top=new T.Group();top.position.set(.42,3.75,0);p.add(top);for(let k=0;k<7;k++){const lf=new T.Group();lf.rotation.y=k*2*Math.PI/7;top.add(lf);const l=mesh(BX(1.9,.06,.42),'#2e9b4b',.95,-.25,0,lf);l.rotation.z=-.35;}
   for(let k=0;k<3;k++)mesh(SP(.15,10,8),'#6d4c2a',Math.cos(k*2.1)*.22,-.2,Math.sin(k*2.1)*.22,top);anims.push(t=>{top.rotation.z=Math.sin(t*.9)*.04;});},
 snowman(e,g,[x,z]){const s=new T.Group();s.position.set(x,PY,z);s.rotation.y=.5;g.add(s);const w=M('#ffffff',{roughness:.9});mesh(SP(.8),w,0,.7,0,s);mesh(SP(.58),w,0,1.8,0,s);mesh(SP(.42),w,0,2.6,0,s);
   const n=mesh(new T.ConeGeometry(.07,.45,10),'#ff7a1a',0,2.6,.6,s);n.rotation.x=Math.PI/2;for(const sx of [-1,1])mesh(SP(.05,8,6),'#111',sx*.14,2.72,.37,s);for(let k=0;k<3;k++)mesh(SP(.06,8,6),'#111',0,1.65+k*.22,.56,s);
   const sc=mesh(new T.TorusGeometry(.42,.1,8,20),pc(e,0),0,2.25,0,s);sc.rotation.x=Math.PI/2;mesh(CY(.45,.45,.04,18),'#111',0,2.95,0,s);mesh(CY(.28,.28,.45,18),'#111',0,3.17,0,s);mesh(CY(.29,.29,.1,18),pc(e,0),0,3.02,0,s);},
 parasol(e,g,[x,z]){const s=new T.Group();s.position.set(x,PY,z);g.add(s);mesh(CY(.05,.05,2.9,8),'#eeeeee',0,1.45,0,s);const t=stripeTex([pc(e,0),'#ffffff'],'v',12);mesh(new T.ConeGeometry(1.75,.65,12,1,true),new T.MeshStandardMaterial({map:t,side:T.DoubleSide}),0,2.95,0,s);
   const tw=canvasTex(64,64,(c,w,h)=>{for(let k=0;k<6;k++){c.fillStyle=k%2?'#ffffff':pc(e,2);c.fillRect(0,k*h/6,w,h/6+1);}});const to=mesh(BX(1,.03,1.9),new T.MeshStandardMaterial({map:tw}),.9,.02,.2,s);to.rotation.y=.3;
   const ball=mesh(SP(.32,16,12),new T.MeshStandardMaterial({map:stripeTex([pc(e,0),'#ffffff',pc(e,1),'#ffffff',pc(e,2),'#ffffff'],'v',6),roughness:.35}),-.9,.32,.6,s);anims.push(tt=>{ball.rotation.y=tt*.6;});},
 lanterns(e,g){const E=EAVE;const n=5;for(let k=0;k<n;k++){const x=-E.w/2+.5+k*(E.w-1)/(n-1);mesh(CY(.01,.01,.5,4),'#222',x,E.y-.25,E.z+.1,g);const l=makeItem('laterne',pc(e,0));l.scale.setScalar(1.5);l.position.set(x,E.y-1.25,E.z+.1);g.add(l);const ph=k;anims.push(t=>{l.rotation.z=Math.sin(t*1.5+ph)*.06;});}
   [[-1,1],[1,1],[-1,-1],[1,-1]].forEach(([sx,sz])=>{const p=new T.Group();p.position.set(sx*6.2,PY,sz*4.5);g.add(p);mesh(CY(.06,.06,3.4,8),'#5d1f1f',0,1.7,0,p);mesh(BX(.9,.06,.06),'#5d1f1f',.4*-sx,3.35,0,p);const l=makeItem('laterne',pc(e,0));l.scale.setScalar(2.4);l.position.set(.75*-sx,2.05,0);p.add(l);});},
 bunting(e,g){const poles=[];const n=10;for(let k=0;k<n;k++){const a=.38+k*(Math.PI*2-.76)/(n-1);poles.push(a);}const R=8.75,Hh=3.1;
   poles.forEach(a=>{const [x,z]=polar(a,R);mesh(CY(.05,.06,Hh,8),'#e0e0e0',x,PY+Hh/2,z,g);mesh(SP(.08),pc(e,0),x,PY+Hh+.04,z,g);});
   for(let k=0;k<n-1;k++){const [x1,z1]=polar(poles[k],R),[x2,z2]=polar(poles[k+1],R);const cnt=7;for(let j=0;j<cnt;j++){const t=(j+.5)/cnt;const x=x1+(x2-x1)*t,z=z1+(z2-z1)*t;const sag=Math.sin(t*Math.PI)*.55;const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute([-.2,0,0,.2,0,0,0,-.42,0],3));geo.computeVertexNormals();const f=mesh(geo,M(pc(e,j+k),{side:T.DoubleSide}),x,PY+Hh-.05-sag,z,g);f.rotation.y=Math.atan2(x2-x1,z2-z1)+Math.PI/2;f.castShadow=false;}}},
 lights(e,g){const bulbs=[];const n=44;for(let k=0;k<n;k++){const a=k/n*Math.PI*2;const [x,z]=polar(a,9.08);const b=mesh(SP(.09,8,6),glow(pc(e,k),1),x,PY+.1,z,g);b.castShadow=false;bulbs.push(b);}
   const E=EAVE;for(let k=0;k<14;k++){const t=k/13;const x=-E.w/2+.1+t*(E.w-.2);const sag=Math.sin(t*Math.PI)*.18;const b=mesh(SP(.08,8,6),glow(pc(e,k),1),x,E.y-.08-sag,E.z+.08,g);b.castShadow=false;bulbs.push(b);}
   anims.push(t=>{bulbs.forEach((b,i)=>{b.material.emissiveIntensity=.55+.5*Math.max(0,Math.sin(t*2.5+i*1.3));});});},
 rainbow(e,g){const cols=['#e53935','#fb8c00','#fdd835','#43a047','#1e88e5','#8e24aa'];cols.forEach((c,i)=>{const r=mesh(new T.TorusGeometry(6.4-i*.36,.19,8,48,Math.PI),M(c,{roughness:.6}),0,PY-.1,-7.4,g);r.castShadow=false;});
   for(const sx of [-1,1])for(let k=0;k<4;k++)mesh(SP(.55-k*.06,14,10),'#ffffff',sx*(5.5+k*.35),PY+.2+(k%2)*.25,-7.4+(k-1.5)*.35,g);},
 wreath(e,g){const {D}=SHOP;const w=new T.Group();w.position.set(0,PY+.2+1.42,-D/2+.45);w.scale.setScalar(.85);g.add(w);const tr=mesh(new T.TorusGeometry(.42,.14,10,24),'#2e6b34',0,.08,0,w);tr.rotation.x=Math.PI/2;
   for(let k=0;k<8;k++){const a=k*Math.PI/4+.4;mesh(SP(.05,8,6),'#d32f2f',Math.cos(a)*.42,.2,Math.sin(a)*.42,w);}
   const lit=Math.max(1,Math.min(4,adventLit()));for(let k=0;k<4;k++){const a=k*Math.PI/2+Math.PI/4;const x=Math.cos(a)*.42,z=Math.sin(a)*.42;mesh(CY(.06,.06,.36,10),pc(e,1)==='#ffffff'?'#b71c1c':pc(e,1),x,.36,z,w);if(k<lit){const f=mesh(new T.ConeGeometry(.045,.12,8),glow('#ffb300',1.4),x,.6,z,w);f.castShadow=false;anims.push(t=>{f.scale.y=1+Math.sin(t*12+k)*.15;});}}},
};
function adventLit(){const r=WHEN.advent(TODAY.getFullYear());const a1=r[0];if(TODAY<a1)return 4;const wk=Math.floor((TODAY-a1)/864e5/7)+1;return Math.min(4,wk);}

function buildDecor(e,g){
  const dec=(e.decor||[]);
  const ring=dec.filter(d=>RING_DECOR.includes(d));
  const per={rockets:5,balloons:3,hearts:4,potofgold:1,eggs:3,flowers:3,powderbowls:5,flags:3,barrels:3,pumpkins:5,graves:4,haybales:2,boots:3,gifts:3};
  ring.forEach((d,i)=>builders[d](e,g,sectorAngles(i,ring.length,per[d]||3)));
  const inner=[[-4.3,.6],[4.3,.6],[-4.0,-2.2],[4.0,-2.2]];
  dec.filter(d=>INNER_DECOR.includes(d)).forEach((d,i)=>builders[d](e,g,inner[i%4]));
  dec.filter(d=>!RING_DECOR.includes(d)&&!INNER_DECOR.includes(d)).forEach(d=>builders[d]&&builders[d](e,g));
}

/* ---------- Charakter ---------- */
function seeded(n){let s=n;return()=>{s=(s*16807)%2147483647;return(s-1)/2147483646;};}
function shirtTex(a,pal){return canvasTex(128,128,(x,w,h)=>{const c=[a.shirt,a.shirt2,a.shirt3];
  switch(a.pattern){
   case 'stripes':for(let i=0;i<3;i++){x.fillStyle=c[i];x.fillRect(0,i*h/3,w,h/3+1);}break;
   case 'check':for(let i=0;i<8;i++)for(let j=0;j<8;j++){x.fillStyle=(i+j)%2?c[0]:c[1];x.fillRect(i*16,j*16,16,16);}break;
   case 'harlequin':{x.fillStyle=c[0];x.fillRect(0,0,w,h);const s=32;for(let i=-1;i<5;i++)for(let j=-1;j<5;j++){x.fillStyle=c[(i+j*2+3)%3];x.beginPath();const cx=i*s+(j%2?s/2:0),cy=j*s;x.moveTo(cx,cy-s/2);x.lineTo(cx+s/2,cy);x.lineTo(cx,cy+s/2);x.lineTo(cx-s/2,cy);x.fill();}break;}
   case 'splash':{x.fillStyle=c[0];x.fillRect(0,0,w,h);const r=seeded(7);const cols=pal&&pal.length?pal:[c[1],c[2]];for(let i=0;i<16;i++){x.fillStyle=cols[i%cols.length];x.globalAlpha=.85;x.beginPath();x.arc(r()*w,r()*h,6+r()*16,0,7);x.fill();}x.globalAlpha=1;break;}
   default:x.fillStyle=c[0];x.fillRect(0,0,w,h);
  }});}
const FACES={klassisch:'Klassisch',freundlich:'Freundlich',froh:'Fröhlich',zwinkern:'Zwinkern',cool:'Cool',staunen:'Staunen'};
const HAIRS={none:'Keine Haare',kurz:'Kurz',seitenscheitel:'Seitenscheitel',locken:'Locken',lang:'Lang',zopf:'Pferdeschwanz',dutt:'Dutt',bart:'Kurz mit Bart'};
function faceTex(skin,face,eye,hairC){return canvasTex(128,128,(x,w,h)=>{x.fillStyle=skin;x.fillRect(0,0,w,h);const ink='#1d1d24';x.fillStyle=ink;x.strokeStyle=ink;x.lineCap='round';
  const rr=(X,Y,W,H,R)=>{x.beginPath();x.moveTo(X+R,Y);x.arcTo(X+W,Y,X+W,Y+H,R);x.arcTo(X+W,Y+H,X,Y+H,R);x.arcTo(X,Y+H,X,Y,R);x.arcTo(X,Y,X+W,Y,R);x.fill();};
  if(!face||face==='klassisch'){rr(36,42,14,24,7);rr(78,42,14,24,7);x.fillStyle='#fff';x.fillRect(40,46,5,6);x.fillRect(82,46,5,6);x.lineWidth=6;x.beginPath();x.arc(64,74,22,.2*Math.PI,.8*Math.PI);x.stroke();
    x.fillStyle='rgba(255,120,120,.25)';x.beginPath();x.arc(30,80,9,0,7);x.arc(98,80,9,0,7);x.fill();return;}
  const eyeAt=(cx,cy,closed)=>{if(closed){x.lineWidth=4;x.beginPath();x.arc(cx,cy+3,8,1.15*Math.PI,1.85*Math.PI);x.stroke();return;}
    x.fillStyle='#ffffff';x.beginPath();x.ellipse(cx,cy,9,11,0,0,7);x.fill();x.fillStyle=eye||'#5b3a1e';x.beginPath();x.arc(cx+1,cy+2,6.5,0,7);x.fill();x.fillStyle=ink;x.beginPath();x.arc(cx+1,cy+2,3.4,0,7);x.fill();x.fillStyle='#fff';x.beginPath();x.arc(cx+3,cy-1,1.8,0,7);x.fill();};
  const brows=(lift)=>{x.strokeStyle=hairC||'#3b2a1e';x.lineWidth=4.5;x.beginPath();x.moveTo(33,36-lift);x.quadraticCurveTo(42,30-lift,52,34-lift);x.moveTo(76,34-lift);x.quadraticCurveTo(86,30-lift,95,36-lift);x.stroke();x.strokeStyle=ink;};
  if(face==='cool'){brows(0);x.fillStyle='#14141a';rr(26,42,34,20,7);rr(68,42,34,20,7);x.fillRect(58,48,12,5);x.fillStyle='rgba(255,255,255,.35)';x.fillRect(32,46,10,4);x.fillRect(74,46,10,4);}
  else{brows(face==='staunen'?6:0);eyeAt(42,50,false);eyeAt(86,50,face==='zwinkern');}
  x.strokeStyle='rgba(0,0,0,.25)';x.lineWidth=3;x.beginPath();x.moveTo(64,58);x.quadraticCurveTo(60,70,66,72);x.stroke();
  x.fillStyle='rgba(255,110,110,.28)';x.beginPath();x.arc(28,76,9,0,7);x.arc(100,76,9,0,7);x.fill();
  x.strokeStyle=ink;x.lineWidth=4.5;
  if(face==='froh'){x.fillStyle='#7a1f2b';x.beginPath();x.moveTo(46,82);x.quadraticCurveTo(64,108,82,82);x.closePath();x.fill();x.fillStyle='#fff';x.fillRect(52,82,24,5);}
  else if(face==='staunen'){x.fillStyle='#7a1f2b';x.beginPath();x.ellipse(64,90,7,9,0,0,7);x.fill();}
  else if(face==='cool'){x.beginPath();x.moveTo(50,88);x.quadraticCurveTo(66,96,80,84);x.stroke();}
  else{x.beginPath();x.arc(64,78,16,.18*Math.PI,.82*Math.PI);x.stroke();}});}
function buildHair(a,headG){const st=a.hair||'none';if(st==='none')return;const c=M(a.hairColor||'#3b2a1e',{roughness:.9});const hat=a.hat&&a.hat!=='none';
  const top=!hat||['heartband','bunny','jester','sun','none'].includes(a.hat);
  if(top)mesh(BX(1.32,.26,1.32),c,0,.66,-.0,headG);
  mesh(BX(1.32,.9,.22),c,0,.2,-.62,headG);for(const sx of[-1,1])mesh(BX(.12,.5,.95),c,sx*.66,.38,-.12,headG);
  if(st==='kurz'||st==='bart'){if(top)mesh(BX(1.3,.18,.22),c,0,.5,.6,headG);}
  if(st==='seitenscheitel'){if(top){const f=mesh(BX(.9,.24,.3),c,-.2,.52,.56,headG);f.rotation.z=.12;}}
  if(st==='locken'){const r=seeded(4);for(let i=0;i<16;i++){const a2=i/16*Math.PI*2;const y=.45+r()*.35;if(!top&&y>.5)continue;mesh(SP(.24,10,8),c,Math.cos(a2)*.62,y,Math.sin(a2)*.62-.05,headG);}if(top)for(let i=0;i<5;i++)mesh(SP(.26,10,8),c,-.5+i*.25,.74,(i%2)*.2-.1,headG);}
  if(st==='lang'){mesh(BX(1.36,1.5,.26),c,0,-.2,-.6,headG);for(const sx of[-1,1])mesh(BX(.2,1.25,.6),c,sx*.68,-.1,-.25,headG);if(top)mesh(BX(1.3,.2,.2),c,0,.5,.6,headG);}
  if(st==='zopf'){mesh(SP(.18,10,8),a.hatColor2||'#e53935',0,.35,-.78,headG);const z=mesh(new T.CylinderGeometry(.16,.06,1.0,10),c,0,-.2,-.86,headG);z.rotation.x=.25;if(top)mesh(BX(1.3,.2,.2),c,0,.5,.6,headG);}
  if(st==='dutt'){mesh(SP(.32,12,10),c,0,hat?.25:.86,-.45,headG);}
  if(st==='bart'){mesh(BX(1.0,.32,.12),c,0,-.5,.62,headG);mesh(BX(.5,.1,.08),c,0,-.22,.64,headG);for(const sx of[-1,1])mesh(BX(.12,.5,.2),c,sx*.62,-.3,.5,headG);}}

let rig=null;
function buildHat(type,c1,c2,g){
 switch(type){
  case 'party':mesh(new T.ConeGeometry(.55,1.4,18),M(c1),0,.7,0,g);mesh(SP(.18),c2,0,1.45,0,g);{const b=mesh(new T.TorusGeometry(.5,.06,6,20),c2,0,.12,0,g);b.rotation.x=Math.PI/2;}break;
  case 'top':mesh(CY(.95,.95,.08,24),c1,0,.04,0,g);mesh(CY(.6,.6,1.1,24),c1,0,.6,0,g);mesh(CY(.62,.62,.22,24),c2,0,.22,0,g);break;
  case 'cap':mesh(new T.SphereGeometry(.68,20,10,0,Math.PI*2,0,Math.PI/2),c1,0,-.12,0,g);mesh(BX(1,.06,.62),c1,0,-.08,.75,g);mesh(SP(.1),c2,0,.56,0,g);mesh(CY(.7,.7,.12,22),c2,0,-.08,0,g);break;
  case 'heartband':{const b=mesh(new T.TorusGeometry(.66,.06,8,24,Math.PI),c1,0,-.32,0,g);for(const sx of [-1,1]){mesh(CY(.02,.02,.4,6),c1,sx*.32,.38,0,g);const h=mesh(ext(heartShape()),M(c2,{roughness:.3}),sx*.32,.68,0,g);h.scale.setScalar(.5);}break;}
  case 'jester':mesh(CY(.66,.66,.3,22),c2,0,0,0,g);[-1,1].forEach((sx,k)=>{const p=new T.Group();p.position.set(sx*.3,.1,0);p.rotation.z=sx*-.95;g.add(p);mesh(new T.ConeGeometry(.3,1.2,14),k?c2:c1,0,.6,0,p);mesh(SP(.13),M('#ffd54f',{metalness:.5,roughness:.3}),0,1.22,0,p);});break;
  case 'bunny':mesh(CY(.66,.66,.1,22),c2,0,-.05,0,g);for(const sx of [-1,1]){const e=new T.Group();e.position.set(sx*.3,0,0);e.rotation.z=sx*-.15;g.add(e);mesh(BX(.26,1.2,.14),c1,0,.6,0,e);mesh(BX(.14,.9,.02),c2,0,.6,.08,e);}break;
  case 'sun':mesh(CY(1.2,1.2,.06,26),c1,0,.03,0,g);mesh(CY(.55,.62,.45,22),c1,0,.25,0,g);mesh(CY(.63,.63,.12,22),c2,0,.1,0,g);break;
  case 'tyrol':mesh(CY(.85,.85,.06,24),c1,0,.03,0,g);mesh(CY(.42,.6,.62,22),c1,0,.34,0,g);mesh(CY(.61,.61,.12,22),'#2d2d2d',0,.12,0,g);{const f=mesh(BX(.05,.75,.16),c2,.5,.55,-.1,g);f.rotation.z=-.4;}break;
  case 'witch':mesh(CY(1.25,1.25,.06,26),c1,0,.03,0,g);{const p=new T.Group();g.add(p);p.rotation.z=.14;mesh(new T.ConeGeometry(.62,1.7,20),c1,0,.88,0,p);mesh(CY(.6,.62,.18,20),c2,0,.14,0,p);}break;
  case 'pilgrim':mesh(CY(1.05,1.05,.06,24),c1,0,.03,0,g);mesh(CY(.5,.6,.95,22),c1,0,.5,0,g);mesh(CY(.6,.62,.2,22),'#3a3a3a',0,.18,0,g);mesh(BX(.34,.26,.05),M(c2,{metalness:.6,roughness:.3}),0,.2,.6,g);mesh(BX(.18,.12,.06),c1,0,.2,.61,g);break;
  case 'mitre':{const m=mesh(new T.CylinderGeometry(.15,.62,1.55,4),c1,0,.75,0,g);m.rotation.y=Math.PI/4;m.scale.z=.55;mesh(BX(.1,.8,.05),c2,0,.75,.26,g);mesh(BX(.42,.1,.05),c2,0,.92,.26,g);mesh(CY(.64,.64,.14,4),c2,0,.06,0,g).rotation.y=Math.PI/4;break;}
  case 'santa':{const b=mesh(new T.TorusGeometry(.6,.16,10,24),c2,0,.02,0,g);b.rotation.x=Math.PI/2;const p=new T.Group();p.position.y=.05;p.rotation.z=-.55;g.add(p);mesh(new T.ConeGeometry(.6,1.35,20),c1,0,.67,0,p);mesh(SP(.18),c2,0,1.36,0,p);break;}
 }
}
function buildRig(a,pal,parent){
  const root=new T.Group();root.scale.setScalar(.44);parent.add(root);
  const shirt=new T.MeshStandardMaterial({map:shirtTex(a,pal),roughness:.75});
  const pants=M(a.pants),skin=M(a.skin);
  const torso=mesh(BX(2,2,1),shirt,0,3,0,root);
  const legs=[],arms=[];
  for(const sx of [-1,1]){const lp=new T.Group();lp.position.set(sx*.5,2,0);root.add(lp);mesh(BX(.98,2,.98),pants,0,-1,0,lp);legs.push(lp);
    const ap=new T.Group();ap.position.set(sx*1.5,3.85,0);root.add(ap);mesh(BX(.98,1.3,.98),shirt,0,-.55,0,ap);mesh(BX(.96,.72,.96),skin,0,-1.55,0,ap);arms.push(ap);}
  const headG=new T.Group();headG.position.y=4.62;root.add(headG);
  const ft=faceTex(a.skin,a.face,a.eyeColor,a.hairColor);const hm=[skin,skin,skin,skin,new T.MeshStandardMaterial({map:ft,roughness:.7}),skin];
  const head=new T.Mesh(new T.BoxGeometry(1.22,1.22,1.22),hm);head.castShadow=true;headG.add(head);
  mesh(BX(.6,.24,.6),skin,0,-.7,0,headG);
  if(a.hat==='sun'){mesh(BX(1.05,.26,.06),M('#111',{roughness:.2,metalness:.4}),0,.14,.63,headG);}
  if(a.hat==='santa'){const bd=mesh(BX(1.26,.55,.3),'#ffffff',0,-.42,.55,headG);}
  buildHair(a,headG);
  const hg=new T.Group();hg.position.y=.6;headG.add(hg);buildHat(a.hat,a.hatColor,a.hatColor2,hg);
  // Mitre/Nikolaus bekommt einen Bart
  if(a.hat==='mitre'){mesh(BX(1.26,.6,.3),'#f5f5f5',0,-.4,.55,headG);}
  return {root,legs,arms,headG,torso};
}
let vrig=null;const vendorG=new T.Group();scene.add(vendorG);
function buildAvatar(e){clearGroup(walker);const q=store.equip&&store.equip.hat;const a=q?Object.assign({},e.avatar,{hat:q.hat,hatColor:q.color,hatColor2:q.color2}):e.avatar;rig=buildRig(a,e.palette,walker);}
function buildVendor(e){clearGroup(vendorG);vrig=null;if(e.vendorOn===false||!e.vendor)return;vendorG.position.set(0,PY+.42,.22);mesh(BX(1.4,.22,1.0),e.trim,0,-.11,0,vendorG);vrig=buildRig(e.vendor,e.palette,vendorG);}

/* ---------- Partikel ---------- */
let pts=null,pData=null,pType='none';
const PCFG={snow:{vy:-1.1,sway:.6,size:.32,tex:'dot'},confetti:{vy:-1.6,sway:1.2,size:.28,tex:'square'},hearts:{vy:-.9,sway:.8,size:.5,tex:'heart'},clover:{vy:-1,sway:.9,size:.45,tex:'clover'},
 petals:{vy:-.8,sway:1,size:.32,tex:'petal'},powder:{vy:.55,sway:1.4,size:1.4,tex:'soft',opacity:.6},bubbles:{vy:.8,sway:.7,size:.5,tex:'ring'},leaves:{vy:-1.1,sway:1.6,size:.5,tex:'leaf'},
 bats:{vy:.15,sway:2.5,size:.7,tex:'bat',drift:2.2},sparkle:{vy:-.35,sway:.4,size:.35,tex:'star'}};
function spriteTex(kind){return canvasTex(64,64,(x,w,h)=>{x.fillStyle='#fff';x.strokeStyle='#fff';x.translate(32,32);
 switch(kind){
  case 'dot':{const g=x.createRadialGradient(0,0,0,0,0,30);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.5,'rgba(255,255,255,.9)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(-32,-32,64,64);break;}
  case 'soft':{const g=x.createRadialGradient(0,0,0,0,0,31);g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(-32,-32,64,64);break;}
  case 'square':x.rotate(.5);x.fillRect(-18,-10,36,20);break;
  case 'heart':x.beginPath();x.moveTo(0,22);x.bezierCurveTo(-30,0,-22,-26,0,-10);x.bezierCurveTo(22,-26,30,0,0,22);x.fill();break;
  case 'clover':for(let i=0;i<3;i++){const a=-Math.PI/2+i*2*Math.PI/3;x.beginPath();x.arc(Math.cos(a)*11,Math.sin(a)*11,11,0,7);x.fill();}x.fillRect(-2,6,4,22);break;
  case 'petal':x.rotate(.6);x.beginPath();x.ellipse(0,0,10,20,0,0,7);x.fill();break;
  case 'ring':x.lineWidth=4;x.beginPath();x.arc(0,0,24,0,7);x.stroke();x.globalAlpha=.25;x.fill();x.globalAlpha=.9;x.beginPath();x.arc(-9,-9,5,0,7);x.fill();break;
  case 'leaf':x.rotate(.7);x.beginPath();x.moveTo(0,-26);x.quadraticCurveTo(22,-6,0,26);x.quadraticCurveTo(-22,-6,0,-26);x.fill();break;
  case 'bat':x.beginPath();x.moveTo(0,-4);x.quadraticCurveTo(-10,-14,-28,-8);x.quadraticCurveTo(-22,0,-24,8);x.quadraticCurveTo(-14,2,-8,10);x.lineTo(0,4);x.lineTo(8,10);x.quadraticCurveTo(14,2,24,8);x.quadraticCurveTo(22,0,28,-8);x.quadraticCurveTo(10,-14,0,-4);x.fill();break;
  case 'coin':x.beginPath();x.arc(0,0,26,0,7);x.fill();x.globalAlpha=.45;x.fillStyle='#000';x.beginPath();x.arc(0,0,17,0,7);x.fill();x.globalAlpha=1;x.fillStyle='#fff';x.beginPath();x.arc(-8,-9,6,0,7);x.fill();break;
  case 'star':x.beginPath();for(let i=0;i<8;i++){const r=i%2?6:28,a=i*Math.PI/4;x.lineTo(Math.cos(a)*r,Math.sin(a)*r);}x.fill();break;
 }});}
function buildParticles(e){
  if(pts){scene.remove(pts);disposeTree(pts);pts=null;}
  pType=e.particles;const cfg=PCFG[pType];if(!cfg)return;
  const N=pType==='powder'?260:pType==='bats'?40:420;
  const pos=new Float32Array(N*3),col=new Float32Array(N*3),seed=new Float32Array(N);
  const cols=(e.palette&&e.palette.length?e.palette:['#ffffff']).map(c=>new T.Color(c));
  for(let i=0;i<N;i++){pos[i*3]=(Math.random()-.5)*30;pos[i*3+1]=Math.random()*16;pos[i*3+2]=(Math.random()-.5)*30;seed[i]=Math.random()*100;
    let c=pType==='snow'?new T.Color('#ffffff'):pType==='bats'?new T.Color('#120a18'):pType==='bubbles'?new T.Color('#cfefff'):cols[i%cols.length];col.set([c.r,c.g,c.b],i*3);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));geo.setAttribute('color',new T.BufferAttribute(col,3));
  const mat=new T.PointsMaterial({size:cfg.size,map:spriteTex(cfg.tex),vertexColors:true,transparent:true,opacity:cfg.opacity||.95,depthWrite:false,alphaTest:.02,sizeAttenuation:true});
  pts=new T.Points(geo,mat);pts.frustumCulled=false;scene.add(pts);pData={seed,cfg,N};
}
function stepParticles(t,dt){if(!pts)return;const p=pts.geometry.attributes.position.array,{seed,cfg,N}=pData;
  for(let i=0;i<N;i++){const s=seed[i];let y=p[i*3+1]+cfg.vy*dt*(.7+(s%1)*.6);p[i*3]+=Math.sin(t*1.3+s)*cfg.sway*dt+(cfg.drift||0)*dt*Math.cos(s);p[i*3+2]+=Math.cos(t*1.1+s*1.7)*cfg.sway*dt*.6;
    if(pType==='bats')y=8+Math.sin(t*.8+s)*3;
    if(y<0){y=16;}if(y>16){y=0;}p[i*3+1]=y;if(p[i*3]>15)p[i*3]=-15;if(p[i*3]<-15)p[i*3]=15;}
  pts.geometry.attributes.position.needsUpdate=true;
  if(pType==='sparkle')pts.material.opacity=.7+Math.sin(t*4)*.25;}

/* ---------- Feuerwerk ---------- */
const FW_N=900;const fwPos=new Float32Array(FW_N*3),fwCol=new Float32Array(FW_N*3),fwVel=new Float32Array(FW_N*3),fwLife=new Float32Array(FW_N),fwBase=new Float32Array(FW_N*3);
const fwGeo=new T.BufferGeometry();fwGeo.setAttribute('position',new T.BufferAttribute(fwPos,3));fwGeo.setAttribute('color',new T.BufferAttribute(fwCol,3));
const fw=new T.Points(fwGeo,new T.PointsMaterial({size:.38,map:spriteTex('dot'),vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));fw.frustumCulled=false;scene.add(fw);
let fwOn=false,fwTimer=0,fwIdx=0,fwPal=['#ffffff'];
function burst(){const cx=(Math.random()-.5)*24,cy=7.5+Math.random()*4.5,cz=-8-Math.random()*9;const c=new T.Color(fwPal[Math.floor(Math.random()*fwPal.length)]);const n=90;const sp=3.5+Math.random()*2;
  for(let k=0;k<n;k++){const i=fwIdx;fwIdx=(fwIdx+1)%FW_N;const u=Math.random()*2-1,th=Math.random()*Math.PI*2,r=Math.sqrt(1-u*u);fwPos.set([cx,cy,cz],i*3);fwVel.set([r*Math.cos(th)*sp,u*sp,r*Math.sin(th)*sp],i*3);fwLife[i]=1.6+Math.random()*.5;fwBase.set([c.r,c.g,c.b],i*3);}}
function stepFw(dt){if(fwOn){fwTimer-=dt;if(fwTimer<=0){burst();fwTimer=.6+Math.random()*1.1;}}
  for(let i=0;i<FW_N;i++){if(fwLife[i]<=0){fwCol[i*3]=fwCol[i*3+1]=fwCol[i*3+2]=0;continue;}fwLife[i]-=dt;fwVel[i*3+1]-=2.2*dt;for(let a=0;a<3;a++){fwVel[i*3+a]*=.985;fwPos[i*3+a]+=fwVel[i*3+a]*dt;}const f=Math.max(0,Math.min(1,fwLife[i]/1.2));for(let a=0;a<3;a++)fwCol[i*3+a]=fwBase[i*3+a]*f;}
  fwGeo.attributes.position.needsUpdate=true;fwGeo.attributes.color.needsUpdate=true;}

/* ---------- Szene anwenden ---------- */
function skyTex(top,bot){return canvasTex(4,256,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,top);g.addColorStop(1,bot);x.fillStyle=g;x.fillRect(0,0,w,h);});}
let skyT=null;
function applyEvent(e){
  anims=[];clearGroup(themeG);
  if(skyT)skyT.dispose();skyT=skyTex(e.sky[0],e.sky[1]);scene.background=skyT;
  scene.fog=new T.Fog(new T.Color(e.sky[1]),34,95);
  ground.material.color.set(e.ground);podium.material.color.set(e.podium);podiumTrim.material.color.set(e.trim);podiumBase.material.color.set(e.trim);
  podiumBase.material.color.multiplyScalar(.8);
  steps.children.forEach(s=>s.material.color.set(e.podium));
  hemi.intensity=e.night?.42:.78;hemi.color.set(e.night?'#a9b6ff':'#ffffff');hemi.groundColor.set(e.night?'#221a33':'#6b6b78');
  sun.intensity=e.night?.38:.85;sun.color.set(e.night?'#9fb0ff':'#fff4e0');
  shopLight.intensity=e.night?1.6:0;
  calDoors={};buildShop(e,themeG);buildDecor(e,themeG);buildAvatar(e);buildVendor(e);buildParticles(e);buildAura();renderCalBtn();renderEmoteBtn();
  fwOn=!!e.fireworks;fwPal=e.palette&&e.palette.length?e.palette:['#ffffff'];
}

/* ---------- Kamera & Laufen ---------- */
let az=.35,el=.24,dist=22;const target=new T.Vector3(0,2.5,0);
function placeCam(){const asp=camera.aspect;const d=dist*(asp<1?1+(1-asp)*.9:1);camera.position.set(target.x+d*Math.cos(el)*Math.sin(az),target.y+d*Math.sin(el),target.z+d*Math.cos(el)*Math.cos(az));camera.lookAt(target);}
const ptrs=new Map();let pinch0=0,dist0=dist;
canvas.addEventListener('pointerdown',ev=>{canvas.setPointerCapture(ev.pointerId);ptrs.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});$('#hint').hidden=true;if(ptrs.size===2){const [a,b]=[...ptrs.values()];pinch0=Math.hypot(a.x-b.x,a.y-b.y);dist0=dist;}});
canvas.addEventListener('pointermove',ev=>{const p=ptrs.get(ev.pointerId);if(!p)return;if(ptrs.size===1){az-=(ev.clientX-p.x)*.008;el=Math.min(1.25,Math.max(.06,el+(ev.clientY-p.y)*.006));}p.x=ev.clientX;p.y=ev.clientY;if(ptrs.size===2){const [a,b]=[...ptrs.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);if(pinch0)dist=Math.min(42,Math.max(10,dist0*pinch0/d));}});
const up=ev=>{ptrs.delete(ev.pointerId);pinch0=0;};canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
canvas.addEventListener('wheel',ev=>{ev.preventDefault();dist=Math.min(42,Math.max(10,dist*(1+ev.deltaY*.001)));},{passive:false});

let walking=true,theta=.9,pause=0,wave=0,face=0;const WALK_R=6.1;
const reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function stepWalker(t,dt){if(!rig)return;
  if(emoteT>0){emoteT-=dt;walker.position.set(Math.sin(theta)*WALK_R,PY,Math.cos(theta)*WALK_R);rigPose(rig,emoteKind,t);if(emoteT<=0)rigPose(rig,'none',0);return;}
  const moving=walking&&pause<=0;
  if(moving){const prev=theta;theta+=dt*.32;if(Math.floor(prev/(Math.PI*2))!==Math.floor(theta/(Math.PI*2))){pause=3;wave=3;say('greet');if(store.equip&&store.equip.emote){wave=0;playEmote(store.equip.emote.emote);}}}
  else if(pause>0){pause-=dt;if(pause<=0)say('bye');}
  if(wave>0)wave-=dt;
  const x=Math.sin(theta)*WALK_R,z=Math.cos(theta)*WALK_R;
  const want=moving?Math.atan2(Math.cos(theta),-Math.sin(theta)):Math.atan2(-x,-z);
  let d=want-face;d=Math.atan2(Math.sin(d),Math.cos(d));face+=d*Math.min(1,dt*6);
  const sw=moving?Math.sin(t*7.5)*.75:0;
  walker.position.set(x,PY+(moving?Math.abs(Math.sin(t*7.5))*.06:0),z);walker.rotation.y=face;
  rig.legs[0].rotation.x=sw;rig.legs[1].rotation.x=-sw;rig.arms[0].rotation.x=-sw*.8;
  if(wave>0){rig.arms[1].rotation.x=0;rig.arms[1].rotation.z=2.7+Math.sin(t*12)*.35;}else{rig.arms[1].rotation.z*=.85;rig.arms[1].rotation.x=sw*.8;}
  rig.headG.rotation.y=moving?Math.sin(t*1.3)*.15:0;
  if(!moving&&wave<=0){rig.root.position.y=Math.sin(t*2)*.03;}}
let vWave=0,vWaveT=5;
function stepVendor(t,dt){if(!vrig)return;vWaveT-=dt;if(vWaveT<=0){vWave=2.2;vWaveT=11+Math.random()*7;if(bubble.hidden&&pause<=0)say('idle');}if(vWave>0)vWave-=dt;
  const dx=walker.position.x-vendorG.position.x,dz=walker.position.z-vendorG.position.z;const yaw=Math.max(-1.1,Math.min(1.1,Math.atan2(dx,dz)));
  vrig.headG.rotation.y+=(yaw-vrig.headG.rotation.y)*Math.min(1,dt*4);vrig.root.position.y=Math.sin(t*2.2)*.04;vrig.root.rotation.y=vrig.headG.rotation.y*.25;
  if(wave>0||vWave>0){vrig.arms[1].rotation.z=2.7+Math.sin(t*12+1)*.35;}else{vrig.arms[1].rotation.z*=.85;}
  vrig.arms[0].rotation.x=Math.sin(t*1.5)*.12;}

/* ---------- Loop ---------- */
const clock=new T.Clock();
function resize(){const r=stage.getBoundingClientRect();const w=Math.max(1,r.width),h=Math.max(1,r.height);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(stage);resize();
function loop(){const dt=Math.min(.05,clock.getDelta());const t=clock.elapsedTime;
  stepWalker(t,dt);stepVendor(t,dt);stepAura(t,dt);if(!reduce){anims.forEach(f=>f(t,dt));stepParticles(t,dt);}stepFw(dt);
  placeCam();stepBubble(dt);renderer.render(scene,camera);requestAnimationFrame(loop);}

/* ---------- Eventliste und Anzeige auf der Bühne ---------- */
const ddmm=s=>{const [m,d]=String(s||'').split('-');return d&&m?`${d}.${m}.`:'';};
function ruleText(id){const z=ZEIT[id];const e=BUILTIN.find(x=>x.id===id);if(z&&z.modus==='aus')return'Ausgeschaltet';if(z&&z.modus==='fest'&&z.start&&z.ende)return`Fest: ${ddmm(z.start)} bis ${ddmm(z.ende)}`;return e?e.dateText:'';}
function evDates(e){const r=nextOcc(e.id);return{r,st:status(r)};}
function renderList(){
  const L=$('#eventList');L.innerHTML='';
  BUILTIN.forEach(b=>{const e=getEvent(b.id);const {r,st}=evDates(e);const off=ZEIT[e.id]&&ZEIT[e.id].modus==='aus';
    const bt=document.createElement('button');bt.type='button';bt.className='ev'+(off?' off':'');bt.setAttribute('aria-current',String(!!cur&&e.id===cur.id));
    bt.innerHTML=`<span class="sw" style="background:linear-gradient(${e.sky[0]},${e.sky[1]})"><b style="background:${e.shop.roof}"></b><i style="background:${e.shop.wall}"></i></span><span><span class="nm"></span><span class="dt"></span></span>`;
    bt.querySelector('.nm').textContent=e.name;const dt=bt.querySelector('.dt');
    const s=document.createElement('span');s.textContent=off?'Ausgeschaltet':r?fmtRange(r):e.dateText;dt.appendChild(s);
    if(st&&!off){const c=document.createElement('span');c.className='chip '+st.cls;c.textContent=st.txt;dt.appendChild(c);}
    bt.onclick=()=>select(e.id);L.appendChild(bt);});
}
function renderHud(){
  if(!cur)return;$('#hudName').textContent=cur.name;const {r,st}=evDates(cur);const d=$('#hudDate');d.innerHTML='';const off=ZEIT[cur.id]&&ZEIT[cur.id].modus==='aus';
  const s=document.createElement('span');s.textContent=off?'Ausgeschaltet':r?fmtRange(r):(cur.dateText||'');d.appendChild(s);
  if(st&&!off){const c=document.createElement('span');c.className='chip '+st.cls;c.textContent=st.txt;d.appendChild(c);}
  const sc=document.createElement('span');sc.className='chip';sc.textContent=STYLES[cur.shop.style]||'Kiosk';d.appendChild(sc);
  const cd=document.createElement('span');cd.className='chip';cd.id='hudCd';cd.style.fontVariantNumeric='tabular-nums';d.appendChild(cd);
}
function select(id){const changed=!cur||cur.id!==id;cur=getEvent(id);if(!cur)return;store.current=id;save();applyEvent(cur);renderList();renderHud();
  if(changed){closeShop();bubble.hidden=true;thumbCache.clear();$('#calui').hidden=true;}shopCycle=rotInfo(cur).cycle;if(typeof tickShop==='function')tickShop();renderZeit();}

/* ---------- Aktionen ---------- */
function toast(msg){const t=$('#toast');t.textContent=msg;t.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>t.hidden=true,2200);}
$('#walkBtn').onclick=e=>{walking=!walking;e.currentTarget.setAttribute('aria-pressed',walking);e.currentTarget.textContent=walking?'Läuft':'Steht';};
$('#waveBtn').onclick=()=>{wave=2.5;};
$('#camBtn').onclick=()=>{az=.35;el=.24;dist=22;};
let tourI=null;
$('#tourBtn').onclick=e=>{const b=e.currentTarget;if(tourI){clearInterval(tourI);tourI=null;b.setAttribute('aria-pressed','false');return;}b.setAttribute('aria-pressed','true');
  tourI=setInterval(()=>{const ids=allIds();const i=ids.indexOf(cur.id);select(ids[(i+1)%ids.length]);},6000);};

/* ---------- Sprechblase ---------- */
const bubble=$('#bubble');let bubbleT=0;
function say(kind,txt){if(!vrig||!cur.talk)return;const t=txt??cur.talk[kind];if(!t)return;$('#bName').textContent=cur.talk.name||'Shopbesitzer';$('#bText').textContent=t;bubble.hidden=false;bubbleT=4;}
const _bv=new T.Vector3();
function stepBubble(dt){if(bubble.hidden)return;bubbleT-=dt;if(bubbleT<=0||!vrig){bubble.hidden=true;return;}
  _bv.set(vendorG.position.x,vendorG.position.y+2.75,vendorG.position.z).project(camera);const r=stage.getBoundingClientRect();
  bubble.style.left=Math.max(90,Math.min(r.width-90,(_bv.x*.5+.5)*r.width))+'px';bubble.style.top=Math.max(70,(-_bv.y*.5+.5)*r.height)+'px';}

/* ---------- Klick auf Stand / Besitzer ---------- */
const ray=new T.Raycaster();let downAt=null;
canvas.addEventListener('pointerdown',ev=>{downAt={x:ev.clientX,y:ev.clientY,n:ptrs.size};});
canvas.addEventListener('pointerup',ev=>{if(!downAt||downAt.n>1||Math.hypot(ev.clientX-downAt.x,ev.clientY-downAt.y)>6){downAt=null;return;}downAt=null;
  const r=canvas.getBoundingClientRect();ray.setFromCamera({x:(ev.clientX-r.left)/r.width*2-1,y:-(ev.clientY-r.top)/r.height*2+1},camera);
  const hit=ray.intersectObjects([vendorG,themeG],true)[0];if(!hit)return;
  let o=hit.object,isVendor=false,cd=null;while(o){if(o===vendorG)isVendor=true;if(o.userData&&o.userData.calDoor&&!cd)cd=o.userData.calDoor;o=o.parent;}if(cd){openCalDoor(cd);return;}
  const p=hit.point;if(isVendor||(Math.abs(p.x)<3.6&&Math.abs(p.z)<2.6)){say('click');openShop();}});

/* ---------- Shop-UI ---------- */
let thumbR=null;const thumbCache=new Map();
function thumb(shape,color){const k=shape+color;if(thumbCache.has(k))return thumbCache.get(k);
  try{if(!thumbR){thumbR=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});thumbR.setSize(160,160);thumbR.setPixelRatio(1);}
    const sc=new T.Scene();sc.add(new T.HemisphereLight(0xffffff,0x777788,.9));const dl=new T.DirectionalLight(0xffffff,.8);dl.position.set(2,3,4);sc.add(dl);
    const it=makeItem(shape,color,cur.palette);sc.add(it);const box=new T.Box3().setFromObject(it);const c=box.getCenter(new T.Vector3()),s=box.getSize(new T.Vector3()).length();
    it.rotation.y=-.5;const cam=new T.PerspectiveCamera(35,1,.01,50);cam.position.set(c.x,c.y+s*.35,c.z+s*1.55);cam.lookAt(c);thumbR.render(sc,cam);const url=thumbR.domElement.toDataURL();disposeTree(it);thumbCache.set(k,url);return url;}catch(e){return '';}}
/* ---------- Shop-Rotation ---------- */
function hashStr(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function rotInfo(e){const sec=Math.max(10,parseInt(e.ui.interval,10)||300);const ms=sec*1000;const now=Date.now();const cycle=Math.floor(now/ms);return{sec,ms,cycle,left:ms-(now%ms)};}
function rotation(e){const {cycle}=rotInfo(e);const pool=(e.pool||[]).filter(p=>p&&p.shape);const n=Math.min(pool.length,Math.max(1,parseInt(e.ui.slots,10)||5));
  const rnd=seeded((hashStr(e.id)%2147483000)+cycle*7919+1);const left=pool.map((p,i)=>({p,i,w:(RARITY[p.rarity]||RARITY.gewoehnlich)[2]}));const out=[];
  while(out.length<n&&left.length){const tot=left.reduce((a,b)=>a+b.w,0);let r=rnd()*tot,k=0;while(k<left.length-1&&(r-=left[k].w)>0)k++;out.push(left.splice(k,1)[0].p);}
  out.sort((a,b)=>RK.indexOf(b.rarity)-RK.indexOf(a.rarity));return out;}
const fmtLeft=ms=>{const s=Math.ceil(ms/1000);const h=Math.floor(s/3600),m=Math.floor(s%3600/60),ss=s%60;return h?`${h}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;};
function patternURL(kind,col){if(!kind||kind==='keine')return 'none';const c=document.createElement('canvas');c.width=c.height=48;const x=c.getContext('2d');x.fillStyle=col;x.strokeStyle=col;x.globalAlpha=.22;
  if(kind==='streifen'){x.lineWidth=10;for(let i=-48;i<96;i+=24){x.beginPath();x.moveTo(i,48);x.lineTo(i+48,0);x.stroke();}}
  else if(kind==='punkte'){[[12,12],[36,36]].forEach(([a,b])=>{x.beginPath();x.arc(a,b,5,0,7);x.fill();});}
  else if(kind==='raute'){x.beginPath();x.moveTo(24,2);x.lineTo(46,24);x.lineTo(24,46);x.lineTo(2,24);x.closePath();x.fill();}
  else if(kind==='sterne'||kind==='herzen'){[[14,14,1],[36,34,.7]].forEach(([a,b,s])=>{x.save();x.translate(a,b);x.scale(s,s);x.beginPath();if(kind==='sterne'){for(let i=0;i<10;i++){const r=i%2?4:10,ang=i*Math.PI/5-Math.PI/2;x.lineTo(Math.cos(ang)*r,Math.sin(ang)*r);}}else{x.moveTo(0,8);x.bezierCurveTo(-12,0,-8,-10,0,-4);x.bezierCurveTo(8,-10,12,0,0,8);}x.fill();x.restore();});}
  return `url(${c.toDataURL()})`;}
let portraitCache=new Map();
function portrait(e){const k=JSON.stringify(e.vendor)+e.vendorOn;if(portraitCache.has(k))return portraitCache.get(k);if(e.vendorOn===false){portraitCache.set(k,'');return '';}
  try{thumb('kugel','#ffffff');const sc=new T.Scene();sc.add(new T.HemisphereLight(0xffffff,0x777788,.95));const dl=new T.DirectionalLight(0xffffff,.7);dl.position.set(2,3,5);sc.add(dl);const g=new T.Group();sc.add(g);const rg=buildRig(e.vendor,e.palette,g);
    const cam=new T.PerspectiveCamera(30,1,.01,50);cam.position.set(.3,2.3,2.05);cam.lookAt(0,2.25,0);thumbR.render(sc,cam);const url=thumbR.domElement.toDataURL();disposeTree(g);portraitCache.set(k,url);return url;}catch(err){return '';}}
let shopCycle=null,shopTab='offer',shopFilter='alle',detItem=null,detEid=null,detR=null,detScene=null,detCam=null,detObj=null,detRAF=0,typeT=0,buyArm=false;
const RING_C=2*Math.PI*28;
const itKey=it=>(it.name||'')+'|'+it.shape;
function favs(){store.fav=store.fav||{};return store.fav[cur.id]=store.fav[cur.id]||[];}
function isFav(it){return favs().includes(itKey(it));}
function toggleFav(it){const f=favs();const k=itKey(it);const i=f.indexOf(k);i>=0?f.splice(i,1):f.push(k);save();}
function typeText(el,text){clearInterval(typeT);text=text||'';if(reduce){el.textContent=text;return;}el.textContent='';let i=0;typeT=setInterval(()=>{i+=2;el.textContent=text.slice(0,i);if(i>=text.length)clearInterval(typeT);},20);}

/* ---------- Münzen, Käufe, Inventar ---------- */
if(typeof store.wallet!=='number')store.wallet=300;store.owned=store.owned||{};store.equip=store.equip||{};store.calOpened=store.calOpened||{};
const ownKey=(eid,it)=>eid+'|'+itKey(it);
const owns=(it,eid=cur.id)=>!!store.owned[ownKey(eid,it)];
const fmtCoins=n=>Number(n||0).toLocaleString('de-DE');
function renderWallet(){document.querySelectorAll('.walletVal').forEach(el=>el.textContent=fmtCoins(store.wallet));}
function addCoins(d){store.wallet=Math.max(0,store.wallet+d);save();renderWallet();document.querySelectorAll('.walletPill').forEach(p=>{p.classList.remove('bump');void p.offsetWidth;p.classList.add('bump');});}
function grant(it,eid){const k=ownKey(eid,it);if(store.owned[k])return false;store.owned[k]={event:eid,item:clone(it),at:Date.now()};save();return true;}
function buy(it){if(owns(it))return false;const pr=+it.price||0;if(store.wallet<pr)return false;store.wallet-=pr;grant(it,cur.id);renderWallet();return true;}
const isCosm=it=>it&&(it.type==='hut'||it.type==='aura'||it.type==='emote');
function isEquipped(it){const q=store.equip;return it.type==='hut'?!!(q.hat&&q.hat.name===it.name):it.type==='aura'?!!(q.aura&&q.aura.name===it.name):it.type==='emote'?!!(q.emote&&q.emote.name===it.name):false;}
function toggleEquip(it){const q=store.equip;const on=isEquipped(it);if(it.type==='hut')q.hat=on?null:{name:it.name,hat:it.hat,color:it.color,color2:it.color2||'#ffffff'};if(it.type==='aura')q.aura=on?null:{name:it.name,color:it.color,color2:it.color2||'#ffffff'};if(it.type==='emote')q.emote=on?null:{name:it.name,emote:it.emote};
  save();buildAvatar(cur);buildAura();renderEmoteBtn();return !on;}
function dailyBonus(){const k=`${TODAY.getFullYear()}-${TODAY.getMonth()+1}-${TODAY.getDate()}`;if(store.lastBonus!==k){store.lastBonus=k;addCoins(100);setTimeout(()=>toast('Tagesbonus: +100 Münzen'),1400);}}

/* ---------- Vorschaubilder für Hüte, Auren, Emotes ---------- */
function rigPose(r,kind,t){if(!r)return;const s=Math.sin(t*6);r.root.position.y=0;r.root.rotation.y=0;r.arms[0].rotation.set(0,0,0);r.arms[1].rotation.set(0,0,0);r.legs[0].rotation.x=0;r.legs[1].rotation.x=0;
  if(kind==='tanzen'){r.arms[0].rotation.z=-2.2-s*.5;r.arms[1].rotation.z=2.2-s*.5;r.root.rotation.y=Math.sin(t*3)*.5;r.legs[0].rotation.x=s*.4;r.legs[1].rotation.x=-s*.4;}
  else if(kind==='huepfen'){r.root.position.y=Math.abs(Math.sin(t*5))*.9;r.arms[0].rotation.z=-2.6;r.arms[1].rotation.z=2.6;r.legs[0].rotation.x=-.3;r.legs[1].rotation.x=.3;}
  else if(kind==='drehen'){r.root.rotation.y=t*9;r.arms[0].rotation.z=-1.5;r.arms[1].rotation.z=1.5;}
  else if(kind==='winken'){r.arms[1].rotation.z=2.7+Math.sin(t*12)*.35;}}
function hatGroup(it){const g=new T.Group();const skin=M('#f1c9a5');const ft=faceTex('#f1c9a5','freundlich','#5b3a1e','#3b2a1e');const hd=new T.Mesh(new T.BoxGeometry(1.22,1.22,1.22),[skin,skin,skin,skin,new T.MeshStandardMaterial({map:ft}),skin]);g.add(hd);const hg=new T.Group();hg.position.y=.6;g.add(hg);buildHat(it.hat||'party',it.color,it.color2||'#ffffff',hg);return g;}
function auraPoints(it,n=60){const pos=new Float32Array(n*3),col=new Float32Array(n*3);const c1=new T.Color(it.color),c2=new T.Color(it.color2||'#ffffff');for(let i=0;i<n;i++){const a=i/n*Math.PI*2*3,r=1.1+(i%3)*.15;pos.set([Math.cos(a)*r,(i/n)*2.4,Math.sin(a)*r],i*3);const c=i%2?c1:c2;col.set([c.r,c.g,c.b],i*3);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));geo.setAttribute('color',new T.BufferAttribute(col,3));return new T.Points(geo,new T.PointsMaterial({size:.32,map:spriteTex('star'),vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));}
function previewObj(it,eid){const ev=getEvent(eid||cur.id)||cur;if(it.type==='hut')return{obj:hatGroup(it),update(){}};
  if(it.type==='emote'||it.type==='aura'){const g=new T.Group();const r=buildRig(ev.avatar,ev.palette,g);r.root.scale.setScalar(.44);let pts=null;if(it.type==='aura'){pts=auraPoints(it);g.add(pts);}
    return{obj:g,update(t){if(it.type==='emote')rigPose(r,it.emote,t);if(pts){pts.rotation.y=t*1.2;pts.material.size=.26+Math.sin(t*4)*.06;}}};}
  return{obj:makeItem(it.shape,it.color,ev.palette),update(){}};}
const thumbCache2=new Map();
function thumbFor(it,eid){if(!it.type||it.type==='item')return thumb(it.shape,it.color);const ev=getEvent(eid||cur.id)||cur;const k=JSON.stringify([it.type,it.hat,it.emote,it.color,it.color2,ev.avatar]);if(thumbCache2.has(k))return thumbCache2.get(k);
  try{thumb('kugel','#ffffff');const sc=new T.Scene();sc.add(new T.HemisphereLight(0xffffff,0x777788,.95));const dl=new T.DirectionalLight(0xffffff,.75);dl.position.set(2,3,4);sc.add(dl);const p=previewObj(it,eid);p.update(it.type==='emote'?.35:0);sc.add(p.obj);
    const box=new T.Box3().setFromObject(p.obj);const c=box.getCenter(new T.Vector3()),s=box.getSize(new T.Vector3()).length();const cam=new T.PerspectiveCamera(34,1,.01,60);cam.position.set(c.x+s*.25,c.y+s*.2,c.z+s*1.25);cam.lookAt(c);thumbR.render(sc,cam);const url=thumbR.domElement.toDataURL();disposeTree(p.obj);thumbCache2.set(k,url);return url;}catch(e){return '';}}

/* ---------- Aura & Emotes am Läufer ---------- */
let auraEm=null,auraG=new T.Group();scene.add(auraG);let auraAcc=0;
function buildAura(){clearGroup(auraG);auraEm=null;const a=store.equip&&store.equip.aura;if(!a)return;auraEm=emitter(auraG,{n:260,size:.22,tex:'star',additive:true});auraEm.cols=[a.color,a.color2||'#ffffff'];}
function stepAura(t,dt){if(!auraEm)return;auraAcc+=dt;const p=walker.position;while(auraAcc>.035){auraAcc-=.035;const ang=Math.random()*Math.PI*2,r=.55+Math.random()*.3;auraEm.emit(p.x+Math.cos(ang)*r,p.y+.2+Math.random()*2.2,p.z+Math.sin(ang)*r,Math.cos(ang)*.2,.5+Math.random()*.6,Math.sin(ang)*.2,auraEm.cols[Math.random()<.5?0:1],1.3);}auraEm.step(dt,-.2,.97);}
let emoteT=0,emoteKind=null;
function playEmote(kind){if(!kind)return;emoteKind=kind;emoteT=2.8;}
function renderEmoteBtn(){const q=store.equip&&store.equip.emote;const b=$('#emoteBtn');b.hidden=!q;if(q)b.textContent='Emote: '+q.name;}

/* ---------- Shop-Liste ---------- */
let chanceCache={k:null,m:null};
function chances(e){const pool=(e.pool||[]).filter(p=>p&&p.shape);const n=Math.min(pool.length,Math.max(1,parseInt(e.ui.slots,10)||5));const k=JSON.stringify(pool.map(p=>[itKey(p),p.rarity]))+n;if(chanceCache.k===k)return chanceCache.m;
  const cnt=new Map(pool.map(p=>[itKey(p),0]));const R=1500;for(let r=0;r<R;r++){const left=pool.map(p=>({p,w:(RARITY[p.rarity]||RARITY.gewoehnlich)[2]}));for(let s=0;s<n&&left.length;s++){const tot=left.reduce((a,b)=>a+b.w,0);let x=Math.random()*tot,j=0;while(j<left.length-1&&(x-=left[j].w)>0)j++;const p=left.splice(j,1)[0].p;cnt.set(itKey(p),cnt.get(itKey(p))+1);}}
  const m=new Map();cnt.forEach((v,kk)=>m.set(kk,Math.round(v/R*100)));chanceCache={k,m};return m;}
function inOffer(it){return rotation(cur).some(x=>itKey(x)===itKey(it));}
function priceEl(it,eid){const d=document.createElement('div');d.className='suprice';if(owns(it,eid)){d.classList.add('owned');d.textContent=isCosm(it)?(isEquipped(it)?'Angelegt':'Gekauft'):'Gekauft';}else{const c=document.createElement('span');c.className='coin';const b=document.createElement('b');b.textContent=fmtCoins(it.price);d.append(c,b);if(store.wallet<(+it.price||0))d.classList.add('poor');}return d;}
function card(it,u,{feat=false,mark=false,eid=null}={}){const r=RARITY[it.rarity]||RARITY.gewoehnlich;const c=document.createElement('div');c.className='sucard'+(feat?' feat':'')+(owns(it,eid||cur.id)?' isowned':'');c.dataset.r=it.rarity||'gewoehnlich';c.style.setProperty('--rc',r[1]);c.tabIndex=0;c.setAttribute('role','button');c.setAttribute('aria-label',`${it.name}, ${r[0]}, ${owns(it,eid||cur.id)?'gekauft':it.price+' Münzen'}. Details anzeigen`);
  const ph=document.createElement('div');ph.className='suimg';const im=document.createElement('img');im.alt='';im.src=thumbFor(it,eid);ph.appendChild(im);
  const bd=document.createElement('span');bd.className='sur';bd.textContent=r[0];ph.appendChild(bd);
  if(it.type&&it.type!=='item'){const tb=document.createElement('span');tb.className='sutype';tb.textContent=ITYPES[it.type];ph.appendChild(tb);}
  if(feat){const hl=document.createElement('span');hl.className='suhl';hl.textContent='Highlight';ph.appendChild(hl);}
  if(mark&&!eid&&inOffer(it)){const hl=document.createElement('span');hl.className='suhl';hl.textContent='Im Angebot';ph.appendChild(hl);}
  if(!eid){const fv=document.createElement('button');fv.className='sufavmini'+(isFav(it)?' on':'');fv.setAttribute('aria-label',isFav(it)?'Nicht mehr merken':'Merken');fv.textContent=isFav(it)?'♥':'♡';fv.onclick=ev=>{ev.stopPropagation();toggleFav(it);renderShopLists();};ph.appendChild(fv);}
  const n=document.createElement('div');n.className='sun';n.textContent=it.name||SHAPES[it.shape]||it.shape;
  const meta=eid?(()=>{const m=document.createElement('div');m.className='suev';m.textContent=(getEvent(eid)||{}).name||'';return m;})():priceEl(it);
  const b=document.createElement('button');b.className='subtn';
  if(eid){if(isCosm(it)){b.textContent=isEquipped(it)?'Ablegen':'Anlegen';b.onclick=ev=>{ev.stopPropagation();const on=toggleEquip(it);toast(on?`Angelegt: ${it.name}`:`Abgelegt: ${it.name}`);if(on&&it.type==='emote')playEmote(it.emote);renderShopLists();};}else{b.textContent='Ansehen';b.onclick=ev=>{ev.stopPropagation();openDetail(it,eid);};}}
  else{b.textContent=u.button||'Ansehen';b.onclick=ev=>{ev.stopPropagation();openDetail(it);};}
  c.append(ph,n,meta,b);c.onclick=()=>openDetail(it,eid);c.onkeydown=ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();openDetail(it,eid);}};return c;}
function gridCols(el,n){el.style.gridTemplateColumns=`repeat(${n<=2?Math.max(1,n):n<=4?2:3},minmax(0,1fr))`;}
function renderShopLists(fresh){const u=cur.ui;const items=rotation(cur);const feat=$('#suFeat'),gr=$('#suGrid');feat.innerHTML='';gr.innerHTML='';
  if(!items.length)gr.innerHTML='<p class="sun" style="opacity:.75">Das Sortiment ist leer. Füge im Bereich Shop-UI Artikel hinzu.</p>';
  items.forEach((it,i)=>{const c=card(it,u,{feat:i===0});c.style.setProperty('--d',(i*70)+'ms');if(fresh)c.classList.add('in');(i===0?feat:gr).appendChild(c);});feat.hidden=!items.length;gridCols(gr,Math.max(0,items.length-1));
  const pool=(cur.pool||[]).filter(p=>p&&p.shape);const fl=$('#suFilter');fl.innerHTML='';[['alle','Alle']].concat(RK.map(k=>[k,RARITY[k][0]])).concat(Object.keys(ITYPES).filter(k=>k!=='item').map(k=>['t:'+k,ITYPES[k]])).forEach(([k,l])=>{const n=k==='alle'?pool.length:k.startsWith('t:')?pool.filter(p=>p.type===k.slice(2)).length:pool.filter(p=>p.rarity===k).length;if(k!=='alle'&&!n)return;const b=document.createElement('button');b.className='suchip'+(shopFilter===k?' on':'');b.textContent=`${l} ${n}`;b.onclick=()=>{shopFilter=k;renderShopLists();};fl.appendChild(b);});
  const match=p=>shopFilter==='alle'||(shopFilter.startsWith('t:')?p.type===shopFilter.slice(2):p.rarity===shopFilter);
  const ag=$('#suAllGrid');ag.innerHTML='';
  if(shopTab==='inv'){const own=Object.values(store.owned).sort((a,b)=>b.at-a.at);own.forEach(o=>ag.appendChild(card(o.item,u,{eid:o.event})));if(!own.length)ag.innerHTML='<p class="sun" style="opacity:.75">Noch nichts gekauft. Stöbere im Angebot oder öffne ein Türchen im Adventskalender.</p>';}
  else{const list=shopTab==='fav'?pool.filter(isFav):pool.filter(match);list.sort((a,b)=>RK.indexOf(b.rarity)-RK.indexOf(a.rarity)).forEach(it=>ag.appendChild(card(it,u,{mark:true})));
    if(!list.length)ag.innerHTML=`<p class="sun" style="opacity:.75">${shopTab==='fav'?'Noch nichts gemerkt. Tippe auf das Herz an einem Artikel.':'Keine Artikel in diesem Filter.'}</p>`;}
  $('#suTabFav').textContent=`Gemerkt (${pool.filter(isFav).length})`;$('#suTabAll').textContent=`Sortiment (${pool.length})`;$('#suTabInv').textContent=`Inventar (${Object.keys(store.owned).length})`;
  $('#suFilter').hidden=shopTab!=='all';$('#suInvBar').hidden=shopTab!=='inv';renderWallet();}
function setShopTab(t){shopTab=t;['offer','all','fav','inv'].forEach(k=>{const b=$('#suTab'+k[0].toUpperCase()+k.slice(1));b.setAttribute('aria-selected',String(k===t));});$('#suOffer').hidden=t!=='offer';$('#suAll').hidden=t==='offer';renderShopLists();}
function openShop(fresh){const u=cur.ui,su=$('#shopui');const R={rund:'18px',eckig:'4px',pixel:'0px'}[u.radius]||'18px';
  su.style.setProperty('--su-bg',u.bg);su.style.setProperty('--su-panel',u.panel);su.style.setProperty('--su-acc',u.accent);su.style.setProperty('--su-text',u.text);su.style.setProperty('--su-r',R);su.dataset.r=u.radius;
  const lum=h=>{const c=new T.Color(h);return .2126*c.r+.7152*c.g+.0722*c.b;};su.style.setProperty('--su-on',lum(u.accent)>.45?'#16161c':'#ffffff');
  $('#suHead').style.backgroundImage=patternURL(u.pattern,u.accent);$('#suPanel').style.setProperty('--su-pat',patternURL(u.pattern,u.text));
  $('#suEyebrow').textContent=cur.name;$('#suTitle').textContent=u.title||cur.name;$('#suSub').textContent=u.subtitle||'';$('#suClose').textContent=u.close||'Schließen';
  const pu=portrait(cur);const pi=$('#suPortrait');pi.parentElement.hidden=!pu;if(pu)pi.src=pu;
  $('#suOwner').textContent=(cur.talk&&cur.talk.name)||'Shopbesitzer';typeText($('#suGreet'),fresh?(cur.talk.restock||'Neue Ware ist da!'):((cur.talk&&cur.talk.click)||''));
  const ri=rotInfo(cur);shopCycle=ri.cycle;if(fresh&&shopTab!=='offer')setShopTab('offer');renderShopLists(fresh);
  $('#suFoot').textContent=`Angebot Nr. ${ri.cycle%10000} · ${rotation(cur).length} von ${(cur.pool||[]).length} Artikeln · wechselt alle ${INTERVALS[String(ri.sec)]||ri.sec+' Sekunden'}`;
  const wasHidden=su.hidden;su.hidden=false;if(wasHidden){setShopTab(shopTab);}tickShop();if(detItem&&!$('#suDetail').hidden)openDetail(detItem,detEid);}

/* ---------- Detailansicht mit Kauf ---------- */
function openDetail(it,eid){detItem=it;detEid=eid||null;buyArm=false;const own=owns(it,eid||cur.id);const r=RARITY[it.rarity]||RARITY.gewoehnlich;const d=$('#suDetail');d.style.setProperty('--rc',r[1]);
  $('#sdRar').textContent=r[0];$('#sdName').textContent=it.name||SHAPES[it.shape];const ch=eid?null:(chances(cur).get(itKey(it))||0);const on=!eid&&inOffer(it);
  const typeText2={item:'Ein Sammelobjekt für dein Inventar.',hut:'Ein Hut für deinen Läufer. Nach dem Kauf kannst du ihn anlegen.',aura:'Ein glitzernder Effekt rund um deinen Läufer.',emote:'Eine Bewegung, die dein Läufer vorführt, wenn er am Stand stehen bleibt.'}[it.type||'item'];
  $('#sdText').textContent=own?typeText2:on?`${typeText2} Gerade im Angebot.`:eid?typeText2:`${typeText2} Gerade nicht im Angebot. Vielleicht bei der nächsten Runde.`;
  const st=$('#sdStats');st.innerHTML='';const rows=[['Typ',ITYPES[it.type||'item']],['Preis',own?'Gekauft':fmtCoins(it.price)+' Münzen'],['Seltenheit',r[0]]];if(ch!==null)rows.push(['Chance pro Runde',ch+' %']);if(it.type==='emote')rows.push(['Bewegung',EMOTES[it.emote]||it.emote]);if(it.type==='hut')rows.push(['Hut',HATS[it.hat]||it.hat]);
  rows.slice(0,4).forEach(([a,b])=>{const dv=document.createElement('div');const s1=document.createElement('span');s1.textContent=a;const s2=document.createElement('b');s2.textContent=b;dv.append(s1,s2);st.appendChild(dv);});
  renderBuyBtns(it);const fv=$('#sdFav');fv.hidden=!!eid;const upd=()=>{fv.textContent=isFav(it)?'♥ Gemerkt':'♡ Merken';fv.setAttribute('aria-pressed',String(isFav(it)));};upd();fv.onclick=()=>{toggleFav(it);upd();renderShopLists();};
  d.hidden=false;startDet3D(it,eid);$('#suBack').focus();}
function renderBuyBtns(it){const eid=detEid||cur.id;const bb=$('#sdBuy'),cx=$('#sdCancel');const own=owns(it,eid);const pr=+it.price||0;cx.hidden=!buyArm;bb.disabled=false;bb.classList.toggle('arm',buyArm);
  if(own){if(isCosm(it)){bb.textContent=isEquipped(it)?'Ablegen':'Anlegen';bb.onclick=()=>{const on=toggleEquip(it);toast(on?`Angelegt: ${it.name}`:`Abgelegt: ${it.name}`);if(on&&it.type==='emote')playEmote(it.emote);renderBuyBtns(it);renderShopLists();};}else{bb.textContent='Im Inventar';bb.disabled=true;}return;}
  if(detEid&&detEid!==cur.id){bb.textContent='Nur im eigenen Shop';bb.disabled=true;return;}
  if(store.wallet<pr){bb.textContent=`Zu wenig Münzen (${fmtCoins(pr)})`;bb.disabled=true;return;}
  bb.textContent=buyArm?`Kauf bestätigen · ${fmtCoins(pr)}`:`Kaufen · ${fmtCoins(pr)}`;
  bb.onclick=()=>{if(!buyArm){buyArm=true;renderBuyBtns(it);return;}buyArm=false;if(buy(it)){say('thanks');typeText($('#suGreet'),cur.talk.thanks||'');toast(`Gekauft: ${it.name}`);coinBurst(bb);openDetail(it);renderShopLists();}else renderBuyBtns(it);};
  cx.onclick=()=>{buyArm=false;renderBuyBtns(it);};}
function coinBurst(el){if(reduce)return;const r=el.getBoundingClientRect();for(let i=0;i<12;i++){const c=document.createElement('span');c.className='coin fly';c.style.left=(r.left+r.width/2)+'px';c.style.top=(r.top)+'px';c.style.setProperty('--dx',((Math.random()-.5)*160)+'px');c.style.setProperty('--dy',(-60-Math.random()*90)+'px');document.body.appendChild(c);setTimeout(()=>c.remove(),800);}}
function closeDetail(){$('#suDetail').hidden=true;detItem=null;detEid=null;cancelAnimationFrame(detRAF);if(detObj){detScene.remove(detObj);disposeTree(detObj);detObj=null;}}
function startDet3D(it,eid){try{const cv=$('#suDetCanvas');if(!detR){detR=new T.WebGLRenderer({canvas:cv,antialias:true,alpha:true});detR.setPixelRatio(Math.min(2,window.devicePixelRatio||1));detR.setSize(320,320,false);detScene=new T.Scene();detScene.add(new T.HemisphereLight(0xffffff,0x6a6a80,.95));const dl=new T.DirectionalLight(0xffffff,.8);dl.position.set(2,3,4);detScene.add(dl);detCam=new T.PerspectiveCamera(32,1,.01,60);}
  cancelAnimationFrame(detRAF);if(detObj){detScene.remove(detObj);disposeTree(detObj);}const pv=previewObj(it,eid);const o=pv.obj;pv.update(0);const box=new T.Box3().setFromObject(o);const c=box.getCenter(new T.Vector3()),s=box.getSize(new T.Vector3()).length();o.position.sub(c);const piv=new T.Group();piv.add(o);detScene.add(piv);detObj=piv;
  detCam.position.set(0,s*.3,s*1.6);detCam.lookAt(0,0,0);let rot=0,drag=null;cv.onpointerdown=ev=>{drag=ev.clientX;cv.setPointerCapture(ev.pointerId);};cv.onpointermove=ev=>{if(drag!==null){rot+=(ev.clientX-drag)*.01;drag=ev.clientX;}};cv.onpointerup=()=>{drag=null;};
  const t0=performance.now();const loop=()=>{const t=(performance.now()-t0)/1000;if(drag===null&&!reduce&&it.type!=='emote')rot+=.012;piv.rotation.y=rot;if(!reduce)pv.update(t);detR.render(detScene,detCam);detRAF=requestAnimationFrame(loop);};loop();}catch(err){}}
function tickShop(){const ri=rotInfo(cur);const t=fmtLeft(ri.left);const cd=$('#suCd');if(cd){$('#suCdT').textContent=t;$('#suRing').style.strokeDashoffset=String(RING_C*(1-ri.left/ri.ms));cd.classList.toggle('urgent',ri.left<=10000);}
  const hc=$('#hudCd');if(hc)hc.textContent='Neue Ware in '+t;
  if(shopCycle!==null&&ri.cycle!==shopCycle){shopCycle=ri.cycle;if(!$('#shopui').hidden){openShop(true);}say('restock');toast(cur.talk.restock||'Neue Ware ist da!');}}
setInterval(()=>{if(cur)tickShop();},1000);
function closeShop(){closeDetail();$('#shopui').hidden=true;}
$('#suBack').onclick=closeDetail;['offer','all','fav','inv'].forEach(k=>{$('#suTab'+k[0].toUpperCase()+k.slice(1)).onclick=()=>setShopTab(k);});
$('#shopui').addEventListener('click',ev=>{if(ev.target.id==='shopui')closeShop();});
$('#invCoins').onclick=()=>{addCoins(250);toast('+250 Test-Münzen');renderShopLists();};
let resetArm=0;$('#invReset').onclick=()=>{const b=$('#invReset');if(!resetArm){resetArm=1;b.textContent='Wirklich alle Käufe löschen?';setTimeout(()=>{resetArm=0;b.textContent='Käufe zurücksetzen';},2500);return;}resetArm=0;b.textContent='Käufe zurücksetzen';store.owned={};store.equip={};save();buildAvatar(cur);buildAura();renderEmoteBtn();renderShopLists();toast('Käufe zurückgesetzt');};
$('#emoteBtn').onclick=()=>{const q=store.equip.emote;if(q)playEmote(q.emote);};

/* ---------- Adventskalender öffnen ---------- */
const CAL_ORDER=[7,15,2,20,11,23,4,18,9,1,13,22,16,6,24,10,3,19,12,21,8,14,5,17];
let calDoors={};
const calOpenedFor=e=>store.calOpened[e.id]=store.calOpened[e.id]||[];
const calDay=()=>TODAY.getMonth()===11?TODAY.getDate():0;
const canOpenDoor=(e,n)=>e.shop.calEarly!==false||calDay()>=n;
const hasCal=e=>has(e,'riesenkalender')||has(e,'kalenderfenster');
function calReward(e,n){const pool=(e.pool||[]).filter(p=>p&&p.shape);if(n===24&&pool.length){const best=pool.slice().sort((a,b)=>RK.indexOf(b.rarity)-RK.indexOf(a.rarity))[0];return{kind:'item',item:best};}
  if(n%6===0&&pool.length)return{kind:'item',item:pool[(n*7)%pool.length]};return{kind:'coins',amount:15+((n*37)%36)};}
function calRewardText(r){return r.kind==='coins'?`+${r.amount} Münzen`:`${r.item.name}`;}
function calShowOpen(n,instant){const d=calDoors[n];if(!d)return;d.forEach(x=>{if(x.big){const rw=calReward(cur,n);const ic=rw.kind==='coins'?makeItem('muenze','#ffcf33'):(rw.item.type&&rw.item.type!=='item'?makeItem('stern',rw.item.color):makeItem(rw.item.shape,rw.item.color,cur.palette));ic.scale.setScalar(Math.min(x.dw,x.dh)*1.4);ic.position.set(x.cx,x.cy-x.dh*.38,x.fz-.05);x.k.add(ic);anims.push(t=>{ic.rotation.y=t+n;});mesh(BX(x.dw-.1,x.dh-.1,.02),glow('#ffd166',.35),x.cx,x.cy,x.fz-.42,x.k);}
  else mesh(BX(.28,.23,.01),glow('#ffd166',.7),x.x,x.y,0,x.fr);
  x.dm.emissiveIntensity=0;x.glowOff=true;const target=x.big?-2.0:-1.6;if(instant||reduce)x.hinge.rotation.y=target;else{const h=x.hinge;anims.push(()=>{h.rotation.y+=(target-h.rotation.y)*.08;});}});}
function openCalDoor(n){const e=cur;const op=calOpenedFor(e);if(op.includes(n)){toast(`Türchen ${n} ist schon offen: ${calRewardText(calReward(e,n))}`);return;}
  if(!canOpenDoor(e,n)){toast(`Türchen ${n} öffnet am ${n}. Dezember`);return;}
  op.push(n);save();const rw=calReward(e,n);let msg;if(rw.kind==='coins'){addCoins(rw.amount);msg=`Türchen ${n}: +${rw.amount} Münzen!`;}else if(grant(rw.item,e.id)){msg=`Türchen ${n}: ${rw.item.name} gehört jetzt dir!`;}else{addCoins(50);msg=`Türchen ${n}: ${rw.item.name} hast du schon, dafür +50 Münzen!`;}
  calShowOpen(n,false);say('x',msg);toast(msg);renderCalUI(n);if(!$('#shopui').hidden)renderShopLists();}
function renderCalUI(flipN){const g=$('#calGrid');if(!g||$('#calui').hidden)return;g.innerHTML='';const op=calOpenedFor(cur);
  $('#calInfo').textContent=`${op.length} von 24 Türchen offen · ${cur.shop.calEarly!==false?'Vorschau: alle Türchen lassen sich schon öffnen':'Jedes Türchen öffnet an seinem Tag im Dezember'}`;
  CAL_ORDER.forEach(n=>{const b=document.createElement('button');const open=op.includes(n),ok=canOpenDoor(cur,n);b.className='caldoor'+(open?' open':'')+(!open&&ok?' ready':'')+(n===24?' big':'')+(n===flipN?' flip':'');b.setAttribute('aria-label',open?`Türchen ${n}, offen: ${calRewardText(calReward(cur,n))}`:ok?`Türchen ${n} öffnen`:`Türchen ${n}, öffnet am ${n}. Dezember`);
    const fr=document.createElement('span');fr.className='cdf';fr.textContent=n;if(!ok&&!open){const l=document.createElement('small');l.textContent=`ab ${n}.12.`;fr.appendChild(l);}
    const bk=document.createElement('span');bk.className='cdb';const rw=calReward(cur,n);if(open){let im;if(rw.kind==='coins'){im=document.createElement('span');im.className='coin bigcoin';}else{im=document.createElement('img');im.alt='';im.src=thumbFor(rw.item);}const t=document.createElement('small');t.textContent=calRewardText(rw);bk.append(im,t);}
    b.append(fr,bk);b.onclick=()=>openCalDoor(n);g.appendChild(b);});}
function openCalUI(){$('#calui').hidden=false;renderCalUI();renderWallet();$('#calClose').focus();}
$('#calBtn').onclick=openCalUI;$('#calClose').onclick=()=>{$('#calui').hidden=true;};$('#calui').addEventListener('click',ev=>{if(ev.target.id==='calui')$('#calui').hidden=true;});
function renderCalBtn(){$('#calBtn').hidden=!hasCal(cur);}



$('#suClose').onclick=()=>{closeShop();say('bye');};
$('#shopBtn').onclick=()=>{say('click');openShop();};
document.addEventListener('keydown',ev=>{if(ev.key!=='Escape')return;if(!$('#calui').hidden){$('#calui').hidden=true;return;}if(!$('#suDetail').hidden)closeDetail();else closeShop();});

/* ---------- Zeiträume: für alle sichtbar, ändern nur Admins (Code wie in der Checkliste) ---------- */
const ZKEY='coinmaster.eventlaeden.zeit';
try{ZEIT=JSON.parse(localStorage.getItem(ZKEY)||'{}')||{};}catch(e){ZEIT={};}
let zeitInfo={status:'laden',text:'Zeiträume werden geladen …'},admin=null,zcfgP=null;const zmsg={};
function zcfg(){zcfgP??=import(`../../checkliste/js/config.js?v=${Date.now()}`).then(m=>({url:(m.SUPABASE_URL||'').replace(/\/+$/,''),key:m.SUPABASE_KEY||''}),()=>{zcfgP=null;return{url:'',key:''};});return zcfgP;}
async function rpc(name,args){const c=await zcfg();if(!c.url||!c.key){const e=new Error('Supabase ist noch nicht eingerichtet (checkliste/js/config.js).');e.missing=true;throw e;}
  const headers={apikey:c.key,'Content-Type':'application/json',Accept:'application/json'};if(c.key.startsWith('eyJ'))headers.Authorization=`Bearer ${c.key}`;
  let r;try{r=await fetch(`${c.url}/rest/v1/rpc/${name}`,{method:'POST',headers,body:JSON.stringify(args||{}),cache:'no-store'});}catch(e){throw new Error('Keine Verbindung zu Supabase.');}
  let j=null;try{j=await r.json();}catch(e){}
  if(!r.ok){if(r.status===404||(j&&j.code==='PGRST202')){const e=new Error('Die Zeiträume sind in Supabase noch nicht eingerichtet: einmalig eventlaeden/supabase.sql im SQL Editor ausführen.');e.missing=true;throw e;}throw new Error((j&&j.message)||`Supabase-Fehler ${r.status}`);}
  if(j&&j.fehler)throw new Error(j.fehler);return j;}
function takeZeit(list){const z={};(list||[]).forEach(x=>{if(x&&x.id)z[x.id]={modus:x.modus,start:x.start,ende:x.ende,geaendert:x.geaendert,von:x.von};});ZEIT=z;try{localStorage.setItem(ZKEY,JSON.stringify(ZEIT));}catch(e){}renderList();renderHud();renderZeit();}
async function loadZeit(){try{const j=await rpc('eventlaeden_laden',{});takeZeit(Array.isArray(j)?j:[]);zeitInfo={status:'ok',text:''};}catch(e){zeitInfo={status:e.missing?'fehlt':'fehler',text:e.message};}renderZeit();}
const LOGIN_KEY='coinmaster.checkliste';
function savedLogin(){try{const v=JSON.parse(localStorage.getItem(LOGIN_KEY)||'{}');return v.code?v:null;}catch(e){return null;}}
async function tryLogin(code,quiet){try{const j=await rpc('eventlaeden_pruefen',{p_code:code});admin={code,name:j.ich};try{localStorage.setItem(LOGIN_KEY,JSON.stringify({code,name:j.ich}));}catch(e){}zeitInfo.loginErr='';}catch(e){admin=null;if(!quiet)zeitInfo.loginErr=e.message;}renderZeit();}
function parseTT(s){const m=String(s||'').trim().match(/^(\d{1,2})\.(\d{1,2})\.?$/);if(!m)return null;const d=+m[1],mo=+m[2];if(mo<1||mo>12||d<1||d>new Date(2024,mo,0).getDate())return null;return`${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;}
function renderZeit(){const box=$('#zeitList');if(!box)return;box.innerHTML='';
  const st=$('#zeitStatus');st.textContent=zeitInfo.status==='laden'?zeitInfo.text:zeitInfo.status==='ok'?'':zeitInfo.text;st.className='z-status'+(zeitInfo.status==='fehler'?' err':'');
  const lg=$('#zeitLogin');lg.innerHTML='';
  if(admin){const p=document.createElement('p');p.className='z-who';p.textContent=`Angemeldet als ${admin.name}. Du kannst die Zeiträume ändern.`;const out=document.createElement('button');out.type='button';out.className='btn';out.textContent='Abmelden';out.onclick=()=>{admin=null;renderZeit();};lg.append(p,out);}
  else if(zeitInfo.status!=='fehlt'){const f=document.createElement('form');f.className='z-form';f.innerHTML='<label for="zCode">Admin-Code</label><input id="zCode" type="password" autocomplete="current-password" minlength="8" required placeholder="Dein Code aus der Checkliste"><button class="btn" type="submit">Anmelden</button>';
    f.onsubmit=ev=>{ev.preventDefault();tryLogin(f.querySelector('input').value,false);};lg.appendChild(f);if(zeitInfo.loginErr){const e=document.createElement('p');e.className='z-status err';e.textContent=zeitInfo.loginErr;lg.appendChild(e);}}
  BUILTIN.forEach(b=>{const z=ZEIT[b.id]||{modus:'auto'};const r=nextOcc(b.id);const s=status(r);const row=document.createElement('div');row.className='z-row'+(cur&&cur.id===b.id?' is-cur':'');
    const nm=document.createElement('button');nm.type='button';nm.className='z-name';nm.textContent=b.name;nm.onclick=()=>{select(b.id);$('#stage').scrollIntoView({behavior:'smooth',block:'center'});};
    const rule=document.createElement('div');rule.className='z-rule';const rl=document.createElement('span');rl.className='z-mode z-'+(z.modus||'auto');rl.textContent={auto:'Automatisch',fest:'Fester Zeitraum',aus:'Ausgeschaltet'}[z.modus||'auto'];const rt=document.createElement('span');rt.textContent=z.modus==='aus'?'Kommt nicht':ruleText(b.id);rule.append(rl,rt);
    const nx=document.createElement('div');nx.className='z-next';nx.textContent=z.modus==='aus'?'–':r?fmtRange(r):'–';if(s&&z.modus!=='aus'){const c=document.createElement('span');c.className='chip '+(s.cls||'');c.textContent=s.txt;nx.appendChild(c);}
    row.append(nm,rule,nx);
    if(admin){const ed=document.createElement('div');ed.className='z-edit';const sel=document.createElement('select');sel.setAttribute('aria-label',`Zeitraum für ${b.name}`);[['auto','Automatisch'],['fest','Fester Zeitraum'],['aus','Ausgeschaltet']].forEach(([v,l])=>{const o=new Option(l,v);if((z.modus||'auto')===v)o.selected=true;sel.add(o);});
      const a=document.createElement('input');a.placeholder='TT.MM.';a.inputMode='numeric';a.setAttribute('aria-label',`Start für ${b.name}`);a.value=z.modus==='fest'?ddmm(z.start):'';const bb=document.createElement('input');bb.placeholder='TT.MM.';bb.inputMode='numeric';bb.setAttribute('aria-label',`Ende für ${b.name}`);bb.value=z.modus==='fest'?ddmm(z.ende):'';
      const dash=document.createElement('span');dash.textContent='bis';const sync=()=>{const f=sel.value==='fest';a.hidden=bb.hidden=dash.hidden=!f;};sync();sel.onchange=sync;
      const sv=document.createElement('button');sv.type='button';sv.className='btn';sv.textContent='Speichern';
      sv.onclick=async()=>{let ps='',pe='';if(sel.value==='fest'){ps=parseTT(a.value);pe=parseTT(bb.value);if(!ps||!pe){zmsg[b.id]={err:true,t:'Bitte Start und Ende als TT.MM. eingeben, z. B. 24.12.'};renderZeit();return;}}
        sv.disabled=true;sv.textContent='Speichert …';try{const j=await rpc('eventlaeden_setzen',{p_code:admin.code,p_id:b.id,p_modus:sel.value,p_start:ps,p_ende:pe});zmsg[b.id]={t:'Gespeichert'};takeZeit(j.zeitraeume||[]);}catch(e){zmsg[b.id]={err:true,t:e.message};renderZeit();}};
      ed.append(sel,a,dash,bb,sv);row.appendChild(ed);}
    const m=zmsg[b.id];if(m){const p=document.createElement('p');p.className='z-msg'+(m.err?' err':'');p.textContent=m.t;row.appendChild(p);}
    else if(z.von&&z.geaendert){const p=document.createElement('p');p.className='z-msg';const d=new Date(z.geaendert);p.textContent=`Zuletzt geändert von ${z.von} am ${d.getDate()}.${d.getMonth()+1}.${d.getFullYear()}`;row.appendChild(p);}
    box.appendChild(row);});}

/* ---------- Start ---------- */
select(pickDefault());renderWallet();dailyBonus();renderZeit();
loop();
loadZeit();{const l=savedLogin();if(l)tryLogin(l.code,true);}
if(document.fonts&&document.fonts.load){Promise.all([document.fonts.load('40px "Lilita One"'),document.fonts.load('700 20px Nunito')]).then(()=>applyEvent(cur)).catch(()=>{});}
