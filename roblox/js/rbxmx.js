// Schreibt Roblox-Modelle im XML-Format (.rbxmx). In Studio: Rechtsklick auf Workspace →
// „Insert from File…“ (bzw. Datei in das 3D-Fenster ziehen).
//
// Reiner Text, keine Abhängigkeit vom Browser – lässt sich auch in Node prüfen.

// Enum-Werte aus der Roblox-API
const MATERIAL = {
  Plastic: 256, SmoothPlastic: 272, Neon: 288, Wood: 512, Marble: 784, Basalt: 788, Slate: 800, CrackedLava: 804,
  Concrete: 816, Granite: 832, Pebble: 864, Rock: 896, Metal: 1088, Grass: 1280, Ground: 1376, Sand: 1296, Snow: 1328,
  Ice: 1536, Glacier: 1552, Glass: 1568,
};
const SHAPE = { Ball: 0, Block: 1, Cylinder: 2 };
const NORMAL_ID = { Right: 0, Top: 1, Back: 2, Left: 3, Bottom: 4, Front: 5 };

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const f = (n) => (Math.round(n * 1000) / 1000).toString();
const rgb = (hex) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

let ref = 0;
const referent = () => `RBX${(ref++).toString(16).toUpperCase().padStart(8, '0')}`;

const prop = {
  string: (name, v) => `<string name="${name}">${esc(v)}</string>`,
  bool: (name, v) => `<bool name="${name}">${v ? 'true' : 'false'}</bool>`,
  float: (name, v) => `<float name="${name}">${f(v)}</float>`,
  token: (name, v) => `<token name="${name}">${v}</token>`,
  vec3: (name, [x, y, z]) => `<Vector3 name="${name}"><X>${f(x)}</X><Y>${f(y)}</Y><Z>${f(z)}</Z></Vector3>`,
  vec2: (name, [x, y]) => `<Vector2 name="${name}"><X>${f(x)}</X><Y>${f(y)}</Y></Vector2>`,
  color3: (name, hex) => {
    const [r, g, b] = rgb(hex);
    return `<Color3 name="${name}"><R>${f(r / 255)}</R><G>${f(g / 255)}</G><B>${f(b / 255)}</B></Color3>`;
  },
  color3uint8: (name, hex) => {
    const [r, g, b] = rgb(hex);
    return `<Color3uint8 name="${name}">${(0xff000000 + r * 65536 + g * 256 + b) >>> 0}</Color3uint8>`;
  },
  cframe: (name, [x, y, z], r) =>
    `<CoordinateFrame name="${name}"><X>${f(x)}</X><Y>${f(y)}</Y><Z>${f(z)}</Z>` +
    ['R00', 'R01', 'R02', 'R10', 'R11', 'R12', 'R20', 'R21', 'R22'].map((k, i) => `<${k}>${f(r[i])}</${k}>`).join('') +
    `</CoordinateFrame>`,
  range: (name, [a, b]) => `<NumberRange name="${name}">${f(a)} ${f(b)} </NumberRange>`,
  numseq: (name, pts) => `<NumberSequence name="${name}">${pts.map(([t, v]) => `${f(t)} ${f(v)} 0 `).join('')}</NumberSequence>`,
  colorseq: (name, hexes) => {
    const pts = hexes.length === 1 ? [hexes[0], hexes[0]] : hexes;
    return `<ColorSequence name="${name}">${pts
      .map((h, i) => {
        const [r, g, b] = rgb(h);
        return `${f(i / (pts.length - 1))} ${f(r / 255)} ${f(g / 255)} ${f(b / 255)} 0 `;
      })
      .join('')}</ColorSequence>`;
  },
  udim2: (name, [xs, xo, ys, yo]) => `<UDim2 name="${name}"><XS>${f(xs)}</XS><XO>${xo | 0}</XO><YS>${f(ys)}</YS><YO>${yo | 0}</YO></UDim2>`,
  content: (name, url) => `<Content name="${name}"><url>${esc(url)}</url></Content>`,
};

const item = (cls, props, children = '', ref = referent()) => `<Item class="${cls}" referent="${ref}"><Properties>${props.join('')}</Properties>${children}</Item>`;

