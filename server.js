const express = require("express");
const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();
const ExcelJS = require("exceljs");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ---------- SQLITE setup ----------
const dbFile = path.join(__dirname, "database.sqlite");
const db = new sqlite3.Database(dbFile);

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ime TEXT,
      priimek TEXT,
      email TEXT,
      items TEXT, -- JSON string
      total REAL,
      created_at TEXT
    )`
  );
});

// ---------- helper: append to Excel ----------
const excelFile = path.join(__dirname, "orders.xlsx");

async function appendOrderToExcel(order) {
  const workbook = new ExcelJS.Workbook();
  let sheet;

  if (fs.existsSync(excelFile)) {
    await workbook.xlsx.readFile(excelFile);
    sheet = workbook.getWorksheet("Orders") || workbook.addWorksheet("Orders");
  } else {
    sheet = workbook.addWorksheet("Orders");
    // header
    sheet.addRow([
      "Order ID",
      "Ime",
      "Priimek",
      "Email",
      "Items (JSON)",
      "Total",
      "Created At"
    ]);
  }

  sheet.addRow([
    order.id,
    order.ime,
    order.priimek,
    order.email || "",
    JSON.stringify(order.items),
    order.total,
    order.created_at
  ]);

  await workbook.xlsx.writeFile(excelFile);
}

// ---------- API endpoint ----------
app.post("/api/order", (req, res) => {
  try {
    const { customer, items, total, created_at } = req.body;
    if (!customer || !items) {
      return res.status(400).json({ error: "Manjkajo podatki naročila." });
    }

    const ime = customer.ime || "";
    const priimek = customer.priimek || "";
    const email = customer.email || "";
    const itemsJson = JSON.stringify(items);

    const stmt = db.prepare(
      `INSERT INTO orders (ime, priimek, email, items, total, created_at) VALUES (?, ?, ?, ?, ?, ?)`
    );

    stmt.run(ime, priimek, email, itemsJson, total || 0, created_at || new Date().toISOString(), function (err) {
      if (err) {
        console.error("DB insert error:", err);
        return res.status(500).json({ error: "Napaka pri shranjevanju v bazo." });
      }

      const insertedId = this.lastID;

      const orderRecord = {
        id: insertedId,
        ime,
        priimek,
        email,
        items,
        total,
        created_at: created_at || new Date().toISOString()
      };

      appendOrderToExcel(orderRecord)
        .then(() => {
          return res.json({ success: true, orderId: insertedId });
        })
        .catch((ex) => {
          console.error("Excel error:", ex);
          // še vedno vrnemo success, vendar opozorimo
          return res.json({ success: true, orderId: insertedId, warning: "Napaka pri zapisovanju v Excel." });
        });
    });

    stmt.finalize();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Neznana napaka." });
  }
});

// fallback to index.html for SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});