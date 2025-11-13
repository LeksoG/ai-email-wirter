export default async function handler(req, res) {
    console.log('📮 Outlook callback hit!');
    console.log('📍 Request URL:', req.url);
    console.log('📍 Query params:', req.query);
    
    const { code, error: authError } = req.query;

    if (authError) {
        console.error('❌ Auth error from Microsoft:', authError);
        return res.redirect('/?error=outlook_auth_failed&details=' + encodeURIComponent(authError));
    }

    if (!code) {
        console.error('❌ No authorization code provided');
        return res.redirect('/?error=outlook_no_code');
    }

    try {
        const clientId = process.env.OUTLOOK_CLIENT_ID;
        const clientSecret = process.env.OUTLOOK_CLIENT_SECRET;
        
        // Use the same logic to generate redirect URI
        const host = req.headers.host;
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const redirectUri = `${protocol}://${host}/api/outlook-callback`;

        console.log('🔄 Exchanging code for tokens...');
        console.log('🔗 Using redirect URI:', redirectUri);
        console.log('🔑 Client ID present:', !!clientId);
        console.log('🔐 Client Secret present:', !!clientSecret);

        const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                code: code,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
                scope: 'https://graph.microsoft.com/Mail.Read offline_access'
            })
        });

        const tokens = await tokenResponse.json();

        console.log('📦 Token response status:', tokenResponse.status);

        if (!tokenResponse.ok) {
            console.error('❌ Token exchange failed:', tokens);
            return res.redirect('/?error=outlook_token_failed&details=' + encodeURIComponent(JSON.stringify(tokens)));
        }

        console.log('✅ Tokens received successfully');

        // Redirect back with tokens
        const tokensParam = encodeURIComponent(JSON.stringify(tokens));
        const redirectUrl = `/?tokens=${tokensParam}&provider=outlook`;
        
        console.log('🔄 Redirecting to app...');
        res.redirect(redirectUrl);
    } catch (error) {
        console.error('❌ Outlook callback error:', error);
        res.redirect('/?error=outlook_callback_exception&details=' + encodeURIComponent(error.message));
    }
}
