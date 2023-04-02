# proto-ast-compile
Compiles the ProtoDocument AST back into a proto doc.

## Usage
```
const {compile} = require("proto-ast-compile");

const compiled = compile(protoDocument);

console.log(compiled);
```

Currently only supports proto3 syntax

## Known Restrictions
No public imports - currently missing from proto-parser
No reserved enums - currently missing from proto-parser

