import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText, BookOpen, Network, Mic, Twitter, AlignLeft,
  GraduationCap, Lightbulb, Download, Lock, Sparkles,
  ChevronRight, Copy, CheckCheck, X, Eye,
} from "lucide-react";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.FC<any>;
  color: string;
  format: string;
  premium: boolean;
  preview: string;
}

const TEMPLATES: Template[] = [
  {
    id: "cornell",
    name: "Cornell Notes",
    description: "Classic two-column format with cues, notes, and summary sections. Perfect for studying.",
    category: "Notes",
    icon: BookOpen,
    color: "#8b5cf6",
    format: "Markdown",
    premium: false,
    preview: `# Cornell Notes: [Video Title]
Date: [Date] | Source: [Channel]

┌─────────────────┬──────────────────────────┐
│ CUES / KEYWORDS │ NOTES                    │
├─────────────────┼──────────────────────────┤
│ [Key Term 1]    │ [Detailed note]          │
│ [Key Term 2]    │ [Supporting detail]      │
│ [Question?]     │ [Answer / Explanation]   │
└─────────────────┴──────────────────────────┘

## SUMMARY
[2-3 sentence summary of the main ideas]

## KEY TAKEAWAYS
1. [Takeaway 1]
2. [Takeaway 2]
3. [Takeaway 3]`,
  },
  {
    id: "academic",
    name: "Academic Paper",
    description: "Structured academic format with abstract, key concepts, analysis, and references.",
    category: "Research",
    icon: GraduationCap,
    color: "#06b6d4",
    format: "Markdown",
    premium: false,
    preview: `# [Video Title]
**Author/Channel:** [Channel Name]
**Date:** [Date] | **Duration:** [Duration]

## Abstract
[2-3 sentence overview of the video's main contribution]

## Introduction
[Context and background information]

## Key Concepts
### Concept 1: [Name]
[Explanation and supporting details]

### Concept 2: [Name]  
[Explanation and supporting details]

## Critical Analysis
[Strengths, weaknesses, and implications]

## Conclusion
[Summary and future directions]

## References
- [Video URL]`,
  },
  {
    id: "study-guide",
    name: "Study Guide",
    description: "Comprehensive study resource with definitions, key points, Q&A, and practice questions.",
    category: "Study",
    icon: FileText,
    color: "#10b981",
    format: "Markdown",
    premium: false,
    preview: `# Study Guide: [Video Title]
📚 Source: [Channel] | ⏱ [Duration]

## 📖 Key Definitions
| Term | Definition |
|------|-----------|
| [Term 1] | [Definition] |
| [Term 2] | [Definition] |

## 🎯 Core Concepts
1. **[Concept 1]**: [Brief explanation]
2. **[Concept 2]**: [Brief explanation]

## ❓ Practice Questions
1. [Question 1]?
   → [Answer]

2. [Question 2]?
   → [Answer]

## 💡 Key Takeaways
- [Point 1]
- [Point 2]
- [Point 3]

## 📝 Summary
[Overall summary paragraph]`,
  },
  {
    id: "mindmap",
    name: "Mind Map Outline",
    description: "Hierarchical outline format that mirrors a mind map structure for visual thinkers.",
    category: "Visual",
    icon: Network,
    color: "#f59e0b",
    format: "Text",
    premium: false,
    preview: `CENTRAL TOPIC: [Video Title]
│
├── 🔵 MAIN BRANCH 1: [Topic]
│   ├── Sub-point A
│   ├── Sub-point B
│   └── Sub-point C: [Detail]
│
├── 🟢 MAIN BRANCH 2: [Topic]
│   ├── Sub-point A
│   └── Sub-point B
│       └── Detail level 3
│
├── 🟡 MAIN BRANCH 3: [Topic]
│   └── Sub-point A
│
└── 🔴 KEY CONNECTIONS
    ├── [Topic A] ↔ [Topic B]
    └── [Topic B] ↔ [Topic C]`,
  },
  {
    id: "executive",
    name: "Executive Summary",
    description: "Concise, professional briefing format for sharing insights with colleagues.",
    category: "Business",
    icon: AlignLeft,
    color: "#6366f1",
    format: "Markdown",
    premium: false,
    preview: `# Executive Briefing
**Topic:** [Video Title]
**Source:** [Channel] | **Date:** [Date]
**Prepared by:** VidVault AI

---

## TL;DR
[One sentence summary]

## Business Context
[Why this matters / relevance]

## Key Findings
• [Finding 1]
• [Finding 2]  
• [Finding 3]

## Recommended Actions
1. [Action 1]
2. [Action 2]

## Risk / Considerations
[Any caveats or concerns]

---
*Generated from [Duration] of content*`,
  },
  {
    id: "podcast",
    name: "Podcast Show Notes",
    description: "Structured show notes with timestamps, topics, and key quotes for sharing.",
    category: "Media",
    icon: Mic,
    color: "#ec4899",
    format: "Markdown",
    premium: false,
    preview: `# 🎙 [Video/Podcast Title]
**Host:** [Channel Name] | **Duration:** [Duration]
**Episode Link:** [URL]

## Episode Overview
[Brief description of what's covered]

## Topics Covered
- **[00:00]** Introduction & [Topic]
- **[05:30]** [Main Topic 1]
- **[15:00]** [Main Topic 2]
- **[25:00]** Key insights & takeaways

## Notable Quotes
> "[Quote 1]"
> — [Speaker]

> "[Quote 2]"

## Key Resources Mentioned
- [Resource 1]
- [Resource 2]

## Share This Episode
[Auto-generated social copy]`,
  },
  {
    id: "twitter",
    name: "Twitter/X Thread",
    description: "Transform your video insights into an engaging tweet thread ready to post.",
    category: "Social",
    icon: Twitter,
    color: "#1d9bf0",
    format: "Text",
    premium: true,
    preview: `🧵 Just finished watching "[Video Title]" by @[Channel]

Here are the 7 key insights you need to know: 🧵

1/ [First key insight from the video — engaging and punchy]

2/ [Second insight — add a surprising fact or counterintuitive idea]

3/ [Third insight — practical application or real-world example]

4/ [Fourth insight — deeper dive or nuance]

5/ [Fifth insight — connect to broader trend]

6/ [Sixth insight — actionable takeaway]

7/ [Final insight — the most important point]

TL;DR: [One sentence summary]

Watch the full video here: [URL]

Like this? Follow for more learning threads 🔁`,
  },
  {
    id: "flashcard-deck",
    name: "Anki Flashcard Deck",
    description: "Export flashcards in Anki-compatible format for spaced repetition studying.",
    category: "Study",
    icon: Lightbulb,
    color: "#f97316",
    format: "CSV",
    premium: true,
    preview: `Front,Back,Tags,Deck
"What is [Concept 1]?","[Answer 1]","[tag1] [tag2]","[Video Title]"
"What is [Concept 2]?","[Answer 2]","[tag1]","[Video Title]"
"How does [Process] work?","[Step-by-step explanation]","[tag2]","[Video Title]"
"What are the key characteristics of [Topic]?","1. [Char1] 2. [Char2] 3. [Char3]","[tag1]","[Video Title]"
"Define: [Term]","[Definition with context]","[tag3]","[Video Title]"

# Import instructions:
# 1. Open Anki
# 2. File → Import
# 3. Select this CSV file
# 4. Set separator to comma
# 5. Map fields: Front/Back/Tags/Deck`,
  },
];

