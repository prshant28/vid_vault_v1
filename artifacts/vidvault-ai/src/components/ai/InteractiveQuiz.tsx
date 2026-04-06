import { useState } from "react";
import type { QuizQuestion } from "@/lib/quiz-parser";
import { CheckCircle2, XCircle, RotateCcw, Trophy, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  questions: QuizQuestion[];
  onClose?: () => void;
}

export function InteractiveQuiz({ questions, onClose }: Props) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [finished, setFinished] = useState(false);

  const score = Object.entries(answers).filter(([id, ans]) => {
    const q = questions.find(q => q.id === Number(id));
    return q && ans === q.correctAnswer;
  }).length;

  const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  const handleSelect = (q: QuizQuestion, key: string) => {
    if (answers[q.id] !== undefined) return;
    setAnswers(prev => ({ ...prev, [q.id]: key }));
    setRevealed(prev => ({ ...prev, [q.id]: true }));
    if (Object.keys(answers).length + 1 === questions.length) {
      setTimeout(() => setFinished(true), 600);
    }
  };

  const reset = () => {
    setAnswers({});
    setRevealed({});
    setFinished(false);
  };

  if (questions.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground text-sm">
        No quiz questions found. Try regenerating the quiz.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Score header */}
      <div className="flex items-center justify-between px-4 py-3 rounded-xl"
        style={{ background: "#0d0d11", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div>
          <div className="text-[9px] font-mono-ui uppercase tracking-widest text-muted-foreground mb-1">Score</div>
          <div className="text-2xl font-display font-bold text-primary">
            {Object.keys(answers).length > 0 ? `${score}/${Object.keys(answers).length}` : "—"}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[9px] font-mono-ui uppercase tracking-widest text-muted-foreground mb-1">Questions</div>
          <div className="text-2xl font-display font-bold text-foreground/50">{questions.length}</div>
        </div>
        {Object.keys(answers).length > 0 && (
          <button onClick={reset} className="flex items-center gap-1.5 text-[10px] font-mono-ui uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg border border-border/50 hover:border-border">
            <RotateCcw className="w-3 h-3" /> Restart
          </button>
        )}
      </div>

      {/* Questions */}
      {questions.map((q, idx) => {
        const userAnswer = answers[q.id];
        const isRevealed = revealed[q.id];
        const isAnswered = userAnswer !== undefined;

        return (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            style={{
              background: "#0d0d11",
              border: `1px solid ${isAnswered ? (userAnswer === q.correctAnswer ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)') : 'rgba(255,255,255,0.06)'}`,
              borderLeft: `3px solid ${isAnswered ? (userAnswer === q.correctAnswer ? '#22c55e' : '#ef4444') : 'rgba(139,92,246,0.4)'}`,
            }}
            className="rounded-xl p-4"
          >
            <div className="flex gap-3 mb-3">
              <span className="text-[9px] font-mono-ui uppercase tracking-wider text-primary border border-primary/30 bg-primary/10 px-2 py-0.5 rounded flex-shrink-0 h-fit mt-0.5">
                Q{q.id}
              </span>
              <p className="text-sm font-medium text-foreground/90 leading-relaxed">{q.question}</p>
            </div>

            <div className="space-y-2 ml-7">
              {q.options.map(opt => {
                const isCorrect = opt.key === q.correctAnswer;
                const isChosen = userAnswer === opt.key;
                let bg = "rgba(255,255,255,0.02)";
                let border = "rgba(255,255,255,0.06)";
                let textCol = "#666";
                let icon = null;

                if (isAnswered) {
                  if (isCorrect) { bg = "rgba(34,197,94,0.08)"; border = "rgba(34,197,94,0.35)"; textCol = "#4ade80"; icon = <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />; }
                  else if (isChosen) { bg = "rgba(239,68,68,0.08)"; border = "rgba(239,68,68,0.35)"; textCol = "#f87171"; icon = <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />; }
                  else { textCol = "#444"; }
                }

                return (
                  <button
                    key={opt.key}
                    disabled={isAnswered}
                    onClick={() => handleSelect(q, opt.key)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all duration-150 text-sm"
                    style={{ background: bg, border: `1px solid ${border}`, color: textCol, cursor: isAnswered ? 'default' : 'pointer' }}
                    onMouseEnter={e => { if (!isAnswered) { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,92,246,0.4)'; (e.currentTarget as HTMLElement).style.color = '#c0c0d0'; } }}
                    onMouseLeave={e => { if (!isAnswered) { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = '#666'; } }}
                  >
                    <span className="text-[10px] font-mono-ui font-bold w-5 h-5 flex items-center justify-center border rounded flex-shrink-0"
                      style={{ borderColor: isAnswered && isCorrect ? '#22c55e' : isAnswered && isChosen ? '#ef4444' : 'rgba(255,255,255,0.1)', color: isAnswered && isCorrect ? '#4ade80' : 'inherit' }}>
                      {opt.key}
                    </span>
                    <span className="flex-1">{opt.text}</span>
                    {icon}
                  </button>
                );
              })}
            </div>

            {/* Explanation */}
            <AnimatePresence>
              {isRevealed && q.explanation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="ml-7 mt-3 px-3 py-2 rounded-lg text-xs text-muted-foreground leading-relaxed"
                  style={{ background: "rgba(245,158,11,0.07)", borderLeft: "2px solid rgba(245,158,11,0.4)" }}
                >
                  <span className="text-yellow-500 font-bold text-[10px] font-mono-ui uppercase tracking-wider mr-2">💡 Why?</span>
                  {q.explanation}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {/* Finish card */}
      <AnimatePresence>
        {finished && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl p-6 text-center"
            style={{ background: pct >= 70 ? "rgba(34,197,94,0.07)" : "rgba(139,92,246,0.07)", border: `1px solid ${pct >= 70 ? 'rgba(34,197,94,0.25)' : 'rgba(139,92,246,0.25)'}` }}
          >
            <Trophy className="w-8 h-8 mx-auto mb-3" style={{ color: pct >= 70 ? '#4ade80' : '#a78bfa' }} />
            <div className="text-5xl font-display font-bold mb-1" style={{ color: pct >= 70 ? '#4ade80' : '#a78bfa' }}>{pct}%</div>
            <div className="text-sm font-medium text-foreground mb-1">
              {pct >= 90 ? "Excellent! 🏆" : pct >= 70 ? "Good Job! ⭐" : pct >= 50 ? "Keep Practicing! 💪" : "Review & Retry 📚"}
            </div>
            <div className="text-xs text-muted-foreground font-mono-ui">{score} out of {questions.length} correct</div>
            <button onClick={reset} className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 rounded-lg text-xs font-mono-ui uppercase tracking-wider transition-all"
              style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", color: "#a78bfa" }}>
              <RotateCcw className="w-3.5 h-3.5" /> Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
