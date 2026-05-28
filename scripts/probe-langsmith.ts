import "dotenv/config";
import { loadTestCasesFromLangSmith } from "@/lib/evaluation/langsmith-loader";

async function main() {
  const cases = await loadTestCasesFromLangSmith({ limit: 50 });
  console.log(JSON.stringify({ count: cases.length, samples: cases.slice(0, 3).map((c) => ({
    question: c.question.slice(0, 100),
    answerLen: c.answer.length,
    contextCount: c.contexts.length,
  })) }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
