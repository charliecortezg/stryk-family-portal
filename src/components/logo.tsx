interface LogoProps {
  size?: number;
  variant?: "mark" | "full";
  className?: string;
}

export function Logo({ size = 40, variant = "mark", className = "" }: LogoProps) {
  const mark = (
    <svg
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <path d="M 340 150 L 385 150 L 355 380 L 310 380 Z" fill="#DDA82D" />
      <path
        d="M 130 150 L 340 150 L 340 215 L 210 215 L 210 260 L 340 260 L 340 380 L 130 380 L 130 315 L 300 315 L 300 260 L 130 260 Z"
        fill="currentColor"
      />
    </svg>
  );

  if (variant === "mark") {
    return (
      <span className={`inline-flex text-white ${className}`} aria-label="STRYK">
        {mark}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-3 text-white ${className}`}>
      {mark}
      <span className="flex flex-col leading-none">
        <span
          className="font-display text-white"
          style={{ fontSize: size * 0.6, letterSpacing: "0.02em" }}
        >
          STRYK
        </span>
        <span
          className="text-white/70 uppercase"
          style={{ fontSize: size * 0.18, letterSpacing: "0.28em", marginTop: size * 0.08 }}
        >
          White Lions Academy
        </span>
      </span>
    </span>
  );
}
