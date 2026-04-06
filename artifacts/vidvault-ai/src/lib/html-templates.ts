import type { QuizQuestion } from './quiz-parser';

export interface ExportData {
  title: string;
  videoTitle: string;
  channelName?: string;
  content: string;
  contentHtml: string;
  type: string;
  generatedAt: string;
}

export interface QuizExportData {
  title: string;
  videoTitle: string;
  channelName?: string;
  questions: QuizQuestion[];
  generatedAt: string;
}

/* ─── 10 Quiz HTML Templates ─────────────────────────────────────── */

const QUIZ_JS = `
<script>
var score = 0, answered = 0, total = 0;
function init() {
  var qs = document.querySelectorAll('.question-block');
  total = qs.length;
  document.getElementById('total-count').textContent = total;
}
function select(qId, chosen, correct, btn) {
  var block = document.querySelector('[data-qid="' + qId + '"]');
  if (block.dataset.answered) return;
  block.dataset.answered = '1';
  answered++;
  var btns = block.querySelectorAll('.opt-btn');
  btns.forEach(function(b) {
    b.disabled = true;
    if (b.dataset.key === correct) b.classList.add('correct');
    else if (b.dataset.key === chosen) b.classList.add('wrong');
  });
  if (chosen === correct) { score++; }
  var exp = block.querySelector('.explanation');
  if (exp) exp.style.display = 'block';
  updateScore();
}
function updateScore() {
  var sc = document.getElementById('score-display');
  if (sc) sc.textContent = score + '/' + answered;
  if (answered === total) {
    var pct = Math.round((score/total)*100);
    var fin = document.getElementById('final-result');
    if (fin) {
      fin.style.display = 'block';
      fin.querySelector('.pct').textContent = pct + '%';
      fin.querySelector('.summary').textContent = score + ' out of ' + total + ' correct';
      fin.querySelector('.grade').textContent = pct >= 90 ? '🏆 Excellent!' : pct >= 70 ? '⭐ Good Job!' : pct >= 50 ? '💪 Keep Practicing!' : '📚 Review & Retry';
    }
  }
}
window.onload = init;
</script>`;

function quizOptionsHtml(q: QuizQuestion, template: number): string {
  return q.options.map(opt => `
    <button class="opt-btn" data-key="${opt.key}" onclick="select(${q.id},'${opt.key}','${q.correctAnswer}',this)">
      <span class="opt-key">${opt.key}</span>
      <span class="opt-text">${opt.text}</span>
    </button>`).join('');
}

function quizQuestionsHtml(questions: QuizQuestion[], template: number): string {
  return questions.map(q => `
    <div class="question-block" data-qid="${q.id}">
      <div class="q-header"><span class="q-num">Q${q.id}</span><span class="q-text">${escHtml(q.question)}</span></div>
      <div class="options">${quizOptionsHtml(q, template)}</div>
      ${q.explanation ? `<div class="explanation"><strong>💡 Explanation:</strong> ${escHtml(q.explanation)}</div>` : ''}
    </div>`).join('');
}

