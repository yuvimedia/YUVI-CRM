import React, { useMemo, useState, useEffect, createContext, useContext } from 'react';
import { createRoot } from 'react-dom/client';
import {
  LayoutDashboard, Users, Building2, Phone, MessageCircle, CalendarDays,
  Flame, CheckCircle2, BarChart3, Settings, LogOut, Search, Plus, Trash2,
  Filter, UserCheck, MapPin, IndianRupee, Bell, Menu, X, ShieldCheck, Download,
  Globe, Mail, ShieldAlert, Key, UserPlus, Building, Activity
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './styles.css';

// --- ROLES & PERMISSIONS ---
const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  COMPANY_ADMIN: 'COMPANY_ADMIN',
  SALES_MANAGER: 'SALES_MANAGER',
  SALES_EXECUTIVE: 'SALES_EXECUTIVE',
  TELECALLER: 'TELECALLER',
  MARKETING: 'MARKETING'
};

// --- AUTH CONTEXT ---
const AuthContext = createContext(null);

function AuthProvider({ children }) {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [token, setToken] = useState(localStorage.getItem('token'));

  const login = (userData, userToken) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userToken);
    setUser(userData);
    setToken(userToken);
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// --- MAIN APP ---
function App() {
  const { user, token, logout } = useContext(AuthContext);
  const [page, setPage] = useState('Dashboard');
  const [sidebar, setSidebar] = useState(false);
  const [leads, setLeads] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);

  // Auto-redirect to Dashboard for Super Admin
  useEffect(() => {
    if (user?.role === ROLES.SUPER_ADMIN && page === 'Leads') setPage('Companies');
  }, [user]);

  const apiFetch = async (url, options = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    if (res.status === 401) logout();
    return res.json();
  };

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    if (user.role === ROLES.SUPER_ADMIN) {
      apiFetch('/api/super/companies').then(setCompanies);
    } else {
      apiFetch('/api/leads').then(setLeads);
    }
    setLoading(false);
  }, [token, page]);

  if (!user) {
    // Check for invite token in URL
    const inviteToken = window.location.pathname.split('/register/')[1];
    return inviteToken ? <RegisterInvite token={inviteToken} /> : <Login />;
  }

  return (
    <div className="app">
      <aside className={sidebar ? 'sidebar show' : 'sidebar'}>
        <div className="brand">
          <div className="logo">Y</div>
          <div><h2>Yuvi SaaS</h2><p>{user.role.replace('_', ' ')}</p></div>
        </div>
        <nav>
          {getMenu(user.role).map(item => (
            <button key={item} className={page === item ? 'active' : ''} onClick={() => { setPage(item); setSidebar(false); }}>
              {iconFor(item)}<span>{item}</span>
            </button>
          ))}
        </nav>
        <div className="user-info">
          <p>Logged in as: <b>{user.name}</b></p>
          <button className="logout" onClick={logout}><LogOut size={18} /> Logout</button>
        </div>
      </aside>

      <main>
        <header>
          <button className="hamb" onClick={() => setSidebar(!sidebar)}>{sidebar ? <X /> : <Menu />}</button>
          <div>
            <h1>{page}</h1>
            <p>Welcome to {user.company_id === 'system' ? 'Platform Control' : 'Your Workspace'}</p>
          </div>
          {user.role !== ROLES.SUPER_ADMIN && (
            <div className="head-actions">
              <Bell /><span className="badge">3</span>
              <button onClick={() => alert('Add Lead Feature')}><Plus size={18} /> Add Lead</button>
            </div>
          )}
        </header>

        {page === 'Dashboard' && <Dashboard user={user} leads={leads} />}
        {page === 'Leads' && <Leads leads={leads} role={user.role} />}
        {page === 'Companies' && <CompanyManagement companies={companies} onUpdate={() => apiFetch('/api/super/companies').then(setCompanies)} />}
        {page === 'Team' && <TeamManagement user={user} />}
        {page === 'Reports' && <ReportsView leads={leads} />}
        {page === 'Activity' && <ActivityLogs />}
      </main>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function Login() {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.token) login(data.user, data.token);
    else setErr(data.error);
  };

  return (
    <div className="login">
      <div className="login-card">
        <div className="brand big"><div className="logo">Y</div><div><h2>Yuvi CRM</h2><p>SaaS Edition</p></div></div>
        <h1>Workspace Login</h1>
        {err && <p style={{ color: 'red', fontSize: '13px' }}>{err}</p>}
        <form onSubmit={handleSubmit}>
          <label>Work Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com" required />
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          <button type="submit">Access Workspace</button>
        </form>
        <p style={{ marginTop: '20px', fontSize: '12px', color: 'var(--muted)' }}>
          Tip: admin@yuvicrm.com / admin123
        </p>
      </div>
      <div className="hero-panel">
        <ShieldCheck size={54} />
        <h2>Enterprise Multi-tenant CRM</h2>
        <p>Secure workspace isolation, role-based access, and real-time lead sync for your entire sales organization.</p>
      </div>
    </div>
  );
}

