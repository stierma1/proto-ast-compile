const { assert } = require('chai'); 
const { parse } = require("proto-parser");
const fs = require("fs");
const path = require("path");
const {compile} = require("../../index");
const parser  = require("proto-parser");

const protoDocument = JSON.parse(fs.readFileSync(path.join(__dirname, "../resources", "example1.json"), "utf-8"));
let document = compile(protoDocument);
let parseDocument = parser.parse(document);
assert.equal(JSON.stringify(parseDocument), JSON.stringify(protoDocument));

const protoFile = parser.parse(fs.readFileSync(path.join(__dirname, "../resources", "example2.proto"), "utf-8"));
fs.writeFileSync(path.join(__dirname, "../resources", "example2.json"), JSON.stringify(protoFile, null, 2));
const protoDocument2 = JSON.parse(fs.readFileSync(path.join(__dirname, "../resources", "example2.json"), "utf-8"));

let document2 = compile(protoDocument2);
let parseDocument2 = parser.parse(document2);
assert.equal(JSON.stringify(parseDocument2), JSON.stringify(protoDocument2));