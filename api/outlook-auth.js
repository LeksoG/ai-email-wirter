export default async function handler(req, res) {
    try {
        const clientId = process.env.OUTLOOK_CLIENT_ID;
        
        // Get the actual deployed URL
        const host = req.headers.host; // e.g., "your-app.vercel.app"
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const appUrl = `${protocol}://${host}`;
        const redirectUri = `${appUrl}/api/outlook-callback`;
        
        console.log('🔐 Outlook auth initiated');
        console.log('🌐 Host:', host);
        console.log('🔒 Protocol:', protocol);
        console.log('📍 App URL:', appUrl);
        console.log('📍 Redirect URI:', redirectUri);
        
        if (!clientId) {
            console.error('❌ OUTLOOK_CLIENT_ID not configured');
            return res.status(500).json({ 
                success: false,
                error: 'Outlook client ID not configured in environment variables' 
            });
        }

        const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
            `client_id=${clientId}` +
            `&response_type=code` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&scope=${encodeURIComponent('https://graph.microsoft.com/Mail.Read offline_access')}` +
            `&response_mode=query` +
            `&prompt=select_account`;

        console.log('✅ Auth URL generated successfully');
        console.log('🔗 Full redirect URI:', redirectUri);
        
        res.status(200).json({ 
            success: true,
            authUrl: authUrl,
            redirectUri: redirectUri // Send this back so we can see it
        });
    } catch (error) {
        console.error('❌ Outlook auth error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to initiate Outlook authentication',
            details: error.message 
        });
    }
}
