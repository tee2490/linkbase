const FALLBACK_BACKGROUNDS = ["bg-butter", "bg-sky", "bg-blush", "bg-tangerine"];

type AvatarProps = {
  name: string;
  size?: number;
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

// Initials fallback only; photo avatars arrive with profiles (see docs/ui.md "Avatar").
export function Avatar({ name, size = 96 }: AvatarProps) {
  const background = FALLBACK_BACKGROUNDS[(name.charCodeAt(0) || 0) % FALLBACK_BACKGROUNDS.length];

  return (
    <div
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full font-display font-bold text-ink ${background}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {getInitials(name)}
    </div>
  );
}
