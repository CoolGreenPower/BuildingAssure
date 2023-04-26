/*
About: JSON object request gets sent to our Azure Database, and then this Azure function takes the JSON object and
breaks it down grabbing the Disruptive Technologies data and putting it into the separate tables for the specific sensors. The
schemas for the table relations has the structure: dateTime, event data(s), network status, and battery status. Network status happens
every 15 minutes and battery status happens every 24 hours. Sensor events can vary happening when it actively happens such as the
proximity sensor or every 15 minutes such as the humidity and temperature sensors. In addition, when an active event happens, the network
status event should happen also regardless of the 15 minutes. My plan is to have the data for the attributes be filled out in the table 
if the event occurs and NULL otherwise. 
Currently, it doesn't seem to be working properly because I think it is overwriting the rows instead of updating the specific attribute.
This data can be found in data explorer in "CGPdb (coolgreenpowerdbs/CGPdb)"" SQL database in "CGPParagonData" Resource Group. Probably need 
to relocate this Azure function
This azure function is in the Function App "cgpFunctionAppTest". Probably need to rename this.
*/

const crypto = require('crypto');
const jwt = require('jsonwebtoken'); // npm install jsonwebtoken@8.5.1

// Fetch environment variables.
const signatureSecret = process.env.DT_SIGNATURE_SECRET;
const ChandlerDevCenter = process.env.DT_CHANDLER_DEV_CENTER_ID;

function verifyRequest(body, token) {
    // Decode the token using signature secret.
    let decoded;
    try {
        decoded = jwt.verify(token, signatureSecret);
    } catch (err) {
        console.log(err);
        return false;
    }

    // Verify the request body checksum.
    let shasum = crypto.createHash('sha1');
    let checksum = shasum.update(JSON.stringify(body)).digest('hex');
    if (checksum !== decoded.checksum) {
        console.log('Checksum Mismatch');
        return false;
    }

    return true;
}

// grab latest rows for all tables to check new and old rows for potential "update" operation 
// alternative could be to maybe create SQL triggers

