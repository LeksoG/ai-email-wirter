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
        const { refreshToken } = req.body;

        if (!refreshToken) {
            console.error('❌ No refresh token provided');
            return res.status(400).json({ error: 'Refresh token is required' });
        }

        console.log('🔄 Refreshing access token...');

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            `${req.headers.origin || 'https://ai-email-wirter.vercel.app'}/api/gmail-callback`
        );

        // Set the refresh token
        oauth2Client.setCredentials({
            refresh_token: refreshToken
        });

        // Get new access token
        const { credentials } = await oauth2Client.refreshAccessToken();

        console.log('✅ Access token refreshed successfully');

        res.status(200).json({
            access_token: credentials.access_token,
            expiry_date: credentials.expiry_date
        });
    } catch (error) {
        console.error('❌ Token refresh error:', error);
        console.error('Error details:', error.message);

        res.status(500).json({
            error: 'Failed to refresh token',
            message: error.message,
            details: error.toString()
        });
    }
};