const CATEGORIES = ["All", "Notes", "Research", "Study", "Visual", "Business", "Media", "Social"];

function escHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function generateDemoHtml(template: Template): string {
  const bg = "#0a0a0b";
  const text = "#e8e4d8";
  const muted = "#6b7280";
  const content = escHtml(template.preview);
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escHtml(template.name)} — VidVault AI Demo</title>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@300;400;500;600;700;900&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;background:${bg};color:${text};min-height:100vh}
.banner{background:${template.color}18;border-bottom:1px solid ${template.color}30;padding:10px 24px;display:flex;align-items:center;justify-content:space-between}
.banner-label{font-family:'JetBrains Mono',monospace;font-size:0.6rem;letter-spacing:0.25em;text-transform:uppercase;color:${template.color}}
.banner-note{font-family:'JetBrains Mono',monospace;font-size:0.6rem;color:${muted}}
.page{max-width:820px;margin:0 auto;padding:2.5rem 2rem 4rem}
.doc-header{border-bottom:2px solid ${template.color}30;padding-bottom:1.5rem;margin-bottom:2rem;position:relative;padding-left:1rem}
.doc-header::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:${template.color};border-radius:2px}
.eyebrow{font-family:'JetBrains Mono',monospace;font-size:0.6rem;letter-spacing:0.3em;text-transform:uppercase;color:${template.color};margin-bottom:0.5rem}
h1{font-family:'Inter',sans-serif;font-size:1.75rem;font-weight:900;color:${text};line-height:1.1;margin-bottom:0.5rem}
.meta{font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:${muted}}
.badge{display:inline-flex;align-items:center;gap:0.4rem;padding:3px 10px;border-radius:4px;font-family:'JetBrains Mono',monospace;font-size:0.62rem;text-transform:uppercase;letter-spacing:0.15em;background:${template.color}20;color:${template.color};border:1px solid ${template.color}35;margin-bottom:1rem}
.content-box{background:#111;border-radius:12px;padding:1.5rem 2rem;border:1px solid #222;border-left:3px solid ${template.color}}
pre{font-family:'JetBrains Mono',monospace;font-size:0.8rem;line-height:1.75;white-space:pre-wrap;color:${text}}
pre .bracket{color:${template.color};font-weight:600}
.footer{margin-top:2rem;padding-top:1rem;border-top:1px solid #222;display:flex;align-items:center;justify-content:space-between}
.footer-brand{font-family:'JetBrains Mono',monospace;font-size:0.6rem;letter-spacing:0.2em;text-transform:uppercase;color:${muted}}
.print-bar{text-align:center;padding:20px 0 32px}
@media print{.banner,.print-bar{display:none}body{background:#fff}pre{color:#111}.content-box{background:#f9f9f9;border-color:#ddd}.doc-header{border-color:#ddd}}
</style>
</head>
<body>
<div class="banner">
  <span class="banner-label">VidVault AI · ${escHtml(template.name)} · ${template.format} Format · Demo Preview</span>
  <span class="banner-note">AI fills [brackets] from real video content</span>
</div>
<div class="page">
  <div class="doc-header">
    <div class="eyebrow">VidVault AI · ${template.category.toUpperCase()} TEMPLATE</div>
    <h1>${escHtml(template.name)}</h1>
    <div class="meta">Channel: AI Learning Academy · Generated: ${today} · Format: ${template.format}</div>
  </div>
  <div class="badge">${escHtml(template.category)} · ${template.format} · ${template.premium ? "PRO" : "FREE"}</div>
  <div class="content-box">
    <pre>${content.replace(/\[([^\]]+)\]/g, '<span class="bracket">[$1]</span>')}</pre>
  </div>
  <div class="footer">
    <span class="footer-brand">VidVault AI — ${escHtml(template.name)} Demo</span>
    <span class="footer-brand">${today}</span>
  </div>
</div>
<div class="print-bar">
  <button onclick="window.print()" style="background:${template.color};color:#fff;border:none;font-family:'JetBrains Mono',monospace;font-size:0.7rem;letter-spacing:0.15em;text-transform:uppercase;font-weight:700;padding:10px 24px;cursor:pointer;border-radius:6px;">↓ Print / Save as PDF</button>
</div>
</body>
</html>`;
}

function downloadDemoFile(template: Template) {
  const html = generateDemoHtml(template);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `VidVault_${template.id}_demo.html`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function TemplatePreviewModal({ template, onClose }: { template: Template; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(template.preview);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl rounded-2xl overflow-hidden"
        style={{ background: "var(--vv-surface)", border: "1px solid var(--vv-border)" }}
      >
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--vv-border)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: template.color + "20", border: `1px solid ${template.color}30` }}>
              <template.icon className="w-4 h-4" style={{ color: template.color }} />
            </div>
            <div>
              <p className="font-mono-ui text-sm font-bold uppercase tracking-wider" style={{ color: "var(--vv-text)" }}>{template.name}</p>
              <p className="font-mono-ui text-[9px] uppercase tracking-widest" style={{ color: template.color }}>{template.format} FORMAT · {template.category}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono-ui text-[10px] uppercase tracking-wider transition-all"
              style={{ background: template.color + "20", color: template.color, border: `1px solid ${template.color}30` }}
            >
              {copied ? <CheckCheck className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? "COPIED" : "COPY"}
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors" style={{ color: "var(--vv-text-muted)", border: "1px solid var(--vv-border)" }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Info banner */}
        <div className="px-5 py-2.5 flex items-center justify-between" style={{ background: template.color + "0a", borderBottom: `1px solid ${template.color}20` }}>
          <p className="font-mono-ui text-[9px] uppercase tracking-widest" style={{ color: template.color }}>
            Template Structure Preview — [brackets] = AI-filled from your video
          </p>
          <button
            onClick={() => downloadDemoFile(template)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg font-mono-ui text-[9px] uppercase tracking-wider font-bold transition-all"
            style={{ background: template.color, color: "#fff" }}
            title="Download a real demo HTML file to see the final export"
          >
            <Eye className="w-3 h-3" />
            Download Demo File
          </button>
        </div>

        <div className="p-5 max-h-[50vh] overflow-y-auto">
          <pre className="font-mono text-[11px] leading-relaxed whitespace-pre-wrap" style={{ color: "var(--vv-text)", fontFamily: "'JetBrains Mono', monospace" }}>
            {template.preview}
          </pre>
        </div>
        <div className="p-5 border-t flex items-center justify-between gap-3" style={{ borderColor: "var(--vv-border)" }}>
          <div>
            <p className="font-mono-ui text-[9px] uppercase tracking-widest" style={{ color: "var(--vv-text-muted)" }}>
              {template.premium ? "PRO template — upgrade to use with your videos" : "Free template — open any video and use AI Studio"}
            </p>
          </div>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-mono-ui text-[10px] uppercase tracking-wider font-bold transition-all flex-shrink-0"
            style={{ background: template.color, color: "#fff" }}
            onClick={() => { onClose(); window.location.href = "/videos"; }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Go to My Videos
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function TemplateCard({ template, onPreview }: { template: Template; onPreview: () => void }) {
  return (
    <div
      className="etched-slab p-5 relative overflow-hidden group cursor-pointer"
      onClick={onPreview}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: `radial-gradient(ellipse at 70% 0%, ${template.color}10, transparent 60%)` }} />
      {template.premium && (
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: "#f59e0b20", border: "1px solid #f59e0b40" }}>
          <Lock className="w-2.5 h-2.5" style={{ color: "#f59e0b" }} />
          <span className="font-mono-ui text-[8px] uppercase tracking-wider" style={{ color: "#f59e0b" }}>PRO</span>
        </div>
      )}
      <div className="relative z-10">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: template.color + "18", border: `1px solid ${template.color}25` }}>
            <template.icon className="w-4.5 h-4.5" style={{ color: template.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-mono-ui text-[11px] font-bold uppercase tracking-wider truncate" style={{ color: "var(--vv-text)" }}>{template.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono-ui text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: template.color + "15", color: template.color }}>{template.category}</span>
              <span className="font-mono-ui text-[8px] uppercase tracking-widest" style={{ color: "var(--vv-text-muted)" }}>{template.format}</span>
            </div>
          </div>
        </div>
        <p className="font-mono-ui text-[10px] leading-relaxed mb-4" style={{ color: "var(--vv-text-desc)" }}>{template.description}</p>
        <div className="flex items-center justify-between">
          <button
            className="flex items-center gap-1.5 font-mono-ui text-[9px] uppercase tracking-wider transition-all"
            style={{ color: template.color }}
          >
            <Download className="w-3 h-3" />
            Preview Format
          </button>
          <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: template.color }} />
        </div>
      </div>
    </div>
  );
}

export default function Templates() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);

  const filtered = activeCategory === "All"
    ? TEMPLATES
    : TEMPLATES.filter((t) => t.category === activeCategory);

  return (
    <>
      {activeTemplate && (
        <TemplatePreviewModal template={activeTemplate} onClose={() => setActiveTemplate(null)} />
      )}

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 pb-12">
        <motion.div variants={item} className="pt-2">
          <span className="font-mono-ui text-[9px] uppercase tracking-[0.3em] block mb-1" style={{ color: "var(--vv-text-muted)" }}>
            //EXPORT_SYSTEM · TEMPLATE_LIBRARY
          </span>
          <h1 className="font-black lp-heading uppercase mb-2" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontFamily: "'Alegreya Sans SC', serif", letterSpacing: "-0.01em" }}>
            Template Library
          </h1>
          <p className="font-mono-ui text-sm max-w-xl" style={{ color: "var(--vv-text-desc)" }}>
            Export your AI-generated insights in professionally designed formats. Choose a template and apply it to any video in your vault.
          </p>
        </motion.div>

        <motion.div variants={item} className="etched-slab p-5 relative overflow-hidden">
          <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(ellipse at 100% 0%, #8b5cf620, transparent 60%)" }} />
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="font-mono-ui text-[9px] uppercase tracking-[0.3em] mb-1" style={{ color: "var(--vv-text-muted)" }}>//HOW_IT_WORKS</p>
              <p className="font-mono-ui text-sm font-bold" style={{ color: "var(--vv-text)" }}>Pick a template → Open a video → Generate with AI → Export</p>
              <p className="font-mono-ui text-[10px] mt-1" style={{ color: "var(--vv-text-desc)" }}>Templates format your AI summaries, flashcards, and notes into polished, shareable documents.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-center px-4 py-3 rounded-xl" style={{ background: "var(--vv-bg)", border: "1px solid var(--vv-border)" }}>
                <p className="font-black lp-heading text-2xl" style={{ color: "#8b5cf6", fontFamily: "'Alegreya Sans SC', serif" }}>{TEMPLATES.filter(t => !t.premium).length}</p>
                <p className="font-mono-ui text-[8px] uppercase tracking-widest" style={{ color: "var(--vv-text-muted)" }}>FREE</p>
              </div>
              <div className="text-center px-4 py-3 rounded-xl" style={{ background: "var(--vv-bg)", border: "1px solid var(--vv-border)" }}>
                <p className="font-black lp-heading text-2xl" style={{ color: "#f59e0b", fontFamily: "'Alegreya Sans SC', serif" }}>{TEMPLATES.filter(t => t.premium).length}</p>
                <p className="font-mono-ui text-[8px] uppercase tracking-widest" style={{ color: "var(--vv-text-muted)" }}>PRO</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={item} className="flex items-center gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="px-3 py-1.5 rounded-lg font-mono-ui text-[9px] uppercase tracking-wider transition-all"
              style={{
                background: activeCategory === cat ? "#8b5cf6" : "var(--vv-surface)",
                color: activeCategory === cat ? "#fff" : "var(--vv-text-muted)",
                border: `1px solid ${activeCategory === cat ? "#8b5cf6" : "var(--vv-border)"}`,
              }}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((template) => (
            <motion.div key={template.id} whileHover={{ scale: 1.02 }} transition={{ duration: 0.15 }}>
              <TemplateCard template={template} onPreview={() => setActiveTemplate(template)} />
            </motion.div>
          ))}
        </motion.div>

        <motion.div variants={item} className="etched-slab p-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(ellipse at 50% 0%, #f59e0b15, transparent 60%)" }} />
          <div className="relative z-10">
            <Lock className="w-6 h-6 mx-auto mb-3" style={{ color: "#f59e0b" }} />
            <p className="font-mono-ui text-[9px] uppercase tracking-[0.3em] mb-2" style={{ color: "#f59e0b" }}>//PRO_TEMPLATES</p>
            <h3 className="font-black uppercase text-lg mb-2" style={{ fontFamily: "'Alegreya Sans SC', serif", color: "var(--vv-text)" }}>Unlock Pro Templates</h3>
            <p className="font-mono-ui text-[11px] max-w-sm mx-auto mb-4" style={{ color: "var(--vv-text-desc)" }}>
              Get access to Twitter threads, Anki decks, PDF exports, and custom template creation.
            </p>
            <button className="px-5 py-2.5 rounded-xl font-mono-ui text-[11px] uppercase tracking-wider font-bold transition-all" style={{ background: "#f59e0b", color: "#000" }}>
              Upgrade to Pro →
            </button>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
