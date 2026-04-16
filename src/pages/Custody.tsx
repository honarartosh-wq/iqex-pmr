import { useEffect, useState } from "react";
import { api } from "../api/pmr";
import type { CustodyItem, Person, AssetType } from "../types/pmr";
import { Plus, Shield, Trash2 } from "lucide-react";

function fmt(n: number, d = 2) {
  return n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const PURITIES = ["999", "995", "916", "750", "585", "375", "925", "800"];

const EMPTY_FORM = { clientId: "", asset: "gold" as AssetType, weight: "", purity: "999", notes: "" };

export function Custody() {
  const [items, setItems] = useState<CustodyItem[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = () => {
    Promise.all([api.getCustody(), api.getTraders()])
      .then(([c, p]) => { setItems(c); setPersons(p); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientId) { alert("Select a client"); return; }
    setSaving(true);
    try {
      await api.createCustody({ ...form, weight: Number(form.weight) });
      setShowModal(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this custody record?")) return;
    await api.deleteCustody(id);
    setItems((prev) => prev.filter((c) => c.id !== id));
  };

  const goldItems = items.filter((i) => i.asset === "gold");
  const silverItems = items.filter((i) => i.asset === "silver");
  const totalGold = goldItems.reduce((s, i) => s + i.weight, 0);
  const totalSilver = silverItems.reduce((s, i) => s + i.weight, 0);

  // Group by client
  const byClient = items.reduce<Record<string, { name: string; gold: number; silver: number; items: CustodyItem[] }>>((acc, item) => {
    if (!acc[item.clientId]) acc[item.clientId] = { name: item.clientName, gold: 0, silver: 0, items: [] };
    if (item.asset === "gold") acc[item.clientId].gold += item.weight;
    else acc[item.clientId].silver += item.weight;
    acc[item.clientId].items.push(item);
    return acc;
  }, {});

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 className="gold-text" style={{ fontSize: 26, fontWeight: 800, margin: "0 0 4px" }}>
            Custody
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14, margin: 0 }}>
            Client assets held in trust — tracked separately from company inventory
          </p>
        </div>
        <button className="btn-gold" onClick={() => setShowModal(true)}>
          <Plus size={15} /> New Custody Record
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        <div className="stat-card">
          <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Total Clients</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text)" }}>{Object.keys(byClient).length}</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Client Gold</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "var(--gold)" }}>{fmt(totalGold, 1)} g</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Client Silver</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#C0C0C0" }}>{fmt(totalSilver, 1)} g</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Total Records</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#3b82f6" }}>{items.length}</div>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : items.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Shield size={32} color="var(--border-2)" />
            No custody records. Add client assets to track.
          </div>
        </div>
      ) : (
        <>
          {/* Client summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14, marginBottom: 20 }}>
            {Object.entries(byClient).map(([id, client]) => (
              <div key={id} className="card-2" style={{ padding: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: "rgba(59,130,246,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 15, fontWeight: 700, color: "#3b82f6",
                  }}>
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{client.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{client.items.length} record(s)</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  {client.gold > 0 && (
                    <div style={{ flex: 1, background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 8, padding: "8px 12px" }}>
                      <div style={{ fontSize: 10, color: "var(--gold-dim)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Gold</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--gold)" }}>{fmt(client.gold, 1)} g</div>
                    </div>
                  )}
                  {client.silver > 0 && (
                    <div style={{ flex: 1, background: "rgba(192,192,192,0.06)", border: "1px solid rgba(192,192,192,0.12)", borderRadius: 8, padding: "8px 12px" }}>
                      <div style={{ fontSize: 10, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>Silver</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#C0C0C0" }}>{fmt(client.silver, 1)} g</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Detailed table */}
          <div className="card">
            <div style={{ padding: "16px 20px 0", fontSize: 12, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              All Custody Records
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Asset</th>
                    <th>Weight (g)</th>
                    <th>Purity</th>
                    <th>Notes</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 500 }}>{item.clientName}</td>
                      <td>
                        <span className={`badge ${item.asset === "gold" ? "badge-gold" : "badge-gray"}`}>
                          {item.asset === "gold" ? "🥇 GOLD" : "🥈 SILVER"}
                        </span>
                      </td>
                      <td style={{ fontFamily: "monospace", fontWeight: 600, color: item.asset === "gold" ? "var(--gold)" : "#C0C0C0" }}>
                        {fmt(item.weight, 3)}
                      </td>
                      <td style={{ color: "var(--text-muted)" }}>{item.purity}‰</td>
                      <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{item.notes || "—"}</td>
                      <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{fmtDate(item.createdAt)}</td>
                      <td>
                        <button className="btn-danger" onClick={() => handleDelete(item.id)}>
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", margin: "0 0 20px" }}>
              New Custody Record
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label className="label">Client</label>
                  <select className="input" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} required>
                    <option value="">— Select Client —</option>
                    {persons.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label className="label">Asset</label>
                    <select className="input" value={form.asset} onChange={(e) => setForm({ ...form, asset: e.target.value as AssetType })}>
                      <option value="gold">🥇 Gold</option>
                      <option value="silver">🥈 Silver</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Purity (‰)</label>
                    <select className="input" value={form.purity} onChange={(e) => setForm({ ...form, purity: e.target.value })}>
                      {PURITIES.map((p) => <option key={p} value={p}>{p}‰</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">Weight (grams)</label>
                  <input className="input" type="number" step="0.001" min="0.001" placeholder="0.000" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} required />
                </div>
                <div>
                  <label className="label">Notes (optional)</label>
                  <input className="input" placeholder="Reason, description…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}>
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-gold" disabled={saving}>{saving ? "Saving…" : "Save Record"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
