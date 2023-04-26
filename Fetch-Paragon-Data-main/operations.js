// var config = require('./config');

async function putData(xData, yData) {
    try {
        const { Connection, Request } = require("tedious");
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
        console.log("*************")

        connection.on("connect", err => {
            if (err) {
                console.log("#############")
                console.error(err.message);
            } else {
                console.log("###")
                console.log("Reading rows from the Table...");

                var date = new Date(xData[0])
                var Str =
                    ("00" + (date.getMonth() + 1)).slice(-2) + "/" +
                    ("00" + date.getDate()).slice(-2) + "/" +
                    date.getFullYear() + " " +
                    ("00" + date.getHours()).slice(-2) + ":" +
                    ("00" + date.getMinutes()).slice(-2) + ":" +
                    ("00" + date.getSeconds()).slice(-2);

                //   Read all rows from table
                var query = "INSERT INTO dbo.TestSensorTable ([Date_Time],[Humidity]) SELECT '" + Str + "', " + yData[0] + " ";

                for (var i = 1; i < xData.length; i++) {

                    var date = new Date(xData[i])
                    var dateStr =
                        ("00" + (date.getMonth() + 1)).slice(-2) + "/" +
                        ("00" + date.getDate()).slice(-2) + "/" +
                        date.getFullYear() + " " +
                        ("00" + date.getHours()).slice(-2) + ":" +
                        ("00" + date.getMinutes()).slice(-2) + ":" +
                        ("00" + date.getSeconds()).slice(-2);

                    query += "UNION ALL SELECT '" + dateStr + "'," + yData[i] + " ";
                }

                //   query += "WHERE Date_Time != ";

                console.log("Reading rows from the Table...2");
                const request = new Request(query,
                    (err, rowCount) => {
                        if (err) {
                            console.error(err.message);
                        } else {
                            console.log(`${rowCount} row(s) returned`);
                        }
                    }
                );

                console.log("Reading rows from the Table...3");

                request.on("row", columns => {
                    columns.forEach(column => {
                        console.log("%s\t%s", column.metadata.colName, column.value);
                    });
                });

                connection.execSql(request);
                console.log("Reading rows from the Table...4");
            }
        });
    } catch (error) {
        console.log(error);
    }
}


module.exports = {
    putData: putData
}