const cron = require('node-cron');
const axios = require('axios');

const startCronJobs = () => {
    // Schedule a task to run every 13 minutes
    cron.schedule('*/13 * * * *', async () => {
        console.log('⏰ Cron Job: Pinging AI Engine to keep it alive...');
        try {
            const aiUrl = process.env.AI_ENGINE_URL || 'http://127.0.0.1:5001';
            const response = await axios.get(`${aiUrl}/health`);
            console.log(`✅ AI Engine Alive: ${response.status} - ${response.data.service}`);
        } catch (error) {
            console.error('❌ AI Engine Ping Failed:', error.message);
        }
    });
};

module.exports = startCronJobs;
