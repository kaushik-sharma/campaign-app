// Generates the app icon, Android adaptive icon layers, splash images and favicon from one vector
// drawing of the Campaigns mark. Run with `npm run icons`. Keep the geometry in sync with
// src/components/ui/logo.tsx.
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

// The Campaigns mark: a message (dot) with two ripples spreading out from it, open on the right so
// the whole shape also reads as a "C".
const INDIGO = '#3341C4';
const INDIGO_NIGHT = '#8F9BFF';
const INDIGO_LIGHT = '#4A58DB';
const INDIGO_DEEP = '#2A36A6';

function arc(cx, cy, r, gapDeg) {
  const half = (gapDeg / 2) * (Math.PI / 180);
  const sx = cx + r * Math.cos(-half);
  const sy = cy + r * Math.sin(-half);
  const ex = cx + r * Math.cos(half);
  const ey = cy + r * Math.sin(half);
  // From the top end of the gap, the long way round through the left, to the bottom end.
  return `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r} ${r} 0 1 0 ${ex.toFixed(2)} ${ey.toFixed(2)}`;
}

/**
 * The glyph alone, drawn in `color` on a `size` canvas, scaled so its outer ring spans `span` of it.
 */
function glyph({ size = 1024, span = 0.58, color = '#FFFFFF' } = {}) {
  // Base geometry (outer ring: radius 304 plus half the stroke).
  const base = { dot: 70, r1: 172, r2: 304, stroke: 72, gap1: 100, gap2: 86 };
  const k = (size * span) / (2 * (base.r2 + base.stroke / 2));
  // The opening on the right makes the shape lighter there; nudge it right to balance it optically.
  const cx = size / 2 + size * 0.025;
  const cy = size / 2;
  const sw = base.stroke * k;
  return `
    <circle cx="${cx}" cy="${cy}" r="${base.dot * k}" fill="${color}"/>
    <path d="${arc(cx, cy, base.r1 * k, base.gap1)}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>
    <path d="${arc(cx, cy, base.r2 * k, base.gap2)}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round"/>`;
}

function svg(size, body, defs = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><defs>${defs}</defs>${body}</svg>`;
}

const gradientDefs = (size) => `
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="${size}" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="${INDIGO_LIGHT}"/>
    <stop offset="1" stop-color="${INDIGO_DEEP}"/>
  </linearGradient>`;

const ROOT = fileURLToPath(new URL('../assets', import.meta.url));
const S = 1024;
const png = (markup, width) => new Resvg(markup, { fitTo: { mode: 'width', value: width } }).render().asPng();
const out = (path, data) => {
  writeFileSync(`${ROOT}/${path}`, data);
  console.log('wrote', path);
};

// 1. Master icon: full-bleed square (the OS applies its own mask). No transparency.
const icon = svg(S, `<rect width="${S}" height="${S}" fill="url(#bg)"/>${glyph({ size: S })}`, gradientDefs(S));
out('images/icon.png', png(icon, 1024));
// App icons must not have an alpha channel. The renderer always writes one, so flatten it (macOS).
if (process.platform === 'darwin') {
  const jpg = `${tmpdir()}/campaigns-icon.jpg`;
  const target = `${ROOT}/images/icon.png`;
  execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '100', target, '--out', jpg], { stdio: 'ignore' });
  execFileSync('sips', ['-s', 'format', 'png', jpg, '--out', target], { stdio: 'ignore' });
  rmSync(jpg);
}

// 2. iOS Icon Composer bundle: system gradient fill in the brand indigo + the white glyph as a layer.
mkdirSync(`${ROOT}/app.icon/Assets`, { recursive: true });
out('app.icon/Assets/mark.svg', svg(S, glyph({ size: S })));
out(
  'app.icon/icon.json',
  JSON.stringify(
    {
      fill: { 'automatic-gradient': 'extended-srgb:0.20000,0.25490,0.76863,1.00000' },
      groups: [
        {
          layers: [{ 'image-name': 'mark.svg', name: 'mark' }],
          shadow: { kind: 'neutral', opacity: 0.5 },
          translucency: { enabled: true, value: 0.5 },
        },
      ],
      'supported-platforms': { squares: 'shared' },
    },
    null,
    2,
  ) + '\n',
);

// 3. Android adaptive icon (108dp canvas; launchers show the middle 72dp, safe zone 66dp).
//    The glyph spans 40% of the canvas, about the same share of the visible icon as on iOS.
const fg = svg(S, glyph({ size: S, span: 0.4 }));
out('images/android-icon-foreground.png', png(fg, 1024));
out('images/android-icon-monochrome.png', png(fg, 1024));
out('images/android-icon-background.png', png(svg(S, `<rect width="${S}" height="${S}" fill="url(#bg)"/>`, gradientDefs(S)), 1024));

// 4. Splash: the mark alone in the accent colour for each theme. Android 12+ shows the splash image
//    inside a circle covering its middle two thirds, so the glyph stays within that.
out('images/splash-icon.png', png(svg(S, glyph({ size: S, span: 0.6, color: INDIGO })), 600));
out('images/splash-icon-dark.png', png(svg(S, glyph({ size: S, span: 0.6, color: INDIGO_NIGHT })), 600));

// 5. Favicon (web): rounded tile.
const tile = svg(
  S,
  `<clipPath id="c"><rect width="${S}" height="${S}" rx="230"/></clipPath><g clip-path="url(#c)"><rect width="${S}" height="${S}" fill="url(#bg)"/>${glyph({ size: S })}</g>`,
  gradientDefs(S),
);
out('images/favicon.png', png(tile, 48));