function RegisterInvite({ token }) {
  const [invite, setInvite] = useState(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/auth/invite/${token}`).then(r => r.json()).then(setInvite);
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/auth/register-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, name, password })
    });
    if (res.ok) setSuccess(true);
  };

  if (success) return <div className="login"><div className="login-card"><h1>Success!</h1><p>Account created. You can now login.</p><button onClick={() => window.location.href = '/'}>Go to Login</button></div></div>;
  if (!invite) return <div className="login"><div className="login-card"><h1>Loading...</h1></div></div>;

  return (
    <div className="login">
      <div className="login-card">
        <h1>Join Workspace</h1>
        <p>Invited as <b>{invite.role}</b> for <b>{invite.email}</b></p>
        <form onSubmit={handleSubmit}>
          <label>Your Full Name</label>
          <input value={name} onChange={e => setName(e.target.value)} required />
          <label>Create Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit">Join Team</button>
        </form>
      </div>
    </div>
  );
}

function CompanyManagement({ companies, onUpdate }) {
  const [name, setName] = useState('');
  const [aName, setAName] = useState('');
  const [aEmail, setAEmail] = useState('');
  const [aPass, setAPass] = useState('');

  const create = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    await fetch('/api/super/companies', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, adminName: aName, adminEmail: aEmail, adminPassword: aPass })
    });
    onUpdate();
    setName(''); setAName(''); setAEmail(''); setAPass('');
  };

  return (
    <div className="grid2">
      <div className="panel">
        <h3>Active Tenants</h3>
        <div className="table">
          <table>
            <thead><tr><th>Company</th><th>Status</th><th>Created</th></tr></thead>
            <tbody>
              {companies.map(c => <tr key={c.id}><td><b>{c.name}</b></td><td><span className="badge badge-green">{c.status}</span></td><td>{new Date(c.createdAt).toLocaleDateString()}</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
      <div className="panel">
        <h3>Provision New Company</h3>
        <form onSubmit={create}>
          <input placeholder="Business Name" value={name} onChange={e => setName(e.target.value)} required />
          <input placeholder="Admin Name" value={aName} onChange={e => setAName(e.target.value)} required />
          <input placeholder="Admin Email" type="email" value={aEmail} onChange={e => setAEmail(e.target.value)} required />
          <input placeholder="Initial Password" type="password" value={aPass} onChange={e => setAPass(e.target.value)} required />
          <button type="submit">Create Workspace</button>
        </form>
      </div>
    </div>
  );
}

function TeamManagement({ user }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState(ROLES.SALES_EXECUTIVE);
  const [link, setLink] = useState('');

  const invite = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const res = await fetch('/api/company/invites', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role })
    });
    const data = await res.json();
    setLink(window.location.origin + data.inviteLink);
  };

  return (
    <div className="panel">
      <h3>Invite Team Member</h3>
      <p>Send a secure invite link to add an employee to this workspace.</p>
      <form onSubmit={invite} style={{ maxWidth: '400px', marginTop: '20px' }}>
        <label>Email Address</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        <label>Assign Role</label>
        <select value={role} onChange={e => setRole(e.target.value)}>
          <option value={ROLES.SALES_MANAGER}>Sales Manager</option>
          <option value={ROLES.SALES_EXECUTIVE}>Sales Executive</option>
          <option value={ROLES.TELECALLER}>Telecaller</option>
          <option value={ROLES.MARKETING}>Marketing</option>
        </select>
        <button type="submit">Generate Invite Link</button>
      </form>
      {link && (
        <div style={{ marginTop: '20px', padding: '15px', background: 'var(--blue-light)', borderRadius: '12px', border: '1px solid var(--blue)' }}>
          <p style={{ fontSize: '13px', fontWeight: 'bold' }}>Copy Link:</p>
          <code style={{ fontSize: '12px', wordBreak: 'break-all' }}>{link}</code>
        </div>
      )}
    </div>
  );
}

// --- UTILS ---

function getMenu(role) {
  if (role === ROLES.SUPER_ADMIN) return ['Dashboard', 'Companies', 'Reports', 'Activity'];
  if (role === ROLES.COMPANY_ADMIN) return ['Dashboard', 'Leads', 'Team', 'Reports', 'Activity', 'Settings'];
  return ['Dashboard', 'Leads', 'Reports'];
}

function iconFor(item) {
  return ({
    Dashboard: <LayoutDashboard />, Leads: <Users />, Companies: <Building />,
    Team: <UserPlus />, Reports: <BarChart3 />, Activity: <Activity />, Settings: <Settings />
  })[item];
}

function Dashboard({ user, leads }) {
  return (
    <section className="cards">
      <Card t="Workspace Users" v="8" i={<Users />} />
      <Card t="Company Leads" v={leads.length} i={<Phone />} />
      <Card t="Active Tasks" v="12" i={<CalendarDays />} />
      <Card t="Plan Status" v="Premium" i={<ShieldCheck />} />
    </section>
  );
}

function Card({ t, v, i }) { return <div className="card"><div>{i}</div><p>{t}</p><h2>{v}</h2></div>; }

function Leads({ leads, role }) {
  return (
    <div className="panel">
      <div className="table">
        <table>
          <thead><tr><th>Lead</th><th>Source</th><th>Status</th><th>Assignment</th></tr></thead>
          <tbody>
            {leads.map(l => (
              <tr key={l.id}>
                <td><b>{l.name}</b><br/><small>{l.phone}</small></td>
                <td>{l.source}</td>
                <td><span className="badge badge-fb">{l.status}</span></td>
                <td>{l.assigned_to || 'Unassigned'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReportsView() { return <div className="panel"><h3>Analytics</h3><p>Data visualization is isolated per tenant.</p></div>; }
function ActivityLogs() { return <div className="panel"><h3>Audit Trail</h3><p>System logs for security and compliance.</p></div>; }

// --- RENDER ---
createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
