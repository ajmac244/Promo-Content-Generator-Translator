import 'dotenv/config';
import express from 'express';
import { processNewPromo } from './process-new-promo.js';

const app = express();
const PORT = 3001;

app.use(express.json());
app.use(express.static('.'));

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile('chatbot-ui.html', { root: '.' });
});

// API endpoint to process promos
app.post('/process-promo', async (req, res) => {
    try {
        const { promoText } = req.body;
        
        if (!promoText) {
            return res.json({ success: false, error: 'No promo text provided' });
        }

        console.log('Processing new promo from web interface...');
        const result = await processNewPromo(promoText);
        
        res.json({
            success: true,
            structured: result.structured,
            template: result.template,
            translations: result.translations,
            similar: result.similar
        });
        
    } catch (error) {
        console.error('Error processing promo:', error);
        res.json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Chatbot server running on http://localhost:${PORT}`);
    console.log(`📱 Open your browser and go to: http://localhost:${PORT}`);
});
