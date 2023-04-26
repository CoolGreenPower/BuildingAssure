require('dotenv').config()
const AmbientWeatherApi = require('./lib')

const api = new AmbientWeatherApi({
  apiKey: process.env.AMBIENT_WEATHER_API_KEY || '5677346a1556406f9433d94530ee035272183df2c0e5446799d76b354a40d885',
  applicationKey: process.env.AMBIENT_WEATHER_APPLICATION_KEY || '12602f5ebf8e417bad8e96ac4c89613a244ba25bbdc2400c805f3ad42630e474'
})

// list the user's devices
api.userDevices()
.then((devices) => {

  devices.forEach((device) => {
    // fetch the most recent data
    api.deviceData(device.macAddress, {
      limit: 5
    })
    .then((deviceData) => {
      console.log('The 5 most recent temperature reports for ' + device.info.name + ' - ' + device.info.location + ':')
      deviceData.forEach((data) => {
        console.log(data.date + ' - ' + data.tempf + '°F')
      })
      console.log('---')
    })
  })
})