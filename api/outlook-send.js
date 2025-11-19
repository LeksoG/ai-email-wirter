export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { accessToken, to, subject, body, messageId } = req.body;

    console.log('📮 ========== OUTLOOK SEND EMAIL ==========');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Message ID:', messageId);

    if (!accessToken || !to || !subject || !body) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        // Create email message
        const message = {
            subject: subject,
            body: {
                contentType: 'Text',
                content: body
            },
            toRecipients: [
                {
                    emailAddress: {
                        address: to
                    }
                }
            ]
        };

        console.log('📤 Sending email via Microsoft Graph...');

        const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = { error: 'Unable to parse error response' };
            }
            console.error('❌ Outlook send failed:', response.status, errorData);

            // Provide more helpful error messages
            let errorMessage = 'Failed to send email';
            if (response.status === 403) {
                errorMessage = 'Access token expired or invalid. Please reconnect your Outlook account.';
            } else if (response.status === 401) {
                errorMessage = 'Unauthorized. Please reconnect your Outlook account.';
            }

            return res.status(response.status).json({
                message: errorMessage,
                details: errorData
            });
        }

        console.log('✅ Email sent successfully via Outlook');

        res.status(200).json({ 
            success: true,
            message: 'Email sent successfully' 
        });

    } catch (error) {
        console.error('❌ Error sending Outlook email:', error);
        res.status(500).json({ 
            message: 'Internal server error',
            details: error.message 
        });
    }
}