function escHtml(s: string) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Template 1 — Dark Academic
export function quizTemplate1(data: QuizExportData): string {
  const qs = quizQuestionsHtml(data.questions, 1);
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escHtml(data.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=IBM+Plex+Mono:wght@400;600&family=Figtree:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Figtree',sans-serif;background:#1a1814;color:#e8e4d8;min-height:100vh;padding:2rem 1rem}
.page{max-width:820px;margin:0 auto}
.hero{background:#0f0e0c;border:1px solid #3a3530;border-left:4px solid #c0392b;padding:2rem;margin-bottom:2rem;border-radius:4px}
.eyebrow{font-family:'IBM Plex Mono',monospace;font-size:0.65rem;letter-spacing:0.25em;text-transform:uppercase;color:#6b6456;margin-bottom:0.75rem}
h1{font-family:'DM Serif Display',serif;font-size:2.2rem;color:#f0ece0;line-height:1.15}
h1 em{color:#c0392b;font-style:italic}
.meta{font-family:'IBM Plex Mono',monospace;font-size:0.75rem;color:#6b6456;margin-top:0.75rem}
.score-bar{background:#0f0e0c;border:1px solid #3a3530;padding:1rem 1.5rem;display:flex;align-items:center;gap:1.5rem;margin-bottom:2rem;border-radius:4px}
.score-label{font-family:'IBM Plex Mono',monospace;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.15em;color:#6b6456}
#score-display{font-family:'DM Serif Display',serif;font-size:1.6rem;color:#c0392b}
.question-block{background:#0f0e0c;border:1px solid #2a2520;padding:1.5rem;margin-bottom:1.25rem;border-radius:4px;position:relative}
.question-block::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:#3a3530;border-radius:3px 0 0 3px}
.q-header{display:flex;gap:1rem;align-items:flex-start;margin-bottom:1.25rem}
.q-num{font-family:'IBM Plex Mono',monospace;font-size:0.65rem;background:#1a1814;color:#c0392b;padding:3px 8px;border:1px solid #c0392b;flex-shrink:0;letter-spacing:0.1em;border-radius:2px;margin-top:2px}
.q-text{font-size:1rem;line-height:1.55;color:#e8e4d8;font-weight:500}
.options{display:flex;flex-direction:column;gap:0.6rem}
.opt-btn{background:#141210;border:1px solid #2a2520;color:#aaa09a;padding:0.7rem 1rem;cursor:pointer;display:flex;align-items:center;gap:0.75rem;transition:all 0.18s;border-radius:3px;text-align:left;width:100%;font-family:'Figtree',sans-serif;font-size:0.9rem}
.opt-btn:hover:not(:disabled){border-color:#c0392b;color:#e8e4d8}
.opt-key{font-family:'IBM Plex Mono',monospace;font-size:0.7rem;font-weight:600;width:24px;height:24px;display:flex;align-items:center;justify-content:center;border:1px solid #3a3530;border-radius:2px;flex-shrink:0}
.opt-btn.correct{background:#0d2618;border-color:#2d6a4f;color:#52b788}
.opt-btn.wrong{background:#2d0a0a;border-color:#c0392b;color:#e57373}
.opt-btn:disabled{cursor:default}
.explanation{display:none;margin-top:1rem;padding:0.75rem;background:#1a1814;border-left:3px solid #b8860b;font-size:0.85rem;color:#c9b89a;line-height:1.6;border-radius:0 3px 3px 0}
#final-result{display:none;background:#0d2618;border:1px solid #2d6a4f;padding:2rem;text-align:center;margin-top:2rem;border-radius:4px}
.pct{font-family:'DM Serif Display',serif;font-size:3.5rem;color:#52b788;display:block}
.grade{font-size:1.1rem;color:#e8e4d8;margin-top:0.5rem;display:block}
.summary{font-family:'IBM Plex Mono',monospace;font-size:0.75rem;color:#6b6456;display:block;margin-top:0.5rem}
</style></head><body>
<div class="page">
<div class="hero">
<div class="eyebrow">// KNOWLEDGE ASSESSMENT · VidVault AI</div>
<h1>${escHtml(data.title)} <em>Quiz</em></h1>
<div class="meta">${escHtml(data.videoTitle)}${data.channelName ? ' · ' + escHtml(data.channelName) : ''} · Generated ${data.generatedAt}</div>
</div>
<div class="score-bar">
<div><div class="score-label">Score</div><div id="score-display">0/0</div></div>
<div><div class="score-label">Questions</div><div style="font-family:'DM Serif Display',serif;font-size:1.6rem;color:#b8860b"><span id="total-count">0</span></div></div>
</div>
${qs}
<div id="final-result"><span class="pct"></span><span class="grade"></span><span class="summary"></span></div>
</div>
${QUIZ_JS}</body></html>`;
}

// Template 2 — Neon Cyberpunk
export function quizTemplate2(data: QuizExportData): string {
  const qs = quizQuestionsHtml(data.questions, 2);
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escHtml(data.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Share+Tech+Mono&family=Exo+2:wght@300;400;500&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Exo 2',sans-serif;background:#050510;color:#e0e0ff;min-height:100vh;padding:2rem 1rem}
body::before{content:'';position:fixed;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,255,255,0.015) 2px,rgba(0,255,255,0.015) 4px);pointer-events:none}
.page{max-width:820px;margin:0 auto}
.hero{background:linear-gradient(135deg,#0a0a2e,#0d0d30);border:1px solid #00ffff33;border-top:2px solid #00ffff;padding:2rem;margin-bottom:2rem;position:relative;overflow:hidden}
.hero::after{content:'';position:absolute;bottom:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,#00ffff,transparent)}
.eyebrow{font-family:'Share Tech Mono',monospace;font-size:0.65rem;letter-spacing:0.4em;color:#00ffff88;margin-bottom:0.75rem}
h1{font-family:'Orbitron',monospace;font-size:1.8rem;color:#fff;line-height:1.2;text-shadow:0 0 20px #00ffff55}
h1 span{color:#00ffff}
.meta{font-family:'Share Tech Mono',monospace;font-size:0.7rem;color:#5555aa;margin-top:0.75rem}
.score-bar{background:#0a0a2e;border:1px solid #00ffff22;padding:1rem 1.5rem;display:flex;gap:2rem;margin-bottom:2rem;align-items:center}
.score-label{font-family:'Share Tech Mono',monospace;font-size:0.65rem;text-transform:uppercase;letter-spacing:0.2em;color:#5555aa}
#score-display{font-family:'Orbitron',monospace;font-size:1.8rem;color:#00ffff;text-shadow:0 0 15px #00ffff88}
.question-block{background:#0a0a2e;border:1px solid #1a1a50;padding:1.5rem;margin-bottom:1rem;position:relative}
.question-block::before{content:'';position:absolute;left:0;top:0;bottom:0;width:2px;background:linear-gradient(180deg,#00ffff,#7b2fff)}
.q-header{display:flex;gap:1rem;align-items:flex-start;margin-bottom:1.25rem}
.q-num{font-family:'Orbitron',monospace;font-size:0.6rem;background:#00ffff15;color:#00ffff;padding:3px 8px;border:1px solid #00ffff44;flex-shrink:0;margin-top:2px}
.q-text{font-size:0.95rem;line-height:1.55;color:#c0c0e8;font-weight:400}
.options{display:flex;flex-direction:column;gap:0.5rem}
.opt-btn{background:#080820;border:1px solid #1a1a50;color:#8080bb;padding:0.7rem 1rem;cursor:pointer;display:flex;align-items:center;gap:0.75rem;transition:all 0.15s;text-align:left;width:100%;font-family:'Exo 2',sans-serif;font-size:0.875rem}
.opt-btn:hover:not(:disabled){border-color:#00ffff66;color:#e0e0ff;box-shadow:0 0 12px #00ffff22}
.opt-key{font-family:'Orbitron',monospace;font-size:0.6rem;width:26px;height:26px;display:flex;align-items:center;justify-content:center;border:1px solid #2a2a60;flex-shrink:0;color:#7b2fff}
.opt-btn.correct{background:#001a15;border-color:#00ff88;color:#00ff88;box-shadow:0 0 12px #00ff8833}
.opt-btn.wrong{background:#1a0000;border-color:#ff3366;color:#ff3366}
.opt-btn:disabled{cursor:default}
.explanation{display:none;margin-top:1rem;padding:0.75rem;background:#0d0d30;border-left:2px solid #f0c040;font-size:0.82rem;color:#aaa0cc;line-height:1.6}
#final-result{display:none;background:#0a0a2e;border:2px solid #00ffff44;padding:2rem;text-align:center;margin-top:2rem;box-shadow:0 0 40px #00ffff22}
.pct{font-family:'Orbitron',monospace;font-size:3.5rem;color:#00ffff;display:block;text-shadow:0 0 30px #00ffff}
.grade,.summary{display:block;color:#c0c0e8;margin-top:0.5rem}
</style></head><body>
<div class="page">
<div class="hero">
<div class="eyebrow">[ VIDVAULT_AI :: ASSESSMENT_MODULE ]</div>
<h1>${escHtml(data.title)} <span>QUIZ</span></h1>
<div class="meta">SRC: ${escHtml(data.videoTitle)} · TIMESTAMP: ${data.generatedAt}</div>
</div>
<div class="score-bar">
<div><div class="score-label">SCORE</div><div id="score-display">0/0</div></div>
<div><div class="score-label">TOTAL</div><div style="font-family:'Orbitron',monospace;font-size:1.8rem;color:#7b2fff"><span id="total-count">0</span></div></div>
</div>
${qs}
<div id="final-result"><span class="pct"></span><span class="grade" style="font-family:'Orbitron',monospace;font-size:1.1rem"></span><span class="summary" style="font-family:'Share Tech Mono',monospace;font-size:0.75rem;color:#5555aa;margin-top:0.5rem"></span></div>
</div>
${QUIZ_JS}</body></html>`;
}

// Template 3 — Paper / Notebook
export function quizTemplate3(data: QuizExportData): string {
  const qs = quizQuestionsHtml(data.questions, 3);
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escHtml(data.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Source+Code+Pro:wght@400;600&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;background:#e8e4d8;min-height:100vh;padding:2rem 1rem}
.page{max-width:800px;margin:0 auto;background:#faf8f3;box-shadow:0 8px 48px rgba(0,0,0,0.18);padding:3rem;position:relative}
.page::before{content:'';position:absolute;left:3rem;top:0;bottom:0;width:1px;background:#e0d8c8}
.hero{border-bottom:2px solid #1a1814;padding-bottom:1.5rem;margin-bottom:2rem}
.eyebrow{font-family:'Source Code Pro',monospace;font-size:0.65rem;letter-spacing:0.25em;text-transform:uppercase;color:#8a7a6a;margin-bottom:0.75rem}
h1{font-family:'Lora',serif;font-size:2rem;color:#1a1814;line-height:1.2}
h1 em{color:#c0392b;font-style:italic}
.meta{font-family:'Source Code Pro',monospace;font-size:0.72rem;color:#8a7a6a;margin-top:0.75rem}
.score-bar{background:#f0ece0;border:1px solid #ddd8cc;padding:0.9rem 1.25rem;display:flex;gap:2rem;margin-bottom:2rem;border-radius:2px}
.score-label{font-family:'Source Code Pro',monospace;font-size:0.65rem;text-transform:uppercase;letter-spacing:0.15em;color:#8a7a6a}
#score-display{font-family:'Lora',serif;font-size:1.6rem;color:#c0392b}
.question-block{border:1px solid #ddd8cc;padding:1.5rem;margin-bottom:1rem;background:#fff;border-radius:2px;position:relative}
.q-header{display:flex;gap:1rem;align-items:flex-start;margin-bottom:1.25rem}
.q-num{font-family:'Source Code Pro',monospace;font-size:0.65rem;background:#1a1814;color:#faf8f3;padding:3px 8px;flex-shrink:0;border-radius:2px;margin-top:3px}
.q-text{font-family:'Lora',serif;font-size:1rem;line-height:1.6;color:#1a1814}
.options{display:flex;flex-direction:column;gap:0.5rem}
.opt-btn{background:#faf8f3;border:1px solid #ddd8cc;color:#5a5345;padding:0.65rem 1rem;cursor:pointer;display:flex;align-items:center;gap:0.75rem;transition:all 0.15s;text-align:left;width:100%;font-family:'Inter',sans-serif;font-size:0.88rem;border-radius:2px}
.opt-btn:hover:not(:disabled){border-color:#1a1814;color:#1a1814}
.opt-key{font-family:'Source Code Pro',monospace;font-size:0.7rem;width:24px;height:24px;display:flex;align-items:center;justify-content:center;border:1px solid #ddd8cc;flex-shrink:0;border-radius:2px}
.opt-btn.correct{background:#f0fdf4;border-color:#2d6a4f;color:#1a4731}
.opt-btn.wrong{background:#fef2f2;border-color:#c0392b;color:#7f1d1d}
.opt-btn:disabled{cursor:default}
.explanation{display:none;margin-top:1rem;padding:0.75rem;background:#fff9e6;border-left:3px solid #b8860b;font-size:0.85rem;color:#5a5345;line-height:1.6;border-radius:0 2px 2px 0}
#final-result{display:none;background:#f0fdf4;border:1px solid #2d6a4f;padding:2rem;text-align:center;margin-top:2rem;border-radius:2px}
.pct{font-family:'Lora',serif;font-size:3.5rem;color:#1a4731;display:block}
.grade,.summary{display:block;color:#1a1814;margin-top:0.5rem}
</style></head><body>
<div class="page">
<div class="hero">
<div class="eyebrow">VidVault AI — Knowledge Assessment</div>
<h1>${escHtml(data.title)} <em>Quiz</em></h1>
<div class="meta">${escHtml(data.videoTitle)} · ${data.generatedAt}</div>
</div>
<div class="score-bar">
<div><div class="score-label">Score</div><div id="score-display">—</div></div>
<div><div class="score-label">Questions</div><div style="font-family:'Lora',serif;font-size:1.6rem;color:#1a3a5c"><span id="total-count">0</span></div></div>
</div>
${qs}
<div id="final-result"><span class="pct"></span><span class="grade"></span><span class="summary" style="font-family:'Source Code Pro',monospace;font-size:0.72rem;color:#8a7a6a;margin-top:0.5rem"></span></div>
</div>
${QUIZ_JS}</body></html>`;
}

// Template 4 — Brutalist Dark (matches VidVault theme)
export function quizTemplate4(data: QuizExportData): string {
  const qs = quizQuestionsHtml(data.questions, 4);
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escHtml(data.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Alegreya+Sans+SC:wght@800;900&family=JetBrains+Mono:wght@400;600&family=Raleway:wght@400;500;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Raleway',sans-serif;background:#09090c;color:#e0e0e0;min-height:100vh;padding:2rem 1rem}
body::before{content:'';position:fixed;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 39px,rgba(255,255,255,0.025) 39px,rgba(255,255,255,0.025) 40px),repeating-linear-gradient(90deg,transparent,transparent 39px,rgba(255,255,255,0.025) 39px,rgba(255,255,255,0.025) 40px);pointer-events:none}
.page{max-width:820px;margin:0 auto;position:relative}
.hero{background:#0d0d11;border:1px solid rgba(255,255,255,0.07);border-left:4px solid #8b5cf6;padding:2rem;margin-bottom:2rem}
.eyebrow{font-family:'JetBrains Mono',monospace;font-size:0.6rem;letter-spacing:0.3em;text-transform:uppercase;color:#444;margin-bottom:0.75rem}
h1{font-family:'Alegreya Sans SC',serif;font-size:2.5rem;color:#fff;line-height:1.1;letter-spacing:-0.02em}
h1 em{color:#8b5cf6;font-style:italic}
.meta{font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:#444;margin-top:0.75rem}
.score-bar{background:#0d0d11;border:1px solid rgba(255,255,255,0.06);padding:1rem 1.5rem;display:flex;gap:2rem;margin-bottom:2rem;align-items:center}
.score-label{font-family:'JetBrains Mono',monospace;font-size:0.6rem;text-transform:uppercase;letter-spacing:0.2em;color:#444}
#score-display{font-family:'Alegreya Sans SC',serif;font-size:1.8rem;color:#8b5cf6}
.question-block{background:#0d0d11;border:1px solid rgba(255,255,255,0.06);padding:1.5rem;margin-bottom:0.75rem;position:relative}
.question-block::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:#8b5cf6;opacity:0.4}
.q-header{display:flex;gap:1rem;align-items:flex-start;margin-bottom:1.25rem}
.q-num{font-family:'JetBrains Mono',monospace;font-size:0.6rem;background:rgba(139,92,246,0.1);color:#8b5cf6;padding:3px 8px;border:1px solid rgba(139,92,246,0.3);flex-shrink:0;margin-top:2px}
.q-text{font-size:0.95rem;line-height:1.55;color:#c0c0d0;font-weight:500}
.options{display:flex;flex-direction:column;gap:0.5rem}
.opt-btn{background:#111115;border:1px solid rgba(255,255,255,0.06);color:#666;padding:0.7rem 1rem;cursor:pointer;display:flex;align-items:center;gap:0.75rem;transition:all 0.15s;text-align:left;width:100%;font-family:'Raleway',sans-serif;font-size:0.875rem;clip-path:polygon(0 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%)}
.opt-btn:hover:not(:disabled){border-color:rgba(139,92,246,0.4);color:#c0c0d0}
.opt-key{font-family:'JetBrains Mono',monospace;font-size:0.65rem;width:24px;height:24px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,0.1);flex-shrink:0;background:rgba(255,255,255,0.03)}
.opt-btn.correct{background:#0d2618;border-color:#22c55e;color:#4ade80}
.opt-btn.wrong{background:#1a0a0a;border-color:#ef4444;color:#f87171}
.opt-btn:disabled{cursor:default}
.explanation{display:none;margin-top:1rem;padding:0.75rem;background:#0d0d11;border-left:3px solid #f59e0b;font-size:0.82rem;color:#999;line-height:1.6;font-family:'JetBrains Mono',monospace;font-size:0.75rem}
#final-result{display:none;background:#0d0d11;border:1px solid rgba(139,92,246,0.3);padding:2rem;text-align:center;margin-top:2rem}
.pct{font-family:'Alegreya Sans SC',serif;font-size:4rem;color:#8b5cf6;display:block}
.grade{font-family:'JetBrains Mono',monospace;font-size:0.85rem;color:#c0c0d0;display:block;margin-top:0.5rem;letter-spacing:0.1em}
.summary{font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:#444;display:block;margin-top:0.5rem}
</style></head><body>
<div class="page">
<div class="hero">
<div class="eyebrow">// VIDVAULT_AI · ASSESSMENT</div>
<h1>${escHtml(data.title)} <em>Quiz</em></h1>
<div class="meta">${escHtml(data.videoTitle)}${data.channelName ? ' · ' + escHtml(data.channelName) : ''} · ${data.generatedAt}</div>
</div>
<div class="score-bar">
<div><div class="score-label">Score</div><div id="score-display">–/–</div></div>
<div><div class="score-label">Total</div><div style="font-family:'Alegreya Sans SC',serif;font-size:1.8rem;color:#a78bfa"><span id="total-count">0</span></div></div>
</div>
${qs}
<div id="final-result"><span class="pct"></span><span class="grade"></span><span class="summary"></span></div>
</div>
${QUIZ_JS}</body></html>`;
}

// Template 5 — Ocean Blue
export function quizTemplate5(data: QuizExportData): string {
  const qs = quizQuestionsHtml(data.questions, 5);
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escHtml(data.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Fira+Code:wght@400;500&family=Nunito:wght@300;400;600;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Nunito',sans-serif;background:linear-gradient(135deg,#0a1628,#0d2545,#0a1628);min-height:100vh;padding:2rem 1rem;color:#b8d4f0}
.page{max-width:820px;margin:0 auto}
.hero{background:rgba(255,255,255,0.05);backdrop-filter:blur(20px);border:1px solid rgba(100,180,255,0.15);border-top:3px solid #4aa8ff;padding:2rem;margin-bottom:2rem;border-radius:8px}
.eyebrow{font-family:'Fira Code',monospace;font-size:0.62rem;letter-spacing:0.3em;text-transform:uppercase;color:#4a8abf88;margin-bottom:0.75rem}
h1{font-family:'Playfair Display',serif;font-size:2.1rem;color:#e8f4ff;line-height:1.2}
h1 em{color:#4aa8ff;font-style:italic}
.meta{font-family:'Fira Code',monospace;font-size:0.68rem;color:#4a8abf88;margin-top:0.75rem}
.score-bar{background:rgba(255,255,255,0.04);border:1px solid rgba(100,180,255,0.1);padding:1rem 1.5rem;display:flex;gap:2rem;margin-bottom:2rem;border-radius:6px;align-items:center}
.score-label{font-family:'Fira Code',monospace;font-size:0.62rem;text-transform:uppercase;letter-spacing:0.15em;color:#4a8abf88}
#score-display{font-family:'Playfair Display',serif;font-size:1.8rem;color:#4aa8ff}
.question-block{background:rgba(255,255,255,0.04);border:1px solid rgba(100,180,255,0.1);padding:1.5rem;margin-bottom:1rem;border-radius:6px;border-left:3px solid #4aa8ff44}
.q-header{display:flex;gap:1rem;align-items:flex-start;margin-bottom:1.25rem}
.q-num{font-family:'Fira Code',monospace;font-size:0.62rem;background:rgba(74,168,255,0.15);color:#4aa8ff;padding:3px 8px;border:1px solid rgba(74,168,255,0.3);flex-shrink:0;border-radius:20px;margin-top:3px}
.q-text{font-size:0.95rem;line-height:1.6;color:#c8dcf0;font-weight:400}
.options{display:flex;flex-direction:column;gap:0.5rem}
.opt-btn{background:rgba(255,255,255,0.03);border:1px solid rgba(100,180,255,0.1);color:#7099bb;padding:0.7rem 1rem;cursor:pointer;display:flex;align-items:center;gap:0.75rem;transition:all 0.18s;text-align:left;width:100%;font-family:'Nunito',sans-serif;font-size:0.9rem;border-radius:5px}
.opt-btn:hover:not(:disabled){border-color:rgba(74,168,255,0.4);color:#c8dcf0;background:rgba(74,168,255,0.08)}
.opt-key{font-family:'Fira Code',monospace;font-size:0.65rem;width:26px;height:26px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(100,180,255,0.2);flex-shrink:0;border-radius:50%;color:#4aa8ff}
.opt-btn.correct{background:rgba(0,200,100,0.1);border-color:rgba(0,200,100,0.5);color:#4ade80}
.opt-btn.wrong{background:rgba(255,80,80,0.08);border-color:rgba(255,80,80,0.4);color:#f87171}
.opt-btn:disabled{cursor:default}
.explanation{display:none;margin-top:1rem;padding:0.75rem;background:rgba(245,158,11,0.08);border-left:3px solid #f59e0b;font-size:0.83rem;color:#a09070;line-height:1.6;border-radius:0 4px 4px 0}
#final-result{display:none;background:rgba(74,168,255,0.08);border:1px solid rgba(74,168,255,0.3);padding:2rem;text-align:center;margin-top:2rem;border-radius:8px}
.pct{font-family:'Playfair Display',serif;font-size:3.5rem;color:#4aa8ff;display:block}
.grade,.summary{display:block;color:#b8d4f0;margin-top:0.5rem}
</style></head><body>
<div class="page">
<div class="hero">
<div class="eyebrow">VidVault AI · Assessment</div>
<h1>${escHtml(data.title)} <em>Quiz</em></h1>
<div class="meta">${escHtml(data.videoTitle)} · ${data.generatedAt}</div>
</div>
<div class="score-bar">
<div><div class="score-label">Score</div><div id="score-display">–</div></div>
<div><div class="score-label">Questions</div><div style="font-family:'Playfair Display',serif;font-size:1.8rem;color:#60a5fa"><span id="total-count">0</span></div></div>
</div>
${qs}
<div id="final-result"><span class="pct"></span><span class="grade"></span><span class="summary" style="font-family:'Fira Code',monospace;font-size:0.7rem;color:#4a8abf88;margin-top:0.5rem"></span></div>
</div>
${QUIZ_JS}</body></html>`;
}

// Template 6 — Forest/Emerald
export function quizTemplate6(data: QuizExportData): string {
  const qs = quizQuestionsHtml(data.questions, 6);
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escHtml(data.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'DM Sans',sans-serif;background:#0d1f0d;color:#c0d8b8;min-height:100vh;padding:2rem 1rem}
.page{max-width:820px;margin:0 auto}
.hero{background:#112011;border:1px solid rgba(100,200,100,0.15);border-left:4px solid #22c55e;padding:2rem;margin-bottom:2rem;border-radius:3px}
.eyebrow{font-family:'Space Mono',monospace;font-size:0.62rem;letter-spacing:0.3em;text-transform:uppercase;color:#2d6a2d;margin-bottom:0.75rem}
h1{font-family:'Cormorant Garamond',serif;font-size:2.5rem;color:#e0f0d8;line-height:1.15;font-weight:700}
h1 em{color:#4ade80;font-style:italic}
.meta{font-family:'Space Mono',monospace;font-size:0.65rem;color:#2d6a2d;margin-top:0.75rem}
.score-bar{background:#112011;border:1px solid rgba(100,200,100,0.1);padding:1rem 1.5rem;display:flex;gap:2rem;margin-bottom:2rem;align-items:center;border-radius:3px}
.score-label{font-family:'Space Mono',monospace;font-size:0.62rem;text-transform:uppercase;letter-spacing:0.15em;color:#2d6a2d}
#score-display{font-family:'Cormorant Garamond',serif;font-size:1.8rem;color:#4ade80;font-weight:700}
.question-block{background:#112011;border:1px solid rgba(100,200,100,0.1);padding:1.5rem;margin-bottom:0.75rem;border-radius:3px;position:relative}
.question-block::before{content:'';position:absolute;top:1.5rem;left:0;height:calc(100% - 3rem);width:2px;background:linear-gradient(180deg,#22c55e,transparent)}
.q-header{display:flex;gap:1rem;align-items:flex-start;margin-bottom:1.25rem}
.q-num{font-family:'Space Mono',monospace;font-size:0.6rem;background:rgba(34,197,94,0.12);color:#4ade80;padding:3px 8px;border:1px solid rgba(34,197,94,0.3);flex-shrink:0;border-radius:2px;margin-top:2px}
.q-text{font-family:'Cormorant Garamond',serif;font-size:1.05rem;line-height:1.55;color:#c0d8b8;font-weight:600}
.options{display:flex;flex-direction:column;gap:0.5rem}
.opt-btn{background:#0d1f0d;border:1px solid rgba(100,200,100,0.1);color:#5a8a5a;padding:0.7rem 1rem;cursor:pointer;display:flex;align-items:center;gap:0.75rem;transition:all 0.18s;text-align:left;width:100%;font-family:'DM Sans',sans-serif;font-size:0.88rem;border-radius:2px}
.opt-btn:hover:not(:disabled){border-color:rgba(34,197,94,0.4);color:#c0d8b8}
.opt-key{font-family:'Space Mono',monospace;font-size:0.65rem;width:24px;height:24px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(100,200,100,0.2);flex-shrink:0;border-radius:2px;color:#22c55e}
.opt-btn.correct{background:#0a2a10;border-color:#22c55e;color:#4ade80}
.opt-btn.wrong{background:#2a0a0a;border-color:#ef4444;color:#f87171}
.opt-btn:disabled{cursor:default}
.explanation{display:none;margin-top:1rem;padding:0.75rem;background:#0a1a0a;border-left:2px solid #86efac;font-size:0.83rem;color:#7aaa7a;line-height:1.6;border-radius:0 2px 2px 0}
#final-result{display:none;background:#112011;border:1px solid rgba(34,197,94,0.3);padding:2rem;text-align:center;margin-top:2rem;border-radius:3px}
.pct{font-family:'Cormorant Garamond',serif;font-size:4rem;color:#4ade80;display:block;font-weight:700}
.grade,.summary{display:block;color:#c0d8b8;margin-top:0.5rem}
</style></head><body>
<div class="page">
<div class="hero">
<div class="eyebrow">VidVault AI · Quiz</div>
<h1>${escHtml(data.title)} <em>Quiz</em></h1>
<div class="meta">${escHtml(data.videoTitle)} · ${data.generatedAt}</div>
</div>
<div class="score-bar">
<div><div class="score-label">Score</div><div id="score-display">–</div></div>
<div><div class="score-label">Questions</div><div style="font-family:'Cormorant Garamond',serif;font-size:1.8rem;color:#86efac;font-weight:700"><span id="total-count">0</span></div></div>
</div>
${qs}
<div id="final-result"><span class="pct"></span><span class="grade"></span><span class="summary" style="font-family:'Space Mono',monospace;font-size:0.65rem;color:#2d6a2d;margin-top:0.5rem"></span></div>
</div>
${QUIZ_JS}</body></html>`;
}

// Template 7 — Sunrise/Warm Gradient
export function quizTemplate7(data: QuizExportData): string {
  const qs = quizQuestionsHtml(data.questions, 7);
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escHtml(data.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,700;0,900;1,700&family=Roboto+Mono:wght@400;600&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Plus Jakarta Sans',sans-serif;background:linear-gradient(160deg,#1a0a00,#2a1000,#1a0505);min-height:100vh;padding:2rem 1rem;color:#f0d0b0}
.page{max-width:820px;margin:0 auto}
.hero{background:rgba(255,150,50,0.07);border:1px solid rgba(255,150,50,0.2);border-top:3px solid #f97316;padding:2rem;margin-bottom:2rem;border-radius:6px}
.eyebrow{font-family:'Roboto Mono',monospace;font-size:0.62rem;letter-spacing:0.3em;text-transform:uppercase;color:#9a5a2a88;margin-bottom:0.75rem}
h1{font-family:'Fraunces',serif;font-size:2.3rem;color:#fff0e0;line-height:1.15}
h1 em{color:#fb923c;font-style:italic}
.meta{font-family:'Roboto Mono',monospace;font-size:0.65rem;color:#9a5a2a;margin-top:0.75rem}
.score-bar{background:rgba(255,150,50,0.05);border:1px solid rgba(255,150,50,0.15);padding:1rem 1.5rem;display:flex;gap:2rem;margin-bottom:2rem;border-radius:4px;align-items:center}
.score-label{font-family:'Roboto Mono',monospace;font-size:0.62rem;text-transform:uppercase;letter-spacing:0.15em;color:#9a5a2a}
#score-display{font-family:'Fraunces',serif;font-size:1.8rem;color:#fb923c}
.question-block{background:rgba(255,150,50,0.04);border:1px solid rgba(255,150,50,0.12);padding:1.5rem;margin-bottom:1rem;border-radius:4px;border-left:3px solid rgba(249,115,22,0.5)}
.q-header{display:flex;gap:1rem;align-items:flex-start;margin-bottom:1.25rem}
.q-num{font-family:'Roboto Mono',monospace;font-size:0.6rem;background:rgba(249,115,22,0.15);color:#fb923c;padding:3px 8px;border:1px solid rgba(249,115,22,0.3);flex-shrink:0;border-radius:20px;margin-top:2px}
.q-text{font-size:0.95rem;line-height:1.6;color:#e0c0a0;font-weight:500}
.options{display:flex;flex-direction:column;gap:0.5rem}
.opt-btn{background:rgba(0,0,0,0.2);border:1px solid rgba(255,150,50,0.12);color:#a07050;padding:0.7rem 1rem;cursor:pointer;display:flex;align-items:center;gap:0.75rem;transition:all 0.18s;text-align:left;width:100%;font-family:'Plus Jakarta Sans',sans-serif;font-size:0.88rem;border-radius:4px}
.opt-btn:hover:not(:disabled){border-color:rgba(249,115,22,0.4);color:#f0d0b0}
.opt-key{font-family:'Roboto Mono',monospace;font-size:0.65rem;width:26px;height:26px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,150,50,0.2);flex-shrink:0;border-radius:50%;color:#fb923c}
.opt-btn.correct{background:rgba(0,150,80,0.15);border-color:rgba(74,222,128,0.5);color:#4ade80}
.opt-btn.wrong{background:rgba(200,50,50,0.15);border-color:rgba(248,113,113,0.5);color:#f87171}
.opt-btn:disabled{cursor:default}
.explanation{display:none;margin-top:1rem;padding:0.75rem;background:rgba(255,220,100,0.07);border-left:3px solid #fbbf24;font-size:0.83rem;color:#c0a060;line-height:1.6;border-radius:0 4px 4px 0}
#final-result{display:none;background:rgba(255,150,50,0.08);border:1px solid rgba(249,115,22,0.3);padding:2rem;text-align:center;margin-top:2rem;border-radius:6px}
.pct{font-family:'Fraunces',serif;font-size:3.5rem;color:#fb923c;display:block}
.grade,.summary{display:block;color:#f0d0b0;margin-top:0.5rem}
</style></head><body>
<div class="page">
<div class="hero">
<div class="eyebrow">VidVault AI · Assessment</div>
<h1>${escHtml(data.title)} <em>Quiz</em></h1>
<div class="meta">${escHtml(data.videoTitle)} · ${data.generatedAt}</div>
</div>
<div class="score-bar">
<div><div class="score-label">Score</div><div id="score-display">–</div></div>
<div><div class="score-label">Questions</div><div style="font-family:'Fraunces',serif;font-size:1.8rem;color:#fdba74"><span id="total-count">0</span></div></div>
</div>
${qs}
<div id="final-result"><span class="pct"></span><span class="grade"></span><span class="summary" style="font-family:'Roboto Mono',monospace;font-size:0.65rem;color:#9a5a2a;margin-top:0.5rem"></span></div>
</div>
${QUIZ_JS}</body></html>`;
}

// Template 8 — Minimal / Bauhaus
export function quizTemplate8(data: QuizExportData): string {
  const qs = quizQuestionsHtml(data.questions, 8);
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escHtml(data.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Space Grotesk',sans-serif;background:#f5f5f5;color:#111;min-height:100vh;padding:2rem 1rem}
.page{max-width:760px;margin:0 auto;background:#fff;padding:3rem;box-shadow:0 2px 24px rgba(0,0,0,0.08)}
.hero{border-top:4px solid #111;padding-top:1.5rem;margin-bottom:2rem;padding-bottom:1.5rem;border-bottom:1px solid #eee}
.eyebrow{font-family:'Space Mono',monospace;font-size:0.65rem;letter-spacing:0.35em;text-transform:uppercase;color:#999;margin-bottom:0.75rem}
h1{font-size:2.5rem;font-weight:700;line-height:1.1;color:#111;letter-spacing:-0.04em}
h1 em{font-style:normal;color:#e11d48}
.meta{font-family:'Space Mono',monospace;font-size:0.65rem;color:#999;margin-top:0.75rem}
.score-bar{display:flex;gap:3rem;margin-bottom:2rem;padding:1rem 0;border-bottom:1px solid #eee}
.score-label{font-family:'Space Mono',monospace;font-size:0.6rem;text-transform:uppercase;letter-spacing:0.2em;color:#999;display:block;margin-bottom:0.25rem}
#score-display{font-size:2rem;font-weight:700;color:#e11d48;letter-spacing:-0.03em}
.question-block{border-top:1px solid #eee;padding:1.5rem 0;margin-bottom:0}
.q-header{display:flex;gap:1.25rem;align-items:flex-start;margin-bottom:1.25rem}
.q-num{font-family:'Space Mono',monospace;font-size:0.6rem;background:#111;color:#fff;padding:3px 8px;flex-shrink:0;margin-top:3px;letter-spacing:0.05em}
.q-text{font-size:1rem;line-height:1.55;color:#111;font-weight:500}
.options{display:flex;flex-direction:column;gap:0.4rem}
.opt-btn{background:#f9f9f9;border:1px solid #e5e5e5;color:#666;padding:0.65rem 1rem;cursor:pointer;display:flex;align-items:center;gap:0.75rem;transition:all 0.15s;text-align:left;width:100%;font-family:'Space Grotesk',sans-serif;font-size:0.9rem}
.opt-btn:hover:not(:disabled){border-color:#111;color:#111}
.opt-key{font-family:'Space Mono',monospace;font-size:0.65rem;width:24px;height:24px;display:flex;align-items:center;justify-content:center;border:1px solid #ddd;flex-shrink:0;font-weight:700}
.opt-btn.correct{background:#f0fdf4;border-color:#16a34a;color:#15803d}
.opt-btn.wrong{background:#fff1f2;border-color:#e11d48;color:#be123c}
.opt-btn:disabled{cursor:default}
.explanation{display:none;margin-top:1rem;padding:0.75rem 1rem;background:#fffbeb;border-left:3px solid #f59e0b;font-size:0.85rem;color:#78716c;line-height:1.6}
#final-result{display:none;border-top:4px solid #111;padding:2rem 0;text-align:center;margin-top:2rem}
.pct{font-size:4rem;font-weight:700;color:#e11d48;display:block;letter-spacing:-0.04em}
.grade{font-size:1rem;color:#111;display:block;margin-top:0.5rem;font-weight:500}
.summary{font-family:'Space Mono',monospace;font-size:0.65rem;color:#999;display:block;margin-top:0.5rem}
</style></head><body>
<div class="page">
<div class="hero">
<div class="eyebrow">VidVault AI — Quiz</div>
<h1>${escHtml(data.title)} <em>Quiz</em></h1>
<div class="meta">${escHtml(data.videoTitle)} · ${data.generatedAt}</div>
</div>
<div class="score-bar">
<div><span class="score-label">Score</span><div id="score-display">—</div></div>
<div><span class="score-label">Questions</span><div style="font-size:2rem;font-weight:700;letter-spacing:-0.03em"><span id="total-count">0</span></div></div>
</div>
${qs}
<div id="final-result"><span class="pct"></span><span class="grade"></span><span class="summary"></span></div>
</div>
${QUIZ_JS}</body></html>`;
}

// Template 9 — Purple Galaxy
export function quizTemplate9(data: QuizExportData): string {
  const qs = quizQuestionsHtml(data.questions, 9);
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escHtml(data.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Fira+Code:wght@400;500&family=Raleway:wght@300;400;500&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Raleway',sans-serif;background:radial-gradient(ellipse at top,#1a0a2e 0%,#0a0015 50%,#050010 100%);min-height:100vh;padding:2rem 1rem;color:#c8b0f0}
.page{max-width:820px;margin:0 auto}
.hero{background:rgba(139,92,246,0.07);border:1px solid rgba(139,92,246,0.2);border-top:2px solid #8b5cf6;padding:2rem;margin-bottom:2rem;border-radius:6px;position:relative;overflow:hidden}
.hero::before{content:'✦';position:absolute;right:2rem;top:1rem;font-size:4rem;color:rgba(139,92,246,0.08)}
.eyebrow{font-family:'Fira Code',monospace;font-size:0.62rem;letter-spacing:0.35em;text-transform:uppercase;color:#6040a8;margin-bottom:0.75rem}
h1{font-family:'Cinzel',serif;font-size:2rem;color:#e8d8ff;line-height:1.2;letter-spacing:0.02em}
h1 em{color:#a78bfa;font-style:italic}
.meta{font-family:'Fira Code',monospace;font-size:0.65rem;color:#6040a8;margin-top:0.75rem}
.score-bar{background:rgba(139,92,246,0.05);border:1px solid rgba(139,92,246,0.15);padding:1rem 1.5rem;display:flex;gap:2rem;margin-bottom:2rem;border-radius:4px;align-items:center}
.score-label{font-family:'Fira Code',monospace;font-size:0.6rem;text-transform:uppercase;letter-spacing:0.2em;color:#6040a8}
#score-display{font-family:'Cinzel',serif;font-size:1.8rem;color:#a78bfa}
.question-block{background:rgba(139,92,246,0.04);border:1px solid rgba(139,92,246,0.12);padding:1.5rem;margin-bottom:1rem;border-radius:4px;position:relative;overflow:hidden}
.question-block::after{content:'';position:absolute;right:-20px;top:-20px;width:80px;height:80px;background:radial-gradient(circle,rgba(139,92,246,0.08),transparent);border-radius:50%}
.q-header{display:flex;gap:1rem;align-items:flex-start;margin-bottom:1.25rem}
.q-num{font-family:'Fira Code',monospace;font-size:0.6rem;background:rgba(139,92,246,0.15);color:#a78bfa;padding:3px 8px;border:1px solid rgba(139,92,246,0.3);flex-shrink:0;border-radius:3px;margin-top:2px}
.q-text{font-size:0.95rem;line-height:1.6;color:#c8b0f0;font-weight:400}
.options{display:flex;flex-direction:column;gap:0.5rem}
.opt-btn{background:rgba(0,0,0,0.3);border:1px solid rgba(139,92,246,0.12);color:#806099;padding:0.7rem 1rem;cursor:pointer;display:flex;align-items:center;gap:0.75rem;transition:all 0.18s;text-align:left;width:100%;font-family:'Raleway',sans-serif;font-size:0.88rem;border-radius:4px}
.opt-btn:hover:not(:disabled){border-color:rgba(167,139,250,0.4);color:#c8b0f0;background:rgba(139,92,246,0.1)}
.opt-key{font-family:'Fira Code',monospace;font-size:0.65rem;width:26px;height:26px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(139,92,246,0.2);flex-shrink:0;border-radius:50%;color:#a78bfa}
.opt-btn.correct{background:rgba(0,180,100,0.12);border-color:rgba(74,222,128,0.5);color:#4ade80}
.opt-btn.wrong{background:rgba(200,50,50,0.1);border-color:rgba(248,113,113,0.5);color:#f87171}
.opt-btn:disabled{cursor:default}
.explanation{display:none;margin-top:1rem;padding:0.75rem;background:rgba(245,158,11,0.07);border-left:2px solid #f59e0b;font-size:0.83rem;color:#a080c0;line-height:1.6;border-radius:0 4px 4px 0}
#final-result{display:none;background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.3);padding:2rem;text-align:center;margin-top:2rem;border-radius:6px}
.pct{font-family:'Cinzel',serif;font-size:3.5rem;color:#a78bfa;display:block}
.grade,.summary{display:block;color:#c8b0f0;margin-top:0.5rem}
</style></head><body>
<div class="page">
<div class="hero">
<div class="eyebrow">✦ VidVault AI · Cosmic Quiz ✦</div>
<h1>${escHtml(data.title)} <em>Quiz</em></h1>
<div class="meta">${escHtml(data.videoTitle)} · ${data.generatedAt}</div>
</div>
<div class="score-bar">
<div><div class="score-label">Score</div><div id="score-display">–</div></div>
<div><div class="score-label">Questions</div><div style="font-family:'Cinzel',serif;font-size:1.8rem;color:#c4b5fd"><span id="total-count">0</span></div></div>
</div>
${qs}
<div id="final-result"><span class="pct"></span><span class="grade"></span><span class="summary" style="font-family:'Fira Code',monospace;font-size:0.65rem;color:#6040a8;margin-top:0.5rem"></span></div>
</div>
${QUIZ_JS}</body></html>`;
}

// Template 10 — Corporate / Professional
export function quizTemplate10(data: QuizExportData): string {
  const qs = quizQuestionsHtml(data.questions, 10);
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escHtml(data.title)}</title>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'IBM Plex Sans',sans-serif;background:#f0f2f5;color:#1a2332;min-height:100vh;padding:2rem 1rem}
.page{max-width:820px;margin:0 auto}
.hero{background:#1a2332;color:#fff;padding:2rem;margin-bottom:2rem;border-radius:6px;display:grid;grid-template-columns:1fr auto;align-items:start;gap:1rem}
.eyebrow{font-family:'IBM Plex Mono',monospace;font-size:0.62rem;letter-spacing:0.25em;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:0.75rem}
h1{font-size:1.8rem;font-weight:700;line-height:1.2;color:#fff;letter-spacing:-0.02em}
h1 em{color:#60a5fa;font-style:normal}
.meta{font-family:'IBM Plex Mono',monospace;font-size:0.65rem;color:rgba(255,255,255,0.35);margin-top:0.75rem}
.hero-badge{background:#2563eb;padding:1rem;border-radius:4px;text-align:center;flex-shrink:0}
.hero-badge div:first-child{font-family:'IBM Plex Mono',monospace;font-size:0.55rem;text-transform:uppercase;letter-spacing:0.2em;color:rgba(255,255,255,0.5);margin-bottom:0.25rem}
.hero-badge div:last-child{font-size:1.8rem;font-weight:700;color:#fff;letter-spacing:-0.03em}
.score-bar{background:#fff;border:1px solid #e2e8f0;padding:1rem 1.5rem;display:flex;gap:2rem;margin-bottom:1.5rem;border-radius:6px;align-items:center;box-shadow:0 1px 4px rgba(0,0,0,0.06)}
.score-label{font-family:'IBM Plex Mono',monospace;font-size:0.6rem;text-transform:uppercase;letter-spacing:0.15em;color:#94a3b8}
#score-display{font-size:1.8rem;font-weight:700;color:#2563eb;letter-spacing:-0.03em}
.question-block{background:#fff;border:1px solid #e2e8f0;padding:1.5rem;margin-bottom:0.75rem;border-radius:6px;box-shadow:0 1px 4px rgba(0,0,0,0.04);border-left:3px solid #2563eb}
.q-header{display:flex;gap:1rem;align-items:flex-start;margin-bottom:1.25rem}
.q-num{font-family:'IBM Plex Mono',monospace;font-size:0.6rem;background:#eff6ff;color:#2563eb;padding:3px 8px;border:1px solid #bfdbfe;flex-shrink:0;border-radius:4px;margin-top:3px;font-weight:600}
.q-text{font-size:0.95rem;line-height:1.6;color:#1a2332;font-weight:500}
.options{display:flex;flex-direction:column;gap:0.5rem}
.opt-btn{background:#f8fafc;border:1px solid #e2e8f0;color:#64748b;padding:0.7rem 1rem;cursor:pointer;display:flex;align-items:center;gap:0.75rem;transition:all 0.15s;text-align:left;width:100%;font-family:'IBM Plex Sans',sans-serif;font-size:0.9rem;border-radius:4px}
.opt-btn:hover:not(:disabled){border-color:#2563eb;color:#1a2332;background:#eff6ff}
.opt-key{font-family:'IBM Plex Mono',monospace;font-size:0.65rem;width:26px;height:26px;display:flex;align-items:center;justify-content:center;border:1px solid #e2e8f0;flex-shrink:0;border-radius:4px;font-weight:600;color:#2563eb}
.opt-btn.correct{background:#f0fdf4;border-color:#16a34a;color:#15803d}
.opt-btn.wrong{background:#fff1f2;border-color:#dc2626;color:#b91c1c}
.opt-btn:disabled{cursor:default}
.explanation{display:none;margin-top:1rem;padding:0.75rem 1rem;background:#fffbeb;border-left:3px solid #d97706;font-size:0.85rem;color:#78716c;line-height:1.6;border-radius:0 4px 4px 0}
#final-result{display:none;background:#fff;border:1px solid #e2e8f0;padding:2rem;text-align:center;margin-top:1.5rem;border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,0.08)}
.pct{font-size:4rem;font-weight:700;color:#2563eb;display:block;letter-spacing:-0.04em}
.grade{font-size:1rem;color:#1a2332;display:block;margin-top:0.5rem;font-weight:600}
.summary{font-family:'IBM Plex Mono',monospace;font-size:0.65rem;color:#94a3b8;display:block;margin-top:0.5rem}
</style></head><body>
<div class="page">
<div class="hero">
<div>
<div class="eyebrow">VidVault AI · Knowledge Assessment</div>
<h1>${escHtml(data.title)} <em>Quiz</em></h1>
<div class="meta">${escHtml(data.videoTitle)}${data.channelName ? ' · ' + escHtml(data.channelName) : ''} · ${data.generatedAt}</div>
</div>
<div class="hero-badge"><div>Questions</div><div id="badge-total">0</div></div>
</div>
<div class="score-bar">
<div><div class="score-label">Score</div><div id="score-display">—</div></div>
<div><div class="score-label">Total</div><div style="font-size:1.8rem;font-weight:700;letter-spacing:-0.03em;color:#64748b"><span id="total-count">0</span></div></div>
</div>
${qs}
<div id="final-result"><span class="pct"></span><span class="grade"></span><span class="summary"></span></div>
</div>
<script>
var score=0,answered=0,total=0;
function init(){var qs=document.querySelectorAll('.question-block');total=qs.length;document.getElementById('total-count').textContent=total;var bt=document.getElementById('badge-total');if(bt)bt.textContent=total;}
function select(qId,chosen,correct,btn){var block=document.querySelector('[data-qid="'+qId+'"]');if(block.dataset.answered)return;block.dataset.answered='1';answered++;var btns=block.querySelectorAll('.opt-btn');btns.forEach(function(b){b.disabled=true;if(b.dataset.key===correct)b.classList.add('correct');else if(b.dataset.key===chosen)b.classList.add('wrong');});if(chosen===correct){score++;}var exp=block.querySelector('.explanation');if(exp)exp.style.display='block';updateScore();}
function updateScore(){var sc=document.getElementById('score-display');if(sc)sc.textContent=score+'/'+answered;if(answered===total){var pct=Math.round((score/total)*100);var fin=document.getElementById('final-result');if(fin){fin.style.display='block';fin.querySelector('.pct').textContent=pct+'%';fin.querySelector('.summary').textContent=score+' out of '+total+' correct';fin.querySelector('.grade').textContent=pct>=90?'🏆 Excellent!':pct>=70?'⭐ Good Job!':pct>=50?'💪 Keep Practicing!':'📚 Review & Retry';}}}
window.onload=init;
</script></body></html>`;
}

/* ─── Generic Content Export Template ─────────────────────────── */
export function contentExportTemplate(data: ExportData): string {
  const typeLabels: Record<string, string> = {
    summary: 'Summary', key_insights: 'Key Insights', notes: 'Study Notes',
    ppt_outline: 'Presentation Outline', flashcards: 'Flashcards',
    blog_article: 'Blog Article', action_plan: 'Action Plan',
    vocabulary: 'Vocabulary List', executive_brief: 'Executive Brief',
    tweet_thread: 'Tweet Thread',
  };
  const label = typeLabels[data.type] || data.type.replace(/_/g, ' ');

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escHtml(data.title)} — ${label}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=IBM+Plex+Mono:wght@400;600&family=Figtree:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Figtree',sans-serif;background:#e8e4d8;min-height:100vh}
.page{width:210mm;min-height:297mm;margin:20px auto;background:#faf8f3;padding:16mm 18mm;box-shadow:0 8px 48px rgba(0,0,0,0.22);position:relative;overflow:hidden}
.page::before{content:'';position:absolute;top:0;left:0;right:0;height:5px;background:repeating-linear-gradient(90deg,#c0392b 0,#c0392b 25%,#1a3a5c 25%,#1a3a5c 50%,#1e6b4a 50%,#1e6b4a 75%,#b8860b 75%,#b8860b 100%)}
.doc-header{border-bottom:2px solid #1a1814;padding-bottom:12px;margin-bottom:18px;margin-top:4px}
.eyebrow{font-family:'IBM Plex Mono',monospace;font-size:7pt;letter-spacing:0.25em;text-transform:uppercase;color:#8a7a6a;margin-bottom:8px}
h1{font-family:'DM Serif Display',serif;font-size:22pt;color:#1a1814;line-height:1.1;letter-spacing:-0.01em}
h1 em{color:#c0392b;font-style:italic}
.meta{font-family:'IBM Plex Mono',monospace;font-size:7pt;color:#8a7a6a;margin-top:6px}
.content{font-size:10pt;line-height:1.7;color:#2a2520}
.content h1,.content h2,.content h3{font-family:'DM Serif Display',serif;color:#1a1814;margin-top:16px;margin-bottom:8px;line-height:1.2}
.content h1{font-size:16pt}.content h2{font-size:13pt}.content h3{font-size:11pt}
.content p{margin-bottom:10px}
.content ul,.content ol{padding-left:1.5em;margin-bottom:10px}
.content li{margin-bottom:4px}
.content strong{font-weight:700;color:#1a1814}
.content em{color:#c0392b;font-style:italic}
.content code{font-family:'IBM Plex Mono',monospace;font-size:8.5pt;background:#f0ece0;padding:1px 5px;border-radius:2px}
.content blockquote{border-left:3px solid #b8860b;padding:8px 12px;background:#fffde7;margin:10px 0;color:#5a5345;font-style:italic}
.content hr{border:none;border-top:1px solid #ddd8cc;margin:14px 0}
.footer{margin-top:2rem;padding-top:12px;border-top:1px solid #ddd8cc;font-family:'IBM Plex Mono',monospace;font-size:6.5pt;color:#a09080;display:flex;justify-content:space-between}
@media print{body{background:white}.page{margin:0;box-shadow:none;width:100%;min-height:100vh}}
@media screen and (max-width:700px){.page{width:100%;padding:2rem 1.5rem;margin:0}}
</style>
<script>function doPrint(){window.print()}</script>
</head><body>
<div class="page">
<div class="doc-header">
<div class="eyebrow">VidVault AI · ${label}</div>
<h1>${escHtml(data.videoTitle)} <em>${label}</em></h1>
<div class="meta">${data.channelName ? escHtml(data.channelName) + ' · ' : ''}${data.generatedAt}</div>
</div>
<div class="content">${data.contentHtml}</div>
<div class="footer">
<span>VidVault AI — ${label}</span>
<span>${data.generatedAt}</span>
</div>
</div>
</body></html>`;
}

/* ─── Notes Export Template ─────────────────────────────────────── */
export function notesExportTemplate(data: { videoTitle: string; channelName?: string; notes: Array<{ content: string; timestamp: number | null }> }): string {
  const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const notesHtml = data.notes.map(n => `
    <div class="note-item">
      ${n.timestamp !== null ? `<div class="timestamp">${Math.floor(n.timestamp/60)}:${(n.timestamp%60).toString().padStart(2,'0')}</div>` : '<div class="timestamp">—</div>'}
      <div class="note-body">${escHtml(n.content)}</div>
    </div>`).join('');

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Notes — ${escHtml(data.videoTitle)}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=IBM+Plex+Mono:wght@400;600&family=Figtree:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Figtree',sans-serif;background:#e8e4d8;min-height:100vh}
.page{width:210mm;min-height:297mm;margin:20px auto;background:#faf8f3;padding:16mm 18mm;box-shadow:0 8px 48px rgba(0,0,0,0.22);position:relative;overflow:hidden}
.page::before{content:'';position:absolute;top:0;left:0;right:0;height:5px;background:repeating-linear-gradient(90deg,#c0392b 0,#c0392b 25%,#1a3a5c 25%,#1a3a5c 50%,#1e6b4a 50%,#1e6b4a 75%,#b8860b 75%,#b8860b 100%)}
.doc-header{border-bottom:2px solid #1a1814;padding-bottom:12px;margin-bottom:18px;margin-top:4px}
.eyebrow{font-family:'IBM Plex Mono',monospace;font-size:7pt;letter-spacing:0.25em;text-transform:uppercase;color:#8a7a6a;margin-bottom:8px}
h1{font-family:'DM Serif Display',serif;font-size:22pt;color:#1a1814;line-height:1.1}
h1 em{color:#1a3a5c;font-style:italic}
.meta{font-family:'IBM Plex Mono',monospace;font-size:7pt;color:#8a7a6a;margin-top:6px}
.note-item{display:grid;grid-template-columns:60px 1fr;gap:12px;padding:12px 0;border-bottom:1px solid #e8e0d0;align-items:start}
.note-item:last-child{border-bottom:none}
.timestamp{font-family:'IBM Plex Mono',monospace;font-size:8pt;font-weight:600;color:#1a3a5c;background:#eef2ff;padding:3px 8px;border:1px solid #c7d2fe;border-radius:3px;text-align:center;white-space:nowrap}
.note-body{font-size:9.5pt;line-height:1.65;color:#2a2520}
.footer{margin-top:2rem;padding-top:12px;border-top:1px solid #ddd8cc;font-family:'IBM Plex Mono',monospace;font-size:6.5pt;color:#a09080;display:flex;justify-content:space-between}
@media print{body{background:white}.page{margin:0;box-shadow:none;width:100%;min-height:100vh}}
@media screen and (max-width:700px){.page{width:100%;padding:2rem 1.5rem;margin:0}}
</style></head><body>
<div class="page">
<div class="doc-header">
<div class="eyebrow">VidVault AI · My Notes</div>
<h1>${escHtml(data.videoTitle)} <em>Notes</em></h1>
<div class="meta">${data.channelName ? escHtml(data.channelName) + ' · ' : ''}Exported ${now} · ${data.notes.length} note${data.notes.length !== 1 ? 's' : ''}</div>
</div>
${notesHtml || '<p style="font-size:9pt;color:#8a7a6a;font-style:italic">No notes to export.</p>'}
<div class="footer">
<span>VidVault AI — Personal Notes</span>
<span>${now}</span>
</div>
</div>
</body></html>`;
}

export const QUIZ_TEMPLATES = [
  { id: 1, name: 'Dark Academic', fn: quizTemplate1 },
  { id: 2, name: 'Neon Cyberpunk', fn: quizTemplate2 },
  { id: 3, name: 'Paper & Ink', fn: quizTemplate3 },
  { id: 4, name: 'VidVault Dark', fn: quizTemplate4 },
  { id: 5, name: 'Ocean Blue', fn: quizTemplate5 },
  { id: 6, name: 'Emerald Forest', fn: quizTemplate6 },
  { id: 7, name: 'Sunrise Warm', fn: quizTemplate7 },
  { id: 8, name: 'Bauhaus Minimal', fn: quizTemplate8 },
  { id: 9, name: 'Purple Galaxy', fn: quizTemplate9 },
  { id: 10, name: 'Corporate Pro', fn: quizTemplate10 },
];
