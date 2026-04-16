import { useEffect, useState } from "react";
import { api } from "../api/pmr";
import type { Person, PersonType } from "../types/pmr";
import { Plus, Trash2, Users, User, Briefcase } from "lucide-react";

const EMPTY_FORM = { name: "", phone: "", type: "trader" as PersonType };

export function Traders() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<"all" | PersonType>("all");

  const load = () => {
    api.getTraders()
      .then(setPersons)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createTrader(form);
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
    if (!confirm("Remove this person?")) return;
    await api.deleteTrader(id);
    setPersons((prev) => prev.filter((p) => p.id !== id));
  };

  const traders = persons.filter((p) => p.type === "trader");
  const clients = persons.filter((p) => p.type === "client");
  const displayed = filter === "all" ? persons : persons.filter((p) => p.type === filter);

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 className="gold-text" style={{ fontSize: 26, fontWeight: 800, margin: "0 0 4px" }}>
            Traders & Clients
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14, margin: 0 }}>
            Manage counterparties and client accounts
          </p>
        </div>
        <button className="btn-gold" onClick={() => setShowModal(true)}>
          <Plus size={15} /> Add Person
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        <div className="stat-card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Users size={15} color="var(--text-muted)" />
            <span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text)" }}>{persons.length}</div>
        </div>
        <div className="stat-card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Briefcase size={15} color="var(--gold)" />
            <span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Traders</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--gold)" }}>{traders.length}</div>
        </div>
        <div className="stat-card">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <User size={15} color="#3b82f6" />
            <span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Clients</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#3b82f6" }}>{clients.length}</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {(["all", "trader", "client"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "6px 16px",
              borderRadius: 8,
              border: "1px solid",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s",
              background: filter === f ? "var(--gold-glow)" : "transparent",
              color: filter === f ? "var(--gold)" : "var(--text-muted)",
              borderColor: filter === f ? "rgba(201,168,76,0.3)" : "var(--border-2)",
            }}
          >
            {f === "all" ? "All" : f === "trader" ? "Traders" : "Clients"}
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
              <Users size={32} color="var(--border-2)" />
              No {filter === "all" ? "people" : filter + "s"} found.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Type</th>
                  <th>Added</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%",
                          background: p.type === "trader" ? "rgba(201,168,76,0.15)" : "rgba(59,130,246,0.1)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, fontWeight: 700,
                          color: p.type === "trader" ? "var(--gold)" : "#3b82f6",
                          flexShrink: 0,
                        }}>
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        {p.name}
                      </div>
                    </td>
                    <td style={{ color: "var(--text-dim)", fontFamily: "monospace", fontSize: 13 }}>{p.phone || "—"}</td>
                    <td>
                      <span className={`badge ${p.type === "trader" ? "badge-gold" : "badge-blue"}`}>
                        {p.type === "trader" ? "TRADER" : "CLIENT"}
                      </span>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: 12 }}>
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <button className="btn-danger" onClick={() => handleDelete(p.id)}>
                        <Trash2 size={13} />
                      </button>
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
              Add Trader / Client
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label className="label">Full Name</label>
                  <input
                    className="input"
                    placeholder="e.g. Ahmed Al-Rashidi"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">Phone Number</label>
                  <input
                    className="input"
                    placeholder="+964-770-XXXXXXX"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Type</label>
                  <select
                    className="input"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as PersonType })}
                  >
                    <option value="trader">Trader</option>
                    <option value="client">Client</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-gold" disabled={saving}>
                  {saving ? "Saving…" : "Add Person"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
