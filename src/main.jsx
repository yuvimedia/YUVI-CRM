import React, { useMemo, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
  LayoutDashboard, Users, Building2, Phone, MessageCircle, CalendarDays,
  Flame, CheckCircle2, BarChart3, Settings, LogOut, Search, Plus, Trash2,
  Filter, UserCheck, MapPin, IndianRupee, Bell, Menu, X, ShieldCheck, Download
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './styles.css';

const pipeline = ['New Lead','Attempted','Not Reachable','Interested','Call Back Later','Site Visit Scheduled','Site Visit Done','Hot Lead','Negotiation','Booked','Lost','Wrong Number'];
const sources = ['Meta Lead Ads','Google Ads','Website Form','Landing Page','WhatsApp','Manual Entry','Referral','Walk-in'];

const initialProjects = ['Isha Paras Paradise','VIP Uptown Phase 2','Mango Premium Villa Plots','Rockfort Garden City'];
const initialStaff = [
  { name: 'Arun Kumar', active: true },
  { name: 'Priya S', active: true },
  { name: 'Mohan Raj', active: true },
  { name: 'Divya K', active: false },
  { name: 'Sathish M', active: false }
];

const seedLeads = [
  { id: 1001, name: 'Ramesh Kumar', phone: '98765 43210', project: initialProjects[0], source: sources[0], status: 'Hot Lead', owner: initialStaff[0], budget: '₹25L - ₹40L', sqft: '1200', next: 'Today 5:30 PM', temp: 'Hot', notes: 'Interested in corner plot near entrance.' },
  { id: 1002, name: 'Kavitha R', phone: '98431 22110', project: initialProjects[1], source: sources[1], status: 'Site Visit Scheduled', owner: initialStaff[1], budget: '₹10L - ₹20L', sqft: '600', next: 'Tomorrow 10:00 AM', temp: 'Warm', notes: 'Family visit planned.' },
  { id: 1003, name: 'Suresh Babu', phone: '97903 45567', project: initialProjects[2], source: sources[4], status: 'Call Back Later', owner: initialStaff[2], budget: '₹15L - ₹30L', sqft: '1500', next: 'Today 7:00 PM', temp: 'Warm', notes: 'Asked for location video.' },
  { id: 1004, name: 'Naveen Prakash', phone: '84286 02355', project: initialProjects[3], source: sources[2], status: 'Negotiation', owner: initialStaff[3], budget: '₹30L+', sqft: '2400', next: 'Today 3:00 PM', temp: 'Hot', notes: 'Negotiating 1200 sq.ft plot.' },
  { id: 1005, name: 'Meena Devi', phone: '90031 11122', project: initialProjects[0], source: sources[5], status: 'New Lead', owner: initialStaff[4], budget: '₹8L - ₹15L', sqft: '450', next: 'Not set', temp: 'Cold', notes: 'Needs first call.' },
  { id: 1006, name: 'Dinesh V', phone: '90807 32123', project: initialProjects[1], source: sources[0], status: 'Booked', owner: initialStaff[0], budget: '₹20L - ₹30L', sqft: '1000', next: 'Agreement follow-up', temp: 'Hot', notes: 'Booked 1000 sq.ft.' },
];

function App(){
  const [loggedIn,setLoggedIn]=useState(false);
  const [role,setRole]=useState('Super Admin');
  const [page,setPage]=useState('Dashboard');
  const [leads,setLeads]=useState(seedLeads);
  const [projects, setProjects] = useState(initialProjects);
  const [staff, setStaff] = useState(initialStaff);
  const [query,setQuery]=useState('');
  const [open,setOpen]=useState(false);
  const [staffOpen, setStaffOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [sidebar,setSidebar]=useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [form,setForm]=useState({name:'',phone:'',project:initialProjects[0],source:sources[0],status:'New Lead',owner:initialStaff[0].name,budget:'',sqft:'',next:'',temp:'Warm',notes:''});
  const [newStaffName, setNewStaffName] = useState('');
  const [newProjectName, setNewProjectName] = useState('');

  useEffect(() => {
    // Fetch Leads
    fetch('/api/leads')
      .then(res => res.json())
      .then(data => {
        if(data && data.length > 0) setLeads(data);
      })
      .catch(err => console.log('Backend not connected, using seed data.'));

    // Fetch Staff
    fetch('/api/staff')
      .then(res => res.json())
      .then(data => {
        if(data && data.length > 0) setStaff(data);
      })
      .catch(err => console.log('Backend not connected, using initial staff.'));
  }, []);

  const filtered=leads.filter(l => [l.name,l.phone,l.project,l.source,l.status,l.owner].join(' ').toLowerCase().includes(query.toLowerCase()));
  const stats=useMemo(()=>({
    total: leads.length,
    hot: leads.filter(l=>l.temp==='Hot').length,
    visits: leads.filter(l=>l.status.includes('Site Visit')).length,
    booked: leads.filter(l=>l.status==='Booked').length,
    follow: leads.filter(l=>l.next.includes('Today')).length,
    rate: Math.round((leads.filter(l=>l.status==='Booked').length/Math.max(leads.length,1))*100)
  }),[leads]);

  const chartData=pipeline.map(s=>({name:s.replace('Site Visit ','SV '), leads: leads.filter(l=>l.status===s).length})).filter(x=>x.leads>0);
  const sourceData=sources.map(s=>({name:s, value:leads.filter(l=>l.source===s).length})).filter(x=>x.value>0);

  function addLead(e){
    e.preventDefault();
    if(!form.name || !form.phone) return;
    setLeads([{...form,id:Date.now(), next: form.next || 'Not set'},...leads]);
    setForm({name:'',phone:'',project:projects[0] || '',source:sources[0],status:'New Lead',owner:staff[0]?.name || 'Unassigned',budget:'',sqft:'',next:'',temp:'Warm',notes:''});
    setOpen(false); setPage('Leads');
  }

  async function handleAddStaff(e) {
    e.preventDefault();
    if(!newStaffName) return;
    try {
      await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newStaffName })
      });
    } catch (e) {}
    setStaff([...staff, { name: newStaffName, active: true }]);
    setNewStaffName('');
    setStaffOpen(false);
  }

  async function handleRemoveStaff(name) {
    if(window.confirm(`Are you sure you want to remove ${name}?`)) {
      try {
        await fetch(`/api/staff/${name}`, { method: 'DELETE' });
      } catch (e) {}
      setStaff(staff.filter(s => s.name !== name));
    }
  }

  async function toggleStaffActive(name) {
    const s = staff.find(x => x.name === name);
    if (!s) return;
    const newState = !s.active;
    try {
      await fetch(`/api/staff/${name}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: newState })
      });
    } catch (e) {}
    setStaff(staff.map(s => s.name === name ? { ...s, active: newState } : s));
  }

  function handleAddProject(e) {
    e.preventDefault();
    if(!newProjectName) return;
    setProjects([...projects, newProjectName]);
    setNewProjectName('');
    setProjectOpen(false);
  }

  function handleRemoveProject(name) {
    if(window.confirm(`Are you sure you want to remove project: ${name}?`)) {
      setProjects(projects.filter(p => p !== name));
    }
  }

  function updateLeadNotes(id, notes) {
    setLeads(leads.map(l => l.id === id ? { ...l, notes } : l));
    if (selectedLead && selectedLead.id === id) {
      setSelectedLead({ ...selectedLead, notes });
    }
    // Optionally sync to backend here if needed
  }

  if(!loggedIn) return <Login setLoggedIn={setLoggedIn} role={role} setRole={setRole}/>;

  return <div className="app">
    <aside className={sidebar?'sidebar show':'sidebar'}>
      <div className="brand"><div className="logo">Y</div><div><h2>Yuvi CRM</h2><p>Smart CRM for Smart Sales Teams</p></div></div>
      <nav>{['Dashboard','Leads','Follow-ups','Site Visits','Projects','Employees','Reports','Settings']
        .filter(item => {
          if (item === 'Employees' && (role === 'Telecaller' || role === 'Sales Executive')) return false;
          return true;
        })
        .map(item=><button className={page===item?'active':''} onClick={()=>{setPage(item);setSidebar(false)}} key={item}>{iconFor(item)}<span>{item}</span></button>)}</nav>
      <button className="logout" onClick={()=>setLoggedIn(false)}><LogOut size={18}/> Logout</button>
    </aside>
    <main>
      <header>
        <button className="hamb" onClick={()=>setSidebar(!sidebar)}>{sidebar?<X/>:<Menu/>}</button>
        <div><h1>{page==='Dashboard'?'Yuvi CRM Dashboard':page}</h1><p>Good morning, {role}. Keep your sales pipeline moving.</p></div>
        <div className="head-actions">
          <Bell/><span className="badge">{stats.follow}</span>
          <button onClick={()=>setOpen(true)}><Plus size={18}/> Add Lead</button>
        </div>
      </header>
      {page==='Dashboard' && <Dashboard stats={stats} chartData={chartData} sourceData={sourceData} leads={leads}/>} 
      {page==='Leads' && <Leads leads={filtered} query={query} setQuery={setQuery} setLeads={setLeads} allLeads={leads} pipeline={pipeline} staff={staff} role={role} onViewDetails={(l)=>{setSelectedLead(l); setDetailOpen(true);}} projects={projects} sources={sources}/>}
      {page==='Follow-ups' && <Followups leads={leads}/>} 
      {page==='Site Visits' && <Simple title="Site Visit Planner" rows={leads.filter(l=>l.status.includes('Site Visit'))}/>} 
      {page==='Projects' && <Projects projects={projects} onAdd={()=>setProjectOpen(true)} onRemove={handleRemoveProject} role={role}/>}
      {page==='Employees' && <Employees staff={staff} onAdd={()=>setStaffOpen(true)} onRemove={handleRemoveStaff} onToggle={toggleStaffActive} role={role}/>}
      {page==='Reports' && <Reports stats={stats} chartData={chartData}/>} 
      {page==='Settings' && <SettingsPage role={role}/>} 
    </main>

    {open && <Modal setOpen={setOpen} form={form} setForm={setForm} addLead={addLead} projects={projects} staff={staff} pipeline={pipeline} sources={sources}/>}

    {staffOpen && <div className="modal"><form onSubmit={handleAddStaff}><button type="button" className="close" onClick={()=>setStaffOpen(false)}><X/></button><h2>Add New Employee</h2><input placeholder="Full Name" value={newStaffName} onChange={e=>setNewStaffName(e.target.value)} required/><button type="submit">Add Employee</button></form></div>}

    {projectOpen && <div className="modal"><form onSubmit={handleAddProject}><button type="button" className="close" onClick={()=>setProjectOpen(false)}><X/></button><h2>Add New Project</h2><input placeholder="Project Name" value={newProjectName} onChange={e=>setNewProjectName(e.target.value)} required/><button type="submit">Add Project</button></form></div>}

    {detailOpen && selectedLead && (
      <div className="modal">
        <div style={{background:'white', padding:'30px', borderRadius:'24px', width:'min(600px, 95%)', position:'relative'}}>
          <button className="close" onClick={()=>setDetailOpen(false)}><X/></button>
          <div style={{display:'flex', gap:'20px', alignItems:'center', marginBottom:'20px'}}>
            <div className="logo" style={{width:'60px', height:'60px', fontSize:'24px'}}>{selectedLead.name[0]}</div>
            <div>
              <h2 style={{margin:0}}>{selectedLead.name}</h2>
              <p style={{color:'var(--muted)', margin:0}}>{selectedLead.phone} • {selectedLead.email || 'No email'}</p>
            </div>
          </div>

          <div className="grid2" style={{marginBottom:'20px'}}>
            <div className="card" style={{padding:'15px'}}>
              <p style={{margin:0, fontSize:'12px', color:'var(--muted)'}}>Status</p>
              <h3 style={{margin:0}}>{selectedLead.status}</h3>
            </div>
            <div className="card" style={{padding:'15px'}}>
              <p style={{margin:0, fontSize:'12px', color:'var(--muted)'}}>Project</p>
              <h3 style={{margin:0}}>{selectedLead.project}</h3>
            </div>
          </div>

          <div className="panel" style={{marginBottom:'20px'}}>
            <h4>Lead Details</h4>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', fontSize:'14px'}}>
              <div><b>Source:</b> {selectedLead.source}</div>
              <div><b>Budget:</b> {selectedLead.budget}</div>
              <div><b>Sq Ft:</b> {selectedLead.sqft}</div>
              <div><b>Owner:</b> {selectedLead.owner}</div>
              <div><b>Follow-up:</b> {selectedLead.next}</div>
              <div><b>Temperature:</b> {selectedLead.temp}</div>
            </div>
          </div>

          <div className="panel">
            <h4>Notes & Remarks</h4>
            <textarea
              style={{width:'100%', height:'100px', padding:'10px', borderRadius:'12px', border:'1px solid var(--line)'}}
              value={selectedLead.notes}
              onChange={(e) => updateLeadNotes(selectedLead.id, e.target.value)}
              placeholder="Add internal remarks here..."
            />
          </div>

          <div style={{marginTop:'20px', display:'flex', gap:'10px'}}>
            <a href={`tel:${selectedLead.phone}`} className="head-actions button" style={{textDecoration:'none', justifyContent:'center', flex:1}}><Phone size={18}/> Call Now</a>
            <a href={`https://wa.me/91${selectedLead.phone}`} target="_blank" className="head-actions button" style={{textDecoration:'none', justifyContent:'center', flex:1, background:'var(--green)'}}><MessageCircle size={18}/> WhatsApp</a>
          </div>
        </div>
      </div>
    )}
  </div>
}

