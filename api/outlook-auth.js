export default async function handler(req, res) {
    const OUTLOOK_CLIENT_ID = process.env.OUTLOOK_CLIENT_ID;
    const REDIRECT_URI = process.env.OUTLOOK_REDIRECT_URI || 'http://localhost:3000/api/outlook-callback';
    
    const scopes = [
        'https://graph.microsoft.com/Mail.Read',
        'https://graph.microsoft.com/Mail.Send',
        'https://graph.microsoft.com/User.Read',
        'offline_access'
    ].join(' ');
    
    const authUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?' +
        'client_id=' + OUTLOOK_CLIENT_ID +
        '&response_type=code' +
        '&redirect_uri=' + encodeURIComponent(REDIRECT_URI) +
        '&scope=' + encodeURIComponent(scopes) +
        '&response_mode=query';
    
    res.json({ authUrl: authUrl });
}
