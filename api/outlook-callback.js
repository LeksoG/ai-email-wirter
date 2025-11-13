export default async function handler(req, res) {
    console.log('📮 Outlook callback hit!');
    console.log('📍 Full query:', JSON.stringify(req.query));
    
    const { code, error: authError, error_description, error_uri } = req.query;

    if (authError) {
        console.error('❌ Auth error from Microsoft:', authError);
        console.error('📋 Error description:', error_description);
        console.error('🔗 Error URI:', error_uri);
        
        // Return detailed error
        return res.redirect(
            `/?error=outlook_auth_failed` +
            `&error_type=${encodeURIComponent(authError)}` +
            `&error_desc=${encodeURIComponent(error_description || 'No description')}` +
            `&error_uri=${encodeURIComponent(error_uri || 'No URI')}`
        );
    }

    if (!code) {
        console.error('❌ No authorization code provided');
        console.log('📋 All query params:', req.query);
        return res.redirect('/?error=outlook_no_code');
    }

    try {
        const clientId = process.env.OUTLOOK_CLIENT_ID;
        const clientSecret = process.env.OUTLOOK_CLIENT_SECRET;
        
        const host = req.headers.host;
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const redirectUri = `${protocol}://${host}/api/outlook-callback`;

        console.log('🔄 Exchanging code for tokens...');
        console.log('🔗 Redirect URI:', redirectUri);

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

        if (!tokenResponse.ok) {
            console.error('❌ Token exchange failed:', tokens);
            return res.redirect('/?error=outlook_token_failed&details=' + encodeURIComponent(JSON.stringify(tokens)));
        }

        console.log('✅ Tokens received successfully');

        const tokensParam = encodeURIComponent(JSON.stringify(tokens));
        res.redirect(`/?tokens=${tokensParam}&provider=outlook`);
    } catch (error) {
        console.error('❌ Callback error:', error);
        res.redirect('/?error=outlook_callback_exception&details=' + encodeURIComponent(error.message));
    }
}
