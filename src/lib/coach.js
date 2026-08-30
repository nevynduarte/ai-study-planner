// Builds the handhold prompt for a Today-plan block: paste it into Claude (or
// send it to the tutor) and it coaches step-by-step instead of dumping answers.
export function coachPrompt({ task, doneWhen, trackName, skill, time }) {
  const lines = [
    `I'm working through today's ${trackName || "study"} block${time ? ` (${time})` : ""} from my interview-prep plan, and I'd like you to coach me through it patiently.`,
    "",
    `The task: ${task}`,
    doneWhen ? `It counts as done when: ${doneWhen}` : null,
    skill ? `The curriculum skill this advances: ${skill}` : null,
    "",
    "About me: MS in data science, strong Python, building real RAG/LLM systems at my startup; preparing for machine-learning-engineer interviews (applying November 2026). I want to learn this properly, but I need it very approachable.",
    "",
    "Please work with me like a tutor, not a solution manual:",
    "1. Start by asking what I already know about this topic, so you can pitch the level right.",
    "2. Explain the core idea from first principles, briefly, with one concrete example.",
    "3. Then give me ONE small step or exercise at a time, and wait for my answer before continuing.",
    "4. When I'm stuck, give hints before answers. Only show a full solution if I explicitly ask.",
    "5. At the end, quiz me with 2-3 questions an interviewer would ask about this, and tell me honestly whether the block is done by the definition above.",
  ];
  return lines.filter(l => l !== null).join("\n");
}
