
const axios = require('axios').default; 
const dotenv = require('dotenv').config();

async function main() {

    // Get the sensor updates from DT
    // Send GET request to endpoint of choice with Basic Auth authentication
    const response = await axios({
        method: 'GET',
        url: 'https://api.disruptive-technologies.com/v2/projects/cbatk6b9ub8ophfojf9g/devices/c9j6g0nck92000emtukg/events', // update
        auth: {
            username: process.env.DT_SERVICE_ACCOUNT_KEY_ID,
            password: process.env.DT_SERVICE_ACCOUNT_SECRET,
        },
        params: {
            eventTypes: ['co2'] // update
        }
    })

    
    const deviceData = response.data;
    console.log(deviceData.events);

    
    var data = JSON.stringify({
        "collection": "BuildingOwner",
        "database": "BuildingAssureEntities",
        "dataSource": "Cluster0",
        "documents": deviceData.events
    });
                
    var config = {
        method: 'post',
        url: 'https://us-east-1.aws.data.mongodb-api.com/app/data-qrgoo/endpoint/data/v1/action/insertMany',
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Request-Headers': '*',
          'api-key': 'a7BBHatMMUJsQgr3jSlVUfUxDPAJnANJmFLxfsGwBvkUvyLyfOdYdrJowkB0p4gC',
        },
        data: data
    };
                
    axios(config)
        .then(function (response) {
            console.log(JSON.stringify(response.data));
        })
        .catch(function (error) {
            console.log(error);
        });
            
}

main();