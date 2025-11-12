export default async function handler(req, res) {
    const { code } = req.query;
    
    if (!code) {
        return res.redirect('/?error=no_code');
    }
    
    try {
        const OUTLOOK_CLIENT_ID = process.env.OUTLOOK_CLIENT_ID;
        const OUTLOOK_CLIENT_SECRET = process.env.OUTLOOK_CLIENT_SECRET;
        const REDIRECT_URI = process.env.OUTLOOK_REDIRECT_URI;
        
        const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: OUTLOOK_CLIENT_ID,
                client_secret: OUTLOOK_CLIENT_SECRET,
                code: code,
                redirect_uri: REDIRECT_URI,
                grant_type: 'authorization_code'
            })
        });
        
        const tokens = await tokenResponse.json();
        
        if (!tokenResponse.ok) {
            throw new Error(tokens.error_description || 'Token exchange failed');
        }
        
        const tokensParam = encodeURIComponent(JSON.stringify(tokens));
        res.redirect('/?tokens=' + tokensParam + '&provider=outlook');
        
    } catch (error) {
        console.error('Outlook callback error:', error);
        res.redirect('/?error=outlook_auth_failed');
    }
}
