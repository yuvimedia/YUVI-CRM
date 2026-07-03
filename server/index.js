import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const LEADS_FILE = './leads.json';
const STAFF_FILE = './staff.json';

app.use(cors());
app.use(bodyParser.json());

// Serve Static Frontend Files from "dist"
app.use(express.static(path.join(__dirname, '../dist')));

// Initialize files if they don't exist
if (!fs.existsSync(LEADS_FILE)) {
    fs.writeFileSync(LEADS_FILE, JSON.stringify([], null, 2));
}
if (!fs.existsSync(STAFF_FILE)) {
    fs.writeFileSync(STAFF_FILE, JSON.stringify([
        { name: 'Arun Kumar', active: true },
        { name: 'Priya S', active: true },
        { name: 'Mohan Raj', active: true }
    ], null, 2));
}

const getLeads = () => JSON.parse(fs.readFileSync(LEADS_FILE));
const saveLeads = (leads) => fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));

const getStaff = () => JSON.parse(fs.readFileSync(STAFF_FILE));
const saveStaff = (staff) => fs.writeFileSync(STAFF_FILE, JSON.stringify(staff, null, 2));

let lastAssignedIndex = -1;

const getNextOwner = (leadName) => {
    const staff = getStaff().filter(s => s.active);
    if (staff.length === 0) return 'Unassigned';

    lastAssignedIndex = (lastAssignedIndex + 1) % staff.length;
    const assignedStaff = staff[lastAssignedIndex];

    // Auto-Notification
    sendWhatsAppNotification(assignedStaff.name, assignedStaff.phone || '91XXXXXXXXXX', leadName);

    return assignedStaff.name;
};

const sendWhatsAppNotification = (staffName, staffPhone, leadName) => {
    const template = process.env.WA_ASSIGN_TEMPLATE || "Hi {staff}, you have a new lead: {lead}. Please follow up immediately!";
    const message = template.replace('{staff}', staffName).replace('{lead}', leadName);

    console.log(`\n🔔 [WHATSAPP AUTO-NOTIFICATION]`);
    console.log(`To: ${staffName} (${staffPhone})`);
    console.log(`Message: "${message}"\n`);

    // To enable REAL WhatsApp sending:
    // axios.post('YOUR_WA_API_URL', { phone: staffPhone, text: message });
};

// 1. Meta (Facebook) Webhook Verification
app.get('/webhooks/facebook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === process.env.FB_VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }
});

// 2. Meta (Facebook) Webhook Lead Event
app.post('/webhooks/facebook', async (req, res) => {
    const body = req.body;

    if (body.object === 'page') {
        body.entry.forEach(async (entry) => {
            const leadgenEvent = entry.changes.find(change => change.field === 'leadgen');
            if (leadgenEvent) {
                const leadId = leadgenEvent.value.leadgen_id;
                console.log(`New Meta Lead ID: ${leadId}`);

                // Fetch lead details using Meta Graph API
                try {
                    const response = await axios.get(`https://graph.facebook.com/v19.0/${leadId}?access_token=${process.env.FB_PAGE_ACCESS_TOKEN}`);
                    const leadData = response.data;

                    // Format the lead to match CRM structure
                    const newLead = {
                        id: Date.now(),
                        name: leadData.field_data.find(f => f.name === 'full_name')?.values[0] || 'Unknown Meta Lead',
                        phone: leadData.field_data.find(f => f.name === 'phone_number')?.values[0] || '',
                        email: leadData.field_data.find(f => f.name === 'email')?.values[0] || '',
                        sqft: leadData.field_data.find(f => f.name === 'sqft' || f.name === 'area')?.values[0] || '',
                        project: 'Meta Lead Ads',
                        source: 'Meta Lead Ads',
                        status: 'New Lead',
                        owner: getNextOwner(),
                        budget: 'TBD',
                        next: 'Not set',
                        temp: 'Warm',
                        notes: `Meta Campaign: ${leadData.ad_name || 'N/A'}`
                    };

                    const leads = getLeads();
                    leads.unshift(newLead);
                    saveLeads(leads);

                } catch (error) {
                    console.error('Error fetching Meta lead details:', error.message);
                }
            }
        });
        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

// 3. Google Ads Webhook
app.post('/webhooks/google', (req, res) => {
    const { google_key, ...leadData } = req.body;

    if (google_key !== process.env.GOOGLE_WEBHOOK_KEY) {
        return res.status(403).send('Invalid Key');
    }

    const newLead = {
        id: Date.now(),
        name: leadData.full_name || 'Google Lead',
        phone: leadData.phone_number || '',
        email: leadData.email || '',
        sqft: leadData.sqft || leadData.area_required || '',
        project: 'Google Ads',
        source: 'Google Ads',
        status: 'New Lead',
        owner: getNextOwner(),
        budget: 'TBD',
        next: 'Not set',
        temp: 'Warm',
        notes: `Google Campaign: ${leadData.campaign_id || 'N/A'}`
    };

    const leads = getLeads();
    leads.unshift(newLead);
    saveLeads(leads);

    res.status(200).send('SUCCESS');
});

// 4. Update Lead (for assignment)
app.put('/api/leads/:id', (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    let leads = getLeads();
    const index = leads.findIndex(l => l.id == id);
    if (index !== -1) {
        leads[index] = { ...leads[index], ...updateData };
        saveLeads(leads);
        res.json(leads[index]);
    } else {
        res.status(404).send('Lead not found');
    }
});

// 5. API for Staff
app.get('/api/staff', (req, res) => {
    res.json(getStaff());
});

app.put('/api/staff/:name', (req, res) => {
    const { name } = req.params;
    const { active } = req.body;
    let staff = getStaff();
    const index = staff.findIndex(s => s.name === name);
    if (index !== -1) {
        staff[index].active = active;
        saveStaff(staff);
        res.json(staff[index]);
    } else {
        res.status(404).send('Staff member not found');
    }
});

app.post('/api/staff', (req, res) => {
    const { name } = req.body;
    let staff = getStaff();
    if (!staff.find(s => s.name === name)) {
        staff.push({ name, active: true });
        saveStaff(staff);
    }
    res.json(staff);
});

app.delete('/api/staff/:name', (req, res) => {
    const { name } = req.params;
    let staff = getStaff().filter(s => s.name !== name);
    saveStaff(staff);
    res.json({ success: true });
});

// 6. API for CRM Frontend to get leads
app.get('/api/leads', (req, res) => {
    res.json(getLeads());
});

// 7. Wildcard route to serve index.html for React Router (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Yuvi CRM Backend running on http://localhost:${PORT}`);
});
