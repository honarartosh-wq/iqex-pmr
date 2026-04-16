import { useState } from "react";
import { Sidebar } from "./components/Layout/Sidebar";
import { Dashboard } from "./pages/Dashboard";
import { Accounts } from "./pages/Accounts";
import { Traders } from "./pages/Traders";
import { Trades } from "./pages/Trades";
import { Inventory } from "./pages/Inventory";
import { Hawala } from "./pages/Hawala";
import { Custody } from "./pages/Custody";
import type { Page } from "./types/pmr";

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <Dashboard />;
      case "accounts": return <Accounts />;
      case "traders": return <Traders />;
      case "trades": return <Trades />;
      case "inventory": return <Inventory />;
      case "hawala": return <Hawala />;
      case "custody": return <Custody />;
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar activePage={page} onNavigate={setPage} />
      <main className="main-content fade-in" key={page}>
        {renderPage()}
      </main>
    </div>
  );
}
