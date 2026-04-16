import { useEffect, useState } from "react";
import { api } from "../api/pmr";
import type { DashboardData } from "../types/pmr";
import { TrendingUp, TrendingDown, Clock, CheckCircle } from "lucide-react";

function fmt(n: number, decimals = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function BalanceCard({ label, value, unit, icon, color }: {
  label: string; value: number; unit: string; icon: string; color: string;
}) {
  return (
    <div className="stat-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {label}
        </span>
        <span style={{ fontSize: 22 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1, marginBottom: 4 }}>
        {unit === "g" ? fmt(value, 1) : fmt(value, 0)}
      </div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{unit}</div>
    </div>
  );
}

function SummaryCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 20 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ color: "var(--text-muted)", fontSize: 14 }}>Loading dashboard…</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={{ padding: "32px" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 className="gold-text" style={{ fontSize: 28, fontWeight: 800, margin: "0 0 4px" }}>
          Operations Dashboard
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14, margin: 0 }}>
          Real-time overview of your precious metals trading operations
        </p>
      </div>

      {/* Balance Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <BalanceCard label="Gold Balance" value={data.balances.gold} unit="grams" icon="🥇" color="var(--gold)" />
        <BalanceCard label="Silver Balance" value={data.balances.silver} unit="grams" icon="🥈" color="#C0C0C0" />
        <BalanceCard label="USD Balance" value={data.balances.usd} unit="USD" icon="💵" color="#22c55e" />
        <BalanceCard label="IQD Balance" value={data.balances.iqd} unit="IQD" icon="💴" color="#3b82f6" />
      </div>

      {/* Middle Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 28 }}>
        {/* Custody Summary */}
        <SummaryCard title="Custody Summary">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "var(--text-dim)" }}>Gold under custody</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: "var(--gold)" }}>{fmt(data.custodySummary.gold, 1)} g</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "var(--text-dim)" }}>Silver under custody</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: "#C0C0C0" }}>{fmt(data.custodySummary.silver, 1)} g</span>
            </div>
            <hr className="sep" />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Total custody records</span>
              <span className="badge badge-gold">{data.custodySummary.total} clients</span>
            </div>
          </div>
        </SummaryCard>

        {/* Hawala Summary */}
        <SummaryCard title="Hawala Status">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-dim)" }}>
                <Clock size={13} color="var(--amber)" /> Pending
              </span>
              <span className="badge badge-amber">{data.hawalaSummary.pending}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-dim)" }}>
                <CheckCircle size={13} color="var(--green)" /> Completed
              </span>
              <span className="badge badge-green">{data.hawalaSummary.completed}</span>
            </div>
            <hr className="sep" />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Pending USD amount</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
                ${fmt(data.hawalaSummary.pendingAmount, 0)}
              </span>
            </div>
          </div>
        </SummaryCard>

        {/* Inventory Summary */}
        <SummaryCard title="Inventory">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {data.inventorySummary.length === 0 && (
              <span style={{ color: "var(--text-muted)", fontSize: 13 }}>No inventory items</span>
            )}
            {data.inventorySummary.map((item) => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "var(--text-dim)" }}>
                  {item.asset === "gold" ? "🥇" : "🥈"} {item.asset.toUpperCase()} {item.purity}‰
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: item.asset === "gold" ? "var(--gold)" : "#C0C0C0" }}>
                  {fmt(item.weight, 1)} g
                </span>
              </div>
            ))}
          </div>
        </SummaryCard>
      </div>

      {/* Recent Trades */}
      <div className="card">
        <div style={{ padding: "20px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Recent Trades
          </div>
        </div>
        <div style={{ marginTop: 16 }} className="table-container">
          {data.recentTrades.length === 0 ? (
            <div className="empty-state">No trades recorded yet</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Trader</th>
                  <th>Type</th>
                  <th>Asset</th>
                  <th>Weight</th>
                  <th>Purity</th>
                  <th>Price/g</th>
                  <th>Total Value</th>
                </tr>
              </thead>
              <tbody>
                {data.recentTrades.map((t) => (
                  <tr key={t.id}>
                    <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{fmtDate(t.createdAt)}</td>
                    <td style={{ fontWeight: 500 }}>{t.traderName}</td>
                    <td>
                      <span className={`badge ${t.tradeType === "buy" ? "badge-green" : "badge-red"}`}>
                        {t.tradeType === "buy" ? (
                          <><TrendingDown size={10} style={{ marginRight: 4 }} />BUY</>
                        ) : (
                          <><TrendingUp size={10} style={{ marginRight: 4 }} />SELL</>
                        )}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${t.asset === "gold" ? "badge-gold" : "badge-gray"}`}>
                        {t.asset.toUpperCase()}
                      </span>
                    </td>
                    <td>{fmt(t.weight, 2)} g</td>
                    <td style={{ color: "var(--text-muted)" }}>{t.purity}‰</td>
                    <td style={{ color: "var(--text-dim)" }}>
                      {t.currency.toUpperCase()} {fmt(t.pricePerGram, 2)}
                    </td>
                    <td style={{ fontWeight: 600, color: "var(--gold)" }}>
                      {t.currency.toUpperCase()} {fmt(t.totalValue, 2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
