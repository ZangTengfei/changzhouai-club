type HomeIllustrationProps = {
  className?: string;
};

type FlowIllustrationProps = HomeIllustrationProps & {
  tone: "green" | "orange" | "blue";
};

export function DoodleSparkles({ className }: HomeIllustrationProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <path d="M68 11V31" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <path d="M68 55V75" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <path d="M30 48H50" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <path d="M86 48H106" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <path d="M48 28L55 35" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M82 61L89 68" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M88 28L81 35" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M55 61L48 68" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path
        d="M68 34C72 43 76 47 85 48C76 49 72 53 68 62C64 53 60 49 51 48C60 47 64 43 68 34Z"
        fill="currentColor"
      />
      <path
        d="M23 75C25 81 28 84 34 86C28 88 25 91 23 97C21 91 18 88 12 86C18 84 21 81 23 75Z"
        fill="currentColor"
        opacity="0.68"
      />
    </svg>
  );
}

export function DoodleSmile({ className }: HomeIllustrationProps) {
  return (
    <svg
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <circle cx="48" cy="48" r="35" stroke="currentColor" strokeWidth="5" />
      <path d="M34 41V42" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
      <path d="M62 41V42" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
      <path
        d="M31 56C38 68 58 70 66 55"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path d="M78 24L87 15" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M82 31L93 29" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function HandDrawnArrow({ className }: HomeIllustrationProps) {
  return (
    <svg
      viewBox="0 0 180 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M9 29C39 42 88 43 133 25"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path d="M124 13L148 19L134 39" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M18 17C22 15 25 14 31 14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function FlowPeopleIllustration({ tone, className }: FlowIllustrationProps) {
  const accent = {
    green: "#11835f",
    orange: "#ec8e2f",
    blue: "#2d80d8",
  }[tone];
  const soft = {
    green: "#eaf6d9",
    orange: "#fff0d4",
    blue: "#e4f1ff",
  }[tone];

  return (
    <svg
      viewBox="0 0 220 150"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <path d="M22 98C33 76 53 68 75 77" stroke={accent} strokeWidth="5" strokeLinecap="round" />
      <path d="M196 101C184 79 164 69 142 78" stroke={accent} strokeWidth="5" strokeLinecap="round" />
      <rect x="38" y="88" width="144" height="42" rx="20" fill={soft} />
      <rect x="67" y="64" width="88" height="50" rx="14" fill="#ffffff" stroke={accent} strokeWidth="4" />
      <path d="M84 84H138" stroke={accent} strokeWidth="5" strokeLinecap="round" />
      <path d="M91 96H130" stroke={accent} strokeWidth="5" strokeLinecap="round" opacity="0.35" />
      <circle cx="63" cy="56" r="19" fill="#f0bd88" />
      <path d="M44 55C49 34 72 30 85 47C75 43 65 44 59 57" fill="#2d251e" />
      <path d="M38 120C42 91 51 75 69 75C88 75 97 91 101 120" fill="#f6b85a" />
      <path d="M80 84L101 100" stroke="#2d251e" strokeWidth="5" strokeLinecap="round" />
      <circle cx="157" cy="56" r="19" fill="#f0bd88" />
      <path d="M139 48C146 28 171 32 177 52C165 43 153 43 144 57" fill="#2d251e" />
      <path d="M119 120C123 91 134 75 155 75C176 75 186 91 190 120" fill="#72bf82" />
      <path d="M139 84L118 100" stroke="#2d251e" strokeWidth="5" strokeLinecap="round" />
      <path d="M108 39C112 32 119 32 123 39" stroke={accent} strokeWidth="4" strokeLinecap="round" />
      <path d="M114 30V20" stroke={accent} strokeWidth="4" strokeLinecap="round" />
      <path d="M93 30L86 23" stroke={accent} strokeWidth="4" strokeLinecap="round" />
      <path d="M135 30L142 23" stroke={accent} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function EventHostIllustration({ className }: HomeIllustrationProps) {
  return (
    <svg
      viewBox="0 0 210 230"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <path d="M122 30C158 36 172 64 164 95C156 126 127 136 99 127C69 117 54 91 62 63C70 35 92 25 122 30Z" fill="#2b211b" />
      <circle cx="108" cy="78" r="39" fill="#f1be8b" />
      <path d="M70 72C82 47 113 38 144 50C132 44 112 72 74 80" fill="#2b211b" />
      <path d="M92 80C93 84 97 85 101 82" stroke="#2b211b" strokeWidth="4" strokeLinecap="round" />
      <path d="M122 80C124 84 128 85 132 82" stroke="#2b211b" strokeWidth="4" strokeLinecap="round" />
      <path d="M103 99C110 104 120 104 128 98" stroke="#9c542e" strokeWidth="4" strokeLinecap="round" />
      <path d="M53 226C58 158 76 124 109 124C144 124 162 158 168 226H53Z" fill="#ffd86f" />
      <path d="M72 161C44 171 32 193 25 219" stroke="#f1be8b" strokeWidth="16" strokeLinecap="round" />
      <path d="M148 162C182 173 190 194 196 220" stroke="#f1be8b" strokeWidth="16" strokeLinecap="round" />
      <path d="M168 181C179 171 181 158 171 145" stroke="#2b211b" strokeWidth="5" strokeLinecap="round" />
      <path d="M178 169L193 152" stroke="#2b211b" strokeWidth="5" strokeLinecap="round" />
      <path d="M184 180L203 171" stroke="#2b211b" strokeWidth="5" strokeLinecap="round" />
      <path d="M47 44C40 34 42 24 52 18" stroke="#f6c75f" strokeWidth="5" strokeLinecap="round" />
      <path d="M36 67H18" stroke="#88bf8b" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

export function JoinCommunityIllustration({ className }: HomeIllustrationProps) {
  return (
    <svg
      viewBox="0 0 220 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <rect x="20" y="98" width="180" height="52" rx="24" fill="#f3f7ec" />
      <circle cx="72" cy="72" r="23" fill="#f0bd88" />
      <path d="M52 65C56 42 86 42 96 63C84 58 71 58 59 75" fill="#2b211b" />
      <path d="M40 151C43 110 55 93 75 93C95 93 107 111 111 151" fill="#f6b85a" />
      <path d="M113 103C119 90 133 88 145 96L158 105" stroke="#11835f" strokeWidth="8" strokeLinecap="round" />
      <circle cx="151" cy="72" r="22" fill="#f0bd88" />
      <path d="M134 59C141 43 164 44 172 63C159 58 147 61 139 75" fill="#2b211b" />
      <path d="M122 151C126 111 137 93 155 93C175 93 187 111 190 151" fill="#76c88a" />
      <path d="M96 110C104 100 115 99 126 108" stroke="#11835f" strokeWidth="8" strokeLinecap="round" />
      <path d="M82 27H113" stroke="#ffd25c" strokeWidth="6" strokeLinecap="round" />
      <path d="M98 14V43" stroke="#ffd25c" strokeWidth="6" strokeLinecap="round" />
      <path d="M174 27L187 14" stroke="#5aa7e8" strokeWidth="5" strokeLinecap="round" />
      <path d="M181 41H200" stroke="#5aa7e8" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
