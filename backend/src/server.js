"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var bodyParser = require("body-parser");
require("dotenv/config");
var cors = require("cors");
var path = require("path");
var db = require("./model");
var routes = require("./routes");
var { startCleanupJob } = require("./jobs/cleanupTempFiles");
var app = express();
var PORT = process.env.PORT || 8080;
var DB_URL = process.env.DB_HOST ||
    "mongodb+srv://divyansh0908:rxAxc38ppfBBNzrh@sandbox.vwhnx.mongodb.net/?retryWrites=true&w=majority&appName=Sandbox";
// Serve uploads folder publicly
app.use("/uploads", express.static(path.join(path.dirname(""), "tmp")));
db.mongoose
    .connect(DB_URL, {
    dbName: "wealth-map-challenge",
    useBigInt64: true,
})
    .then(function () {
    console.log("Connected to the database!");
    // initial();
})
    .catch(function (err) {
    console.log("Cannot connect to the database!", err);
    process.exit();
});
app.get("/ping", function (req, res) {
    res.json({ greeting: "Server Is In Good Health!" });
});
var server = app.listen(PORT, function () {
    console.log("\uD83D\uDE80 server started at http://localhost:".concat(PORT));
    // Start scheduled cleanup job for temp files
    startCleanupJob();
});

// Set timeout to 10 minutes for long-running operations like video processing
server.timeout = 600000; // 10 minutes in milliseconds
server.keepAliveTimeout = 610000; // Slightly higher than timeout
// const Role = db.Role;
app.use(bodyParser.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use("/", routes);
// app.use((req, res) => {
// res.writeHead(200, { "Content-Type": "text/plain" });
// res.end("../frontend/dist/index.html");
// /**
//  * Check if all the Roles in `Roles` object are present in the database, if not then add them
//  * @returns void
//  * @async
//  * @writtenBY: Divyansh Anand
//  * @lastModifiedBy: Divyansh Anand
//  */
// async function initial() {
// 	const allRoles = Object.keys(Roles);
// 	const roles = await Role.find();
// 	// check if all items inside allRoles is present as ids of roles, and which are not present add them to missingRoles
// 	const missingRoles = allRoles.filter(
// 		(role) => !roles.find((r) => r.id === role)
// 	);
// 	console.log("Missing Roles: ", missingRoles);
// 	Role.insertMany(
// 		missingRoles.map((role) => {
// 			return {
// 				name: role,
// 				id: role,
// 			};
// 		})
// 	).then(() => {
// 		console.log("Roles added successfully");
// 	});
// }
