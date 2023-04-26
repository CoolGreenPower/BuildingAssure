var haloS = require("./haloS.js");

    var options = {
        securityDomain: "/company/paragonrobotics.com/sales/internal/system/name/coolgreenpower.com"
    };

	// random timer for now so this does not execute forever. Also better to use a cron job to run this script
	// on a timer
	var start = Date.now();
	var reading = false;

    haloS.initialize(options);

// function fetchData(){

    var sleep = function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    };

    console.log("connecting to target");
    var options = {
        type: "wss",
        transportIsAuthorizedAndSecure: true,
        address: "ws.hc.paragonrobotics.com",
        username: "ichidrawar@coolgreenpower.com",
        password: "Isha@2021",
        closeCallback: function(){
            console.log("connection closed!");
        }
    };

    // set start time to begin reading data from
    const startTime = new Date("MAY 26 2022");
    // console.log("s", startTime)
    // end time is now
    const endTime = new Date();
    // const time1 = new Date();

    const DEVICE_PATH_1 = "/company/paragonrobotics.com/device/transform/22212/1/188"
    const DEVICE_PATH_2 = "/company/paragonrobotics.com/device/transform/20102/1/316"

    haloS.connectToHaloCloud(options, async function (isConnected) {

        console.log("isConnected: " + isConnected);

        // tell the server that you want to talk to this device. This can be an object list of devices
        haloS["subscribeToRoutingChanges"]({"1": {_type: DEVICE_PATH_1}, "2": {_type: DEVICE_PATH_2}});

        await sleep(1000);
        var readData = function(){
		reading = true;
        haloS["readRecordedData"]( DEVICE_PATH_1+ "/machine/2", startTime, endTime, function (data, err) {

            let xData1 = data.xData
            xData1 = xData1.map(time => (new Date(time)))

            let yData1 = data.yData
            yData1 = yData1.map(val => val[0] - 273.15)
            
            console.log("xData1", xData1)
            console.log("yData1", yData1)
            console.log(err);

            // add the value you on as trying to read the current temperature value. 
            haloS["readValue"](DEVICE_PATH_1 + "/machine/2/value", (val, err1) => {
                console.log("val", val);
                console.log("err1", err1);
                // haloS.shutdown();
                // haloS["stopRecorder"](DEVICE_PATH_1+ "/machine/2", function (data, err));
				haloS["readRecordedData"]( DEVICE_PATH_2+ "/machine/12", startTime, endTime, function (data, err) {

					let xData2 = data.xData
					xData2 = xData2.map(time => (new Date(time)))
			
					let yData2 = data.yData
					yData2 = yData2.map(val => val[0] - 273.15)
					
					console.log("xData2", xData2)    
					console.log("yData2", yData2)
					console.log(err);
			
					// add the value you on as trying to read the current temperature value. 
					haloS["readValue"](DEVICE_PATH_2 + "/machine/12/value", (val, err1) => {
						console.log("val", val);
						console.log("err1", err1);

                        haloS["readRecordedData"](DEVICE_PATH_1 + "/machine/3", startTime, endTime, function (data, err) {

                            let xData3 = data.xData
                            xData3 = xData3.map(time => (new Date(time)))
                
                            let yData3 = data.yData
                            yData3= yData3.map(val => val[0] - 273.15)
                            
                            console.log("xData3", xData3)
                            console.log("yData3", yData3)
                            console.log(err);
                
                            // add the value you on as trying to read the current temperature value. 
                            haloS["readValue"](DEVICE_PATH_1 + "/machine/3/value", (val, err1) => {
                                console.log("val", val);
                                console.log("err1", err1);
                                // haloS.shutdown();
                                // shutdown after 25 seconds
                                reading = false;
                                if (Date.now() - start > 1000*25){
                                    haloS.shutdown();
                                    process.exit();
                                }
                            });
                        });
					});
			
				});
            });
        });
		}
		readData();
		setInterval(function(){
			if (!reading){
				readData();
			}
		}, 5000);
    });

    // haloS["stopRecorder"](DEVICE_PATH_1+ "/machine/2", null, function (data, err) {
    //     if (success) {
    //         console.log("Recording was successfully stopped."); 
    //     } 
    
    //     else { 
    //         console.log("An error occurred while stopping the recording."); 
    //     } 
    // });

    // haloS["stopRecorder"](DEVICE_PATH_2+ "/machine/12", null, function (data, err){
    //     if (success) {
    //         console.log("Recording was successfully stopped."); 
    //     } 
    
    //     else { 
    //         console.log("An error occurred while stopping the recording."); 
    //     }
    // });

// }

// initialize();

// setInterval(fetchData, 5000); 