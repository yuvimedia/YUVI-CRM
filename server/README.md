# Yuvi CRM Backend

This is the backend server to handle real-time leads from Meta (Facebook/Instagram) and Google Ads.

## Setup Instructions

1. **Install Dependencies**:
   Open a terminal in the `server` folder and run:
   ```bash
   npm install
   ```

2. **Configure Credentials**:
   Open the `.env` file and fill in your Meta and Google tokens.

3. **Start the Server**:
   ```bash
   npm start
   ```

4. **Webhook URLs**:
   - Meta Webhook URL: `https://your-domain.com/webhooks/facebook`
   - Google Webhook URL: `https://your-domain.com/webhooks/google`

*Note: For testing locally, you can use a tool like **ngrok** to create a public URL for your localhost:5000 server.*