module.exports = async function (context, req, FrontDoorLatestRow, MasterBedTempAndHumidLatestRow, OfficeTempLatestRow, TouchSensorLatestRow, WaterSensorLatestRow, MasterBedCO2SensorLatestRow, MasterBedMotionDetectorLatestRow, OfficeMotionDetectorLatestRow) {
    context.log('JavaScript HTTP trigger and SQL output binding function processed a request.');
    context.log(req.body);

    // Extract necessary request information.
    let body = req.body;
    let token = req.headers['x-dt-signature'];

    // Validate request origin and content integrity.
    if (verifyRequest(body, token) === false) {
        context.res = { status: 400, body: 'Bad request' };
        return;
    }

    let projectId = body.metadata.projectId;
    let label = body.labels.name;
    let eventType = body.event.eventType;
    let dateTime = new Date(body.event.timestamp).toISOString();
    var newLog;

    // used for testing
    // when having the visual studio code azure extension, you can right click on the function app and click "Start Streaming Logs" to see in real time data
    console.log("Body: ", JSON.stringify(body, null, 2));
    console.log("Front Door: ", JSON.stringify(FrontDoorLatestRow, null, 2));
    console.log("Master Bed: ", JSON.stringify(MasterBedTempAndHumidLatestRow, null, 2));
    console.log("Office Temp: ", JSON.stringify(OfficeTempLatestRow, null, 2));
    console.log("Touch Sensor: ", JSON.stringify(TouchSensorLatestRow, null, 2));
    console.log("Water Sensor: ", JSON.stringify(WaterSensorLatestRow, null, 2));
    console.log("Master Bed CO2 Sensor: ", JSON.stringify(MasterBedCO2SensorLatestRow, null, 2));
    console.log("Mater Bed Motion Detector: ", JSON.stringify(MasterBedMotionDetectorLatestRow, null, 2));
    console.log("Office Motion Detector: ", JSON.stringify(OfficeMotionDetectorLatestRow, null, 2));
    
    // Go through a series of if statements to sort out the Disruptive Technologies data coming in
    if (projectId == ChandlerDevCenter) {
        if (label == "Front Door") {
            if (FrontDoorLatestRow.length != 0) {
                // Case 1: Table is not empty. Check if dateTime of new request is the same as latest row, if so do an "update" to table
                if (dateTime == FrontDoorLatestRow[0].dateTime + 'Z') {
                    if (eventType == "objectPresent") {
                        newLog = {
                            dateTime: dateTime,
                            objectPresent: body.event.data.objectPresent.state,
                            networkStatus: FrontDoorLatestRow[0].networkStatus, // same dateTime, instead of null, use existing networkStatus value
                            batteryStatus: FrontDoorLatestRow[0].batteryStatus  // same dateTime, instead of null, use existing batteryStatus value
                        }
                    } else if (eventType == "networkStatus") {
                        newLog = {
                            dateTime: dateTime,
                            objectPresent: FrontDoorLatestRow[0].objectPresent,
                            networkStatus: body.event.data.networkStatus.rssi,
                            batteryStatus: FrontDoorLatestRow[0].batteryStatus
                        }
                    } else if (eventType == "batteryStatus") {
                        newLog = {
                            dateTime: dateTime,
                            objectPresent: FrontDoorLatestRow[0].objectPresent,
                            networkStatus: FrontDoorLatestRow[0].networkStatus,
                            batteryStatus: body.event.data.batteryStatus.percentage
                        }
                    }
                } else { // Case 2: Table not empty, dateTime not matching, do new "insert" into table
                    if (eventType == "objectPresent") {
                        newLog = {
                            dateTime: dateTime,
                            objectPresent: body.event.data.objectPresent.state,
                            networkStatus: null,
                            batteryStatus: null
                        }
                    } else if (eventType == "networkStatus") {
                        newLog = {
                            dateTime: dateTime,
                            objectPresent: null,
                            networkStatus: body.event.data.networkStatus.rssi,
                            batteryStatus: null
                        }
                    } else if (eventType == "batteryStatus") {
                        newLog = {
                            dateTime: dateTime,
                            objectPresent: null,
                            networkStatus: null,
                            batteryStatus: body.event.data.batteryStatus.percentage
                        }
                    }
                }
            } else { // Case 3: Table is empty, do a new "insert" into table 
                if (eventType == "objectPresent") {
                    newLog = {
                        dateTime: dateTime,
                        objectPresent: body.event.data.objectPresent.state,
                        networkStatus: null,
                        batteryStatus: null
                    }
                } else if (eventType == "networkStatus") {
                    newLog = {
                        dateTime: dateTime,
                        objectPresent: null,
                        networkStatus: body.event.data.networkStatus.rssi,
                        batteryStatus: null
                    }
                } else if (eventType == "batteryStatus") {
                    newLog = {
                        dateTime: dateTime,
                        objectPresent: null,
                        networkStatus: null,
                        batteryStatus: body.event.data.batteryStatus.percentage
                    }
                }
            }

            context.bindings.ChandlerDevCenterFrontDoor = newLog; // connect log to correct table binding (check function.json file)
        } else if (label == "Master Bed Temp And Humid") {
            if (MasterBedTempAndHumidLatestRow.length != 0) {
                if (dateTime == MasterBedTempAndHumidLatestRow[0].dateTime + 'Z') {
                    if (eventType == "humidity") {
                        newLog = {
                            dateTime: dateTime,
                            relativeHumidity: body.event.data.humidity.relativeHumidity,
                            temperature: body.event.data.humidity.temperature,
                            networkStatus: MasterBedTempAndHumidLatestRow[0].networkStatus,
                            batteryStatus: MasterBedTempAndHumidLatestRow[0].batteryStatus
                        }
                    } else if (eventType == "networkStatus") {
                        newLog = {
                            dateTime: dateTime,
                            relativeHumidity: MasterBedTempAndHumidLatestRow[0].relativeHumidity,
                            temperature: MasterBedTempAndHumidLatestRow[0].temperature,
                            networkStatus: body.event.data.networkStatus.rssi,
                            batteryStatus: MasterBedTempAndHumidLatestRow[0].batteryStatus
                        }
                    } else if (eventType == "batteryStatus") {
                        newLog = {
                            dateTime: dateTime,
                            relativeHumidity: MasterBedTempAndHumidLatestRow[0].relativeHumidity,
                            temperature: MasterBedTempAndHumidLatestRow[0].temperature,
                            networkStatus: MasterBedTempAndHumidLatestRow[0].networkStatus,
                            batteryStatus: body.event.data.batteryStatus.percentage
                        }
                    }
                } else {
                    if (eventType == "humidity") {
                        newLog = {
                            dateTime: dateTime,
                            relativeHumidity: body.event.data.humidity.relativeHumidity,
                            temperature: body.event.data.humidity.temperature,
                            networkStatus: null,
                            batteryStatus: null
                        }
                    } else if (eventType == "networkStatus") {
                        newLog = {
                            dateTime: dateTime,
                            relativeHumidity: null,
                            temperature: null,
                            networkStatus: body.event.data.networkStatus.rssi,
                            batteryStatus: null
                        }
                    } else if (eventType == "batteryStatus") {
                        newLog = {
                            dateTime: dateTime,
                            relativeHumidity: null,
                            temperature: null,
                            networkStatus: null,
                            batteryStatus: body.event.data.batteryStatus.percentage
                        }
                    }
                }
            } else {
                if (eventType == "humidity") {
                    newLog = {
                        dateTime: dateTime,
                        relativeHumidity: body.event.data.humidity.relativeHumidity,
                        temperature: body.event.data.humidity.temperature,
                        networkStatus: null,
                        batteryStatus: null
                    }
                } else if (eventType == "networkStatus") {
                    newLog = {
                        dateTime: dateTime,
                        relativeHumidity: null,
                        temperature: null,
                        networkStatus: body.event.data.networkStatus.rssi,
                        batteryStatus: null
                    }
                } else if (eventType == "batteryStatus") {
                    newLog = {
                        dateTime: dateTime,
                        relativeHumidity: null,
                        temperature: null,
                        networkStatus: null,
                        batteryStatus: body.event.data.batteryStatus.percentage
                    }
                }
            }

            context.bindings.ChandlerDevCenterMasterBedTempAndHumid = newLog;
        } else if (label == "Office Temp") {
            if (OfficeTempLatestRow.length != 0) {
                if (dateTime == OfficeTempLatestRow[0].dateTime + 'Z') {
                    if (eventType == "temperature") {
                        newLog = {
                            dateTime: dateTime,
                            temperature: body.event.data.temperature.value,
                            networkStatus: OfficeTempLatestRow[0].networkStatus,
                            batteryStatus: OfficeTempLatestRow[0].batteryStatus
                        }
                    } else if (eventType == "networkStatus") {
                        newLog = {
                            dateTime: dateTime,
                            temperature: OfficeTempLatestRow[0].temperature,
                            networkStatus: body.event.data.networkStatus.rssi,
                            batteryStatus: OfficeTempLatestRow[0].batteryStatus
                        }
                    } else if (eventType == "batteryStatus") {
                        newLog = {
                            dateTime: dateTime,
                            temperature: OfficeTempLatestRow[0].temperature,
                            networkStatus: OfficeTempLatestRow[0].networkStatus,
                            batteryStatus: body.event.data.batteryStatus.percentage
                        }
                    }
                } else {
                    if (eventType == "temperature") {
                        newLog = {
                            dateTime: dateTime,
                            temperature: body.event.data.temperature.value,
                            networkStatus: null,
                            batteryStatus: null
                        }
                    } else if (eventType == "networkStatus") {
                        newLog = {
                            dateTime: dateTime,
                            temperature: null,
                            networkStatus: body.event.data.networkStatus.rssi,
                            batteryStatus: null
                        }
                    } else if (eventType == "batteryStatus") {
                        newLog = {
                            dateTime: dateTime,
                            temperature: null,
                            networkStatus: null,
                            batteryStatus: body.event.data.batteryStatus.percentage
                        }
                    }
                }
            } else {
                if (eventType == "temperature") {
                    newLog = {
                        dateTime: dateTime,
                        temperature: body.event.data.temperature.value,
                        networkStatus: null,
                        batteryStatus: null
                    }
                } else if (eventType == "networkStatus") {
                    newLog = {
                        dateTime: dateTime,
                        temperature: null,
                        networkStatus: body.event.data.networkStatus.rssi,
                        batteryStatus: null
                    }
                } else if (eventType == "batteryStatus") {
                    newLog = {
                        dateTime: dateTime,
                        temperature: null,
                        networkStatus: null,
                        batteryStatus: body.event.data.batteryStatus.percentage
                    }
                }
            }

            context.bindings.ChandlerDevCenterOfficeTemp = newLog;
        } else if (label == "Touch Sensor") {
            if (TouchSensorLatestRow.length != 0) {
                if (dateTime == TouchSensorLatestRow[0].dateTime + 'Z') {
                    if (eventType == "touch") {
                        newLog = {
                            dateTime: dateTime,
                            touch: "TOUCH",
                            networkStatus: TouchSensorLatestRow[0].networkStatus,
                            batteryStatus: TouchSensorLatestRow[0].batteryStatus
                        }
                    } else if (eventType == "networkStatus") {
                        newLog = {
                            dateTime: dateTime,
                            touch: TouchSensorLatestRow[0].touch,
                            networkStatus: body.event.data.networkStatus.rssi,
                            batteryStatus: TouchSensorLatestRow[0].batteryStatus
                        }
                    } else if (eventType == "batteryStatus") {
                        newLog = {
                            dateTime: dateTime,
                            touch: TouchSensorLatestRow[0].touch,
                            networkStatus: TouchSensorLatestRow[0].networkStatus,
                            batteryStatus: body.event.data.batteryStatus.percentage
                        }
                    }
                } else {
                    if (eventType == "touch") {
                        newLog = {
                            dateTime: dateTime,
                            touch: "TOUCH",
                            networkStatus: null,
                            batteryStatus: null
                        }
                    } else if (eventType == "networkStatus") {
                        newLog = {
                            dateTime: dateTime,
                            touch: null,
                            networkStatus: body.event.data.networkStatus.rssi,
                            batteryStatus: null
                        }
                    } else if (eventType == "batteryStatus") {
                        newLog = {
                            dateTime: dateTime,
                            touch: null,
                            networkStatus: null,
                            batteryStatus: body.event.data.batteryStatus.percentage
                        }
                    }
                }
            } else {
                if (eventType == "touch") {
                    newLog = {
                        dateTime: dateTime,
                        touch: "TOUCH",
                        networkStatus: null,
                        batteryStatus: null
                    }
                } else if (eventType == "networkStatus") {
                    newLog = {
                        dateTime: dateTime,
                        touch: null,
                        networkStatus: body.event.data.networkStatus.rssi,
                        batteryStatus: null
                    }
                } else if (eventType == "batteryStatus") {
                    newLog = {
                        dateTime: dateTime,
                        touch: null,
                        networkStatus: null,
                        batteryStatus: body.event.data.batteryStatus.percentage
                    }
                }
            }

            context.bindings.ChandlerDevCenterTouchSensor = newLog;
        } else if (label == "Water Sensor") {
            if (WaterSensorLatestRow.length != 0) {
                if (dateTime == WaterSensorLatestRow[0].dateTime + 'Z') {
                    if (eventType == "waterPresent") {
                        newLog = {
                            dateTime: dateTime,
                            waterPresent: body.event.data.waterPresent.state,
                            networkStatus: WaterSensorLatestRow[0].networkStatus,
                            batteryStatus: WaterSensorLatestRow[0].batteryStatus
                        }
                    } else if (eventType == "networkStatus") {
                        newLog = {
                            dateTime: dateTime,
                            waterPresent: WaterSensorLatestRow[0].waterPresent,
                            networkStatus: body.event.data.networkStatus.rssi,
                            batteryStatus: WaterSensorLatestRow[0].batteryStatus
                        }
                    } else if (eventType == "batteryStatus") {
                        newLog = {
                            dateTime: dateTime,
                            waterPresent: WaterSensorLatestRow[0].waterPresent,
                            networkStatus: WaterSensorLatestRow[0].networkStatus,
                            batteryStatus: body.event.data.batteryStatus.percentage
                        }
                    }
                } else {
                    if (eventType == "waterPresent") {
                        newLog = {
                            dateTime: dateTime,
                            waterPresent: body.event.data.waterPresent.state,
                            networkStatus: null,
                            batteryStatus: null
                        }
                    } else if (eventType == "networkStatus") {
                        newLog = {
                            dateTime: dateTime,
                            waterPresent: null,
                            networkStatus: body.event.data.networkStatus.rssi,
                            batteryStatus: null
                        }
                    } else if (eventType == "batteryStatus") {
                        newLog = {
                            dateTime: dateTime,
                            waterPresent: null,
                            networkStatus: null,
                            batteryStatus: body.event.data.batteryStatus.percentage
                        }
                    }
                }
            } else {
                if (eventType == "waterPresent") {
                    newLog = {
                        dateTime: dateTime,
                        waterPresent: body.event.data.waterPresent.state,
                        networkStatus: null,
                        batteryStatus: null
                    }
                } else if (eventType == "networkStatus") {
                    newLog = {
                        dateTime: dateTime,
                        waterPresent: null,
                        networkStatus: body.event.data.networkStatus.rssi,
                        batteryStatus: null
                    }
                } else if (eventType == "batteryStatus") {
                    newLog = {
                        dateTime: dateTime,
                        waterPresent: null,
                        networkStatus: null,
                        batteryStatus: body.event.data.batteryStatus.percentage
                    }
                }
            }

            context.bindings.ChandlerDevCenterWaterSensor = newLog;
        } 
        else if (label == "Master Bed CO2 Sensor") {
            if (MasterBedCO2SensorLatestRow.length != 0) {
                if (dateTime == MasterBedCO2SensorLatestRow[0].dateTime + 'Z') {
                    if (eventType == "CO2Amount") {
                        newLog = {
                            dateTime: dateTime,
                            CO2Amount: body.event.data.CO2Amount.state,
                            networkStatus: MasterBedCO2SensorLatestRow[0].networkStatus,
                            batteryStatus: MasterBedCO2SensorLatestRow[0].batteryStatus
                        }
                    } else if (eventType == "networkStatus") {
                        newLog = {
                            dateTime: dateTime,
                            CO2Amount: MasterBedCO2SensorLatestRow[0].CO2Amount,
                            networkStatus: body.event.data.networkStatus.rssi,
                            batteryStatus: MasterBedCO2SensorLatestRow[0].batteryStatus
                        }
                    } else if (eventType == "batteryStatus") {
                        newLog = {
                            dateTime: dateTime,
                            CO2Amount: MasterBedCO2SensorLatestRow[0].CO2Amount,
                            networkStatus: MasterBedCO2SensorLatestRow[0].networkStatus,
                            batteryStatus: body.event.data.batteryStatus.percentage
                        }
                    }
                } else {
                    if (eventType == "CO2Amount") {
                        newLog = {
                            dateTime: dateTime,
                            CO2Amount: body.event.data.CO2Amount.state,
                            networkStatus: null,
                            batteryStatus: null
                        }
                    } else if (eventType == "networkStatus") {
                        newLog = {
                            dateTime: dateTime,
                            CO2Amount: null,
                            networkStatus: body.event.data.networkStatus.rssi,
                            batteryStatus: null
                        }
                    } else if (eventType == "batteryStatus") {
                        newLog = {
                            dateTime: dateTime,
                            CO2Amount: null,
                            networkStatus: null,
                            batteryStatus: body.event.data.batteryStatus.percentage
                        }
                    }
                }
            } else {
                if (eventType == "CO2Amount") {
                    newLog = {
                        dateTime: dateTime,
                        CO2Amount: body.event.data.CO2Amount.state,
                        networkStatus: null,
                        batteryStatus: null
                    }
                } else if (eventType == "networkStatus") {
                    newLog = {
                        dateTime: dateTime,
                        CO2Amount: null,
                        networkStatus: body.event.data.networkStatus.rssi,
                        batteryStatus: null
                    }
                } else if (eventType == "batteryStatus") {
                    newLog = {
                        dateTime: dateTime,
                        CO2Amount: null,
                        networkStatus: null,
                        batteryStatus: body.event.data.batteryStatus.percentage
                    }
                }
            }

            context.bindings.ChandlerDevCenterMasterBedCO2Sensor = newLog;
        }
        else if (label == "Master Bed Motion Detector") {
            if (MasterBedMotionDetectorLatestRow.length != 0) {
                if (dateTime == MasterBedMotionDetectorLatestRow[0].dateTime + 'Z') {
                    if (eventType == "motionDetected") {
                        newLog = {
                            dateTime: dateTime,
                            motionDetected: body.event.data.motionDetected.state,
                            networkStatus: MasterBedMotionDetectorLatestRow[0].networkStatus,
                            batteryStatus: MasterBedMotionDetectorLatestRow[0].batteryStatus
                        }
                    } else if (eventType == "networkStatus") {
                        newLog = {
                            dateTime: dateTime,
                            motionDetected: MasterBedMotionDetectorLatestRow[0].CO2Amount,
                            networkStatus: body.event.data.networkStatus.rssi,
                            batteryStatus: MasterBedMotionDetectorLatestRow[0].batteryStatus
                        }
                    } else if (eventType == "batteryStatus") {
                        newLog = {
                            dateTime: dateTime,
                            motionDetected: MasterBedMotionDetectorLatestRow[0].CO2Amount,
                            networkStatus: MasterBedMotionDetectorLatestRow[0].networkStatus,
                            batteryStatus: body.event.data.batteryStatus.percentage
                        }
                    }
                } else {
                    if (eventType == "motionDetected") {
                        newLog = {
                            dateTime: dateTime,
                            motionDetected: body.event.data.CO2Amount.state,
                            networkStatus: null,
                            batteryStatus: null
                        }
                    } else if (eventType == "networkStatus") {
                        newLog = {
                            dateTime: dateTime,
                            motionDetected: null,
                            networkStatus: body.event.data.networkStatus.rssi,
                            batteryStatus: null
                        }
                    } else if (eventType == "batteryStatus") {
                        newLog = {
                            dateTime: dateTime,
                            motionDetected: null,
                            networkStatus: null,
                            batteryStatus: body.event.data.batteryStatus.percentage
                        }
                    }
                }
            } else {
                if (eventType == "motionDetected") {
                    newLog = {
                        dateTime: dateTime,
                        motionDetected: body.event.data.motionDetected.state,
                        networkStatus: null,
                        batteryStatus: null
                    }
                } else if (eventType == "networkStatus") {
                    newLog = {
                        dateTime: dateTime,
                        motionDetected: null,
                        networkStatus: body.event.data.networkStatus.rssi,
                        batteryStatus: null
                    }
                } else if (eventType == "batteryStatus") {
                    newLog = {
                        dateTime: dateTime,
                        motionDetected: null,
                        networkStatus: null,
                        batteryStatus: body.event.data.batteryStatus.percentage
                    }
                }
            }

            context.bindings.ChandlerDevCenterMasterBedMotionDetector = newLog;
        }
        else if (label == "Office Motion Detector") {
            if (OfficeMotionDetectorLatestRow.length != 0) {
                if (dateTime == OfficeMotionDetectorLatestRow[0].dateTime + 'Z') {
                    if (eventType == "motionDetected") {
                        newLog = {
                            dateTime: dateTime,
                            motionDetected: body.event.data.motionDetected.state,
                            networkStatus: OfficeMotionDetectorLatestRow[0].networkStatus,
                            batteryStatus: OfficeMotionDetectorLatestRow[0].batteryStatus
                        }
                    } else if (eventType == "networkStatus") {
                        newLog = {
                            dateTime: dateTime,
                            motionDetected: OfficeMotionDetectorLatestRow[0].CO2Amount,
                            networkStatus: body.event.data.networkStatus.rssi,
                            batteryStatus: OfficeMotionDetectorLatestRow[0].batteryStatus
                        }
                    } else if (eventType == "batteryStatus") {
                        newLog = {
                            dateTime: dateTime,
                            motionDetected: OfficeMotionDetectorLatestRow[0].CO2Amount,
                            networkStatus: OfficeMotionDetectorLatestRow[0].networkStatus,
                            batteryStatus: body.event.data.batteryStatus.percentage
                        }
                    }
                } else {
                    if (eventType == "motionDetected") {
                        newLog = {
                            dateTime: dateTime,
                            motionDetected: body.event.data.CO2Amount.state,
                            networkStatus: null,
                            batteryStatus: null
                        }
                    } else if (eventType == "networkStatus") {
                        newLog = {
                            dateTime: dateTime,
                            motionDetected: null,
                            networkStatus: body.event.data.networkStatus.rssi,
                            batteryStatus: null
                        }
                    } else if (eventType == "batteryStatus") {
                        newLog = {
                            dateTime: dateTime,
                            motionDetected: null,
                            networkStatus: null,
                            batteryStatus: body.event.data.batteryStatus.percentage
                        }
                    }
                }
            } else {
                if (eventType == "motionDetected") {
                    newLog = {
                        dateTime: dateTime,
                        motionDetected: body.event.data.motionDetected.state,
                        networkStatus: null,
                        batteryStatus: null
                    }
                } else if (eventType == "networkStatus") {
                    newLog = {
                        dateTime: dateTime,
                        motionDetected: null,
                        networkStatus: body.event.data.networkStatus.rssi,
                        batteryStatus: null
                    }
                } else if (eventType == "batteryStatus") {
                    newLog = {
                        dateTime: dateTime,
                        motionDetected: null,
                        networkStatus: null,
                        batteryStatus: body.event.data.batteryStatus.percentage
                    }
                }
            }

            context.bindings.ChandlerDevCenterOfficeMotionDetector = newLog;
        }
    }

    context.res = { status: 200, body: 'OK' };
}