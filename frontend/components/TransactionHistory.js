function formatDateTime(value) {
  if (!value) return "Unknown time";

  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(value);
  }
}

function formatLabel(label) {
  if (!label) return "Event";

  return String(label)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function eventTone(type = "") {
  const value = String(type).toLowerCase();

  if (
    value.includes("sale") ||
    value.includes("final") ||
    value.includes("transfer")
  ) {
    return {
      badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
      iconWrap: "border-emerald-200 bg-emerald-50 text-emerald-600",
      line: "bg-emerald-200",
      icon: "✓",
    };
  }

  if (
    value.includes("verify") ||
    value.includes("government")
  ) {
    return {
      badge: "border-sky-200 bg-sky-50 text-sky-700",
      iconWrap: "border-sky-200 bg-sky-50 text-sky-600",
      line: "bg-sky-200",
      icon: "🏛️",
    };
  }

  if (
    value.includes("inspect")
  ) {
    return {
      badge: "border-amber-200 bg-amber-50 text-amber-700",
      iconWrap: "border-amber-200 bg-amber-50 text-amber-600",
      line: "bg-amber-200",
      icon: "🔍",
    };
  }

  if (
    value.includes("lend") ||
    value.includes("loan")
  ) {
    return {
      badge: "border-indigo-200 bg-indigo-50 text-indigo-700",
      iconWrap: "border-indigo-200 bg-indigo-50 text-indigo-600",
      line: "bg-indigo-200",
      icon: "🏦",
    };
  }

  if (
    value.includes("earnest") ||
    value.includes("deposit") ||
    value.includes("payment") ||
    value.includes("buy")
  ) {
    return {
      badge: "border-violet-200 bg-violet-50 text-violet-700",
      iconWrap: "border-violet-200 bg-violet-50 text-violet-600",
      line: "bg-violet-200",
      icon: "💰",
    };
  }

  if (
    value.includes("list") ||
    value.includes("mint")
  ) {
    return {
      badge: "border-slate-200 bg-slate-50 text-slate-700",
      iconWrap: "border-slate-200 bg-slate-50 text-slate-600",
      line: "bg-slate-200",
      icon: "🏠",
    };
  }

  return {
    badge: "border-slate-200 bg-slate-50 text-slate-700",
    iconWrap: "border-slate-200 bg-slate-50 text-slate-600",
    line: "bg-slate-200",
    icon: "•",
  };
}

function extractType(item) {
  return (
    item?.type ||
    item?.event ||
    item?.eventName ||
    item?.name ||
    "event"
  );
}

function extractTitle(item) {
  return (
    item?.title ||
    item?.label ||
    item?.event ||
    item?.eventName ||
    formatLabel(extractType(item))
  );
}

function extractDescription(item) {
  return (
    item?.description ||
    item?.summary ||
    item?.details ||
    item?.message ||
    ""
  );
}

function extractTimestamp(item) {
  return (
    item?.timestamp ||
    item?.date ||
    item?.createdAt ||
    item?.time ||
    item?.blockTimestamp ||
    ""
  );
}

function extractMeta(item) {
  const candidates = [
    ["Actor", item?.actor || item?.from || item?.wallet],
    ["To", item?.to],
    ["Amount", item?.amount],
    ["Tx Hash", item?.txHash || item?.transactionHash],
    ["Block", item?.blockNumber],
  ];

  return candidates.filter(([, value]) => value !== undefined && value !== null && value !== "");
}

function TimelineItem({ item, last = false }) {
  const type = extractType(item);
  const title = extractTitle(item);
  const description = extractDescription(item);
  const timestamp = extractTimestamp(item);
  const meta = extractMeta(item);
  const tone = eventTone(type);

  return (
    <div className="relative flex gap-4">
      <div className="relative flex flex-col items-center">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl border text-sm font-semibold ${tone.iconWrap}`}
        >
          {tone.icon}
        </div>

        {!last ? (
          <div
            className={`mt-2 w-0.5 flex-1 rounded-full ${tone.line}`}
            style={{ minHeight: "44px" }}
          />
        ) : null}
      </div>

      <div className="flex-1 pb-7">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
                <span
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tone.badge}`}
                >
                  {formatLabel(type)}
                </span>
              </div>

              {description ? (
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {description}
                </p>
              ) : null}
            </div>

            <div className="text-xs font-medium text-slate-400">
              {formatDateTime(timestamp)}
            </div>
          </div>

          {meta.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {meta.map(([label, value]) => (
                <div
                  key={`${label}-${String(value)}`}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    {label}
                  </div>
                  <div className="break-all text-sm text-slate-700">
                    {String(value)}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function TransactionHistory({ history = [], loading = false }) {
  const safeHistory = Array.isArray(history) ? history : [];

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-gradient-to-r from-sky-50 to-cyan-50 px-5 py-5 md:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="page-kicker mb-3">
              <span className="page-dot" />
              Activity ledger
            </div>

            <h3 className="text-xl font-bold tracking-tight text-slate-900">
              Transaction History
            </h3>

            <p className="mt-2 text-sm text-slate-600">
              Review the property’s on-chain and workflow-related events in one clear chronological view.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Total Events
            </div>
            <div className="text-2xl font-bold text-sky-700">
              {loading ? "..." : safeHistory.length}
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-5 md:px-6 md:py-6">
        {loading ? (
          <div className="rounded-[1.25rem] border border-sky-200 bg-sky-50 px-6 py-12 text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-sky-500 border-t-transparent animate-spin" />
            <h4 className="text-lg font-semibold text-sky-800">
              Loading transaction history
            </h4>
            <p className="mt-2 text-sm text-sky-700">
              Fetching activity and workflow events for this property.
            </p>
          </div>
        ) : safeHistory.length > 0 ? (
          <div className="space-y-0">
            {safeHistory.map((item, index) => (
              <TimelineItem
                key={`${extractType(item)}-${extractTimestamp(item)}-${index}`}
                item={item}
                last={index === safeHistory.length - 1}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-6 py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sky-50 text-3xl">
              📜
            </div>
            <h4 className="text-xl font-bold tracking-tight text-slate-900">
              No history available yet
            </h4>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
              Once property actions are recorded, the transaction and workflow history will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}