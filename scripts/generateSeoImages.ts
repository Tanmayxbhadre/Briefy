/**
 * Generates brand assets referenced by metadata & JSON-LD:
 *  - public/og-image.png  (1200x630, Open Graph / Twitter card)
 *  - public/logo.png      (600x60, Organization JSON-LD)
 *
 * Uses sharp (bundled with Next.js) to rasterize SVG — no extra deps.
 * Run: npm run assets:generate
 */
import sharp from "sharp";

const BG = "#fafaf8";
const TEXT = "#111111";
const ACCENT = "#1a3a8b";
const MUTED = "#555555";

const ogSvg = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="${BG}"/>
  <rect x="0" y="0" width="1200" height="10" fill="${ACCENT}"/>
  <text x="80" y="200" font-family="Georgia, 'Times New Roman', serif" font-size="120" font-weight="700" fill="${TEXT}">Briefy<tspan fill="${ACCENT}">.</tspan><tspan font-family="Verdana, Geneva, sans-serif" font-size="72" font-weight="400">live</tspan></text>
  <text x="84" y="300" font-family="Georgia, 'Times New Roman', serif" font-size="58" fill="${TEXT}">Serious Journalism</text>
  <text x="84" y="380" font-family="Georgia, 'Times New Roman', serif" font-size="58" fill="${TEXT}">for the Modern Reader</text>
  <text x="84" y="500" font-family="Verdana, Geneva, sans-serif" font-size="30" fill="${MUTED}">India · World · Technology · AI · Business · Science</text>
  <rect x="84" y="540" width="220" height="6" fill="${ACCENT}"/>
</svg>`;

const logoSvg = `
<svg width="300" height="60" xmlns="http://www.w3.org/2000/svg">
  <rect width="300" height="60" fill="${BG}"/>
  <rect x="8" y="12" width="36" height="36" fill="${ACCENT}"/>
  <text x="26" y="40" font-family="Georgia, 'Times New Roman', serif" font-size="30" font-weight="700" fill="#ffffff" text-anchor="middle">B</text>
  <text x="52" y="42" font-family="Georgia, 'Times New Roman', serif" font-size="36" font-weight="700" fill="${TEXT}">Briefy<tspan fill="${ACCENT}">.</tspan></text>
  <text x="198" y="42" font-family="Verdana, Geneva, sans-serif" font-size="24" fill="${MUTED}">live</text>
</svg>`;

async function main() {
  await sharp(Buffer.from(ogSvg)).png().toFile("public/og-image.png");
  await sharp(Buffer.from(logoSvg)).png().toFile("public/logo.png");
  console.log("✓ Generated public/og-image.png (1200x630) and public/logo.png (300x60)");
}

main().catch((err) => {
  console.error("Failed to generate SEO images:", err);
  process.exit(1);
});
