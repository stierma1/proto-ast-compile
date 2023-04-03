# proto-ast-compile
Compiles the ProtoDocument AST back into a proto doc.

## Usage
```
const {compile} = require("proto-ast-compile");
const parser = require("proto-parser");

const protoDocument = parser.parse(protoString);

//...do some edits on protoDocument

const compiledProtoString = compile(protoDocument);

fs.writeFileSync("my-file.proto", compiledProtoString);
```

Currently only supports proto3 syntax


## Known Restrictions
1. No public imports - currently missing from proto-parser
2. No reserved enums - currently missing from proto-parser

