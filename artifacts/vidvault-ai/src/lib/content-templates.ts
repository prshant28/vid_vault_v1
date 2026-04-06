import type { ExportData } from "./html-templates";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

const TYPE_LABELS: Record<string, string> = {
  summary: "Summary", key_insights: "Key Insights", notes: "Study Notes",
  ppt_outline: "Presentation Outline", flashcards: "Flashcards",
  blog_article: "Blog Article", action_plan: "Action Plan",
  vocabulary: "Vocabulary", executive_brief: "Executive Brief",
  tweet_thread: "Tweet Thread",
};

const PRINT_JS = `<script>function doPrint(){window.print()}</script>`;

const PRINT_BTN = (color: string, bg: string) =>
  `<div class="print-bar"><button onclick="doPrint()" style="background:${bg};color:${color};border:1px solid ${color}40;font-family:inherit;font-size:0.72rem;letter-spacing:0.12em;text-transform:uppercase;padding:8px 20px;cursor:pointer;border-radius:3px;">↓ Print / Save PDF</button></div>`;

function html(opts: {
  lang?: string;
  fonts: string;
  css: string;
  topBar: string;
  headerClass: string;
  eyebrow: string;
  h1: string;
  meta: string;
  content: string;
  footer: string;
  printBtn: string;
  printBarCss: string;
  title: string;
}): string {
  return `<!DOCTYPE html>
<html lang="${opts.lang || "en"}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${opts.title}</title>
${opts.fonts}
<style>
*{box-sizing:border-box;margin:0;padding:0}
${opts.css}
.print-bar{text-align:center;padding:20px 0 30px;${opts.printBarCss}}
@media print{.print-bar{display:none}.page{margin:0;box-shadow:none;width:100%;min-height:100vh}}
</style>
${PRINT_JS}
</head>
<body>
<div class="page">
  <div class="${opts.headerClass}">
    <div class="eyebrow">${opts.eyebrow}</div>
    <h1>${opts.h1}</h1>
    <div class="meta">${opts.meta}</div>
  </div>
  ${opts.topBar}
  <div class="content">${opts.content}</div>
  <div class="footer">${opts.footer}</div>
</div>
${opts.printBtn}
</body>
</html>`;
}

/* ══════════════════════════════════════════════════════════════════
   1. Dark Academic
══════════════════════════════════════════════════════════════════ */
function template1(d: ExportData): string {
  const label = TYPE_LABELS[d.type] || d.type;
  return html({
    title: `${esc(d.videoTitle)} — ${label}`,
    fonts: `<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=IBM+Plex+Mono:wght@400;600&family=Figtree:wght@300;400;500;600&display=swap" rel="stylesheet">`,
    css: `
body{font-family:'Figtree',sans-serif;background:#1a1814;color:#e8e4d8;min-height:100vh}
.page{max-width:800px;min-height:100vh;margin:0 auto;background:#131210;padding:3rem 2.5rem;box-shadow:0 0 80px rgba(0,0,0,0.6);position:relative}
.page::before{content:'';position:absolute;top:0;left:0;right:0;height:4px;background:repeating-linear-gradient(90deg,#c0392b 0,#c0392b 25%,#1a3a5c 25%,#1a3a5c 50%,#1e6b4a 50%,#1e6b4a 75%,#b8860b 75%,#b8860b 100%)}
.doc-header{border-bottom:2px solid #2a2520;padding-bottom:1.5rem;margin-bottom:2rem;margin-top:0.5rem}
.eyebrow{font-family:'IBM Plex Mono',monospace;font-size:0.65rem;letter-spacing:0.3em;text-transform:uppercase;color:#6b6456;margin-bottom:0.75rem}
h1{font-family:'DM Serif Display',serif;font-size:2rem;color:#f0ece0;line-height:1.1}
h1 em{color:#c0392b;font-style:italic}
.meta{font-family:'IBM Plex Mono',monospace;font-size:0.7rem;color:#6b6456;margin-top:0.5rem}
.content{font-size:0.975rem;line-height:1.78;color:#c9c0b4}
.content h1,.content h2,.content h3{font-family:'DM Serif Display',serif;color:#f0ece0;margin:1.5rem 0 0.6rem}
.content h1{font-size:1.5rem}.content h2{font-size:1.25rem}.content h3{font-size:1.05rem}
.content p{margin-bottom:0.9rem}
.content ul,.content ol{padding-left:1.5em;margin-bottom:0.9rem}
.content li{margin-bottom:0.3rem}
.content strong{color:#e8e4d8;font-weight:700}
.content em{color:#c0392b;font-style:italic}
.content code{font-family:'IBM Plex Mono',monospace;font-size:0.8rem;background:#1a1814;padding:2px 6px;border-radius:2px;color:#b8860b}
.content blockquote{border-left:3px solid #b8860b;padding:10px 14px;margin:1rem 0;color:#9a8a76;font-style:italic;background:#1a1814}
.content hr{border:none;border-top:1px solid #2a2520;margin:1.5rem 0}
.footer{margin-top:2.5rem;padding-top:1rem;border-top:1px solid #2a2520;font-family:'IBM Plex Mono',monospace;font-size:0.65rem;color:#4a4035;display:flex;justify-content:space-between}
`,
    topBar: "",
    headerClass: "doc-header",
    eyebrow: `VidVault AI · ${label}`,
    h1: `${esc(d.videoTitle)} <em>${label}</em>`,
    meta: `${d.channelName ? esc(d.channelName) + " · " : ""}${d.generatedAt}`,
    content: d.contentHtml,
    footer: `<span>VidVault AI — ${label}</span><span>${d.generatedAt}</span>`,
    printBtn: PRINT_BTN("#b8860b", "#1a1814"),
    printBarCss: "background:#131210;",
  });
}

