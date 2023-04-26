/*
About: This is a file to grab historical data from one single sensor from one device given a time period.
*/

var haloS = require("./haloS.js");

var sleep = function (ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// adjust starting time to be closer to today's date so the program can run faster and testing can be quicker
const startTime = new Date("Mon Dec 12 2022 00:00:00 GMT-0500 (Eastern Daylight Time)");
const endTime = new Date();
console.log("Start Time:");
console.log("    ", startTime);
console.log("End Time:");
console.log("    ", endTime);

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

haloS.connectToHaloCloud(options, async function (isConnected) {
  console.log("Is Connected: " + isConnected);

  // tell the server that you want to talk to this device. This can be an object list of devices
  // this device path is for the Chandler AZ Office Gateway Device
  const DEVICE_PATH = "/company/paragonrobotics.com/device/transform/22212/1/188"
  haloS.subscribeToRoutingChanges({ "1": { _type: DEVICE_PATH } });

  // "/machine/2" is for the temperature sensor in the Chandler AZ Office Gateway Device
  await sleep(1000);
  haloS.readRecordedData(DEVICE_PATH + "/machine/2", startTime, endTime, function (data, err) {
    if (err) {
      console.log("There was an error.");
    }

    let xData = data.xData;
    let yData = data.yData;

    xData = xData.map(time => new Date(time));
    yData = yData.map(val => (convertKelvinToFahrenheit(val[0])));

    console.log("CHANDLER AZ OFFICE GATEWAY DEVICE - TEMPERATURE SENSOR - xData", xData)
    console.log("CHANDLER AZ OFFICE GATEWAY DEVICE - TEMPERATURE SENSOR - yData", yData)
  });


  // "/machine/3" is for the humidity sensor in the Chandler AZ Office Gateway Device
  await sleep(1000);
  haloS.readRecordedData(DEVICE_PATH + "/machine/3", startTime, endTime, function (data, err) {
    if (err) {
      console.log("There was an error.");
    }
 
    let xData = data.xData;
    let yData = data.yData
 
    xData = xData.map(time => new Date(time));
    yData = yData.map(val => (convertHumidity(val[0])));
 
    console.log("CHANDLER AZ OFFICE GATEWAY DEVICE - HUMIDITY SENSOR - xData", xData)
    console.log("CHANDLER AZ OFFICE GATEWAY DEVICE - HUMIDITY SENSOR - yData", yData)
  });
  
});


// temperature value is provided in kelvin form so we need to convert it to fahrenheit
function convertKelvinToFahrenheit(tempValue) {
  var convertedTempValue = ((tempValue - 273.15) * 1.8 + 32).toFixed(2);
  return convertedTempValue;
}

// humidity value is provided in a unitless decimal form so we need to convert it to percentage
function convertHumidity(humidityValue) {
  var convertedHumidityValue = (humidityValue * 100).toFixed(2);
  return convertedHumidityValue;
}