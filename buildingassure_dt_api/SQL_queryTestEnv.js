/*
About: SQL operations test environment. Probably need to adjust the names for the table schema in the SQL statements written below.
*/

const { Connection, Request } = require("tedious");

async function main() {
    await insertIntoAzure()
}

async function insertIntoAzure() {
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

    const connection = new Connection(config);

    // Attempt to connect and execute queries if connection goes through
    connection.on("connect", err => {
        if (err) {
            console.error(err.message);
        } else {
            try {
                insertData();
            } catch (error) {
                console.log(error);
            }
        }
    });

    connection.connect();

    async function insertData() {
        var newDateTimeData = new Date('2022-10-28T01:00:00.000000Z').toISOString();
        var objectPresent = 'NOT_PRESENT';
        var networkStatus = -75;
        var batteryStatus = 100;

        /*
        var query = "INSERT INTO dbo.DT_ChandlerDevelopmentCenter_FrontDoor ([dateTime], [networkStatus]) SELECT '" 
                    + newDateTimeData + "', '" + networkStatus + "'";
        */

        var query = "UPDATE dbo.DT_ChandlerDevelopmentCenter_FrontDoor SET objectPresent = '" + objectPresent + "' WHERE dateTime = '" + newDateTimeData + "'";
        console.log(query);
        
        const request = new Request(query,
            (err, rowCount) => {
                if (err) {
                    console.error(err.message);
                } else {
                    console.log(`${rowCount} row(s) inserted into the database.`);
                }
            }
        );

        request.on("row", columns => {
            columns.forEach(column => {
                console.log("%s\t%s", column.metadata.colName, column.value);
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