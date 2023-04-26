require('dotenv').config();
var axios = require('axios');
const AmbientWeatherApi = require('./lib');

const api = new AmbientWeatherApi({
  apiKey: process.env.AMBIENT_WEATHER_API_KEY || '5677346a1556406f9433d94530ee035272183df2c0e5446799d76b354a40d885',
  applicationKey: process.env.AMBIENT_WEATHER_APPLICATION_KEY || '12602f5ebf8e417bad8e96ac4c89613a244ba25bbdc2400c805f3ad42630e474'
});

api.userDevices().then((devices) => {
    devices.forEach((device) => {
        // fetch the most recent data
        api.deviceData(device.macAddress)
        .then((deviceData) => {

          deviceData.forEach((data) => {
            var filteredData = new Object();

            filteredData.outdoorTemp = data.tempf;
            filteredData.humidity = data.humidity;
            filteredData.windspeed = data.windspeedmph;
            filteredData.dailyRainfall = data.dailyrainin;
            filteredData.uvIndex = data.uv;
            filteredData.solarRadiation = data.solarradiation;
            insertIntoCollection("Sensors", filteredData);

          });
        });
      });
});

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
