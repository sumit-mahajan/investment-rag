import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

function BrandMark({ w }: { w: number }) {
  const stroke = Math.max(1.6, w * 0.09);
  return (
    <svg
      width={w}
      height={w}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M7 3h8l4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
        stroke="white"
        strokeWidth={stroke}
        strokeLinejoin="round"
      />
      <path
        d="M15 3v4h4"
        stroke="#7dd3fc"
        strokeWidth={stroke}
        strokeLinejoin="round"
      />
      <path
        d="M8 14h8M8 17h5"
        stroke="white"
        strokeOpacity={0.85}
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      <path
        d="M14.5 12.5 16.5 14.5 21 10"
        stroke="#34d399"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #020617 0%, #0f172a 45%, #1d4ed8 120%)",
          borderRadius: 40,
        }}
      >
        <BrandMark w={112} />
      </div>
    ),
    { ...size }
  );
}
