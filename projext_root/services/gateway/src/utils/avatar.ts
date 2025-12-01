const COLORS = ["#2563eb", "#f97316", "#10b981", "#6366f1", "#ec4899"];

export function pickAvatarColor(seed: string) {
  if (!seed) return COLORS[0];
  const codePoints = Array.from(seed).reduce(
    (sum, char) => sum + char.codePointAt(0)!,
    0
  );
  return COLORS[codePoints % COLORS.length];
}
