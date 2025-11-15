const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const ExcelJS = require("exceljs");
const fs = require("fs");

const app = express();
const PORT = 3000;

// === STATIC FILES ===
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());

// === DATABASE PATH ===
const dataFolder = path.join(__dirname, "data");

// Ustvari mapo /data če ne obstaja
if (!fs.existsSync(dataFolder)) {
    fs.mkdirSync(dataFolder);
    console.log("Mapa /data ustvarjena.");
}

const dbPath = path.join(dataFolder, "database.sqlite");
const dbExists = fs.existsSync(dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Napaka pri odprtju baze:", err);
    }
});

// === CREATE TABLE IF NOT EXISTS ===
db.serialize(() => {
    db.run(
        `CREATE TABLE IF NOT EXISTS narocila (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ime TEXT,
            priimek TEXT,
            email TEXT,
            izdelki TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        () => {
            if (!dbExists) console.log("Baza ustvarjena.");
        }
    );
});

// === POST: SHRANI NAROČILO ===
app.post("/api/narocilo", (req, res) => {
    const { ime, priimek, email, izdelki } = req.body;

    if (!ime || !priimek || !email || !izdelki) {
        return res.status(400).json({ error: "Manjkajo podatki." });
    }

    const izdelkiJSON = JSON.stringify(izdelki);

    db.run(
        "INSERT INTO narocila (ime, priimek, email, izdelki) VALUES (?, ?, ?, ?)",
        [ime, priimek, email, izdelkiJSON],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });

            res.json({ success: true, id: this.lastID });
        }
    );
});

// === GET: EXPORT TO EXCEL ===
app.get("/api/izvozi-excel", (req, res) => {
    db.all("SELECT * FROM narocila", async (err, rows) => {
        if (err) return res.status(500).send(err.message);

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Naročila");

        sheet.columns = [
            { header: "ID", key: "id", width: 10 },
            { header: "Ime", key: "ime", width: 20 },
            { header: "Priimek", key: "priimek", width: 20 },
            { header: "Email", key: "email", width: 30 },
            { header: "Izdelki", key: "izdelki", width: 50 },
            { header: "Čas", key: "timestamp", width: 25 }
        ];

        rows.forEach((r) => {
            r.izdelki = JSON.stringify(r.izdelki);
            sheet.addRow(r);
        });

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader("Content-Disposition", "attachment; filename=narocila.xlsx");

        await workbook.xlsx.write(res);
        res.end();
    });
});

// === START SERVER ===
app.listen(PORT, () => {
    console.log("Server teče na http://localhost:" + PORT);
});