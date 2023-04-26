/*
About: Fetches all historical data for all sensors for the Chandler Arizona Location and insert into database.
Note: To test this, Probably need to adjust the names for the table schema in the SQL statements written below and create new
table relations for testing purposes.
*/

// modules
const axios = require('axios').default; // to fetch disruptive technologies data
const dotenv = require('dotenv').config();  // to fetch .env variables
const { Connection, Request } = require("tedious");  // to connect to azure database

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
            let nextPageToken = deviceData.nextPageToken;  // there will be a string if there is another page of sensor data to be collected (limit for 1 page is 1000 lines)
            let sameTimeStampFlag;  // used to see if two events happen at the same time which effects the query demand being insert or update
            let previousTimeStamp = ''; // set first previousTimeStamp as empty string to compare with first event timestamp
            let endOfData = false;

            // while there is still data to be collected from a device
            while (nextPageToken != '' || endOfData == false) {
                for await (const event of deviceData.events) {
                    // if not sameTimeStamp, then you the query will be an insert, else itll be an update
                    let currentTimeStamp = event.timestamp;
                    if (previousTimeStamp != currentTimeStamp) {
                        previousTimeStamp = currentTimeStamp;
                        sameTimeStampFlag = false;
                    } else {
                        sameTimeStampFlag = true;
                    }

                    let eventData = event;
                    await insertIntoAzure(deviceName, eventData, sameTimeStampFlag);  // insert data into azure database
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

async function insertIntoAzure(deviceName, eventData, sameTimeStampFlag) {
    const config = {
        authentication: {
            options: {
                userName: "CGPserver", // update me
                password: "CGPcgp1$" // update me
            },
            type: "default"
        },
        server: "coolgreenpowerdbs.database.windows.net", // update me
        options: {
            database: "CGPdb", //update me
            encrypt: true
        }
    };
    const connection = new Connection(config);

    console.log("ALERT1");
    connection.on("connect", err => {
        if (err) {
            //console.log("ERROR ALERT1");
            console.error(err.message);
        } else {
            try {
                //console.log("ALERT2");
                insertData(deviceName, eventData, sameTimeStampFlag);
            } catch (error) {
                //console.log("ERROR ALERT2");
                console.log(error);
            }
        }
    });
    
    connection.connect();

    async function insertData(deviceName, eventData, sameTimeStampFlag) {
        // sort out the event type and grab the specific data we want for each event
        let newDateTimeData = new Date(eventData.timestamp).toISOString();
        if (eventData.eventType == 'networkStatus') {
            data = eventData.data.networkStatus.rssi;
        } else if (eventData.eventType == 'batteryStatus') {
            data = eventData.data.batteryStatus.percentage;
        } else if (eventData.eventType == 'objectPresent') {
            data = eventData.data.objectPresent.state;
        } else if (eventData.eventType == 'humidity') {
            data = [eventData.data.humidity.relativeHumidity, eventData.data.humidity.temperature];
        } else if (eventData.eventType == 'temperature') {
            data = eventData.data.temperature.value;
        } else if (eventData.eventType == 'touch') {
            data = "sensorTouched";
        } else if (eventData.eventType == 'waterPresent') {
            data = eventData.data.waterPresent.state;
        } else {
            console.log("Unknown Event Type. It is: ", eventData.eventType);
        }

        // does an insert or update to database depending on if the event happens at the same time.
        if (!sameTimeStampFlag) {
            if (eventData.eventType != 'humidity') {
                if (typeof (data) == 'number') {
                    var query = "INSERT INTO dbo.DT_ChandlerDevelopmentCenter_" + deviceName.replace(/\s+/g, '') + " ([dateTime], [" + eventData.eventType + "])"
                        + " SELECT '" + newDateTimeData + "', " + data;
                    console.log("QUERY1: ", query);
                } else if (typeof (data) == 'string') {
                    var query = "INSERT INTO dbo.DT_ChandlerDevelopmentCenter_" + deviceName.replace(/\s+/g, '') + " ([dateTime], [" + eventData.eventType + "])"
                        + " SELECT '" + newDateTimeData + "', '" + data + "'";
                    console.log("QUERY2: ", query);
                }
            } else {
                var query = "INSERT INTO dbo.DT_ChandlerDevelopmentCenter_" + deviceName.replace(/\s+/g, '') + " ([dateTime], [relativeHumidity], [temperature])"
                    + " SELECT '" + newDateTimeData + "', " + data[0] + ", " + data[1];
                console.log("QUERY3: ", query);
            }
        } else {  // update data
            if (eventData.eventType != 'humidity') {
                if (typeof (data) == 'number') {
                    var query = "UPDATE dbo.DT_ChandlerDevelopmentCenter_" + deviceName.replace(/\s+/g, '') + " SET " + eventData.eventType + " = " + data + " WHERE dateTime = '" + newDateTimeData + "'";
                    console.log("QUERY4: ", query);
                } else if (typeof (data) == 'string') {
                    var query = "UPDATE dbo.DT_ChandlerDevelopmentCenter_" + deviceName.replace(/\s+/g, '') + " SET " + eventData.eventType + " = '" + data + "' WHERE dateTime = '" + newDateTimeData + "'";
                    console.log("QUERY5: ", query);
                }
            } else {
                var query = "UPDATE dbo.DT_ChandlerDevelopmentCenter_" + deviceName.replace(/\s+/g, '') + " SET relativeHumidity = " + data[0] + ", temperature = " + data[1]
                    + " WHERE dateTime = '" + newDateTimeData + "'";
                console.log("QUERY6: ", query);
            }
        }
        
        const request = new Request(query,
            (err, rowCount) => {
                if (err) {
                    console.error(err.message);
                } else {
                    //console.log(`${rowCount} row(s) inserted into the database.`);
                }
            }
        );

        request.on("row", columns => {
            columns.forEach(column => {
                //console.log("%s\t%s", column.metadata.colName, column.value);
            });
        });

        // Close the connection after the final event emitted by the request, after the callback passes
        request.on("requestCompleted", function (rowCount, more) {
            connection.close();
        });

        connection.execSql(request);
    }

    connection.close();
}

main();