/* ══════════════════════════════════════════════════════════════════
   2. Neon Cyberpunk
══════════════════════════════════════════════════════════════════ */
function template2(d: ExportData): string {
  const label = TYPE_LABELS[d.type] || d.type;
  return html({
    title: `${esc(d.videoTitle)} — ${label}`,
    fonts: `<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Share+Tech+Mono&family=Exo+2:wght@300;400;500&display=swap" rel="stylesheet">`,
    css: `
body{font-family:'Exo 2',sans-serif;background:#050510;color:#e0e0ff;min-height:100vh}
body::before{content:'';position:fixed;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,255,255,0.012) 2px,rgba(0,255,255,0.012) 4px);pointer-events:none}
.page{max-width:800px;margin:0 auto;background:#080818;padding:3rem 2.5rem;box-shadow:0 0 60px rgba(0,255,255,0.06);position:relative;min-height:100vh}
.page::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#00ffff,#7b2fff,transparent)}
.doc-header{border-bottom:1px solid #00ffff22;padding-bottom:1.5rem;margin-bottom:2rem;margin-top:0.5rem}
.eyebrow{font-family:'Share Tech Mono',monospace;font-size:0.6rem;letter-spacing:0.4em;text-transform:uppercase;color:#00ffff66;margin-bottom:0.75rem}
h1{font-family:'Orbitron',monospace;font-size:1.7rem;color:#fff;line-height:1.15;text-shadow:0 0 20px rgba(0,255,255,0.3)}
h1 em{color:#00ffff;font-style:normal}
.meta{font-family:'Share Tech Mono',monospace;font-size:0.65rem;color:#4455aa;margin-top:0.5rem}
.content{font-size:0.95rem;line-height:1.75;color:#c0c0e8}
.content h1,.content h2,.content h3{font-family:'Orbitron',monospace;margin:1.5rem 0 0.6rem;text-shadow:0 0 10px rgba(0,255,255,0.2)}
.content h1{font-size:1.3rem;color:#00ffff}.content h2{font-size:1.1rem;color:#7b2fff}.content h3{font-size:0.95rem;color:#00ffff88}
.content p{margin-bottom:0.9rem}
.content ul,.content ol{padding-left:1.5em;margin-bottom:0.9rem}
.content li{margin-bottom:0.3rem}
.content strong{color:#e0e0ff;font-weight:600}
.content em{color:#00ffff;font-style:normal}
.content code{font-family:'Share Tech Mono',monospace;font-size:0.8rem;background:#0a0a2e;padding:2px 6px;border:1px solid #00ffff22;color:#00ffff}
.content blockquote{border-left:2px solid #f0c040;padding:10px 14px;margin:1rem 0;color:#a090cc;background:#0a0a2e}
.content hr{border:none;border-top:1px solid #1a1a50;margin:1.5rem 0}
.footer{margin-top:2.5rem;padding-top:1rem;border-top:1px solid #1a1a50;font-family:'Share Tech Mono',monospace;font-size:0.6rem;color:#334488;display:flex;justify-content:space-between}
`,
    topBar: "",
    headerClass: "doc-header",
    eyebrow: `[ VIDVAULT_AI :: ${label.toUpperCase().replace(/ /g, "_")} ]`,
    h1: `${esc(d.videoTitle)} <em>// ${label}</em>`,
    meta: `SRC: ${d.channelName ? esc(d.channelName) + " · " : ""}TIMESTAMP: ${d.generatedAt}`,
    content: d.contentHtml,
    footer: `<span>VIDVAULT_AI · ${label.toUpperCase()}</span><span>${d.generatedAt}</span>`,
    printBtn: PRINT_BTN("#00ffff", "#080818"),
    printBarCss: "background:#080818;",
  });
}

