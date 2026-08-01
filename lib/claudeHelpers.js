import { askClaudeJSON, askClaude } from '@/lib/claude';

export async function generateMCQQuestions(topic, domain, level, count, type) {
  const prompt = `Generate exactly ${count} multiple choice questions for a ${level} level engineering student.
Topic: "${topic}" in domain: "${domain}". Test type: ${type}.
Each question must be practical and test real understanding.

Return ONLY a valid JSON array with exactly ${count} items. No markdown. No explanation. Just the array:
[
  {
    "question": "What is...?",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "correct": "A",
    "explanation": "Because..."
  }
]`;

  const system = `You are a technical question generator for engineering students.
Return ONLY valid JSON array. No markdown code blocks. No explanation. Raw JSON only.
Difficulty: ${level}. Domain: ${domain}.`;

  return askClaudeJSON(prompt, system, 2000);
}

export async function reviewCode(problem, code, language, level, domain) {
  const prompt = `Review this ${language} code submitted by a ${level} level student learning ${domain}.

Problem: "${problem}"

Student's code:
${code}

Evaluate the code and return ONLY valid JSON (no markdown):
{
  "isCorrect": true or false,
  "score": 0 to 100,
  "feedback": "Clear feedback paragraph explaining what is good and what needs improvement",
  "timeComplexity": "O(?)",
  "spaceComplexity": "O(?)",
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "correctnessNote": "One sentence on whether it solves the problem"
}`;

  const system = `You are a code reviewer for engineering students.
Be encouraging but honest. Return ONLY valid JSON. No markdown. Raw JSON only.`;

  // 1200 was tight for a feedback paragraph plus three improvements: a verbose
  // review hit the ceiling and returned JSON that stopped mid-object, which
  // reached the student as a failed submission. The headroom is cheap.
  return askClaudeJSON(prompt, system, 1600);
}

export async function generateProjectFeedback(projectTitle, projectDesc, domain, level) {
  const prompt = `A ${level} level engineering student learning ${domain} just completed this project:
Title: "${projectTitle}"
Description: ${projectDesc}

Write 3-4 sentences of encouraging, specific feedback.
Mention what skills they practiced and suggest 2 things to explore next.
Write in plain text. No JSON. No markdown. Speak directly to the student.`;

  return askClaude(prompt, 'You are an encouraging technical mentor for engineering students.', 400);
}
