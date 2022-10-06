const express = require("express");
require("dotenv").config();
const app = express();
const mysql = require("mysql");
const port = 3000;

const fs = require("fs");

app.use(express.json());

//connection to DB
var con = mysql.createConnection({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  port: 3306,
  ssl: { ca: fs.readFileSync("./DigiCertGlobalRootCA.crt.pem") },
});

con.connect(function (err) {
  if (err) throw err;
  console.log("Connected");
});

//set up home route
app.get("/", async (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

//manufacturer
//get all manufacturers
app.get("/getAllManufacturers", async (req, res) => {
  con.query(
    "SELECT * FROM pard.dvc_pard_organisation",
    function (err, result, fields) {
      if (err) throw err;

      res.send(result);
      console.log("Got all manus");
    }
  );
});

//get searched man
app.get("/searchManufacturersByName/:searchTerm", (req, res) => {
  let searchTerm = req.params.searchTerm;

  const SELECT_SEARCHED_ORGS =
    "SELECT * FROM pard.dvc_pard_organisation WHERE pard.dvc_pard_organisation.MAN_ORGANISATION_NAME LIKE ? ORDER BY MAN_ORGANISATION_NAME ASC;";
  const values = [["%" + searchTerm + "%"]];

  con.query(SELECT_SEARCHED_ORGS, values, function (err, result, fields) {
    if (err) throw err;

    res.send(result);
    console.log("Got searched manus for " + searchTerm);
  });
});

app.get("/searchManufacturersById/:searchTerm", (req, res) => {
  let searchTerm = req.params.searchTerm;

  const SELECT_SEARCHED_ORGS =
    "SELECT * FROM pard.dvc_pard_organisation WHERE pard.dvc_pard_organisation.MAN_ORGANISATION_ID = ?;";
  const values = [[searchTerm]];

  con.query(SELECT_SEARCHED_ORGS, values, function (err, result, fields) {
    if (err) throw err;

    res.send(result);
    console.log("Got searched manus for " + searchTerm);
  });
});

//get searched devices by id
app.get("/searchDevicesByManufacturer/:searchTerm", (req, res) => {
  let searchTerm = req.params.searchTerm;
  const SELECT_DEVICES_BY_ORG =
    "SELECT * FROM pard.dvc_pard_device where pard.dvc_pard_device.MAN_ORGANISATION_ID = ?";
  const values = [[searchTerm]];

  con.query(SELECT_DEVICES_BY_ORG, values, function (err, result, fields) {
    if (err) throw err;

    res.send(result);
    console.log("Got devices by manufacturer for " + searchTerm);
  });
});

//devices
//get all devices
app.get("/getAllDevices", (req, res) => {
  con.query(
    "SELECT * FROM pard.dvc_pard_device",
    function (err, result, fields) {
      if (err) throw err;

      res.send(result);
      console.log("Got all devices");
    }
  );
});

//get manufacturers by the name of device
app.get("/searchManufacturersByDevice/:searchTerm", (req, res) => {
  let searchTerm = req.params.searchTerm;

  const SELECT_ALL_ORGS_BY_DEVICE_NAME =
    "SELECT * FROM pard.dvc_pard_organisation where MAN_ORGANISATION_ID in (SELECT MAN_ORGANISATION_ID FROM pard.dvc_pard_device where GMDN_TERM_NAME = ?)";
  const values = [[searchTerm]];

  con.query(
    SELECT_ALL_ORGS_BY_DEVICE_NAME,
    values,
    function (err, result, fields) {
      if (err) throw err;

      res.send(result);
      console.log("Got searched organisations for " + searchTerm);
    }
  );
});

//get searched devices
app.get("/searchDevicesByName/:searchTerm", (req, res) => {
  let searchTerm = req.params.searchTerm;

  const SELECT_SEARCHED_DEVS =
    "SELECT * from pard.dvc_pard_device WHERE pard.dvc_pard_device.GMDN_TERM_NAME LIKE ? group by GMDN_TERM_NAME ORDER BY GMDN_TERM_NAME ASC";
  const values = [["%" + searchTerm + "%"]];

  con.query(SELECT_SEARCHED_DEVS, values, function (err, result, fields) {
    if (err) throw err;

    res.send(result);
    console.log("Got searched devices for " + searchTerm);
  });
});

//get advanced search devices
app.post("/searchDevicesAdvanced", (req, res) => {
  let searchTerm = req.body.searchTerm;

  const SELECT_SEARCHED_DEVS =
    " SELECT * FROM pard.dvc_pard_device where pard.dvc_pard_device.MAN_ORGANISATION_ID in (SELECT MAN_ORGANISATION_ID FROM pard.dvc_pard_organisation WHERE pard.dvc_pard_organisation.MAN_ORGANISATION_NAME LIKE ? AND pard.dvc_pard_organisation.MAN_ORGANISATION_ID Like ?) AND pard.dvc_pard_device.GMDN_TERM_NAME LIKE ? AND pard.dvc_pard_device.DEVICE_SUB_TYPE_DESC LIKE ? group by GMDN_TERM_NAME ORDER BY GMDN_TERM_NAME ASC";

  const values = [
    ["%" + searchTerm.manufacturerName + "%"],
    ["%" + searchTerm.referenceNumber + "%"],
    ["%" + searchTerm.deviceName + "%"],
    ["%" + searchTerm.deviceType + ""],
  ];

  con.query(SELECT_SEARCHED_DEVS, values, function (err, result, fields) {
    if (err) throw err;

    res.send(result);
    console.log("Got searched devices for " + searchTerm);
  });
});

app.listen(port, () => {
  console.log(
    `Success! Your application is running on http://localhost:${port}.`
  );
});
