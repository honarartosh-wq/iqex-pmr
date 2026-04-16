import { useEffect, useState } from "react";
import { api } from "../api/pmr";
import type { Account, AccountType } from "../types/pmr";
import { Plus, Trash2, Landmark } from "lucide-react";

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const ACCOUNT_TYPES: { value: AccountType; label: string; unit: string; icon: string }[] = [
  { value: "gold", label: "Gold", unit: "g", icon: "🥇" },
  { value: "silver", label: "Silver", unit: "g", icon: "🥈" },
  { value: "usd", label: "USD", unit: "USD", icon: "💵" },
  { value: "iqd", label: "IQD", unit: "IQD", icon: "💴" },
  { value: "bank", label: "Bank", unit: "USD", icon: "🏦" },
];

function typeInfo(t: AccountType) {
  return ACCOUNT_TYPES.find((x) => x.value === t) ?? ACCOUNT_TYPES[2];
}

function typeBadge(t: AccountType) {
  if (t === "gold") return "badge-gold";
  if (t === "silver") return "badge-gray";
  if (t === "usd") return "badge-green";
  if (t === "iqd") return "badge-blue";
  return "badge-gray";
}

const EMPTY_FORM = { name: "", type: "usd" as AccountType, balance: "" };

export function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.getAccounts()
      .then(setAccounts)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createAccount({ name: form.name, type: form.type, balance: Number(form.balance) || 0 });
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
    if (!confirm("Delete this account?")) return;
    await api.deleteAccount(id);
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  const totalUSD = accounts
    .filter((a) => a.type === "usd" || a.type === "bank")
    .reduce((s, a) => s + a.balance, 0);

  return (
    <div style={{ padding: 32 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 className="gold-text" style={{ fontSize: 26, fontWeight: 800, margin: "0 0 4px" }}>
            Chart of Accounts
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14, margin: 0 }}>
            Double-entry accounting system for all asset accounts
          </p>
        </div>
        <button className="btn-gold" onClick={() => setShowModal(true)}>
          <Plus size={15} /> New Account
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        <div className="stat-card">
          <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Total Accounts</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "var(--text)" }}>{accounts.length}</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Total USD Liquid</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "#22c55e" }}>${fmt(totalUSD)}</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Metal Accounts</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "var(--gold)" }}>
            {accounts.filter((a) => a.type === "gold" || a.type === "silver").length}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-container">
          {loading ? (
            <div className="empty-state">Loading…</div>
          ) : accounts.length === 0 ? (
            <div className="empty-state">
              <Landmark size={32} color="var(--border-2)" />
              No accounts yet. Create your first account.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Account Name</th>
                  <th>Type</th>
                  <th>Balance</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => {
                  const info = typeInfo(a.type);
                  return (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 500 }}>
                        <span style={{ marginRight: 8 }}>{info.icon}</span>
                        {a.name}
                      </td>
                      <td>
                        <span className={`badge ${typeBadge(a.type)}`}>{a.type.toUpperCase()}</span>
                      </td>
                      <td style={{ fontWeight: 600, color: a.balance >= 0 ? "var(--text)" : "var(--red)" }}>
                        {fmt(a.balance)} <span style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 400 }}>{info.unit}</span>
                      </td>
                      <td style={{ color: "var(--text-muted)", fontSize: 12 }}>
                        {new Date(a.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <button className="btn-danger" onClick={() => handleDelete(a.id)}>
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
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
              Create New Account
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label className="label">Account Name</label>
                  <input
                    className="input"
                    placeholder="e.g. Main Gold Vault"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label">Account Type</label>
                  <select
                    className="input"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as AccountType })}
                  >
                    {ACCOUNT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Opening Balance (optional)</label>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.balance}
                    onChange={(e) => setForm({ ...form, balance: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
                <button type="button" className="btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-gold" disabled={saving}>
                  {saving ? "Creating…" : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
