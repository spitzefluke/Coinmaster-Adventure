// Roblox-Materialien für die Vorschau. Struktur wird wie in Roblox in Weltkoordinaten gekachelt
// (triplanar), damit große und kleine Teile gleich fein aussehen. Farbe kommt vom Teil.
//
// partMaterial(name, { color, transparency, reflectance, instanced }) → THREE.Material

import * as THREE from 'three';
import { materialTexture, MATERIAL_TILE } from './textures.js';

// Rauheit, Metall, Stärke der Struktur
const LOOK = {
  Plastic: [0.7, 0, 0.25], SmoothPlastic: [0.55, 0, 0], Neon: [1, 0, 0], Glass: [0.05, 0, 0], ForceField: [1, 0, 0],
  Metal: [0.4, 0.55, 0.5], Foil: [0.2, 0.75, 0.6], DiamondPlate: [0.35, 0.6, 0.8],
  Grass: [0.95, 0, 0.9], Slate: [0.85, 0, 0.8], Concrete: [0.9, 0, 0.7], Sand: [0.95, 0, 0.6], Rock: [0.9, 0, 0.8],
  Basalt: [0.85, 0, 0.8], CrackedLava: [0.8, 0, 0.9], Marble: [0.3, 0, 0.6], Snow: [0.9, 0, 0.5], Glacier: [0.25, 0, 0.6],
  Ice: [0.1, 0, 0.4], Wood: [0.75, 0, 0.7], WoodPlanks: [0.75, 0, 0.8], Brick: [0.9, 0, 0.8], Cobblestone: [0.9, 0, 0.9],
  Pebble: [0.85, 0, 0.8], Granite: [0.8, 0, 0.7], Fabric: [0.95, 0, 0.6], Ground: [0.95, 0, 0.75],
};

function triplanar(mat, name) {
  const tex = materialTexture(name);
  const [, , strength] = LOOK[name] || [0, 0, 0];
  if (!tex || !strength) return;
  const tile = MATERIAL_TILE[name] || 6;
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.rbxDetail = { value: tex };
    sh.uniforms.rbxTile = { value: 1 / tile };
    sh.uniforms.rbxStrength = { value: strength };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vRbxPos; varying vec3 vRbxNormal;')
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
        vec4 rbxW = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          rbxW = instanceMatrix * rbxW;
        #endif
        rbxW = modelMatrix * rbxW;
        vRbxPos = rbxW.xyz;
        mat3 rbxN = mat3(modelMatrix);
        #ifdef USE_INSTANCING
          rbxN = rbxN * mat3(instanceMatrix);
        #endif
        vRbxNormal = normalize(rbxN * objectNormal);`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D rbxDetail; uniform float rbxTile; uniform float rbxStrength; varying vec3 vRbxPos; varying vec3 vRbxNormal;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec3 rbxB = pow(abs(normalize(vRbxNormal)), vec3(4.0));
        rbxB /= (rbxB.x + rbxB.y + rbxB.z);
        vec3 rbxP = vRbxPos * rbxTile;
        float rbxD = texture2D(rbxDetail, rbxP.zy).r * rbxB.x + texture2D(rbxDetail, rbxP.xz).r * rbxB.y + texture2D(rbxDetail, rbxP.xy).r * rbxB.z;
        diffuseColor.rgb *= mix(1.0, rbxD * 2.0, rbxStrength);`);
  };
  mat.customProgramCacheKey = () => 'rbx-' + name;
}

// Neon leuchtet: unbeleuchtet und heller als die Grundfarbe (Roblox Future-Licht mit Bloom)
export function neonColor(color) {
  // im sRGB-Raum aufhellen, damit kräftige Farben kräftig bleiben (Roblox-Neon ist satt und hell)
  const s = color.clone().convertLinearToSRGB();
  s.lerp(new THREE.Color(1, 1, 1), 0.08).multiplyScalar(1.12);
  return s.convertSRGBToLinear();
}

const forceFieldVS = `varying vec3 vN; varying vec3 vV; varying vec3 vW;
void main(){ vec4 p = vec4(position, 1.0); vec3 n = normal;
#ifdef USE_INSTANCING
p = instanceMatrix * p; n = mat3(instanceMatrix) * n;
#endif
vec4 w = modelMatrix * p; vW = w.xyz; vN = normalize(mat3(modelMatrix) * n); vV = normalize(cameraPosition - w.xyz);
gl_Position = projectionMatrix * viewMatrix * w; }`;
const forceFieldFS = `uniform vec3 color; uniform float opacity; uniform float time; varying vec3 vN; varying vec3 vV; varying vec3 vW;
void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.0);
float s = 0.5 + 0.5 * sin(vW.y * 3.0 - time * 2.5 + sin(vW.x * 1.7 + vW.z * 1.3) * 2.0);
float a = (0.12 + f * 0.85 + s * 0.12) * opacity; gl_FragColor = vec4(color * (1.2 + s * 0.4), a); }`;
export const FORCEFIELD_TIME = { value: 0 };

export function partMaterial(name, { color = new THREE.Color(0.64, 0.64, 0.65), transparency = 0, reflectance = 0, instanced = false } = {}) {
  const opacity = 1 - transparency;
  if (name === 'Neon') {
    return new THREE.MeshBasicMaterial({ color: instanced ? 0xffffff : neonColor(color), transparent: opacity < 1, opacity, depthWrite: opacity >= 1, toneMapped: false });
  }
  if (name === 'ForceField') {
    return new THREE.ShaderMaterial({
      uniforms: { color: { value: color.clone() }, opacity: { value: Math.max(0.05, opacity) }, time: FORCEFIELD_TIME },
      vertexShader: forceFieldVS, fragmentShader: forceFieldFS, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    });
  }
  const [rough, metal] = LOOK[name] || LOOK.Plastic;
  const glass = name === 'Glass';
  const mat = new THREE.MeshStandardMaterial({
    color: instanced ? 0xffffff : color,
    roughness: Math.max(0.03, rough * (1 - reflectance * 0.8)),
    metalness: Math.max(metal, reflectance * 0.7),
    transparent: opacity < 1 || glass,
    opacity: glass ? Math.min(opacity, 0.92) : opacity,
    depthWrite: opacity >= 1,
    envMapIntensity: 0.8 + reflectance,
  });
  triplanar(mat, name);
  return mat;
}