/* ══════════════════════════════════════════════════════════════════
   3. Paper & Ink
══════════════════════════════════════════════════════════════════ */
function template3(d: ExportData): string {
  const label = TYPE_LABELS[d.type] || d.type;
  return html({
    title: `${esc(d.videoTitle)} — ${label}`,
    fonts: `<link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Source+Code+Pro:wght@400;600&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">`,
    css: `
body{font-family:'Inter',sans-serif;background:#ddd8cc;min-height:100vh;padding:2rem 0}
.page{max-width:800px;margin:0 auto;background:#faf8f3;padding:3rem 2.5rem;box-shadow:0 8px 48px rgba(0,0,0,0.2);position:relative}
.page::before{content:'';position:absolute;left:3.5rem;top:0;bottom:0;width:1px;background:#e5ddd0}
.doc-header{border-bottom:2px solid #1a1814;padding-bottom:1.25rem;margin-bottom:2rem}
.eyebrow{font-family:'Source Code Pro',monospace;font-size:0.62rem;letter-spacing:0.25em;text-transform:uppercase;color:#8a7a6a;margin-bottom:0.75rem}
h1{font-family:'Lora',serif;font-size:2rem;color:#1a1814;line-height:1.15}
h1 em{color:#c0392b;font-style:italic}
.meta{font-family:'Source Code Pro',monospace;font-size:0.7rem;color:#8a7a6a;margin-top:0.5rem}
.content{font-size:1rem;line-height:1.8;color:#2a2520}
.content h1,.content h2,.content h3{font-family:'Lora',serif;color:#1a1814;margin:1.5rem 0 0.6rem}
.content h1{font-size:1.5rem}.content h2{font-size:1.25rem}.content h3{font-size:1.05rem}
.content p{margin-bottom:0.9rem}
.content ul,.content ol{padding-left:1.5em;margin-bottom:0.9rem}
.content li{margin-bottom:0.3rem;font-family:'Lora',serif}
.content strong{font-weight:700;color:#1a1814}
.content em{color:#c0392b;font-style:italic}
.content code{font-family:'Source Code Pro',monospace;font-size:0.8rem;background:#f0ece0;padding:2px 6px;border-radius:2px}
.content blockquote{border-left:3px solid #b8860b;padding:10px 14px;margin:1rem 0;color:#5a5040;font-style:italic;background:#fff9e6}
.content hr{border:none;border-top:1px solid #ddd8cc;margin:1.5rem 0}
.footer{margin-top:2.5rem;padding-top:1rem;border-top:1px solid #ddd8cc;font-family:'Source Code Pro',monospace;font-size:0.65rem;color:#a09080;display:flex;justify-content:space-between}
`,
    topBar: "",
    headerClass: "doc-header",
    eyebrow: `VidVault AI — ${label}`,
    h1: `${esc(d.videoTitle)} <em>${label}</em>`,
    meta: `${d.channelName ? esc(d.channelName) + " · " : ""}${d.generatedAt}`,
    content: d.contentHtml,
    footer: `<span>VidVault AI — ${label}</span><span>${d.generatedAt}</span>`,
    printBtn: PRINT_BTN("#1a1814", "#faf8f3"),
    printBarCss: "background:#ddd8cc;",
  });
}

/* ══════════════════════════════════════════════════════════════════
   4. VidVault Dark (app theme)
══════════════════════════════════════════════════════════════════ */
function template4(d: ExportData): string {
  const label = TYPE_LABELS[d.type] || d.type;
  return html({
    title: `${esc(d.videoTitle)} — ${label}`,
    fonts: `<link href="https://fonts.googleapis.com/css2?family=Alegreya+Sans+SC:wght@800;900&family=JetBrains+Mono:wght@400;600&family=Raleway:wght@400;500;700&display=swap" rel="stylesheet">`,
    css: `
body{font-family:'Raleway',sans-serif;background:#09090c;color:#d0d0e0;min-height:100vh}
body::before{content:'';position:fixed;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(255,255,255,0.02) 39px,rgba(255,255,255,0.02) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(255,255,255,0.02) 39px,rgba(255,255,255,0.02) 40px);pointer-events:none}
.page{max-width:800px;margin:0 auto;background:#0d0d11;padding:3rem 2.5rem;position:relative;min-height:100vh}
.page::before{content:'';position:absolute;top:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#8b5cf6,#ec4899,#8b5cf6)}
.doc-header{border-bottom:1px solid rgba(255,255,255,0.07);padding-bottom:1.5rem;margin-bottom:2rem;border-left:4px solid #8b5cf6;padding-left:1.25rem}
.eyebrow{font-family:'JetBrains Mono',monospace;font-size:0.6rem;letter-spacing:0.3em;text-transform:uppercase;color:#444466;margin-bottom:0.75rem}
h1{font-family:'Alegreya Sans SC',serif;font-size:2rem;color:#fff;line-height:1.1;letter-spacing:-0.01em}
h1 em{color:#8b5cf6;font-style:italic}
.meta{font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:#444466;margin-top:0.5rem}
.content{font-size:0.975rem;line-height:1.78;color:#b0b0cc}
.content h1,.content h2,.content h3{font-family:'Alegreya Sans SC',serif;margin:1.5rem 0 0.6rem;letter-spacing:-0.01em}
.content h1{font-size:1.5rem;color:#8b5cf6}.content h2{font-size:1.25rem;color:#a78bfa}.content h3{font-size:1.05rem;color:#c4b5fd}
.content p{margin-bottom:0.9rem}
.content ul,.content ol{padding-left:1.5em;margin-bottom:0.9rem}
.content li{margin-bottom:0.3rem}
.content strong{color:#e0e0f0;font-weight:700}
.content em{color:#ec4899;font-style:italic}
.content code{font-family:'JetBrains Mono',monospace;font-size:0.78rem;background:#111115;padding:2px 6px;border:1px solid rgba(255,255,255,0.06);color:#8b5cf6}
.content blockquote{border-left:3px solid #f59e0b;padding:10px 14px;margin:1rem 0;color:#888899;background:#111115}
.content hr{border:none;border-top:1px solid rgba(255,255,255,0.06);margin:1.5rem 0}
.footer{margin-top:2.5rem;padding-top:1rem;border-top:1px solid rgba(255,255,255,0.06);font-family:'JetBrains Mono',monospace;font-size:0.6rem;color:#333344;display:flex;justify-content:space-between}
`,
    topBar: "",
    headerClass: "doc-header",
    eyebrow: `// VIDVAULT_AI · ${label.toUpperCase().replace(/ /g, "_")}`,
    h1: `${esc(d.videoTitle)} <em>${label}</em>`,
    meta: `${d.channelName ? esc(d.channelName) + " · " : ""}${d.generatedAt}`,
    content: d.contentHtml,
    footer: `<span>VidVault AI · ${label}</span><span>${d.generatedAt}</span>`,
    printBtn: PRINT_BTN("#8b5cf6", "#0d0d11"),
    printBarCss: "background:#09090c;",
  });
}

