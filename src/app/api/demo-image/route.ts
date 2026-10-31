import { NextResponse } from "next/server";

const PALETTES = [
  ["#1f3a5f", "#d9a441"],
  ["#16302b", "#7eb8a3"],
  ["#3b1f2b", "#e07a5f"],
  ["#2a2540", "#c7b8ea"],
  ["#2c2116", "#c4a574"],
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year") ?? "";
  const make = searchParams.get("make") ?? "Vehicle";
  const model = searchParams.get("model") ?? "";
  const angle = searchParams.get("angle") ?? "front";
  const seed = `${year}${make}${model}`.length % PALETTES.length;
  const [bg, accent] = PALETTES[seed];
  const label = [year, make, model].filter(Boolean).join(" ");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="100%" stop-color="#0b1220"/>
    </linearGradient>
    <linearGradient id="car" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#e8e4dc"/>
      <stop offset="100%" stop-color="#9aa3ad"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#g)"/>
  <text x="72" y="78" fill="#f4efe4" font-family="ui-sans-serif, system-ui, sans-serif" font-size="18" letter-spacing="4">CARSXE IMAGES</text>
  <text x="72" y="132" fill="#f4efe4" font-family="ui-sans-serif, system-ui, sans-serif" font-size="40" font-weight="600">${escapeXml(label)}</text>
  <text x="72" y="168" fill="${accent}" font-family="ui-sans-serif, system-ui, sans-serif" font-size="16">${escapeXml(angle.toUpperCase())} · STOCK PHOTO PLACEHOLDER</text>
  <ellipse cx="640" cy="575" rx="380" ry="28" fill="#000" opacity="0.35"/>
  ${angle === "side" ? sideCar() : frontCar()}
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (char) => {
    switch (char) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      default:
        return "&quot;";
    }
  });
}

function frontCar(): string {
  return `
  <path d="M430 430 h420 c30 0 48-18 56-40 l18-52 h-150 l-36-70 h-200 l-40 70 h-140 z" fill="url(#car)"/>
  <rect x="500" y="300" width="280" height="72" rx="10" fill="#c5d0db" opacity="0.85"/>
  <circle cx="520" cy="448" r="36" fill="#1a1a1a"/>
  <circle cx="760" cy="448" r="36" fill="#1a1a1a"/>
  <circle cx="520" cy="448" r="14" fill="#cfcfcf"/>
  <circle cx="760" cy="448" r="14" fill="#cfcfcf"/>`;
}

function sideCar(): string {
  return `
  <path d="M300 430 h680 l-36-78 h-210 l-70-78 h-230 l-70 78 h-64 z" fill="url(#car)"/>
  <rect x="430" y="292" width="190" height="62" rx="8" fill="#c5d0db" opacity="0.85"/>
  <rect x="640" y="300" width="170" height="54" rx="8" fill="#c5d0db" opacity="0.7"/>
  <circle cx="430" cy="448" r="38" fill="#1a1a1a"/>
  <circle cx="860" cy="448" r="38" fill="#1a1a1a"/>
  <circle cx="430" cy="448" r="14" fill="#cfcfcf"/>
  <circle cx="860" cy="448" r="14" fill="#cfcfcf"/>`;
}
