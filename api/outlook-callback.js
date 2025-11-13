export default async function handler(req, res) {
    console.log('📮 ========== OUTLOOK CALLBACK HIT ==========');
    console.log('📍 Full URL:', req.url);
    console.log('📍 All query params:', JSON.stringify(req.query, null, 2));
    console.log('📍 Headers:', JSON.stringify(req.headers, null, 2));
    
    // Destructure ALL possible error fields Microsoft might send
    const { 
        code, 
        error, 
        error_description, 
        error_uri,
        session_state,
        state 
    } = req.query;

    console.log('🔍 Parsed values:');
    console.log('  - code:', code ? 'Present' : 'Missing');
    console.log('  - error:', error || 'None');
    console.log('  - error_description:', error_description || 'None');
    console.log('  - error_uri:', error_uri || 'None');

    if (error) {
        console.error('❌ ========== MICROSOFT RETURNED ERROR ==========');
        console.error('Error code:', error);
        console.error('Error description:', error_description);
        console.error('Error URI:', error_uri);
        console.error('Full query object:', req.query);
        
        // Redirect with ALL error info
        const errorParams = new URLSearchParams({
            error: 'outlook_auth_failed',
            error_type: error,
            error_desc: error_description || 'No description provided',
            error_uri: error_uri || 'No URI provided',
            raw_error: JSON.stringify(req.query)
        });
        
        return res.redirect(`/?${errorParams.toString()}`);
    }

    if (!code) {
        console.error('❌ No authorization code provided');
        console.error('Query params received:', req.query);
        return res.redirect('/?error=outlook_no_code&query=' + encodeURIComponent(JSON.stringify(req.query)));
    }

    try {
        const clientId = process.env.OUTLOOK_CLIENT_ID;
        const clientSecret = process.env.OUTLOOK_CLIENT_SECRET;
        
        console.log('🔑 Environment check:');
        console.log('  - OUTLOOK_CLIENT_ID:', clientId ? `${clientId.substring(0, 8)}...` : 'MISSING');
        console.log('  - OUTLOOK_CLIENT_SECRET:', clientSecret ? 'Present' : 'MISSING');
        
        const host = req.headers.host;
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const redirectUri = `${protocol}://${host}/api/outlook-callback`;

        console.log('🔄 Token exchange starting...');
        console.log('  - Redirect URI:', redirectUri);

        const tokenBody = new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            code: code,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
            scope: 'https://graph.microsoft.com/Mail.Read offline_access'
        });

        console.log('📤 Sending token request to Microsoft...');
        
        const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: tokenBody
        });

        const tokens = await tokenResponse.json();
        
        console.log('📥 Token response status:', tokenResponse.status);
        console.log('📥 Token response:', JSON.stringify(tokens, null, 2));

        if (!tokenResponse.ok) {
            console.error('❌ Token exchange failed');
            console.error('Response:', tokens);
            return res.redirect('/?error=outlook_token_failed&details=' + encodeURIComponent(JSON.stringify(tokens)));
        }

        console.log('✅ ========== TOKENS RECEIVED ==========');
        console.log('Access token present:', !!tokens.access_token);
        console.log('Refresh token present:', !!tokens.refresh_token);

        const tokensParam = encodeURIComponent(JSON.stringify(tokens));
        const redirectUrl = `/?tokens=${tokensParam}&provider=outlook`;
        
        console.log('🔄 Redirecting to app with tokens...');
        res.redirect(redirectUrl);
    } catch (error) {
        console.error('❌ ========== EXCEPTION IN CALLBACK ==========');
        console.error('Error:', error);
        console.error('Stack:', error.stack);
        res.redirect('/?error=outlook_callback_exception&details=' + encodeURIComponent(error.message));
    }
}
