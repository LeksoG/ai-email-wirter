export default async function handler(req, res) {
    try {
        const clientId = process.env.OUTLOOK_CLIENT_ID;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.headers.origin || 'http://localhost:3000';
        const redirectUri = `${appUrl}/api/outlook-callback`;
        
        console.log('🔐 Outlook auth initiated');
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
        
        res.status(200).json({ 
            success: true,
            authUrl: authUrl 
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