/* ══════════════════════════════════════════════════════════════════
   5. Ocean Depths
══════════════════════════════════════════════════════════════════ */
function template5(d: ExportData): string {
  const label = TYPE_LABELS[d.type] || d.type;
  return html({
    title: `${esc(d.videoTitle)} — ${label}`,
    fonts: `<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Fira+Code:wght@400;500&family=Nunito:wght@300;400;600;700&display=swap" rel="stylesheet">`,
    css: `
body{font-family:'Nunito',sans-serif;background:linear-gradient(150deg,#0a1628,#0d2545);min-height:100vh;padding:2rem 0;color:#b8d4f0}
.page{max-width:800px;margin:0 auto;background:rgba(255,255,255,0.04);backdrop-filter:blur(20px);padding:3rem 2.5rem;border:1px solid rgba(100,180,255,0.12);border-top:3px solid #4aa8ff;min-height:100vh}
.doc-header{border-bottom:1px solid rgba(100,180,255,0.15);padding-bottom:1.5rem;margin-bottom:2rem}
.eyebrow{font-family:'Fira Code',monospace;font-size:0.62rem;letter-spacing:0.3em;text-transform:uppercase;color:#4a8abf66;margin-bottom:0.75rem}
h1{font-family:'Playfair Display',serif;font-size:2rem;color:#e8f4ff;line-height:1.15}
h1 em{color:#4aa8ff;font-style:italic}
.meta{font-family:'Fira Code',monospace;font-size:0.65rem;color:#4a8abf66;margin-top:0.5rem}
.content{font-size:0.975rem;line-height:1.78;color:#99b8d8}
.content h1,.content h2,.content h3{font-family:'Playfair Display',serif;margin:1.5rem 0 0.6rem}
.content h1{font-size:1.5rem;color:#4aa8ff}.content h2{font-size:1.25rem;color:#60b8ff}.content h3{font-size:1.05rem;color:#80c8ff}
.content p{margin-bottom:0.9rem}
.content ul,.content ol{padding-left:1.5em;margin-bottom:0.9rem}
.content li{margin-bottom:0.3rem}
.content strong{color:#d0e8ff;font-weight:700}
.content em{color:#4aa8ff;font-style:italic}
.content code{font-family:'Fira Code',monospace;font-size:0.78rem;background:rgba(74,168,255,0.08);padding:2px 6px;border:1px solid rgba(74,168,255,0.2);color:#4aa8ff}
.content blockquote{border-left:3px solid #f59e0b;padding:10px 14px;margin:1rem 0;color:#8090a8;background:rgba(255,255,255,0.03)}
.content hr{border:none;border-top:1px solid rgba(100,180,255,0.12);margin:1.5rem 0}
.footer{margin-top:2.5rem;padding-top:1rem;border-top:1px solid rgba(100,180,255,0.12);font-family:'Fira Code',monospace;font-size:0.62rem;color:#2a5a8a;display:flex;justify-content:space-between}
`,
    topBar: "",
    headerClass: "doc-header",
    eyebrow: `VidVault AI · ${label}`,
    h1: `${esc(d.videoTitle)} <em>${label}</em>`,
    meta: `${d.channelName ? esc(d.channelName) + " · " : ""}${d.generatedAt}`,
    content: d.contentHtml,
    footer: `<span>VidVault AI — ${label}</span><span>${d.generatedAt}</span>`,
    printBtn: PRINT_BTN("#4aa8ff", "rgba(255,255,255,0.04)"),
    printBarCss: "background:transparent;",
  });
}

