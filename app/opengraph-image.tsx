import { ImageResponse } from "next/og";
import { siteName, siteTagline } from "@/lib/seo/site";

export const alt = `${siteName} — bulk filing upload & cited AI analysis`;
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
          background: "linear-gradient(135deg, #020617 0%, #0f172a 42%, #172554 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 112,
            height: 112,
            background: "linear-gradient(145deg, #020617 0%, #0f172a 45%, #1d4ed8 120%)",
            borderRadius: 28,
            marginBottom: 28,
            boxShadow: "0 24px 80px rgba(37, 99, 235, 0.35)",
          }}
        >
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M7 3h8l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
              stroke="white"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M15 3v4h4"
              stroke="#7dd3fc"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M8 14h8M8 17h5"
              stroke="white"
              strokeOpacity={0.85}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M14.5 12.5 16.5 14.5 21 10"
              stroke="#34d399"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: "white",
            margin: 0,
            textAlign: "center",
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            maxWidth: 980,
            padding: "0 48px",
          }}
        >
          {siteName}
        </h1>
        <p
          style={{
            fontSize: 30,
            color: "#cbd5e1",
            marginTop: 20,
            textAlign: "center",
            maxWidth: 920,
            lineHeight: 1.35,
            padding: "0 48px",
          }}
        >
          {siteTagline}
        </p>
        <p
          style={{
            fontSize: 22,
            color: "#64748b",
            marginTop: 28,
            textAlign: "center",
            letterSpacing: "0.02em",
          }}
        >
          LlamaParse · Dense retrieval · Cited verdicts
        </p>
      </div>
    ),
    { ...size }
  );
}
