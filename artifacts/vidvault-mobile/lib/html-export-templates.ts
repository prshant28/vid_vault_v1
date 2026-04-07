export interface ExportTemplate {
  id: string;
  name: string;
  desc: string;
  palette: string[];
  dark: boolean;
  generate: (opts: TemplateOpts) => string;
}

export interface TemplateOpts {
  title: string;
  toolLabel: string;
  toolColor: string;
  content: string;
  date: string;
  wordCount: number;
  readMins: number;
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function paragraphs(content: string) {
  return content
    .split("\n")
    .map((l) => `<p>${esc(l) || "&nbsp;"}</p>`)
    .join("\n");
}

/* ─────────────────────────────────────────────
   T1 — VidVault Dark  (original refined)
───────────────────────────────────────────── */
function generateVidVaultDark(o: TemplateOpts): string {
  const c = o.toolColor;
  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(o.toolLabel)} — ${esc(o.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;background:#0a0a0b;color:#e8e4d8;min-height:100vh}
.banner{background:${c}12;border-bottom:1px solid ${c}28;padding:10px 28px;display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
.b-l{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${c}}
.b-r{font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(255,255,255,0.3)}
.page{max-width:780px;margin:0 auto;padding:2.5rem 1.5rem 5rem}
.header{border-left:3px solid ${c};padding-left:1.2rem;margin-bottom:2.5rem}
.eyebrow{font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${c};margin-bottom:8px}
h1{font-size:1.9rem;font-weight:900;color:#fff;margin-bottom:6px;line-height:1.1}
.meta{font-family:'JetBrains Mono',monospace;font-size:11px;color:rgba(255,255,255,0.3)}
.card{background:#111;border-radius:14px;padding:2rem;border:1px solid #1e1e1e;border-left:3px solid ${c}}
.card p{font-size:15px;line-height:1.9;color:#d0cbbf;margin-bottom:12px}
.card p:last-child{margin-bottom:0}
.footer{margin-top:1.5rem;padding-top:1rem;border-top:1px solid #1e1e1e;display:flex;justify-content:space-between;font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(255,255,255,0.2);letter-spacing:1px;text-transform:uppercase}
@media print{.banner{display:none}body{background:#fff;color:#111}.card{background:#f5f5f5;border-color:#ccc;color:#111}.header{border-color:#444}}
</style></head>
<body>
<div class="banner"><span class="b-l">VidVault AI · ${esc(o.toolLabel)}</span><span class="b-r">Generated ${o.date}</span></div>
<div class="page">
  <div class="header">
    <div class="eyebrow">VidVault AI · ${esc(o.toolLabel)}</div>
    <h1>${esc(o.title)}</h1>
    <div class="meta">${o.date} · ${o.wordCount} words · ${o.readMins} min read</div>
  </div>
  <div class="card">${paragraphs(o.content)}</div>
  <div class="footer"><span>VidVault AI</span><span>${o.date}</span></div>
</div></body></html>`;
}

/* ─────────────────────────────────────────────
   T2 — Academic Light  (StudyFlow inspired)
───────────────────────────────────────────── */
function generateAcademicLight(o: TemplateOpts): string {
  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(o.toolLabel)} — ${esc(o.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Mono:wght@300;400;500&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
:root{--bg:#f7f4ee;--ink:#1a1814;--muted:#6b6456;--rule:#ddd8cc;--acc:#c0392b;--navy:#1a3a5c;--green:#1e6b4a;--serif:'Playfair Display',Georgia,serif;--mono:'DM Mono',monospace;--body:'Outfit',sans-serif}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:var(--body);background:var(--bg);color:var(--ink);min-height:100vh}
nav{background:rgba(247,244,238,0.95);border-bottom:1px solid var(--rule);padding:0 2rem;display:flex;align-items:center;justify-content:space-between;height:52px;position:sticky;top:0;backdrop-filter:blur(10px)}
.nav-brand{font-family:var(--serif);font-size:1.05rem;font-weight:700;color:var(--ink)}.nav-brand em{color:var(--acc);font-style:italic}
.nav-r{font-family:var(--mono);font-size:10px;color:var(--muted);letter-spacing:1px}
.hero{background:var(--ink);padding:3rem 2rem;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;top:0;left:0;right:0;height:4px;background:repeating-linear-gradient(90deg,var(--acc) 0,var(--acc) 25%,var(--navy) 25%,var(--navy) 50%,var(--green) 50%,var(--green) 75%,#b8860b 75%,#b8860b 100%)}
.hero-inner{max-width:820px;margin:0 auto;position:relative}
.h-eye{font-family:var(--mono);font-size:9px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:10px}
.hero h1{font-family:var(--serif);font-size:clamp(1.8rem,5vw,3rem);font-weight:900;color:#fff;line-height:1.1;margin-bottom:10px}
.hero h1 em{color:#fbbf24;font-style:italic}
.hero-meta{font-family:var(--mono);font-size:10px;color:rgba(255,255,255,0.4);letter-spacing:1px}
.main{max-width:820px;margin:0 auto;padding:2.5rem 1.5rem 5rem}
.sec-head{display:flex;align-items:center;gap:8px;margin:0 0 1.2rem}
.sec-head::after{content:'';flex:1;height:1px;background:var(--rule)}
.sec-head h2{font-family:var(--serif);font-size:1.15rem;font-weight:700;color:var(--ink)}
.content-block{background:#fff;border-radius:10px;border:1px solid var(--rule);border-left:3px solid var(--navy);padding:1.5rem 1.75rem;box-shadow:0 2px 12px rgba(0,0,0,0.05)}
.content-block p{font-size:14px;line-height:1.85;color:var(--ink);margin-bottom:12px}
.content-block p:last-child{margin-bottom:0}
.footer{padding-top:1rem;margin-top:1.5rem;border-top:1px solid var(--rule);display:flex;justify-content:space-between;font-family:var(--mono);font-size:9px;color:var(--muted);letter-spacing:1px;text-transform:uppercase}
@media print{nav{display:none}body{background:#fff}.hero{padding:2rem}}
</style></head>
<body>
<nav><span class="nav-brand">VidVault <em>AI</em></span><span class="nav-r">${o.date}</span></nav>
<div class="hero"><div class="hero-inner">
  <div class="h-eye">VidVault AI · ${esc(o.toolLabel)}</div>
  <h1><em>${esc(o.toolLabel)}</em></h1>
  <div class="hero-meta">${o.date} · ${o.wordCount} words · ${o.readMins} min read</div>
</div></div>
<div class="main">
  <div class="sec-head"><h2>${esc(o.title)}</h2></div>
  <div class="content-block">${paragraphs(o.content)}</div>
  <div class="footer"><span>VidVault AI</span><span>${o.date}</span></div>
</div></body></html>`;
}

/* ─────────────────────────────────────────────
   T3 — Report A4  (Assignment inspired)
───────────────────────────────────────────── */
function generateReportA4(o: TemplateOpts): string {
  const c = o.toolColor;
  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(o.toolLabel)} — ${esc(o.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;0,700;1,400&family=Space+Mono:wght@400;700&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
:root{--g:${c};--ink:#111827;--sub:#6B7280;--bg:#F9F7F1;--rule:#D1C9B8;--ff-serif:'Crimson Pro',Georgia,serif;--ff-mono:'Space Mono',monospace;--ff-body:'Outfit',sans-serif}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:var(--ff-body);background:#B8C4B8;color:var(--ink);font-size:13px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:210mm;min-height:297mm;margin:18px auto;background:var(--bg);padding:12mm 14mm 10mm;box-shadow:0 12px 48px rgba(0,0,0,.26);position:relative;overflow:hidden;display:flex;flex-direction:column}
.page::before{content:'';position:absolute;top:0;left:0;right:0;height:5px;background:linear-gradient(90deg,var(--g) 0%,${c}aa 50%,${c}55 100%)}
.hd{display:grid;grid-template-columns:1fr auto;align-items:start;gap:8px;border-bottom:2px solid var(--ink);padding-bottom:7px;margin-bottom:12px}
.hd h1{font-family:var(--ff-serif);font-size:18pt;font-weight:700;color:var(--ink);line-height:1.1}
.hd h1 em{color:var(--g);font-style:italic;font-weight:400}
.hd .pg{font-family:var(--ff-mono);font-size:6pt;color:var(--sub);text-align:right;line-height:1.9}
.strip{display:grid;grid-template-columns:1fr 1fr 1fr;border:1.5px solid var(--ink);border-radius:4px;overflow:hidden;margin-bottom:10px}
.sc{padding:5px 9px;background:#F0EBE0;border-right:1px solid var(--rule)}
.sc:last-child{border-right:none}
.scl{font-family:var(--ff-mono);font-size:5pt;color:var(--sub);text-transform:uppercase;letter-spacing:.1em;margin-bottom:2px}
.scv{font-family:var(--ff-serif);font-size:9pt;font-weight:700;color:var(--ink)}
.sh{display:flex;align-items:center;gap:6px;margin:10px 0 7px}
.sh .n{font-family:var(--ff-mono);font-size:5.5pt;background:var(--g);color:#fff;padding:2px 6px;border-radius:2px;font-weight:700;letter-spacing:.06em}
.sh h2{font-family:var(--ff-serif);font-size:11pt;font-weight:700;color:var(--ink)}
.sh::after{content:'';flex:1;height:1px;background:var(--rule)}
.box{border-left:3px solid var(--g);background:#F9FFF9;border-radius:0 4px 4px 0;padding:8px 12px;font-size:8pt;line-height:1.75;margin-bottom:8px}
.box p{margin-bottom:6px}.box p:last-child{margin-bottom:0}
.ft{padding-top:6px;margin-top:auto;border-top:1px solid var(--rule);display:flex;justify-content:space-between;align-items:flex-end;font-family:var(--ff-mono);font-size:5pt;color:var(--sub)}
@media print{body{background:none}.page{margin:0;box-shadow:none;width:210mm;min-height:297mm}}
</style></head>
<body>
<div class="page">
  <div class="hd">
    <div><h1>${esc(o.toolLabel)} — <em>${esc(o.title)}</em></h1></div>
    <div class="pg"><span>VidVault AI</span><br><span>${o.date}</span></div>
  </div>
  <div class="strip">
    <div class="sc"><div class="scl">Type</div><div class="scv">${esc(o.toolLabel)}</div></div>
    <div class="sc"><div class="scl">Words</div><div class="scv">${o.wordCount}</div></div>
    <div class="sc"><div class="scl">Read Time</div><div class="scv">${o.readMins} min</div></div>
  </div>
  <div class="sh"><span class="n">CONTENT</span><h2>${esc(o.title)}</h2></div>
  <div class="box">${paragraphs(o.content)}</div>
  <div class="ft"><span>VidVault AI · ${esc(o.toolLabel)}</span><span>${o.date}</span></div>
</div></body></html>`;
}

/* ─────────────────────────────────────────────
   T4 — Blueprint Dark  (RecallSense inspired)
───────────────────────────────────────────── */
function generateBlueprintDark(o: TemplateOpts): string {
  const c = o.toolColor;
  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(o.toolLabel)} — ${esc(o.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Newsreader:ital,wght@0,300;0,400;1,300;1,400&display=swap" rel="stylesheet">
<style>
:root{--bg:#04060f;--s1:#080d1a;--s2:#0d1526;--border:#1a2540;--border2:#243050;--c0:${c};--text:#dce4f5;--muted:#5a6a8a;--muted2:#8a9ab8}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--text);font-family:'Newsreader',Georgia,serif;font-size:16px;line-height:1.7}
nav{position:sticky;top:0;height:56px;background:rgba(4,6,15,0.9);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 40px;justify-content:space-between;z-index:100}
.nav-brand{font-family:'Syne',sans-serif;font-weight:800;font-size:16px;letter-spacing:-0.5px;color:var(--text)}
.nav-brand em{color:var(--c0);font-style:normal}
.nav-r{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted)}
.hero{padding:80px 40px 60px;text-align:center;border-bottom:1px solid var(--border);background:radial-gradient(ellipse at center,${c}08 0%,transparent 70%)}
.hero-label{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--c0);border:1px solid ${c}30;background:${c}08;padding:5px 18px;border-radius:100px;display:inline-block;margin-bottom:28px}
.hero h1{font-family:'Syne',sans-serif;font-size:clamp(2rem,5vw,3.5rem);font-weight:800;line-height:0.95;letter-spacing:-2px;margin-bottom:16px}
.hero-meta{font-family:'Space Mono',monospace;font-size:11px;color:var(--muted);letter-spacing:1px}
.container{max-width:900px;margin:0 auto;padding:3rem 2rem 5rem}
.sec-label{display:flex;align-items:center;gap:12px;margin-bottom:24px}
.sec-line{width:28px;height:1px;background:var(--c0)}
.sec-text{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--c0)}
.content-card{background:var(--s1);border:1px solid var(--border);border-radius:16px;padding:2rem 2.25rem;border-left:3px solid var(--c0)}
.content-card p{font-size:15px;line-height:1.85;color:var(--text);margin-bottom:14px;font-style:italic}
.content-card p:last-child{margin-bottom:0}
.footer-row{margin-top:2rem;padding-top:1.2rem;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;font-family:'Space Mono',monospace;font-size:10px;color:var(--muted);letter-spacing:1px;text-transform:uppercase}
@media print{nav{display:none}body{background:#fff;color:#111}.content-card{background:#f5f5f5;border-color:#ccc}.hero{background:#fff}}
</style></head>
<body>
<nav><span class="nav-brand">VidVault <em>AI</em></span><span class="nav-r">${o.date}</span></nav>
<div class="hero">
  <div class="hero-label">${esc(o.toolLabel)}</div>
  <h1>${esc(o.title)}</h1>
  <div class="hero-meta">${o.date} · ${o.wordCount} words · ${o.readMins} min read</div>
</div>
<div class="container">
  <div class="sec-label"><div class="sec-line"></div><div class="sec-text">Content</div></div>
  <div class="content-card">${paragraphs(o.content)}</div>
  <div class="footer-row"><span>VidVault AI</span><span>${o.date}</span></div>
</div></body></html>`;
}

/* ─────────────────────────────────────────────
   T5 — Session Notes  (PDS Notes inspired)
───────────────────────────────────────────── */
function generateSessionNotes(o: TemplateOpts): string {
  const c = o.toolColor;
  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(o.toolLabel)} — ${esc(o.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=IBM+Plex+Mono:wght@400;500;600&family=Figtree:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{--ink:#0f0e0c;--paper:#faf8f3;--cream:#f0ece0;--rule:#c8bfa8;--accent:${c};--muted:#5a5345;--serif:'DM Serif Display',Georgia,serif;--mono:'IBM Plex Mono','Courier New',monospace;--sans:'Figtree',sans-serif}
*{box-sizing:border-box;margin:0;padding:0}
body{background:#e8e4d8;font-family:var(--sans);color:var(--ink);-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:210mm;min-height:297mm;margin:20px auto;background:var(--paper);padding:16mm 18mm;box-shadow:0 8px 48px rgba(0,0,0,0.22);position:relative;overflow:hidden}
.page::before{content:'';position:absolute;top:0;left:0;right:0;height:5px;background:repeating-linear-gradient(90deg,${c} 0,${c} 40px,${c}99 40px,${c}99 80px,${c}66 80px,${c}66 120px,${c}33 120px,${c}33 160px)}
.corner{position:absolute;width:20px;height:20px;border-color:var(--rule);border-style:solid}
.corner.tl{top:10mm;left:10mm;border-width:1px 0 0 1px}
.corner.tr{top:10mm;right:10mm;border-width:1px 1px 0 0}
.corner.bl{bottom:10mm;left:10mm;border-width:0 0 1px 1px}
.corner.br{bottom:10mm;right:10mm;border-width:0 1px 1px 0}
.doc-header{display:grid;grid-template-columns:1fr auto;align-items:start;gap:12px;border-bottom:2px solid var(--ink);padding-bottom:10px;margin-bottom:14px}
h1.doc-title{font-family:var(--serif);font-size:22pt;font-weight:400;color:var(--ink);line-height:1.1;letter-spacing:-0.02em}
h1.doc-title em{color:var(--accent);font-style:italic}
.doc-meta{font-family:var(--mono);font-size:7.5pt;color:var(--muted);line-height:1.7;text-align:right}
.subtitle{font-family:var(--sans);font-size:8.5pt;color:var(--muted);font-weight:400;margin-top:4px;letter-spacing:0.04em;text-transform:uppercase}
.section-heading{display:flex;align-items:center;gap:8px;margin:14px 0 8px}
.section-heading .num{font-family:var(--mono);font-size:7pt;background:var(--ink);color:var(--paper);padding:2px 6px;letter-spacing:.08em;border-radius:2px;font-weight:600;flex-shrink:0}
.section-heading h2{font-family:var(--serif);font-size:13pt;font-weight:400;color:var(--ink)}
.section-heading::after{content:'';flex:1;height:1px;background:var(--rule)}
.note-box{background:var(--cream);border-left:3px solid var(--accent);border-radius:0 4px 4px 0;padding:10px 14px;font-size:8.5pt;line-height:1.75;margin-bottom:10px}
.note-box p{margin-bottom:6px}.note-box p:last-child{margin-bottom:0}
.meta-strip{display:grid;grid-template-columns:repeat(3,1fr);border:1.5px solid var(--rule);border-radius:4px;overflow:hidden;margin-bottom:12px;background:var(--cream)}
.ms-item{padding:6px 10px;border-right:1px solid var(--rule)}
.ms-item:last-child{border-right:none}
.ms-label{font-family:var(--mono);font-size:5.5pt;color:var(--muted);text-transform:uppercase;letter-spacing:.1em;margin-bottom:2px}
.ms-val{font-family:var(--serif);font-size:10pt;font-weight:400;color:var(--ink)}
.ft{padding-top:6px;margin-top:auto;border-top:1px solid var(--rule);display:flex;justify-content:space-between;font-family:var(--mono);font-size:5.5pt;color:var(--muted);letter-spacing:.5px}
@media print{body{background:none}.page{margin:0;box-shadow:none;width:210mm;min-height:297mm}}
</style></head>
<body>
<div class="page">
  <div class="corner tl"></div><div class="corner tr"></div>
  <div class="corner bl"></div><div class="corner br"></div>
  <div class="doc-header">
    <div>
      <h1 class="doc-title"><em>${esc(o.toolLabel)}</em></h1>
      <div class="subtitle">Generated by VidVault AI · AI-Powered Notes</div>
    </div>
    <div class="doc-meta"><span>VidVault AI</span><span>${o.date}</span></div>
  </div>
  <div class="meta-strip">
    <div class="ms-item"><div class="ms-label">Source</div><div class="ms-val">${esc(o.title)}</div></div>
    <div class="ms-item"><div class="ms-label">Words</div><div class="ms-val">${o.wordCount}</div></div>
    <div class="ms-item"><div class="ms-label">Read Time</div><div class="ms-val">${o.readMins} min</div></div>
  </div>
  <div class="section-heading"><span class="num">CONTENT</span><h2>${esc(o.title)}</h2></div>
  <div class="note-box">${paragraphs(o.content)}</div>
  <div class="ft"><span>VidVault AI · ${esc(o.toolLabel)}</span><span>${o.date}</span></div>
</div></body></html>`;
}

/* ─────────────────────────────────────────────
   Template Registry
───────────────────────────────────────────── */
export const EXPORT_TEMPLATES: ExportTemplate[] = [
  {
    id: "vidvault-dark",
    name: "VidVault Dark",
    desc: "Sleek dark theme with colored accent border",
    palette: ["#0a0a0b", "#111", "#8b5cf6"],
    dark: true,
    generate: generateVidVaultDark,
  },
  {
    id: "academic-light",
    name: "Academic Light",
    desc: "Editorial serif layout on parchment paper",
    palette: ["#f7f4ee", "#ffffff", "#1a3a5c"],
    dark: false,
    generate: generateAcademicLight,
  },
  {
    id: "report-a4",
    name: "Report A4",
    desc: "Formal A4 report ready for print or PDF",
    palette: ["#F9F7F1", "#F0EBE0", "#00875A"],
    dark: false,
    generate: generateReportA4,
  },
  {
    id: "blueprint-dark",
    name: "Blueprint Dark",
    desc: "Modern tech blueprint with glowing accents",
    palette: ["#04060f", "#080d1a", "#00e5ff"],
    dark: true,
    generate: generateBlueprintDark,
  },
  {
    id: "session-notes",
    name: "Session Notes",
    desc: "Academic notebook with corner marks & rule",
    palette: ["#faf8f3", "#f0ece0", "#1a6b3a"],
    dark: false,
    generate: generateSessionNotes,
  },
];
