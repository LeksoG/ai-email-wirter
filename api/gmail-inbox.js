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
            console.error('❌ No access token provided');
            return res.status(400).json({ error: 'Access token is required' });
        }

        console.log('📬 Fetching inbox emails...');

        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        // List messages from inbox
        const listResponse = await gmail.users.messages.list({
            userId: 'me',
            maxResults: 10,
            labelIds: ['INBOX']
        });

        const messages = listResponse.data.messages || [];
        console.log(`📨 Found ${messages.length} messages in inbox`);

        // If no messages, return empty array
        if (messages.length === 0) {
            console.log('✅ No messages in inbox, returning empty array');
            return res.status(200).json({ emails: [] });
        }

        // Fetch full message details
        const emails = await Promise.all(
            messages.map(async (msg) => {
                try {
                    const fullMsg = await gmail.users.messages.get({
                        userId: 'me',
                        id: msg.id,
                        format: 'full'
                    });
                    return fullMsg.data;
                } catch (err) {
                    console.error(`❌ Error fetching message ${msg.id}:`, err.message);
                    return null;
                }
            })
        );

        // Filter out any null results
        const validEmails = emails.filter(email => email !== null);

        console.log(`✅ Successfully fetched ${validEmails.length} inbox emails`);

        res.status(200).json({ emails: validEmails });
    } catch (error) {
        console.error('❌ Error fetching inbox:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);

        res.status(500).json({
            error: 'Failed to fetch inbox',
            message: error.message,
            details: error.toString()
        });
    }
};
