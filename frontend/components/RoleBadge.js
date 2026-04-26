const roleStyles = {
  guest: {
    label: "Guest",
    classes: "border-slate-200 bg-slate-50 text-slate-600",
    dot: "bg-slate-400",
  },
  user: {
    label: "User",
    classes: "border-sky-200 bg-sky-50 text-sky-700",
    dot: "bg-sky-500",
  },
  admin: {
    label: "Admin",
    classes: "border-violet-200 bg-violet-50 text-violet-700",
    dot: "bg-violet-500",
  },
  inspector: {
    label: "Inspector",
    classes: "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },
  government: {
    label: "Government",
    classes: "border-emerald-200 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  lender: {
    label: "Lender",
    classes: "border-indigo-200 bg-indigo-50 text-indigo-700",
    dot: "bg-indigo-500",
  },
};

export default function RoleBadge({ role = "guest", compact = false }) {
  const config = roleStyles[role] || roleStyles.guest;

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${config.classes}`}
      >
        <span className={`h-2 w-2 rounded-full ${config.dot}`} />
        {config.label}
      </span>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${config.classes}`}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </div>
  );
}