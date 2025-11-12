export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { accessToken } = req.body;

        if (!accessToken) {
            return res.status(400).json({ message: 'Access token required' });
        }

        const response = await fetch(
            'https://graph.microsoft.com/v1.0/me/messages?$top=20&$orderby=receivedDateTime desc',
            {
                headers: {
                    'Authorization': 'Bearer ' + accessToken,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to fetch emails');
        }

        const data = await response.json();
        
        const emails = data.value.map(function(email) {
            return {
                id: email.id,
                from: email.from?.emailAddress?.address || 'Unknown',
                subject: email.subject || 'No Subject',
                snippet: email.bodyPreview || '',
                date: new Date(email.receivedDateTime).toLocaleString(),
                threadId: email.conversationId
            };
        });

        res.json({ emails: emails });

    } catch (error) {
        console.error('Outlook inbox error:', error);
        res.status(500).json({ 
            message: 'Failed to fetch Outlook emails',
            details: error.message 
        });
    }
}