/* ══════════════════════════════════════════════════════════════════
   6. Emerald Forest
══════════════════════════════════════════════════════════════════ */
function template6(d: ExportData): string {
  const label = TYPE_LABELS[d.type] || d.type;
  return html({
    title: `${esc(d.videoTitle)} — ${label}`,
    fonts: `<link href="https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,400;0,700;0,900;1,400&family=Roboto+Mono:wght@400;500&family=Nunito:wght@300;400;600&display=swap" rel="stylesheet">`,
    css: `
body{font-family:'Nunito',sans-serif;background:#0a1a0f;min-height:100vh;padding:2rem 0;color:#a8c8a8}
.page{max-width:800px;margin:0 auto;background:#0f2015;padding:3rem 2.5rem;border-left:4px solid #2d6a4f;min-height:100vh;position:relative}
.page::after{content:'';position:absolute;top:0;right:0;bottom:0;width:1px;background:linear-gradient(180deg,transparent,#2d6a4f44,transparent)}
.doc-header{border-bottom:1px solid #1a3a22;padding-bottom:1.5rem;margin-bottom:2rem}
.eyebrow{font-family:'Roboto Mono',monospace;font-size:0.62rem;letter-spacing:0.3em;text-transform:uppercase;color:#2d6a4f;margin-bottom:0.75rem}
h1{font-family:'Merriweather',serif;font-size:1.75rem;color:#d0f0d0;line-height:1.2}
h1 em{color:#52b788;font-style:italic}
.meta{font-family:'Roboto Mono',monospace;font-size:0.65rem;color:#2d6a4f;margin-top:0.5rem}
.content{font-size:0.975rem;line-height:1.8;color:#8aaa8a}
.content h1,.content h2,.content h3{font-family:'Merriweather',serif;margin:1.5rem 0 0.6rem}
.content h1{font-size:1.4rem;color:#52b788}.content h2{font-size:1.2rem;color:#40a070}.content h3{font-size:1rem;color:#2d8a60}
.content p{margin-bottom:0.9rem}
.content ul,.content ol{padding-left:1.5em;margin-bottom:0.9rem}
.content li{margin-bottom:0.3rem}
.content strong{color:#c0e8c0;font-weight:700}
.content em{color:#52b788;font-style:italic}
.content code{font-family:'Roboto Mono',monospace;font-size:0.78rem;background:#0a1a0f;padding:2px 6px;border:1px solid #1a3a22;color:#52b788}
.content blockquote{border-left:3px solid #b8860b;padding:10px 14px;margin:1rem 0;color:#6a8a6a;background:#0a1a0f}
.content hr{border:none;border-top:1px solid #1a3a22;margin:1.5rem 0}
.footer{margin-top:2.5rem;padding-top:1rem;border-top:1px solid #1a3a22;font-family:'Roboto Mono',monospace;font-size:0.62rem;color:#1a4a28;display:flex;justify-content:space-between}
`,
    topBar: "",
    headerClass: "doc-header",
    eyebrow: `VidVault AI · ${label}`,
    h1: `${esc(d.videoTitle)} <em>${label}</em>`,
    meta: `${d.channelName ? esc(d.channelName) + " · " : ""}${d.generatedAt}`,
    content: d.contentHtml,
    footer: `<span>VidVault AI — ${label}</span><span>${d.generatedAt}</span>`,
    printBtn: PRINT_BTN("#52b788", "#0f2015"),
    printBarCss: "background:#0a1a0f;",
  });
}

/* ══════════════════════════════════════════════════════════════════
   7. Sunrise Warm
══════════════════════════════════════════════════════════════════ */
function template7(d: ExportData): string {
  const label = TYPE_LABELS[d.type] || d.type;
  return html({
    title: `${esc(d.videoTitle)} — ${label}`,
    fonts: `<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,600;0,700;0,900;1,600&family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Lato:wght@300;400;700&display=swap" rel="stylesheet">`,
    css: `
body{font-family:'Lato',sans-serif;background:linear-gradient(150deg,#fff8e7,#ffecc0);min-height:100vh;padding:2rem 0;color:#3a2a18}
.page{max-width:800px;margin:0 auto;background:#fffbf2;padding:3rem 2.5rem;box-shadow:0 8px 48px rgba(100,60,0,0.15);position:relative;min-height:100vh}
.page::before{content:'';position:absolute;top:0;left:0;right:0;height:6px;background:linear-gradient(90deg,#f59e0b,#ec4899,#f97316)}
.doc-header{border-bottom:2px solid #e8d8b0;padding-bottom:1.5rem;margin-bottom:2rem}
.eyebrow{font-family:'Courier Prime',monospace;font-size:0.65rem;letter-spacing:0.25em;text-transform:uppercase;color:#a08040;margin-bottom:0.75rem}
h1{font-family:'Fraunces',serif;font-size:2.2rem;color:#2a1a08;line-height:1.1}
h1 em{color:#f59e0b;font-style:italic}
.meta{font-family:'Courier Prime',monospace;font-size:0.7rem;color:#a08040;margin-top:0.5rem}
.content{font-size:1rem;line-height:1.78;color:#4a3820}
.content h1,.content h2,.content h3{font-family:'Fraunces',serif;margin:1.5rem 0 0.6rem;color:#2a1a08}
.content h1{font-size:1.5rem}.content h2{font-size:1.25rem}.content h3{font-size:1.05rem}
.content p{margin-bottom:0.9rem}
.content ul,.content ol{padding-left:1.5em;margin-bottom:0.9rem}
.content li{margin-bottom:0.3rem}
.content strong{font-weight:700;color:#2a1a08}
.content em{color:#f59e0b;font-style:italic}
.content code{font-family:'Courier Prime',monospace;font-size:0.82rem;background:#fff3c0;padding:2px 6px;border-radius:2px;color:#8a5a00}
.content blockquote{border-left:3px solid #ec4899;padding:10px 14px;margin:1rem 0;color:#6a4a28;font-style:italic;background:#fff8f0}
.content hr{border:none;border-top:1px solid #e8d8b0;margin:1.5rem 0}
.footer{margin-top:2.5rem;padding-top:1rem;border-top:1px solid #e8d8b0;font-family:'Courier Prime',monospace;font-size:0.65rem;color:#c0a060;display:flex;justify-content:space-between}
`,
    topBar: "",
    headerClass: "doc-header",
    eyebrow: `VidVault AI · ${label}`,
    h1: `${esc(d.videoTitle)} <em>${label}</em>`,
    meta: `${d.channelName ? esc(d.channelName) + " · " : ""}${d.generatedAt}`,
    content: d.contentHtml,
    footer: `<span>VidVault AI — ${label}</span><span>${d.generatedAt}</span>`,
    printBtn: PRINT_BTN("#f59e0b", "#fffbf2"),
    printBarCss: "background:#fff8e7;",
  });
}

