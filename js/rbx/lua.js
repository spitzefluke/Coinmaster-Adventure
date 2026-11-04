// Führt Luau-Code aus dem Roblox-Export im Browser aus (fengari, Lua 5.3) und verbindet ihn mit der
// Roblox-Engine der Vorschau. So zeigen Vorschauen genau das, was die Skripte in Roblox bauen.
//
//   const lua = await createLua();
//   lua.setWorld(world);              // workspace und Lighting zeigen auf diese Welt
//   lua.run(code, 'Name');            // Luau-Code ausführen
//   lua.frame(dt);                    // ein Bild: task.wait/delay, Tweens, RenderStepped, Heartbeat

import * as THREE from 'three';
import { Inst, rgb, emitParticles } from './engine.js';
import { RUNTIME_LUA } from './runtime.lua.js';

const FENGARI = 'https://cdn.jsdelivr.net/npm/fengari-web@0.1.4/dist/fengari-web.js';
let loading = null;
function loadFengari() {
  if (window.fengari) return Promise.resolve(window.fengari);
  loading ||= new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = FENGARI;
    s.onload = () => res(window.fengari);
    s.onerror = () => rej(new Error('fengari konnte nicht geladen werden'));
    document.head.append(s);
  });
  return loading;
}

const tmpM = new THREE.Matrix4();
const cfToMatrix = (a) => new THREE.Matrix4().set(a[3], a[4], a[5], a[0], a[6], a[7], a[8], a[1], a[9], a[10], a[11], a[2], 0, 0, 0, 1);

