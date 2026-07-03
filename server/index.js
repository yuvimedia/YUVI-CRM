import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'yuvi-saas-super-secret-key';

// "Database" Files
const DB_PATH = './db';
if (!fs.existsSync(DB_PATH)) fs.mkdirSync(DB_PATH);

const FILES = {
  COMPANIES: path.join(DB_PATH, 'companies.json'),
  USERS: path.join(DB_PATH, 'users.json'),
  LEADS: path.join(DB_PATH, 'leads.json'),
  INVITES: path.join(DB_PATH, 'invites.json'),
  TASKS: path.join(DB_PATH, 'tasks.json'),
  ACTIVITIES: path.join(DB_PATH, 'activities.json')
};

// Initialize DB Files
Object.values(FILES).forEach(file => {
  if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify([], null, 2));
});

// Seed Super Admin if not exists
const users = JSON.parse(fs.readFileSync(FILES.USERS));
if (!users.find(u => u.role === 'SUPER_ADMIN')) {
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  users.push({
    id: 'super-admin-001',
    name: 'Platform Admin',
    email: 'admin@yuvicrm.com',
    password: hashedPassword,
    role: 'SUPER_ADMIN',
    company_id: 'system'
  });
  fs.writeFileSync(FILES.USERS, JSON.stringify(users, null, 2));
}

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../dist')));

// Helper: Data Access
const read = (file) => JSON.parse(fs.readFileSync(file));
const write = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

// Middleware: Auth
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });
  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

// Middleware: Role Check
const authorize = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Permission denied' });
  }
  next();
};

// --- AUTH API ---

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = read(FILES.USERS).find(u => u.email === email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, role: user.role, company_id: user.company_id, name: user.name }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { id: user.id, name: user.name, role: user.role, company_id: user.company_id } });
});

// --- SUPER ADMIN API ---

app.get('/api/super/companies', authenticate, authorize(['SUPER_ADMIN']), (req, res) => {
  res.json(read(FILES.COMPANIES));
});

app.post('/api/super/companies', authenticate, authorize(['SUPER_ADMIN']), (req, res) => {
  const { name, adminName, adminEmail, adminPassword } = req.body;
  const companies = read(FILES.COMPANIES);
  const companyId = uuidv4();

  const newCompany = {
    id: companyId,
    name,
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const users = read(FILES.USERS);
  users.push({
    id: uuidv4(),
    name: adminName,
    email: adminEmail,
    password: bcrypt.hashSync(adminPassword, 10),
    role: 'COMPANY_ADMIN',
    company_id: companyId
  });

  companies.push(newCompany);
  write(FILES.COMPANIES, companies);
  write(FILES.USERS, users);

  res.json(newCompany);
});

// --- COMPANY ADMIN API (Invites) ---

app.post('/api/company/invites', authenticate, authorize(['COMPANY_ADMIN']), (req, res) => {
  const { email, role } = req.body;
  const invites = read(FILES.INVITES);
  const token = uuidv4();

  const newInvite = {
    token,
    email,
    role,
    company_id: req.user.company_id,
    used: false,
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() // 48h
  };

  invites.push(newInvite);
  write(FILES.INVITES, invites);

  // In real app, send email here
  res.json({ inviteLink: `/register/${token}`, invite: newInvite });
});

app.get('/api/auth/invite/:token', (req, res) => {
  const invite = read(FILES.INVITES).find(i => i.token === req.params.token && !i.used);
  if (!invite) return res.status(404).json({ error: 'Invite not found or expired' });
  res.json({ email: invite.email, role: invite.role });
});

app.post('/api/auth/register-invite', (req, res) => {
  const { token, name, password } = req.body;
  const invites = read(FILES.INVITES);
  const inviteIndex = invites.findIndex(i => i.token === token && !i.used);

  if (inviteIndex === -1) return res.status(400).json({ error: 'Invalid invite' });

  const invite = invites[inviteIndex];
  const users = read(FILES.USERS);

  users.push({
    id: uuidv4(),
    name,
    email: invite.email,
    password: bcrypt.hashSync(password, 10),
    role: invite.role,
    company_id: invite.company_id
  });

  invites[inviteIndex].used = true;
  write(FILES.USERS, users);
  write(FILES.INVITES, invites);

  res.json({ success: true });
});

// --- TENANT DATA API ---

app.get('/api/leads', authenticate, (req, res) => {
  let leads = read(FILES.LEADS);
  if (req.user.role !== 'SUPER_ADMIN') {
    leads = leads.filter(l => l.company_id === req.user.company_id);
    // Managers see all company leads, others see assigned
    if (['SALES_EXECUTIVE', 'TELECALLER'].includes(req.user.role)) {
      leads = leads.filter(l => l.assigned_to === req.user.id);
    }
  }
  res.json(leads);
});

app.post('/api/leads', authenticate, (req, res) => {
  const leads = read(FILES.LEADS);
  const newLead = {
    ...req.body,
    id: uuidv4(),
    company_id: req.user.company_id,
    created_by: req.user.id,
    createdAt: new Date().toISOString()
  };
  leads.push(newLead);
  write(FILES.LEADS, leads);
  res.json(newLead);
});

// Webhooks (Multi-tenant)
app.post('/webhooks/google/:company_id', (req, res) => {
  const { company_id } = req.params;
  const leadData = req.body;
  const leads = read(FILES.LEADS);

  const newLead = {
    id: uuidv4(),
    company_id,
    name: leadData.full_name || 'Google Lead',
    phone: leadData.phone_number || '',
    source: 'Google Ads',
    status: 'New Lead'
  };

  leads.push(newLead);
  write(FILES.LEADS, leads);
  res.sendStatus(200);
});

// Wildcard for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Yuvi SaaS Backend running on port ${PORT}`);
});
