/** LangGraph + Groq pipeline may run up to 60s after the server action returns */
export const maxDuration = 60;

export default function AnalysisRunLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
