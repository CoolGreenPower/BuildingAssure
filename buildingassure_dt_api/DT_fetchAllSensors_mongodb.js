/*
About: Fetches all historical data for all sensors for the Chandler Arizona Location and insert into database.
Note: To test this, Probably need to adjust the names for the table schema in the SQL statements written below and create new
table relations for testing purposes.
*/

// modules
const axios = require('axios').default; // to fetch disruptive technologies data
const dotenv = require('dotenv').config();  // to fetch .env variables

async function main() {
    // Send GET request to endpoint of choice with Basic Auth authentication.
    // Grabs list of devices based on disruptive technology project specified
    let response = await axios({
        method: 'GET',
        url: 'https://api.disruptive-technologies.com/v2/projects/' + process.env.DT_PROJECT_ID + '/devices',
        auth: {
            username: process.env.DT_SERVICE_ACCOUNT_KEY_ID,
            password: process.env.DT_SERVICE_ACCOUNT_SECRET,
        }
    })

    // Prints response contents (list of devices)
    let projectDevices = response.data;

    // Loop through the list of devices
    for await (const device of projectDevices.devices) {
        let devicePath = device.name;
        let deviceName = device.labels.name;

        // if not office gateway device, grab sensor data from the device using the device path string
        if (deviceName != 'Office Gateway') {
            response = await axios({
                method: 'GET',
                url: 'https://api.disruptive-technologies.com/v2/' + devicePath + '/events',
                auth: {
                    username: process.env.DT_SERVICE_ACCOUNT_KEY_ID,
                    password: process.env.DT_SERVICE_ACCOUNT_SECRET,
                },
                params: {
                    startTime: '2022-01-01T00:00:00Z'
                }
            })

            let deviceData = response.data;
            // console.log(deviceData);
            let nextPageToken = deviceData.nextPageToken;  // there will be a string if there is another page of sensor data to be collected (limit for 1 page is 1000 lines)
            // let sameTimeStampFlag;  // used to see if two events happen at the same time which effects the query demand being insert or update
            // let previousTimeStamp = ''; // set first previousTimeStamp as empty string to compare with first event timestamp
            let endOfData = false;

            // while there is still data to be collected from a device
            while (nextPageToken != '' || endOfData == false) {
                for await (const event of deviceData.events) {
                    // TO DO (ropah): consider the implications of having same timestamp with MongoDB / talk to Gordon
                    
                    // if not sameTimeStamp, then you the query will be an insert, else itll be an update
                    // let currentTimeStamp = event.timestamp;
                    // if (previousTimeStamp != currentTimeStamp) {
                    //     previousTimeStamp = currentTimeStamp;
                    //     sameTimeStampFlag = false;
                    // } else {
                    //     sameTimeStampFlag = true;
                    // }

                    let eventData = event;
                    if(eventData.eventType != 'networkStatus') {
                        await insertIntoCollection("BuildingOwners", eventData); // change first parameter to be eventData.eventType
                    }
                }
                endOfData = true;

                if (nextPageToken != '') {  // if nextPageToken is not empty string, there is more data to be collected for a device
                    response = await axios({
                        method: 'GET',
                        url: 'https://api.disruptive-technologies.com/v2/' + devicePath + '/events',
                        auth: {
                            username: process.env.DT_SERVICE_ACCOUNT_KEY_ID,
                            password: process.env.DT_SERVICE_ACCOUNT_SECRET,
                        },
                        params: {
                            startTime: '2022-01-01T00:00:00Z',
                            pageToken: nextPageToken
                        }
                    })

                    deviceData = response.data;
                    nextPageToken = deviceData.nextPageToken;
                    endOfData = false;  // set endOfData to false to know that there is more
                }
            }
        }
    }
}

async function insertIntoCollection(collection, eventData) {

    var data = JSON.stringify({
        "collection": collection,
        "database": "BuildingAssureEntities",
        "dataSource": "Cluster0",
        "document": eventData
    });
                
    var config = {
        method: 'post',
        url: 'https://us-east-1.aws.data.mongodb-api.com/app/data-qrgoo/endpoint/data/v1/action/insertOne',
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