export default async function handler(req, res) {
    const { code, error: authError } = req.query;

    console.log('📮 Outlook callback received');
    console.log('Code present:', !!code);
    console.log('Error:', authError);

    if (authError) {
        console.error('❌ Auth error from Microsoft:', authError);
        return res.redirect('/?error=outlook_auth_failed&details=' + authError);
    }

    if (!code) {
        console.error('❌ No authorization code provided');
        return res.redirect('/?error=outlook_no_code');
    }

    try {
        const clientId = process.env.OUTLOOK_CLIENT_ID;
        const clientSecret = process.env.OUTLOOK_CLIENT_SECRET;
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/outlook-callback`;

        console.log('🔄 Exchanging code for tokens...');
        console.log('Client ID:', clientId ? 'Present' : 'Missing');
        console.log('Client Secret:', clientSecret ? 'Present' : 'Missing');
        console.log('Redirect URI:', redirectUri);

        // Exchange code for tokens
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
        console.log('📦 Token response:', tokenResponse.ok ? 'Success' : 'Failed');

        if (!tokenResponse.ok) {
            console.error('❌ Outlook token error:', tokens);
            return res.redirect('/?error=outlook_token_failed&details=' + JSON.stringify(tokens));
        }

        console.log('✅ Tokens received successfully');
        console.log('Access token present:', !!tokens.access_token);
        console.log('Refresh token present:', !!tokens.refresh_token);

        // Redirect back with tokens
        const tokensParam = encodeURIComponent(JSON.stringify(tokens));
        const redirectUrl = `/?tokens=${tokensParam}&provider=outlook`;
        
        console.log('🔄 Redirecting to app...');
        res.redirect(redirectUrl);
    } catch (error) {
        console.error('❌ Outlook callback error:', error);
        res.redirect('/?error=outlook_callback_exception&details=' + error.message);
    }
}