export async function createLua({ onPrint = (s) => console.log('[Luau]', s) } = {}) {
  const F = await loadFengari();
  const { lua, lauxlib, lualib, to_luastring, to_jsstring } = F;
  const L = lauxlib.luaL_newstate();
  lualib.luaL_openlibs(L);
  const insts = new Map();
  let world = null;
  // Feste Instanzen: 1 workspace, 2 Lighting (zeigen auf die aktuelle Welt), 3–9 Ordner und Dienste
  const fixed = new Map([[3, 'ReplicatedStorage'], [4, 'ServerScriptService'], [5, 'ServerStorage'], [6, 'StarterPlayer'], [7, 'StarterPlayerScripts'], [8, 'StarterGui'], [9, 'PlayerGui']]);
  for (const [id, name] of fixed) {
    const i = new Inst('Folder');
    i.props.Name = name;
    insts.set(id, i);
  }
  const get = (id) => (id === 1 ? world?.workspace : id === 2 ? world?.lighting : insts.get(id));

  let S = L;
  const str = (i) => lua.lua_tojsstring(S, i);
  const num = (i) => lua.lua_tonumber(S, i);
  // JS-Funktionen bekommen den Lua-Zustand, der sie aufruft (auch Koroutinen aus task.spawn)
  const reg = (name, fn) => {
    lua.lua_pushjsfunction(L, (thread) => {
      const prev = S;
      S = thread;
      try {
        return fn();
      } finally {
        S = prev;
      }
    });
    lua.lua_setglobal(L, to_luastring(name));
  };
  const pushStr = (s) => lua.lua_pushstring(S, to_luastring(String(s)));

  // Lua → Engine-Wert
  function value(kind, base) {
    const n = (k) => num(base + k);
    switch (kind) {
      case 'n': return n(0);
      case 's': return str(base);
      case 'b': return lua.lua_toboolean(S, base);
      case 'nil': return null;
      case 'V3': return new THREE.Vector3(n(0), n(1), n(2));
      case 'CF': return cfToMatrix(Array.from({ length: 12 }, (_, k) => n(k)));
      case 'C3': return rgb(n(0), n(1), n(2));
      case 'NR': return [n(0), n(1)];
      case 'V2': return [n(0), n(1)];
      case 'U2': return [n(0), n(1), n(2), n(3)];
      case 'U': return [n(0), n(1)];
      case 'E': return str(base);
      case 'I': return get(n(0)) || null;
      case 'NS': {
        const top = lua.lua_gettop(S), out = [];
        for (let i = base; i + 1 <= top; i += 2) out.push([num(i), num(i + 1)]);
        return out;
      }
      case 'CS': {
        const top = lua.lua_gettop(S), out = [];
        for (let i = base; i + 3 <= top; i += 4) out.push([num(i), rgb(num(i + 1), num(i + 2), num(i + 3))]);
        return out;
      }
    }
    return null;
  }
  // Engine-Wert → Lua (für Standardwerte)
  function push(v) {
    if (v === undefined || v === null) {
      pushStr('none');
      return 1;
    }
    if (typeof v === 'number') return pushStr('n'), lua.lua_pushnumber(S, v), 2;
    if (typeof v === 'string') return pushStr('s'), pushStr(v), 2;
    if (typeof v === 'boolean') return pushStr('b'), lua.lua_pushboolean(S, v), 2;
    if (v.isVector3) return pushStr('V3'), lua.lua_pushnumber(S, v.x), lua.lua_pushnumber(S, v.y), lua.lua_pushnumber(S, v.z), 4;
    if (v.isMatrix4) {
      const e = v.elements;
      pushStr('CF');
      for (const k of [12, 13, 14, 0, 4, 8, 1, 5, 9, 2, 6, 10]) lua.lua_pushnumber(S, e[k]);
      return 13;
    }
    if (v.__rbx === 'Color3') return pushStr('C3'), v.srgb.forEach((c) => lua.lua_pushnumber(S, c)), 4;
    if (v instanceof Inst) {
      for (const [id, i] of insts) if (i === v) return pushStr('I'), lua.lua_pushnumber(S, id), 2;
      return pushStr('none'), 1;
    }
    if (Array.isArray(v)) {
      if (Array.isArray(v[0])) {
        if (v[0][1] && v[0][1].__rbx === 'Color3') {
          pushStr('CS');
          for (const [t, c] of v) [t, ...c.srgb].forEach((x) => lua.lua_pushnumber(S, x));
          return 1 + v.length * 4;
        }
        pushStr('NS');
        for (const [t, x] of v) lua.lua_pushnumber(S, t), lua.lua_pushnumber(S, x);
        return 1 + v.length * 2;
      }
      pushStr(v.length === 4 ? 'U2' : 'NR');
      v.forEach((x) => lua.lua_pushnumber(S, x));
      return 1 + v.length;
    }
    pushStr('none');
    return 1;
  }

  let nextId = 100;
  reg('__js_new', () => {
    const cls = str(1);
    const i = new Inst(cls);
    const id = nextId++;
    insts.set(id, i);
    lua.lua_pushnumber(S, id);
    return 1;
  });
  reg('__js_set', () => {
    const inst = get(num(1));
    if (!inst) return 0;
    const key = str(2), kind = str(3);
    let v = value(kind, 4);
    if (key === 'Position' && v?.isVector3 && inst.props.CFrame && inst.ClassName !== 'Attachment') {
      inst.set('CFrame', inst.props.CFrame.clone().setPosition(v));
      return 0;
    }
    if (key === 'Orientation' && v?.isVector3 && inst.props.CFrame) {
      const d = THREE.MathUtils.degToRad;
      const m = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(d(v.x), d(v.y), d(v.z), 'YXZ'));
      inst.set('CFrame', m.setPosition(new THREE.Vector3().setFromMatrixPosition(inst.props.CFrame)));
      return 0;
    }
    if (key === 'Color3' && inst.ClassName === 'Decal') v = v || rgb(1, 1, 1);
    inst.set(key, v);
    return 0;
  });
  reg('__js_get', () => {
    const inst = get(num(1));
    if (!inst) return pushStr('none'), 1;
    const key = str(2);
    if (key === 'Position' && inst.props.CFrame) return push(new THREE.Vector3().setFromMatrixPosition(inst.props.CFrame));
    if (key === 'WorldPosition' && inst.world) return push(new THREE.Vector3().setFromMatrixPosition(inst.world.worldCFrame(inst, tmpM)));
    if (key === 'WorldCFrame' && inst.world) return push(inst.world.worldCFrame(inst, new THREE.Matrix4()));
    return push(inst.props[key]);
  });
  reg('__js_parent', () => {
    const inst = get(num(1));
    if (!inst || inst === world?.workspace || inst === world?.lighting) return 0;
    const pid = num(2);
    inst.setParent(pid ? get(pid) || null : null);
    return 0;
  });
  reg('__js_call', () => {
    const inst = get(num(1));
    const m = str(2);
    if (inst && m === 'Emit') emitParticles(inst, num(3));
    return 0;
  });
  reg('__js_bulk', () => {
    const n = lua.lua_rawlen(S, 1);
    const a = new Array(13);
    for (let i = 1; i <= n; i += 13) {
      for (let k = 0; k < 13; k++) {
        lua.lua_rawgeti(S, 1, i + k);
        a[k] = lua.lua_tonumber(S, -1);
        lua.lua_pop(S, 1);
      }
      const inst = get(a[0]);
      if (!inst) continue;
      inst.props.CFrame = cfToMatrix(a.slice(1));
      if (inst.world && inst.mesh) inst.world.refreshPart(inst, false);
    }
    return 0;
  });
  reg('__js_print', () => {
    onPrint(str(1));
    return 0;
  });

  function run(code, name = 'chunk') {
    if (lauxlib.luaL_loadbuffer(L, to_luastring(code), null, to_luastring(name)) !== lua.LUA_OK) {
      const e = str(-1);
      lua.lua_pop(L, 1);
      throw new Error(e);
    }
    if (lua.lua_pcall(L, 0, 0, 0) !== lua.LUA_OK) {
      const e = str(-1);
      lua.lua_pop(L, 1);
      throw new Error(e);
    }
  }
  run(RUNTIME_LUA, 'Roblox-API');

  let errors = 0;
  return {
    L,
    run,
    get: (id) => get(id),
    setWorld(w) {
      world = w;
    },
    // Globale Lua-Funktion mit Zahlen/Texten aufrufen
    call(fn, ...args) {
      lua.lua_getglobal(L, to_luastring(fn));
      for (const a of args) typeof a === 'number' ? lua.lua_pushnumber(L, a) : typeof a === 'boolean' ? lua.lua_pushboolean(L, a) : pushStr(a);
      if (lua.lua_pcall(L, args.length, 0, 0) !== lua.LUA_OK) {
        const e = str(-1);
        lua.lua_pop(L, 1);
        if (errors++ < 5) console.error('[Luau]', fn, e);
        return false;
      }
      return true;
    },
    // Eigene JS-Funktion für Lua (Argumente als Zahlen oder Texte)
    register(name, fn) {
      reg(name, () => {
        const n = lua.lua_gettop(S), args = [];
        for (let i = 1; i <= n; i++) args.push(lua.lua_type(S, i) === lua.LUA_TNUMBER ? num(i) : str(i));
        fn(...args);
        return 0;
      });
    },
    frame(dt) {
      return this.call('__frame', dt);
    },
    // Kamera für Lua (workspace.CurrentCamera.CFrame), jedes Bild
    setCamera(camera) {
      const e = camera.matrixWorld.elements;
      this.call('__setCam', camera.fov, ...[12, 13, 14, 0, 4, 8, 1, 5, 9, 2, 6, 10].map((k) => e[k]));
    },
  };
}
