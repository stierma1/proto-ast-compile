let parser = require("proto-parser");

function unsafeCompile(protoDocument){
    let builderTokens = [];
    if(protoDocument.syntaxType !== "ProtoDocument"){
        throw new Error("Only Supports ProtoDocument: found " + protoDocument.syntaxType);
    }
    if(protoDocument.syntax !== "proto3"){
        throw new Error("Only proto3 syntax is supported: found " + protoDocument.syntax);
    }
    builderTokens.push(_buildSyntax(protoDocument.syntax));
    if(protoDocument.imports){
        builderTokens.push(_buildImport(protoDocument.imports));
    }
    builderTokens.push(_buildRoot(protoDocument.root));

    return builderTokens.join("\n");
}

function _buildRoot(node){
    let builderTokens = []
    if(node.syntaxType !== "ProtoRoot"){
        throw new Error("Expected ProtoRoot: found " + node.syntaxType);
    }

    let namespace;
    let subNode;
    let options;
    for(let name in node.nested){
        let namespaceObj = _extractNamespace(node.nested[name]);
        namespace = namespaceObj.name;
        subNode = namespaceObj.node ? namespaceObj.node : node;
        options = namespaceObj.options;
    }
    if(namespace){
        builderTokens.push(_buildPackage(namespace));
    }

    if(options){
        builderTokens.push(_buildOptions(options, 0));
    }
    if(node.options){
        builderTokens.push(_buildOptions(node.options, 0));
    }
    for(let name in subNode.nested){
        builderTokens.push(_buildNode(subNode.nested[name], 0));
    }

    return [builderTokens.join("\n")];
}

function _extractNamespace(node){
    if(node.syntaxType === "NamespaceDefinition"){
        let name = node.name;
        for(let subName in node.nested){
            let subNames = _extractNamespace(node.nested[subName]);
            if(subNames.name){
                return {name: name + "." + subNames.name, node:subNames.node, options: subNames.options};
            }
            return {name, node, options:node.options};
        }
    }

    return {name:null, node:null, options:node.options};
}

function _buildPackage(namespace){
    return `package ${namespace};`;
}

function _buildNode(node, depth){
    let builderToken = null;
    switch(node.syntaxType){
        case "MessageDefinition" : return _buildMessageDefinition(node, depth);
        case "ServiceDefinition" : return _buildServiceDefinition(node, depth);
        case "EnumDefinition" : return _buildEnumDefinition(node, depth);
        default: throw new Error("Unknown SytaxType: " + node.syntaxType);
    }
}

function _buildOptions(options, depth){
    let str = "";

    for(let name in options){
        str += repeat("  ", depth) + "option " + name + " = " + (typeof(options[name]) === "string" ? `"${options[name]}"` : options[name]) + ";\n"; 
    }

    return [str];
}

function _buildImport(imports){
    return imports.map((str) => {return "import \"" + str + "\";"}).join("\n");
}

function _buildSyntax(syntax){
    return `syntax = "${syntax}";\n`
}

function _buildMessageDefinition(node, depth){
    let builderTokens = [];
    
    if(node.options){
        builderTokens.push(_buildOptions(node.options, depth + 1));
    }

    if(node.reserved && node.reserved.length > 0){
        if(_buildNumericReserved(node.reserved, depth + 1) !== ""){
            builderTokens.push(_buildNumericReserved(node.reserved, depth + 1));
        }
        if(_buildStringReserved(node.reserved, depth + 1) !== ""){
            builderTokens.push(_buildStringReserved(node.reserved, depth + 1));
        }
       
    }

    if(node.nested){
        for(let name in node.nested){
            builderTokens.push(_buildNode(node.nested[name], depth + 1));
        }
    }

    if(node.fields){
        for(let name in node.fields){
            builderTokens.push(_buildField(node.fields[name], depth + 1));
        }
    }

    let str = "";
    str += repeat("  ", depth) + `message ${node.name} { ${node.comment ? "//" + node.comment : ""}\n`;
    str += builderTokens.join("\n");
    str +=  "\n" + repeat("  ", depth) + `}\n`
    return [str];
}

function _buildStringReserved(reserved, depth){
    let str = repeat("  ", depth);
    let strings = reserved.filter((a) => {
        return typeof(a) === "string";
    }).map((str) => {
        return "\"" + str + "\"";
    });

    if(strings.length === 0){
        return "";
    }
    str += `reserved ${strings.join(", ")};`

    return str;
}

