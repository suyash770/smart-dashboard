const axios = require('axios');

async function trigger() {
    try {
        await axios.post('http://localhost:5000/api/auth/forgot-password', {
            email: 'suyashg0079@gmail.com'
        });
        console.log('Triggered successfully');
    } catch (err) {
        console.error('Error:', err.message);
    }
}

trigger();
