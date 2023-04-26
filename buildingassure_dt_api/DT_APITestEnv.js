/*
About: This is a file to test the Disruptive Technologies API.
Quick link to DT's API documentation: https://developer.disruptive-technologies.com/api#
*/

// modules
const axios = require('axios').default; // npm install axios@0.24.0
const dotenv = require('dotenv').config();

async function main() {
    // Send GET request to endpoint of choice with Basic Auth authentication.
    const response = await axios({
        method: 'GET',
        url: 'https://api.d21s.com/v2/projects/' + process.env.DT_PROJECT_ID + '/devices/btov79dpna500081h9o0/events',
        auth: {
            username: process.env.DT_SERVICE_ACCOUNT_KEY_ID,
            password: process.env.DT_SERVICE_ACCOUNT_SECRET
        }
    })

    console.log(JSON.stringify(response.data, null, 2));
}

main();