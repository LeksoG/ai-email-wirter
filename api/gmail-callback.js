const { google } = require('googleapis');

module.exports = async function handler(req, res) {
    try {
        const { code } = req.query;

        if (!code) {
            console.error('❌ No authorization code provided');
            return res.redirect('/?error=no_code');
        }

        const redirectUri = `${req.headers.origin || 'https://ai-email-wirter.vercel.app'}/api/gmail-callback`;

        console.log('🔐 Processing OAuth callback...');
        console.log('📍 Redirect URI:', redirectUri);

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            redirectUri
        );

        // Exchange authorization code for access token
        const { tokens } = await oauth2Client.getToken(code);

        console.log('✅ Access token obtained');

        // Redirect back to app with tokens
        const tokensParam = encodeURIComponent(JSON.stringify(tokens));
        res.redirect(`/?tokens=${tokensParam}`);
    } catch (error) {
        console.error('❌ OAuth callback error:', error);
        res.redirect(`/?error=${encodeURIComponent(error.message)}`);
    }
};
