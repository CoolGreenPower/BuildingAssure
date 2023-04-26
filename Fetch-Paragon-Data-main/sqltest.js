async function getLatestDate() {
  // await sleep(1000);
  const { Connection, Request } = require("tedious");
  var dateTime;

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
    console.log("Reading rows from the Table...");

    // Read all rows from table
    const request = new Request(
      `SELECT TOP 1 Date_Time FROM dbo.TestSensorTable ORDER BY Date_Time DESC`,
      (err, rowCount) => {
        if (err) {
          console.error(err.message);
        } else {
          console.log(`${rowCount} row(s) returned`);
        }
      }
    );

    request.on("row", columns => {
      columns.forEach(column => {
        if (column.value == null) {
          console.log("NULL");
        } else {
          console.log("%s\t%s", column.metadata.colName, column.value);
          dateTime = new Date(column.value);
          dateTime.setMinutes(dateTime.getMinutes() + 4);
          console.log("*********3 " + dateTime)
          return dateTime;
        }
      });
    });

    // Close the connection after the final event emitted by the request, after the callback passes
    request.on("requestCompleted", function (rowCount, more) {
      connection.close();
    });

    connection.execSql(request);
  }
  console.log("******2 " + dateTime);
  // return dateTime;
}

exports.getLatestDate = getLatestDate;