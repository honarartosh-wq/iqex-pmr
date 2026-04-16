import express from "express";
import { createServer } from "http";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Types ────────────────────────────────────────────────────────────────────

type AccountType = "gold" | "silver" | "usd" | "iqd" | "bank";
type PersonType = "trader" | "client";
type AssetType = "gold" | "silver";
type TradeType = "buy" | "sell";
type CurrencyType = "usd" | "iqd";
type HawalaStatus = "pending" | "completed" | "cancelled";
type EntryType = "debit" | "credit";

interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  createdAt: string;
}

interface Person {
  id: string;
  name: string;
  phone: string;
  type: PersonType;
  createdAt: string;
}

interface Trade {
  id: string;
  traderId: string;
  traderName: string;
  tradeType: TradeType;
  asset: AssetType;
  weight: number;
  purity: string;
  pricePerGram: number;
  totalValue: number;
  currency: CurrencyType;
  createdAt: string;
}

interface InventoryItem {
  id: string;
  asset: AssetType;
  purity: string;
  weight: number;
  updatedAt: string;
}

interface JournalEntry {
  id: string;
  tradeId: string;
  accountId: string;
  accountName: string;
  entryType: EntryType;
  amount: number;
  description: string;
  createdAt: string;
}

interface HawalaTransaction {
  id: string;
  senderName: string;
  receiverName: string;
  amount: number;
  currency: CurrencyType;
  status: HawalaStatus;
  notes: string;
  createdAt: string;
}

interface CustodyItem {
  id: string;
  clientId: string;
  clientName: string;
  asset: AssetType;
  weight: number;
  purity: string;
  notes: string;
  createdAt: string;
}

// ─── In-Memory Store ──────────────────────────────────────────────────────────

