const { google } = require('googleapis');

module.exports = async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const { accessToken } = req.body;

        if (!accessToken) {
            return res.status(400).json({ error: 'Access token is required' });
        }

        console.log('📤 Fetching sent emails...');

        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        // List messages from sent folder
        const listResponse = await gmail.users.messages.list({
            userId: 'me',
            maxResults: 10,
            labelIds: ['SENT']
        });

        const messages = listResponse.data.messages || [];

        // Fetch full message details
        const emails = await Promise.all(
            messages.map(async (msg) => {
                const fullMsg = await gmail.users.messages.get({
                    userId: 'me',
                    id: msg.id,
                    format: 'full'
                });
                return fullMsg.data;
            })
        );

        console.log(`✅ Fetched ${emails.length} sent emails`);

        res.status(200).json({ emails });
    } catch (error) {
        console.error('❌ Error fetching sent emails:', error);
        res.status(500).json({
            error: 'Failed to fetch sent emails',
            message: error.message
        });
    }
};