function part(p, offset = [0, 0, 0], extraChildren = '') {
  const size = p.size.map((v) => Math.max(0.05, v));
  const isEllipsoid = p.shape === 'Ellipsoid';
  // inside: negative Skalierung dreht die Kugel um, sie ist dann von innen sichtbar (Himmelskuppel)
  let children = (isEllipsoid ? item('SpecialMesh', [prop.string('Name', 'Mesh'), prop.token('MeshType', 3), prop.vec3('Scale', p.inside ? [-1, -1, -1] : [1, 1, 1])]) : '') + extraChildren;
  if (p.text) {
    // Schrift auf der Vorderseite (+z der Webseite = Back in Roblox)
    const label = item('TextLabel', [
      prop.string('Name', 'Text'),
      prop.udim2('Size', [1, 0, 1, 0]),
      prop.float('BackgroundTransparency', 1),
      prop.string('Text', p.text),
      prop.bool('TextScaled', true),
      prop.color3('TextColor3', p.textColor),
      prop.float('TextStrokeTransparency', 0.6),
    ]);
    children += item('SurfaceGui', [prop.string('Name', 'Schild'), prop.token('Face', NORMAL_ID.Back), prop.float('LightInfluence', 0.2)], label);
  }
  return item(
    p.className || 'Part',
    [
      prop.string('Name', p.name || (isEllipsoid ? 'Kugel' : p.shape === 'Cylinder' ? 'Zylinder' : 'Block')),
      prop.bool('Anchored', true),
      prop.bool('CanCollide', p.canCollide ?? true),
      prop.bool('CastShadow', p.castShadow ?? true),
      // Kuppel und Wolkenmeer: von Klicks und Strahlen ignoriert
      ...(p.noShadow || p.model ? [prop.bool('CanQuery', false), prop.bool('CanTouch', false)] : []),
      prop.cframe('CFrame', [p.pos[0] + offset[0], p.pos[1] + offset[1], p.pos[2] + offset[2]], p.rot),
      prop.color3uint8('Color3uint8', p.color),
      prop.token('Material', MATERIAL[p.material] ?? MATERIAL.SmoothPlastic),
      prop.float('Transparency', p.transparency || 0),
      prop.float('Reflectance', 0),
      // WedgePart hat keine Shape-Eigenschaft
      ...(p.shape === 'Wedge' ? [] : [prop.token('shape', SHAPE[isEllipsoid ? 'Block' : p.shape])]),
      prop.vec3('size', size),
      prop.token('TopSurface', 0),
      prop.token('BottomSurface', 0),
    ],
    children,
  );
}

const folder = (name, children) => item('Folder', [prop.string('Name', name)], children);
const value = (cls, name, v) =>
  item(cls, [
    prop.string('Name', name),
    cls === 'Color3Value' ? prop.color3('Value', v) : cls === 'NumberValue' ? `<double name="Value">${f(v)}</double>` : cls === 'BoolValue' ? prop.bool('Value', v) : prop.string('Value', v),
  ]);

const ID = { x: [1, 0, 0, 0, 1, 0, 0, 0, 1] };

// Eine Welt als Model; offset verschiebt alles (für mehrere Welten in einer Datei)
// Ordner „Licht“: Lighting-Werte und Atmosphere der Welt (worldLighting in worldParts.js)
function lightFolder(L) {
  const a = L.atmosphere;
  const atmosphere = item('Atmosphere', [
    prop.string('Name', 'Atmosphere'),
    prop.float('Density', a.Density),
    prop.float('Offset', a.Offset),
    prop.color3('Color', a.Color),
    prop.color3('Decay', a.Decay),
    prop.float('Glare', a.Glare),
    prop.float('Haze', a.Haze),
  ]);
  // Bloom: Neon und Lava leuchten weich nach
  const bloom = L.bloom
    ? item('BloomEffect', [prop.string('Name', 'Bloom'), prop.float('Intensity', L.bloom.Intensity), prop.float('Size', L.bloom.Size), prop.float('Threshold', L.bloom.Threshold)])
    : '';
  return folder(
    'Licht',
    atmosphere +
      bloom +
      [
        value('NumberValue', 'ClockTime', L.ClockTime),
        value('NumberValue', 'Brightness', L.Brightness),
        value('Color3Value', 'Ambient', L.Ambient),
        value('Color3Value', 'OutdoorAmbient', L.OutdoorAmbient),
        value('Color3Value', 'FogColor', L.FogColor),
        value('NumberValue', 'FogStart', L.FogStart),
        value('NumberValue', 'FogEnd', L.FogEnd),
      ].join(''),
  );
}

