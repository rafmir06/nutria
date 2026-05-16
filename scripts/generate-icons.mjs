import sharp from "sharp";
import { mkdir } from "fs/promises";
import { existsSync } from "fs";

await mkdir("public/icons", { recursive: true });

const icon = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1a1a1a"/>
      <stop offset="100%" stop-color="#111111"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#30D158"/>
      <stop offset="100%" stop-color="#0A84FF"/>
    </linearGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#30D158" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#0A84FF" stop-opacity="0.15"/>
    </linearGradient>
    <clipPath id="round">
      <rect width="${size}" height="${size}" rx="${size * 0.22}" ry="${size * 0.22}"/>
    </clipPath>
  </defs>

  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${size * 0.22}" ry="${size * 0.22}" fill="url(#bg)"/>

  <!-- Glow layer -->
  <rect width="${size}" height="${size}" rx="${size * 0.22}" ry="${size * 0.22}" fill="url(#glow)"/>

  <!-- Subtle grid lines for depth -->
  <g clip-path="url(#round)" opacity="0.04">
    ${Array.from({ length: 8 }, (_, i) => `<line x1="${(i + 1) * size / 8}" y1="0" x2="${(i + 1) * size / 8}" y2="${size}" stroke="white" stroke-width="1"/>`).join("")}
    ${Array.from({ length: 8 }, (_, i) => `<line x1="0" y1="${(i + 1) * size / 8}" x2="${size}" y2="${(i + 1) * size / 8}" stroke="white" stroke-width="1"/>`).join("")}
  </g>

  <!-- Accent circle glow top-right -->
  <circle cx="${size * 0.78}" cy="${size * 0.22}" r="${size * 0.28}" fill="#30D158" opacity="0.08"/>
  <!-- Accent circle glow bottom-left -->
  <circle cx="${size * 0.22}" cy="${size * 0.78}" r="${size * 0.22}" fill="#0A84FF" opacity="0.08"/>

  <!-- Leaf / drop shape as nutrition symbol -->
  <g transform="translate(${size * 0.5}, ${size * 0.5})">
    <!-- Outer leaf shape -->
    <path
      d="M 0 ${-size * 0.28}
         C ${size * 0.18} ${-size * 0.28} ${size * 0.28} ${-size * 0.10} ${size * 0.28} ${size * 0.06}
         C ${size * 0.28} ${size * 0.20} ${size * 0.16} ${size * 0.30} 0 ${size * 0.30}
         C ${-size * 0.16} ${size * 0.30} ${-size * 0.28} ${size * 0.20} ${-size * 0.28} ${size * 0.06}
         C ${-size * 0.28} ${-size * 0.10} ${-size * 0.18} ${-size * 0.28} 0 ${-size * 0.28} Z"
      fill="url(#accent)"
      opacity="0.95"
    />
    <!-- Inner vein / N shape -->
    <path
      d="M ${-size * 0.10} ${size * 0.16} L ${-size * 0.10} ${-size * 0.16} L ${size * 0.10} ${size * 0.10} L ${size * 0.10} ${-size * 0.16}"
      stroke="white"
      stroke-width="${size * 0.045}"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
      opacity="0.95"
    />
  </g>

  <!-- Bottom border accent line -->
  <rect x="${size * 0.28}" y="${size * 0.91}" width="${size * 0.44}" height="${size * 0.025}" rx="${size * 0.012}" fill="url(#accent)" opacity="0.6"/>
</svg>`;

const sizes = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
];

for (const { name, size } of sizes) {
  await sharp(Buffer.from(icon(size)))
    .png()
    .toFile(`public/icons/${name}`);
  console.log(`✓ public/icons/${name}`);
}

console.log("Icons generated!");
