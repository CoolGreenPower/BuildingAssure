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
        queryDatabase();
    }
    });

    connection.connect();

    function queryDatabase() {
    console.log("Querying the database.");
    var query = "SELECT TOP 1 dateTime FROM dbo.DT_ChandlerDevCenter_WaterSensor ORDER BY dateTime DESC";
    console.log("Query: ", query);

    const request = new Request(query,
        (err, rowCount) => {
        if (err) {
            console.error("Request Error: ", err.message);
        } else {
            console.log(`${rowCount} row(s) returned from query.`);
        }
        }
    );

    request.on("row", columns => {
        console.log("Reading Database Records:")
        columns.forEach(column => {
        if (column.value == null) {
            console.log("NULL");
        } else {
            console.log("    %s\t%s", column.metadata.colName, column.value);
            startTime = new Date(column.value);
            startTime.setMinutes(startTime.getMinutes() + 4);  // +4 do to GMT 0400?
        }
        });
    });
    connection.execSql(request);
}