// Ordner „Klaenge“: eine unsichtbare Klangquelle über der Inselmitte mit einem Sound je Platz, noch ohne
// SoundId. In Roblox Studio eine Sound-ID aus der Toolbox eintragen; der StringValue „Vorschlag“ sagt, welcher
// Klang hierher passt. Die Sounds laufen von selbst (Playing, Looped) und sind nur in der Nähe der Insel
// zu hören (RollOffMaxDistance 700 Studs, die Inseln liegen 1500 Studs auseinander).
function soundFolder(list, offset) {
  const sounds = list
    .map((s) =>
      item(
        'Sound',
        [prop.string('Name', s.name), '<Content name="SoundId"><null></null></Content>', prop.float('Volume', s.volume), prop.bool('Looped', true), prop.bool('Playing', true), prop.float('RollOffMaxDistance', 700), prop.float('RollOffMinDistance', 80)],
        value('StringValue', 'Vorschlag', s.hint),
      ),
    )
    .join('');
  const src = { shape: 'Block', name: 'Klangquelle', pos: [0, 40, 0], rot: ID.x, size: [1, 1, 1], color: '#ffffff', material: 'SmoothPlastic', transparency: 1, canCollide: false, castShadow: false, noShadow: true };
  return folder('Klaenge', part(src, offset, sounds));
}