/* ══════════════════════════════════════════════════════════════════
   8. Bauhaus Minimal
══════════════════════════════════════════════════════════════════ */
function template8(d: ExportData): string {
  const label = TYPE_LABELS[d.type] || d.type;
  return html({
    title: `${esc(d.videoTitle)} — ${label}`,
    fonts: `<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">`,
    css: `
body{font-family:'Space Grotesk',sans-serif;background:#f5f5f5;min-height:100vh;padding:2rem 0;color:#1a1a1a}
.page{max-width:800px;margin:0 auto;background:#fff;padding:3rem 2.5rem;box-shadow:0 2px 24px rgba(0,0,0,0.08);position:relative;min-height:100vh}
.page::before{content:'';position:absolute;top:0;left:0;right:0;height:8px;background:#1a1a1a}
.doc-header{border-bottom:3px solid #1a1a1a;padding-bottom:1.5rem;margin-bottom:2rem}
.eyebrow{font-family:'Space Mono',monospace;font-size:0.6rem;letter-spacing:0.3em;text-transform:uppercase;color:#999;margin-bottom:0.75rem}
h1{font-family:'Space Grotesk',sans-serif;font-size:2rem;color:#1a1a1a;line-height:1.1;font-weight:700}
h1 em{color:#e63946;font-style:normal;font-weight:400}
.meta{font-family:'Space Mono',monospace;font-size:0.65rem;color:#999;margin-top:0.5rem}
.content{font-size:1rem;line-height:1.7;color:#333}
.content h1,.content h2,.content h3{font-family:'Space Grotesk',sans-serif;margin:1.5rem 0 0.6rem;font-weight:700}
.content h1{font-size:1.4rem;border-bottom:2px solid #1a1a1a;padding-bottom:0.3rem}.content h2{font-size:1.2rem}.content h3{font-size:1rem;color:#666}
.content p{margin-bottom:0.9rem}
.content ul,.content ol{padding-left:1.5em;margin-bottom:0.9rem}
.content li{margin-bottom:0.3rem}
.content strong{font-weight:700}
.content em{font-style:normal;color:#e63946;font-weight:500}
.content code{font-family:'Space Mono',monospace;font-size:0.78rem;background:#f5f5f5;padding:2px 6px;border:1px solid #ddd}
.content blockquote{border-left:4px solid #1a1a1a;padding:10px 14px;margin:1rem 0;color:#666;background:#f9f9f9}
.content hr{border:none;border-top:2px solid #1a1a1a;margin:1.5rem 0}
.footer{margin-top:2.5rem;padding-top:1rem;border-top:2px solid #1a1a1a;font-family:'Space Mono',monospace;font-size:0.62rem;color:#999;display:flex;justify-content:space-between}
`,
    topBar: "",
    headerClass: "doc-header",
    eyebrow: `VidVault AI / ${label}`,
    h1: `${esc(d.videoTitle)} <em>${label}</em>`,
    meta: `${d.channelName ? esc(d.channelName) + " · " : ""}${d.generatedAt}`,
    content: d.contentHtml,
    footer: `<span>VidVault AI · ${label}</span><span>${d.generatedAt}</span>`,
    printBtn: PRINT_BTN("#fff", "#1a1a1a"),
    printBarCss: "background:#f5f5f5;",
  });
}

