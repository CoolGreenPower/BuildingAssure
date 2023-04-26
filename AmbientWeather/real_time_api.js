require('dotenv').config()
const AmbientWeatherApi = require('./lib')

// helper function
function getName (device) {
  return device.info.name
}

const apiKey = process.env.AMBIENT_WEATHER_API_KEY || '5677346a1556406f9433d94530ee035272183df2c0e5446799d76b354a40d885'
const api = new AmbientWeatherApi({
  apiKey,
  applicationKey: process.env.AMBIENT_WEATHER_APPLICATION_KEY || '12602f5ebf8e417bad8e96ac4c89613a244ba25bbdc2400c805f3ad42630e474'
})

api.connect()
api.on('connect', () => console.log('Connected to Ambient Weather Realtime API!'))

api.on('subscribed', data => {
  console.log('Subscribed to ' + data.devices.length + ' device(s): ')
  console.log(data.devices.map(getName).join(', '))
})
api.on('data', data => {
  console.log(data.date + ' - ' + getName(data.device) + ' current outdoor temperature is: ' + data.tempf + '°F')
})
api.subscribe(apiKey)