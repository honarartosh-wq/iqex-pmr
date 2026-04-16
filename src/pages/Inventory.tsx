import { useEffect, useState } from "react";
import { api } from "../api/pmr";
import type { InventoryItem } from "../types/pmr";
import { Package, RefreshCw } from "lucide-react";

function fmt(n: number, d = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}

function PurityBar({ weight, max }: { weight: number; max: number }) {
  const pct = max > 0 ? (weight / max) * 100 : 0;
  return (
    <div style={{ width: "100%", height: 4, background: "var(--border-2)", borderRadius: 2, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, var(--gold-dim), var(--gold))", borderRadius: 2, transition: "width 0.4s ease" }} />
    </div>
  );
}

export function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.getInventory()
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const goldItems = items.filter((i) => i.asset === "gold");
  const silverItems = items.filter((i) => i.asset === "silver");
  const totalGold = goldItems.reduce((s, i) => s + i.weight, 0);
  const totalSilver = silverItems.reduce((s, i) => s + i.weight, 0);
  const maxGold = Math.max(...goldItems.map((i) => i.weight), 1);
  const maxSilver = Math.max(...silverItems.map((i) => i.weight), 1);

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 className="gold-text" style={{ fontSize: 26, fontWeight: 800, margin: "0 0 4px" }}>
            Inventory
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14, margin: 0 }}>
            Physical stock of gold and silver grouped by purity — auto-updated on each trade
          </p>
        </div>
        <button className="btn-ghost" onClick={load}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div className="stat-card" style={{ borderColor: "rgba(201,168,76,0.2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Gold Stock</span>
            <span style={{ fontSize: 22 }}>🥇</span>
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, color: "var(--gold)", marginBottom: 4 }}>{fmt(totalGold, 1)}</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>grams across {goldItems.length} purity grades</div>
        </div>
        <div className="stat-card" style={{ borderColor: "rgba(192,192,192,0.15)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Silver Stock</span>
            <span style={{ fontSize: 22 }}>🥈</span>
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, color: "#C0C0C0", marginBottom: 4 }}>{fmt(totalSilver, 1)}</div>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>grams across {silverItems.length} purity grades</div>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : items.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Package size={32} color="var(--border-2)" />
            Inventory is empty. Record a buy trade to add stock.
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Gold */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <span style={{ fontSize: 18 }}>🥇</span>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--gold)" }}>Gold</div>
              <span className="badge badge-gold" style={{ marginLeft: "auto" }}>{fmt(totalGold, 1)} g total</span>
            </div>

            {goldItems.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>No gold in stock</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {goldItems.map((item) => (
                  <div key={item.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{item.purity}‰</span>
                        <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 8 }}>
                          {item.purity === "999" ? "Fine Gold" : item.purity === "916" ? "22K" : item.purity === "750" ? "18K" : item.purity === "585" ? "14K" : ""}
                        </span>
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "var(--gold)" }}>{fmt(item.weight, 2)} g</span>
                    </div>
                    <PurityBar weight={item.weight} max={maxGold} />
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                      Updated {new Date(item.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Silver */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <span style={{ fontSize: 18 }}>🥈</span>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#C0C0C0" }}>Silver</div>
              <span className="badge badge-gray" style={{ marginLeft: "auto" }}>{fmt(totalSilver, 1)} g total</span>
            </div>

            {silverItems.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>No silver in stock</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {silverItems.map((item) => (
                  <div key={item.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{item.purity}‰</span>
                        <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 8 }}>
                          {item.purity === "999" ? "Fine Silver" : item.purity === "925" ? "Sterling" : item.purity === "800" ? "Standard" : ""}
                        </span>
                      </div>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "#C0C0C0" }}>{fmt(item.weight, 2)} g</span>
                    </div>
                    <div style={{ width: "100%", height: 4, background: "var(--border-2)", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{
                        width: `${maxSilver > 0 ? (item.weight / maxSilver) * 100 : 0}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, #888, #C0C0C0)",
                        borderRadius: 2,
                      }} />
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                      Updated {new Date(item.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full table */}
      {items.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <div style={{ padding: "16px 20px 0", fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Full Inventory Ledger
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Purity</th>
                  <th>Weight (g)</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className={`badge ${item.asset === "gold" ? "badge-gold" : "badge-gray"}`}>
                        {item.asset === "gold" ? "🥇 GOLD" : "🥈 SILVER"}
                      </span>
                    </td>
                    <td style={{ fontFamily: "monospace", fontWeight: 600 }}>{item.purity}‰</td>
                    <td style={{ fontWeight: 700, color: item.asset === "gold" ? "var(--gold)" : "#C0C0C0" }}>
                      {fmt(item.weight, 3)}
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: 12 }}>
                      {new Date(item.updatedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
