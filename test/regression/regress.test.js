const { assert } = require('chai'); 
const { parse } = require("proto-parser");
const fs = require("fs");
const path = require("path");
const {compile} = require("../../index");
const document = JSON.parse(fs.readFileSync(path.join(__dirname, "../resources", "example1.json"), "utf-8"));

console.log(compile(document));