export function worldModel(w, offset = [0, 0, 0]) {
  const { world, parts, sky, lights, emitter, emitters, lighting, sounds } = w;
  const byFolder = { Insel: [], Deko: [], Modelle: [], Muenzen: [], Teleport: [], Spawn: [], Portale: [], Ranglisten: [] };
  for (const p of parts) {
    if (p.name === 'SpawnLocation') byFolder.Spawn.push(p);
    else if (p.name?.startsWith('Portal')) byFolder.Portale.push(p);
    else if (p.name === 'Rangliste') byFolder.Ranglisten.push(p);
    else if (p.name === 'CoinSpawn') byFolder.Muenzen.push(p);
    else if (p.model) byFolder.Modelle.push(p);
    else if (p.name === 'TeleportPad') byFolder.Teleport.push(p);
    else if (p.name === 'Boden' || p.name === 'Fels' || p.name === 'Rand') byFolder.Insel.push(p);
    else byFolder.Deko.push(p);
  }
  for (const p of byFolder.Muenzen) {
    // Münzplätze: das Spiel setzt hier echte Münzen ein, darum nicht fest und durchsichtig im Spiel
    p.canCollide = false;
  }
  const lightParts = lights
    .map((l) =>
      part(
        { shape: 'Block', name: 'Licht', pos: l.pos, rot: ID.x, size: [1, 1, 1], color: l.color, material: 'SmoothPlastic', transparency: 1, canCollide: false, castShadow: false },
        offset,
        item('PointLight', [prop.string('Name', 'PointLight'), prop.color3('Color', l.color), prop.float('Brightness', l.brightness), prop.float('Range', l.range), prop.bool('Shadows', false)]),
      ),
    )
    .join('');
  let fx = '';
  for (const e of emitters || (emitter ? [emitter] : [])) {
    const pe = item('ParticleEmitter', [
      prop.string('Name', e.name || 'Weltpartikel'),
      prop.colorseq('Color', e.colors.slice(0, 3)),
      prop.numseq('Size', [[0, e.particleSize], [1, e.particleSize * 0.8]]),
      prop.numseq('Transparency', [[0, 0.1], [0.8, 0.3], [1, 1]]),
      prop.range('Lifetime', e.lifetime),
      prop.float('Rate', e.rate),
      prop.range('Speed', e.speed),
      prop.vec2('SpreadAngle', e.spread),
      prop.token('EmissionDirection', NORMAL_ID[e.direction]),
      prop.float('LightEmission', e.lightEmission),
      prop.range('RotSpeed', [-40, 40]),
      prop.range('Rotation', [0, 360]),
      prop.content('Texture', e.squares ? 'rbxasset://textures/particles/sparkles_main.dds' : 'rbxasset://textures/particles/sparkles_main.dds'),
    ]);
    fx += part({ shape: 'Block', name: 'Partikelquelle', pos: e.pos, rot: ID.x, size: e.size, color: '#ffffff', material: 'SmoothPlastic', transparency: 1, canCollide: false, castShadow: false }, offset, pe);
  }
  const settings = folder(
    'Einstellungen',
    [
      value('StringValue', 'WeltId', world.id),
      value('StringValue', 'Planet', world.planet),
      value('NumberValue', 'Preis', world.price),
      value('NumberValue', 'Glueck', world.luck),
      value('NumberValue', 'Muenzwert', world.value),
      value('Color3Value', 'HimmelOben', world.sky[0]),
      value('Color3Value', 'HimmelUnten', world.sky[1]),
      value('Color3Value', 'Akzent', world.accent),
    ].join(''),
  );
  // Platzhalter für Modelle: StringValue „Modell“ (Name in der Bibliothek) und BoolValue „Fest“ (kollidiert)
  const list = (arr) => arr.map((p) => part(p, offset, p.model ? value('StringValue', 'Modell', p.model) + value('BoolValue', 'Fest', !!p.fest) : '')).join('');
  return item(
    'Model',
    [prop.string('Name', `Welt_${world.name.replace(/\s+/g, '')}`)],
    settings +
      folder('Insel', list(byFolder.Insel)) +
      folder('Deko', list(byFolder.Deko)) +
      (byFolder.Modelle.length ? folder('Modelle', list(byFolder.Modelle)) : '') +
      folder('Muenzen', list(byFolder.Muenzen)) +
      folder('Teleport', list(byFolder.Teleport)) +
      (byFolder.Spawn.length ? folder('Spawn', list(byFolder.Spawn)) : '') +
      (byFolder.Portale.length ? folder('Portale', list(byFolder.Portale)) : '') +
      (byFolder.Ranglisten.length ? folder('Ranglisten', list(byFolder.Ranglisten)) : '') +
      folder('Himmel', list(sky)) +
      folder('Effekte', lightParts + fx) +
      (sounds?.length ? soundFolder(sounds, offset) : '') +
      (lighting ? lightFolder(lighting) : ''),
  );
}

// Haustiere: Ordner „Haustiere“ mit einem Model je Tier (Name = Id). Jedes Model hat eine unsichtbare
// PrimaryPart „Root“, die Füße stehen auf y = 0. Gehört nach ReplicatedStorage > CoinmasterAdventure.
export function petsFolder(list) {
  return folder(
    'Haustiere',
    list
      .map(({ pet, parts, height }) => {
        const rootRef = referent();
        const root = item(
          'Part',
          [
            prop.string('Name', 'Root'),
            prop.bool('Anchored', true),
            prop.bool('CanCollide', false),
            prop.bool('CastShadow', false),
            prop.cframe('CFrame', [0, height / 2, 0], ID.x),
            prop.color3uint8('Color3uint8', '#ffffff'),
            prop.token('Material', MATERIAL.SmoothPlastic),
            prop.float('Transparency', 1),
            prop.token('shape', SHAPE.Block),
            prop.vec3('size', [2, height, 2]),
          ],
          '',
          rootRef,
        );
        const name = value('StringValue', 'Anzeigename', pet.name);
        return item('Model', [prop.string('Name', pet.id), `<Ref name="PrimaryPart">${rootRef}</Ref>`], root + parts.map((p) => part(p)).join('') + name);
      })
      .join(''),
  );
}

export function rbxmxFile(models) {
  return `<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.roblox.com/roblox.xsd" version="4">
<External>null</External>
<External>nil</External>
${models.join('\n')}
</roblox>
`;
}