/* ══════════════════════════════════════════════════════════════════
   9. Purple Galaxy
══════════════════════════════════════════════════════════════════ */
function template9(d: ExportData): string {
  const label = TYPE_LABELS[d.type] || d.type;
  return html({
    title: `${esc(d.videoTitle)} — ${label}`,
    fonts: `<link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&family=Rajdhani:wght@400;500;700&family=Cousine:wght@400;700&display=swap" rel="stylesheet">`,
    css: `
body{font-family:'Rajdhani',sans-serif;background:radial-gradient(ellipse at 20% 50%,#1a0a2e,#0a0514);min-height:100vh;padding:2rem 0;color:#c8b0f8}
body::before{content:'';position:fixed;inset:0;background-image:radial-gradient(circle,rgba(139,92,246,0.04) 1px,transparent 1px);background-size:24px 24px;pointer-events:none}
.page{max-width:800px;margin:0 auto;background:rgba(139,92,246,0.04);padding:3rem 2.5rem;border:1px solid rgba(139,92,246,0.2);position:relative;min-height:100vh;backdrop-filter:blur(20px)}
.page::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#7c3aed,#a78bfa,#ec4899,#a78bfa,#7c3aed)}
.doc-header{border-bottom:1px solid rgba(139,92,246,0.25);padding-bottom:1.5rem;margin-bottom:2rem}
.eyebrow{font-family:'Cousine',monospace;font-size:0.6rem;letter-spacing:0.35em;text-transform:uppercase;color:#7c3aed88;margin-bottom:0.75rem}
h1{font-family:'Cinzel Decorative',serif;font-size:1.5rem;color:#f0e8ff;line-height:1.2;letter-spacing:0.02em}
h1 em{color:#a78bfa;font-style:normal}
.meta{font-family:'Cousine',monospace;font-size:0.62rem;color:#7c3aed88;margin-top:0.5rem}
.content{font-size:1rem;line-height:1.78;color:#b0a0d8;font-size:0.95rem}
.content h1,.content h2,.content h3{font-family:'Cinzel Decorative',serif;margin:1.5rem 0 0.6rem}
.content h1{font-size:1.2rem;color:#a78bfa}.content h2{font-size:1.05rem;color:#c4b5fd}.content h3{font-size:0.95rem;color:#ddd6fe}
.content p{margin-bottom:0.9rem}
.content ul,.content ol{padding-left:1.5em;margin-bottom:0.9rem}
.content li{margin-bottom:0.3rem}
.content strong{color:#e8e0ff;font-weight:700}
.content em{color:#ec4899;font-style:italic}
.content code{font-family:'Cousine',monospace;font-size:0.78rem;background:rgba(139,92,246,0.1);padding:2px 6px;border:1px solid rgba(139,92,246,0.3);color:#a78bfa}
.content blockquote{border-left:3px solid #ec4899;padding:10px 14px;margin:1rem 0;color:#8878a8;background:rgba(139,92,246,0.05)}
.content hr{border:none;border-top:1px solid rgba(139,92,246,0.2);margin:1.5rem 0}
.footer{margin-top:2.5rem;padding-top:1rem;border-top:1px solid rgba(139,92,246,0.2);font-family:'Cousine',monospace;font-size:0.6rem;color:#5a2aad66;display:flex;justify-content:space-between}
`,
    topBar: "",
    headerClass: "doc-header",
    eyebrow: `✦ VidVault AI · ${label} ✦`,
    h1: `${esc(d.videoTitle)} <em>${label}</em>`,
    meta: `${d.channelName ? esc(d.channelName) + " · " : ""}${d.generatedAt}`,
    content: d.contentHtml,
    footer: `<span>VidVault AI · ${label}</span><span>${d.generatedAt}</span>`,
    printBtn: PRINT_BTN("#a78bfa", "rgba(139,92,246,0.08)"),
    printBarCss: "background:transparent;",
  });
}

/* ══════════════════════════════════════════════════════════════════
   10. Corporate Pro
══════════════════════════════════════════════════════════════════ */
function template10(d: ExportData): string {
  const label = TYPE_LABELS[d.type] || d.type;
  return html({
    title: `${esc(d.videoTitle)} — ${label}`,
    fonts: `<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=Roboto+Mono:wght@400;500&family=Open+Sans:ital,wght@0,300;0,400;0,600;1,300&display=swap" rel="stylesheet">`,
    css: `
body{font-family:'Open Sans',sans-serif;background:#f2f5f9;min-height:100vh;padding:2rem 0;color:#24293e}
.page{max-width:800px;margin:0 auto;background:#fff;padding:0 0 3rem;box-shadow:0 4px 32px rgba(0,0,0,0.1);min-height:100vh}
.page-top{background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:2.5rem 2.5rem 2rem}
.page-body{padding:2rem 2.5rem 0}
.eyebrow{font-family:'Roboto Mono',monospace;font-size:0.6rem;letter-spacing:0.3em;text-transform:uppercase;color:rgba(255,255,255,0.55);margin-bottom:0.75rem}
h1{font-family:'Montserrat',sans-serif;font-size:1.75rem;color:#fff;line-height:1.15;font-weight:800}
h1 em{color:#60a5fa;font-style:normal;font-weight:600}
.meta{font-family:'Roboto Mono',monospace;font-size:0.65rem;color:rgba(255,255,255,0.5);margin-top:0.5rem}
.divider{height:4px;background:linear-gradient(90deg,#60a5fa,#a78bfa);margin:0 0 2rem}
.content{font-size:0.975rem;line-height:1.78;color:#374151}
.content h1,.content h2,.content h3{font-family:'Montserrat',sans-serif;margin:1.5rem 0 0.6rem;font-weight:700}
.content h1{font-size:1.3rem;color:#1e3a5f;border-bottom:2px solid #e5e7eb;padding-bottom:0.5rem}.content h2{font-size:1.15rem;color:#2563eb}.content h3{font-size:1rem;color:#374151}
.content p{margin-bottom:0.9rem}
.content ul,.content ol{padding-left:1.5em;margin-bottom:0.9rem}
.content li{margin-bottom:0.4rem}
.content strong{font-weight:700;color:#1e3a5f}
.content em{color:#2563eb;font-style:italic}
.content code{font-family:'Roboto Mono',monospace;font-size:0.78rem;background:#eff6ff;padding:2px 7px;border:1px solid #bfdbfe;color:#1e40af}
.content blockquote{border-left:4px solid #2563eb;padding:10px 16px;margin:1rem 0;color:#6b7280;background:#f0f9ff}
.content hr{border:none;border-top:1px solid #e5e7eb;margin:1.5rem 0}
.footer{margin:2rem 2.5rem 0;padding-top:1rem;border-top:2px solid #e5e7eb;font-family:'Roboto Mono',monospace;font-size:0.62rem;color:#9ca3af;display:flex;justify-content:space-between}
`,
    topBar: '<div class="divider"></div><div class="page-body">',
    headerClass: "doc-header",
    eyebrow: `VidVault AI · ${label.toUpperCase()}`,
    h1: `${esc(d.videoTitle)} <em>${label}</em>`,
    meta: `${d.channelName ? esc(d.channelName) + " · " : ""}${d.generatedAt}`,
    content: d.contentHtml + "</div>",
    footer: `<span>VidVault AI — ${label}</span><span>${d.generatedAt}</span>`,
    printBtn: PRINT_BTN("#fff", "#2563eb"),
    printBarCss: "background:#f2f5f9;",
  });
}

