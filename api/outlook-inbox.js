export default async function handler(req, res) {
    console.log('📮 ========== OUTLOOK INBOX API HIT ==========');
    
    if (req.method !== 'POST') {
        console.log('❌ Wrong method:', req.method);
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { accessToken } = req.body;
    
    console.log('🔑 Access token received:', !!accessToken);
    console.log('🔑 Access token preview:', accessToken ? accessToken.substring(0, 20) + '...' : 'MISSING');

    if (!accessToken) {
        console.log('❌ No access token provided');
        return res.status(400).json({ message: 'Access token required' });
    }

    try {
        console.log('📡 Fetching emails from Microsoft Graph API...');
        
        const response = await fetch(
            'https://graph.microsoft.com/v1.0/me/messages?$top=20&$select=id,subject,from,receivedDateTime,body,bodyPreview,conversationId',
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('📡 Microsoft Graph response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Microsoft Graph API error:', errorData);
            return res.status(response.status).json({
                message: 'Failed to fetch Outlook emails',
                details: errorData
            });
        }

        const data = await response.json();
        
        console.log('📧 Raw response from Microsoft:', data);
        console.log('📧 Emails count:', data.value?.length || 0);

        const emails = data.value.map(email => {
            // Extract body content (prefer text, fallback to HTML with tags stripped)
            let bodyContent = '';
            if (email.body) {
                if (email.body.contentType === 'text') {
                    bodyContent = email.body.content || '';
                } else if (email.body.contentType === 'html') {
                    // Strip HTML tags for plain text
                    bodyContent = (email.body.content || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
                }
            }

            const formatted = {
                id: email.id,
                from: email.from?.emailAddress?.name || email.from?.emailAddress?.address || 'Unknown',
                subject: email.subject || 'No Subject',
                snippet: email.bodyPreview || '',
                body: bodyContent || email.bodyPreview || 'No content available', // Full email body
                date: new Date(email.receivedDateTime).toLocaleString(),
                threadId: email.conversationId
            };
            console.log('✅ Formatted email:', formatted);
            return formatted;
        });

        console.log('✅ ========== RETURNING EMAILS ==========');
        console.log('Total emails:', emails.length);

        res.status(200).json({ emails });
    } catch (error) {
        console.error('❌ ========== OUTLOOK INBOX ERROR ==========');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        res.status(500).json({ 
            message: 'Internal server error',
            details: error.message 
        });
    }
}
