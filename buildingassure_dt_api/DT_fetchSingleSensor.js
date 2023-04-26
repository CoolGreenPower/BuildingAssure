/*
About: Fetches single sensor data for the Chandler Arizona Location and insert into database.
Note: To test this, Probably need to adjust the names for the table schema in the SQL statements written below and create new
table relations for testing purposes.
*/

// modules
const axios = require('axios').default; // npm install axios@0.24.0
const dotenv = require('dotenv').config();
const { Connection, Request } = require("tedious");

async function main() {
    // Send GET request to endpoint of choice with Basic Auth authentication.
    const response = await axios({
        method: 'GET',
        url: 'https://api.disruptive-technologies.com/v2/projects/cbatk6b9ub8ophfojf9g/devices/c9j6g0nck92000emtukg/events',
        auth: {
            username: process.env.DT_SERVICE_ACCOUNT_KEY_ID,
            password: process.env.DT_SERVICE_ACCOUNT_SECRET,
        },
        params: {
            eventTypes: ['co2']
        }
    })

    // Print response contents.
    console.log(JSON.stringify(response.data, null, 2))

    const deviceData = response.data;
    // console.log("The number of records in the last 24 hours is: ", deviceData.events.length);
    for (i = 0; i < deviceData.events.length; i++) {
        let dateTimeData = deviceData.events[i].data.co2.updateTime;
        let CO2Data = deviceData.events[i].data.co2.co2;
        let networkStatusData = deviceData.events[i].data.co2.networkStatus;
        let batteryStatusData = deviceData.events[i].data.co2.batteryStatus;

        await insertIntoAzure(dateTimeData, CO2Data, networkStatusData, batteryStatusData);
    }
}

async function insertIntoAzure(dateTimeData,  CO2Data, networkStatusData, batteryStatusData) {
    // Create connection to database
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
    var connection = new Connection(config);

    // Attempt to connect and execute queries if connection goes through
    connection.on("connect", err => {
        if (err) {
            // console.error(err.message);
        } else {
            try {
                insertData(dateTimeData, CO2Data, networkStatusData, batteryStatusData);
            } catch (error) {
                // console.log(error);
            }
        }
    });

    connection.connect();

    async function insertData(newDateTimeData, CO2Data, neworkStatusData, batteryStatusData) {
        var newDateTimeData = new Date(dateTimeData).toISOString();
        //console.log(newDateTimeData, temperatureData, relativeHumidtyData);

        //var query = "INSERT INTO dbo.TestSensorTable ([Date_Time],[Humidity]) SELECT '" + date + "', " + yData[0] + " ";
        var query = "INSERT INTO dbo.DT_ChandlerDevCenter_MasterBedCO2Sensor ([dateTime], [CO2Amount], [networkStatus], [batteryStatus]) SELECT '"
            + newDateTimeData + "', " + CO2Data + ", " + neworkStatusData + ", " + batteryStatusData;
        const request = new Request(query,
            (err, rowCount) => {
                if (err) {
                    // console.error(err.message);
                } else {
                    // console.log(`${rowCount} row(s) inserted into the database.`);
                }
            }
        );

        request.on("row", columns => {
            columns.forEach(column => {
                // console.log("%s\t%s", column.metadata.colName, column.value);
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

main()