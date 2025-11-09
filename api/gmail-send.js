const { google } = require('googleapis');

module.exports = async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const { accessToken, to, subject, body, threadId, messageId } = req.body;

        if (!accessToken) {
            console.error('❌ No access token provided');
            return res.status(400).json({ error: 'Access token is required' });
        }

        if (!to || !subject || !body) {
            console.error('❌ Missing required fields');
            return res.status(400).json({ error: 'To, subject, and body are required' });
        }

        console.log('📤 Sending email...');
        console.log('To:', to);
        console.log('Subject:', subject);
        console.log('Thread ID:', threadId || 'N/A');

        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        // Create the email message in RFC 2822 format
        const emailLines = [];
        emailLines.push(`To: ${to}`);
        emailLines.push(`Subject: ${subject}`);

        // Add In-Reply-To and References headers if this is a reply
        if (messageId) {
            emailLines.push(`In-Reply-To: ${messageId}`);
            emailLines.push(`References: ${messageId}`);
        }

        emailLines.push('Content-Type: text/plain; charset=utf-8');
        emailLines.push('');
        emailLines.push(body);

        const email = emailLines.join('\r\n');

        // Encode the email in base64url format
        const encodedEmail = Buffer.from(email)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        // Prepare the send request
        const sendRequest = {
            userId: 'me',
            requestBody: {
                raw: encodedEmail
            }
        };

        // Add threadId if this is a reply
        if (threadId) {
            sendRequest.requestBody.threadId = threadId;
        }

        // Send the email
        const response = await gmail.users.messages.send(sendRequest);

        console.log('✅ Email sent successfully!');
        console.log('Message ID:', response.data.id);
        console.log('Thread ID:', response.data.threadId);

        res.status(200).json({
            success: true,
            messageId: response.data.id,
            threadId: response.data.threadId,
            message: 'Email sent successfully'
        });
    } catch (error) {
        console.error('❌ Error sending email:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);

        res.status(500).json({
            error: 'Failed to send email',
            message: error.message,
            details: error.toString()
        });
    }
};
