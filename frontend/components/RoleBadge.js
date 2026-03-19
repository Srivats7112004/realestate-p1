// frontend/components/RoleBadge.js

const roleConfig = {
  government: {
    label: "Government",
    bgColor: "bg-red-100",
    textColor: "text-red-700",
    icon: "🏛",
  },
  inspector: {
    label: "Inspector",
    bgColor: "bg-orange-100",
    textColor: "text-orange-700",
    icon: "🔍",
  },
  lender: {
    label: "Lender",
    bgColor: "bg-blue-100",
    textColor: "text-blue-700",
    icon: "🏦",
  },
  user: {
    label: "User",
    bgColor: "bg-green-100",
    textColor: "text-green-700",
    icon: "👤",
  },
};

export default function RoleBadge({ role, size = "sm" }) {
  const config = roleConfig[role] || roleConfig.user;

  const sizeClasses = {
    xs: "px-2 py-0.5 text-xs",
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-1.5 text-base",
    lg: "px-5 py-2 text-lg",
  };

  return (
    <span
      className={`${config.bgColor} ${config.textColor} ${sizeClasses[size]} rounded-full font-semibold inline-flex items-center gap-1`}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}