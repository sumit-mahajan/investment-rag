/** LangGraph + Gemini pipeline may run up to 300s after the server action returns */
export const maxDuration = 300;

export default function AnalysisRunLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
