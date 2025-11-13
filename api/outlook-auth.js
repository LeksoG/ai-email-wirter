export default async function handler(req, res) {
    try {
        const clientId = process.env.OUTLOOK_CLIENT_ID;
        
        console.log('🔐 Outlook auth initiated');
        console.log('🔑 Client ID:', clientId ? `${clientId.substring(0, 8)}...` : 'MISSING');
        
        if (!clientId) {
            console.error('❌ OUTLOOK_CLIENT_ID not configured');
            return res.status(500).json({ 
                success: false,
                error: 'Outlook client ID not configured' 
            });
        }
        
        // Validate client ID format (should be a GUID)
        const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!guidRegex.test(clientId)) {
            console.error('❌ Invalid client ID format');
            return res.status(500).json({ 
                success: false,
                error: 'Invalid client ID format - should be a GUID' 
            });
        }
        
        // Build redirect URI carefully
        const host = req.headers.host;
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const redirectUri = `${protocol}://${host}/api/outlook-callback`;
        
        console.log('📍 Host:', host);
        console.log('🔒 Protocol:', protocol);
        console.log('🔗 Redirect URI:', redirectUri);
        
        // Build auth URL with proper encoding
        const params = new URLSearchParams({
            client_id: clientId,
            response_type: 'code',
            redirect_uri: redirectUri,
            response_mode: 'query',
            scope: 'https://graph.microsoft.com/Mail.Read offline_access',
            prompt: 'select_account'
        });
        
        const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;

        console.log('✅ Auth URL generated');
        console.log('🔗 Auth URL:', authUrl.substring(0, 150) + '...');
        
        res.status(200).json({ 
            success: true,
            authUrl: authUrl,
            redirectUri: redirectUri
        });
    } catch (error) {
        console.error('❌ Outlook auth error:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
}
