function fetchParagonData() {
  var haloS = require("./haloS.js");
  var sqlTestDummy = require("./sqldummytest.js");
  // var sqltest = require("./sqltest.js");

  var startTime;
  const endTime = new Date();

  // console.log("****** "+dateTime + "&&&&&&&&&&&&&&");
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
    var query = "SELECT TOP 1 Date_Time FROM dbo.TestSensorTable ORDER BY Date_Time DESC";
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

  var sleep = function (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  var options = {
    securityDomain: "/company/paragonrobotics.com/sales/internal/system/name/coolgreenpower.com"
  };

  haloS.initialize(options);

  var options = {
    type: "wss",
    transportIsAuthorizedAndSecure: true,
    address: "ws.hc.paragonrobotics.com",
    username: "ichidrawar@coolgreenpower.com",
    password: "Isha@2021",
    closeCallback: function () {
      console.log("Connection closed.");
    }
  };

  console.log("Connecting to Halo Cloud.");
  haloS.connectToHaloCloud(options, async function (isConnected) {
    console.log("Is Connected: " + isConnected);

    // tell the server that you want to talk to this device. This can be an object list of devices

    const DEVICE_PATH = "/company/paragonrobotics.com/device/transform/22212/1/188"
    haloS.subscribeToRoutingChanges({ "1": { _type: DEVICE_PATH } });
    await sleep(1000);

    haloS.readRecordedData(DEVICE_PATH + "/machine/2", startTime, endTime, function (data, err) {
      console.log("Reading Recorded Data between a start time and end time: ");
      console.log("Start Time:");
      console.log("    ", startTime);
      console.log("End Time:");
      console.log("    ", endTime);
      let xData = data.xData
      xData = xData.map(time => (new Date(time)))

      let yData = data.yData
      //yData = yData.map(val => val[0] - 273.15)
      yData = yData.map(val => val[0])

      console.log("Inserting data into Azure Database.");
      sqlTestDummy.insertIntoAzure(xData, yData);

      console.log("xData", xData)
      console.log("yData", yData)

      // add the value you on as trying to read the current temperature value. 
      haloS.readValue(DEVICE_PATH + "/machine/2/value", (val, err1) => {
        //console.log("val", val - 273.15);
        console.log("val", val);
        if (err) {
          console.error(err1.message);
        }
        haloS.shutdown();
      });
    });
  });
}

exports.fetchParagonData = fetchParagonData;