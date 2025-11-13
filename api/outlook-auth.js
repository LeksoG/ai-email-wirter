export default async function handler(req, res) {
    try {
        const clientId = process.env.OUTLOOK_CLIENT_ID;
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/outlook-callback`;
        
        console.log('🔐 Outlook auth initiated');
        console.log('📍 Redirect URI:', redirectUri);
        
        if (!clientId) {
            console.error('❌ OUTLOOK_CLIENT_ID not configured');
            return res.status(500).json({ error: 'Outlook client ID not configured' });
        }

        const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
            `client_id=${clientId}` +
            `&response_type=code` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&scope=${encodeURIComponent('https://graph.microsoft.com/Mail.Read offline_access')}` +
            `&response_mode=query`;

        console.log('🔗 Auth URL generated');
        res.json({ authUrl });
    } catch (error) {
        console.error('❌ Outlook auth error:', error);
        res.status(500).json({ error: 'Failed to initiate Outlook authentication' });
    }
}