function _buildNumericReserved(reserved, depth){
    let str = repeat("  ", depth);
    let numericStrings = reserved.filter((a) => {
        return typeof(a) !== "string";
    }).map((a) => {
        if(a[0] === a[1]){
            return a[0].toString();
        } else {
            return a[0] + " to " + a[1];
        }
    });
    if(numericStrings.length === 0){
        return "";
    }
    str += `reserved ${numericStrings.join(", ")};`
    return str;
}

function _buildField(node, depth){
    if(node.map){
        return _buildMapField(node, depth);
    }
    return _buildBaseTypeOrIdentifier(node, depth);
}

function _buildMapField(node, depth){
    let str = repeat("  ", depth);
    if(node.required){
        str += "required ";
    }

    if(node.repeated){
        str += "repeated ";
    }

    str += `map<${node.keyType.value}, ${node.type.value}> ${node.name} = ${node.id}`;

    if(node.options){
        str += " ["
        let opts = [];
        for(let val in node.options){
            opts.push(val + " = " + node.options[val]);
        }
        str += opts.join(",");
        str += "]"
    }

    str += ";"

    if(node.comment){
        str += " //" + node.comment;
    }

    return [str];
}

function _buildBaseTypeOrIdentifier(node, depth){
    let str = repeat("  ", depth);

    if(node.required){
        str += "required ";
    }

    if(node.repeated){
        str += "repeated ";
    }

    str += `${node.type.value} ${node.name} = ${node.id}`;

    if(node.options){
        str += " ["
        let opts = [];
        for(let val in node.options){
            opts.push(val + " = " + node.options[val]);
        }
        str += opts.join(",");
        str += "]"
    }

    str += ";"
    
    if(node.comment){
        str += " //" + node.comment;
    }

    return [str];
}

function _buildEnumDefinition(node, depth){
    let builderTokens = [];
    
    if(node.options){
        builderTokens.push(_buildOptions(node.options, depth + 1));
    }

    if(node.values){
        for(let valueKey in node.values){
            let val = repeat("  ", depth + 1) + valueKey + " = ";
            if(typeof(node.values[valueKey]) === "string"){
                val += "\"" + node.values[valueKey] + "\"" 
            } else {
                val += node.values[valueKey];
            }
            val += ";"
            builderTokens.push(val);
        }
    }

    let str = "";
    str += repeat("  ", depth) + `enum ${node.name} { ${node.comment ? "//" + node.comment : ""}\n`;
    str += builderTokens.join("\n");
    str +=  "\n" + repeat("  ", depth) + `}\n`
    return [str];
}

function _buildServiceDefinition(node, depth){
    let builderTokens = [];
    
    if(node.options){
        builderTokens.push(_buildOptions(node.options, depth + 1));
    }

    if(node.methods){
        for(let name in node.methods){
            builderTokens.push(_buildMethod(node.methods[name], depth + 1));
        }
    }

    let str = "";
    str += repeat("  ", depth) + `service ${node.name} { ${node.comment ? "//" + node.comment : ""}\n`;
    str += builderTokens.join("\n");
    str +=  "\n" + repeat("  ", depth) + `}\n`
    return [str];
}

function _buildMethod(methodNode, depth){
    let str = repeat("  ", depth);
    str += `rpc ${methodNode.name}(${methodNode.requestType.value}) returns (${methodNode.responseType.value}) {}`;
    if(methodNode.comment){
        str += " //" + methodNode.comment;
    }
    return str;
}

function repeat(chars, amount){
    let builder = "";
    for(let i = 0; i < amount; i++){
        builder += chars;
    }

    return builder;
}

function compile(protoDocument){
    let compiled = unsafeCompile(protoDocument);
    parser.parse(compiled, {
        // Set whether to keep the origin case. The default value is true.
        keepCase: true,  
        // Set whether to enable alternateCommentMode. The default value is true.
        alternateCommentMode: true,
        // Set whether to resolve types. The default value is true.
        resolve: false,
        // Set whether to weak resolve types(do not throw errors when resolve failed).
        // The default value is true.
        weakResolve: true,
        // Set whether to return pure json Object. The default value is true.
        toJson: true
      });
    return compiled;
}

module.exports = {
    compile,
    unsafeCompile
}