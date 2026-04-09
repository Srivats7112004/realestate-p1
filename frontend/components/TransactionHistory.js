import { shortenAddress } from "../utils/helpers";

const typeColors = {
  listed: "bg-indigo-100 text-indigo-700",
  deposit: "bg-emerald-100 text-emerald-700",
  inspection: "bg-orange-100 text-orange-700",
  approval: "bg-blue-100 text-blue-700",
  verification: "bg-rose-100 text-rose-700",
  sale: "bg-purple-100 text-purple-700",
};

const formatDateTime = (value) => {
  if (!value) return "Unknown";
  return new Date(value).toLocaleString();
};

export default function TransactionHistory({ history, loading }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-700">🧾 Transaction History</h3>
        <span className="text-sm text-slate-400">{history?.length || 0} events</span>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Loading transaction history...</div>
      ) : !history?.length ? (
        <div className="text-sm text-slate-500">
          No history found. If this property was created before the event-enabled escrow contract,
          redeploy and relist to start collecting timeline events.
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div key={item.id} className="border border-slate-200 rounded-xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      typeColors[item.type] || "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {item.type}
                  </span>
                  <h4 className="font-semibold text-slate-800">{item.title}</h4>
                </div>
                <span className="text-xs text-slate-400">{formatDateTime(item.timestamp)}</span>
              </div>

              <p className="text-sm text-slate-600 mb-3">{item.subtitle}</p>

              <div className="grid md:grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-slate-400">Actor</div>
                  <div className="font-mono text-slate-700">{shortenAddress(item.actor)}</div>
                </div>
                <div>
                  <div className="text-slate-400">Amount</div>
                  <div className="text-slate-700">{item.amount ? `${item.amount} ETH` : "-"}</div>
                </div>
                <div>
                  <div className="text-slate-400">Tx Hash</div>
                  <div className="font-mono text-slate-700">{shortenAddress(item.txHash)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}