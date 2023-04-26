/*
This is a program to fetch all of the latest data from all of the sensors on all of the devices at the Building Assure Chandler Arizona location.
Do Next: Add SQL operations to insert into database. Add some kind of timer that performs the fetching of data and insertion into the database.
*/

var haloS = require("./haloS.js");
const axios = require('axios').default;

var sleep = function (ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
};

var readValueWrapper = function (sensor) {
  return new Promise(function (resolve) {
    haloS.readValue(sensor, resolve);
  });
};

// my JSON object of locations, devices, and machines (sensors)
// may include more locations, or maybe other locations should be in their own separate file?
const obj = {
  "LOCATIONS": [
    {
      "LOCATION": "Building Assure Chandler Arizona",
      "DEVICES": [
        {
          "DEVICE": "Attic HVAC Unit",
          "DEVICE_PATH": "/company/paragonrobotics.com/device/transform/20102/1/316",
          "MACHINES":
          {
            "TEMPERATURE": "/machine/2/value",
            "HUMIDITY": "/machine/3/value",
            "VIBRATION": "/machine/15/value",
            "BATTERY_VOLTAGE": "/machine/12/value",
          }
        },
        {
          "DEVICE": "HVAC Temp Probes",
          "DEVICE_PATH": "/company/paragonrobotics.com/device/refresh/31/1/159",
          "MACHINES":
          {
            "RETURN_AIR": "/machine/2/value",
            "SUPPLY_AIR": "/machine/3/value"
          }
        },
        {
          "DEVICE": "Office Gateway",
          "DEVICE_PATH": "/company/paragonrobotics.com/device/transform/22212/1/188",
          "MACHINES":
          {
            "TEMPERATURE": "/machine/2/value",
            "HUMIDITY": "/machine/3/value",
            "VIBRATION": "/machine/15/value",
            "BATTERY_VOLTAGE": "/machine/12/value"
          }
        },
        {
          "DEVICE": "Outdoor AC Unit",
          "DEVICE_PATH": "/company/paragonrobotics.com/device/transform/20102/1/810",
          "MACHINES":
          {
            "TEMPERATURE": "/machine/2/value",
            "HUMIDITY": "/machine/3/value",
            "VIBRATION": "/machine/15/value",
            "BATTERY_VOLTAGE": "/machine/12/value",
          }
        },
        {
          "DEVICE": "AC Unit CT Clamp",
          "DEVICE_PATH": "/company/paragonrobotics.com/device/refresh/1/1/272",
          "MACHINES":
          {
            "AC_UNIT": "/machine/5/value",
          }
        }
      ]
    }
  ]
}

const currentTime = new Date();
console.log("Current Time:");
console.log("    ", currentTime);

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

console.log("Connecting to Halo Cloud");
// connect to cloud and then start looping through json object to get latest data for each sensor
haloS.connectToHaloCloud(options, async function (isConnected) {
  console.log("Is Connected: " + isConnected);

  let locations = obj.LOCATIONS;
  var PR_events = new Object(); // for every location
  for (const location of locations) {
    let devices = location.DEVICES;

    for (const device of devices) {
      //console.log("ALERT 1");  // this is to assist in debugging
      console.log("\n********************\n");
      haloS.subscribeToRoutingChanges({ "1": { _type: device.DEVICE_PATH } });

      var deviceObject = new Object();

      let deviceMachines = Object.entries(device.MACHINES);
      for (const machine of deviceMachines) {
        //console.log("ALERT 2")  // this is to assist in debugging

        let MACHINE_TYPE = machine[0];
        let MACHINE_PATH = machine[1];

        await sleep(1000);
        let sensorData = await readValueWrapper(device.DEVICE_PATH + MACHINE_PATH);

        if (MACHINE_TYPE == "TEMPERATURE" || MACHINE_TYPE == "RETURN_AIR" || MACHINE_TYPE == "SUPPLY_AIR") {
          sensorData = ((sensorData - 273.15) * 1.8 + 32).toFixed(2);  // temperature value is provided in kelvin form so we need to convert it to fahrenheit
        } else if (MACHINE_TYPE == "HUMIDITY") {
          sensorData = (sensorData * 100.00).toFixed(2);  // humidity value is provided in a unitless decimal form so we need to convert it to percentage
        } 
        else {
          if (sensorData != null) {
            sensorData = sensorData.toFixed(2);
          }
        }

        deviceObject[MACHINE_TYPE] = sensorData;

      }
      PR_events[device.DEVICE] = new Object(deviceObject);
      await insertIntoCollection("Sensors", PR_events);
      
    }
    
  }

  console.log(PR_events);

  console.log("\n********************\n");
  haloS.shutdown();
})

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