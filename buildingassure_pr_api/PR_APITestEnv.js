/*
About: This is a file to test the Paragon Robotics API.
*/

const haloS = require("./haloS.js");

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
};

haloS.connectToHaloCloud(options, async function (isConnected) {
    if (isConnected) {
        console.log("Connection successful!");
    }

    const DEVICE_PATH = "/company/paragonrobotics.com/sales/internal/system/name/coolgreenpower.com";
    haloS.subscribeToRoutingChanges({ "1": { _type: DEVICE_PATH } });

    await sleep(1000);
    haloS.getDeviceList(function(devices) {
        console.log(JSON.stringify(devices, null, 2));
    });
})