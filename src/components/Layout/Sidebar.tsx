import {
  LayoutDashboard,
  Landmark,
  Users,
  ArrowLeftRight,
  Package,
  Globe,
  Shield,
} from "lucide-react";
import type { Page } from "../../types/pmr";

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
}

const navItems: { page: Page; label: string; icon: React.ReactNode }[] = [
  { page: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={17} /> },
  { page: "accounts", label: "Accounts", icon: <Landmark size={17} /> },
  { page: "traders", label: "Traders & Clients", icon: <Users size={17} /> },
  { page: "trades", label: "Trades", icon: <ArrowLeftRight size={17} /> },
  { page: "inventory", label: "Inventory", icon: <Package size={17} /> },
  { page: "hawala", label: "Hawala", icon: <Globe size={17} /> },
  { page: "custody", label: "Custody", icon: <Shield size={17} /> },
];

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #C9A84C 0%, #7A6228 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              fontWeight: 800,
              color: "#000",
              flexShrink: 0,
            }}
          >
            ⬡
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", lineHeight: 1.2 }}>
              IQEX PMR
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.08em" }}>
              METALS TRADING
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: "14px 12px", flex: 1, overflowY: "auto" }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.1em", padding: "0 4px 8px", textTransform: "uppercase" }}>
          Navigation
        </div>
        {navItems.map(({ page, label, icon }) => (
          <button
            key={page}
            className={`nav-item${activePage === page ? " active" : ""}`}
            onClick={() => onNavigate(page)}
            style={{ width: "100%", textAlign: "left" }}
          >
            {icon}
            {label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: "14px 16px", borderTop: "1px solid var(--border)" }}>
        <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6 }}>
          <span style={{ color: "var(--gold)", fontWeight: 600 }}>IQEX</span> Precious Metals Registry
          <br />v1.0.0 — Production
        </div>
      </div>
    </aside>
  );
}
