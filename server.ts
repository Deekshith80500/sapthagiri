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
  attendance: [],
  settings: {
    leaderInviteCode: "LEAD123"
  }
};

// Helper to read/write DB
const readDb = () => {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2));
    return initialDb;
  }
  const data = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
  return { ...initialDb, ...data };
};

const writeDb = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(cookieParser());

  // --- API Routes ---

  app.get("/api/health", (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

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

  // Helper to normalize names for comparison (removes all whitespace and lowercase)
  const normalizeName = (name: string) => name ? name.replace(/\s+/g, "").toLowerCase() : "";

  // Register
  app.post("/api/auth/register", (req, res) => {
    const { name, role, degree, address, inviteCode, email, phone } = req.body;
    console.log(`Register attempt for: ${name}`);
    const db = readDb();
    const normalizedName = normalizeName(name);
    
    if (db.users.find((u: any) => normalizeName(u.name) === normalizedName)) {
      console.log("Registration failed: User exists");
      return res.status(400).json({ message: "An account with this name already exists. Please log in instead." });
    }

    // Verify invite code for team leaders
    if (role === 'leader') {
      const settings = db.settings || initialDb.settings;
      if (inviteCode !== settings.leaderInviteCode) {
        return res.status(400).json({ message: "Invalid leader invitation code. Please ask the owner for the correct code." });
      }
    }

    const newUser = {
      id: Date.now().toString(),
      name: name.trim(),
      phone: phone || "",
      email: email || "",
      role, // 'owner' | 'leader'
      degree: degree || "",
      address: address || "",
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    writeDb(db);

    const token = jwt.sign({ id: newUser.id, name: newUser.name, role: newUser.role }, JWT_SECRET);
    res.cookie("token", token, { 
      httpOnly: true, 
      secure: true, 
      sameSite: 'none',
      maxAge: 3600000 * 24 
    });
    console.log("Registration success:", newUser.id);
    res.json({ user: { id: newUser.id, name: newUser.name, role: newUser.role } });
  });

  // Login
  app.post("/api/auth/login", (req, res) => {
    const { name, accessCode, intendedRole } = req.body;
    console.log(`Login attempt for: ${name} as ${intendedRole}`);
    const db = readDb();
    
    if (db.users.length === 0) {
      return res.status(401).json({ message: "No accounts found in system. Please register first." });
    }

    const normalizedName = normalizeName(name);
    const userByName = db.users.find((u: any) => normalizeName(u.name) === normalizedName);

    if (!userByName) {
      console.log(`Login failed: User not found for name ${name}`);
      return res.status(401).json({ message: `No account found with name "${name}". Please register first.` });
    }

    // Verify role matches selection
    if (intendedRole && userByName.role !== intendedRole) {
      console.log(`Login failed: Role mismatch for ${name}. Expected ${intendedRole}, found ${userByName.role}`);
      return res.status(401).json({ message: `This account is registered as a ${userByName.role}. Please select the correct login option.` });
    }

    // Check access code for team leaders
    if (userByName.role === 'leader') {
      const settings = db.settings || { leaderInviteCode: "SITE777" };
      if (accessCode !== settings.leaderInviteCode) {
        console.log(`Login failed: Invalid access code for leader ${name}`);
        return res.status(401).json({ message: "Invalid leader access code. Please contact the owner." });
      }
    }

    const user = userByName;

    const token = jwt.sign({ id: user.id, name: user.name, role: user.role }, JWT_SECRET);
    res.cookie("token", token, { 
      httpOnly: true, 
      secure: true, 
      sameSite: 'none',
      maxAge: 3600000 * 24 
    });
    console.log("Login success:", user.id);
    res.json({ user: { id: user.id, name: user.name, role: user.role } });
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token", { 
      httpOnly: true, 
      secure: true, 
      sameSite: 'none' 
    });
    res.json({ message: "Logged out" });
  });

  // Get Current User
  app.get("/api/auth/me", (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.json({ user: null });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) return res.json({ user: null });
      const db = readDb();
      const user = db.users.find(u => u.id === (decoded as any).id);
      if (!user) return res.json({ user: null });
      res.json({ user: { id: user.id, name: user.name, role: user.role, email: user.email, phone: user.phone } });
    });
  });

  // Workers
  app.get("/api/workers", authenticateToken, (req, res) => {
    const db = readDb();
    const workers = db.workers;
    res.json(workers);
  });

  app.put("/api/workers/:id", authenticateToken, (req, res) => {
    const { id } = req.params;
    const { name, phone, role, address, photo } = req.body;
    const db = readDb();
    const workerIndex = db.workers.findIndex((w: any) => w.id === id);

    if (workerIndex === -1) {
      return res.status(404).json({ message: "Worker not found" });
    }

    // Verify ownership
    if (db.workers[workerIndex].createdBy !== (req as any).user.id && (req as any).user.role !== 'owner') {
      return res.status(403).json({ message: "Not authorized to edit this worker" });
    }

    db.workers[workerIndex] = {
      ...db.workers[workerIndex],
      name,
      phone,
      role,
      address,
      photo,
      updatedAt: new Date().toISOString()
    };

    writeDb(db);
    res.json(db.workers[workerIndex]);
  });

  app.delete("/api/workers/:id", authenticateToken, (req, res) => {
    const { id } = req.params;
    const db = readDb();
    
    const workerIndex = db.workers.findIndex((w: any) => w.id === id);
    if (workerIndex === -1) return res.status(404).json({ message: "Worker not found" });

    // Verify ownership
    if (db.workers[workerIndex].createdBy !== (req as any).user.id && (req as any).user.role !== 'owner') {
      return res.status(403).json({ message: "Not authorized to delete" });
    }

    db.workers = db.workers.filter((w: any) => w.id !== id);
    // Also cleanup attendance
    db.attendance = db.attendance.filter((a: any) => a.workerId !== id);
    
    writeDb(db);
    res.json({ message: "Worker deleted" });
  });

  app.post("/api/workers", authenticateToken, (req, res) => {
    console.log("Worker creation request:", { ...req.body, photo: req.body.photo ? 'present' : 'absent' });
    const { name, phone, role, address, photo } = req.body;
    const db = readDb();
    const newWorker = {
      id: Date.now().toString(),
      name,
      phone,
      photo,
      role,
      address,
      createdBy: (req as any).user.id,
      createdAt: new Date().toISOString()
    };
    db.workers.push(newWorker);
    writeDb(db);
    console.log("Worker created success:", newWorker.id);
    res.json(newWorker);
  });

  // Attendance
  app.get("/api/attendance", authenticateToken, (req, res) => {
    const db = readDb();
    res.json(db.attendance);
  });

  app.post("/api/attendance", authenticateToken, (req, res) => {
    const { date, records } = req.body; // records: [{ workerId, status, capturePhoto }]
    const db = readDb();
    
    // Remove existing records for this date to support updates
    db.attendance = db.attendance.filter(a => a.date !== date);

    const newRecords = records.map(r => ({
      id: `${date}-${r.workerId}`,
      workerId: r.workerId,
      date,
      status: r.status,
      capturePhoto: r.capturePhoto,
      markedBy: (req as any).user.id,
      updatedAt: new Date().toISOString()
    }));

    db.attendance.push(...newRecords);
    writeDb(db);
    res.json({ message: "Attendance saved", count: newRecords.length });
  });

  // Settings
  app.get("/api/settings", authenticateToken, (req, res) => {
    if ((req as any).user.role !== 'owner') {
      return res.status(403).json({ message: "Only owners can access settings" });
    }
    const db = readDb();
    res.json(db.settings || initialDb.settings);
  });

  app.post("/api/settings", authenticateToken, (req, res) => {
    if ((req as any).user.role !== 'owner') {
      return res.status(403).json({ message: "Only owners can update settings" });
    }
    const { leaderInviteCode } = req.body;
    const db = readDb();
    db.settings = {
      ...db.settings,
      leaderInviteCode: leaderInviteCode.trim()
    };
    writeDb(db);
    res.json(db.settings);
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
