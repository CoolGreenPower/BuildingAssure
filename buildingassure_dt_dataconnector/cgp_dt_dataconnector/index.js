/*
About: JSON object request gets sent to our Azure Database, and then this Azure function takes the JSON object and
breaks it down grabbing the Disruptive Technologies event data. Afterwards, the event data will get sorted into their own
containers for the specific sensor device.
This data can be found in data explorer in "cgp-dt-db-server" Azure Cosmos DB account in "cgpdtdataconnector" Resource Group. Probably
won't need this in the future and can probably delete if it doesn't find any use.
This azure function is in the Function App "cgp-dt-dataconnector". Again, probably won't need this in the future and can probably delete if it
doesn't find any use.
Note: This azure function isn't actively running. The endpoint link in the Disruptive Technologies portal is pointed to the other azure function
contained in the "dataconnector_test" folder.
*/

const crypto = require('crypto')
const jwt = require('jsonwebtoken') // npm install jsonwebtoken@8.5.1

// Fetch environment variables.
const signatureSecret = process.env.DT_SIGNATURE_SECRET
const ChandlerDevCenter = process.env.DT_CHANDLER_DEV_CENTER_ID

function verifyRequest(body, token) {
    // Decode the token using signature secret.
    let decoded;
    try {
        decoded = jwt.verify(token, signatureSecret)
    } catch (err) {
        console.log(err)
        return false
    }

    // Verify the request body checksum.
    let shasum = crypto.createHash('sha1')
    let checksum = shasum.update(JSON.stringify(body)).digest('hex')
    if (checksum !== decoded.checksum) {
        console.log('Checksum Mismatch')
        return false
    }

    return true
}

module.exports = async function (context, req) {
    // Extract necessary request information.
    let body = req.body
    let token = req.headers['x-dt-signature']

    // Validate request origin and content integrity.
    if (verifyRequest(body, token) === false) {
        context.res = { status: 400, body: 'Bad request' }
        return
    }

    let projectId = body.metadata.projectId;
    let label = body.labels.name;
    if (projectId == ChandlerDevCenter) {
        if (label == "Front Door") {
            context.bindings.ChandlerDevCenterFrontDoor = JSON.stringify({
                eventId: body.event.eventId,
                targetName: body.event.targetName,
                eventType: body.event.eventType,
                data: body.event.data,
                timestamp: body.event.timestamp,
                metadata: body.metadata
            });
        } else if (label == "Master Bedroom Temp And Humidity") {
            context.bindings.ChandlerDevCenterMasterBedTempAndHumid = JSON.stringify({
                eventId: body.event.eventId,
                targetName: body.event.targetName,
                eventType: body.event.eventType,
                data: body.event.data,
                timestamp: body.event.timestamp,
                metadata: body.metadata
            });
        } else if (label == "Office Temp") {
            context.bindings.ChandlerDevCenterOfficeTemp = JSON.stringify({
                eventId: body.event.eventId,
                targetName: body.event.targetName,
                eventType: body.event.eventType,
                data: body.event.data,
                timestamp: body.event.timestamp,
                metadata: body.metadata
            });
        } else if (label == "Touch Sensor") {
            context.bindings.ChandlerDevCenterTouchSensor = JSON.stringify({
                eventId: body.event.eventId,
                targetName: body.event.targetName,
                eventType: body.event.eventType,
                data: body.event.data,
                timestamp: body.event.timestamp,
                metadata: body.metadata
            });
        } else if (label == "Water Sensor") {
            context.bindings.ChandlerDevCenterWaterSensor = JSON.stringify({
                eventId: body.event.eventId,
                targetName: body.event.targetName,
                eventType: body.event.eventType,
                data: body.event.data,
                timestamp: body.event.timestamp,
                metadata: body.metadata
            });
        }
    }

    context.res = { status: 200, body: 'OK' }
}