// Special wrapper for template10 since its layout is different
function template10Wrapper(d: ExportData): string {
  const label = TYPE_LABELS[d.type] || d.type;
  const body = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(d.videoTitle)} — ${label}</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=Roboto+Mono:wght@400;500&family=Open+Sans:ital,wght@0,300;0,400;0,600;1,300&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Open Sans',sans-serif;background:#f2f5f9;min-height:100vh;color:#24293e}
.page-top{background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:2.5rem 2.5rem 2rem}
.eyebrow{font-family:'Roboto Mono',monospace;font-size:0.6rem;letter-spacing:0.3em;text-transform:uppercase;color:rgba(255,255,255,0.55);margin-bottom:0.75rem}
h1{font-family:'Montserrat',sans-serif;font-size:1.75rem;color:#fff;line-height:1.15;font-weight:800}
h1 em{color:#60a5fa;font-style:normal;font-weight:600}
.meta{font-family:'Roboto Mono',monospace;font-size:0.65rem;color:rgba(255,255,255,0.5);margin-top:0.5rem}
.divider{height:4px;background:linear-gradient(90deg,#60a5fa,#a78bfa)}
.page-body{max-width:800px;margin:0 auto;background:#fff;padding:2rem 2.5rem 3rem;min-height:60vh}
.content{font-size:0.975rem;line-height:1.78;color:#374151}
.content h1,.content h2,.content h3{font-family:'Montserrat',sans-serif;margin:1.5rem 0 0.6rem;font-weight:700}
.content h1{font-size:1.3rem;color:#1e3a5f;border-bottom:2px solid #e5e7eb;padding-bottom:0.5rem}.content h2{font-size:1.15rem;color:#2563eb}.content h3{font-size:1rem;color:#374151}
.content p{margin-bottom:0.9rem}.content ul,.content ol{padding-left:1.5em;margin-bottom:0.9rem}.content li{margin-bottom:0.4rem}
.content strong{font-weight:700;color:#1e3a5f}.content em{color:#2563eb;font-style:italic}
.content code{font-family:'Roboto Mono',monospace;font-size:0.78rem;background:#eff6ff;padding:2px 7px;border:1px solid #bfdbfe;color:#1e40af}
.content blockquote{border-left:4px solid #2563eb;padding:10px 16px;margin:1rem 0;color:#6b7280;background:#f0f9ff}
.content hr{border:none;border-top:1px solid #e5e7eb;margin:1.5rem 0}
.footer{padding:1rem 2.5rem;border-top:2px solid #e5e7eb;font-family:'Roboto Mono',monospace;font-size:0.62rem;color:#9ca3af;display:flex;justify-content:space-between}
.print-bar{text-align:center;padding:20px 0 30px;background:#f2f5f9}
@media print{.print-bar{display:none}body{background:#fff}}
</style>
${PRINT_JS}
</head>
<body>
<div class="page-top" style="max-width:800px;margin:0 auto">
  <div class="eyebrow">VidVault AI · ${label.toUpperCase()}</div>
  <h1>${esc(d.videoTitle)} <em>${label}</em></h1>
  <div class="meta">${d.channelName ? esc(d.channelName) + " · " : ""}${d.generatedAt}</div>
</div>
<div class="divider" style="max-width:800px;margin:0 auto"></div>
<div class="page-body">
  <div class="content">${d.contentHtml}</div>
</div>
<div class="footer" style="max-width:800px;margin:0 auto">
  <span>VidVault AI — ${label}</span><span>${d.generatedAt}</span>
</div>
<div class="print-bar">
  <button onclick="doPrint()" style="background:#2563eb;color:#fff;border:none;font-family:'Montserrat',sans-serif;font-size:0.72rem;letter-spacing:0.12em;text-transform:uppercase;font-weight:700;padding:10px 24px;cursor:pointer;border-radius:4px;">↓ Print / Save PDF</button>
</div>
</body>
</html>`;
  return body;
}

export const CONTENT_TEMPLATES = [
  { id: 1,  name: "Dark Academic",  fn: template1 },
  { id: 2,  name: "Neon Cyberpunk", fn: template2 },
  { id: 3,  name: "Paper & Ink",    fn: template3 },
  { id: 4,  name: "VidVault Dark",  fn: template4 },
  { id: 5,  name: "Ocean Depths",   fn: template5 },
  { id: 6,  name: "Emerald Forest", fn: template6 },
  { id: 7,  name: "Sunrise Warm",   fn: template7 },
  { id: 8,  name: "Bauhaus Minimal",fn: template8 },
  { id: 9,  name: "Purple Galaxy",  fn: template9 },
  { id: 10, name: "Corporate Pro",  fn: template10Wrapper },
];
