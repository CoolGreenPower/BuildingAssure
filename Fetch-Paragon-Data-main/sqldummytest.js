function insertIntoAzure(xData, yData) {
  const { Connection, Request } = require("tedious");

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
        queryDatabase();
      } catch (error) {
        console.log(error);
      }
    }
  });

  connection.connect();

  function queryDatabase() {
    var date = new Date(xData[0]).toISOString();

    // Read all rows from table
    var query = "INSERT INTO dbo.TestSensorTable ([Date_Time],[Humidity]) SELECT '" + date + "', " + yData[0] + " ";

    for (var i = 1; i < xData.length; i++) {
      var date = new Date(xData[i]).toISOString()
      query += "UNION ALL SELECT '" + date + "'," + yData[i] + " ";
    }

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
exports.insertIntoAzure = insertIntoAzure;