import { useEffect, useState } from "react";
import { api } from "../api/pmr";
import type { HawalaTransaction, HawalaStatus, CurrencyType } from "../types/pmr";
import { Plus, Globe, CheckCircle, Clock, XCircle, Trash2 } from "lucide-react";

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

const STATUS_ICONS: Record<HawalaStatus, React.ReactNode> = {
  pending: <Clock size={13} />,
  completed: <CheckCircle size={13} />,
  cancelled: <XCircle size={13} />,
};
const STATUS_BADGE: Record<HawalaStatus, string> = {
  pending: "badge-amber",
  completed: "badge-green",
  cancelled: "badge-red",
};

const EMPTY_FORM = {
  senderName: "", receiverName: "", amount: "", currency: "usd" as CurrencyType, notes: "",
};

export function Hawala() {
  const [txs, setTxs] = useState<HawalaTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | HawalaStatus>("all");

  const load = () => {
    api.getHawala()
      .then(setTxs)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createHawala({ ...form, amount: Number(form.amount) });
      setShowModal(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id: string, status: HawalaStatus) => {
    await api.updateHawalaStatus(id, status);
    setTxs((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this hawala record?")) return;
    await api.deleteHawala(id);
    setTxs((prev) => prev.filter((t) => t.id !== id));
  };

  const pending = txs.filter((t) => t.status === "pending");
  const completed = txs.filter((t) => t.status === "completed");
  const pendingUSD = pending.filter((t) => t.currency === "usd").reduce((s, t) => s + t.amount, 0);
  const displayed = filterStatus === "all" ? txs : txs.filter((t) => t.status === filterStatus);

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 className="gold-text" style={{ fontSize: 26, fontWeight: 800, margin: "0 0 4px" }}>
            Hawala Transfers
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14, margin: 0 }}>
            Track informal value transfer transactions across regions
          </p>
        </div>
        <button className="btn-gold" onClick={() => setShowModal(true)}>
          <Plus size={15} /> New Transfer
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        <div className="stat-card">
          <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Total Transfers</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text)" }}>{txs.length}</div>
        </div>
        <div className="stat-card">
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            <Clock size={12} color="var(--amber)" /> Pending
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--amber)" }}>{pending.length}</div>
        </div>
        <div className="stat-card">
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            <CheckCircle size={12} color="var(--green)" /> Completed
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#22c55e" }}>{completed.length}</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Pending USD</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "var(--amber)" }}>${fmt(pendingUSD)}</div>
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {(["all", "pending", "completed", "cancelled"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            style={{
              padding: "6px 16px", borderRadius: 8, border: "1px solid",
              fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
              background: filterStatus === s ? "var(--gold-glow)" : "transparent",
              color: filterStatus === s ? "var(--gold)" : "var(--text-muted)",
              borderColor: filterStatus === s ? "rgba(201,168,76,0.3)" : "var(--border-2)",
            }}
          >
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-container">
          {loading ? (
            <div className="empty-state">Loading…</div>
          ) : displayed.length === 0 ? (
            <div className="empty-state">
              <Globe size={32} color="var(--border-2)" />
              No hawala transfers found.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Sender</th>
                  <th>Receiver</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((t) => (
                  <tr key={t.id}>
                    <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{fmtDate(t.createdAt)}</td>
                    <td style={{ fontWeight: 500 }}>{t.senderName}</td>
                    <td style={{ color: "var(--text-dim)" }}>{t.receiverName}</td>
                    <td style={{ fontWeight: 600, color: t.currency === "usd" ? "#22c55e" : "#3b82f6" }}>
                      {t.currency.toUpperCase()} {fmt(t.amount)}
                    </td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[t.status]}`} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        {STATUS_ICONS[t.status]}
                        {t.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: 12, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }}>
                      {t.notes || "—"}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        {t.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleStatusChange(t.id, "completed")}
                              style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(34,197,94,0.3)", background: "transparent", color: "#22c55e", fontSize: 12, cursor: "pointer" }}
                            >
                              ✓ Complete
                            </button>
                            <button
                              onClick={() => handleStatusChange(t.id, "cancelled")}
                              style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)", background: "transparent", color: "var(--red)", fontSize: 12, cursor: "pointer" }}
                            >
                              ✕ Cancel
                            </button>
                          </>
                        )}
                        <button className="btn-danger" onClick={() => handleDelete(t.id)}>
                          <Trash2 size={12} />
                        </button>
                      </div>
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
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", margin: "0 0 20px" }}>
              Record Hawala Transfer
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label className="label">Sender Name</label>
                  <input className="input" placeholder="Sender" value={form.senderName} onChange={(e) => setForm({ ...form, senderName: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Receiver Name</label>
                  <input className="input" placeholder="Receiver / Agent" value={form.receiverName} onChange={(e) => setForm({ ...form, receiverName: e.target.value })} required />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label className="label">Amount</label>
                    <input className="input" type="number" step="0.01" min="0" placeholder="0.00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
                  </div>
                  <div>
                    <label className="label">Currency</label>
                    <select className="input" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value as CurrencyType })}>
                      <option value="usd">USD</option>
                      <option value="iqd">IQD</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">Notes (optional)</label>
                  <input className="input" placeholder="Purpose, reference…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}>
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-gold" disabled={saving}>{saving ? "Recording…" : "Record Transfer"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
