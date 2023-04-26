// function getLastDate(xData, yData){
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

  //   Read all rows from table
  //   var query = "INSERT INTO dbo.TestSensorTable ([Date_Time],[Humidity]) SELECT '"+ Str +"', "+ yData[0] +" " ;
  var query = "SELECT TOP 1 * FROM dbo.TestSensorTable ORDER BY Date_Time DESC";

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
connection.close();
// }
// exports.getParagonData = getParagonData;