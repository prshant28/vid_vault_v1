export interface QuizQuestion {
  id: number;
  question: string;
  options: { key: string; text: string }[];
  correctAnswer: string;
  explanation: string;
}

export interface ParsedQuiz {
  questions: QuizQuestion[];
  title?: string;
}

export function parseQuizContent(content: string): ParsedQuiz {
  const questions: QuizQuestion[] = [];
  const lines = content.split('\n');

  let currentQ: Partial<QuizQuestion> | null = null;
  let qId = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Match question: "1." or "Q1." or "Question 1:"
    const qMatch = line.match(/^(?:Q\.?\s*)?(\d+)[.)]\s*(.+)/i);
    if (qMatch && !line.match(/^[A-Da-d][.)]/)) {
      if (currentQ && currentQ.question && currentQ.options?.length) {
        questions.push(finalizeQuestion(currentQ, ++qId));
      }
      currentQ = { question: qMatch[2], options: [], correctAnswer: '', explanation: '' };
      continue;
    }

    if (!currentQ) continue;

    // Match options: "A)" or "A." or "(A)"
    const optMatch = line.match(/^[(\s]*([A-Da-d])[).\s]\s*(.+)/);
    if (optMatch) {
      currentQ.options = currentQ.options || [];
      currentQ.options.push({ key: optMatch[1].toUpperCase(), text: optMatch[2].trim() });
      continue;
    }

    // Match answer: "Answer: B" or "Correct Answer: B" or "**Answer: B**"
    const ansMatch = line.match(/(?:\*{0,2})(?:correct\s+)?answer[:\s]+\*{0,2}([A-Da-d])/i);
    if (ansMatch) {
      currentQ.correctAnswer = ansMatch[1].toUpperCase();
      continue;
    }

    // Match explanation
    const expMatch = line.match(/(?:\*{0,2})(?:explanation|rationale|reason)[:\s]+\*{0,2}(.+)/i);
    if (expMatch) {
      currentQ.explanation = expMatch[1].trim();
      // Consume following lines as part of explanation
      while (i + 1 < lines.length) {
        const next = lines[i + 1].trim();
        if (!next || next.match(/^(?:Q\.?\s*)?\d+[.)]/i) || next.match(/^[A-Da-d][.)]/)) break;
        currentQ.explanation += ' ' + next;
        i++;
      }
      continue;
    }
  }

  if (currentQ && currentQ.question && currentQ.options?.length) {
    questions.push(finalizeQuestion(currentQ, ++qId));
  }

  return { questions };
}

function finalizeQuestion(q: Partial<QuizQuestion>, id: number): QuizQuestion {
  return {
    id,
    question: q.question || '',
    options: q.options || [],
    correctAnswer: q.correctAnswer || (q.options?.[0]?.key ?? 'A'),
    explanation: q.explanation || '',
  };
}
