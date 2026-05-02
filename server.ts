import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.join(__dirname, "db.json");
const JWT_SECRET = process.env.JWT_SECRET || "attendance-secret-key-123";

// Initial DB structure
const initialDb = {
  users: [],
  workers: [],
  attendance: []
};

// Helper to read/write DB
const readDb = () => {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2));
    return initialDb;
  }
  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
};

const writeDb = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // --- API Routes ---

  // Auth Middleware
  const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json({ message: "Forbidden" });
      req.user = user;
      next();
    });
  };

  // Register
  app.post("/api/auth/register", (req, res) => {
    const { email, password, name, role, degree, address } = req.body;
    const db = readDb();

    if (db.users.find(u => u.email === email)) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newUser = {
      id: Date.now().toString(),
      email,
      password, // In a real app, hash this!
      name,
      role, // 'owner' | 'leader'
      degree,
      address,
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    writeDb(db);

    const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET);
    res.cookie("token", token, { httpOnly: true });
    res.json({ user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role } });
  });

  // Login
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const db = readDb();
    const user = db.users.find(u => u.email === email && u.password === password);

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
    res.cookie("token", token, { httpOnly: true });
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out" });
  });

  // Get Current User
  app.get("/api/auth/me", (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.json({ user: null });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) return res.json({ user: null });
      const db = readDb();
      const user = db.users.find(u => u.id === decoded.id);
      if (!user) return res.json({ user: null });
      res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    });
  });

  // Workers
  app.get("/api/workers", authenticateToken, (req, res) => {
    const db = readDb();
    // In this simple app, all workers are visible to the owner/leader of the same "org" 
    // (for MVP simplicity, we'll just show all workers added by anyone or filter by owner)
    const workers = db.workers;
    res.json(workers);
  });

  app.post("/api/workers", authenticateToken, (req, res) => {
    const { name, phone, role, address } = req.body;
    const db = readDb();
    const newWorker = {
      id: Date.now().toString(),
      name,
      phone,
      role,
      address,
      createdBy: req.user.id,
      createdAt: new Date().toISOString()
    };
    db.workers.push(newWorker);
    writeDb(db);
    res.json(newWorker);
  });

  // Attendance
  app.get("/api/attendance", authenticateToken, (req, res) => {
    const db = readDb();
    res.json(db.attendance);
  });

  app.post("/api/attendance", authenticateToken, (req, res) => {
    const { date, records } = req.body; // records: [{ workerId, status }]
    const db = readDb();
    
    // Remove existing records for this date to support updates
    db.attendance = db.attendance.filter(a => a.date !== date);

    const newRecords = records.map(r => ({
      id: `${date}-${r.workerId}`,
      workerId: r.workerId,
      date,
      status: r.status,
      markedBy: req.user.id,
      updatedAt: new Date().toISOString()
    }));

    db.attendance.push(...newRecords);
    writeDb(db);
    res.json({ message: "Attendance saved", count: newRecords.length });
  });

  // --- Vite / Static Assets ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
