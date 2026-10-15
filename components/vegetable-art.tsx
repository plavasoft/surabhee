const WASH: Record<string, string> = {
  bendakaya: "#e7f3d8",
  dondakaya: "#e5f0cc",
  vankaya: "#f0e4f6",
  chikkudukaya: "#e3f1e4",
  kothimeera: "#e2f5e8",
  thotakura: "#f8e6e2",
  gongura: "#f7ecd4",
  mirapakayalu: "#fde7dc",
  sorakaya: "#eef4d6",
  potlakaya: "#e5f4df",
  beerakaya: "#e4f1d2",
};

function Ground() {
  return <ellipse cx="80" cy="104" rx="46" ry="7" fill="rgba(28,36,22,0.08)" />;
}

function Mark({ id }: { id: string }) {
  switch (id) {
    case "bendakaya":
      return (
        <g>
          <path d="M58 92c8-28 18-48 34-62 4 10 2 22-4 36-8 18-20 32-30 26Z" fill="#3e9a4a" />
          <path d="M70 86c6-20 14-38 26-50" fill="none" stroke="#1f6b34" strokeWidth="2" />
          <path d="M92 30c4 2 8 8 6 12-6-2-10-6-6-12Z" fill="#246b38" />
          <path d="M48 78c10-18 22-34 40-46 2 8-2 16-8 26-10 16-22 28-32 20Z" fill="#67b85a" />
        </g>
      );
    case "dondakaya":
      return (
        <g>
          <ellipse cx="58" cy="70" rx="16" ry="22" fill="#7cbc45" transform="rotate(-18 58 70)" />
          <ellipse cx="84" cy="62" rx="16" ry="22" fill="#8fce55" transform="rotate(8 84 62)" />
          <ellipse cx="104" cy="78" rx="14" ry="20" fill="#6aaa3c" transform="rotate(16 104 78)" />
          <path d="M58 50c8-10 18-8 22 0M84 42c6-8 14-6 16 2" fill="none" stroke="#2f6b32" strokeWidth="2" />
          <path d="M52 70h14M78 62h16M98 78h12" stroke="rgba(255,255,255,0.7)" strokeWidth="2" />
        </g>
      );
    case "vankaya":
      return (
        <g>
          <path d="M80 28c10 6 14 16 12 24-14 2-28-4-30-14 2-8 10-14 18-10Z" fill="#2f7a3d" />
          <path d="M78 40c18 4 34 22 32 42-2 16-18 26-34 22-20-4-32-24-28-44 4-16 16-24 30-20Z" fill="#6a3d86" />
          <path d="M86 48c8 10 10 28 4 44" fill="none" stroke="#4d2a66" strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case "chikkudukaya":
      return (
        <g>
          <path d="M46 78c16-28 34-40 58-42 2 14-6 28-20 40-16 14-30 16-38 2Z" fill="#3f9a52" />
          <path d="M70 74c8-4 16-14 22-24M62 80c10-2 20-10 28-20" fill="none" stroke="#1f6a34" strokeWidth="2" />
          <path d="M54 70c18-22 40-32 62-30 0 12-10 24-24 34-16 10-30 10-38-4Z" fill="#8dce6a" />
        </g>
      );
    case "kothimeera":
      return (
        <g>
          <path d="M80 100c-2-24 4-40 8-52" fill="none" stroke="#2c7a3c" strokeWidth="3" />
          <path d="M70 96c-10-18-8-34 2-46" fill="none" stroke="#2c7a3c" strokeWidth="3" />
          <path d="M90 98c8-16 8-32-2-46" fill="none" stroke="#2c7a3c" strokeWidth="3" />
          <circle cx="88" cy="42" r="8" fill="#7dcc62" />
          <circle cx="72" cy="46" r="7" fill="#8ed56e" />
          <circle cx="80" cy="34" r="6" fill="#b6e48a" />
          <circle cx="64" cy="54" r="5" fill="#9ad672" />
          <circle cx="98" cy="52" r="6" fill="#6fbe58" />
        </g>
      );
    case "thotakura":
      return (
        <g>
          <path d="M80 102V48" stroke="#c45a55" strokeWidth="4" />
          <path d="M80 70c-18-4-28-16-30-28 16 2 26 10 30 22Z" fill="#3f9a4c" />
          <path d="M80 64c16-6 30-8 38-20-8 16-20 24-38 26Z" fill="#67b85a" />
          <path d="M80 84c-16 2-26 10-28 20 12-4 22-8 28-16Z" fill="#2f7a3c" />
          <path d="M80 86c14 0 26 8 32 18-12-2-22-8-32-14Z" fill="#8dce6a" />
          <circle cx="80" cy="42" r="7" fill="#d36a62" />
        </g>
      );
    case "gongura":
      return (
        <g>
          <path d="M80 100V58" stroke="#6a8a32" strokeWidth="3" />
          <path d="M80 70c-6-18-24-28-36-24 6 16 18 24 36 24Z" fill="#c6d36a" />
          <path d="M80 66c8-20 28-28 40-18-8 16-22 22-40 18Z" fill="#d7b64a" />
          <path d="M80 78c-2-16 10-30 14-40-16 8-20 24-14 40Z" fill="#e07a3d" />
          <path d="M48 50c8 4 16 2 22-4M116 52c-8 4-16 2-22-6" fill="none" stroke="#6a8a32" strokeWidth="2" />
        </g>
      );
    case "mirapakayalu":
      return (
        <g>
          <path d="M48 80c6-30 20-46 28-50-2 16-8 32-16 46-4 8-10 10-12 4Z" fill="#d24b32" />
          <path d="M76 34c2 6 0 10-2 12" stroke="#2f7a3d" strokeWidth="3" strokeLinecap="round" />
          <path d="M70 86c8-32 24-50 36-54-4 18-12 36-22 50-6 8-12 10-14 4Z" fill="#3e9a4a" />
          <path d="M104 36c4 6 2 12-2 14" stroke="#2f7a3d" strokeWidth="3" strokeLinecap="round" />
          <path d="M96 90c10-26 22-40 30-44-2 14-8 26-16 38-4 6-10 8-14 6Z" fill="#e07a3d" />
        </g>
      );
    case "sorakaya":
      return (
        <g>
          <path d="M78 26c8 2 12 10 10 16-8 2-16-2-18-10 0-4 4-8 8-6Z" fill="#2f7a3d" />
          <path d="M86 42c10 2 18 14 16 28-2 20-4 36-16 40-16 4-28-8-30-28-2-18 8-36 30-40Z" fill="#d5e2a4" />
          <path d="M78 50c8 8 10 28 6 50" fill="none" stroke="#b7c97e" strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case "potlakaya":
      return (
        <g>
          <path d="M36 86c18-10 28-28 30-46 10 6 16 20 14 34-8 20-24 30-44 12Z" fill="#dfe8b0" />
          <path d="M66 40c8-12 20-18 34-16 2 10-4 20-14 28" fill="none" stroke="#8aaa45" strokeWidth="8" strokeLinecap="round" />
          <path d="M100 24c8 2 12 10 8 16" fill="none" stroke="#2f7a3d" strokeWidth="3" strokeLinecap="round" />
          <path d="M46 78c16-6 28-18 34-32" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="3" />
        </g>
      );
    case "beerakaya":
      return (
        <g>
          <path d="M70 24c8 4 10 12 8 18" fill="none" stroke="#2f7a3d" strokeWidth="3" strokeLinecap="round" />
          <path d="M86 36c16 6 26 28 22 50-4 16-18 24-32 18-16-6-26-28-22-50 4-16 16-24 32-18Z" fill="#8dce6a" />
          <path d="M70 48c6 16 8 36 4 52M84 42c4 18 4 40-2 58M98 50c-2 16-6 32-12 46" fill="none" stroke="#3e8a40" strokeWidth="2" />
        </g>
      );
    default:
      return (
        <g>
          <path d="M80 96c0-28 22-46 40-50-8 28-22 46-40 50Z" fill="#3e9a4a" />
          <path d="M80 96C80 64 54 46 36 42c10 30 26 48 44 54Z" fill="#e7c56a" />
        </g>
      );
  }
}

export function VegetableArt({ id, className }: { id: string; className?: string }) {
  return (
    <svg viewBox="0 0 160 120" className={className} aria-hidden="true">
      <rect width="160" height="120" fill={WASH[id] ?? "#efe6d4"} />
      <Ground />
      <Mark id={id} />
    </svg>
  );
}
