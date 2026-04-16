import { useEffect, useState } from "react";
import { api } from "../api/pmr";
import type { Trade, Person, AssetType, TradeType, CurrencyType } from "../types/pmr";
import { Plus, TrendingUp, TrendingDown, ArrowLeftRight } from "lucide-react";

function fmt(n: number, d = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const PURITIES = ["999", "995", "916", "750", "585", "375", "925", "800"];

const EMPTY_FORM = {
  traderId: "",
  tradeType: "buy" as TradeType,
  asset: "gold" as AssetType,
  weight: "",
  purity: "999",
  pricePerGram: "",
  currency: "usd" as CurrencyType,
};

export function Trades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = () => {
    Promise.all([api.getTrades(), api.getTraders()])
      .then(([t, p]) => { setTrades(t); setPersons(p); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const totalValue = Number(form.weight) * Number(form.pricePerGram);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.traderId) { alert("Select a trader"); return; }
    setSaving(true);
    try {
      await api.createTrade({
        traderId: form.traderId,
        tradeType: form.tradeType,
        asset: form.asset,
        weight: Number(form.weight),
        purity: form.purity,
        pricePerGram: Number(form.pricePerGram),
        currency: form.currency,
      });
      setShowModal(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const buyCount = trades.filter((t) => t.tradeType === "buy").length;
  const sellCount = trades.filter((t) => t.tradeType === "sell").length;
  const totalUSD = trades.filter((t) => t.currency === "usd").reduce((s, t) => s + t.totalValue, 0);

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 className="gold-text" style={{ fontSize: 26, fontWeight: 800, margin: "0 0 4px" }}>
            Trades
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14, margin: 0 }}>
            Buy and sell precious metals — inventory and accounting update automatically
          </p>
        </div>
        <button className="btn-gold" onClick={() => setShowModal(true)}>
          <Plus size={15} /> New Trade
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        <div className="stat-card">
          <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Total Trades</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text)" }}>{trades.length}</div>
        </div>
        <div className="stat-card">
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            <TrendingDown size={13} color="var(--green)" /> Buys
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#22c55e" }}>{buyCount}</div>
        </div>
        <div className="stat-card">
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            <TrendingUp size={13} color="var(--red)" /> Sells
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--red)" }}>{sellCount}</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Total USD Volume</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "var(--gold)" }}>${fmt(totalUSD, 0)}</div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-container">
          {loading ? (
            <div className="empty-state">Loading…</div>
          ) : trades.length === 0 ? (
            <div className="empty-state">
              <ArrowLeftRight size={32} color="var(--border-2)" />
              No trades yet. Create your first trade.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Trader</th>
                  <th>Type</th>
                  <th>Asset</th>
                  <th>Weight (g)</th>
                  <th>Purity</th>
                  <th>Price/g</th>
                  <th>Total Value</th>
                </tr>
              </thead>
              <tbody>
                {trades.map((t) => (
                  <tr key={t.id}>
                    <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{fmtDate(t.createdAt)}</td>
                    <td style={{ fontWeight: 500 }}>{t.traderName}</td>
                    <td>
                      <span className={`badge ${t.tradeType === "buy" ? "badge-green" : "badge-red"}`}>
                        {t.tradeType === "buy"
                          ? <><TrendingDown size={10} style={{ marginRight: 4 }} />BUY</>
                          : <><TrendingUp size={10} style={{ marginRight: 4 }} />SELL</>}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${t.asset === "gold" ? "badge-gold" : "badge-gray"}`}>
                        {t.asset === "gold" ? "🥇" : "🥈"} {t.asset.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ fontFamily: "monospace" }}>{fmt(t.weight, 2)}</td>
                    <td style={{ color: "var(--text-muted)" }}>{t.purity}‰</td>
                    <td style={{ color: "var(--text-dim)" }}>
                      {t.currency.toUpperCase()} {fmt(t.pricePerGram, 3)}
                    </td>
                    <td style={{ fontWeight: 700, color: "var(--gold)" }}>
                      {t.currency.toUpperCase()} {fmt(t.totalValue, 2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-box" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", margin: "0 0 20px" }}>
              Record New Trade
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div style={{ gridColumn: "1/-1" }}>
                  <label className="label">Trader / Client</label>
                  <select
                    className="input"
                    value={form.traderId}
                    onChange={(e) => setForm({ ...form, traderId: e.target.value })}
                    required
                  >
                    <option value="">— Select —</option>
                    {persons.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Trade Type</label>
                  <select
                    className="input"
                    value={form.tradeType}
                    onChange={(e) => setForm({ ...form, tradeType: e.target.value as TradeType })}
                  >
                    <option value="buy">Buy</option>
                    <option value="sell">Sell</option>
                  </select>
                </div>

                <div>
                  <label className="label">Asset</label>
                  <select
                    className="input"
                    value={form.asset}
                    onChange={(e) => setForm({ ...form, asset: e.target.value as AssetType })}
                  >
                    <option value="gold">🥇 Gold</option>
                    <option value="silver">🥈 Silver</option>
                  </select>
                </div>

                <div>
                  <label className="label">Weight (grams)</label>
                  <input
                    className="input"
                    type="number"
                    step="0.001"
                    min="0.001"
                    placeholder="0.000"
                    value={form.weight}
                    onChange={(e) => setForm({ ...form, weight: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="label">Purity (‰)</label>
                  <select
                    className="input"
                    value={form.purity}
                    onChange={(e) => setForm({ ...form, purity: e.target.value })}
                  >
                    {PURITIES.map((p) => (
                      <option key={p} value={p}>{p}‰ {p === "999" ? "(Fine)" : p === "750" ? "(18K)" : p === "916" ? "(22K)" : p === "925" ? "(Sterling)" : ""}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Price per Gram</label>
                  <input
                    className="input"
                    type="number"
                    step="0.001"
                    min="0"
                    placeholder="0.000"
                    value={form.pricePerGram}
                    onChange={(e) => setForm({ ...form, pricePerGram: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="label">Currency</label>
                  <select
                    className="input"
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value as CurrencyType })}
                  >
                    <option value="usd">USD</option>
                    <option value="iqd">IQD</option>
                  </select>
                </div>

                {/* Calculated total */}
                {totalValue > 0 && (
                  <div style={{ gridColumn: "1/-1", background: "var(--surface-3)", border: "1px solid var(--border-2)", borderRadius: 8, padding: "12px 16px" }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                      Calculated Total Value
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "var(--gold)" }}>
                      {form.currency.toUpperCase()} {fmt(totalValue, 2)}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 12, padding: "10px 12px", background: "var(--surface-3)", borderRadius: 6 }}>
                ℹ️ Inventory and accounting entries will be created automatically.
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-gold" disabled={saving}>
                  {saving ? "Recording…" : "Record Trade"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
