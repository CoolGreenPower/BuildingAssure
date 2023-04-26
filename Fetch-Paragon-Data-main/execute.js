//var sqltest = require("./sqltest.js");
var fetchParagonData = require("./fetchParagonData.js");

fetchParagonData.fetchParagonData()
setInterval(function () {
    console.log("\n@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@\n");
    fetchParagonData.fetchParagonData();
}, 60000);
