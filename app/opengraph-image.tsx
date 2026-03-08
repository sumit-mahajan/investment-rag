import { ImageResponse } from "next/og";

export const alt = "Investment RAG - AI-Powered Financial Document Analysis";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Logo icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 120,
            height: 120,
            background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
            borderRadius: 24,
            marginBottom: 32,
          }}
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <line x1="10" y1="9" x2="8" y2="9" />
          </svg>
        </div>
        <h1
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: "white",
            margin: 0,
            textAlign: "center",
            letterSpacing: "-0.02em",
          }}
        >
          Investment RAG
        </h1>
        <p
          style={{
            fontSize: 28,
            color: "#94a3b8",
            marginTop: 16,
            textAlign: "center",
            maxWidth: 800,
          }}
        >
          AI-powered analysis for any financial report
        </p>
        <p
          style={{
            fontSize: 22,
            color: "#64748b",
            marginTop: 24,
            textAlign: "center",
          }}
        >
          10-K · Annual Reports · Investor Presentations
        </p>
      </div>
    ),
    { ...size }
  );
}