const db = {
  accounts: [] as Account[],
  persons: [] as Person[],
  trades: [] as Trade[],
  inventory: [] as InventoryItem[],
  journal: [] as JournalEntry[],
  hawala: [] as HawalaTransaction[],
  custody: [] as CustodyItem[],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function upsertInventory(asset: AssetType, purity: string, weight: number, isBuy: boolean) {
  const existing = db.inventory.find((i) => i.asset === asset && i.purity === purity);
  const delta = isBuy ? weight : -weight;
  if (existing) {
    existing.weight = Math.max(0, existing.weight + delta);
    existing.updatedAt = new Date().toISOString();
  } else if (isBuy) {
    db.inventory.push({ id: randomUUID(), asset, purity, weight, updatedAt: new Date().toISOString() });
  }
}

function postJournal(trade: Trade) {
  const assetAcc = db.accounts.find((a) => a.type === trade.asset);
  const cashAcc = db.accounts.find((a) => a.type === trade.currency);
  if (!assetAcc || !cashAcc) return;
  const now = new Date().toISOString();

  if (trade.tradeType === "buy") {
    db.journal.push({
      id: randomUUID(), tradeId: trade.id, accountId: assetAcc.id, accountName: assetAcc.name,
      entryType: "debit", amount: trade.totalValue,
      description: `Buy ${trade.weight}g ${trade.asset} (${trade.purity})`, createdAt: now,
    });
    db.journal.push({
      id: randomUUID(), tradeId: trade.id, accountId: cashAcc.id, accountName: cashAcc.name,
      entryType: "credit", amount: trade.totalValue,
      description: `Payment for ${trade.asset} purchase`, createdAt: now,
    });
    assetAcc.balance += trade.weight;
    cashAcc.balance -= trade.totalValue;
  } else {
    db.journal.push({
      id: randomUUID(), tradeId: trade.id, accountId: cashAcc.id, accountName: cashAcc.name,
      entryType: "debit", amount: trade.totalValue,
      description: `Sale of ${trade.weight}g ${trade.asset} (${trade.purity})`, createdAt: now,
    });
    db.journal.push({
      id: randomUUID(), tradeId: trade.id, accountId: assetAcc.id, accountName: assetAcc.name,
      entryType: "credit", amount: trade.totalValue,
      description: `${trade.asset} sold`, createdAt: now,
    });
    cashAcc.balance += trade.totalValue;
    assetAcc.balance -= trade.weight;
  }
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

function seed() {
  db.accounts = [
    { id: randomUUID(), name: "Gold Vault", type: "gold", balance: 5280.5, createdAt: new Date().toISOString() },
    { id: randomUUID(), name: "Silver Vault", type: "silver", balance: 42000, createdAt: new Date().toISOString() },
    { id: randomUUID(), name: "USD Cash", type: "usd", balance: 285000, createdAt: new Date().toISOString() },
    { id: randomUUID(), name: "IQD Cash", type: "iqd", balance: 12500000, createdAt: new Date().toISOString() },
    { id: randomUUID(), name: "Rafidain Bank", type: "bank", balance: 550000, createdAt: new Date().toISOString() },
  ];

  db.persons = [
    { id: randomUUID(), name: "Ahmed Al-Rashidi", phone: "+964-770-1234567", type: "trader", createdAt: new Date().toISOString() },
    { id: randomUUID(), name: "Fatima Al-Hassan", phone: "+964-781-9876543", type: "client", createdAt: new Date().toISOString() },
    { id: randomUUID(), name: "Karim Traders LLC", phone: "+964-750-5551234", type: "trader", createdAt: new Date().toISOString() },
    { id: randomUUID(), name: "Zainab Investment", phone: "+964-790-1112233", type: "client", createdAt: new Date().toISOString() },
  ];

  db.inventory = [
    { id: randomUUID(), asset: "gold", purity: "999", weight: 2000, updatedAt: new Date().toISOString() },
    { id: randomUUID(), asset: "gold", purity: "750", weight: 1500, updatedAt: new Date().toISOString() },
    { id: randomUUID(), asset: "silver", purity: "999", weight: 25000, updatedAt: new Date().toISOString() },
    { id: randomUUID(), asset: "silver", purity: "925", weight: 17000, updatedAt: new Date().toISOString() },
  ];

  db.hawala = [
    {
      id: randomUUID(), senderName: "Ahmed Al-Rashidi", receiverName: "Khalid Dubai",
      amount: 50000, currency: "usd", status: "completed",
      notes: "Gold payment transfer", createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: randomUUID(), senderName: "Zainab Investment", receiverName: "Local Agent",
      amount: 5000000, currency: "iqd", status: "pending",
      notes: "Silver purchase settlement", createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: randomUUID(), senderName: "Karim Traders LLC", receiverName: "Beirut Partner",
      amount: 25000, currency: "usd", status: "pending",
      notes: "Export proceeds", createdAt: new Date().toISOString(),
    },
  ];

  // Sample trades (manually built to avoid circular deps with seed persons)
  const p1 = db.persons[0];
  const p2 = db.persons[2];

  const t1: Trade = {
    id: randomUUID(), traderId: p1.id, traderName: p1.name,
    tradeType: "buy", asset: "gold", weight: 500, purity: "999",
    pricePerGram: 63.5, totalValue: 31750, currency: "usd",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  };
  db.trades.push(t1);

  const t2: Trade = {
    id: randomUUID(), traderId: p2.id, traderName: p2.name,
    tradeType: "sell", asset: "gold", weight: 200, purity: "750",
    pricePerGram: 48.0, totalValue: 9600, currency: "usd",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  };
  db.trades.push(t2);

  db.custody = [
    {
      id: randomUUID(), clientId: db.persons[1].id, clientName: db.persons[1].name,
      asset: "gold", weight: 300, purity: "999",
      notes: "Inheritance storage", createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    },
    {
      id: randomUUID(), clientId: db.persons[3].id, clientName: db.persons[3].name,
      asset: "silver", weight: 5000, purity: "925",
      notes: "Investment hold", createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
  ];
}

seed();

// ─── Express App ──────────────────────────────────────────────────────────────

async function startServer() {
  const app = express();
  const httpServer = createServer(app);

  app.use(express.json());

  // Dashboard
  app.get("/api/dashboard", (_req, res) => {
    const gold = db.accounts.find((a) => a.type === "gold");
    const silver = db.accounts.find((a) => a.type === "silver");
    const usd = db.accounts.find((a) => a.type === "usd");
    const iqd = db.accounts.find((a) => a.type === "iqd");

    res.json({
      balances: {
        gold: gold?.balance ?? 0,
        silver: silver?.balance ?? 0,
        usd: usd?.balance ?? 0,
        iqd: iqd?.balance ?? 0,
      },
      recentTrades: [...db.trades].reverse().slice(0, 8),
      custodySummary: {
        gold: db.custody.filter((c) => c.asset === "gold").reduce((s, c) => s + c.weight, 0),
        silver: db.custody.filter((c) => c.asset === "silver").reduce((s, c) => s + c.weight, 0),
        total: db.custody.length,
      },
      hawalaSummary: {
        pending: db.hawala.filter((h) => h.status === "pending").length,
        completed: db.hawala.filter((h) => h.status === "completed").length,
        total: db.hawala.length,
        pendingAmount: db.hawala.filter((h) => h.status === "pending" && h.currency === "usd").reduce((s, h) => s + h.amount, 0),
      },
      inventorySummary: db.inventory,
    });
  });

  // Accounts
  app.get("/api/accounts", (_req, res) => res.json(db.accounts));
  app.post("/api/accounts", (req, res) => {
    const { name, type, balance = 0 } = req.body;
    if (!name || !type) return res.status(400).json({ error: "name and type required" });
    const acc: Account = { id: randomUUID(), name, type, balance: Number(balance), createdAt: new Date().toISOString() };
    db.accounts.push(acc);
    res.status(201).json(acc);
  });
  app.delete("/api/accounts/:id", (req, res) => {
    const idx = db.accounts.findIndex((a) => a.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });
    db.accounts.splice(idx, 1);
    res.json({ success: true });
  });

  // Traders & Clients
  app.get("/api/traders", (_req, res) => res.json(db.persons));
  app.post("/api/traders", (req, res) => {
    const { name, phone, type } = req.body;
    if (!name || !type) return res.status(400).json({ error: "name and type required" });
    const p: Person = { id: randomUUID(), name, phone: phone ?? "", type, createdAt: new Date().toISOString() };
    db.persons.push(p);
    res.status(201).json(p);
  });
  app.delete("/api/traders/:id", (req, res) => {
    const idx = db.persons.findIndex((p) => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });
    db.persons.splice(idx, 1);
    res.json({ success: true });
  });

  // Trades
  app.get("/api/trades", (_req, res) => res.json([...db.trades].reverse()));
  app.post("/api/trades", (req, res) => {
    const { traderId, tradeType, asset, weight, purity, pricePerGram, currency } = req.body;
    const trader = db.persons.find((p) => p.id === traderId);
    if (!trader) return res.status(400).json({ error: "Trader not found" });
    const w = Number(weight);
    const ppg = Number(pricePerGram);
    if (!w || !ppg) return res.status(400).json({ error: "Invalid weight or price" });

    const trade: Trade = {
      id: randomUUID(), traderId, traderName: trader.name,
      tradeType, asset, weight: w, purity, pricePerGram: ppg,
      totalValue: w * ppg, currency,
      createdAt: new Date().toISOString(),
    };

    db.trades.push(trade);
    upsertInventory(asset, purity, w, tradeType === "buy");
    postJournal(trade);

    res.status(201).json(trade);
  });

  // Inventory
  app.get("/api/inventory", (_req, res) => res.json(db.inventory));

  // Journal
  app.get("/api/journal", (_req, res) => res.json([...db.journal].reverse().slice(0, 50)));

  // Hawala
  app.get("/api/hawala", (_req, res) => res.json([...db.hawala].reverse()));
  app.post("/api/hawala", (req, res) => {
    const { senderName, receiverName, amount, currency, notes = "" } = req.body;
    if (!senderName || !receiverName || !amount) return res.status(400).json({ error: "Missing fields" });
    const tx: HawalaTransaction = {
      id: randomUUID(), senderName, receiverName,
      amount: Number(amount), currency, status: "pending", notes,
      createdAt: new Date().toISOString(),
    };
    db.hawala.push(tx);
    res.status(201).json(tx);
  });
  app.patch("/api/hawala/:id", (req, res) => {
    const tx = db.hawala.find((h) => h.id === req.params.id);
    if (!tx) return res.status(404).json({ error: "Not found" });
    tx.status = req.body.status;
    res.json(tx);
  });
  app.delete("/api/hawala/:id", (req, res) => {
    const idx = db.hawala.findIndex((h) => h.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });
    db.hawala.splice(idx, 1);
    res.json({ success: true });
  });

  // Custody
  app.get("/api/custody", (_req, res) => res.json(db.custody));
  app.post("/api/custody", (req, res) => {
    const { clientId, asset, weight, purity, notes = "" } = req.body;
    const client = db.persons.find((p) => p.id === clientId);
    if (!client) return res.status(400).json({ error: "Client not found" });
    const item: CustodyItem = {
      id: randomUUID(), clientId, clientName: client.name,
      asset, weight: Number(weight), purity, notes,
      createdAt: new Date().toISOString(),
    };
    db.custody.push(item);
    res.status(201).json(item);
  });
  app.delete("/api/custody/:id", (req, res) => {
    const idx = db.custody.findIndex((c) => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Not found" });
    db.custody.splice(idx, 1);
    res.json({ success: true });
  });

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  httpServer.listen(3000, "0.0.0.0", () => {
    console.log("IQEX PMR running on http://localhost:3000");
  });
}

startServer();