function Login({setLoggedIn,role,setRole}){return <div className="login">
  <div className="login-card">
    <div className="brand big"><div className="logo">Y</div><div><h2>Yuvi CRM</h2><p>Smart CRM for Smart Sales Teams</p></div></div>
    <h1>Welcome back</h1><p>Built for Indian real estate sales teams, builders and property developers.</p>
    <label>Role</label><select value={role} onChange={e=>setRole(e.target.value)}>{['Super Admin','Builder Admin','Sales Manager','Telecaller','Sales Executive'].map(r=><option key={r}>{r}</option>)}</select>
    <label>Email</label><input defaultValue="demo@yuvicrm.in" />
    <label>Password</label><input type="password" defaultValue="password" />
    <button onClick={()=>setLoggedIn(true)}>Login to Yuvi CRM</button>
    <small>Demo app • No backend required for preview</small>
  </div>
  <div className="hero-panel"><ShieldCheck size={54}/><h2>Real Estate CRM SaaS</h2><p>Track leads, calls, follow-ups, site visits, bookings, staff performance and source-wise ROI from one premium dashboard.</p><div className="mini-grid"><span>Multi-tenant</span><span>Role Access</span><span>Click to WhatsApp</span><span>Reports</span></div></div>
</div>}

function Dashboard({stats,chartData,sourceData,leads}){return <><section className="cards"><Card t="Total Leads" v={stats.total} i={<Users/>}/><Card t="Today Follow-ups" v={stats.follow} i={<CalendarDays/>}/><Card t="Hot Leads" v={stats.hot} i={<Flame/>}/><Card t="Bookings" v={stats.booked} i={<CheckCircle2/>}/><Card t="Conversion Rate" v={`${stats.rate}%`} i={<BarChart3/>}/></section><section className="grid2"><div className="panel"><h3>Pipeline Overview</h3><ResponsiveContainer width="100%" height={260}><BarChart data={chartData}><XAxis dataKey="name"/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="leads" radius={[8,8,0,0]}/></BarChart></ResponsiveContainer></div><div className="panel"><h3>Lead Sources</h3><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={sourceData} dataKey="value" nameKey="name" outerRadius={95} label>{sourceData.map((_,i)=><Cell key={i}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div></section><Recent leads={leads.slice(0,5)}/></>}

function Card({t,v,i}){return <div className="card"><div>{i}</div><p>{t}</p><h2>{v}</h2></div>}

  function Leads({leads,query,setQuery,setLeads,allLeads,pipeline,staff,role,onViewDetails, projects, sources}){
  const [filterProject, setFilterProject] = useState('All Projects');
  const [filterStatus, setFilterStatus] = useState('All Status');

  const finalLeads = leads.filter(l => {
    const matchProject = filterProject === 'All Projects' || l.project === filterProject;
    const matchStatus = filterStatus === 'All Status' || l.status === filterStatus;
    return matchProject && matchStatus;
  });

  async function assignLead(id, owner) {
    try {
      const resp = await fetch(`/api/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner })
      });
      if (resp.ok) {
        setLeads(allLeads.map(l => l.id === id ? { ...l, owner } : l));
      }
    } catch (e) {
      setLeads(allLeads.map(l => l.id === id ? { ...l, owner } : l));
    }
  }

  function getCalendarLink(lead) {
    const title = encodeURIComponent(`Follow-up: ${lead.name} (${lead.project})`);
    const details = encodeURIComponent(`CRM Follow-up for ${lead.name}. Phone: ${lead.phone}. Notes: ${lead.notes}`);
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&sf=true&output=xml`;
  }

  function downloadCSV() {
    const headers = ['Name', 'Phone', 'Project', 'SqFt', 'Source', 'Status', 'Owner', 'Next Follow-up', 'Notes'];
    const rows = finalLeads.map(l => [
      l.name,
      l.phone,
      l.project,
      l.sqft || '',
      l.source,
      l.status,
      l.owner,
      l.next,
      l.notes
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Yuvi_CRM_Leads_${new Date().toLocaleDateString()}.csv`);
    link.click();
  }

  return <div className="panel">
    <div className="toolbar" style={{flexWrap:'wrap', gap:'12px'}}>
      <div className="search" style={{minWidth:'300px'}}><Search size={18}/><input placeholder="Search leads, project, source..." value={query} onChange={e=>setQuery(e.target.value)}/></div>

      <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
        <select value={filterProject} onChange={e=>setFilterProject(e.target.value)} style={{padding:'8px', borderRadius:'10px', border:'1px solid var(--line)', background:'white'}}>
          <option>All Projects</option>
          {projects.map(p => <option key={p}>{p}</option>)}
        </select>

        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{padding:'8px', borderRadius:'10px', border:'1px solid var(--line)', background:'white'}}>
          <option>All Status</option>
          {pipeline.map(s => <option key={s}>{s}</option>)}
        </select>

        <button className="ghost" onClick={downloadCSV}><Download size={18}/> Export CSV</button>
      </div>
    </div>

    <div className="table"><table><thead><tr><th>Lead</th><th>Project</th><th>Sq Ft</th><th>Source</th><th>Status</th><th>Owner</th><th>Next Follow-up</th><th>Action</th></tr></thead><tbody>{finalLeads.map(l=><tr key={l.id}><td><b>{l.name}</b><small>{l.phone}</small></td><td>{l.project}</td><td>{l.sqft || '—'}</td><td>{l.source}</td><td><select value={l.status} onChange={e=>setLeads(allLeads.map(x=>x.id===l.id?{...x,status:e.target.value}:x))}>{pipeline.map(p=><option key={p}>{p}</option>)}</select></td><td>{role === 'Super Admin' ? <select value={l.owner} onChange={e=>assignLead(l.id, e.target.value)}><option value="Unassigned">Unassigned</option>{staff.map(s=><option key={s.name} value={s.name}>{s.name}</option>)}</select> : l.owner}</td><td>{l.next}</td><td><div style={{display:'flex', gap:'4px'}}><button onClick={()=>onViewDetails(l)} className="ghost" style={{padding:'6px', borderRadius:'8px'}} title="View Details"><BarChart3 size={17}/></button><a href={`tel:${l.phone.replaceAll(' ','')}`} title="Call"><Phone size={17}/></a><a href={`https://wa.me/91${l.phone.replaceAll(' ','')}`} target="_blank" title="WhatsApp"><MessageCircle size={17}/></a><a href={getCalendarLink(l)} target="_blank" title="Add to Google Calendar" style={{background:'#fdf2f2', color:'#d32f2f'}}><CalendarDays size={17}/></a></div></td></tr>)}</tbody></table></div>
  </div>}

function Followups({leads}){
  function getCalendarLink(lead) {
    const title = encodeURIComponent(`Follow-up: ${lead.name} (${lead.project})`);
    const details = encodeURIComponent(`CRM Follow-up for ${lead.name}. Phone: ${lead.phone}. Notes: ${lead.notes}`);
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&sf=true&output=xml`;
  }

  return <div className="kanban">{['Today','Tomorrow','Missed','Not set'].map(k=><div className="lane" key={k}><h3>{k}</h3>{leads.filter(l=>l.next.includes(k)|| (k==='Not set'&&l.next==='Not set')).map(l=><div className="lead-card" key={l.id} style={{position:'relative'}}><b>{l.name}</b><p>{l.project}</p><span>{l.next}</span><a href={getCalendarLink(l)} target="_blank" title="Sync to Calendar" style={{position:'absolute', right:'12px', bottom:'12px', color:'#d32f2f'}}><CalendarDays size={16}/></a></div>)}</div>)}</div>
}

function Simple({title,rows}){
  function getCalendarLink(lead) {
    const title = encodeURIComponent(`Site Visit: ${lead.name} - ${lead.project}`);
    const details = encodeURIComponent(`Scheduled site visit for ${lead.name}. Project: ${lead.project}. Phone: ${lead.phone}`);
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&sf=true&output=xml`;
  }

  return <div className="panel"><h3>{title}</h3>{rows.length?rows.map(l=><div className="activity" key={l.id}><MapPin/><div style={{flex:1}}><b>{l.name}</b><p>{l.project} • {l.next}</p></div><a href={getCalendarLink(l)} target="_blank" className="ghost" style={{padding:'6px 12px', fontSize:'12px', display:'flex', alignItems:'center', gap:'6px'}}><CalendarDays size={14}/> Sync to Calendar</a></div>):<p className="empty">No site visits scheduled yet.</p>}</div>
}

function Projects({projects, onAdd, onRemove, role}){
  return <div className="panel">
    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
      <h3>Active Projects</h3>
      {role === 'Super Admin' && <button onClick={onAdd} className="head-actions button" style={{width:'auto', padding:'8px 16px'}}><Plus size={18}/> New Project</button>}
    </div>
    <div className="grid2">
      {projects.map((p,i)=><div className="panel project" key={p} style={{position:'relative'}}>
        <Building2/>
        <h3>{p}</h3>
        <p>DTCP/RERA approved project pipeline</p>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'12px'}}>
          <span>{[24,18,31,12][i % 4] || 0} active leads</span>
          {role === 'Super Admin' && <button onClick={()=>onRemove(p)} style={{background:'none', border:'none', color:'var(--red)', cursor:'pointer'}}><Trash2 size={18}/></button>}
        </div>
      </div>)}
    </div>
  </div>
}

function Employees({staff, onAdd, onRemove, onToggle, role}){
  return <div className="panel">
    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
      <h3>Team Performance</h3>
      {role === 'Super Admin' && <button onClick={onAdd} className="head-actions button" style={{width:'auto', padding:'8px 16px'}}><Plus size={18}/> Add Employee</button>}
    </div>
    <div style={{marginBottom:'15px', fontSize:'13px', color:'var(--muted)', display:'flex', alignItems:'center', gap:'8px'}}>
      <div style={{width:'12px', height:'12px', borderRadius:'50%', background:'var(--teal)'}}></div>
      <span>Employees toggled <b>ON</b> will receive auto-assigned leads (Round Robin)</span>
    </div>
    {staff.map((s,i)=><div className="activity" key={s.name}>
      <UserCheck/>
      <div style={{flex:1}}>
        <b>{s.name}</b>
        <p>{[12,9,7,11,5][i % 5] || 0} leads handled • {[3,2,1,4,1][i % 5] || 0} hot leads</p>
      </div>
      <div style={{display:'flex', alignItems:'center', gap:'16px'}}>
        {role === 'Super Admin' && (
          <div className="toggle-container" onClick={() => onToggle(s.name)} style={{
            width: '44px', height: '22px', background: s.active ? 'var(--teal)' : '#ccc',
            borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: '0.3s'
          }}>
            <div style={{
              width: '18px', height: '18px', background: 'white', borderRadius: '50%',
              position: 'absolute', top: '2px', left: s.active ? '24px' : '2px', transition: '0.3s'
            }}></div>
          </div>
        )}
        {role === 'Super Admin' && <button onClick={()=>onRemove(s.name)} style={{background:'none', border:'none', color:'var(--red)', cursor:'pointer'}}><Trash2 size={18}/></button>}
      </div>
    </div>)}
  </div>
}

function Reports({stats,chartData}){return <div className="panel"><h3>Powered by Yuvi CRM</h3><section className="cards mini"><Card t="Revenue Pipeline" v="₹1.2Cr" i={<IndianRupee/>}/><Card t="Bookings" v={stats.booked} i={<CheckCircle2/>}/><Card t="Site Visits" v={stats.visits} i={<MapPin/>}/></section><ResponsiveContainer width="100%" height={280}><BarChart data={chartData}><XAxis dataKey="name"/><YAxis/><Tooltip/><Bar dataKey="leads" radius={[8,8,0,0]}/></BarChart></ResponsiveContainer></div>}

function SettingsPage({role}){return <div className="panel"><h3>Yuvi CRM Settings</h3><p>Logged in as <b>{role}</b></p><div className="settings-grid"><span>Company Profile</span><span>Lead Status Flow</span><span>Role Permissions</span><span>Subscription Plans</span><span>Notifications</span><span>API Integrations</span></div></div>}

function Recent({leads}){return <div className="panel"><h3>Recent Activities</h3>{leads.map(l=><div className="activity" key={l.id}><Flame/><div><b>{l.name}</b><p>{l.status} • {l.owner} • {l.notes}</p></div></div>)}</div>}

function Modal({setOpen,form,setForm,addLead, projects, staff, pipeline, sources}){return <div className="modal"><form onSubmit={addLead}><button type="button" className="close" onClick={()=>setOpen(false)}><X/></button><h2>Add New Lead</h2><input placeholder="Customer Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/><input placeholder="Phone Number" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} required/><select value={form.project} onChange={e=>setForm({...form,project:e.target.value})}>{projects.map(x=><option key={x}>{x}</option>)}</select><select value={form.source} onChange={e=>setForm({...form,source:e.target.value})}>{sources.map(x=><option key={x}>{x}</option>)}</select><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>{pipeline.map(x=><option key={x}>{x}</option>)}</select><select value={form.owner} onChange={e=>setForm({...form,owner:e.target.value})}>{staff.map(x=><option key={x.name} value={x.name}>{x.name}</option>)}</select><input placeholder="Budget Range" value={form.budget} onChange={e=>setForm({...form,budget:e.target.value})}/><input placeholder="Sq Feet Required" value={form.sqft} onChange={e=>setForm({...form,sqft:e.target.value})}/><input placeholder="Next Follow-up" value={form.next} onChange={e=>setForm({...form,next:e.target.value})}/><textarea placeholder="Notes" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/><button type="submit">Add Lead</button></form></div>}

function iconFor(item){return ({Dashboard:<LayoutDashboard/>,Leads:<Users/>,'Follow-ups':<CalendarDays/>,'Site Visits':<MapPin/>,Projects:<Building2/>,Employees:<UserCheck/>,Reports:<BarChart3/>,Settings:<Settings/>})[item]}

createRoot(document.getElementById('root')).render(<App/>);
