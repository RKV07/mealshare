export default function CircularProgress({ percent, color }) {
  const clamped = Math.max(0, Math.min(percent, 100));
  const r = 46;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c;
  return (
    <svg width="120" height="120" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r={r} fill="none" stroke="#EEF2F0" strokeWidth="10" />
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 60 60)"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text x="60" y="66" textAnchor="middle" fontSize="22" fontWeight="700" fill="#16241A" fontFamily="Outfit, sans-serif">
        {Math.round(percent)}
      </text>
    </svg>
  );
}
