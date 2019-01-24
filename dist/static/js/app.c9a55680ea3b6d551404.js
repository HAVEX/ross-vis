webpackJsonp([1],{

/***/ "1Mm8":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/flexgl/src/uniform.js
function Uniform(glContext, name, type, data) {

    var uniform = (this instanceof Uniform) ? this : {},
        ctx = glContext;

    function serializeArray(arrayOfArray) {
        var sa = [];
        arrayOfArray.forEach(function(a){
            sa = sa.concat(a);
        })
        return sa;
    }

    function sanitize(data) {
        if(Array.isArray(data)) {
            var hasArray = data.filter(function(d){return Array.isArray(d);});
            if(hasArray.length > 0) {
               return serializeArray(data);
            } else {
                return data;
            }
        } else {
            return data
        }
    }

    function setUniform() {
        var type = this.type,
            location = this.location,
            size = this.size,
            data = this.data;
            
        if(Array.isArray(data)) {
            var hasArray = data.filter(function(d){return Array.isArray(d);});
            if(hasArray)
                data = serializeArray(data);
        }

        if((type == 'float' || type == 'int') && !Array.isArray(data) && !ArrayBuffer.isView(data))
            data = [data];

        var buf;
        if (type.slice(0,3) == 'vec' || type == 'float') {
            buf = new Float32Array(data);
            ctx['uniform' + size + 'fv'](location, buf);
        } else if(type.slice(0,4) == 'ivec' || type == 'int'){
            buf = new Int32Array(data);
            ctx['uniform' + size + 'iv'](location, buf);
        } else if(type.slice(0,3) == 'mat') {
            buf = new Float32Array(data);
            ctx['uniformMatrix' + size + 'fv'](location, false, buf);
        } else if(type == 'sampler2D') {
            if(data.hasOwnProperty('resourceType') && data.resourceType == 'texture') {
                ctx.activeTexture(ctx.TEXTURE0 + data.index);
                ctx.bindTexture(ctx.TEXTURE_2D, data.ptr);
                ctx.uniform1i(location, data.index);
            }
        }
    }

    uniform.create = function(name, type, data) {

        if(Array.isArray(data)) {
            var hasArray = data.filter(function(d){return Array.isArray(d);});
            if(hasArray.length > 0) {
                data = serializeArray(data);
            }
        }

        uniform[name] = {
            type: type,
            name: name,
            data: data,
            location: null,
            size: parseInt(type.slice(3,4)) || parseInt(type.slice(4,5)) || 1
        };

        uniform[name].link = function(program) {
            if(typeof this.data !== 'undefined' && this.data !== null) {
                this.location = ctx.getUniformLocation(program, this.name);
                setUniform.call(this);
            }
            return this;
        };

        uniform[name].value = function(val) {
           this.data = sanitize(val);
        }

        uniform[name].load = function(data) {
            this.data = data;
            return this;
        };

        uniform[name].header = function() {
            var header = 'uniform ' + this.type + ' ' + this.name,
                len = 0;
            
            if(this.type != 'sampler2D') {
                len = this.data.length / this.size;
            }

            //TODO: fix declaration for matrix
            if(len > 1 && type != 'mat4') {
                header += '[' + len + ']';
            }
            return header + ';\n';
        };

        return uniform[name];
    }


    return uniform;
}

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/flexgl/src/attribute.js
function Attribute(glContext) {
    
    var attribute = (this instanceof Attribute) ? this : {},
        ctx = glContext,
        attributeID = 0;

    function setAttribute(name, data) {
        if(Array.isArray(data) || ArrayBuffer.isView(data)){
            if(!ArrayBuffer.isView(data)) data = new Float32Array(data);
            attribute[name].data = data;
            ctx.bindBuffer(ctx.ARRAY_BUFFER, attribute[name].ptr);
            ctx.bufferData(ctx.ARRAY_BUFFER, data, ctx.STATIC_DRAW);
        }
    }
    attribute.create = function(name, type, data) {
        attribute[name] = {
            name: name,
            type: type || 'float',
            data: null,
            location: attributeID++,
            ptr: ctx.createBuffer(),
            size: parseInt(type.slice(3,4)) || 1
        };

        if(data !== null && data.length) setAttribute(name, data);

        attribute[name].link = function(program) {
            ctx.bindBuffer(ctx.ARRAY_BUFFER, this.ptr);
            this.location = ctx.getAttribLocation(program, this.name);
            ctx.vertexAttribPointer(this.location, this.size, ctx.FLOAT, false, 0, 0);
            ctx.enableVertexAttribArray(this.location);
            return this;
        }

        attribute[name].load = function(arrayBuffer) {
            setAttribute(this.name, arrayBuffer);
            return this;
        }

        attribute[name].header = function() {
            return 'attribute ' + this.type + ' ' + this.name + ';\n';
        }

        attribute[name].delete = function() {
            ctx.deleteBuffer(this.ptr);
        }

        return attribute[name];
    };

    return attribute;
}

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/flexgl/src/texture.js


function Texture(glContext) {

    var texture = (this instanceof Texture) ? this : {},
        ctx = glContext,
        textureID = 0;

    function setTexture(name, texData) {
        var type = ctx[texture[name].type.toUpperCase()],
            format = ctx[texture[name].channel.toUpperCase()],
            width = texture[name].dim[0],
            height = texture[name].dim[1];

        texture[name].data = texData;

        ctx.bindTexture(ctx.TEXTURE_2D, texture[name].ptr);
        ctx.texImage2D(ctx.TEXTURE_2D, 0, format, width, height, 0, format, type, texData);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.NEAREST);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.NEAREST);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_S, ctx.CLAMP_TO_EDGE);
        ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_WRAP_T, ctx.CLAMP_TO_EDGE);
        ctx.bindTexture(ctx.TEXTURE_2D, null);
    }

    function updateTexture(name, texData, offset = [0, 0], dim = [texture[name].dim[0], texture[name].dim[1]] ) {
        var type = ctx[texture[name].type.toUpperCase()],
            format = ctx[texture[name].channel.toUpperCase()],
            width = dim[0],
            height = dim[1];

        ctx.bindTexture(ctx.TEXTURE_2D, texture[name].ptr);
        ctx.texSubImage2D(ctx.TEXTURE_2D, 0, offset[0], offset[1], width, height, format, type, texData);
        ctx.bindTexture(ctx.TEXTURE_2D, null);
    }

    // TODO: Add support for texture compression
    // function compressTexture(texData) {
    //
    //     var ext = (
    //       ctx.getExtension("WEBGL_compressed_texture_s3tc") ||
    //       ctx.getExtension("MOZ_WEBGL_compressed_texture_s3tc") ||
    //       ctx.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc")
    //     );
    //
    //     ctx.compressedTexImage2D(ctx.TEXTURE_2D, 0, ext.COMPRESSED_RGBA_S3TC_DXT3_EXT, texture[name].dim[0], texture[name].dim[1], 0, texData);
    //     ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, ctx.LINEAR);
    //     ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, ctx.LINEAR);
    // }

    texture.create = function(name, type, dim, channel, data, sampler) {
        var texIndex = (texture.hasOwnProperty(name)) ? texture[name].index : textureID++;
        texture[name] = {
            name: name,
            index: texIndex,
            type: type || "float",
            dim: dim || [512, 512],
            channel: channel || "alpha",
            data: null,
            location: null,
            sampler: sampler || null,
            ptr: ctx.createTexture()
        };

        // if(data !== null && data.length)
        setTexture(name, data);

        if (texture[name].sampler === null) {
            texture[name].sampler = Uniform(ctx).create(name, 'sampler2D', texture[name]);
        } else {
            texture[name].sampler.data = texture[name];
        }

        texture[name].link = function(program) {
            if (this.data !== null) {
                // ctx.activeTexture(ctx.TEXTURE0 + this.index);
                // ctx.bindTexture(ctx.TEXTURE_2D, this.ptr);
                // this.location = ctx.getUniformLocation(program, this.name);
                // ctx.uniform1i(this.location, this.index);
                if (typeof(this.sampler.data) == 'undefined' || this.sampler.data === null)
                    this.sampler.data = texture[name];

                this.sampler.link(program);
            }
            return this;
        }

        texture[name].load = function(texData) {
            setTexture(this.name, texData);
            return this;
        }

        texture[name].copyFromFBO = function() {
            ctx.bindTexture(ctx.TEXTURE_2D, this.ptr);
            ctx.copyTexImage2D(
                ctx.TEXTURE_2D,
                0,
                ctx.RGBA,
                0,
                0,
                this.dim[0],
                this.dim[1],
                0
            );
            ctx.bindTexture(ctx.TEXTURE_2D, null);
        }

        texture[name].update = function(texData, offset, dim) {
            updateTexture(this.name, texData, offset, dim);
            return this;
        }

        texture[name].resize = function(dim, data) {
            this.dim = dim;
            setTexture(this.name, data);
        }

        texture[name].delete = function() {
            glContext.deleteTexture(this.ptr);
        }

        texture[name].header = function() {
            if (this.name == this.sampler.name)
                return 'uniform sampler2D ' + this.sampler.name + ';\n';
            else
                return '';
        }

        return texture[name];
    }

    return texture;
}

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/flexgl/src/varying.js
function Varying(glContext) {

    var varying = (this instanceof Varying) ? this : {},
        ctx = glContext;

    varying.create = function(name, type, size) {
        varying[name] = {
            name: name,
            type: type || 'float',
            size: size || 1,
        };

        varying[name].link = function() {};

        varying[name].header = function() {
            var header = 'varying ' + this.type + ' ' + this.name;
            if(this.size > 1)
                header += '[' + this.size + ']';
            return header + ';\n';
        }

        return varying[name];
    }

    return varying;
}

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/flexgl/src/subroutine.js
function Subroutine() {

    var subroutine = (this instanceof Subroutine) ? this : {};

    subroutine.create = function(name, type, fn) {
        subroutine[name] = {
            name: name,
            type: type || 'float',
            fn: fn,
            resourceType: "subroutine"
        };

        subroutine[name].link = function(program) {
            return this;
        }

        subroutine[name].load = function(fn) {
            subroutine[name].fn = fn;
            return this;
        }

        subroutine[name].header = function() {
            return this.fn.toString();
        }

        return subroutine[name];
    };

    return subroutine;
}

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/flexgl/src/resource.js






function Resource(glContext) {
    var resource = (this instanceof Resource) ? this : {},
        gpuResources = {};

    resource.uniform = new Uniform(glContext);
    resource.attribute = new Attribute(glContext);
    resource.texture = new Texture(glContext);
    resource.varying = new Varying(glContext);
    resource.subroutine = new Subroutine();

    var resourceTypes = ['uniform', 'attribute', 'texture', 'varying', 'subroutine'];

    resource.allocate = function(type, props) {
        if (resourceTypes.indexOf(type) === -1) {
            throw Error("Error: Invalid resource type: " + type);
        }
        var res = resource[type].create.apply(null, Array.prototype.slice.call(arguments, 1));
        res.resourceType = type;
        gpuResources[res.name] = res;
        if (!gpuResources.hasOwnProperty(res.name)) {
            Object.defineProperty(gpuResources, res.name, {
                get: function() {
                    return gpuResources[res.name];
                },
                set: function(data) {
                    gpuResources[res.name].load(data);
                }
            });
        }
        return res;
    };

    resource.link = function(program, resources) {
        var requiredResources = (Array.isArray(resources)) ? resources : Object.keys(gpuResources);
        requiredResources.forEach(function(resourceName) {
            if (gpuResources.hasOwnProperty(resourceName))
                gpuResources[resourceName].link(program);
        })
    };

    resource.get = function(name) {
        return gpuResources[name];
    }

    resource.create = resource.allocate;

    return resource;
};

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/flexgl/src/shader.js
function Shader(glContext, glResource) {
    
    var shader = (this instanceof Shader) ? this : {},
        ctx = glContext,
        resource = glResource,
        parameters = ctx._dict || {};

    shader.vertex = {};
    shader.fragment = {};

    var shaderType = {
        vertex: ctx.VERTEX_SHADER,
        fragment: ctx.FRAGMENT_SHADER
    };

    // Convert JS functions to GLSL codes
    function toGLSL(returnType, name, fn){

        var glsl = returnType + ' ' +
            name + '(' + applyEnvParameters(fn.toString())
            .replace(
                /var\s+([\w|\d]+)\s*=\s*new\s+([\w|\d]+)\((.*)\)/g,
                function(expr, name, dtype, value){
                    var parts;
                    if(value)
                        parts = [dtype.toLowerCase(), name, '=', value];
                    else
                        parts = [dtype.toLowerCase(), name];

                    return parts.join(' ')
                }
            )
            .replace(/for\s*\(\s*var\s+/g, 'for(int ')
            .replace(/var\s/g, 'float ')
            // .replace(/(\.0)([^\d])/g, '$10000000001 $2 ')
            .replace(/this./g, '')
            .replace(/\$(.*)\((.*)\)\s*(=|;)/g, "$1 $2 $3");
            // .replace(/\$(.*?)\./g, "$1 ")

        if(name == "main") {
            glsl = glsl.replace(/\(.*(function|\w).*\(\s*([\s\S]*?)\s*{/, '(){') + "\n";
        } else {
            var args = glsl.match(/function|\w.*\(\s*([\s\S]*?)\s*\)/)[1];
            
            var isObject = args.match(/{([\s\S]*)}/);

            if(isObject) {
                args = isObject[1].split(',')
                    .map(d=>d.split('='))
                    .map(d=> d[1].replace(/(\'|\")/g, '') + ' ' + d[0])
                    .join(', ')
            } else if(args != "") {
                args = args.replace(/\$([\w|\d]+)_/g, "$1 ");
            }
           
            glsl = glsl.replace(/\(.*(function|\w).*\(\s*([\s\S]*?)\s*\)/, '(' + args+')') + "\n";
        }
        return glsl;
    }

    //set parameters in JS functions before converting to GLSL codes
    function applyEnvParameters(str){
        //find all $(...) and replace them with parameters
        var envParam = Object.keys(parameters);
        if(envParam.length > 0){
            var re = new RegExp("\\$\\(("+envParam.join("|")+")\\)","g");
            str = str.replace(re, function(matched){
                return parameters[matched.slice(2,matched.length-1)];
            });
        }

        // Make uniforms to be used as parameters in shaders, like $(uniformName)
        // var envUniforms = Object.keys(resource.uniform);
        // re = new RegExp("\\$\\(("+envUniforms.join("|")+")\\)","g");
        // str = str.replace(re, function(matched){
        //     return resource.uniform[matched.slice(2,matched.length-1)].data;
        // });

        return str;
    }

    function compile(shaderType, shaderSource) {
        if (shaderType !== ctx.VERTEX_SHADER && shaderType !== ctx.FRAGMENT_SHADER) {
            throw ("Error: unknown shader type");
        }
        var _shader = ctx.createShader(shaderType);
        ctx.shaderSource(_shader, shaderSource);
        ctx.compileShader(_shader);

        // Check the compile status, get compile error if any
        var compiled = ctx.getShaderParameter(_shader, ctx.COMPILE_STATUS);
        if (!compiled) {
            var lastError = ctx.getShaderInfoLog(_shader);
            console.log(shaderSource + '\n ====================================================');
            throw new Error("Error compiling shader '" + _shader + "':" + lastError);

            ctx.deleteShader(_shader);
            return null;
        }

        return _shader;
    }

    function getDeps(fn) {
        var deps = [],
            sourceCode = fn.toString(),
            shaderArgs = sourceCode.match(/function\s.*?\(([^)]*)\)/),
            args = (shaderArgs !== null && shaderArgs.length) ? shaderArgs[1] : [];
        // args = args.replace(/(?:\r\n|\r|\n|\s)/g, '');
        //
        if(args.length) {
            deps = args.split(',').map(function(arg) {
                return arg.replace(/\/\*.*\*\//, '').trim();
            }).filter(function(arg) {
                return arg;
            });
        }

        var extraDeps = getExtraDeps(sourceCode);
        if(extraDeps.length) {
            deps = deps.concat(extraDeps
            .filter(function(d){
                return deps.indexOf(d) === -1;
            }))
        }

        return deps;
    }

    function getExtraDeps(fnString) {
        var extraDeps = fnString.match(/this\.(\w+)/g);
        if(extraDeps !== null) {
            extraDeps = extraDeps.map(function(d){
                return d.slice(5);
            });
        }
        if(extraDeps != null && extraDeps.length) {
            extraDeps.forEach(function(sdep){
                var sres = resource.get(sdep);
                if(sres && sres.resourceType == 'subroutine') {
                    extraDeps = extraDeps.concat(getExtraDeps(sres.fn.toString()));
                }
            });
        }
        return extraDeps || [];
    }

    function declareDep(dep) {
        var res = resource.get(dep);
        if(typeof res === 'undefined')
            throw new Error('Resource/dependence "' + dep + '" is not found.');
        if(res.resourceType == 'subroutine')
            return toGLSL(res.type, res.name, res.fn);
        else
            return res.header();
    }

    function uniqueDeps(deps) {
        var names = {};
        deps.forEach(function(d, i){
            names[d] = i;
        });

        return Object.keys(names);
    }

    shader.create = function(arg, fn){
        var option = arg || {},
            name = option.name || "default",
            type = option.type || "vertex",
            deps = option.require || option.deps || [],
            precision = option.precision || "high",
            debug = option.debug || false,
            main = option.main || fn || function() {};

        var shaderSource = 'precision ' + precision + 'p float;\n';

        if(deps.length === 0) deps = uniqueDeps(getDeps(main));

        //get dependence from subroutines if any
        var extraDeps = [];

        deps.forEach(function(dep){
            var res = resource.get(dep);
            if(typeof res == 'undefined') {
                console.log(dep);
                throw Error ('Error! Undefined variable in shader: '+  dep.name);
            }
            if(res.resourceType == 'subroutine') {
                // subRoutines.push(res.name);
                extraDeps  = getExtraDeps(res.fn.toString());
                
            }   
        })

        if(extraDeps.length) {
            var allDeps = extraDeps.concat(deps);
            deps = uniqueDeps(allDeps);
        }

        if(Array.isArray(deps)){
            deps.filter(function(d){
                return ctx.subroutineNames.indexOf(d) === -1;
            })
            .forEach(function(dep){
                shaderSource += declareDep(dep);
            });
            var t = deps.filter(function(d){
                return ctx.subroutineNames.indexOf(d) !== -1;
            })
            .reverse()
            .forEach(function(dep){
                shaderSource += declareDep(dep);
            });



        } else if(typeof(deps) == 'object') {
            console.log(deps)
            Object.keys(deps).forEach(function(resourceType){
                deps[resourceType].forEach(function(dep){
                    shaderSource += declareDep(dep);
                });
            })
        }

        shaderSource += toGLSL('void', 'main', main);
        if(debug)
            console.log(shaderSource);
        var _shader = compile(shaderType[type], shaderSource);
        _shader._shaderType = shaderType[type];
        _shader.deps = deps;
        _shader.source = shaderSource;
        shader[type][name] = _shader;
        return _shader;
    }

    return shader;
}

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/flexgl/src/program.js


function Program(glContext, resources) {

    var program,
        ctx = glContext,
        pm = {},
        kernels = {},
        shaders = new Shader(glContext, resources);

    pm.create = function(name, vs, fs) {
        var name = name || "default",
            vs = vs || "default",
            fs = fs || "default",
            deps = [];

        if (kernels.hasOwnProperty(name)) {
            pm.delete(name);
        }

        kernels[name] = ctx.createProgram();

        kernels[name].vs = (typeof vs == "object") ? vs : shaders.vertex[vs];
        kernels[name].fs = (typeof fs == "object") ? fs : shaders.fragment[fs];

        ctx.attachShader(kernels[name], kernels[name].vs);
        ctx.attachShader(kernels[name], kernels[name].fs);
        ctx.linkProgram(kernels[name]);
        var linked = ctx.getProgramParameter(kernels[name], ctx.LINK_STATUS);
        if (!linked) {
            var lastError = ctx.getProgramInfoLog(kernels[name]);
            throw ("Error in program linking:" + lastError);
            ctx.deleteProgram(kernels[name]);
            return null;
        }

        deps = deps.concat(kernels[name].vs.deps);
        deps = deps.concat(kernels[name].fs.deps);
        kernels[name].deps = deps;

        return kernels[name];
    }

    pm.use = pm.program = function(name, vs, fs) {
        if (kernels.hasOwnProperty(name)) {
            program = kernels[name];
            ctx.useProgram(program);
            resources.link(program, program.deps);
            return program;
        } else {
            return pm.create(name, vs, fs);
        }
    }

    pm.delete = function(name) {
        if (kernels.hasOwnProperty(name)) {
            ctx.detachShader(kernels[name], kernels[name].vs);
            ctx.detachShader(kernels[name], kernels[name].fs);
            ctx.deleteProgram(kernels[name]);
            delete kernels[name];
        }
    }

    pm.shader = function(arg, fn) {
        var options = arg;
        shaders.create(options, fn);
        return pm;
    }

    pm.shader.vertex = function(fn) {
        var options = {
            type: "vertex"
        };
        if (fn.name) options.name = fn.name;
        return shaders.create(options, fn);
    }

    pm.shader.fragment = function(fn) {
        var options = {
            type: "fragment"
        };
        if (fn.name) options.name = fn.name;
        return shaders.create(options, fn);
    }

    return pm;
}

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/flexgl/src/framebuffer.js


function Framebuffer(glContext) {

    var framebuffer = (this instanceof Framebuffer) ? this : {},
        ctx = glContext;

    framebuffer.create = function(name, type, dim, texture) {

        framebuffer[name] = {
            ptr: ctx.createFramebuffer(),
            name: name,
            type: type || "float",
            width: dim[0] || 1024,
            height: dim[1] || 1024,
            texture: texture || null,
            renderbuffer: ctx.createRenderbuffer(),
        }

        if (framebuffer[name].texture === null) {
            var buf = (type == 'float') ?
                new Float32Array(dim[0] * dim[1] * 4) :
                new Uint8Array(dim[0] * dim[1] * 4);
            framebuffer[name].texture = Texture(ctx).create(name, type, dim, "rgba", buf);
        }

        var renderbuffer = framebuffer[name].renderbuffer;
        ctx.bindFramebuffer(ctx.FRAMEBUFFER, framebuffer[name].ptr);
        ctx.bindRenderbuffer(ctx.RENDERBUFFER, renderbuffer);
        ctx.renderbufferStorage(
            ctx.RENDERBUFFER,
            ctx.DEPTH_COMPONENT16,
            framebuffer[name].width,
            framebuffer[name].height
        );
        ctx.framebufferTexture2D(
            ctx.FRAMEBUFFER,
            ctx.COLOR_ATTACHMENT0,
            ctx.TEXTURE_2D,
            framebuffer[name].texture.ptr,
            0
        );
        ctx.framebufferRenderbuffer(
            ctx.FRAMEBUFFER,
            ctx.DEPTH_ATTACHMENT,
            ctx.RENDERBUFFER,
            renderbuffer
        );
        ctx.bindRenderbuffer(ctx.RENDERBUFFER, null);
        ctx.bindFramebuffer(ctx.FRAMEBUFFER, null);

        framebuffer[name].enableRead = function(program) {
            ctx.activeTexture(ctx.TEXTURE0 + this.texture.index);
            ctx.bindTexture(ctx.TEXTURE_2D, this.texture.ptr);
            this.texture.location = ctx.getUniformLocation(program, this.texture.name);
            ctx.uniform1i(this.texture.location, this.texture.index);
        };

        framebuffer[name].delete = function() {
            ctx.bindRenderbuffer(gl.RENDERBUFFER, null);
            ctx.bindFramebuffer(gl.FRAMEBUFFER, null);
            ctx.deleteRenderbuffer(this.renderbuffer);
            ctx.deleteTexture(this.texture.ptr)
            ctx.deleteFramebuffer(this.ptr);
        };

        return framebuffer[name];
    }

    return framebuffer;
}

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/flexgl/src/main.js
/* harmony export (immutable) */ __webpack_exports__["a"] = FlexGL;





function FlexGL(arg) {

    var flexgl = (this instanceof FlexGL) ? this : {},
        options = arg || {},
        container = options.container || null,
        canvas = options.canvas || document.createElement("canvas"),
        viewport = options.viewport || [0, 0],
        width = options.width || viewport[0] || null,
        height = options.height || viewport[1] || null,
        padding = options.padding || {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0
        },
        ctx = options.context || options.ctx || null,
        kernels = {},
        program = null,
        glAttr = options.attributes || {},
        sharedFunction = options.sharedFunction || {};

    
    if (typeof(canvas) == "string") {
        if (canvas[0] == "#") canvas = document.getElementById(cavnas.substring(1));
        else canvas = document.getElementById(cavnas);
    }
    if (container) {
        container = (typeof(container) == "string") ? document.getElementById(container) : container;
        if (width === null) width = container.clientWidth;
        if (height === null) height = container.clientHeight;
    }
    // width -= padding.left + padding.right;
    // height -= padding.top + padding.bottom;
    canvas.width = width;
    canvas.height = height;
    canvas.style.position = "absolute";
    canvas.style.marginLeft = padding.left + "px";
    canvas.style.marginTop = padding.top + "px";

    if (ctx === null)
        ctx = setupWebGL(canvas);
    flexgl.ctx = ctx;
    flexgl.canvas = canvas;

    ctx._dict = options.env || options.dict || options.dictionary || {};
    ctx.subroutineNames = []; // save all subroutines' names 

    var resources = new Resource(ctx),
        framebuffers = new Framebuffer(ctx),
        programManager = new Program(ctx, resources),
        shaders = new Shader(ctx, resources);

    var blendExt = ctx.getExtension("EXT_blend_minmax");
    if (blendExt) {
        ctx.MAX_EXT = blendExt.MAX_EXT;
        ctx.MIN_EXT = blendExt.MIN_EXT;
    }

    ctx.ext = ctx.getExtension("ANGLE_instanced_arrays");
    enableExtension([
        "OES_texture_float",
        "OES_texture_float_linear",
        // "OES_texture_half_float",
        // "OES_texture_half_float_linear"
    ]);

    if (container)
        container.appendChild(canvas);

    function setupWebGL(canvas) {
        var names = ["webgl", "experimental-webgl"];
        var gl = null;
        for (var i = 0; i < names.length; ++i) {
            try {
                gl = canvas.getContext(names[i], glAttr);
            } catch (e) {}
            if (gl) break;
        }
        return gl;
    }

    function enableExtension(extensions) {
        if (!Array.isArray(extensions)) extensions = [extensions];
        extensions.forEach(function(extension) {
            var extProps = ctx.getExtension(extension);
            if (extProps !== null) {
                Object.keys(extProps).forEach(function(ep) {
                    if (!ext.hasOwnProperty(ep)) {
                        ctx.ext[ep] = extProps[ep];
                    }
                })
            }
        });
    };

    flexgl.enableExtension = enableExtension;

    /**
     * Allocate Attributes in vertex buffer array stored in GPU memory
     * @param  {String} name attribute name
     * @param  {String} type attribute type: float, vec2, ...
     * @param  {Array} data data values
     * @return {Object}      FLexGL object
     */
    flexgl.attribute = function(name, type, data) {
        resources.allocate("attribute", name, type, data);
        Object.defineProperty(flexgl.attribute, name, {
            get: function() {
                return resources.attribute[name];
            },
            set: function(data) {
                resources.attribute[name].load(data);
            }
        });
        return flexgl;
    };
    flexgl.buffer = flexgl.attribute; //alias

    /**
     * Create a Uniform variable for WebGL shader programs
     * @param  {String} name attribute name
     * @param  {String} type uniform variable type: float, vec2, ...
     * @param  {Array} data data values
     * @return {Object}      FLexGL object
     */
    flexgl.uniform = function(name, type, data) {
        resources.allocate("uniform", name, type, data);
        if (!flexgl.uniform.hasOwnProperty(name)) {
            Object.defineProperty(flexgl.uniform, name, {
                get: function() {
                    return resources.uniform[name];
                },
                set: function(data) {
                    resources.uniform[name].load(data);
                    if (ctx.isProgram(program))
                        resources.uniform[name].link(program);
                }
            });
        }
        return flexgl;
    };

    flexgl.uniform.serialize = function(aoa) {
        var sa = [];
        aoa.forEach(function(a) {
            sa = sa.concat(a);
        })
        return sa;
    }

    /**
     * Create a Uniform variable for WebGL shader programs
     * @param  {String} name attribute name
     * @param  {String} type texture type: unsigned_byte or float, ...
     * @param  {Array} data data values
     * @param  {Array} dim [width, height]
     * @param  {String} [channel='alpha'] WebGL formats (rgba, alpha)
     * @param  {Object} [sampler=null] FLexGL Uniform Object
     * @return {Object}      FLexGL object
     */
    flexgl.texture = function(name, type, data, dim, channel, sampler) {
        resources.allocate("texture", name, type, dim, channel, data, sampler);
        Object.defineProperty(flexgl.texture, name, {
            get: function() {
                return resources.texture[name];
            },
            set: function(data) {
                resources.texture[name].load(data);
            }
        });
        return flexgl;
    }

    flexgl.texture.update = function(name, data, offset, dim) {
        resources.texture[name].update(data, offset, dim);
    }

    /**
     * Create a Uniform variable for WebGL shader programs
     * @param  {String} name attribute name
     * @param  {String} [type] Varying variable type: float, vec2, ...
     * @param  {Number} [size=1] data array
     * @return {Object}      FLexGL object
     */
    flexgl.varying = function(name, type, size) {
        resources.allocate("varying", name, type, size);
        return flexgl;
    };

    /**
     * Create a Uniform variable for WebGL shader programs
     * @param  {String} name attribute name
     * @param  {String} type attribute type: float, vec2, ...
     * @param  {Array} dim [width, height]
     * @param  {Object} [texture=null] FLexGL Texture Object
     * @return {Object}      FLexGL object
     */
    flexgl.framebuffer = function(name, type, dim, texture) {
        var texture = texture || resources.allocate('texture', name, type, dim, 'rgba', null);

        framebuffers.create(name, type, dim, texture);
        if (!flexgl.framebuffer.hasOwnProperty(name)) {
            Object.defineProperty(flexgl.framebuffer, name, {
                get: function() {
                    return framebuffers[name];
                }
            });
        }
        return flexgl;
    }

    flexgl.framebuffer.enableRead = function(name) {
        framebuffers[name].enableRead(program);
    }

    flexgl.bindFramebuffer = function(fbName) {
        if (framebuffers.hasOwnProperty(fbName)) {
            ctx.bindFramebuffer(ctx.FRAMEBUFFER, framebuffers[fbName].ptr);
        } else {
            ctx.bindFramebuffer(ctx.FRAMEBUFFER, null);
        }
    }

    flexgl.subroutine = function(name, type, fn) {
        ctx.subroutineNames.push(name);
        resources.allocate("subroutine", name, type, fn);
        return flexgl;
    }

    flexgl.parameter = function(keyValuePairs) {
        Object.keys(keyValuePairs).forEach(function(key) {
            ctx._dict[key] = keyValuePairs[key];
            if (Array.isArray(ctx._dict[key])) {
                var i = 0;
                Object.defineProperty(ctx._dict, key, {
                    get: function() {
                        return keyValuePairs[key][i++];
                    },
                    set: function(newArray) {
                        i = 0;
                        ctx._dict[key] = newArray;
                    }
                });
            } else if(typeof(ctx._dict[key]) == 'object') {
                var dictKeys = Object.keys(ctx._dict[key]);
                fxgl.uniform('dict'+key, 'float', dictKeys.map(d=>ctx._dict[key][d]));
            }
        })
        return flexgl;
    }

    flexgl.dictionary = flexgl.parameter;

    flexgl.shader = programManager.shader;

    flexgl.program = function(name, vs, fs) {
        program = programManager.program(name, vs, fs);
        return ctx;
    }

    flexgl.createProgram = function(name, vs, fs) {
        program = programManager.create(name, vs, fs);
        return ctx;
    }

    flexgl.app = function(name, props) {
        var vs = flexgl.shader.vertex(props.vs),
            fs = flexgl.shader.fragment(props.fs),
            fb = props.framebuffer || null;

        flexgl.program(name, vs, fs);

        var draw = props.render || props.draw;

        return function(args) {
            var gl = flexgl.program(name);
            return draw.call(gl, args);
        }
    }

    flexgl.dimension = function() {
        return [canvas.width, canvas.height];
    }

    flexgl.resources = resources;

    return flexgl;
}


/***/ }),

/***/ "2A6v":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = parse;
function parse(text, delimiter) {
    "use strict";
    var size = text.length,
        accum = 0,
        i, //index for starting of a line
        row,
        rows = [],
        fields = [],
        lens = [],
        EOL = false;

    while(accum < size) {
        i = accum, EOL = false;
        row = loadLine(text, delimiter.charCodeAt(0), i);
        rows.push(row.fields);
        accum += row.size;
    }
    return rows;
}

function loadLine(text, delimiterCode, initPos) {
    // if(typeof(initPos) === 'undefined') initPos = 0;
    var EOL = false,
        QUOTE = false,
        c = initPos, //current pos
        code, //code at c
        f = initPos, // start pos of current field
        q, //start pos of quote
        fields = [],
        L = text.length;

    while(!EOL){
        code = text.charCodeAt(c);
        if(code === 10 || c>=L){
            EOL = true;
            // if(text.charCodeAt(c+1) === 13) ++c;
            fields.push( text.slice(f, c) );
        } else {
            if(code === delimiterCode && !QUOTE) {
                // console.log(f,c, text.slice(f, c));
                var field = text.slice(f, c);
                fields.push( field );
                f = c+1;
            } else if(code === 34){
                if(QUOTE){
                    if(text.charCodeAt(c+1) === delimiterCode){
                        QUOTE = false;
                        fields.push(text.slice(q, c));
                        f = c+2;
                        c++;
                    }
                } else {
                    q = c+1;
                    QUOTE = true;
                }
            }
        }
        c++;
    }
    return { fields: fields, size: c-initPos };
}


/***/ }),

/***/ "4fa2":
/***/ (function(module, exports, __webpack_require__) {

var ArrayOpts = __webpack_require__("6v4a");

module.exports = function(data, spec, headers){
    var i,
        l = data.length,
        attributes = headers || Object.keys(data[0]),
        bin,
        bins = [],
        binCollection = {},
        result = [],
        ks;

    if(!spec.hasOwnProperty('$group') && !spec.hasOwnProperty('$bin')) return result;

    if(typeof spec.$bin == 'object') {
        var binAttr = Object.keys(spec.$bin)[0],
            binCount = spec.$bin[binAttr];

        if(attributes.indexOf(binAttr) !== -1) {
            var column = data.map(function(d){return d[binAttr]}),
                min = ArrayOpts.min(column),
                max = ArrayOpts.max(column),
                binInterval = (max - min) / binCount;

            for(i = 0; i < l; i++){
                data[i]['bin@' + binAttr] = Math.min(Math.floor(data[i][binAttr]/binInterval), binCount-1);
            }

            spec.$group = 'bin@' + binAttr;
            attributes.push('bin@' + binAttr);
        }
    }

    for(i = 0; i < l; i++){
        if(Array.isArray(spec.$group)) {
            ks = [];
            spec.$group.forEach(function(si){
                ks.push(data[i][si]);
            });
            bin = JSON.stringify(ks);
        } else {
            bin = data[i][spec.$group];
        }
        if( bins.indexOf(bin) < 0 ){
            bins.push(bin);
            binCollection[bin] = [data[i]];
        } else {
            binCollection[bin].push(data[i]);
        }
    }

    var bl = bins.length;

    for(i = 0; i < bl; i++){
        var res = {};
        if(Array.isArray(spec.$group)) {
            ks = JSON.parse(bins[i]);
            spec.$group.forEach(function(s, j){
                res[s] = ks[j];
            })

        } else {
            res[spec.$group] = bins[i];
        }

        if(spec.$data) {
            res.data = binCollection[bins[i]];
        }

        if(spec.$group) {
            var gkeys = Array.isArray(spec.$group) ? spec.$group : [spec.$group];

            gkeys.forEach(function(gk){
                if(attributes.indexOf(gk) === -1) {
                    throw Error('Invalid attribute name: ', gk);
                }
            })
        }

        var out = spec.$collect || spec.$reduce || [];
        var keys = Object.keys(out);
        if(keys.length === 0) return result;
        keys.forEach(function(key){
            var attr = key,
                opt = out[key];

            if(opt === "$count" || opt === "$data") {
                attr = key;
            }
            if(typeof out[key] === 'object'){
                opt = Object.keys(out[key])[0];
                attr = out[key][opt];

                if(attributes.indexOf(attr) === -1 && attr !== "*" && !Array.isArray(attr)) {
                    var warnMsg = "No matching attribute or operation defined for the new attribute " + key + ":" + spec[key];
                    console.warn(warnMsg);
                    return;
                }
            }

            if(typeof opt === "function") {
                // res[key] = binCollection[bins[i]].map(function(a){ return a[attr]; }).reduce(opt);
                res[key] = opt.call(null, binCollection[bins[i]].map(function(a){ return a[attr]; }));
            } else if(typeof opt === "string") {
                if(opt === "$unique") {
                    res[key] = ArrayOpts.unique(binCollection[bins[i]].map(function(a){ return a[key]; }));
                } else if (opt === "$list") {
                    res[key] = binCollection[bins[i]].map(function(a){ return a[attr]; });
                } else if (opt === "$first") {
                    res[key] = binCollection[bins[i]][0][attr];
                } else if (opt === "$merge") {
                    var mergedResult = [];
                    binCollection[bins[i]].map(function(a){ return a[attr]; }).forEach(function(m){
                        mergedResult = mergedResult.concat(m);
                    })
                    res[key] = mergedResult;
                } else if (opt === "$count") {
                    res[key] = binCollection[bins[i]].length;
                } else if (opt === "$data") {
                    var collect = (spec.$collect) ? '$collect' : '$reduce';
                    res[key] = (spec[collect][key][opt] == '*')
                        ? binCollection[bins[i]]
                        : binCollection[bins[i]].map(function(data){
                            var row = {};
                            spec[key][opt].forEach(function(k){ row[k] = data[k] });
                            return row;
                        });
                } else {
                    var fname = opt.slice(1);

                    if(fname in ArrayOpts) {
                        res[key] = ArrayOpts[fname].call(null, binCollection[bins[i]].map(function(a){
                            return a[attr];
                        }));
                    }
                }
            }
        });
        result.push(res);
    }

    return result;
};


/***/ }),

/***/ "6Ric":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = ColumnStore;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__ctypes__ = __webpack_require__("i+b3");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__arrays__ = __webpack_require__("XLO3");



function ColumnStore(arg){
    var cstore     = (this instanceof ColumnStore) ? this : {},
        options    = arg || {},
        columns    = [],                  // column-based binary data
        size       = options.size  || 0,   // max size
        count      = options.count || 0,   // number of entries stored
        types      = options.types || [],  // types of the columns
        attributes = options.attributes || options.keys || options.names || [],  // column attributes
        struct     = options.struct || options.schema || null,
        strValues  = options.strValues || {},  // string values 
        strLists   = options.strLists  || {},  // table lookaside buffer
        intervals  = {},
        indexes    = options.indexes || {},
        colStats   = {},
        colAlloc   = {},
        colRead    = {},                  // functions for reading values
        skip       = options.skip  || 0;

    if(typeof(struct) === 'object') initStruct(struct);



    function initCStore() {
        if(size && types.length === attributes.length && types.length > 0) {
            attributes.forEach(function(c, i){
                configureColumn(i);
                columns[i] = new colAlloc[c](size);
                if(!columns.hasOwnProperty(c)) {
                    Object.defineProperty(columns, c, {
                        get: function() { return columns[i]; }
                    });
                }
                if(intervals.hasOwnProperty(c)) {
                    cstore.intervalize(c, intervals[c]);
                }

                if(strValues[c] && Object.keys(strValues[c]).length > 0) {
                    strLists[c] = Object.keys(strValues[c]);
                }

            });
            columns.attributes = attributes;
            columns.keys = attributes;
            columns.types = types;
            columns.struct = struct;
            columns.strLists = strLists;
            columns.strValues = strValues;
            columns.uniqueValues = indexes;
            columns.size = size;
            columns.get = function(c) {
                var index = attributes.indexOf(c);
                if(index < 0 ) throw new Error("Error: No column named " + c);
                return columns[index];
            }
        } 
        return cstore;
    }

    function initStruct(s) {
        struct = s;
        if(Array.isArray(struct)) {
            struct.forEach(function(s){
                attributes.push(s.name);
                types.push(s.type || s.dtype);
            })
        } else {
            for(var k in struct){
                attributes.push(k);
                types.push(struct[k]);
            }
        }
        return struct;
    }

    function configureColumn(cid) {
        if(typeof(cid) == "string") cid = attributes.indexOf(cid);
        var f = attributes[cid];
        colAlloc[f] = __WEBPACK_IMPORTED_MODULE_0__ctypes__[types[cid]];

        if(colAlloc[f] === __WEBPACK_IMPORTED_MODULE_0__ctypes__["string"]){
            if (!strValues.hasOwnProperty(f)) {
                strValues[f] = {};
                strLists[f] = [];
            }
            colRead[f] = function(value) {
                if(!strValues[f].hasOwnProperty(value)){
                    strValues[f][value] = strLists[f].length;
                    strLists[f].push(value);
                }
                return strValues[f][value];
            };
        } else if(
            colAlloc[f] === __WEBPACK_IMPORTED_MODULE_0__ctypes__["int"] ||
            colAlloc[f] === __WEBPACK_IMPORTED_MODULE_0__ctypes__["short"] ||
            colAlloc[f] === __WEBPACK_IMPORTED_MODULE_0__ctypes__["integer"]
        ) {
            colRead[f] = function(value) {  return parseInt(value) || 0; };
        } else if(
            colAlloc[f] === __WEBPACK_IMPORTED_MODULE_0__ctypes__["float"] ||
            colAlloc[f] === __WEBPACK_IMPORTED_MODULE_0__ctypes__["double"] ||
            colAlloc[f] === __WEBPACK_IMPORTED_MODULE_0__ctypes__["numeric"]
        ){
            colRead[f] = function(value) {  return parseFloat(value) || 0.0; };
        } else if(
                colAlloc[f] === __WEBPACK_IMPORTED_MODULE_0__ctypes__["time"] ||
                colAlloc[f] === __WEBPACK_IMPORTED_MODULE_0__ctypes__["temporal"]
        ) {
            colRead[f] = function(value) {  return parseFloat(value) || 0.0; };
        } else {
            throw new Error("Invalid data type for TypedArray data!")
        }
    }

    cstore.addRows = function(rowArray) {
        if(size === 0) {
            size = rowArray.length;
            initCStore();
        }
        if(count === 0 && skip > 0) {
            for(var j = 0; j<skip; j++)
                rowArray.shift();
        }
        rowArray.forEach(function(row, i){
            row.forEach(function(v,j){
                columns[j][count] = colRead[attributes[j]](v);
            });
            count++;
        });

        return count;
    }

    cstore.addObjects = function(objArray) {
        if(count === 0 && skip > 0) {
            for(var j = 0; j<skip; j++)
                objArray.shift();
        }
        objArray.forEach(function(obj, i){
            Object.keys(obj).forEach(function(v,j){
                columns[j][count] = colRead[attributes[j]](obj[v]);
            });
            count++;
        });
        return count;
    }

    cstore.addColumn = function(arg) {
        var props = arg || {},
            columnData = props.data || props.array,
            columnName = props.name,
            columnType = props.dtype,
            values = props.values || [];

        var cid = attributes.indexOf(columnName);
        if( cid < 0) {
            attributes.push(columnName);
            types.push(columnType);
            configureColumn(columnName);
            cid = types.length - 1;
            Object.defineProperty(columns, columnName, {
                get: function() { return columns[cid]; }
            });
        }

        if(columnData instanceof __WEBPACK_IMPORTED_MODULE_0__ctypes__[types[cid]]) {
            columns[cid] = columnData;
            if(values.length) {
                strLists[columnName] = values;
                strValues[columnName] = {};
                values.forEach(function(value, vi){
                    strValues[columnName][value] = vi;
                })
            }
        } else if(ArrayBuffer.isView(columnData)){
            columns[cid] = new colAlloc[columnName](size);
            for(var di = 0; di < size; di++) {
                columns[cid][di] = colRead[columnName](columnData[di]);
            }
        } else {
            throw new Error("Error: Invalid data type for columnArray!");
        }
        size = count = columnData.length;
    }

    cstore.metadata = cstore.info = function() {
        return {
            size: size,
            count: count,
            attributes: attributes,
            types: types,
            strLists: strLists,
            strValues: strValues,
            stats: cstore.stats()
        }
    }

    cstore.columns = function() {
        return columns;
    }

    cstore.data = function() {
        var data = columns;
        data.stats = cstore.stats();
        data.keys = attributes;
        data.size = size;
        data.strValues = strValues;
        data.strLists = strLists;
        data.dtypes = types;
        data.export = cstore.export;
        return data;
    }

    cstore.stats = function(col){
        var col = col || attributes;
        col.forEach(function(name, c){
            if(!colStats[c]){
                var min, max, avg;
                min = max = avg = columns[c][0];

                for(var i = 1; i < columns[c].length; i++){
                    var d = columns[c][i];
                    if(d > max) max = d;
                    else if(d < min) min = d;
                    avg = avg - (avg-d) / i;
                }
                if(max == min) max += 0.000001;
                colStats[name] = {min: min, max: max, avg: avg};
            }
        })
        return colStats;
    }

    cstore.domains = function(col){
        var col = col || attributes,
            domains = [];

        col.forEach(function(name, c){
            domains[name] = [colStats[name].min, colStats[name].max];
        })
        return domains;
    }

    cstore.ctypes = function() {
        return __WEBPACK_IMPORTED_MODULE_0__ctypes__;
    }

    cstore.size = size;

    cstore.exportAsJSON = function() {
        var rows = new Array(size);
        for(var ri = 0; ri < size; ri++) {
            var dataFrame = {};
            attributes.forEach(function(attr, ai) {
                if(types[ai] == 'string') {
                    dataFrame[attr] = strLists[attr][columns[ai][ri]];
                } else if(indexes.hasOwnProperty(attr)) {
                    dataFrame[attr] = indexes[attr][columns[ai][ri]];
                } else {
                    dataFrame[attr] = columns[ai][ri];
                }
            })
            rows[ri] = dataFrame;
        }
        return rows;
    }

    cstore.exportAsRowArray = function() {
        var rows = new Array(size);
        for(var ri = 0; ri < size; ri++) {
            var row = new Array(attributes.length);
            attributes.forEach(function(attr, ai) {
                if(types[ai] == 'string') {
                    row[ai] = strLists[attr][columns[ai][ri]];
                } else if(indexes.hasOwnProperty(attr)) {
                    row[ai] = indexes[attr][columns[ai][ri]];
                } else {
                    row[ai] = columns[ai][ri];
                }
            })
            rows[ri] = row;
        }
        return rows;
    }

    cstore.export = function(arg) {
        var format = arg || 'json';
        if(format == 'rowArray') {
            return cstore.exportAsRowArray();
        } else {
            return cstore.exportAsJSON();
        }
    }

    cstore.import = function({
        data,
        schema = null,
        type = 'json'
    }) {
        size = data.length;
        if(typeof(schema == 'object')) initStruct(schema);
        initCStore();
        if(type === 'json') {
            cstore.addObjects(data);
        } else {
            cstore.addRows(data);
        }
        
        return cstore;
    }

    cstore.scale = function(attr, factor) {
        let len = columns[attr].length;
        for(var i = 0; i < len; i++) {
            columns[attr] *= factor;
        }
        return cstore;
    }

    cstore.normalize = function(attr) {
        if(!colStats.hasOwnProperty(attr)) {
            cstore.stats();
        }
        let fid = attributes.indexOf(attr);
        let len = columns[attr].length;
        let max = colStats[f].max;
        let min = colStats[f].min;

        if(types[fid] === 'float') {
            for(var i = 0; i < len; i++) {
                columns[attr][i] = (columns[attr][i] - min) / (max - min);
            }
        } 
        return cstore;
    }

    cstore.intervalize = function(attr, interval) {
        intervals[attr] = interval;
        if(!colStats.hasOwnProperty(attr)) {
            cstore.stats([attr]);
        }
        let fid = attributes.indexOf(attr);
        let len = columns[attr].length;
        let min = colStats[f].min;

        if(types[fid] === 'int' || types[fid] === 'float') {
            for(var i = 0; i < len; i++) {
                columns[attr][i] = (columns[attr][i] - min) / interval;
            }
        } 
        return cstore;
    }

    cstore.index = function(attr) {
        let attrId = attributes.indexOf(attr);
        if(attrId === -1) throw Error('Invalid attribute for indexing');
        types[attrId] = 'int';
        indexes[attr] = Object(__WEBPACK_IMPORTED_MODULE_1__arrays__["b" /* unique */])(columns[attr]).sort(function(a, b) {
            return a - b;
        });
        let len = columns[attr].length;
        for(var i = 0; i < len; i++) {
            columns[attr][i] = indexes[attr].indexOf(columns[attr][i]); 
        }
        
        return cstore;
    }

    return initCStore();
}


/***/ }),

/***/ "6v4a":
/***/ (function(module, exports) {

var array = {};
function _reduce(array, opt) {
    var i,
        len = array.length,
        fn,
        result;

    if(!len) return 0;

    switch (opt) {
        case "max":
            result = array.reduce(function(a, b) {
                return (a > b) ? a : b;
            });
            break;
        case "min":
            result = array.reduce(function(a, b) {
                return (a < b) ? a : b;
            });
            break;
        case "and":
        case "&":
            result = array.reduce(function(a, b) {
                return a & b;
            });
            break;
        case "or":
        case "|":
            result = array.reduce(function(a, b) {
                return a | b;
            });
            break;
        case "mult":
        case "*":
            result = array.reduce(function(a, b) {
                return a * b;
            });
            break;
        default: // "sum" or "+"
            result = array.reduce(function(a, b) {
                return a + b;
            });
            break;
    }

    return result;
}

array.reduce = function(opt) {
    return function(array) {
        var a = (array instanceof Array) ? array : Array.apply(null, arguments);
        return _reduce(a, opt);
    };
};

array.avg = function(array) {
    return _reduce(array, "+") / array.length;
    // return array.reduce(function(a,b){ return 0.5 * (a + b)});
};

array.normalize = function(array) {
    var max = _reduce(array, "max"),
        min = _reduce(array, "min"),
        range = max - min;

    return array.map(function(a){
        return (a - min) / range;
    });
}

array.seq = function(start, end, intv) {
    var interval = intv || 1,
        array = [];

    for(var i=start; i<=end; i+=interval)
        array.push(i);

    return array;
};

["max", "min", "mult", "and", "or"].forEach(function(f) {
    array[f] = array.reduce(f);
});

array.sum = array.reduce("+");

array.scan = array.pfsum = function(a){
    var pfsum = [],
        accum = 0;

    for (var i = 0; i < a.length; i++) {
        accum += a[i];
        pfsum.push(accum);
    }

    return pfsum;
};

array.iscan = function(a) {
    return array.scan([0].concat(a));
};

array.diff = function(a, b) {
    var difference = [];
    a.forEach(function(d){
        if (b.indexOf(d)===-1) {
            difference.push(d);
        }
    });
    return difference;
};

array.intersect = function(a, b) {
    var t;
    if (b.length > a.length) t = b, b = a, a = t; // indexOf to loop over shorter
    return a.filter(function (e) {
            if (b.indexOf(e) !== -1) return true;
    });
};

array.unique = function(a) {
    return a.reduce(function(b, c) {
        if (b.indexOf(c) < 0) b.push(c);
        return b;
    }, []);
};

array.lcm = function(A) {
    var n = A.length, a = Math.abs(A[0]);
    for (var i = 1; i < n; i++) {
        var b = Math.abs(A[i]), c = a;
        while (a && b){ (a > b) ? a %= b : b %= a; }
        a = Math.abs(c*A[i])/(a+b);
    }
    return a;
};

array.stats = function(array){
    return {
        max: _reduce(array, "max"),
        min: _reduce(array, "min"),
        avg: array.avg(array)
    };
};

array.histogram = function(array, numBin, _max, _min) {
    var l = array.length,
        min = (typeof(_min) == 'number') ? _min : _reduce(array, "min"),
        max = (typeof(_max) == 'number') ? _max : _reduce(array, "max"),
        range = max - min,
        interval = range / numBin,
        bins = [],
        // ids = [],
        hg = new Array(numBin+1).fill(0);

    for(var b = 0; b < numBin; b++) {
        bins.push([min + range * (b/(numBin)), min + range*(b+1)/(numBin)]);
        // ids[b] = [];
    }

    // ids[numBin] = [];

    for(var i = 0; i < l; i++) {
        binID = Math.floor( (array[i] - min) / range * (numBin));
        hg[binID]++;
        // ids[binID].push(i);
    };

    hg[numBin-1] += hg[numBin];
    // ids[numBin-1] = ids[numBin-1].concat(ids.pop());
    return {
        bins: bins,
        counts: hg.slice(0,numBin),
        // ids: ids
    };
}

array.var = function(rowArray) {
    var m = _reduce(rowArray, "+") / rowArray.length,
        va = rowArray.map(function(a){ return Math.pow(a-m, 2) });

    return _reduce(va, "+") / (rowArray.length - 1);
}

array.std = function(rowArray) {
    return Math.sqrt(array.var(rowArray));
}



module.exports = array;


/***/ }),

/***/ "7zck":
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),

/***/ "8LhM":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global, module) {/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__src_main__ = __webpack_require__("q2n1");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__src_cstore__ = __webpack_require__("6Ric");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__src_ctypes__ = __webpack_require__("i+b3");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__src_io_ajax__ = __webpack_require__("MjQa");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__src_io_parse__ = __webpack_require__("2A6v");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__test_data_babies__ = __webpack_require__("U/Ny");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__test_data_timeseries__ = __webpack_require__("OxvU");









var root = typeof self == 'object' && self.self === self && self ||
           typeof global == 'object' && global.global === global && global ||
           this;



__WEBPACK_IMPORTED_MODULE_0__src_main__["a" /* default */].ajax = __WEBPACK_IMPORTED_MODULE_3__src_io_ajax__;
__WEBPACK_IMPORTED_MODULE_0__src_main__["a" /* default */].cstore = __WEBPACK_IMPORTED_MODULE_1__src_cstore__["a" /* default */];
__WEBPACK_IMPORTED_MODULE_0__src_main__["a" /* default */].ctypes = __WEBPACK_IMPORTED_MODULE_2__src_ctypes__;
__WEBPACK_IMPORTED_MODULE_0__src_main__["a" /* default */].parse = __WEBPACK_IMPORTED_MODULE_4__src_io_parse__["a" /* default */];
__WEBPACK_IMPORTED_MODULE_0__src_main__["a" /* default */].datasets = {Babies: __WEBPACK_IMPORTED_MODULE_5__test_data_babies__["a" /* default */], TimeSeries: __WEBPACK_IMPORTED_MODULE_6__test_data_timeseries__["a" /* default */]};

root.p4 = __WEBPACK_IMPORTED_MODULE_0__src_main__["a" /* default */];
/* harmony default export */ __webpack_exports__["a"] = (root.p4);

if(typeof module != 'undefined' && module.exports)
    module.exports = root.p4;
/* WEBPACK VAR INJECTION */}.call(__webpack_exports__, __webpack_require__("DuR2"), __webpack_require__("f1Eh")(module)))

/***/ }),

/***/ "Ai9I":
/***/ (function(module, exports) {

module.exports = function join(dataLeft, dataRight) {
    var len = dataLeft.length,
        keyL = Object.keys(dataLeft[0]),
        keyR = Object.keys(dataRight[0]);
        
    var keys = keyR.filter(function(kr){ return (keyL.indexOf(kr) === -1);});

    keys.forEach(function(k){
        for(var i = 0; i < len; i++) {
            dataLeft[i][k] = dataRight[i][k];    
        }
    });

    return dataLeft;
}


/***/ }),

/***/ "FFav":
/***/ (function(module, exports) {

module.exports = {
    add: vectorAdd,
    sum: vectorSum,
    avg: vectorAvg
}

function vectorAdd(a, b){
    var c = [];
    a.forEach(function(v, i){
        c[i] = v + b[i];
    });

    return c;
}

function vectorSum(vectors){
    var result = vectors[0],
        numberOfVectors = vectors.length;

    for(var i = 1; i < numberOfVectors; i++){
        result = vectorAdd(result, vectors[i]);
    }

    return result;
}

function _vectorAvg(a, b){
    var c = [];
    a.forEach(function(v, i){
        c[i] = (v + b[i]) * 0.5;
    });

    return c;
}

function vectorAvg(vectors){
    var result = vectors[0],
        numberOfVectors = vectors.length;

    for(var i = 1; i < numberOfVectors; i++){
        result =  _vectorAvg(result, vectors[i]);
    }

    return result;
}


/***/ }),

/***/ "HDeP":
/***/ (function(module, exports, __webpack_require__) {

const derive = __webpack_require__("Xxjy");
const queries = __webpack_require__("Ogx3");
const aggregate = __webpack_require__("4fa2");
const match = __webpack_require__("aQHI");

module.exports = function pipeline (data){
    var queue = [],
        cache = {},
        opt = {},
        workers = [],
        completed = 0,
        result = [],
        callback = function() {};

    if(Array.isArray(data)) {
        result = data;
    }

    opt.derive = derive;
    opt.match = match;
    opt.aggregate = aggregate;

    Object.keys(queries).forEach(function(f) {
        opt[f] = queries[f];
    });

    opt.cache = function(data, tag){
        cache[tag] = pipeline.result();
    };

    opt.map = function(f){
        result = data.map(f);
        return pipeline;
    };

    var merge = {
        aggregate: function (lastJob) {
            var mergeSpec = {};
            for(var key in lastJob.aggregate) {
                var optSpec = lastJob.aggregate[key];
                if(typeof optSpec == 'object')
                    mergeSpec[key] = Object.keys(optSpec)[0];
                else
                    mergeSpec[key] = optSpec;
            }
            return opt.aggregate(finalResult, mergeSpec);
        }
    }

    var finalResult = [];

    function mergeResult(workerResult) {
        var rl = finalResult.length,
            wl = workerResult.length;
        for(var i = 0; i < wl; i++) {
            finalResult[rl+i] = workerResult[i];
        }
        completed += 1;

        if(completed == workers.length) {
            var lastJob = queue[queue.length-1],
                lastJobOpt = Object.keys(lastJob)[0];
            if( lastJobOpt == 'aggregate') {
                finalResult = merge.aggregate(lastJob);
            }
            callback(finalResult);
        }
    }

    var pipeline = {};

    // pipeline.opt = opt;
    Object.keys(opt).forEach(function(o){
        pipeline[o] = function(spec) {
            var task = {};
            task[o] = spec;
            queue.push(task);
            return pipeline;
        };
    })

    pipeline.then = function(_callback) {
        callback = _callback;
        queue.forEach(function(q){
            var f = Object.keys(q)[0];
            result = opt[f](result, q[f]);
        });
        return result;
    }

    pipeline.execute = function(data) {
        if(Array.isArray(data)) result = data;
        queue.forEach(function(q){
            var f = Object.keys(q)[0];
            result = opt[f](result, q[f]);
        });
        return result;
    }

    pipeline.oncomplete = pipeline.then;

    pipeline.result = function() {
        return result;
    };

    pipeline.data = function(data) {
        result = data;
        return pipeline
    }

    pipeline.queue = function() {
        return queue;
    }

    pipeline.runSpec = function(specs) {
        specs.forEach(function(spec){
            let opt = Object.keys(spec)[0];
            pipeline[opt.replace('$', '')](spec[opt])
        })
        return pipeline.execute();
    }

    return pipeline;
}


/***/ }),

/***/ "IlyB":
/***/ (function(module, exports) {

/**
 * alloc(options) - allocating memory for storing data values in different schemaures.
 * @exports allocate
 * @param {Object} options - Options for allocating memory.
 * @param {Array} options.array - Array containing the data values.
 * @param {Array} options.fields - Fields in the data.
 * @param {number} [options.skip=0] - Number of rows to be skiped in data.
 * @param {object[]} [options.data] - default data
 *
 */
module.exports = function allocate(options) {
    'use strict';
    var array = options.array || [],
        header = options.fields || options.header || array[0],
        types = options.types || [],
        schema = options.schema || undefined,
        skip = options.skip || 0,
        data = options.data || [];

    var ds = {},
        parsers = [];

    if (types.length && typeof(types) == 'string') {
        var ta = [];
        for (var i = 0; i < header.length; i++) {
            ta.push(types);
        }
        types = ta;
    }

    if (typeof schema == 'object') {
        header = Object.keys(schema);
        types = Object.keys(schema).map(function(h) {
            return schema[h];
        });
    }

    if (typeof skip == 'number') {
        for (var j = 0; j < skip; j++)
            array.shift();
    }

    types.forEach(function(t) {
        parsers.push(getParser(t));
    })

    function getParser(type) {
        if (type == 'int' || type.match('veci*')) {
            return function(value) {
                var res = parseInt(value);
                return (isNaN(res)) ? 0 : res;
            };
        } else if (type == 'float' || type.match('vecf*')) {
            return function(value) {
                var res = parseFloat(value);
                return (isNaN(res)) ? 0 : res;
            };
        } else if (['date', 'time', 'datetime'].indexOf(type) != -1) {
            return function(value) {
                return new Date(value);
            };
        } else if (['money', 'price', 'cost'].indexOf(type) != -1) {
            return function(value) {
                return parseFloat(value.substring(1));
            };
        } else {
            return function(value) {
                return value;
            };
        }
    }

    ds.insertRows = function(rows) {
        array = array.concat(rows);
    }
    
    /**
    * @method objectArray
    * @return {Object[]} - Return data as array of objects
    */
    ds.objectArray = function() {
        if (typeof(header) !== 'undefined' && header.length) {
            var l = header.length;
            array.forEach(function(a) {
                var o = {},
                    offset = 0;
                for (var i = 0; i < l; i++) {
                    var k = header[i];
                    if (k.length) {
                        if (types[i].match(/^(veci|vecf)\d+$/)) {
                            var vl = parseInt(types[i].slice(4)),
                                vector = [];
                            a.slice(offset, offset + vl).forEach(function(vi) {
                                vector.push(parsers[i](vi));
                            });
                            o[k] = vector;
                            offset += vl;
                        } else {
                            o[k] = parsers[i](a[offset]);
                            offset++;
                        }
                    }
                }
                data.push(o);
            });
        }
        return data;
    }

    /**
    * @method rowArray
    * @return {Array[]} - data as row arrays
    */
    ds.rowArray = function() {
        array.forEach(function(a) {
            var row = [];
            header.forEach(function(k, i) {
                if (k.length) {
                    row.push(parsers[i](a[i]));
                }
            });
            data.push(row);
        });
        data.fields = header;
        data.schema = 'rowArray';
        return data;
    }

    /**
    * @method collumArray
    * @return {Array[]} - data as column arrays
    */
    ds.columnArray = function() {
        header.forEach(function(k, i) {
            var column = array.map(function(a) {
                return parsers[i](a[i]);
            });
            data.push(column);
        });
        data.fields = header;
        data.schema = 'columnArray';
        return data;
    }
    //TODO: make columnArray extensible like rowArray and objectArray

    return ds;
};


/***/ }),

/***/ "Lgo6":
/***/ (function(module, exports) {

module.exports = function toArray(data, arg){
    var options = arg || {},
        fields = options.fields || Object.keys(data[0]) || [],
        format = options.format || 'row';

    if(format == 'row') {
        return data.map(function(d){
            var row = new Array(fields.length);
            fields.forEach(function(f, i){
                row[i] = d[f];
            });
            return row;
        });
    } else {
        return fields.map(function(f){
            return data.map(function(d){ return d[f]; })
        })
    }
}


/***/ }),

/***/ "MjQa":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (immutable) */ __webpack_exports__["request"] = request;
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "get", function() { return get; });
/* harmony export (immutable) */ __webpack_exports__["getAll"] = getAll;
/* harmony export (immutable) */ __webpack_exports__["post"] = post;
function request(arg) {
    var url = arg.url || arg,
        method = arg.method || "GET",
        dataType = arg.dataType || "json",
        data = arg.data || [],
        query = [];  //arraybuffer, blob, document, json, text

    for (var key in data) {
        query.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
    }

    return new Promise(function(resolve, reject) {

        var req = new XMLHttpRequest();
        req.open(method, url);
        req.responseType = dataType;

        req.onload = function() {
          if (req.status == 200) {
            resolve(req.response);
          }
          else {
            reject(Error(req.statusText));
          }
        };

        req.onerror = function() {
          reject(Error("Network Error"));
        };

        if (method == 'POST') {
            req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        }

        req.send(data);
    });
};

let get = request;

function getAll(options) {
    var promises = [];
    options.forEach(function(option){
        promises.push(
            request(option)
            .then(function(result){
                return new Promise(function(resolve, reject) {
                    resolve(result);
                });
            })
        );
    });

    return Promise.all(promises);
}

function post(arg) {
    arg.method = "POST";
    return ajax.request(arg);
};


/***/ }),

/***/ "NHnr":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });

// EXTERNAL MODULE: ./node_modules/vue/dist/vue.esm.js
var vue_esm = __webpack_require__("7+uW");

// CONCATENATED MODULE: ./node_modules/babel-loader/lib!./node_modules/vue-loader/lib/selector.js?type=script&index=0!./src/App.vue
//
//
//
//
//
//

/* harmony default export */ var App = ({
  name: 'App'
});
// CONCATENATED MODULE: ./node_modules/vue-loader/lib/template-compiler?{"id":"data-v-432a305e","hasScoped":false,"transformToRequire":{"video":["src","poster"],"source":"src","img":"src","image":"xlink:href"},"buble":{"transforms":{}}}!./node_modules/vue-loader/lib/selector.js?type=template&index=0!./src/App.vue
var render = function () {var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;return _c('div',{attrs:{"id":"app"}},[_c('router-view')],1)}
var staticRenderFns = []
var esExports = { render: render, staticRenderFns: staticRenderFns }
/* harmony default export */ var selectortype_template_index_0_src_App = (esExports);
// CONCATENATED MODULE: ./src/App.vue
function injectStyle (ssrContext) {
  __webpack_require__("zzbV")
}
var normalizeComponent = __webpack_require__("VU/8")
/* script */


/* template */

/* template functional */
var __vue_template_functional__ = false
/* styles */
var __vue_styles__ = injectStyle
/* scopeId */
var __vue_scopeId__ = null
/* moduleIdentifier (server only) */
var __vue_module_identifier__ = null
var Component = normalizeComponent(
  App,
  selectortype_template_index_0_src_App,
  __vue_template_functional__,
  __vue_styles__,
  __vue_scopeId__,
  __vue_module_identifier__
)

/* harmony default export */ var src_App = (Component.exports);

// EXTERNAL MODULE: ./node_modules/vue-router/dist/vue-router.esm.js
var vue_router_esm = __webpack_require__("/ocq");

// EXTERNAL MODULE: ./node_modules/vuetify/dist/vuetify.js
var vuetify = __webpack_require__("3EgV");
var vuetify_default = /*#__PURE__*/__webpack_require__.n(vuetify);

// EXTERNAL MODULE: ./node_modules/vuetify/dist/vuetify.min.css
var vuetify_min = __webpack_require__("7zck");
var vuetify_min_default = /*#__PURE__*/__webpack_require__.n(vuetify_min);

// EXTERNAL MODULE: ./node_modules/material-design-icons-iconfont/dist/material-design-icons.css
var material_design_icons = __webpack_require__("gJtD");
var material_design_icons_default = /*#__PURE__*/__webpack_require__.n(material_design_icons);

// EXTERNAL MODULE: ./node_modules/babel-runtime/core-js/object/assign.js
var object_assign = __webpack_require__("woOf");
var assign_default = /*#__PURE__*/__webpack_require__.n(object_assign);

// EXTERNAL MODULE: ./node_modules/babel-runtime/core-js/object/keys.js
var keys = __webpack_require__("fZjL");
var keys_default = /*#__PURE__*/__webpack_require__.n(keys);

// EXTERNAL MODULE: ./node_modules/babel-runtime/helpers/toConsumableArray.js
var toConsumableArray = __webpack_require__("Gu7T");
var toConsumableArray_default = /*#__PURE__*/__webpack_require__.n(toConsumableArray);

// EXTERNAL MODULE: ./node_modules/babel-runtime/core-js/json/stringify.js
var stringify = __webpack_require__("mvHQ");
var stringify_default = /*#__PURE__*/__webpack_require__.n(stringify);

// EXTERNAL MODULE: ./src/html/Dashboard.html
var Dashboard = __webpack_require__("NVFP");
var Dashboard_default = /*#__PURE__*/__webpack_require__.n(Dashboard);

// EXTERNAL MODULE: ./src/css/app.css
var app = __webpack_require__("VXnA");
var app_default = /*#__PURE__*/__webpack_require__.n(app);

// EXTERNAL MODULE: /home/kelvin/Dropbox/workspace/p.pack/p5/index.js
var p5 = __webpack_require__("qI3u");

// EXTERNAL MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/index.js
var p4 = __webpack_require__("8LhM");

// EXTERNAL MODULE: /home/kelvin/Dropbox/workspace/p.pack/p3/index.js
var p3 = __webpack_require__("rkGp");
var p3_default = /*#__PURE__*/__webpack_require__.n(p3);

// EXTERNAL MODULE: /home/kelvin/Dropbox/workspace/p.pack/picos/index.js
var picos = __webpack_require__("U7xf");

// EXTERNAL MODULE: /home/kelvin/Dropbox/workspace/p.pack/p.plot/index.js + 4 modules
var p_plot = __webpack_require__("g2B4");

// CONCATENATED MODULE: ./src/components/Dashboard.js











/* harmony default export */ var components_Dashboard = ({
  name: 'Dashboard',
  template: Dashboard_default.a,
  data: function data() {
    return {
      appName: 'ROSS-Vis',
      dialog: true,
      socketError: false,
      data: null,
      server: 'localhost:8888',
      numPE: null,
      numKP: null,
      vis: null,
      transpiler: null,
      modes: ['Post Hoc', 'In Situ'],
      defaultMode: 'Post Hoc',
      timeDomains: ['LastGvt', 'RealTs', 'VirtualTime'],
      granularity: ['PE', 'KP', 'LP'],
      measures: ['avg', 'sum', 'max', 'min'],
      timeIndexes: null,
      selectedTimeDomain: 'LastGvt',
      selectedTimeInterval: null,
      selectedGran: 'PE',
      selectedMeasure: 'sum',
      isAggregated: true,
      views: [],
      width: 0,
      height: 0,
      left: false,
      metrics: [],
      checkboxs: [],
      defaultMetrics: ['NeventProcessed', 'RbTotal', 'VirtualTimeDiff'],
      selectedMetrics: [],
      analyses: ['graph', 'PCA'],
      selectedAnalysis: 'graph',
      commData: null,
      metricData: null,
      showIntraComm: false,
      showGraph: false
    };
  },
  props: {
    source: String
  },
  mounted: function mounted() {
    var visContainer = document.getElementById('vis-overview');
    this.width = visContainer.clientWidth;
    this.height = visContainer.clientHeight * 0.9;
    this.selectedMetrics = this.defaultMetrics.slice();
    p4["a" /* default */].ajax.get({
      url: 'http://localhost:8888/pca',
      dataType: 'json'
    }).then(function (result) {
      var data = {
        json: result.data,
        vmap: {
          x: 'PC0',
          y: 'PC1',
          color: 'steelblue',
          size: 6
        }
      };
      var container = document.getElementById('stats-view');

      var view = {
        container: '#stats-view',
        width: container.parentElement.clientWidth,
        height: container.parentElement.clientHeight * 0.9,
        padding: { left: 50, right: 30, top: 30, bottom: 60 },
        axes: true
      };

      new p_plot["a" /* default */].ScatterPlot(data, view).render();
    });
  },
  methods: {
    start: function start() {},
    init: function init() {
      var _this = this;

      var config = {
        container: 'vis-overview',
        viewport: [this.width, this.height]
      };

      var socket = new WebSocket('ws://' + this.server + '/websocket');
      socket.onopen = function () {
        _this.dialog = !_this.dialog;
        _this.socketError = false;
        socket.send(stringify_default()({ data: 'KpData', method: 'get' }));
      };

      socket.onerror = function (error) {
        _this.socketError = true;
        console.log(error);
      };

      socket.onmessage = function (event) {
        var data = JSON.parse(event.data);
        _this.data = data.data;
        _this.numPE = Math.max.apply(Math, toConsumableArray_default()(_this.data.map(function (d) {
          return d.Peid;
        }))) + 1;
        _this.numKP = Math.max.apply(Math, toConsumableArray_default()(_this.data.map(function (d) {
          return d.Kpid;
        }))) + 1;
        console.log(_this.numPE, _this.numKP);
        _this.transpiler = new p5["a" /* default */].Transpiler(_this.metrics);
        if (data.schema.hasOwnProperty('CommData')) {
          data.schema.CommData = 'int';
        }
        var cache = p4["a" /* default */].cstore({});
        _this.metrics = keys_default()(data.schema);
        cache.import(data);
        cache.index('RealTs');
        cache.index('LastGvt');
        var gpuData = cache.data();
        // console.log(gpuData.stats)
        _this.timeIndexes = gpuData.uniqueValues;
        _this.vis = Object(p4["a" /* default */])(config).data(gpuData).view(_this.views);
        _this.reset();
      };
    },
    reset: function reset() {
      this.selectedMetrics = this.defaultMetrics.slice();
      this.views = [{
        id: 'view-right',
        width: this.width / 2,
        height: this.height,
        gridlines: { y: true },
        padding: { left: 70, right: 150, top: 50, bottom: 80 },
        offset: [this.width / 2, 0]
      }];
      this.selectedTimeInterval = null;
      this.visualize();
    },
    visualizeComm: function visualizeComm() {
      var _this2 = this;

      var container = document.getElementById('graph-view');
      container.innerHTML = '';

      var aggregateByTime = p3_default.a.pipeline();
      if (this.selectedTimeInterval !== null) {
        var match = {};
        match[this.selectedTimeDomain] = this.selectedTimeInterval;
        aggregateByTime.match(match);
      }

      var tsData = aggregateByTime.aggregate({
        $group: this.selectedTimeDomain,
        $collect: {
          items: { $data: '*' }
        }
      }).execute(this.data);

      var tsCommData = tsData.map(function (sample) {
        return sample.items.sort(function (a, b) {
          return a.Peid - b.Peid;
        }).map(function (item) {
          return item.CommData;
        });
      });

      var accCommData = tsCommData[0];
      // console.log(accCommData)
      if (tsCommData.length > 1) {
        tsCommData.slice(1).forEach(function (sample) {
          sample.forEach(function (rows, i) {
            rows.forEach(function (value, j) {
              if (i < accCommData.length) accCommData[i][j] += value;
            });
          });
        });
      }
      accCommData = accCommData.map(function (rows) {
        var newRows = new Array(_this2.numPE);
        for (var i = 0; i < _this2.numPE; i++) {
          newRows[i] = rows.slice(i * _this2.numKP, (i + 1) * _this2.numKP).reduce(function (a, b) {
            return a + b;
          });
        }
        return newRows;
      });

      this.commData = accCommData[0].map(function (a, i) {
        return p3_default.a.vector.sum(accCommData.slice(i * _this2.numKP, (i + 1) * _this2.numKP));
      });

      var aggrSpec = this.transpiler.transpile([{
        $aggregate: {
          $group: ['Kpid', 'Peid'],
          $include: this.selectedMetrics,
          $exclude: ['CommData'],
          $calculate: [this.selectedMeasure]
        }
      }]);

      var transform = p3_default.a.pipeline();

      if (this.selectedTimeInterval !== null) {
        var _match = {};
        _match[this.selectedTimeDomain] = this.selectedTimeInterval;
        transform.match(_match);
      }

      var result = transform.aggregate(aggrSpec[0].$aggregate).execute(this.data);

      this.metricData = p3_default.a.aggregate(result, { $group: 'Peid', $collect: { items: { $data: '*' } } }).map(function (r) {
        return r.items;
      });

      var colorSets = [['white', 'teal'], ['white', 'purple'], ['white', 'orange'], ['white', 'steelblue'], ['white', 'red'], ['steelblue', 'red'], ['green', 'yellow']];

      var layers = [{
        type: 'link',
        data: this.commData,
        ignoreDiagonal: !this.showIntraComm,
        size: 2,
        vmap: {
          color: 'CommData'
        },
        colors: ['steelblue', 'red']
      }];

      this.selectedMetrics.forEach(function (metric, mi) {
        layers.push({
          type: 'rect',
          data: _this2.metricData,
          vmap: {
            color: _this2.selectedMeasure + '.' + metric
          },
          colors: colorSets[mi],
          size: 1
        });
      });

      layers.push({
        type: 'text',
        data: this.metricData.map(function (r, i) {
          return 'PE' + i;
        }),
        size: 1
      });

      Object(picos["a" /* default */])({
        config: {
          container: '#graph-view',
          legend: true,
          width: container.clientWidth,
          height: container.clientHeight
        },
        layers: layers
      });
    },
    visualize: function visualize() {
      var _this3 = this;

      var viewSetting = {
        gridlines: { y: true },
        padding: { left: 70, right: 60, top: 10, bottom: 40 }
      };
      var metrics = this.selectedMetrics;
      var collection = {};

      // let metrics = [ 'RbPrim', 'RbSec', 'Efficiency'];
      // let metrics = Object.keys(data.schema)
      var views = [];
      metrics.forEach(function (metric, mi) {
        collection[metric] = {};
        collection[metric]['$' + _this3.selectedMeasure] = metric;
        var view = assign_default()({}, viewSetting);
        view.id = 'view' + mi;
        view.width = _this3.width;
        view.height = _this3.height / metrics.length;
        view.offset = [0, _this3.height - view.height * (mi + 1)];
        views.push(view);
      });

      var firstMetric = {};
      var firstMetricName = keys_default()(collection)[0];
      firstMetric[firstMetricName] = collection[firstMetricName];

      var vmap = {
        mark: this.isAggregated ? 'area' : 'spline',
        x: this.selectedTimeDomain,
        color: 'steelblue',
        size: 3,
        brush: {
          condition: { x: true, lazy: true },
          callback: function callback(selection) {
            var ti = _this3.timeIndexes[_this3.selectedTimeDomain];
            var start = Math.floor(selection[_this3.selectedTimeDomain][0]);
            var end = Math.ceil(selection[_this3.selectedTimeDomain][1]);
            if (end - start >= 1) {
              _this3.selectedTimeInterval = [ti[start], ti[end]];
              _this3.visualizeComm();
            }
          }
        }
      };

      var aggregation = [this.selectedTimeDomain];

      if (!this.isAggregated) {
        vmap.color = 'Peid';
        aggregation.push('Peid');
      }

      this.vis.view(views).head().aggregate({
        $group: aggregation,
        $collect: collection
      });

      this.vis.visualize(metrics.map(function (metric, mi) {
        return assign_default()({ id: 'view' + mi, y: metric }, vmap);
      }));

      this.visualizeComm();
    }
  }
});
// CONCATENATED MODULE: ./src/router.js




vue_esm["default"].use(vue_router_esm["a" /* default */]);
vue_esm["default"].use(vuetify_default.a);






/* harmony default export */ var router = (new vue_router_esm["a" /* default */]({
  routes: [{
    path: '/',
    name: 'Dashboard',
    component: components_Dashboard
  }]
}));
// CONCATENATED MODULE: ./src/main.js
// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.




vue_esm["default"].config.productionTip = false;

/* eslint-disable no-new */
new vue_esm["default"]({
  el: '#app',
  router: router,
  components: { App: src_App },
  template: '<App/>'
});

/***/ }),

/***/ "NVFP":
/***/ (function(module, exports) {

module.exports = "<v-app id=\"inspire\">\n  <v-toolbar\n    color=\"blue-grey\"\n    dark\n    fixed\n    app\n    clipped-right\n  >\n    <v-toolbar-side-icon @click.stop=\"left = !left\"></v-toolbar-side-icon>\n    <v-toolbar-title style=\"margin-right: 3em;\">{{ appName }}</v-toolbar-title>\n    <v-flex xs2 class=\"ma-2\">\n      <v-select \n        label=\"TimeMode\"\n        :items=\"timeDomains\"\n        v-model=\"selectedTimeDomain\"\n        :menu-props=\"{ maxHeight: '400' }\"\n        box\n        v-on:change=\"visualize()\"\n      >\n      </v-select>\n    </v-flex>\n    <v-flex xs2 class=\"ma-2\">\n        <v-select \n          label=\"Granularity\"\n          :items=\"granularity\"\n          v-model=\"selectedGran\"\n          :menu-props=\"{ maxHeight: '400' }\"\n          box\n          v-on:change=\"visualize()\"\n        >\n        </v-select>\n      </v-flex>\n    <v-spacer></v-spacer>\n    <v-flex xs2>\n      <v-select\n        :items=\"modes\"\n        label=\"App Mode\"\n        v-model=\"defaultMode\"\n        box\n      ></v-select>\n    </v-flex>\n  </v-toolbar>\n  <v-navigation-drawer\n    v-model=\"left\"\n    temporary\n    fixed\n  >\n  </v-navigation-drawer>\n  <v-dialog v-model=\"dialog\" persistent max-width=\"600px\">\n    <v-btn slot=\"activator\" color=\"primary\" dark>Open Dialog</v-btn>\n    <v-card>\n      <v-card-title>\n        <span class=\"headline\">Server and Data Settings</span>\n      </v-card-title>\n      <v-card-text>\n        <v-container grid-list-md>\n          <v-layout wrap>\n            <v-alert\n              :value=\"socketError\"\n              color=\"error\"\n            >\n              Cannot connect to server!\n            </v-alert>\n            <v-flex xs12>\n              <v-text-field box label=\"Server Address\"  v-model=\"server\" required></v-text-field>\n            </v-flex>\n            <v-flex xs12 sm6>\n              <v-text-field box label=\"Number of PEs\" v-model=\"numPE\" required></v-text-field>\n            </v-flex>\n            <v-flex xs12 sm6>\n              <v-text-field box label=\"Number of KPs per PE\" v-model=\"numKP\" required></v-text-field>\n            </v-flex>\n          </v-layout>\n        </v-container>\n      </v-card-text>\n      <v-card-actions>\n        <v-spacer></v-spacer>\n        <v-flex justify-cente>\n          <v-btn\n            color=\"primary\"\n            @click=\"init()\"\n          >\n          Start\n          </v-btn>\n        </v-flex>\n      </v-card-actions>\n    </v-card>\n  </v-dialog>\n\n  <v-content class=\"pa-2\">\n    <v-container fluid fill-height class=\"pa-1\">\n      <v-layout justify-center align-center>\n        <v-flex xs7 fill-height class=\"pa-2\">\n          <v-toolbar dense>\n            <v-flex xs9 class=\"ma-2\">\n              <v-select \n                label=\"Metric\"\n                :items=\"metrics\"\n                multiple\n                v-model=\"selectedMetrics\"\n                :menu-props=\"{ maxHeight: '400' }\"\n                persistent-hint\n                v-on:change=\"visualize()\"\n              >\n              </v-select>\n            </v-flex>\n            <v-flex xs2 class=\"ma-2\">\n                <v-select \n                  label=\"Measure\"\n                  :items=\"measures\"\n                  v-model=\"selectedMeasure\"\n                  v-on:change=\"visualize()\"\n                >\n                </v-select>\n              </v-flex>\n            <!-- <v-btn icon>\n              <v-icon>search</v-icon>\n            </v-btn> -->\n            <v-spacer></v-spacer>\n            <!-- <v-btn icon>\n              <v-icon>apps</v-icon>\n            </v-btn> -->\n            <v-switch\n              :label=\"`Aggr`\"\n              v-model=\"isAggregated\"\n              v-on:change=\"visualize()\"\n            ></v-switch>\n            <v-btn icon>\n              <v-icon v-on:click=\"reset()\">refresh</v-icon>\n            </v-btn>\n\n          </v-toolbar>\n          <v-card height=\"100%\" id=\"vis-overview\">\n          </v-card>\n        </v-flex>\n        <v-flex xs5 fill-height class=\"pa-2\">\n          <v-toolbar dense>\n              <v-switch  v-bind:class=\"{hidden: selectedAnalysis != 'graph'}\"\n              label=\"Intra-Comm\"\n              v-model=\"showIntraComm\"\n              v-on:change=\"visualizeComm(data)\"\n            ></v-switch>\n            <v-spacer></v-spacer>\n            <v-overflow-btn\n              dense\n              style=\"max-width: 180px;\"\n              label=\"Analysis Mode\"\n              :items=\"analyses\"\n              v-model=\"selectedAnalysis\"\n            ></v-overflow-btn>\n          </v-toolbar>\n          <v-card class=\"fill-height\">\n            <div v-bind:class=\"{hidden: selectedAnalysis != 'graph'}\" id=\"graph-view\"></div>\n            <div v-bind:class=\"{hidden: selectedAnalysis != 'PCA'}\" id=\"stats-view\"></div>\n          </v-card>\n        </v-flex>\n      </v-layout>\n    </v-container>\n  </v-content>\n  <v-footer color=\"blue-grey\" class=\"white--text\" app>\n    <!-- <span> VIDi Labs, University of California, Davis </span>\n    <v-spacer></v-spacer>\n    <span>&copy; 2018</span> -->\n  </v-footer>\n</v-app>\n";

/***/ }),

/***/ "Ogx3":
/***/ (function(module, exports, __webpack_require__) {

const arrayOpts = __webpack_require__("6v4a");
const aggregate = __webpack_require__("4fa2");
const match = __webpack_require__("aQHI");

var query = {};
query.match = match;
query.group = aggregate;

query.indexBy = function(data, id){
    var indexed = {};
    data.forEach(function(d){
        if(!indexed.hasOwnProperty(d[id])){
            indexed[d[id]] = [ d ];
        } else {
            indexed[d[id]].push(d);
        }
        delete d[id];
    });
    return indexed;
};

// query.list = function(data, id) {
//     return data.map(function(d){return d[id];});
// }

query.range = function(data, id) {
    var array = data.map(function(d){return d[id];});
    return [ arrayOpts.min(array), arrayOpts.max(array) ];
};

query.map = function(data, m) {
    var mf = function(d){return d};
    if(typeof m === "string")
        mf = function(d){return d[m]};
    else if(typeof m === "function")
        mf = m;

    return data.map(mf);
};

// Object.keys(arrayOpts).forEach(function(opt) {
//     query[opt] = function(data, id) {
//         var arr = query.map(data, id);
//         return arrayOpts[opt](arr);
//     }
// });



query.sortBy = function(data, spec) {
    function sortArray(a, b, p) {
        return a[p] > b[p] ? 1 : a[p] < b[p] ? -1 : 0;
    }
    return data.sort(function(a, b){
        var r = 0,
            i = 0,
            attributes = Object.keys(spec),
            al = attributes.length;

        while( r === 0 && i < al ) {
            r = sortArray(a, b, attributes[i]) * spec[attributes[i]];
            i++;
        }
        return r;
    })
};

query.orderBy = function(c, s, o) {
    var spec = {};
    s.forEach(function(ss){
        spec[ss] = o;
    });
    return query.sort(c, spec);
};

query.histogram = function(data, spec, max, min) {
    var result = {};
    for(var key in spec) {
        result[key] = arrayOpts.histogram(data.map(function(d){return d[key]}), spec[key], max, min);
    }
    return result;
};

query.binAggregate = function(data, spec) {
    var attrKey = Object.keys(spec)[0],
        attributes = Object.keys(spec).filter(function(k) { return k != "$data" && k!=attrKey;}) || [],
        embedData = spec.$data || false,
        numBin = spec[attrKey],
        array = data.map(function(d){ return d[attrKey]; }),
        l = array.length,
        min = arrayOpts.min(array),
        max = arrayOpts.max(array),
        range = max - min,
        interval = range / numBin,
        bins = [];


    for(var b = 0; b < numBin; b++) {
        bins[b] = {binID: b, rangeBegin: min + range * (b/(numBin)), rangeEnd: min + range*(b+1)/(numBin), count: 0};
        // if(embedData)
            bins[b].data = [];
        // attributes.forEach(function(attr){
        //     bins[b][attr] = 0;
        // })
    }

    // bins[numBin] = [];

    for(var i = 0; i < l; i++) {
        binID = Math.floor( (array[i] - min) / range * (numBin));
        if(binID == numBin) binID--;
        data[i].binID = binID;
        // if(embedData)
            bins[binID].data.push(data[i]);
        // bins[binID].count++;
        // attributes.forEach(function(attr){
        //     bins[binID][attr] += data[i][attr];
        // });
    }

    spec.$by = "binID";
    delete spec[attrKey];

    var result = query.group(data, spec);
    result = query.indexBy(result, "binID");


    // result.forEach(function(r){
    //     r.rangeBegin = bins[r.binID].rangeBegin;
    //     r.rangeEnd = bins[r.binID].rangeEnd;
    // })

    bins.forEach(function(bin){

        if(result.hasOwnProperty(bin.binID)) {
            attributes.forEach(function(attr){
                bin[attr] = result[bin.binID][0][attr];
            });
            if(embedData) bin.data = result[bin.binID][0].data;
        } else {
            attributes.forEach(function(attr){
                bin[attr] = 0;
            });
        }

    })
    // console.log(bins);
    // return result;
    return bins;
}

query.partition = function(data, numPart) {
    var len = data.length,
        p = Math.ceil(len / numPart),
        pid,
        partitions = [];

    for(var b = 0; b < numPart; b++) {
        partitions[b] = {partition: b, data: [], count: 0};
    }

    for(var i = 0; i < len; i++) {
        pid = Math.floor(i / p);
        partitions[pid].data.push(data[i]);
        partitions[pid].count++;
    }

    return partitions;
}

query.partitionBy = function(data, spec) {
    var len = data.length,
        pid,
        partitions = [],
        key = Object.keys(spec)[0],
        parts = spec[key];

    parts.forEach(function(b, bi) {
        partitions[bi] = {partition: bi, data: [], count: 0, name: b};
    })

    for(var i = 0; i < len; i++) {
        pid = parts.indexOf(data[i][key]);
        if(pid>-1){
            partitions[pid].data.push(data[i]);
            partitions[pid].count++;
        }
    }
    return partitions;
}

query.normalize = function(data, fields) {
    var hash = {};

    fields.forEach(function(f){
        var array = data.map(function(d){ return d[f]; });
        hash[f] = arrayOpts.normalize(array);
    });

    data.forEach(function(d, i){
        fields.forEach(function(f){
            d[f] = hash[f][i];
        });
    });

    return data;
}

query.toColumnArray = function(data) {
    var columnArray = [];
        attributes = Object.keys(data[0]).filter(function(k) { return k; });

    attributes.forEach(function(attr){
        columnArray.push(data.map(function(d){return d[attr];}));
    });

    columnArray.fields = attributes;

    attributes.forEach(function(attr, ai){
        columnArray[attr] = columnArray[ai];
    });

    return columnArray;
}

module.exports = query;


/***/ }),

/***/ "OxvU":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__utils__ = __webpack_require__("aVvh");


/* harmony default export */ __webpack_exports__["a"] = (function ({
  timesteps = 128,
  series = 8,
  interval = 1,
  props,
  label = {time: 'timestamp', series: 'sid'}
}) {
  let dsize = timesteps * series;
  let data = new Array(dsize);
  for(let i = 0; i < timesteps; i++) {
    for(let j = 0; j < series; j++) {
      let record = {};
      record[label.time] = i * interval;
      record[label.series] = j;
      for(let prop of props) {
          if(prop.hasOwnProperty('values')){
              let vid = parseInt( Math.round( Math.random() * (prop.values.length - 1) ) );
              record[prop.name] = prop.values[vid];
          } else {
              let value = Object(__WEBPACK_IMPORTED_MODULE_0__utils__["a" /* boundedRandom */])(prop);
              record[prop.name] = (prop.dtype == 'float') ? parseFloat(value) : Math.round(value);
          }
      }
      data[i * series + j] = record;
    }
  }

  let schema = {};
  schema[label.time] = 'int';
  schema[label.series] = 'float';
  for(let prop of props) {
      schema[prop.name] = prop.dtype;
  }

  return {
    data,
    schema
  }
});

/***/ }),

/***/ "Pglu":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";

// EXTERNAL MODULE: ./node_modules/d3-scale/src/index.js + 48 modules
var src = __webpack_require__("dJjO");

// EXTERNAL MODULE: ./node_modules/d3-scale-chromatic/src/index.js + 42 modules
var d3_scale_chromatic_src = __webpack_require__("u6Xv");

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/picos/src/colors.js



function mapColor(colors, colorDomain) {
    var getColor;
    if(typeof colors == 'function') {
        getColor = colors;
    } else if(typeof colors == 'string') {
        var getRange = Object(src["a" /* scaleLinear */])().domain(colorDomain).range([0, 1]);
        getColor = function(value) {
            if(typeof d3_scale_chromatic_src['interpolate' + colors] == 'function') {
                return d3_scale_chromatic_src['interpolate' + colors](getRange(value));
            } else {
                return '#000000';
            }
        }
        getColor.domain = function(d) {
            getRange = Object(src["a" /* scaleLinear */])().domain(d).range([0, 1]);
            return getRange;
        }
    } else {
        getColor =  Object(src["a" /* scaleLinear */])()
            .domain(colorDomain)
            .range(colors);
    }
    return getColor;
}
// EXTERNAL MODULE: ./node_modules/d3-chord/src/index.js + 5 modules
var d3_chord_src = __webpack_require__("s5jH");

// EXTERNAL MODULE: ./node_modules/d3-shape/src/index.js + 50 modules
var d3_shape_src = __webpack_require__("1gFY");

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/picos/src/chord.js




// import {arc as d3Arc} from 'd3-arc';

function Chord(arg) {
    let options = arg || {},
        container = options.container || "body",
        data = options.data,
        vmap = options.vmap,
        radius = options.radius || 100,
        padding = options.padding || 0.1,
        ignoreDiagonal = options.ignoreDiagonal || false,
        colorDomain = options.colorDomain || null,
        colors = options.colors || ['steelblue', 'red'],
        hover = options.hover || function(d) {};

    let chord = Object(d3_chord_src["a" /* chord */])().padAngle(padding)
        // .sortSubgroups(d3Chord.descending)

    let matrix = {};
    matrix.size = data.map((rows, i) => {
        return rows.map((row, j) => {
            return  (i == j) ? 1 * ((ignoreDiagonal) ? 0 : 1) : 1;
        });
    });

    matrix.color =  data.map((rows, i) => {
        return rows.map((row, j) => {
            return (i == j) ? row * ((ignoreDiagonal) ? 0 : 1) : row;
        });
    });

    let colorValues = [];
    matrix.color.forEach((row) => { colorValues = colorValues.concat(row)});
    colorValues = colorValues.filter(d => d !== 0)

    let chords = chord(matrix.size);

    if(colorDomain === null) {
        colorDomain = [Math.min.apply(null, colorValues), Math.max.apply(null, colorValues)];
    }

    let interpolateColor = mapColor(colors, colorDomain);

    let getColor = function(d) {
        console.log(d)
        let send = matrix.color[d.source.index][d.target.index];
        let recv = matrix.color[d.target.index][d.source.index];
        return interpolateColor(Math.max(send, recv));
    } 
    let svg = container;
    let links;

    if(chords.groups.length < 10) {
        let core = svg.append("g")
            .attr("class", "chord")
            .selectAll("path")
            .data(chords)
            .enter();

        links = core.append("path").attr("class", "ribbons")
            .attr("d", Object(d3_chord_src["b" /* ribbon */])().radius(radius))
            .style("fill",  getColor)
            .style("stroke", "#FFF")
            .style("opacity", 1);
    } else {
        let line = Object(d3_shape_src["f" /* lineRadial */])()
            .curve(d3_shape_src["d" /* curveBundle */].beta(0.5))
            .radius(d => d.radius)
            .angle(d => { return d.angle})

        let linkData = chords.map((conn) => {
            let source = chords.groups[conn.source.index];
            let sourceAngle = source.startAngle + (source.endAngle - source.startAngle) / 2;
            let target = chords.groups[conn.target.index];
            let targetAngle = target.startAngle + (target.endAngle - target.startAngle) / 2;
            return {
                points: [
                    {angle: sourceAngle, radius},
                    {angle: 0, radius: 0, link: conn}, // curve midpoint
                    {angle: targetAngle, radius}
                ], 
                link: conn 
            } 
        })

        links = svg.append("g")
            .selectAll(".links")
            .data(linkData)
            .enter().append('path')
            .attr('class', 'link')
            .attr('d', d => line(d.points))
            .attr('fill', 'none')
            .style("stroke-width", 2)
            .style("stroke", d => getColor(d.link))
    }

    chords.colorDomain = colorDomain;
    chords.updateColor = function(colorDomain) {
        chords.colorDomain = colorDomain;
        interpolateColor.domain(colorDomain);
        links.style("fill", getColor);
    }
    return chords;
}
// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/picos/src/text.js
function Text(arg) {
    var options = arg || {},
        container = options.container || "body",
        data = options.data,
        prefix = options.prefix || '',
        radius = options.radius || 200,
        color = options.color || '#000000',
        groups = options.groups || [],
        hover = options.hover || function(d) {};

    function textTransform(d) {
        var offset = (d.startAngle + (d.endAngle - d.startAngle)/2);
        return (offset > Math.PI/2 && offset < 1.5*Math.PI) ? "rotate(270)" :"rotate(90)";
    }

    function textRotate(d) {
        var offset = (d.startAngle + (d.endAngle - d.startAngle)/2);
        return "rotate(" + (offset * 180 / Math.PI - 90)
            + ")translate(" + (radius+5) + ",0)";
    }

    var groupLabel = container.append("g").selectAll("groupLabel")
            .data(groups)
            .enter().append("g")
            .attr("transform", textRotate);

    groupLabel.append("text")
        .style("font-size", "0.9em")
        .style("text-anchor", "middle")
        .attr("dy", ".35em")
        .attr("transform",  textTransform)
        .text(function(d, i) { return  prefix + data[i]; });

    return groupLabel;
}


// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/picos/src/stats.js
function stats_stats(data, fields){

    if(!Array.isArray(data))
        throw new Error("Inproper input data format.");

    var result = {};

    fields.forEach(function(f) {
        var a = data.map(function(d){return d[f]; });
        result[f] = {
            min: Math.min.apply(null, a),
            max: Math.max.apply(null, a)
        };
    });

    return result;
};
// EXTERNAL MODULE: ./node_modules/d3-selection/src/index.js + 49 modules
var d3_selection_src = __webpack_require__("sHXk");

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/picos/src/rect.js


 



function rect_bars(arg) {
    var options = arg || {},
        container = options.container || "body",
        data = options.data,
        vmap = options.vmap,
        width = options.width || 800,
        height = options.height || width,
        outerRadius = options.outerRadius || Math.min(width/2, height/2),
        innerRadius = options.innerRadius || outerRadius / 4,
        padding = options.padding || 0.05,
        domain = options.domain || null,
        colorDomain = options.colorDomain || null,
        stats = options.stats || null,
        tooltip = options.tooltip || function() {},
        colors = options.colors || ['white', 'steelblue'],
        
        hover = options.hover || function(d) {};

    var getSize = function() { return outerRadius; },
        getColor = (typeof colors === 'function') ? colors : function() { return colors[0]};

    if(stats === null) {
        stats = stats_stats(data, Object.keys(vmap).map(function(k){ return vmap[k]; }));
    }

    if(vmap.color && typeof(colors) != 'function') {
        if(colorDomain === null) {
            if(stats[vmap.color].max == stats[vmap.color].min) stats[vmap.color].max+=0.000001;
            colorDomain = [stats[vmap.color].min, stats[vmap.color].max];
        }
        if(typeof colors == 'function') {
            getColor = colors;
        } else if(typeof colors == 'string') {
            var getRange = Object(src["a" /* scaleLinear */])().domain(colorDomain).range([0, 1]);
            getColor = function(value) {
                if(typeof d3_scale_chromatic_src['interpolate' + colors] == 'function') {
                    return d3_scale_chromatic_src['interpolate' + colors](getRange(value));
                } else {
                    return 'steelblue';
                }
            }
        } else {
            getColor = Object(src["a" /* scaleLinear */])()
                .domain(colorDomain)
                .range(colors);
        }
    }

    if(vmap.size) {
        getSize =  Object(src["c" /* scalePow */])().exponent(0.9)
            .domain([stats[vmap.size].min, stats[vmap.size].max])
            .range([innerRadius, outerRadius]);
    }

    function createArc(d) {
        return Object(d3_shape_src["a" /* arc */])()
            .innerRadius(innerRadius)
            .outerRadius(getSize(d[vmap.size]))
            (d);
    }


    var bars = container.append("g").selectAll(".bar")
        .data(data)
        .enter()


    var marks = bars.append("path").attr("class", "bars")
        .attr('class', 'bars')
        .style("fill", function(d) { return getColor(d[vmap.color]); })
        // .style("stroke", function(d) { return getColor(d[vmap.color]); })
        .style("stroke", '#000')
        .style("stroke-width", 0)
        // .style("fill-opacity", function(d){return getOpacity(d[opacityAttr])})
        .attr("d", createArc)
        .on("mouseover", function(d){
            let pos = this.getBBox();
            Object(d3_selection_src["a" /* select */])(this).style('stroke-width', 2)
            tooltip.show(pos, d)
        })
        .on("mouseout", function() {
            tooltip.hide();
            Object(d3_selection_src["a" /* select */])(this).style('stroke-width', 0)
        }); 

    bars.colorDomain = colorDomain;
    bars.updateColor = function(colorDomain) {
        bars.colorDomain = colorDomain;
        getColor.domain(colorDomain);
        marks.style("fill", function(d) { return getColor(d[vmap.color]); })
    }

    return bars;
}
// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/picos/src/scatter.js


function scatter_scatter(arg) {
    var options = arg || {},
        container = options.container || "body",
        data = options.data,
        vmap = options.vmap,
        width = options.width || 800,
        height = options.height || width,
        outerRadius = options.outerRadius || Math.min(width/2, height/2),
        innerRadius = options.innerRadius || outerRadius / 4,
        padding = options.padding || 0.05,
        domain = options.domain || null,
        colorDomain = options.colorDomain || null,        
        stats = options.stats || null,
        colors = options.colors || ['white', 'steelblue'],
        hover = options.hover || function(d) {};

    var scatter = {};
    var getSize = function() { return 5; },
        getPosX = function() { return 0; },
        getPosY = function() { return 0; },
        getColor = (typeof colors === 'function') ? colors : function() { return colors[0]};

    if(stats === null) {
        stats = stats_stats(data, Object.keys(vmap).map(function(k){ return vmap[k]; }));
    }
    if(vmap.color && typeof(colors) != 'function') {
        if(colorDomain === null) {
            if(stats[vmap.color].max == stats[vmap.color].min) stats[vmap.color].max+=0.000001;
            colorDomain = [stats[vmap.color].min, stats[vmap.color].max];
        }

        if(typeof colors == 'function') {
            getColor = colors;
        } else if(colors == 'string') {
            var getRange = d3.scale.linear().domain(colorDomain).range([0, 1]);
            getColor = function(value) {
                if(typeof colorScales['interpolate' + colors] == 'function') {
                    return colorScales['interpolate' + colors](getRange(value));
                } else {
                    return 'steelblue';
                }
            }
        } else {
            getColor =  d3.scale.linear()
                .domain(colorDomain)
                .range(colors);
        }
    }

    if(vmap.x) {
        var xScale = d3.scale.linear()
        .domain([stats[vmap.x].min, stats[vmap.x].max]);

        getPosX = function(d) {
            var v = xScale.range([ d.startAngle, d.endAngle])(d[vmap.x]);
            return v;
        }
    }

    if(vmap.y) {
        getPosY = d3.scale.linear()
            .domain([stats[vmap.y].min, stats[vmap.y].max])
            .range([innerRadius, outerRadius]);
    }

    function createArc(d) {
        return d3.svg.arc()
            .innerRadius(innerRadius)
            .outerRadius(getSize(d[vmap.size]))
            (d);
    }

    var visualElement = container.append("g").selectAll(".dot")
        .data(data)
        .enter().append("circle")
        .attr("class", "dot")
        .attr("r", function(d){return getSize(d[vmap.size])})
        .attr("cx", function(d){return getPosY(d[vmap.y]) * Math.cos(getPosX(d))})
        .attr("cy",function(d){return getPosY(d[vmap.y]) * Math.sin(getPosX(d))})
        .style("fill", function(d){return getColor(d[vmap.color])});

    scatter.colorDomain = colorDomain;
    scatter.updateColor = function(colorDomain) {
        scatter.colorDomain = colorDomain;
        getColor.domain(colorDomain);
        visualElement.style("fill", function(d) { 
            return getColor(d[vmap.color]); 
        })
    }

    return scatter;
}


// EXTERNAL MODULE: ./node_modules/d3-format/src/index.js + 15 modules
var d3_format_src = __webpack_require__("F+za");

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/picos/src/colorlegend.js




var gradientID = 0;
function colorLegend({
    container = null,
    width = 200,
    height = 20,
    pos = [0, 0],
    padding = {left: 25, right: 25, top: 20, bottom: 0},
    colors = ['#eee', 'steelblue'],
    domain = ['min', 'max'],
    noLabel = false,
    format = Object(d3_format_src["a" /* format */])('.2s'),
    title = ''
}){
    width -= padding.left + padding.right;
    height -= padding.top + padding.bottom;
    
    let legend;
    if(container === null) {
        legend = Object(d3_selection_src["a" /* select */])(document.createElementNS('http://www.w3.org/2000/svg', 'svg'));
        legend.attr("width", width).attr("height", height);
    } else {
        legend = container;
        if(typeof container.appendChild === 'function') {
            container.appendChild(legend);
        } else if(typeof container === 'string') {
            document.getElementById(container).appendChild(legend);
        }
    } 
       
    function linearGradient(colors) {
        let gradient = legend.append("defs")
            .append("linearGradient")
                .attr("id", "gradlegend" + gradientID)
                .attr("x1", "0%")
                .attr("x2", "100%")
                .attr("y1", "0%")
                .attr("y2", "0%");

        if(Array.isArray(colors)) {
            colors.forEach(function(c, i){
                gradient.append("stop")
                    .attr("offset", i / colors.length )
                    .attr("stop-color", c);
            });
        } else if(typeof colors == 'string' ) {
            if(typeof d3_scale_chromatic_src['interpolate' + colors] == 'function') {
                for(var i = 0; i < 128; i++) {
                    gradient.append("stop")
                    .attr("offset", i / 128 )
                    .attr("stop-color", d3_scale_chromatic_src['interpolate' + colors](i/128));
                }
            }
        }

        return gradientID++;
    }

    var rect = legend.append("g");
    rect.attr('transform', 'translate(' + padding.left + ', ' + padding.right + ')')
        .append("rect")
        .attr("x", pos[0])
        .attr("y", pos[1])
        .attr("width", width-padding.left)
        .attr("height", height)
        .style("fill","url(#gradlegend" + linearGradient(colors) + ")");

    if(!noLabel) {
        rect.append("text")
            .attr("x", pos[0])
            .attr("y", pos[1] + height/2 + 5)
            .style("fill", "#222")
            .style("text-anchor", 'end')
            // .style("font-size", ".9em")
            .text(format(domain[0]) || 0);

        rect.append("text")
            .attr("x", pos[0] + width - padding.left)
            .attr("y", pos[1] + height/2 + 5)
            .style("fill", "#222")
            .style("text-anchor", 'begin')
            // .style("font-size", ".9em")
            .text(format(domain[1]) || 'max');
    }

    if(title) {
        rect.append("g")
            .append("text")
            .attr("y", pos[1] - height/2 - 5)
            .attr("x", pos[0] + width/2 - 5)
            .attr("dy", "0.7em")
            .style("text-anchor", "middle")
            .style("font-size", "0.7em")
            .text(title);
    }

    return legend;
}
// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/picos/src/main.js
/* harmony export (immutable) */ __webpack_exports__["a"] = Picos;








function getExtent(data, field) {
    var tuple = data.map(function (d) {
        return d[field];
    });
    var min = Math.min.apply(null, tuple);
    var max = Math.max.apply(null, tuple);
    if (max == min) max += 1e-4;

    return [min, max];
}

function Picos(spec) {
    let layers = spec.layers;
    let rings = new Array(layers.length);

    var config = spec.config;
    var width = config.width || 800;
    var height = config.height || width;
    var padding = config.padding || 10;
    var outerRadius = config.outerRadius || Math.min(width / 2, height / 2);
    var innerRadius = config.innerRadius || Math.min(width / 4, height / 4);
    var container = config.container || "body";
    var parentRing = container;
    var chartTitle = config.chartTitle || false;
    var colorDomains = config.colorDomains || [];
    var groups = [];

    outerRadius -= padding;

    
    var offset = Math.min((width / 2), (height / 2));
    var baseSVG = Object(d3_selection_src["a" /* select */])(container).append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + offset + "," + offset + ")");

    var cirRange = outerRadius - innerRadius - padding,
        cirOffset = innerRadius,
        sectionRadius = cirOffset,
        cirSize = layers
        .map(function (layer) {
            return layer.size;
        })
        .reduce(function (a, b) {
            return a + b;
        });

    var tipBox;    
    var tip = null;
    let tipTextBox;
    let tipTexts = [];
    
    let tooltip = {
        show(pos, dataItem) {
            if (tip === null) {
                tip = tipBox.append('rect')
                    .attr("class", "tooltip")
                    .attr('fill', '#EEE')
                    .attr('stroke', '#222')
                    .attr('width', 100)
                    .attr('height', 50)
                    .style("opacity", 0);

                tipTextBox = tipBox.append('text')
                    .attr('x', 10)
                    .attr('y', 10)
            }
            tip.style("opacity", .9)
            tipBox.attr('transform', 'translate (' +  [pos.x + pos.width, pos.y + pos.height].join(',') + ')')

            let texts = Object.entries(dataItem).slice(0, 10)
            texts.forEach((text, i) => {
                let label = tipTextBox.append('tspan')
                    .attr('y', i * 15)
                    .attr('x', 15)
                    .attr('dy', 20)
                    .text(text.join(': '));
                tipTexts.push(label)
            })
            let textBBox = tipTextBox.node().getBBox();
            tip.attr('width', textBBox.width + 15*2)
                .attr('height', textBBox.height + 15*2)
 
        },

        hide () {
            tip.style("opacity", .0)
            tipTexts.forEach((t) => t.remove())
        }
    }

    layers.forEach(function (layer, li) {
        var sectionRadiusRange = cirOffset + layer.size / cirSize * cirRange,
            cirPadding = 0.05 * sectionRadiusRange,
            sectionRadius = sectionRadiusRange,
            colorDomain = ['min', 'max'];

        var colors = layer.colors;
        var getColor;

        if (layer.type == 'link') {
            let linkOption = Object.assign({
                container: baseSVG,
                radius: cirOffset,
                colorDomain: colorDomains[li],
            }, layer)
            rings[li] = Chord(linkOption);
            parentRing = rings[li];
            groups = parentRing.groups;
            colorDomain = rings[li].colorDomain;
            
        } else if (layer.type == 'text') {
            layer.container = baseSVG;
            layer.radius = cirOffset;
            layer.groups = groups;
            rings[li] = Text(layer);
            cirOffset = sectionRadius + cirPadding;
        } else {

            var dataItems = [];
            groups.forEach(function (chord, ci) {
                var delta = (chord.endAngle - chord.startAngle) / layer.data[ci].length;
                layer.data[ci].forEach(function (d, di) {
                    var start = chord.startAngle + di * delta;
                    d.startAngle = start;
                    d.endAngle = start + delta;
                    d.index = chord.index;
                })
                dataItems = dataItems.concat(layer.data[ci]);
            })

            colorDomain = (Array.isArray(colorDomains[li])) ? colorDomains[li] : getExtent(dataItems, layer.vmap.color);

            getColor = mapColor(layer.colors || ['red', 'steelblue'], colorDomain);

            var plot;
            if (layer.type == 'circle') {
                plot = scatter_scatter;
            } else {
                plot = rect_bars;
            }

            rings[li] = plot({
                container: baseSVG,
                data: dataItems,
                innerRadius: cirOffset,
                outerRadius: sectionRadius,
                colors: getColor,
                colorDomain: colorDomain,
                tooltip: tooltip,
                vmap: layer.vmap || layer.encoding,
            });

            cirOffset = sectionRadius + cirPadding;

        }

        if (layer.type !== 'text' && layer.vmap) {
            if (config.legend) {
                if (rings[li].colorDomain) colorDomain = rings[li].colorDomain;
                colorLegend({
                    container: baseSVG,
                    colors: layer.colors,
                    height: Math.min(50, outerRadius / 2 / rings.length),
                    width: (width / 2 - outerRadius / 2 - padding) * 0.9,
                    title:  (layer.vmap) ? layer.vmap.color : null,
                    domain: colorDomain,
                    pos: [
                        width / 2 - (width / 2 - outerRadius / 2 - padding) * 0.9,
                        outerRadius / 2 + outerRadius / 2 / (rings.length) * li]
                })
            }
        }

        if (chartTitle) {
            baseSVG.append("text")
                .style("font-size", "1.1em")
                .style("text-anchor", "middle")
                .attr("x", 0)
                .attr("y", height / 2 - 15)
                .text(function (d, i) {
                    return chartTitle
                });
        }

        tipBox = baseSVG.append('g')
    });

    rings.createColorLegend = function (options) {
        var svg = Object(d3_selection_src["a" /* select */])(options.container).append('svg')
            .attr('width', options.width).attr('height', options.height);

        layers.forEach(function (layer, li) {
            if (layer.type == 'text') return;
            var colorDomain = (options.colorDomains) ? options.colorDomains[li] : rings[li].colorDomain;
            colorLegend({
                container: svg,
                colors: layer.colors,
                height: options.height / (layers.length - 1),
                width: options.width,
                title: layer.project + ' (' + ((layer.vmap) ? layer.vmap.color : null) + ')',
                domain: colorDomain,
                padding: options.padding,
                pos: [0, options.height / (layers.length - 1) * li]
            });
        });
    }

    rings.updateColor = function (colorDomains) {
        rings.forEach(function (ring, ri) {
            if (layers[ri].type !== 'text') {
                ring.updateColor(colorDomains[ri]);
            }
        })
    }
    return rings;
}

/***/ }),

/***/ "U/Ny":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__utils__ = __webpack_require__("aVvh");


let educations = ['High School', 'Some College', 'AA/AS', 'Bachelor', 'Master', 'Doctorate']
let races = ['White', 'Asian', 'Black', 'Mixed'];

let dataProps = [
    {name: 'BabyMonth', dtype: 'int', dist: 'uniform', min: 0, max: 12},
    {name: 'BabyGender', dtype: 'string', values: ['F', 'M']},
    {name: 'BabyWeight', dtype: 'float', dist: 'normal', min: 2, max: 20, mean: 7, std: 2},
    {name: 'MotherAge', dtype: 'int', dist: 'normal', min: 16, max: 70, mean: 30, std: 10},
    {name: 'MotherRace', dtype: 'string', values: races},
    {name: 'MotherStatus', dtype: 'string', values: ['Married', 'Unmarried']},
    {name: 'MotherEdu', dtype: 'string', values: educations},
    {name: 'MotherHeight', dtype: 'float', dist: 'normal', min: 120, max: 220, mean: 168, std: 20},
    {name: 'MotherWeight', dtype: 'float', dist: 'normal', min: 50, max: 290, mean: 100, std: 50},
    {name: 'MotherWgtGain', dtype: 'float', dist: 'normal', min: 0, max: 100, mean: 30, std: 10},
    {name: 'FatherAge', dtype: 'int', dist: 'normal', min: 16, max: 90, mean: 32, std: 10},
    {name: 'FatherRace', dtype: 'string', values: races},
    {name: 'FatherEdu', dtype: 'string', values: educations}
];

let schema = {};
for(let prop of dataProps) {
    schema[prop.name] = prop.dtype;
}

/* harmony default export */ __webpack_exports__["a"] = (function(n) {
    return {
        data: Object(__WEBPACK_IMPORTED_MODULE_0__utils__["b" /* randomJSONs */])({props: dataProps, size: n}),
        schema: schema
    }
});

/***/ }),

/***/ "U7xf":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global, module) {/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__src_main__ = __webpack_require__("Pglu");


var root = typeof self == 'object' && self.self === self && self ||
           typeof global == 'object' && global.global === global && global ||
           this;

root.picos = __WEBPACK_IMPORTED_MODULE_0__src_main__["a" /* default */];

/* harmony default export */ __webpack_exports__["a"] = (__WEBPACK_IMPORTED_MODULE_0__src_main__["a" /* default */]);

if(typeof module != 'undefined' && module.exports)
    module.exports = __WEBPACK_IMPORTED_MODULE_0__src_main__["a" /* default */];
/* WEBPACK VAR INJECTION */}.call(__webpack_exports__, __webpack_require__("DuR2"), __webpack_require__("f1Eh")(module)))

/***/ }),

/***/ "UL+f":
/***/ (function(module, exports, __webpack_require__) {

var array = __webpack_require__("6v4a");

function stats(data, fields){

    if(!Array.isArray(data))
        throw new Error("Inproper input data format.");

    var result = {};

    fields.forEach(function(f) {
        var a = data.map(function(d){return d[f]; });
        result[f] = {
            min: array.min(a),
            max: array.max(a),
            avg: array.avg(a),
            std: array.std(a)
        };
    });

    return result;
};


stats.domains = function(data, fields) {
    if(!Array.isArray(data))
        throw new Error("Inproper input data format.");

    var result = {};

    fields.forEach(function(f) {
        var a = data.map(function(d){return d[f]; });
        result[f] = [ array.min(a), array.max(a) ];
    });

    return result;
}

module.exports = stats;


/***/ }),

/***/ "VXnA":
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),

/***/ "XLO3":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* unused harmony export reduce */
/* unused harmony export avg */
/* unused harmony export normalize */
/* harmony export (immutable) */ __webpack_exports__["a"] = seq;
/* unused harmony export scan */
/* unused harmony export iscan */
/* unused harmony export diff */
/* unused harmony export intersect */
/* harmony export (immutable) */ __webpack_exports__["b"] = unique;
/* unused harmony export lcm */
/* unused harmony export stats */
/* unused harmony export histogram */
/* unused harmony export variance */
/* unused harmony export std */
/* unused harmony export vectorAdd */
/* unused harmony export vectorSum */
/* unused harmony export vectorAvg */
function _reduce(array, opt) {
    var i,
        len = array.length,
        fn,
        result;

    if (!len) return 0;

    switch (opt) {
        case "max":
            result = array.reduce(function(a, b) {
                return (a > b) ? a : b;
            });
            break;
        case "min":
            result = array.reduce(function(a, b) {
                return (a < b) ? a : b;
            });
            break;
        case "and":
        case "&":
            result = array.reduce(function(a, b) {
                return a & b;
            });
            break;
        case "or":
        case "|":
            result = array.reduce(function(a, b) {
                return a | b;
            });
            break;
        case "mult":
        case "*":
            result = array.reduce(function(a, b) {
                return a * b;
            });
            break;
        default: // "sum" or "+"
            result = array.reduce(function(a, b) {
                return a + b;
            });
            break;
    }

    return result;
}

function reduce(opt) {
    return function(array) {
        var a = (array instanceof Array) ? array : Array.apply(null, arguments);
        return _reduce(a, opt);
    };
};

function avg(array) {
    return _reduce(array, "+") / array.length;
    // return array.reduce(function(a,b){ return 0.5 * (a + b)});
};

function normalize(array) {
    var max = _reduce(array, "max"),
        min = _reduce(array, "min"),
        range = max - min;

    return array.map(function(a) {
        return (a - min) / range;
    });
}

function seq(start, end, intv) {
    var interval = intv || 1,
        array = [];

    for (var i = start; i <= end; i += interval)
        array.push(i);

    return array;
};

// ["max", "min", "mult", "and", "or"].forEach(function(f) {
//     array[f] = array.reduce(f);
// });

// export sum = array.reduce("+");

function scan(a) {
    var pfsum = [],
        accum = 0;

    for (var i = 0; i < a.length; i++) {
        accum += a[i];
        pfsum.push(accum);
    }

    return pfsum;
};

function iscan(a) {
    return array.scan([0].concat(a));
};

function diff(a, b) {
    var difference = [];
    a.forEach(function(d) {
        if (b.indexOf(d) === -1) {
            difference.push(d);
        }
    });
    return difference;
};

function intersect(a, b) {
    var t;
    if (b.length > a.length) t = b, b = a, a = t; // indexOf to loop over shorter
    return a.filter(function(e) {
        if (b.indexOf(e) !== -1) return true;
    });
};

function unique(a) {
    return a.reduce(function(b, c) {
        if (b.indexOf(c) < 0) b.push(c);
        return b;
    }, []);
};

function lcm(A) {
    var n = A.length,
        a = Math.abs(A[0]);
    for (var i = 1; i < n; i++) {
        var b = Math.abs(A[i]),
            c = a;
        while (a && b) {
            (a > b) ? a %= b: b %= a;
        }
        a = Math.abs(c * A[i]) / (a + b);
    }
    return a;
};

function stats(array) {
    return {
        max: _reduce(array, "max"),
        min: _reduce(array, "min"),
        avg: array.avg(array)
    };
};

function histogram(array, numBin, _max, _min) {
    var l = array.length,
        min = (typeof(_min) == 'number') ? _min : _reduce(array, "min"),
        max = (typeof(_max) == 'number') ? _max : _reduce(array, "max"),
        range = max - min,
        interval = range / numBin,
        bins = [],
        // ids = [],
        hg = new Array(numBin + 1).fill(0);

    for (var b = 0; b < numBin; b++) {
        bins.push([min + range * (b / (numBin)), min + range * (b + 1) / (numBin)]);
        // ids[b] = [];
    }

    // ids[numBin] = [];

    for (var i = 0; i < l; i++) {
        binID = Math.floor((array[i] - min) / range * (numBin));
        hg[binID]++;
        // ids[binID].push(i);
    };

    hg[numBin - 1] += hg[numBin];
    // ids[numBin-1] = ids[numBin-1].concat(ids.pop());
    return {
        bins: bins,
        counts: hg.slice(0, numBin),
        // ids: ids
    };
}

function variance(rowArray) {
    var m = _reduce(rowArray, "+") / rowArray.length,
        va = rowArray.map(function(a) {
            return Math.pow(a - m, 2)
        });

    return _reduce(va, "+") / (rowArray.length - 1);
}

function std(rowArray) {
    return Math.sqrt(array.var(rowArray));
}

function vectorAdd(a, b) {
    var c = [];
    a.forEach(function(v, i) {
        c[i] = v + b[i];
    });

    return c;
}

function vectorSum(vectors) {
    var result = vectors[0],
        numberOfVectors = vectors.length;

    for (var i = 1; i < numberOfVectors; i++) {
        result = array.vectorAdd(result, vectors[i]);
    }

    return result;
}

function _vectorAvg(a, b) {
    var c = [];
    a.forEach(function(v, i) {
        c[i] = (v + b[i]) * 0.5;
    });

    return c;
}

function vectorAvg(vectors) {
    var result = vectors[0],
        numberOfVectors = vectors.length;

    for (var i = 1; i < numberOfVectors; i++) {
        result = _vectorAvg(result, vectors[i]);
    }

    return result;
}


/***/ }),

/***/ "Xxjy":
/***/ (function(module, exports, __webpack_require__) {

var $ = __webpack_require__("6v4a");

module.exports = function(data, spec){
    if(!Array.isArray(data))
        throw new Error("Inproper input data format.");

    if(typeof(spec) === "function") {
        data.forEach(spec);
    } else {
        var result = [],
            tranfs = {};

        Object.keys(spec).forEach(function(s){
            if(typeof(spec[s]) == "function") {
                tranfs[s] = function(d) { d[s] = spec[s](d) };
            } else {
                tranfs[s] = Function("attr", "attr." + s + "=" + spec[s].replace(/@/g, 'attr.').replace(/\$/g, '$.') + ";");
            }
        });

        data.forEach(function(d){
            Object.keys(spec).forEach(function(s){
                tranfs[s](d);
            });
        });
    }

    return data;
}


/***/ }),

/***/ "Y1y4":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
 
class Transpiler {
  constructor(attributes, categories) {
   this.attributes = attributes
  }

  transpile (rules) {
    let spec = []
    for (let rule of rules) {
      let opt = Object.keys(rule)[0]
      if(opt == '$aggregate') {
        spec.push({$aggregate: this.aggregate(rule[opt])})
      } else if(opt == '$visualize') {
        spec.push({$visualize: this.visualize(rule[opt])})
      }
      else {
        spec.push(Object.assign({}, rule))
      }
    }
    return spec
  }

  aggregate (rule) {
    let includes = rule.$include || this.attributes
    let excludes = rule.$exclude || []
    let calculates = rule.$calculate || []
    let fields = includes.filter(attr => excludes.indexOf(attr) === -1)
    let collection = {}

    for (let opt of calculates) {
      if (opt === 'count') {
        collection['count'] = {$count: '*'}
      } else {
        fields.forEach( field => {
          let metric = [opt, field].join('.');
          collection[metric] = {}
          collection[metric]['$'+opt] = field
        })
      }
    }
    return Object.assign({$collect: collection}, rule)
  }


  visualize (rule) {
    let facets = rule.facets || rule.facet

    if (facets === undefined) return rule

    let rows = facets.rows || facets.row
    let columns = facets.columns || facets.column
    let spec = rows || columns
    let key = spec.key || spec.name
    let values = spec.values || []
    let encodings = Object.keys(rule).filter(k => k !== 'facets')

    let variables = Object.keys(spec)

    let minLoopCount = Math.min(...variables.map(v => spec[v].length))

    let vmaps = new Array(minLoopCount)
    for(let i = 0; i < minLoopCount; i++) {
      let vmap = {}
      encodings.forEach(code => {
        let vi = variables.indexOf(rule[code])
        if(vi < 0) {
          vmap[code] = rule[code]     
        } else {
          vmap[code] = spec[variables[vi]][i]
        }
      })
      vmaps[i] = vmap
    }
    vmaps.facets = facets
    vmaps.order = facets.order
    vmaps.sortBy = facets.sortBy
    return vmaps
  }
}
/* harmony export (immutable) */ __webpack_exports__["a"] = Transpiler;



/***/ }),

/***/ "aQHI":
/***/ (function(module, exports) {

module.exports = function match(data, spec) {
    var indexes = data[0];

    if(!Array.isArray(indexes)) indexes = [];

    return data.filter(function(a){
        if(_match(a, spec, indexes)) return a;
    });
};

function _match(obj, spec, indexes){
    var match,
        opt,
        index,
        sat = true,
        keys = Object.keys(spec);

    keys.forEach(function(key){
        if(key === "$not") {
            match = !_match(obj, spec[key], indexes);
        } else if(key == "$or" || key == "$and" ) {
            match = (key == "$and");
            spec[key].forEach(function(s){
                match = (key == "$and") ? match & _match(obj, s, indexes) : match | _match(obj, s, indexes);
            });
        } else {
            index = (indexes.length > 0) ? indexes.indexOf(key) : key;

            if(typeof spec[key] === 'object'){
                opt = Object.keys(spec[key])[0];

                if(opt[0] == "$" && spec[key][opt] instanceof Array){
                    if(opt == "$in" || opt == "$nin"){
                        match = ((opt == "$nin") ^ (spec[key][opt].indexOf(obj[index]) > -1));
                    } else if(opt == "$inRange"){
                        match =(obj[key] >= spec[key][opt][0] & obj[index] <= spec[key][opt][1]);
                    } else if(opt == "$ninRange"){
                        match =(obj[key] < spec[key][opt][0] | obj[index] > spec[key][opt][1]);
                    } else if(opt == "$inDate"){
                        match = (spec[key][opt].map(Number).indexOf(+(obj[index])) > -1);
                    }
                } else if(spec[key] instanceof Array) {
                    match =(obj[key] >= spec[key][0] & obj[index] <= spec[key][1]);
                }
            } else {
                if(spec[key][0] === "$") {
                    match = (obj[spec[key].slice(1)] === obj[index]);
                } else {
                    match = (spec[key] == obj[index]);
                }
            }
        }
        sat = sat & match;
    });

    return sat;
}


/***/ }),

/***/ "aVvh":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = boundedRandom;
/* unused harmony export randomColumns */
/* harmony export (immutable) */ __webpack_exports__["b"] = randomJSONs;
/* unused harmony export validate */
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_chai__ = __webpack_require__("tyws");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_chai___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0_chai__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_jStat__ = __webpack_require__("0BPL");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_jStat___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_jStat__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__src_cstore__ = __webpack_require__("6Ric");





let equal = __WEBPACK_IMPORTED_MODULE_0_chai__["assert"].equal;
let closeTo = __WEBPACK_IMPORTED_MODULE_0_chai__["assert"].closeTo;
let hasAllKeys = __WEBPACK_IMPORTED_MODULE_0_chai__["assert"].hasAllKeys;
let normalDist = __WEBPACK_IMPORTED_MODULE_1_jStat__["normal"].sample;

function boundedRandom(p) {
    let min = p.min || 0;
    let max = p.max || p.values.length || 1;
    let value = min - 1;
    let rand = (p.dist == 'normal') 
        ? function() { return normalDist(p.mean, p.std); }
        : function() { return min + (max - min) * Math.random(); }
    while ( value < min || value > max) {
        // value = normalDist(p.mean, p.std);
        value = rand(p);
    }
    if(p.hasOwnProperty('values')){
        value = parseInt(value) ;
    }
    return value;
}

function randomColumns(arg) {
    let options = arg || {};
    let size = options.size || 0;
    let props = options.props || [];
    let db = Object(__WEBPACK_IMPORTED_MODULE_2__src_cstore__["a" /* default */])({});
    props.forEach(function(prop) {
        let dtype = p6.ctypes[prop.dtype] || Uint16Array;
        let tuples = new dtype(size);
        for(let i = 0; i < size; i++) {
            tuples[i] = boundedRandom(prop);
        }
        db.addColumn({
            data: tuples,
            name: prop.name,
            dtype: prop.dtype || 'string',
            values: prop.values
        });
    })
    return db;
}

function randomJSONs(arg) {
    let options = arg || {};
    let size = options.size || 0;
    let props = options.props || [];
    let data = new Array(size);
    for(let i = 0; i < size; i++) {
        data[i] = {};
        props.forEach(function(prop) {
            if(prop.hasOwnProperty('values')){
                let vid = parseInt( Math.round( Math.random() * (prop.values.length - 1) ) );
                data[i][prop.name] = prop.values[vid];
            } else {
                let value = boundedRandom(prop);
                data[i][prop.name] = (prop.dtype == 'float') ? parseFloat(value) : Math.round(value);
            }
        });
    }
    return data;
}

function validate(actual, expected, _delta) {
    let delta = _delta || 1e-5;
    let count = actual.length; 

    equal(count, actual.length, 'the size of the result should be ' + count);

    for(let i = 0; i < count; i++) {
        let keys = Object.keys(actual[i]);
        hasAllKeys(expected[i], keys, 'result should have all the keys');
        
        for(let j = 0, l = keys.length; j < l; j++) {
            if(typeof(actual[i][keys[j]]) == 'number') {
                closeTo(actual[i][keys[j]], expected[i][keys[j]], expected[i][keys[j]]*delta);
            } else {
                equal(actual[i][keys[j]], expected[i][keys[j]]);
            }
        }
    }

}

/***/ }),

/***/ "g2B4":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";

// EXTERNAL MODULE: ./node_modules/d3-scale/src/index.js + 48 modules
var src = __webpack_require__("dJjO");

// EXTERNAL MODULE: ./node_modules/d3-selection/src/index.js + 49 modules
var d3_selection_src = __webpack_require__("sHXk");

// EXTERNAL MODULE: ./node_modules/d3-interpolate/src/index.js + 24 modules
var d3_interpolate_src = __webpack_require__("JyCv");

// EXTERNAL MODULE: ./node_modules/d3-axis/src/index.js + 3 modules
var d3_axis_src = __webpack_require__("Mx2h");

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p.plot/src/plot.js





let Data = {
    json: [],
    domains: {},
    vmap: {}
}

let View = {
    container: null,
    svg: null,
    height: 300,
    width: 400,
    axes: true
}

class plot_Plot {
    constructor(data = Data, view = View) {
        this.data = data;
        this.view = view;
        this.container = view.container;
        this.padding = view.padding || {top: 0, bottom: 0, left: 0, right: 0};
        this.height = view.height;
        this.width = view.width;
        this.svg = {};

        if(!view.svg || view.svg === null) {
            if(view.container !== null) {
                this.svg = this.createSvg();
            }
            this.height -= this.padding.top + this.padding.bottom;
            this.width -= this.padding.left + this.padding.right;
            this.svg.main = this.svg.append('g')
                .attr("transform", `translate(${this.padding.left}, ${this.padding.top})`);
    
        } else {
            this.svg.main = Object(d3_selection_src["a" /* select */])(view.svg);
        }

        if(this.data.json) {
            this.scales = this.getScales();
        }
    }

    createSvg() {
        let svg = Object(d3_selection_src["a" /* select */])(this.container)
            .append('svg')
                .attr('width', this.width)
                .attr('height', this.height);
        return svg;
    }

    channels() {
        return {
            x: [0, this.width],
            y: [this.height, 0],
            color: ['steelblue', 'red'],
            opacity: [0, 1],
            size: [2, 20],
            width: [0, this.width],
            height: [0, this.height]
        }
    }

    getScales() {
        let scales = {};
        let channels = this.channels();
        let vmap = this.data.vmap;
        let domains = this.data.domains || null;
        let fields = this.data.fields || null;
        if(fields === null && this.data.json) {
            this.data.fields = Object.keys(this.data.json[0]);
            fields = Object.keys(this.data.json[0]);
        }
        
        for (let channel of Object.keys(channels)) {
            if(channel in vmap && fields.indexOf(vmap[channel]) !== -1) {
                let domain; 
                if(domains === null) {
                    let value = this.data.json.map(d=>d[vmap[channel]]);
                    let min = Math.min(...value) || 0;
                    let max = Math.max(...value) || 0;
                   
                    if(max === min) {
                        max += 1e-6;
                    }
                    domain = [min, max];
                } else {
                    domain = domains[vmap[channel]] || [0, 1];
                }
                
                let range = channels[channel];
                scales[channel] = Object(src["a" /* scaleLinear */])().domain(domain).range(range);
                if(channel == 'color') {
                    scales[channel].interpolate(d3_interpolate_src["c" /* interpolateHcl */])
                }
            } else {
                scales[channel] = () => vmap[channel]
            }
        }

        return scales;
    }

    axes() {
        if(!this.view.hideAxes) {
            this.xAxis = this.svg.main.append('g')
            .attr("transform", `translate(0, ${this.height})`)
            .call(Object(d3_axis_src["a" /* axisBottom */])(this.scales.x))
            
            this.yAxis = this.svg.main.append('g')
                .call(Object(d3_axis_src["b" /* axisLeft */])(this.scales.y).ticks(this.height/20))

            if(this.view.gridlines && this.view.gridlines.y) {
                this.yGridlines = this.yAxis.append('g')
                .style('opacity', 0.3)
                .call(Object(d3_axis_src["b" /* axisLeft */])(this.scales.y).ticks(this.height/30).tickSize(-this.width))
                .selectAll('text').remove()
            }
            
        }
    }

    render() {
        this.axes();
    }
}
// EXTERNAL MODULE: ./node_modules/d3-shape/src/index.js + 50 modules
var d3_shape_src = __webpack_require__("1gFY");

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p.plot/src/area.js



class area_AreaChart extends plot_Plot {
   
    constructor(data, view) {
        super(data, view);
        this.render();
    }

    render() {
        let vmap = this.data.vmap;

        super.axes();
        let shape = Object(d3_shape_src["b" /* area */])()
            .curve(d3_shape_src["c" /* curveBasis */])
            .x( d => this.scales.x(d[vmap.x]) )
            .y0(this.height)
            .y1( d => this.scales.y(d[vmap.y]) );

        this.svg.main.append("path")
            .datum(this.data.json)
            .attr("d", shape)
            .style("fill", vmap.color)
            .style("fill-opacity", vmap.opacity)
            .style("stroke-width", 0)
    }
}
// EXTERNAL MODULE: ./node_modules/d3-scale-chromatic/src/index.js + 42 modules
var d3_scale_chromatic_src = __webpack_require__("u6Xv");

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p.plot/src/spline.js





class spline_Spline extends plot_Plot {
    constructor(data, view) {
        super(data, view);
        this.render();
    }

    render() {
        let vmap = this.data.vmap;
        super.axes();
        let path = Object(d3_shape_src["e" /* line */])()
            .curve(d3_shape_src["c" /* curveBasis */])
            .x( d => this.scales.x(d[vmap.x]) )
            .y( d => this.scales.y(d[vmap.y]) );
    
       
        let datum = this.data.json;
        let color = () => vmap.color
        if(this.data.fields.indexOf(vmap.color) !== -1) {
            let result = {}
            this.data.json.forEach(function(d){
                if(result.hasOwnProperty(d[vmap.color])) {
                    result[d[vmap.color]].push(d)
                } else {
                    result[d[vmap.color]] = [];
                }
            })
            datum = result;

            color = Object(src["b" /* scaleOrdinal */])(d3_scale_chromatic_src["schemeCategory10"]);
        }

        if(Array.isArray(datum)) {
            this.svg.main.append("path")
            .datum(datum)
            .attr("d", path)
            .style("fill", 'none')
            .style("stroke", vmap.color)
            .style("stroke-width", vmap.size)
        } else if(typeof(datum) == 'object') {
            let series = Object.keys(datum);
            series .forEach((sample, di) => {
                this.svg.main.append("path")
                .datum(datum[sample])
                .attr("d", path)
                .style("fill", 'none')
                .style("stroke", color(sample))
                .style("stroke-width", vmap.size)
            
                let legendWidth = Math.min(15, this.padding.right/2);
                let legendPosY = (di + 1) * Math.min(30, this.width / series.length);
                this.svg.main.append('rect')
                    .attr('x', this.width + 10)
                    .attr('y', legendPosY)
                    .attr('width', legendWidth)
                    .attr('height', 6)
                    .style('fill', color(sample))
                
                this.svg.main.append('text')
                    .attr('x', this.width + 15 + legendWidth)
                    .attr('y', legendPosY + 6)
                    .text(sample)

                if(di == 0){
                    this.svg.main.append('text')
                        .attr('x', this.width + 10 + legendWidth/2)
                        .attr('y', 6)
                        .text(vmap.color)
                }

            })


        }

    }
}
// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p.plot/src/circle.js


class ScatterPlot extends plot_Plot {
   
    constructor(data, view) {
        super(data, view);
        this.render();
    }

    render() {
        let vmap = this.data.vmap;

        super.axes();

        this.svg.main.selectAll('.plot-circles')
            .data(this.data.json)
            .enter()
            .append('circle')
                .attr('class', 'plot-circles')
                .attr('cx', d => this.scales.x(d[vmap.x]))
                .attr('cy', d => this.scales.y(d[vmap.y]))
                .attr('r', d => this.scales.size(d[vmap.size]))
                .style("fill", d => this.scales.color(d[vmap.color]))
                .style("fill-opacity", 1)
                .style("stroke-width", 0)
    }
}
// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p.plot/index.js





/* harmony default export */ var p_plot = __webpack_exports__["a"] = ({
    Plot: plot_Plot,
    ScatterPlot: ScatterPlot,
    AreaChart: area_AreaChart,
    Spline: spline_Spline
});



/***/ }),

/***/ "gJtD":
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),

/***/ "i+b3":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "int", function() { return int; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "short", function() { return short; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "float", function() { return float; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "double", function() { return double; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "string", function() { return string; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "time", function() { return time; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "temporal", function() { return temporal; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "integer", function() { return integer; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "numeric", function() { return numeric; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "nominal", function() { return nominal; });
const int      = Int32Array;
const short    = Int16Array;
const float    = Float32Array;
const double   = Float64Array;
const string   = Uint16Array;
const time     = Float64Array;
const temporal = Float64Array;
const integer  = Int32Array;
const numeric  = Float32Array;
const nominal  = Uint16Array;




/***/ }),

/***/ "mH2t":
/***/ (function(module, exports) {

module.exports = function embed(spec) {
    var id = spec.$id || spec.$by,
        attributes = Object.keys(spec);

    if(!id) throw Error("No id specified for embed!");

    attributes.filter(function(attr){
        return (attr != "$by" && attr != "$id")
    })
    .forEach(function(attr){
        var embedKey = spec[attr][0][id],
            i = 0,
            n = data.length,
            l = spec[attr].length;

        var lookup = data.map(function(d){ d[attr] = []; return d[id];});

        for(i = 0; i < l; i++) {
            var index = lookup.indexOf(spec[attr][i][id]);
            if(index !== -1) {
                data[index][attr].push(spec[attr][i]);
            }
            // delete spec[attr][i][id];
        }
    });
    return data;
}


/***/ }),

/***/ "q2n1":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";

// EXTERNAL MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/ctypes.js
var ctypes = __webpack_require__("i+b3");

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/utils.js


function seq(dtype, start, end, interval) {
    var step = interval || 1,
        size = (end - start) / step + 1,
        buf;

    buf = new ctypes[dtype](size);
    for (var i = 0; i < size; i++) {
        buf[i] = start + i * step;
    }
    return buf;
}

let seqInt = seq.bind(null, "int");
let seqFloat = seq.bind(null, "float");

// EXTERNAL MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/arrays.js
var arrays = __webpack_require__("XLO3");

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/allocate.js


const vecId = ['x', 'y', 'z'];
/* harmony default export */ var allocate = (function($p, dataProps) {
    let data = dataProps || [];
    $p.indexes = data.indexes || [];
    $p.categoryIndex = data.strValues || {};
    $p.categoryLookup = data.strLists || {};
    $p.dkeys =  data.keys || [];
    $p.dtypes =  data.dtypes || data.types || [];
    $p.intervals =  data.intervals || {};
    $p.uniqueValues = data.uniqueValues;

    var dkeys = $p.dkeys,
        dtypes = $p.dtypes,
        stats =  data.stats || null;
    
    if (Number.isInteger(data.size)) {
        $p.dataSize = data.size;
    } else if (Array.isArray(data)) {
        $p.dataSize = Math.max(...data.map(d => d.length));
    }

    let rowSize = Math.min($p.dataSize, $p.rowSize);
    let colSize = Math.ceil($p.dataSize / rowSize);

    $p.dataDimension = [rowSize, colSize];
    $p.resultDimension = [rowSize, colSize];
    $p.fields = $p.indexes.concat(dkeys.filter(function(k) {
        return $p.indexes.indexOf(k) === -1;
    }));
    $p.fieldWidths = new Array($p.fields.length).concat(new Array($p.deriveMax).fill(1));
    $p.fieldCount = $p.fields.length - $p.indexes.length;
   
    function getDataWidth(fid, range) {
        var range = Math.abs(range[1] - range[0]);
        if (dtypes[fid] == "index" || dtypes[fid] == "int" || dtypes[fid] == "string") {
            return range + 1;
        } else if (dtypes[fid] == "histogram") {
            return range;
        } else if (["nominal", "ordinal", "categorical"].indexOf(dtypes[fid]) > -1) {
            return data.TLB.length;
        } else if (dtypes[fid] in ["float", "double", "numeric"]) {
            return 10;
        } else {
            return range + 1;
        }
    }
    $p.fields.forEach(function(field) {
        var min = stats[field].min,
            max = stats[field].max,
            fi = dkeys.indexOf(field);
        $p.fieldWidths[fi] = getDataWidth(fi, [min, max]);
    });
    $p.getDataWidth = getDataWidth;
    $p.deriveDomains = new Array($p.deriveMax).fill([0, 1]);
    $p.deriveWidths = new Array($p.deriveMax).fill(1);
    $p.deriveFieldCount = 0;

    $p.getFieldId = function (fieldName) {
        let fieldId = $p.fields.indexOf(fieldName);
        if($p.indexes.length > 0 && fieldId >= $p.indexes.length) {
            fieldId -= $p.indexes.length; 
        }
        return fieldId; 
    }

    if ($p.indexes.length === 0) {
        $p.attribute("aDataIdx", "float", seqFloat(0, $p.dataDimension[0] - 1));
        $p.attribute("aDataIdy", "float", seqFloat(0, $p.dataDimension[1] - 1));
        $p.attribute("aDataValx", "float", seqFloat(0, $p.dataDimension[0] - 1));
        $p.attribute("aDataValy", "float", seqFloat(0, $p.dataDimension[1] - 1));
    } else {
        $p.indexes.forEach(function(id, i) {
            let indexAttrData = Object(arrays["b" /* unique */])(data[id]).sort( (a, b) => b - a );
            $p.attribute("aDataVal" + vecId[i], "float", new Float32Array(indexAttrData));
            $p.attribute("aDataId" + vecId[i], "float", seqFloat(0, indexAttrData.length - 1));
            $p.fieldWidths[i] = indexAttrData.length;
            $p.dataDimension[i] = indexAttrData.length;
        });
    }

    $p.attribute("aDataItemVal0", "float", null);
    $p.attribute("aDataItemVal1", "float", null);
    $p.attribute("aDataItemId", "float", new Float32Array($p.dataSize).map((d,i)=>i));
    $p.attribute("aDataFieldId", "vec2", new Float32Array($p.fields.length * 2).map((d,i)=>i));
    $p.attribute("aVertexId", "float", [0, 1, 2, 3, 4, 5]);
    $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aVertexId.location, 0);
    $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataFieldId.location, 0);
    $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataItemId.location, 1);

    $p.attribute(
        "_square",
        "vec2",
        new Float32Array([
            -1.0, -1.0, 1.0, -1.0, 
            -1.0, 1.0, -1.0, 1.0,
            1.0, -1.0, 1.0, 1.0
        ])
    );
    $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute._square.location, 1);

    //TODO: get data statistics using the GPU
    if(stats !== null) {
        $p.fieldDomains = $p.fields.map(function(k, i) {
            return [stats[k].min, stats[k].max];
        }).concat(new Array($p.deriveMax).fill([0, 1]));
        $p.uniform("uFieldDomains", "vec2",  $p.fieldDomains);
    } else {
        $p.uniform("uFieldDomains", "vec2",  $p.fields.map(f => [0, 1]));
    }

    let filterControls = new Array($p.fieldCount).fill(0);
    //setup all attribute, uniform, texture, varying needed by all the shaders
    $p.uniform("uDataSize",    "float", $p.dataSize);
    $p.uniform("uDataDim",     "vec2",  $p.dataDimension);
    $p.uniform("uResultDim",   "vec2",  $p.dataDimension);
    $p.uniform("uIndexCount",  "int",   $p.indexes.length);
    $p.uniform("uFieldWidths", "float", $p.fieldWidths);
    $p.uniform("uFieldCount",  "int",   $p.fieldCount);
    $p.uniform("uFieldId",     "int",   0);
    $p.uniform("uFilterFlag",  "int",   0);
    $p.uniform("uFilterControls","int", filterControls)
    $p.uniform("uVisControls","int", filterControls);
    $p.uniform("uFilterRanges","vec2", $p.fieldDomains);
    $p.uniform("uVisRanges","vec2", $p.fieldDomains);
    $p.uniform("uGroupFields", "int",   [0, -1]);
    $p.uniform("uDataInput",   "sampler2D");
    $p.uniform("uDeriveCount", "int", $p.deriveMax);
    // $p.uniform("uDeriveDomains", "vec2", $p.deriveDomains);
    // $p.uniform("uDeriveWidths", "float", $p.deriveWidths);
    $p.uniform("uFilterLevel", "float", 0.1)
    $p.uniform('uVisLevel',    "float", 0.1)

    $p.varying("vResult", "float");
    $p.varying("vDiscardData", "float");
    $p.texture(
        "tData",
        "float",
        new Float32Array($p.dataDimension[0] * $p.dataDimension[1] * $p.fieldCount), [$p.dataDimension[0], $p.dataDimension[1] * $p.fieldCount],
        "alpha"
    );
    $p.framebuffer("fFilterResults", "unsigned_byte", $p.dataDimension);
    $p.framebuffer("fGroupResults", "float", [1024, 1]);
    $p.framebuffer("fDerivedValues", "float", [$p.dataDimension[0], $p.dataDimension[1] * $p.deriveMax]);
    $p.framebuffer("fStats", "float", [2, $p.fieldCount]);
    $p.parameter({
        fieldCount: $p.fields.length - $p.indexes.length,
        indexCount: $p.indexes.length
    });

    $p.fields.slice($p.indexes.length).forEach(function(attr, ai) {
        let buf = new Float32Array($p.dataDimension[0] * $p.dataDimension[1]);
        for (let i = 0, l = data[attr].length; i < l; i++) {
            buf[i] = data[attr][i];
        }

        $p.texture.tData.update(
            buf, [0, $p.dataDimension[1] * ai], $p.dataDimension
        );
    });

    // $p.texture.tData.sampler = $p.uniform.uDataInput;
    $p.uniform.uDataInput = $p.texture.tData;

    function getFieldWidth({fid = 'int'}) {
        return this.uFieldWidths[fid];
    }

    function getFieldDomain({fid = 'int'}) {
        return this.uFieldDomains[fid];
    }

    function getData({fid = 'int', r = 'float', s = 'float'}) {
        var t, value;
        if (fid >= this.uFieldCount + this.uIndexCount) {
            t = (float(fid - this.uFieldCount - this.uIndexCount) + s) /
                float(this.uDeriveCount);
            value = texture2D(this.fDerivedValues, vec2(r, t)).a;
        } else {
            if (this.uIndexCount > 0 && fid == 0) value = this.aDataValx;
            else if (this.uIndexCount > 1 && fid == 1) value = this.aDataValy;
            else {
                t = (float(fid - this.uIndexCount) + s) / float(this.uFieldCount);
                value = texture2D(this.uDataInput, vec2(r, t)).a;
            }
        }
        return value;
    }

    function getNonIndexedData({fieldId = 'int', addrX = 'float', addrY = 'float'}) {
        var offsetY, value;
        if (fieldId >= this.uFieldCount + this.uIndexCount) {
            offsetY = (float(fieldId - this.uFieldCount - this.uIndexCount) + addrY) /
                float(this.uDeriveCount);
            value = texture2D(this.fDerivedValues, vec2(addrX, offsetY)).a;
        } else {
            offsetY = (float(fieldId - this.uIndexCount) + addrY) / float(this.uFieldCount);
            value = texture2D(this.uDataInput, vec2(addrX, offsetY)).a;
        }
        return value;
    }

    $p.subroutine("getFieldWidth", "float", getFieldWidth);
    $p.subroutine("getFieldDomain", "vec2", getFieldDomain);
    $p.subroutine("getData", "float", getData);
    $p.subroutine("getNonIndexedData", "float", getNonIndexedData);

    var gl = $p.ctx;
    gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdx.location, 0);
    gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataValx.location, 0);
    gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdy.location, 1);
    gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataValy.location, 1);

});

// EXTERNAL MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/io/ajax.js
var ajax = __webpack_require__("MjQa");

// EXTERNAL MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/cstore.js
var cstore = __webpack_require__("6Ric");

// EXTERNAL MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/io/parse.js
var parse = __webpack_require__("2A6v");

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/io/input.js




const INPUT_TYPES = [
    'json',
    'csv',
    'text',
    'RowArrays',
    'ColArrays',
    'cstore',
];

const INPUT_METHODS = ['memory', 'http', 'websocket', 'file'];

function input({
    type = 'cstore',
    method = 'memory',
    delimiter = ',',
    size,
    schema,
    source,
    onready,
    uniqueKeys = []
}) {
    if(INPUT_TYPES.indexOf(type) === -1) {
        throw Error('Invalid input type ', type)
    }

    if(INPUT_METHODS.indexOf(method) === -1) {
        throw Error('Unknown method ', method)
    }

    let cache;

    function createIndexes() {
        uniqueKeys.forEach(function(uk){
            cache.index(uk);
        })
    }

    let dataHandlers = {
        json: function(data) {
            cache = Object(cstore["a" /* default */])({schema, size})
            cache.import((method == 'websocket') ? JSON.parse(data) : data);
            createIndexes();
            return cache.data();
        },
        csv: function(text) {
            let data = Object(parse["a" /* default */])(text, delimiter);
            let fields = data.shift();
            cache = Object(cstore["a" /* default */])({keys: fields, types: fields.map(() => 'float')})
            cache.addRows(data);
            createIndexes();
            return cache.data();
        },
        cstore: function() {
            if(Number.isInteger(source.size) && Array.isArray(source.types)) {
                return source;
            }
        }
    }

    dataHandlers.text = dataHandlers.csv;

    let response = function(data) {
        return new Promise(function(resolve, reject) {
            if(typeof(dataHandlers[type]) === 'function') {
                resolve(dataHandlers[type](data));
            } else {
                reject(Error('No handler for data type ', type));
            }
        })
    }

    if(method === 'http') {
        return ajax["get"]({url: source, dataType: type}).then(response);
    } else if (method == 'websocket') {
        return new Promise(function(resolve, reject) {
            var socket = new WebSocket(source);
            socket.onopen = function() {
                if(typeof(onready) === 'function') onready(socket)
            }
            socket.onmessage = function(event) {
                resolve(dataHandlers[type](event.data));
            }
            socket.onerror = function(err) {
                reject(err);
            }
        });
    } else {
        return response(source);
    }
}

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/io/output.js
/* harmony default export */ var output = (function($p) {

    let output = {};
    
    output.result = function(format) {
        var buf = $p.getResultBuffer(),
            res = {},
            offset = 0,
            rs = 0;
        if(typeof buf.subarray !== 'function') return buf;
        var rs = 0;
        let match = null;
        if($p.uniform.uFilterFlag.data == 1){
            match = $p.getMatchBuffer()
        }
        
        if($p.indexes.length > 0) {
            if ($p.resultDimension[0] > 1) {
                res[$p.fields[rs]] = $p.attribute.aDataValx.data;
                rs++;
            }
            if ($p.resultDimension[1] > 1) {
                var bx = $p.attribute.aDataValx.data;
                var by = $p.attribute.aDataValy.data;
                var ax = new Array($p.resultDimension[0] * $p.resultDimension[1]),
                    ay = new Array($p.resultDimension[0] * $p.resultDimension[1]);

                for (var y = 0; y < $p.resultDimension[1]; y++) {
                    for (var x = 0; x < $p.resultDimension[0]; x++) {

                        ax[y * $p.resultDimension[0] + x] = bx[x];
                        ay[y * $p.resultDimension[0] + x] = by[y]
                    }
                }
                res[$p.fields[0]] = ax;
                res[$p.fields[rs]] = ay;
                rs++;
            }
        }

        var arraySize = $p.resultDimension[0] * $p.resultDimension[1];
        for (var i = rs; i < $p.fields.length; i++) {
            res[$p.fields[i]] = buf.subarray(offset, offset + arraySize);
            offset += arraySize;
        };

        if (format == 'row' || format == 'array') {
            var objectArray = new Array();
            
            for (var i = 0; i < arraySize; i++) {
                if(match !== null && match[i] == 0) continue
                let fields = Object.keys(res);
                var obj = (format == 'array') ? new Array(fields.length) : {};
                fields.forEach(function(f, fi) {
                    var kid = $p.dkeys.indexOf(f),
                        dtype = $p.dtypes[kid];

                    var key = (format == 'array') ? fi : f;

                    if (dtype == 'string' && $p.categoryLookup.hasOwnProperty(f)) {
                        obj[key] = $p.categoryLookup[f][res[f][i]];
                    } else if ($p.intervals.hasOwnProperty(f) && $p.intervals[f].dtype == 'historgram') {
                        obj[key] = $p.intervals[f].min + res[f][i] * $p.intervals[f].interval;
                    } else if ($p.uniqueValues.hasOwnProperty(f)) {
                        obj[key] = $p.uniqueValues[f][res[f][i]];
                    } else {
                        obj[key] = Number.isNaN(res[f][i]) ? 0.0 : res[f][i];
                    }
                });
                objectArray.push(obj);
            }

            return objectArray;

        } else {
            return res;
        }
    }

    output.readPixels = function({
        offset = [0, 0],
        resultSize =  $p.dataDimension[0]* $p.dataDimension[1],
        rowSize = Math.min(resultSize, $p.dataDimension[0]),
        colSize = Math.ceil(resultSize / $p.dataDimension[0])
    }) {
        let result = new Uint8Array(rowSize * colSize * 4);
        $p.bindFramebuffer(null);
        $p.ctx.readPixels(offset[0], offset[1], rowSize, colSize, gl.RGBA, gl.UNSIGNED_BYTE, result);
        return result.filter(function(d, i){ return i%4===3;} );
    }
    
    return output;
});

// EXTERNAL MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/flexgl/index.js
var flexgl = __webpack_require__("uGFW");

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/initialize.js


function init({
    context = null,
    container = document.body,
    viewport =  [800, 450],
    padding = {left:0, right: 0,top: 0, bottom: 0},
    attributes = {},
    views
}){
    let $p = context;
    let defaultLayout = [
        {
            width: viewport[0],
            height: viewport[1],
            // padding: {left: 30, right: 30, top: 30, bottom: 30},
            offset: [0, 0]
        }
    ];
    if ($p === null) {
        $p = new flexgl["a" /* default */]({
            container: container,
            width: viewport[0],
            height: viewport[1],
            padding: {left:0, right: 0,top: 0, bottom: 0},
            attributes: attributes
        });
    }
    $p.container = container;
    $p.padding = padding;
    $p.viewport = viewport;
    $p.views = views || defaultLayout;
    return $p;
}

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/vis/brush.js
function brush(arg){

    var option = arg || {},
        container = option.container || this.svg[0],
        width = option.width || this.width,
        height = option.height || this.height,
        x = function(s) {return s},
        y = function(s) {return s},
        base = option.base || null,
        selectX = option.x || false,
        selectY = option.y || false,
        border = option.border || "#FFF",
        color = option.color || "#111",
        brush = option.brush || function() {},
        brushstart = option.brushstart || function() {},
        brushend = option.brushend || function() {};

    if(typeof(selectX) === "function") {
        x = selectX;
        selectX = true;
    }
    if(typeof(selectY) === "function") {
        y = selectY;
        selectY = true;
    }
    if(base === null){
        base = container.append("g").attr("class", "selector");
    } else {
        base = container;
    };

    base.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height)
        .attr("fill-opacity", 0)
        .attr("stroke", "none")
        .css("cursor", "crosshair");

    var selector = base.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 0)
        .attr("height", 0)
        .attr("fill-opacity", 0.1)
        .css("fill", color)
        .css("stroke", border)
        .css("cursor", "move");

    var sx, sy,
        dx, dy,
        bx, by,
        selection = {},
        intStart = false,
        drag = false;

    base.svg.addEventListener("mousedown", function(evt){
        evt.preventDefault();
        brushstart.call(this);
        intStart = true;
        sx = evt.clientX;
        sy = evt.clientY;

        var sp = selector.svg.getBoundingClientRect();
        var box = base.svg.getBoundingClientRect();
        var x0, y0, nw, nh;

        if(sx>sp.left && sy>sp.top && sx<sp.left+sp.width && sy<sp.top+sp.height) {
            drag = true;
            bx = sp.left;
            by = sp.top;
        }

        if(!drag){
            x0 = selectX ? sx - box.left : 0;
            y0 = selectY ? sy - box.top : 0;
            selector.attr("x", x0)
                .attr("y", y0)
                .attr("width", 0);
        }

        ondrag = function(evt){
            if(intStart){
                dx = evt.clientX - sx;
                dy = evt.clientY - sy;
                var selectorBox = selector.svg.getBoundingClientRect();
                if(drag){

                    var nx = bx + dx-box.left,
                        ny = by + dy-box.top;

                    if(bx+dx < box.left) nx = 0;
                    if(bx+dx+selectorBox.width > box.right) nx = width - selectorBox.width ;
                    if(by+dy < box.top) ny = 0;
                    if(by+dy+selectorBox.height > box.bottom) ny = height - selectorBox.height;
                    selector.attr("x", nx).attr("y", ny);
                } else {
                    if(evt.clientX < box.left) dx = box.left - sx;
                    if(evt.clientX > box.right) dx = box.right - sx;
                    if(evt.clientY > box.bottom) dy = box.bottom - sy;
                    if(evt.clientY < box.top) dy = box.top - sy;

                    x0 = selectX ? sx + dx - box.left: 0;
                    y0 = selectY ? sy + dy - box.top : 0;
                    nw = selectX ? Math.abs(dx) : width;
                    nh = selectY ? Math.abs(dy) : height;

                    if(dx<0 && dy>=0) selector.attr("x", x0);
                    if(dy<0 && dx>=0) selector.attr("y", y0);
                    if(dx<0 && dy<0) selector.attr("x", x0).attr("y", y0);
                    selector.attr("width", nw).attr("height", nh);
                }
                if(selectX) {
                    selection.x = [ x(selectorBox.left - box.left ), x(selectorBox.right - box.left )];
                }
                if(selectY) {
                    selection.y = [y(selectorBox.top - box.top), y(selectorBox.bottom - box.top)];
                }
                brush.call(this, selection);
            }
        };

        window.addEventListener("mousemove", ondrag, false);
        window.addEventListener("mouseup", function(evt){
            if(intStart){
                ondrag(evt);
                intStart = false;
                if(drag){
                    drag = false;
                }
            }
            brushend.call(this, selection);
            window.removeEventListener("mousemove", ondrag, false);
        }, false);
    });
};

// EXTERNAL MODULE: ./node_modules/os-browserify/browser.js
var browser = __webpack_require__("gAs1");
var browser_default = /*#__PURE__*/__webpack_require__.n(browser);

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/interact.js



function interact($p, options) {
    var viewTags = options.view || [$p.views[0].id];

    if(!Array.isArray(viewTags)) viewTags = [viewTags];

    var actions = options.actions || options.events || [],
        condition = options.condition || {},
        callback = options.callback || function() {};

    if($p._update) return;

    if(!condition.x && !condition.y) {
        condition.x = condition.y = true;
    }

    viewTags.forEach(function(viewTag){
        var vis = $p.views.filter(v=>v.id == viewTag)[0];
        if(!Array.isArray(actions)) {
            actions = [actions];
        }

        if(vis === undefined || !vis.hasOwnProperty('chart')) return;

        var vmap = vis.vmap,
            p = vis.padding || $p.padding,
            w = vis.width - p.left - p.right,
            h = vis.height - p.top - p.bottom;
        
        var interactor = vis.chart.svg.append("g")
            .attr("class", "selector")

        var rect = interactor.append("rect")
          .attr("x", 0)
          .attr("y", 0)
          .attr("width", w)
          .attr("height", h)
          .attr("fill-opacity", 0)
          .attr("stroke", "none");

        var svg = interactor.svg,
            box = rect.svg.getBoundingClientRect();

        function getSelection(e) {
            var dx = e.clientX - box.left;
            var dy = e.clientY - box.top;
            var selection = {};
            if(vmap.x) {
                selection[vmap.x] = [vis.chart.x.invert(dx)];
            }
            if(vmap.y) {
                selection[vmap.y] = [vis.chart.y.invert(dy)];
            }
            return selection;
        }

        actions.forEach(function(action){
            if(action == 'brush') {
                svg.style.cursor = "crosshair";
                var brushOptions = {
                    container: interactor,
                    width: w,
                    height: h
                };

                if(!Array.isArray(vmap.x) && !Array.isArray(vmap.y)) {
                    let updateEvent = (condition.lazy) ? 'brushend' : 'brush';
                    brushOptions[updateEvent] = function(d) {
                        var selection = {};
                        if(vmap.x && d.x) selection[vmap.x] = d.x;
                        if(vmap.y && d.y) selection[vmap.y] = d.y.reverse();
                        callback(selection);
                    }
                    if(condition.x && typeof(vis.chart.x.invert) == 'function')
                        brushOptions.x = vis.chart.x.invert;

                    if(condition.y && typeof(vis.chart.y.invert) == 'function')
                        brushOptions.y = vis.chart.y.invert

                    new brush(brushOptions);
                }

                var dims = ['x', 'y'],
                    selections = {};

                dims.forEach(function(dim){
                    if(Array.isArray(vmap[dim]) && Array.isArray(vis.chart[dim])){
                        var axisDist = (dim == 'x') ? h : w,
                            selectors = vis.chart.svg.append('g');

                        axisDist =  axisDist / (vmap[dim].length-1);

                        vmap[dim].forEach(function(d, i) {

                            var axisSelect = selectors.append("g");
                            if(dim == 'x') {
                                brushOptions.height = axisDist * 0.2;
                                axisSelect.translate(0, axisDist * (i - 0.1));
                                brushOptions.brush = function(range) {
                                    selections[d] = range[dim];
                                    callback(selections);
                                }
                            } else {
                                brushOptions.width = axisDist * 0.2;
                                axisSelect.translate(axisDist * (i - 0.1), 0);
                                brushOptions.brush = function(range) {
                                    selections[d] = range[dim].reverse();
                                    callback(selections);
                                }
                            }
                            brushOptions.container = axisSelect;
                            brushOptions[dim] = vis.chart[dim][i].invert;

                            new brush(brushOptions);
                        });
                    }
                })
            } else if(action == 'zoom') {
                vis.updateDomain = true;
                let delta = {x: null, y: null};
                let scale = 0.05;
                svg.onmousewheel = function(e) {
                    let dir = (e.deltaY > 0) ? 1 : -1;
                    let selection = {};
                    let proportion = {
                        x: (e.clientX - box.left) / box.width,
                        y: 1.0 - (e.clientY - box.top) / box.height
                    }

                    for (let dim of ['x', 'y']) {
                        if(condition[dim]) {
                            let attr = vis.vmap[dim];
                            let attrId = $p.fields.indexOf(attr);
                            if(delta[dim] === null ){
                                delta[dim] =  scale * (vis.domains[attrId][1] - vis.domains[attrId][0]);
                            }
      
                            let domain = vis.domains[attrId];
                            let newDomain = [domain[0] - dir * delta[dim] * (proportion[dim]), domain[1] + dir * delta[dim] * (1-proportion[dim])];
                            if(newDomain[1] - newDomain[0] > 1e-9){
                                selection[attr] = newDomain;
                                vis.domains[attrId] = newDomain;
                            } else {
                                scale *= 0.5;
                            }

                        }
                    }
                    callback(selection);
                }

            } else if(action == 'pan') {
                svg.style.cursor = 'move';
                vis.updateDomain = true;
                let selection = {};
                svg.onmousedown = function(e) {
                    let sx = e.clientX;
                    let sy = e.clientY;
                    svg.style.cursor = 'move';

                    function onpan(e) {
                        let delta = {
                            x: -(e.clientX - sx) / box.width,
                            y: (e.clientY - sy) / box.height
                        }
                        for (let dim of ['x', 'y']) {
                            if(condition[dim]) {
                                let attr = vis.vmap[dim];
                                let attrId = $p.fields.indexOf(attr);
                                let domain = vis.domains[attrId];
                                let diff = delta[dim] * (domain[1] - domain[0]);
                                let newDomain = [domain[0] + diff, domain[1] + diff];
                                selection[attr] = newDomain;
                                vis.domains[attrId] = newDomain;
                            }
                        }
                        sx = e.clientX;
                        sy = e.clientY;
                        callback(selection);
                    }

                    window.addEventListener("mousemove", onpan, false);
                    window.addEventListener("mouseup", function(){
                        svg.style.cursor = 'default';
                        window.removeEventListener("mousemove", onpan, false);
                    }, false);

                }

            } else if(action == 'click') {
                svg.onclick = function(e) {
                    callback(getSelection(e));
                }
            } 
            
            if(action == 'hover') {
                svg.onmouseover = function(e) {
                    callback(getSelection(e));
                    svg.onmousemove = function(e) {
                        callback(getSelection(e));
                    }

                    // svg.onmouseout = function(e) {
                    //     updatePos(e);
                    //     svg.style.cursor = 'default';
                    //     svg.onmousemove = null;
                    //     svg.onmouseover = null;
                    // }
                }
            }
        })
    })
}

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/control.js
/* harmony default export */ var control = (function ($p) {

    let registers = {};
    let control = {};

    let serializeArray = function(arrayOfArray) {
        return [].concat.apply([], arrayOfArray);
    }

    control.register = function(tag) {
        registers[tag] = {
            indexes: $p.indexes,
            dataSize: $p.dataSize,
            fields: $p.fields,
            dataDim: $p.uniform.uDataDim.data.slice(),
            fieldWidths: $p.fieldWidths.slice(),
            fieldDomains: $p.fieldDomains.slice(),
            deriveCount: $p.deriveCount,
            filterFlag: $p.uniform.uFilterFlag.data,
            filterControls: $p.uniform.uFilterControls.data.slice(),
            dataInput: $p.uniform.uDataInput.data,
            attribute: {
                aDataIdx: {
                    ids: $p.attribute.aDataIdx.data,
                    value: $p.attribute.aDataValx.data
                },
                aDataIdy: {
                    ids: $p.attribute.aDataIdy.data,
                    value: $p.attribute.aDataValy.data
                },
                aDataFieldId: $p.attribute.aDataFieldId.data,
                aDataItemId: $p.attribute.aDataItemId.data
            }
        }
        return control;
    }

    control.updateRegister = function(tag, props) {
        if(registers.hasOwnProperty(tag)) {
            Object.keys(props).forEach(k => {
                registers[tag][k] = props[k];
            })
        }
        return control;
    }
    
    control.resume = function(tag) {
        if (!registers.hasOwnProperty(tag))
            throw new Error('"' + tag + '" is not found in regesters.');
    
        var reg = registers[tag];
        //resume CPU registers
        $p.indexes = reg.indexes;
        $p.dataSize = reg.dataSize;
        $p.deriveCount = reg.deriveCount;
        $p.fieldCount = reg.fields.length - reg.indexes.length - reg.deriveCount;
        $p.fields = reg.fields.slice();
        $p.fieldWidths = reg.fieldWidths.slice();
        $p.fieldDomains = reg.fieldDomains.slice();
        $p.dataDimension = reg.dataDim.slice();
    
        //resume GPU Uniforms
        $p.uniform.uFieldCount.data = $p.fieldCount;
        $p.uniform.uDataSize.data = $p.dataSize;
        $p.uniform.uDataDim.data = reg.dataDim;
        $p.uniform.uIndexCount.data = reg.indexes.length;
        $p.uniform.uFieldDomains.data = serializeArray(reg.fieldDomains);
        $p.uniform.uFieldWidths.data = reg.fieldWidths;
        $p.uniform.uFilterFlag.data = reg.filterFlag;
        // $p.uniform.uFilterControls.data = reg.filterControls;
        $p.uniform.uDataInput.data = reg.dataInput;
    
        //resume GPU Attribute Buffers
        $p.attribute['aDataIdx'] = reg.attribute['aDataIdx'].ids;
        $p.attribute['aDataIdy'] = reg.attribute['aDataIdy'].ids;
        $p.attribute['aDataValx'] = reg.attribute['aDataIdx'].value;
        $p.attribute['aDataValy'] = reg.attribute['aDataIdy'].value;
        $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute['aDataIdx'].location, 0);
        $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute['aDataIdy'].location, 1);
        $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute['aDataValx'].location, 0);
        $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute['aDataValy'].location, 1);
    
        $p.attribute['aDataFieldId'] = reg.attribute['aDataFieldId'];
        $p.attribute['aDataItemId'] = reg.attribute['aDataItemId'];
    
        return control;
    }

    // control.head = function() {
    //     control.resume('__init__');
    //     return control;
    // }

    var branchID = 0;
    control.branch = function(branches) {
        branches.forEach(function(b){
            var operations = Object.keys(b).map(function(o) {
                var obj = {};
                obj[o] = b[o];
                return obj;
            });
            control.run(operations);
            control.resume('_branch' + branchID);
        })
        branchID++;

        return control;
    }

    return control;
});

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/view.js
/* harmony default export */ var view = (function ($p) {
    return {
        view(views) {
            $p.views.forEach(function(v){
                if(v.hasOwnProperty('chart')) {
                    v.chart.svg.remove();
                    v.chart.removeAxis();
                    v.chart.removeLegend();
                    delete v.chart;
                }
                if(!v.hasOwnProperty('padding')) {
                    v.padding = {left: 30, right: 30, top: 30, bottom: 30};
                }
            })
            $p.views = views;
            return this;
        },

        addView(view) {
            $p.views.push(view);
        },

        updateViews(views) {
            $p.views = views;
            return this;
        },

        resetViews() {
            $p.views.forEach(function(v){
                if(v.hasOwnProperty('chart')) {
                    v.chart.svg.remove();
                    delete v.chart;
                }
            })
            return this;
        },

        generateViews({
            layout = 'rows',
            count = 1,
            width = 640,
            height = 480,
            padding = {left: 0, right: 0, top: 0, bottom: 0}
        }) {
            let views = new Array(count);
            let calcOffset;
            if (layout == 'rows') {
                height = height / count
                calcOffset = (index) => [0, index * height / count];
            } else {
                width = width / count
                calcOffset = (index) => [index * width / count, 0];
            }
            for (let i = 0; i < count; i++) {
                let offset = calcOffset(i);
                views[i] = {width, height, padding, offset};
            }
            return views
        }
    }
});


// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/pipeline.js
function pipeline($p) {    
    let pipeline = {};
    let async = false;
    let optID = 0;
    let queue = [];
    
    pipeline.addModule = function(mod) {
        Object.assign(pipeline, mod($p));
        return pipeline;
    }

    pipeline.addToQueue = function (opt, arg) {
        if(!$p._update && !$p._progress) {
            let spec = {};
            spec[opt] = arg;
            queue.push(spec);
            return optID++;
        } else {
            return -1;
        }
    }

    pipeline.addOperation = function(name, operation, overwrite = false) {
        if(!pipeline.hasOwnProperty(name) || overwrite) {
            pipeline[name] = function(arg) {
                if(!async) {
                    pipeline.addToQueue(name, arg);
                }
                let getResult = operation(arg);
                if(typeof(getResult) === 'function') {
                    $p.getResult = getResult;
                }
                return pipeline;
            }
        }   
    }

    pipeline.clearQueue = function() {
        queue = [];
        return pipeline;
    }

    pipeline.run = function(jobs = queue) {
        for (let q of jobs) {
            let opt = Object.keys(q)[0];
            if(typeof pipeline[opt] === 'function') {
                pipeline[opt](q[opt]);
            }
        }
        return pipeline;
    }

    pipeline.queue = function() {
        return queue;
    }

    pipeline.async = function(isAsync) {
        async = isAsync;
    }

    return pipeline;
}
// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/ops/aggregate.js


const aggregate_vecId = ['x', 'y', 'z'];
const aggrOpts = ['$min', '$max', '$count', '$sum', '$avg', '$var', '$std'];
const smallest = -Math.pow(2, 128);
const largest = Math.pow(2, 127);
function aggregate_aggregate($p) {
    var aggregate = {};

    $p.uniform('uFillValue', 'float', 0.0);
    $p.uniform('uBinIntervals', 'vec2', [0.0, 0.0]);
    $p.uniform('uBinCount', 'ivec2', [0, 0]);
    $p.uniform('uAggrOpt', 'float', 2.0);

    function vertexShader() {
        gl_PointSize = 1.0;

        var i, j;
        var groupKeyValue;

        i = (this.aDataIdx + 0.5) / this.uDataDim.x;
        j = (this.aDataIdy + 0.5) / this.uDataDim.y;

        if (this.aDataIdy * this.uDataDim.x + this.aDataIdx >= this.uDataSize) {
            this.vResult = 0.0;
        } else {
            if(this.uAggrOpt != 2.0) {
                this.vResult = this.getData(this.uFieldId, i, j);
            } else {
                this.vResult = 1.0;
            }
        }

        if (this.uFilterFlag == 1) {
            if (texture2D(this.fFilterResults, vec2(i, j)).a < this.uVisLevel - 0.01) {
                this.vResult = 0.0;
            }
        }

        var pos = new Vec2();
        for (var ii = 0; ii < 2; ii++) {
            var gid = new Int();
            gid = this.uGroupFields[ii];
            if (gid != -1) {
                if (this.uIndexCount > 0) {
                    if (gid == 0) {
                        groupKeyValue = i;
                    } else if (gid == 1) {
                        groupKeyValue = j;
                    }
                }
                if (this.uIndexCount == 0 || gid > 1) {
                    var d = new Vec2();
                    var w = this.getFieldWidth(gid);
                    var value = this.getData(gid, i, j);

                    d = this.getFieldDomain(gid);

                    if(this.uBinCount[ii] > 0) {
                        value = max(ceil((value - d[0]) / this.uBinIntervals[ii]), 1.0);
                        groupKeyValue = value / float(this.uBinCount[ii]);
                    } else {
                        groupKeyValue = (value - d.x) / (d.y - d.x) * w / (w + 1.0);
                        groupKeyValue += 0.5 / w;
                    }
                }
                pos[ii] = groupKeyValue * 2.0 - 1.0;
            } else {
                pos[ii] = 0.5;
            }
        }

        gl_Position = vec4(pos, 0.0, 1.0);
    }

    function fragmentShader() {
        if (this.vResult == 0.0) discard;

        if (this.uAggrOpt == 2.0)
            gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        else
            gl_FragColor = vec4(0.0, 0.0, 1.0, this.vResult);
    }

    var vs = $p.shader.vertex(vertexShader),
        fs = $p.shader.fragment(fragmentShader);

    $p.program('group', vs, fs);

    var vs2 = $p.shader.vertex(function main() {
        gl_Position = vec4(this._square, 0, 1);
    });

    var fs2 = $p.shader.fragment(function() {
        var x, y, res;
        $vec4(value);

        if (this.uAggrOpt > 3.0) {
            x = (gl_FragCoord.x) / this.uResultDim.x;
            y = (gl_FragCoord.y) / (uResultDim.y * float(this.uFieldCount));
            value = texture2D(this.uDataInput, vec2(x, y));
            res = value.a / value.b;
        } else {
            res = value.a;
        }
        gl_FragColor = vec4(0.0, 0.0, 0.0, res);
    });
    
    $p.program('group2', vs2, fs2);
    $p.program('fill', vs2,  $p.shader.fragment(function() {
        gl_FragColor = vec4(0.0, 0.0, 0.0, this.uFillValue);
    }));

    var resultFieldCount,
        getAvgValues = false,
        getVarStd = false,
        resultDomains;

    function compute(opts, groupFieldIds, resultFieldIds) {

        resultFieldCount = resultFieldIds.length;
        let gl = $p.program('fill');
        $p.bindFramebuffer('fGroupResults');

        if(!$p._progress) {
            gl.clearColor(0.0, 0.0, 0.0, 0.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        }

        gl.disable(gl.BLEND);
        resultFieldIds.forEach(function(f, i) {
            gl.viewport(0, i * $p.resultDimension[1], $p.resultDimension[0], $p.resultDimension[1]);
            var opt = aggrOpts.indexOf(opts[i]);
            if (opt == 0) {
                $p.uniform.uFillValue = largest;
                gl.drawArrays(gl.TRIANGLES, 0, 6);
            } else if(opt == 1) {
                $p.uniform.uFillValue = smallest;
                gl.drawArrays(gl.TRIANGLES, 0, 6);
            }
        });

        gl = $p.program('group');
      
        $p.framebuffer.enableRead('fDerivedValues');
        $p.framebuffer.enableRead('fFilterResults');

        gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdx.location, 0);
        gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataValx.location, 0);
        gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdy.location, 1);
        gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataValy.location, 1);

        $p.uniform.uGroupFields = groupFieldIds;

        gl.disable(gl.CULL_FACE);
        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.blendEquation(gl.FUNC_ADD);
        $p.uniform.uResultDim = $p.resultDimension;

        let postComputeFieldIds = [];
        
        getAvgValues = false;
        getVarStd = false;

        resultFieldIds.forEach(function(f, i) {
            var opt = aggrOpts.indexOf(opts[i]);
            if (opt == -1) throw Error('unknowm operator for aggregation: ' + opts[i]);

            if (opt > 3) {
                getAvgValues = true;
                $p.bindFramebuffer('fAggrStats');
                postComputeFieldIds.push(i);
            } else {
                $p.bindFramebuffer('fGroupResults');
            }

            gl.viewport(0, i * $p.resultDimension[1], $p.resultDimension[0], $p.resultDimension[1]);
            if (opt == 0) {
                gl.blendEquation(gl.MIN_EXT);
            } else if (opt == 1) {
                gl.blendEquation(gl.MAX_EXT);
            } else {
                gl.blendEquation(gl.FUNC_ADD);
            }

            $p.uniform.uFieldId = f;
            $p.uniform.uAggrOpt = opt;
            gl.ext.drawArraysInstancedANGLE(
                gl.POINTS, 0,
                $p.dataDimension[0],
                $p.dataDimension[1]
            );
        });
        $p.uniform.uFieldCount.data = resultFieldIds.length;
        if(getAvgValues) {
            postCompute(opts, postComputeFieldIds, resultFieldIds);
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    function postCompute(opts, postComputeFieldIds, resultFieldIds) {
        $p.uniform.uDataInput.data = $p.framebuffer.fAggrStats.texture;
        var gl = $p.program('group2');
        $p.bindFramebuffer('fGroupResults');
        $p.uniform.uResultDim = $p.resultDimension;
        $p.framebuffer.enableRead('fAggrStats');
        // gl.ext.vertexAttribDivisorANGLE($p.attribute._square.location, 0);
        gl.viewport(0, 0, $p.resultDimension[0], $p.resultDimension[1]* resultFieldIds.length);
        gl.disable(gl.BLEND);

        postComputeFieldIds.forEach(function(f) {
            $p.uniform.uAggrOpt = aggrOpts.indexOf(opts[f]);
            $p.uniform.uFieldId = f;
            gl.viewport(0, 
                f * $p.resultDimension[1], 
                $p.resultDimension[0], 
                $p.resultDimension[1]
            );
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        })
    }

    aggregate.execute = function(spec) {
        let groupFields = spec.$by || spec.$group;
        let groupFieldIds = [-1, -1];

        if (!Array.isArray(groupFields)) groupFields = [groupFields];
        if (groupFields.length == 2) {
            groupFieldIds[0] = $p.fields.indexOf(groupFields[0]);
            groupFieldIds[1] = $p.fields.indexOf(groupFields[1]);
            $p.resultDimension = [
                $p.fieldWidths[groupFieldIds[0]],
                $p.fieldWidths[groupFieldIds[1]]
            ];
        } else {
            groupFieldIds[0] = $p.fields.indexOf(groupFields[0]);
            $p.resultDimension = [$p.fieldWidths[groupFieldIds[0]], 1];
        }

        let newFieldSpec = spec.$collect || spec.$reduce || spec.$out || null;

        // For backward compatibility, allowing new fields specified without using the $collect or $reduce
        if (newFieldSpec === null) {
            newFieldSpec = {};
            Object.keys(spec).filter(function(d) {
                return d != '$by' && d != '$group';
            }).forEach(function(d) {
                newFieldSpec[d] = spec[d];
            });
        }

        let newFieldNames = Object.keys(newFieldSpec);
        let resultFields = newFieldNames.map(f => newFieldSpec[f][Object.keys(newFieldSpec[f])[0]]);
        let resultFieldIds = resultFields.map( f => (f == '*') ? 0 : $p.fields.indexOf(f));
        let operators = resultFields.map( (f,i) => { 
            return (typeof(newFieldSpec[newFieldNames[i]]) === 'object')
                ? Object.keys(newFieldSpec[newFieldNames[i]])[0]
                : newFieldSpec[newFieldNames[i]]
        });

        let twoPassFields = operators.filter(opt => aggrOpts.indexOf(opt) > 2 );

        if (!$p._update && !$p._progress) {
            $p.framebuffer(
                'fGroupResults',
                'float', [$p.resultDimension[0], $p.resultDimension[1] * resultFieldIds.length]
            );

            if(twoPassFields.length > 0) {
                $p.framebuffer(
                    'fAggrStats',
                    'float', [$p.resultDimension[0], $p.resultDimension[1] * resultFieldIds.length]
                );
            }
        }

        $p.bindFramebuffer('fGroupResults');

        compute(operators, groupFieldIds, resultFieldIds);

        $p.getResult = aggregate.result;
        $p.indexes = groupFields;
        $p.dataDimension = $p.resultDimension;

        $p.uniform.uDataInput.data = $p.framebuffer.fGroupResults.texture;

        var oldFieldIds = groupFields.concat(resultFields).map( f => $p.fields.indexOf(f));

        $p.fields = groupFields
            // .map(function(gf) {
            //     return (gf.substring(0, 4) == 'bin@') ? gf.slice(4) : gf;
            // })
            .concat(newFieldNames);

        $p.uniform.uDataDim.data = $p.resultDimension;
        $p.uniform.uIndexCount.data = $p.indexes.length;
        $p.uniform.uFieldCount.data = $p.fields.length - $p.indexes.length;

        // $p.fieldWidths = $p.fieldWidths.concat($p.deriveWidths);
        // $p.fieldDomains = $p.fieldDomains.concat($p.deriveDomains);
       
        let newFieldDomains = oldFieldIds.map(f => $p.fieldDomains[f]);
        let newFieldWidths = oldFieldIds.map(f => $p.fieldWidths[f]);
        
        oldFieldIds.slice(0, groupFields.length).forEach((fid, fii) => {
            if($p.uniform.uBinCount.data[fii] > 0) {
                // Array.from(Array($p.uniform.uBinCount.data).keys())
                newFieldDomains[fii] = [0, $p.uniform.uBinCount.data[fii]-1];
            }
        })
        $p.uniform.uBinCount.data = [0,0];

        $p.fieldDomains = newFieldDomains;
        $p.fieldWidths = newFieldWidths;
        // $p.uniform.uDataInput.data = $p.framebuffer.fGroupResults.texture;
       
        $p.attribute.aDataItemId = seqFloat(0, $p.resultDimension[0] * $p.resultDimension[1] - 1);
        $p.dataSize = $p.resultDimension[0] * $p.resultDimension[1];
        $p.uniform.uDataSize.data = $p.dataSize;

        $p.indexes.forEach(function(d, i) {
            // $p.attribute['aDataId' + vecId[i]] = seqFloat(0, $p.resultDimension[i]-1);
            $p.attribute['aDataId' + aggregate_vecId[i]] = new Float32Array($p.resultDimension[i]).map(function(d, i) {
                return i;
            });
            $p.attribute['aDataVal' + aggregate_vecId[i]] = new Float32Array($p.resultDimension[i]).map(function(d, i) {
                return i;
            });
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute['aDataId' + aggregate_vecId[i]].location, i);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute['aDataVal' + aggregate_vecId[i]].location, i);
        });

        if ($p.indexes.length == 1) {
            $p.attribute.aDataIdy = new Float32Array(1);
            $p.attribute.aDataValy = new Float32Array(1);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdy.location, 1);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataValy.location, 1);
        }
        if (!$p._update) {
            let resultFieldIds = resultFields.map( f => (f == '*') ? 0 : $p.fields.indexOf(f));
            resultDomains = $p.extent(resultFieldIds, $p.dataDimension);
        }
        for (var ii = $p.indexes.length; ii < $p.indexes.length + resultFields.length; ii++) {
            $p.fieldDomains[ii] = resultDomains[ii - $p.indexes.length];
            $p.fieldWidths[ii] = resultDomains[ii - $p.indexes.length][1] - resultDomains[ii - $p.indexes.length][0];
        }

        $p.uniform.uFieldDomains.data = $p.fieldDomains;
        $p.uniform.uFieldWidths.data = $p.fieldWidths;
        $p.uniform.uFilterFlag.data = 0;

        $p.indexes.forEach(function(d, i) {
            // $p.attribute['aDataId' + vecId[i]] = seqFloat(0, $p.resultDimension[i]-1);
            var interval = 1;
            var ifid = $p.fields.indexOf(d);
            // if ($p.intervals.hasOwnProperty(d))
            //     interval = $p.intervals[d].interval;

            $p.attribute['aDataVal' + aggregate_vecId[i]] = seqFloat(
                $p.fieldDomains[ifid][0],
                $p.fieldDomains[ifid][1],
                interval
            );

            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute['aDataId' + aggregate_vecId[i]].location, i);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute['aDataVal' + aggregate_vecId[i]].location, i);
        });

        $p.getResultBuffer = aggregate.result;
    }

    aggregate.result = function(arg) {
        let options = arg || {};
        let offset = options.offset || [0, 0];
        let resultSize = options.size || $p.resultDimension[0] * $p.resultDimension[1];
        let rowTotal = Math.min(resultSize, $p.resultDimension[0]);
        let colTotal = Math.ceil(resultSize / $p.resultDimension[0]);
        let result = new Float32Array(rowTotal * colTotal * 4 * resultFieldCount);
        
        $p.bindFramebuffer('fGroupResults');

        let gl = $p.program('group');
        gl.readPixels(offset[0], offset[1], rowTotal, colTotal * resultFieldCount, gl.RGBA, gl.FLOAT, result);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return result.filter((d, i) => i % 4 === 3);
    }

    return aggregate;
}

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/ops/cache.js
function cache_cache($p) {
    var cache = {},
        dataDimension = $p.uniform.uDataDim.data,
        fieldCount =  $p.uniform.uFieldCount.data,
        cacheTag;

    var vs = $p.shader.vertex(function () {
         gl_Position = vec4(this._square, 0, 1);
    });

    var fs = $p.shader.fragment(function () {
        var x, y;

        x = (gl_FragCoord.x) / this.uDataDim.x;
        y = (gl_FragCoord.y) / (this.uDataDim.y * float(this.uFieldCount));

        gl_FragColor = texture2D(this.uDataInput, vec2(x, y));
    });

    $p.program("cache", vs, fs);

    cache.execute = function(tag) {
        cacheTag = tag;
        dataDimension = $p.uniform.uDataDim.data;
        fieldCount = $p.uniform.uFieldCount.data;
        $p.framebuffer(tag, "float", [dataDimension[0], dataDimension[1] * fieldCount]);
        $p.bindFramebuffer(tag);
        var gl = $p.program("cache");
        gl.viewport(0, 0, dataDimension[0], dataDimension[1] * fieldCount);
        gl.clearColor( 0.0, 0.0, 0.0, 0.0 );
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
        gl.disable(gl.CULL_FACE);
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.BLEND);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        $p.framebuffer.enableRead(tag);
        $p.uniform.uDataInput = $p.framebuffer[tag].texture;
    }

    cache.result =  function() {
        var gl = $p.ctx;
        $p.bindFramebuffer(cacheTag);
        dataDimension = $p.uniform.uDataDim.data;
        var result = new Float32Array(dataDimension[0]*dataDimension[1]*4*fieldCount);
        gl.readPixels(0, 0, dataDimension[0], dataDimension[1] * fieldCount, gl.RGBA, gl.FLOAT, result);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        result = result.filter(function(d, i){ return i%4===3;} );
        return result;
    }

    return cache;
}

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/ops/derive.js

function derive($p, spec) {

    var derive = {},
        dataDimension = $p.uniform.uDataDim.data,
        deriveMax = $p.uniform.uDeriveCount.data,
        derivedFields = Object.keys(spec);

    var fields = $p.fields;

    var marco = "\t";

    derivedFields.forEach(function(d, i){
        var re = new RegExp("("+fields.join("|")+")","g");
        // var formula = spec[d].replace(/@([\w|\d|_]+)/g, function(matched){
        var formula = spec[d].replace(re, function(matched){
            // console.log(matched);
            var index = fields.indexOf(matched);
            return 'this.getData('  + index + ', pos.x, pos.y)';
        });
        marco += 'if (index == ' + i + ') return ' + formula + "; \n \telse ";
    });

    marco += " return 0.0;";

    $p.uniform("uOptMode", "float", 0)
        .uniform("uDeriveId", "int", 0)
        .subroutine("getDerivedValue", "float", new Function("$int_index", "$vec2_pos", marco));

    console.log(marco)
    function vertexShader() {
        gl_PointSize = 1.0;

        var i, j;

        i = (this.aDataIdx+0.5) / this.uDataDim.x;
        j = (this.aDataIdy+0.5) / this.uDataDim.y;

        this.vResult = this.getDerivedValue(this.uDeriveId, vec2(i, j));
        if(this.uFilterFlag == 1) {
            if(texture2D(this.fFilterResults, vec2(i, j)).a == 0.0)
                this.vResult = 0.0;
        }
        var x, y;
        if(this.uOptMode == 0.0){
            x = 0.5;
            y = 0.5;
        } else {
            x = i * 2.0 - 1.0;
            y = j * 2.0 - 1.0;
        }

        gl_Position = vec4(x, y, 0.0, 1.0);
    }

    function fragmentShader() {
        if(this.vResult == 0.0) discard;
        if(this.uOptMode > 0.0 || this.vResult >= 0.0)
            gl_FragColor = vec4(0.0, 0.0, 1.0, this.vResult);
        else
            gl_FragColor = vec4(-1.0, this.vResult, 0.0, 0.0);
    }

    var vs = $p.shader.vertex(vertexShader),
        fs = $p.shader.fragment(fragmentShader),
        gl = $p.createProgram("derive", vs, fs);

    // gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdx.location, 0);
    // gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataValx.location, 0);
    // gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdy.location, 1);
    // gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataValy.location, 1);

    function _execute() {

        var gl = $p.program("derive");
        $p.framebuffer.enableRead("fFilterResults");
        $p.bindFramebuffer("fDerivedValues");
        gl.disable(gl.CULL_FACE);
        gl.disable(gl.DEPTH_TEST);
        gl.enable( gl.BLEND );
        gl.blendFunc( gl.ONE, gl.ONE );
        gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdx.location, 0);
        gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdy.location, 1);
        
        if($p.indexes.length > 0)
            gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataValx.location, 0);
       
        if($p.indexes.length > 1)
            gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataValy.location, 1);
        $p.uniform.uOptMode = 0.0;
        // $p.uniform.uDeriveCount = derivedFields.length;
        var deriveDomains = [];
        derivedFields.forEach(function(d, i){
            $p.uniform.uDeriveId = i;
            gl.clearColor( 0.0, 0.0, 0.0, 0.0 );
            gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
            gl.viewport(0, 0, 1,  1);

            var result = new Float32Array(8);

            gl.blendEquation(gl.MAX_EXT);
            gl.ext.drawArraysInstancedANGLE(gl.POINTS, 0, dataDimension[0], dataDimension[1]);
            // gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, max);

            gl.viewport(1, 0, 1,  1);
            gl.ext.drawArraysInstancedANGLE(gl.POINTS, 0, dataDimension[0], dataDimension[1]);

            gl.blendEquation(gl.MIN_EXT);
            gl.ext.drawArraysInstancedANGLE(gl.POINTS, 0, dataDimension[0], dataDimension[1]);
            gl.readPixels(0, 0, 2, 1, gl.RGBA, gl.FLOAT, result);

            var minValue = (result[4] < 0) ? result[5] : result[7],
                maxValue = (result[2] > 0) ? result[3] : result[1];
            deriveDomains[i] = [minValue, maxValue];

            // deriveDomains[i] = [Math.min(min[0], min[3]), Math.max(max[0], max[3])];
        });
        gl.viewport(0, 0, dataDimension[0], dataDimension[1]*deriveMax);
        gl.disable( gl.BLEND );
        gl.clearColor( 0.0, 0.0, 0.0, 0.0 );
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

        $p.uniform.uOptMode = 1.0;

        derivedFields.forEach(function(d, i){
            $p.uniform.uDeriveId = i;
            gl.viewport(0, dataDimension[1]*i, dataDimension[0], dataDimension[1]);
            gl.ext.drawArraysInstancedANGLE(gl.POINTS, 0, dataDimension[0], dataDimension[1]);
        });

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return deriveDomains;
    }

    derive.execute = function(spec) {
        var derivedFields = Object.keys(spec);
        var newDerivedDomains = _execute();
        if(!$p._update) {
            newDerivedDomains.forEach(function(d, i) {
                var fieldId = $p.fields.indexOf(derivedFields[i]);
                if(fieldId === -1) {
                    $p.fields.push(derivedFields[i]);
                    fieldId = $p.fields.indexOf(derivedFields[i]);
                    $p.deriveCount += 1;
                }

                $p.fieldDomains[fieldId] = d;
                $p.fieldWidths[fieldId] = d[1] - d[0] + 1;
            });
            $p.uniform.uFieldDomains.value($p.fieldDomains);
            $p.uniform.uFieldWidths.data = $p.fieldWidths;
        }
    }

    derive.result = function(arg) {
        var options = arg || {},
            offset = options.offset || [0, 0],
            resultSize = options.size || $p.dataDimension[0]* $p.dataDimension[1],
            fid = options.fieldId || options.deriveFieldId || 0,
            rowSize = Math.min(resultSize, $p.dataDimension[0]),
            colSize = Math.ceil(resultSize/$p.dataDimension[0]);

        var result = new Float32Array(rowSize * colSize * 4);
        gl.readPixels(0, dataDimension[1]*fid, rowSize, colSize, gl.RGBA, gl.FLOAT, result);
        return result.filter(function(d, i){ return i%4===3;} ); //return channel alpha in rgba
    }

    return derive;
}

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/ops/extent.js

const extent_smallest = -Math.pow(2, 128);
function extent($p) {

    var vs = $p.shader.vertex(function() {
        gl_PointSize = 1.0;
        var i, j;
        if (this.aDataIdy * this.uDataDim.x + this.aDataIdx >= this.uDataSize) {
            this.vDiscardData = 1.0;
        } else {
            this.vDiscardData = 0.0;
            i = (this.aDataIdx + 0.5) / this.uDataDim.x;
            j = (this.aDataIdy + 0.5) / this.uDataDim.y;
            this.vResult = this.getData(this.uFieldId, i, j);
        }
        gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
    });

    var fs = $p.shader.fragment(function() {
        if (this.vDiscardData == 1.0) discard;
        if (this.vResult >= 0.0) {
            gl_FragColor = vec4(0.0, 0.0, 1.0, this.vResult);
        } else {
            gl_FragColor = vec4(-1.0, this.vResult, 0.0, 0.0);
        }
    });

    var gl = $p.program("stats", vs, fs);

    return function(fieldIds, dataDimension) {
        if (!$p._update) {
            $p.framebuffer("fStats", "float", [2, fieldIds.length]);
        }
        var gl = $p.program("stats");
        $p.framebuffer.enableRead("fGroupResults");

        gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdx.location, 0);
        gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataValx.location, 0);
        gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdy.location, 1);
        gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataValy.location, 1);

        $p.bindFramebuffer("fStats");
        gl.clearColor(extent_smallest, extent_smallest, extent_smallest, extent_smallest);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.disable(gl.CULL_FACE);
        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);

        var extents = new Array(fieldIds.length);
        var start = new Date();
        var idCount = $p.uniform.uIndexCount.data;
        fieldIds.forEach(function(d, i) {
            $p.uniform.uFieldId = i + idCount;
            gl.viewport(0, i, 1, 1);
            gl.blendEquation(gl.MAX_EXT);
            gl.ext.drawArraysInstancedANGLE(gl.POINTS, 0, dataDimension[0], dataDimension[1]);
            // gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, max);

            gl.viewport(1, i, 1, 1);
            gl.ext.drawArraysInstancedANGLE(gl.POINTS, 0, dataDimension[0], dataDimension[1]);

            gl.blendEquation(gl.MIN_EXT);
            gl.ext.drawArraysInstancedANGLE(gl.POINTS, 0, dataDimension[0], dataDimension[1]);

            // var extent = new Float32Array(8);
            // gl.readPixels(0, i, 2, 1, gl.RGBA, gl.FLOAT, extent);
            // console.log(extent);
            // var ext = extent;
            // var minValue = (ext[0] > 0) ? ext[1] : ext[7],
            //     maxValue = (ext[2] > 0) ? ext[3] : ext[5];
            //  extents[i] = [minValue, maxValue];
        });
        var extent = new Float32Array(8 * fieldIds.length);
        gl.readPixels(0, 0, 2, fieldIds.length, gl.RGBA, gl.FLOAT, extent);
        fieldIds.forEach(function(d, i) {
            var ext = extent.slice(i * 8, i * 8 + 8);
            var minValue = (ext[4] < 0) ? ext[5] : ext[7],
                maxValue = (ext[2] > 0) ? ext[3] : ext[1];
            extents[i] = [minValue, maxValue];
        });
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return extents;
    }
}

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/ops/match.js
function vertexShaderFilter(){
    var i, j, k, value;
    var filter = new Int(0);
    var sel = new Int(0);
    var visSelect = new Bool(false);
    i = (this.aDataIdx+0.5) / this.uDataDim.x;
    j = (this.aDataIdy+0.5) / this.uDataDim.y;

    for(var f = 0; f < $(fieldCount)+$(indexCount); f++) {
        if(this.uFilterControls[f] == 1 || this.uVisControls[f] == 1) {
            value = this.getData(f, i, j);

            if(this.uFilterControls[f] == 1) {
                if(value < this.uFilterRanges[f].x || value > this.uFilterRanges[f].y) {
                    filter -= 1;
                }
            }
            if(this.uVisControls[f] == 1) {
                if(value < this.uVisRanges[f].x || value > this.uVisRanges[f].y) {
                    sel -= 1;
                }
                visSelect = true;
            }
        }
    }
    this.vResult = 0.1;
    if(filter < 0) {
        this.vResult = 0.0;
    } else {
        if(visSelect)
            this.vResult = (sel < 0) ? 0.1 : 0.2;
    }
    var x = i * 2.0 - 1.0;
    var y = j * 2.0 - 1.0;
    gl_PointSize = 1.0;
    gl_Position = vec4(x, y, 0.0, 1.0);
}

function vertexShaderSelect() {
    var i, j, k, value;
    i = (this.aDataIdx+0.5) / this.uDataDim.x;
    j = (this.aDataIdy+0.5) / this.uDataDim.y;
    this.vResult = this.uFilterLevel - 0.1;
    value = this.getData(this.uFieldId, i, j);
    for(var l = 0; l < 100; l++){
        if(l < this.uSelectCount) {
            if(value == this.uInSelections[l]) {
                this.vResult = this.uFilterLevel;
            }
        }
    }
    var x = i * 2.0 - 1.0;
    var y = j * 2.0 - 1.0;
    gl_PointSize = 1.0;
    gl_Position = vec4(x, y, 0.0, 1.0);
}

function match_fragmentShader() {
    gl_FragColor = vec4(0., 0., 0., this.vResult);
}

function match($p) {
    const SELECT_MAX = 100;
    var match = {},
        dataDimension = $p.uniform.uDataDim.data,
        fieldCount = $p.fields.length,
        filterControls = new Array(fieldCount).fill(0),
        filterRanges = $p.fieldDomains,
        visControls = new Array(fieldCount).fill(0),
        visRanges = $p.fieldDomains,
        inSelections = new Array(SELECT_MAX);

    $p.uniform("uInSelections", "float", Float32Array.from(inSelections));
    $p.uniform("uSelectMax", "int", SELECT_MAX);
    $p.uniform("uSelectCount", "int", 0);

    var filter = {
        vs: $p.shader.vertex(vertexShaderFilter),
        fs: $p.shader.fragment(match_fragmentShader)
    };

    var sel = {
        vs: $p.shader.vertex(vertexShaderSelect),
        fs: $p.shader.fragment(match_fragmentShader)
    };

    $p.program("filter", filter.vs, filter.fs);
    $p.program("match", sel.vs, sel.fs);

    match.control = function(ctrl) {
        // filterControls = ctrl;
    }

    function _execute(spec){
        var fields = $p.fields
        var gl;
        var matchFields = Object.keys(spec).filter(function(s){
            return spec[s].hasOwnProperty('$in');
        })
        .concat(Object.keys($p.crossfilters).filter(function(s){
            return $p.crossfilters[s].hasOwnProperty('$in');
        }))

        $p.bindFramebuffer("fFilterResults");
       
        $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdy.location, 1);
        $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataValy.location, 1);
        if(matchFields.length) {
            gl = $p.program("match");
            if($p.deriveCount > 0) {
                $p.framebuffer.enableRead("fDerivedValues");
            }

            gl.viewport(0, 0, dataDimension[0], dataDimension[1]);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdx.location, 0);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataValx.location, 0);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdy.location, 1);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataValy.location, 1);
            gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
            gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
            gl.enable( gl.BLEND );
            gl.blendFunc( gl.ONE, gl.ONE );
            gl.blendEquation(gl.MIN_EXT);

            matchFields.forEach(function(k){
                var fieldId = $p.fields.indexOf(k);
                var inSelections = (spec.hasOwnProperty(k)) ? spec[k].$in :  $p.crossfilters[k].$in;
                if($p.categoryIndex.hasOwnProperty(k)) {
                    inSelections = inSelections
                        .slice(0, SELECT_MAX)
                        .map(function(v) { return $p.categoryIndex[k][v]; });
                } else {
                    inSelections = inSelections.slice(0, SELECT_MAX);
                }
                $p.uniform.uSelectCount = inSelections.length;
                $p.uniform.uInSelections = Float32Array.from(inSelections);
                $p.uniform.uFieldId = fieldId;

                gl.ext.drawArraysInstancedANGLE(gl.POINTS, 0, $p.dataDimension[0], $p.dataDimension[1]);
                // filterRanges[fieldId*2] = Math.min.apply(null, spec[k].$in);
                // filterRanges[fieldId*2+1] = Math.max.apply(null, spec[k].$in);
                filterRanges[fieldId] = [Math.min.apply(null, inSelections), Math.max.apply(null, inSelections)];
            })
        }

        var filterSelections = Object.keys(spec).filter(function(s){
            return !spec[s].hasOwnProperty('$in');
        });

        var viewSelections = Object.keys($p.crossfilters).filter(function(s){
            return !$p.crossfilters[s].hasOwnProperty('$in');
        });;
     
        if(filterSelections.length || viewSelections.length){
            filterControls = new Array(fieldCount).fill(0);

            filterSelections.forEach(function(k){
                var fieldId = $p.fields.indexOf(k);
                if(fieldId === -1) {
                    console.log('Skipped: Matching on invalid data field ' + k);
                    return;
                }
                if(spec[k].length < 2) spec[k][1] = spec[k][0];
                filterControls[fieldId] = 1;
                filterRanges[fieldId] = spec[k];
                // filterRanges[fieldId*2] = spec[k][0];
                // filterRanges[fieldId*2+1] = spec[k][1];
            });

            viewSelections.forEach(function(k){
                
                var fieldId = $p.fields.indexOf(k);
                if(fieldId === -1) {
                    console.log('Skipped: Matching on invalid data field ' + k);
                    return;
                }
                if($p.crossfilters[k].length < 2) $p.crossfilters[k][1] = $p.crossfilters[k][0];
                visControls[fieldId] = 1;
                visRanges[fieldId] = $p.crossfilters[k];
            });

            $p.uniform.uFilterControls.data = filterControls;
            $p.uniform.uFilterRanges.data = filterRanges;
            $p.uniform.uVisControls.data = visControls;
            $p.uniform.uVisRanges.data = visRanges;
            gl = $p.program("filter");
            if($p.deriveCount > 0) {
                $p.framebuffer.enableRead("fDerivedValues");
            }
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdx.location, 0);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataValx.location, 0);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdy.location, 1);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataValy.location, 1);
            gl.disable(gl.BLEND);
            // gl.clearColor( 0.0, 0.0, 0.0, 0.0 );
            // gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
            gl.viewport(0, 0, $p.dataDimension[0], $p.dataDimension[1]);
            gl.ext.drawArraysInstancedANGLE(gl.POINTS, 0, $p.dataDimension[0], $p.dataDimension[1]);
        }
        $p.ctx.bindFramebuffer($p.ctx.FRAMEBUFFER, null);
        return filterRanges;
    }

    match.execute = function(spec) {
        filterControls = new Array($p.fields.length).fill(0);
        visControls = new Array($p.fields.length).fill(0);
        var filterSpec = spec;

        Object.keys($p.crossfilters).forEach(function(k, i) {
            if($p.categoryIndex.hasOwnProperty(k) && !$p.crossfilters[k].$in) {
                $p.crossfilters[k] = {$in: $p.crossfilters[k]};
            }
        });

        Object.keys(filterSpec).forEach(function(k, i) {
            if($p.categoryIndex.hasOwnProperty(k) && !spec[k].$in) {
                spec[k] = {$in: spec[k]};
            }
        });

        $p.uniform.uFilterFlag = 1;
        if(!$p._update) {
           
            $p.framebuffer("fFilterResults", "unsigned_byte", $p.dataDimension);
            filterRanges = $p.fieldDomains.slice();
            visRanges = $p.fieldDomains.slice();
        }
        var newDomains = _execute(spec);

        if(!$p._update){
            newDomains.forEach(function(domain, fid) {
                var d = domain;
                // if($p.dtypes[fid] == 'int') d[1] -= 1;
                $p.fieldDomains[fid] = d;
                $p.fieldWidths[fid] = $p.getDataWidth(fid, d);
            });

            $p.uniform.uFieldDomains.value($p.fieldDomains);
            $p.uniform.uFieldWidths.data = $p.fieldWidths;
        }
        $p.getMatchBuffer = match.result;
    }

    match.result = function(arg) {
        var options = arg || {},
            offset = options.offset || [0, 0],
            resultSize = options.size || $p.dataDimension[0]* $p.dataDimension[1],
            rowSize = Math.min(resultSize, $p.dataDimension[0]),
            colSize = Math.ceil(resultSize/$p.dataDimension[0]);

        $p.bindFramebuffer("fFilterResults");

        var gl = $p.ctx;
        var bitmap = new Uint8Array(rowSize*colSize*4);
        gl.readPixels(offset[0], offset[1], rowSize, colSize, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return  bitmap.filter((d, i) => i % 4 === 3);
    }

    return match;
}

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/vis/gradients.js
const gradients = {
    "inferno": ["#000004", "#010005", "#010106", "#010108", "#02010a", "#02020c", "#02020e", "#030210", "#040312", "#040314", "#050417", "#060419", "#07051b", "#08051d", "#09061f", "#0a0722", "#0b0724", "#0c0826", "#0d0829", "#0e092b", "#10092d", "#110a30", "#120a32", "#140b34", "#150b37", "#160b39", "#180c3c", "#190c3e", "#1b0c41", "#1c0c43", "#1e0c45", "#1f0c48", "#210c4a", "#230c4c", "#240c4f", "#260c51", "#280b53", "#290b55", "#2b0b57", "#2d0b59", "#2f0a5b", "#310a5c", "#320a5e", "#340a5f", "#360961", "#380962", "#390963", "#3b0964", "#3d0965", "#3e0966", "#400a67", "#420a68", "#440a68", "#450a69", "#470b6a", "#490b6a", "#4a0c6b", "#4c0c6b", "#4d0d6c", "#4f0d6c", "#510e6c", "#520e6d", "#540f6d", "#550f6d", "#57106e", "#59106e", "#5a116e", "#5c126e", "#5d126e", "#5f136e", "#61136e", "#62146e", "#64156e", "#65156e", "#67166e", "#69166e", "#6a176e", "#6c186e", "#6d186e", "#6f196e", "#71196e", "#721a6e", "#741a6e", "#751b6e", "#771c6d", "#781c6d", "#7a1d6d", "#7c1d6d", "#7d1e6d", "#7f1e6c", "#801f6c", "#82206c", "#84206b", "#85216b", "#87216b", "#88226a", "#8a226a", "#8c2369", "#8d2369", "#8f2469", "#902568", "#922568", "#932667", "#952667", "#972766", "#982766", "#9a2865", "#9b2964", "#9d2964", "#9f2a63", "#a02a63", "#a22b62", "#a32c61", "#a52c60", "#a62d60", "#a82e5f", "#a92e5e", "#ab2f5e", "#ad305d", "#ae305c", "#b0315b", "#b1325a", "#b3325a", "#b43359", "#b63458", "#b73557", "#b93556", "#ba3655", "#bc3754", "#bd3853", "#bf3952", "#c03a51", "#c13a50", "#c33b4f", "#c43c4e", "#c63d4d", "#c73e4c", "#c83f4b", "#ca404a", "#cb4149", "#cc4248", "#ce4347", "#cf4446", "#d04545", "#d24644", "#d34743", "#d44842", "#d54a41", "#d74b3f", "#d84c3e", "#d94d3d", "#da4e3c", "#db503b", "#dd513a", "#de5238", "#df5337", "#e05536", "#e15635", "#e25734", "#e35933", "#e45a31", "#e55c30", "#e65d2f", "#e75e2e", "#e8602d", "#e9612b", "#ea632a", "#eb6429", "#eb6628", "#ec6726", "#ed6925", "#ee6a24", "#ef6c23", "#ef6e21", "#f06f20", "#f1711f", "#f1731d", "#f2741c", "#f3761b", "#f37819", "#f47918", "#f57b17", "#f57d15", "#f67e14", "#f68013", "#f78212", "#f78410", "#f8850f", "#f8870e", "#f8890c", "#f98b0b", "#f98c0a", "#f98e09", "#fa9008", "#fa9207", "#fa9407", "#fb9606", "#fb9706", "#fb9906", "#fb9b06", "#fb9d07", "#fc9f07", "#fca108", "#fca309", "#fca50a", "#fca60c", "#fca80d", "#fcaa0f", "#fcac11", "#fcae12", "#fcb014", "#fcb216", "#fcb418", "#fbb61a", "#fbb81d", "#fbba1f", "#fbbc21", "#fbbe23", "#fac026", "#fac228", "#fac42a", "#fac62d", "#f9c72f", "#f9c932", "#f9cb35", "#f8cd37", "#f8cf3a", "#f7d13d", "#f7d340", "#f6d543", "#f6d746", "#f5d949", "#f5db4c", "#f4dd4f", "#f4df53", "#f4e156", "#f3e35a", "#f3e55d", "#f2e661", "#f2e865", "#f2ea69", "#f1ec6d", "#f1ed71", "#f1ef75", "#f1f179", "#f2f27d", "#f2f482", "#f3f586", "#f3f68a", "#f4f88e", "#f5f992", "#f6fa96", "#f8fb9a", "#f9fc9d", "#fafda1", "#fcffa4"],
    "magma": ["#000004", "#010005", "#010106", "#010108", "#020109", "#02020b", "#02020d", "#03030f", "#030312", "#040414", "#050416", "#060518", "#06051a", "#07061c", "#08071e", "#090720", "#0a0822", "#0b0924", "#0c0926", "#0d0a29", "#0e0b2b", "#100b2d", "#110c2f", "#120d31", "#130d34", "#140e36", "#150e38", "#160f3b", "#180f3d", "#19103f", "#1a1042", "#1c1044", "#1d1147", "#1e1149", "#20114b", "#21114e", "#221150", "#241253", "#251255", "#271258", "#29115a", "#2a115c", "#2c115f", "#2d1161", "#2f1163", "#311165", "#331067", "#341069", "#36106b", "#38106c", "#390f6e", "#3b0f70", "#3d0f71", "#3f0f72", "#400f74", "#420f75", "#440f76", "#451077", "#471078", "#491078", "#4a1079", "#4c117a", "#4e117b", "#4f127b", "#51127c", "#52137c", "#54137d", "#56147d", "#57157e", "#59157e", "#5a167e", "#5c167f", "#5d177f", "#5f187f", "#601880", "#621980", "#641a80", "#651a80", "#671b80", "#681c81", "#6a1c81", "#6b1d81", "#6d1d81", "#6e1e81", "#701f81", "#721f81", "#732081", "#752181", "#762181", "#782281", "#792282", "#7b2382", "#7c2382", "#7e2482", "#802582", "#812581", "#832681", "#842681", "#862781", "#882781", "#892881", "#8b2981", "#8c2981", "#8e2a81", "#902a81", "#912b81", "#932b80", "#942c80", "#962c80", "#982d80", "#992d80", "#9b2e7f", "#9c2e7f", "#9e2f7f", "#a02f7f", "#a1307e", "#a3307e", "#a5317e", "#a6317d", "#a8327d", "#aa337d", "#ab337c", "#ad347c", "#ae347b", "#b0357b", "#b2357b", "#b3367a", "#b5367a", "#b73779", "#b83779", "#ba3878", "#bc3978", "#bd3977", "#bf3a77", "#c03a76", "#c23b75", "#c43c75", "#c53c74", "#c73d73", "#c83e73", "#ca3e72", "#cc3f71", "#cd4071", "#cf4070", "#d0416f", "#d2426f", "#d3436e", "#d5446d", "#d6456c", "#d8456c", "#d9466b", "#db476a", "#dc4869", "#de4968", "#df4a68", "#e04c67", "#e24d66", "#e34e65", "#e44f64", "#e55064", "#e75263", "#e85362", "#e95462", "#ea5661", "#eb5760", "#ec5860", "#ed5a5f", "#ee5b5e", "#ef5d5e", "#f05f5e", "#f1605d", "#f2625d", "#f2645c", "#f3655c", "#f4675c", "#f4695c", "#f56b5c", "#f66c5c", "#f66e5c", "#f7705c", "#f7725c", "#f8745c", "#f8765c", "#f9785d", "#f9795d", "#f97b5d", "#fa7d5e", "#fa7f5e", "#fa815f", "#fb835f", "#fb8560", "#fb8761", "#fc8961", "#fc8a62", "#fc8c63", "#fc8e64", "#fc9065", "#fd9266", "#fd9467", "#fd9668", "#fd9869", "#fd9a6a", "#fd9b6b", "#fe9d6c", "#fe9f6d", "#fea16e", "#fea36f", "#fea571", "#fea772", "#fea973", "#feaa74", "#feac76", "#feae77", "#feb078", "#feb27a", "#feb47b", "#feb67c", "#feb77e", "#feb97f", "#febb81", "#febd82", "#febf84", "#fec185", "#fec287", "#fec488", "#fec68a", "#fec88c", "#feca8d", "#fecc8f", "#fecd90", "#fecf92", "#fed194", "#fed395", "#fed597", "#fed799", "#fed89a", "#fdda9c", "#fddc9e", "#fddea0", "#fde0a1", "#fde2a3", "#fde3a5", "#fde5a7", "#fde7a9", "#fde9aa", "#fdebac", "#fcecae", "#fceeb0", "#fcf0b2", "#fcf2b4", "#fcf4b6", "#fcf6b8", "#fcf7b9", "#fcf9bb", "#fcfbbd", "#fcfdbf"],
    "plasma": ["#0d0887", "#100788", "#130789", "#16078a", "#19068c", "#1b068d", "#1d068e", "#20068f", "#220690", "#240691", "#260591", "#280592", "#2a0593", "#2c0594", "#2e0595", "#2f0596", "#310597", "#330597", "#350498", "#370499", "#38049a", "#3a049a", "#3c049b", "#3e049c", "#3f049c", "#41049d", "#43039e", "#44039e", "#46039f", "#48039f", "#4903a0", "#4b03a1", "#4c02a1", "#4e02a2", "#5002a2", "#5102a3", "#5302a3", "#5502a4", "#5601a4", "#5801a4", "#5901a5", "#5b01a5", "#5c01a6", "#5e01a6", "#6001a6", "#6100a7", "#6300a7", "#6400a7", "#6600a7", "#6700a8", "#6900a8", "#6a00a8", "#6c00a8", "#6e00a8", "#6f00a8", "#7100a8", "#7201a8", "#7401a8", "#7501a8", "#7701a8", "#7801a8", "#7a02a8", "#7b02a8", "#7d03a8", "#7e03a8", "#8004a8", "#8104a7", "#8305a7", "#8405a7", "#8606a6", "#8707a6", "#8808a6", "#8a09a5", "#8b0aa5", "#8d0ba5", "#8e0ca4", "#8f0da4", "#910ea3", "#920fa3", "#9410a2", "#9511a1", "#9613a1", "#9814a0", "#99159f", "#9a169f", "#9c179e", "#9d189d", "#9e199d", "#a01a9c", "#a11b9b", "#a21d9a", "#a31e9a", "#a51f99", "#a62098", "#a72197", "#a82296", "#aa2395", "#ab2494", "#ac2694", "#ad2793", "#ae2892", "#b02991", "#b12a90", "#b22b8f", "#b32c8e", "#b42e8d", "#b52f8c", "#b6308b", "#b7318a", "#b83289", "#ba3388", "#bb3488", "#bc3587", "#bd3786", "#be3885", "#bf3984", "#c03a83", "#c13b82", "#c23c81", "#c33d80", "#c43e7f", "#c5407e", "#c6417d", "#c7427c", "#c8437b", "#c9447a", "#ca457a", "#cb4679", "#cc4778", "#cc4977", "#cd4a76", "#ce4b75", "#cf4c74", "#d04d73", "#d14e72", "#d24f71", "#d35171", "#d45270", "#d5536f", "#d5546e", "#d6556d", "#d7566c", "#d8576b", "#d9586a", "#da5a6a", "#da5b69", "#db5c68", "#dc5d67", "#dd5e66", "#de5f65", "#de6164", "#df6263", "#e06363", "#e16462", "#e26561", "#e26660", "#e3685f", "#e4695e", "#e56a5d", "#e56b5d", "#e66c5c", "#e76e5b", "#e76f5a", "#e87059", "#e97158", "#e97257", "#ea7457", "#eb7556", "#eb7655", "#ec7754", "#ed7953", "#ed7a52", "#ee7b51", "#ef7c51", "#ef7e50", "#f07f4f", "#f0804e", "#f1814d", "#f1834c", "#f2844b", "#f3854b", "#f3874a", "#f48849", "#f48948", "#f58b47", "#f58c46", "#f68d45", "#f68f44", "#f79044", "#f79143", "#f79342", "#f89441", "#f89540", "#f9973f", "#f9983e", "#f99a3e", "#fa9b3d", "#fa9c3c", "#fa9e3b", "#fb9f3a", "#fba139", "#fba238", "#fca338", "#fca537", "#fca636", "#fca835", "#fca934", "#fdab33", "#fdac33", "#fdae32", "#fdaf31", "#fdb130", "#fdb22f", "#fdb42f", "#fdb52e", "#feb72d", "#feb82c", "#feba2c", "#febb2b", "#febd2a", "#febe2a", "#fec029", "#fdc229", "#fdc328", "#fdc527", "#fdc627", "#fdc827", "#fdca26", "#fdcb26", "#fccd25", "#fcce25", "#fcd025", "#fcd225", "#fbd324", "#fbd524", "#fbd724", "#fad824", "#fada24", "#f9dc24", "#f9dd25", "#f8df25", "#f8e125", "#f7e225", "#f7e425", "#f6e626", "#f6e826", "#f5e926", "#f5eb27", "#f4ed27", "#f3ee27", "#f3f027", "#f2f227", "#f1f426", "#f1f525", "#f0f724", "#f0f921"],
    "viridis": ["#440154", "#440256", "#450457", "#450559", "#46075a", "#46085c", "#460a5d", "#460b5e", "#470d60", "#470e61", "#471063", "#471164", "#471365", "#481467", "#481668", "#481769", "#48186a", "#481a6c", "#481b6d", "#481c6e", "#481d6f", "#481f70", "#482071", "#482173", "#482374", "#482475", "#482576", "#482677", "#482878", "#482979", "#472a7a", "#472c7a", "#472d7b", "#472e7c", "#472f7d", "#46307e", "#46327e", "#46337f", "#463480", "#453581", "#453781", "#453882", "#443983", "#443a83", "#443b84", "#433d84", "#433e85", "#423f85", "#424086", "#424186", "#414287", "#414487", "#404588", "#404688", "#3f4788", "#3f4889", "#3e4989", "#3e4a89", "#3e4c8a", "#3d4d8a", "#3d4e8a", "#3c4f8a", "#3c508b", "#3b518b", "#3b528b", "#3a538b", "#3a548c", "#39558c", "#39568c", "#38588c", "#38598c", "#375a8c", "#375b8d", "#365c8d", "#365d8d", "#355e8d", "#355f8d", "#34608d", "#34618d", "#33628d", "#33638d", "#32648e", "#32658e", "#31668e", "#31678e", "#31688e", "#30698e", "#306a8e", "#2f6b8e", "#2f6c8e", "#2e6d8e", "#2e6e8e", "#2e6f8e", "#2d708e", "#2d718e", "#2c718e", "#2c728e", "#2c738e", "#2b748e", "#2b758e", "#2a768e", "#2a778e", "#2a788e", "#29798e", "#297a8e", "#297b8e", "#287c8e", "#287d8e", "#277e8e", "#277f8e", "#27808e", "#26818e", "#26828e", "#26828e", "#25838e", "#25848e", "#25858e", "#24868e", "#24878e", "#23888e", "#23898e", "#238a8d", "#228b8d", "#228c8d", "#228d8d", "#218e8d", "#218f8d", "#21908d", "#21918c", "#20928c", "#20928c", "#20938c", "#1f948c", "#1f958b", "#1f968b", "#1f978b", "#1f988b", "#1f998a", "#1f9a8a", "#1e9b8a", "#1e9c89", "#1e9d89", "#1f9e89", "#1f9f88", "#1fa088", "#1fa188", "#1fa187", "#1fa287", "#20a386", "#20a486", "#21a585", "#21a685", "#22a785", "#22a884", "#23a983", "#24aa83", "#25ab82", "#25ac82", "#26ad81", "#27ad81", "#28ae80", "#29af7f", "#2ab07f", "#2cb17e", "#2db27d", "#2eb37c", "#2fb47c", "#31b57b", "#32b67a", "#34b679", "#35b779", "#37b878", "#38b977", "#3aba76", "#3bbb75", "#3dbc74", "#3fbc73", "#40bd72", "#42be71", "#44bf70", "#46c06f", "#48c16e", "#4ac16d", "#4cc26c", "#4ec36b", "#50c46a", "#52c569", "#54c568", "#56c667", "#58c765", "#5ac864", "#5cc863", "#5ec962", "#60ca60", "#63cb5f", "#65cb5e", "#67cc5c", "#69cd5b", "#6ccd5a", "#6ece58", "#70cf57", "#73d056", "#75d054", "#77d153", "#7ad151", "#7cd250", "#7fd34e", "#81d34d", "#84d44b", "#86d549", "#89d548", "#8bd646", "#8ed645", "#90d743", "#93d741", "#95d840", "#98d83e", "#9bd93c", "#9dd93b", "#a0da39", "#a2da37", "#a5db36", "#a8db34", "#aadc32", "#addc30", "#b0dd2f", "#b2dd2d", "#b5de2b", "#b8de29", "#bade28", "#bddf26", "#c0df25", "#c2df23", "#c5e021", "#c8e020", "#cae11f", "#cde11d", "#d0e11c", "#d2e21b", "#d5e21a", "#d8e219", "#dae319", "#dde318", "#dfe318", "#e2e418", "#e5e419", "#e7e419", "#eae51a", "#ece51b", "#efe51c", "#f1e51d", "#f4e61e", "#f6e620", "#f8e621", "#fbe723", "#fde725"]
};

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/vis/colorhex.js
const colorhex = {
    "aliceblue": "#f0f8ff",
    "antiquewhite": "#faebd7",
    "aqua": "#00ffff",
    "aquamarine": "#7fffd4",
    "azure": "#f0ffff",
    "beige": "#f5f5dc",
    "bisque": "#ffe4c4",
    "black": "#000000",
    "blanchedalmond": "#ffebcd",
    "blue": "#0000ff",
    "blueviolet": "#8a2be2",
    "brown": "#a52a2a",
    "burlywood": "#deb887",
    "cadetblue": "#5f9ea0",
    "chartreuse": "#7fff00",
    "chocolate": "#d2691e",
    "coral": "#ff7f50",
    "cornflowerblue": "#6495ed",
    "cornsilk": "#fff8dc",
    "crimson": "#dc143c",
    "cyan": "#00ffff",
    "darkblue": "#00008b",
    "darkcyan": "#008b8b",
    "darkgoldenrod": "#b8860b",
    "darkgray": "#a9a9a9",
    "darkgreen": "#006400",
    "darkkhaki": "#bdb76b",
    "darkmagenta": "#8b008b",
    "darkolivegreen": "#556b2f",
    "darkorange": "#ff8c00",
    "darkorchid": "#9932cc",
    "darkred": "#8b0000",
    "darksalmon": "#e9967a",
    "darkseagreen": "#8fbc8f",
    "darkslateblue": "#483d8b",
    "darkslategray": "#2f4f4f",
    "darkturquoise": "#00ced1",
    "darkviolet": "#9400d3",
    "deeppink": "#ff1493",
    "deepskyblue": "#00bfff",
    "dimgray": "#696969",
    "dodgerblue": "#1e90ff",
    "firebrick": "#b22222",
    "floralwhite": "#fffaf0",
    "forestgreen": "#228b22",
    "fuchsia": "#ff00ff",
    "gainsboro": "#dcdcdc",
    "ghostwhite": "#f8f8ff",
    "gold": "#ffd700",
    "goldenrod": "#daa520",
    "gray": "#808080",
    "green": "#008000",
    "greenyellow": "#adff2f",
    "honeydew": "#f0fff0",
    "hotpink": "#ff69b4",
    "indianred ": "#cd5c5c",
    "indigo": "#4b0082",
    "ivory": "#fffff0",
    "khaki": "#f0e68c",
    "lavender": "#e6e6fa",
    "lavenderblush": "#fff0f5",
    "lawngreen": "#7cfc00",
    "lemonchiffon": "#fffacd",
    "lightblue": "#add8e6",
    "lightcoral": "#f08080",
    "lightcyan": "#e0ffff",
    "lightgoldenrodyellow": "#fafad2",
    "lightgrey": "#d3d3d3",
    "lightgreen": "#90ee90",
    "lightpink": "#ffb6c1",
    "lightsalmon": "#ffa07a",
    "lightseagreen": "#20b2aa",
    "lightskyblue": "#87cefa",
    "lightslategray": "#778899",
    "lightsteelblue": "#b0c4de",
    "lightyellow": "#ffffe0",
    "lime": "#00ff00",
    "limegreen": "#32cd32",
    "linen": "#faf0e6",
    "magenta": "#ff00ff",
    "maroon": "#800000",
    "mediumaquamarine": "#66cdaa",
    "mediumblue": "#0000cd",
    "mediumorchid": "#ba55d3",
    "mediumpurple": "#9370d8",
    "mediumseagreen": "#3cb371",
    "mediumslateblue": "#7b68ee",
    "mediumspringgreen": "#00fa9a",
    "mediumturquoise": "#48d1cc",
    "mediumvioletred": "#c71585",
    "midnightblue": "#191970",
    "mintcream": "#f5fffa",
    "mistyrose": "#ffe4e1",
    "moccasin": "#ffe4b5",
    "navajowhite": "#ffdead",
    "navy": "#000080",
    "oldlace": "#fdf5e6",
    "olive": "#808000",
    "olivedrab": "#6b8e23",
    "orange": "#ffa500",
    "orangered": "#ff4500",
    "orchid": "#da70d6",
    "palegoldenrod": "#eee8aa",
    "palegreen": "#98fb98",
    "paleturquoise": "#afeeee",
    "palevioletred": "#d87093",
    "papayawhip": "#ffefd5",
    "peachpuff": "#ffdab9",
    "peru": "#cd853f",
    "pink": "#ffc0cb",
    "plum": "#dda0dd",
    "powderblue": "#b0e0e6",
    "purple": "#800080",
    "red": "#ff0000",
    "rosybrown": "#bc8f8f",
    "royalblue": "#4169e1",
    "saddlebrown": "#8b4513",
    "salmon": "#fa8072",
    "sandybrown": "#f4a460",
    "seagreen": "#2e8b57",
    "seashell": "#fff5ee",
    "sienna": "#a0522d",
    "silver": "#c0c0c0",
    "skyblue": "#87ceeb",
    "slateblue": "#6a5acd",
    "slategray": "#708090",
    "snow": "#fffafa",
    "springgreen": "#00ff7f",
    "steelblue": "#4682b4",
    "tan": "#d2b48c",
    "teal": "#008080",
    "thistle": "#d8bfd8",
    "tomato": "#ff6347",
    "turquoise": "#40e0d0",
    "violet": "#ee82ee",
    "wheat": "#f5deb3",
    "white": "#ffffff",
    "whitesmoke": "#f5f5f5",
    "yellow": "#ffff00",
    "yellowgreen": "#9acd32"
};

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/vis/color.js



const colorResolution = 256;
const colorSetMax = 32;
const defaultColorScheme = gradients['viridis'];
const defaultColorSet = [
    "steelblue",
    "red",
    "teal",
    "orange",
    "purple"
];

let gradient = defaultColorScheme;
let colorset = defaultColorSet;

function color_color($p) {
    let colorManager = {};

    $p.uniform('uColorMode',       'int',   0) // 0=categorical, 1=numeric
        .uniform('uColorCount',    'int',   colorSetMax)
        .uniform('uColorSet',      'vec3',  setColorTable(colorset))
        // .uniform('uColorGradient', 'vec4', setColorScheme(gradient))
        .texture('tColorGradient', 'float', setColorScheme(gradient),  [colorResolution, 1], 'rgba')
        .subroutine('mapColorRGB', 'vec3',  mapColorRGB);

    colorManager.updateScheme = function(newColors) {
        if(typeof newColors == 'string' && gradients.hasOwnProperty(newColors)) {
            gradient = gradients[newColors];
        } else if(Array.isArray(newColors)) {
            gradient = newColors;
        }
        let colorGradient = setColorScheme(gradient)
        $p.texture.tColorGradient = colorGradient;
        // $p.texture.update('tColorGradient', colorGradient, [0, 0]);
    }

    colorManager.updateTable = function(colors) {
        colorset = colors;
        $p.uniform.uColorSet = setColorTable(colors);
    }

    colorManager.colorTable = defaultColorSet.map(function(t){
        return rgba2hex(t);
    });

    colorManager.getColors = function() {
        if($p.uniform.uColorMode == 0) {
            return colorset;
        } else {
            return gradient;
        }
    }

    colorManager.updateColors = function(colors, colorMode) {
        
        colorManager.updateScheme(colors || defaultColorScheme);
        colorManager.updateTable(colors || defaultColorSet);
        if(Number.isInteger(colorMode)) {
            $p.uniform.uColorMode.data = colorMode;
        }
    }

    colorManager.rgb = rgb;
    colorManager.rgba = rgba;

    return colorManager;
}

function colorStrToHex(colorStr) {
    if (typeof colorhex[colorStr.toLowerCase()] != 'undefined') {
        return colorhex[colorStr.toLowerCase()];
    } else {
        return false;
    }
}

function rgb(hexStr) {
    var hex, r, g, b;

    if(hexStr.slice(0,1) == '#') {
        hex = hexStr.slice(1);
    } else {
        hex = colorStrToHex(hexStr).slice(1);
    }

    r = parseInt(hex.substring(0,2), 16) / 255;
    g = parseInt(hex.substring(2,4), 16) / 255;
    b = parseInt(hex.substring(4,6), 16) / 255;
    return [r, g, b];
}

function rgba(hexStr, alpha = 1.0) {
    let c = rgb(hexStr);
    return [c[0], c[1], c[2], alpha];
}

function rgba2hex(c) {
    var r = c[0],
        g = c[1],
        b = c[2],
        a = 1;
    if (r > 255 || g > 255 || b > 255 || a > 255) {
        throw 'Invalid color component';
    }
    return (256 + r).toString(16).substr(1) +((1 << 24) + (g << 16) | (b << 8) | a).toString(16).substr(1);
}

function setColorScheme(colors) {
    var cc = colors.length - 1,
        step = (cc >= 0) ? colorResolution / (cc+1) : 1,
        colorGradient = new Float32Array(colorResolution * 4);

    colors.push(colors[cc]);
    for(var i = 0; i < cc+1; i++) {
        var c0 = rgba(colors[i]),
            c1 = rgba(colors[i+1]),
            offset = Math.floor(i * step)*4;

        for(var x = 0; x < step; x++) {
            var xi = x / (step);
            colorGradient[offset+x*4]   = c0[0] + (c1[0] - c0[0]) * xi;
            colorGradient[offset+x*4+1] = c0[1] + (c1[1] - c0[1]) * xi;
            colorGradient[offset+x*4+2] = c0[2] + (c1[2] - c0[2]) * xi;
            colorGradient[offset+x*4+3] = c0[3] + (c1[3] - c0[3]) * xi;
        }
    }
    colors.pop();
    return colorGradient;
}

function setColorTable(colors) {
    let colorTable = new Float32Array(colorSetMax * 3);
    colors.forEach(function(c, i){
        let colorValue = rgb(c);
        colorTable[i*3] = colorValue[0];
        colorTable[i*3+1] = colorValue[1];
        colorTable[i*3+2] = colorValue[2];
    });
    return colorTable;
}

function mapColorRGB({fieldId = 'int', value = 'float'}) {
    var d = new Vec2();
    var colorRGB = new Vec3();
    var intValue = new Int();
    if(fieldId == -1) {
        colorRGB = this.uDefaultColor;
    } else {
        if(this.uColorMode == 1) {
            colorRGB = texture2D(this.tColorGradient, vec2(value, 1.0)).rgb;
        } else {
            d = this.uVisDomains[fieldId];
            intValue = int(value * (d.y - d.x));
            if(intValue >= this.uColorCount) {
                colorRGB = vec3(0.0, 0.0, 0.0);
            } else {
                colorRGB = this.uColorSet[intValue];
            }
        }
    }
    return colorRGB;
}

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/vis/reveal.js

function reveal($p) {
    $p.uniform('uRevealMode', 'int', 1)
        .framebuffer("offScreenFBO", "float", $p.viewport)
        .framebuffer("visStats", "float", [1, 1]);

    var aViewX = new Float32Array($p.viewport[0]).map((d, i) => i);
    var aViewY = new Float32Array($p.viewport[1]).map((d, i) => i);

    $p.attribute("aViewX", "float", aViewX);
    $p.attribute("aViewY", "float", aViewY);
    $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aViewX.location, 0);
    $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aViewY.location, 1);

    var vs = $p.shader.vertex(function(){
        var i, j;
        i = (this.aViewX+0.5) / this.uViewDim.x;
        j = (this.aViewY+0.5) / this.uViewDim.y;
        this.vColorRGBA = texture2D(this.offScreenFBO, vec2(i, j));
        gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
    });

    var fs = $p.shader.fragment(function() {
        gl_FragColor = this.vColorRGBA;
    });

    $p.program("post-processing", vs, fs);

    var vs2 = $p.shader.vertex(function () {
         gl_Position = vec4(this._square, 0, 1);
    });

    var fs2 = $p.shader.fragment(function() {
        var x, y, a;
        var value = new Vec4();
        x = (gl_FragCoord.x+0.5) / this.uViewDim.x;
        y = (gl_FragCoord.y+0.5) / this.uViewDim.y;
        value = texture2D(this.offScreenFBO, vec2(x, y));

        if(value.a == 0.0) discard;
        // a = pow(((value.a - this.uDefaultAlpha) / (this.uMaxRGBA.a -this.uDefaultAlpha)), 0.33) * 0.85 + 0.15;
        a = pow((value.a / this.uMaxRGBA.a), 0.33) * 0.9 + 0.1;
        // a = value.a / this.uMaxRGBA.a;

        if(this.uRevealMode == 0) {
            gl_FragColor = vec4(this.uDefaultColor*a, a);
        } else {
            gl_FragColor = vec4(texture2D(this.tColorGradient, vec2(1.-a, 1.0)).rgb*this.uDefaultAlpha, this.uDefaultAlpha);
        }
    });

    $p.program("vis-render", vs2, fs2);

    let isFBOAllocatedFBO = false;

    return function(options) {
        var gl,
            viewIndex = options.viewIndex,
            viewDim = options.dim,
            offset = options.offset || [0, 0],
            padding = options.padding || {left: 0, right: 0, left: 0, right:0};

        if(!$p._update) {

            if(!isFBOAllocatedFBO) {
                isFBOAllocatedFBO = true;
                $p.framebuffer("visStats", "float", [1, $p.views.length]);
            }
            gl = $p.program("post-processing");
            $p.framebuffer.enableRead("offScreenFBO");
            $p.bindFramebuffer("visStats");

            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute._square.location, 0);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aViewX.location, 0);
            $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aViewY.location, 1);
            // gl.clearColor( 0.0, 0.0, 0.0, 0.0 );
            // gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
            gl.disable(gl.CULL_FACE);
            gl.disable(gl.DEPTH_TEST);
            gl.enable( gl.BLEND );
            gl.blendFunc( gl.ONE, gl.ONE );
            gl.blendEquation(gl.MAX_EXT);
            gl.viewport(0, viewIndex, 1, 1);
            gl.ext.drawArraysInstancedANGLE(
                gl.POINTS,
                0,
                viewDim[0],
                viewDim[1]);

            var max = new Float32Array(4);
            gl.readPixels(0, viewIndex, 1, 1, gl.RGBA, gl.FLOAT, max);
            // if(max[3] == 0) {
            //     max[3] = Math.sqrt($p.dataSize) * Math.log2($p.dataSize);
            // }
            console.log(offset, viewDim);
            $p.views[viewIndex].maxRGBA = max;
        }

        $p.uniform.uMaxRGBA = $p.views[viewIndex].maxRGBA;

        $p.bindFramebuffer(null);
        gl = $p.program("vis-render");
        gl.ext.vertexAttribDivisorANGLE($p.attribute._square.location, 0);
        $p.framebuffer.enableRead("offScreenFBO");

        gl.viewport(
            offset[0] + padding.left,
            // offset[1] + padding.bottom,
            $p.viewport[1] - viewDim[1] + padding.bottom - offset[1],
            viewDim[0] - padding.left - padding.right,
            viewDim[1] - padding.top - padding.bottom
        );
        // gl.blendEquation(gl.FUNC_ADD);
        gl.disable( gl.BLEND );
        // gl.clearColor( 0.0, 0.0, 0.0, 0.0 );
        // gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
}

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/vis/encode.js
const visualEncodings = ['x', 'y', 'color', 'opacity', 'width', 'height', 'size'];

function encode($p, vmap, colorManager) {
    let opacity = vmap.opacity || vmap.alpha;
    let vmapIndex = new Int32Array(visualEncodings.length);
    
    visualEncodings.forEach(function(code, codeIndex){
        vmapIndex[codeIndex] = $p.fields.indexOf(vmap[code]);
    })
    $p.uniform.uVisualEncodings.data = vmapIndex;
    $p.uniform.uDefaultAlpha.data = 1.0;
    if(vmapIndex[2] === -1) {
        if (typeof(vmap.color) === 'string'){
            if(vmap.color === 'auto') {
                $p.revealDensity = true;
                $p.uniform.uRevealMode.data = 1;
            } else {
                $p.uniform.uDefaultColor.data = colorManager.rgb(vmap.color);
            }
        } else {
            if(typeof(vmap.size) == 'number') {
                $p.uniform.uMarkSize = vmap.size;
            }
        }
    } else {
        if($p.categoryLookup.hasOwnProperty(vmap.color)) {
            $p.uniform.uColorMode.data = 0;
        } else {
            $p.uniform.uColorMode.data = 1;
        }
    }

    if(typeof(opacity) === 'number') {
        $p.uniform.uDefaultAlpha.data = opacity;
    } else if(vmapIndex[3] === -1 &&
        typeof(opacity) == 'string' &&
        opacity == 'auto'
    ) {
        $p.revealDensity = true;
        $p.uniform.uRevealMode.data = 0;
        // $p.uniform.uDefaultAlpha.data = 1.0;
    }

    if(vmapIndex[6] === -1 && typeof(vmap.size) == 'number') {
        $p.uniform.uMarkSize = vmap.size;
    }

    let viewSetting = {scale: {}, histogram: {}};
    let isRect = (['rect', 'bar'].indexOf(vmap.mark) !== -1);
    let markSpace = [0, 0];
    let isXYCategorical = [0, 0];
    if(vmapIndex[0] > -1) {
        let len = $p.fieldWidths[vmapIndex[0]];
        let ext = $p.fieldDomains[vmapIndex[0]];
        if($p.categoryLookup.hasOwnProperty(vmap.x)){
            viewSetting.scale.x = 'categorical';
            viewSetting.domainX = new Array(len).fill(0).map(
                (d,i) => $p.categoryLookup[vmap.x][i]
            );
            isXYCategorical[0] = 1;
         } else if (isRect) {
            viewSetting.scale.x = 'ordinal';
            viewSetting.domainX = new Array(len).fill(0).map((d,i) => ext[0] + i);
         }
         markSpace[0] = 0.02;

    }
    if(vmapIndex[1] > -1) {
        let len = $p.fieldWidths[vmapIndex[1]];
        let ext = $p.fieldDomains[vmapIndex[1]];

        if($p.categoryLookup.hasOwnProperty(vmap.y)){
            viewSetting.scale.y = 'categorical';
            viewSetting.domainY = new Array(len).fill(0).map(
                (d,i)=>$p.categoryLookup[vmap.y][i]
            ).reverse();
            isXYCategorical[1] = 1;
        } else if (isRect) {
            viewSetting.scale.y = 'ordinal';
            viewSetting.domainY = new Array(len).fill(0).map((d,i)=>ext[0] + i);
        }
        markSpace[1] = 0.1;
    }

    if(vmapIndex[0] > -1 && vmapIndex[1] > -1) {
        markSpace = [0, 0];
    }
    let dims = ['x', 'y'];
    for(let dim of dims) {
        if($p.histograms.indexOf(vmap[dim]) !== -1) {
            let histMin = $p.intervals[vmap[dim]].min;
            let histMax = $p.intervals[vmap[dim]].max;
            let histIntv = $p.intervals[vmap[dim]].interval;
            let histBin = (histMax - histMin) / histIntv + 1;
            let d = (dim == 'x') ? 'domainX' : 'domainY';
            viewSetting.histogram[dim] = true;
            viewSetting[d] = new Array(histBin).fill(histMin).map((h, i) => h + i*histIntv);
            // markSpace[dims.indexOf(dim)] = 0.01;
        }
    }
    $p.uniform.uMarkSpace.data = markSpace;
    $p.uniform.uIsXYCategorical.data = isXYCategorical;

    if(!$p._update) {
        if(!vmap.width && vmap.x) {
            $p.uniform.uDefaultWidth.data = 1.0 / ($p.fieldWidths[$p.fields.indexOf(vmap.x)]);
        } else if(vmapIndex[4] === -1 && typeof(vmap.width) == 'number') {
            $p.uniform.uDefaultWidth.data = vmap.width / width;
        }

        if(!vmap.height && vmap.y) {
            $p.uniform.uDefaultHeight.data = 1.0 / ($p.fieldWidths[$p.fields.indexOf(vmap.y)]);
        } else if(vmapIndex[5] === -1 && typeof(vmap.width) == 'number') {
            $p.uniform.uDefaultHeight.data = vmap.height / height;
        }
    }
    return viewSetting;
}

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/vis/extend.js
/* harmony default export */ var extend = (function ($p, vmap, viewIndex) {
  let chart = $p.views[viewIndex];
  let width = chart.width;
  let height = chart.height;
  let padding = chart.padding;

  $p.extensions.forEach((ext) => {
    if (ext.condition.call(null, vmap)) {
      $p.skipRender = ext.skipDefault;
      let data = {
        json: null,
        array: null,
        texture: null,
        vmap: vmap,
        fields: $p.fields
      };

      let view = Object.assign({}, chart);
      view.width = width - padding.left - padding.right,
        view.height = height - padding.top - padding.bottom,
        view.encodings = vmap,
        view.svg = chart.chart.svg.svg,
        view.canvas = $p.canvas

      if (ext.exportData) {
        data.json = $p.exportResult('row');
      }

      if (typeof ext.onready === 'function') {
        ext.onready.call($p, data, view);
      }

      let execution = (ext.type == 'class') ?
        function (data, view) {
          return new ext.function(data, view)
        } :
        ext.function;

      if (ext.restartOnUpdate) {
        execution.call(ext, data, view);
      } else {
        if (!$p._update) {
          execution.call(ext, data, view);
        }
      }
    }
  })
});
// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/vis/shaders/interpolate.gl.js
/* harmony default export */ var interpolate_gl = ({
  visMap({
    fieldId = 'int',
    addrX = 'float',
    addrY = 'float',
    indexedValue0 = 'float',
    indexedValue1 = 'float',
    defaultValue = 'float',
    exp = 'float'
  }) {
      var value;
      var d = new Vec2();
      if (fieldId > -1) {
          if (fieldId >= this.uIndexCount) {
              value = this.getNonIndexedData(fieldId, addrX, addrY);
          } else if (fieldId < this.uIndexCount) {
              value = (fieldId == 0) ? indexedValue0 : indexedValue1;
          }
          if (exp != 0.0) {
              value = pow(value, exp);
              // if(exp == 5.0) {
              //     value = log(tan( (value / 90.0 + 1.0) * 3.14 / 4.0)) * 180.0 / 3.14;
              // }
          }
          d = this.uVisDomains[fieldId];
          value = (value - d.x) / (d.y - d.x);
      } else {
          value = defaultValue;
      }

      return value;
  }
});
// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/vis/svg.js
function setAttr(elem, attr) {
    for( var key in attr ){
        var value = attr[key],
            c = key.match(/[A-Z]/);
        if(c !== null) key = key.replace(c[0], "-"+c[0].toLowerCase())
        elem.setAttribute(key, value);
    }
}

function setStyle(elem, style) {
    for( var key in style ){
        var value = style[key],
            c = key.match(/[A-Z]/);
        if(c !== null) key = key.replace(c[0], "-"+c[0].toLowerCase())
        elem.style[key] = value;
    }
}

function Svg(arg){

    var self = (this instanceof Svg) ? this: {},
        option = arg || {},
        type = option.type || 'svg',
        svgNS = 'http://www.w3.org/2000/svg',
        svg = document.createElementNS(svgNS, type),
        width = option.width || 400,
        height = option.height || 300,
        parent = option.parent || option.container || this.parent,
        attr = option.attr || {},
        style = option.style || {},
        padding = option.padding || {left: 0, right: 0, top: 0, bottom: 0};

    if(type === 'svg') {
        var defaultAttr = {
            width   : width + padding.left + padding.right,
            height  : height + padding.top + padding.bottom,
            viewBox : [0, 0, width + padding.left + padding.right , height + padding.top + padding.bottom].join(' '),
            preserveAspectRatio: 'none'
        };
        setAttr(svg, defaultAttr);
    }

    self.innerWidth = function() {
        return width;
    }

    self.innerHeight = function() {
        return height;
    }

    self.padding = function() {
        return padding;
    }

    if(style) setStyle(svg, style);
    if(attr) setAttr(svg, attr);

    if(parent) {
        parent = (typeof parent == "string") ? document.getElementById(parent) : parent;
        parent.appendChild(svg);
    }

    self.svg = svg;
    self.parent = parent;

    self.node = () => svg;

    if(self instanceof Svg) {
        publicMethods(Svg.prototype);
    } else {
        publicMethods(self);
    }

    return self;
};

function publicMethods(context) {
    context.append = function(type, attr, style) {
        var options = {};
        options.parent = this.svg;
        options.type = type;
        options.attr = attr;
        options.style = style;
        return new Svg(options);
    };

    context.remove = function() {
        if(this.svg && this.svg.parentNode === this.parent){
            this.parent.removeChild(this.svg);
        }
    };

    context.attr = function(a, v) {
        if(typeof(a) == "object")
            setAttr(this.svg, a);
        else
            this.svg.setAttribute(a, v);

        return this;
    }

    context.Attr =  function(a, v) {
        setAttr(this.svg, a);
        return this;
    }

    context.Style =  function(a, v) {
        setStyle(this.svg, a);
        return this;
    }

    context.style = function(a, v) {
        if(typeof(a) == "object")
            setStyle(this.svg, a);
        else
            this.svg.style[a] = v;

        return this;
    }

    context.css = context.style;

    context.text = function(str){
        this.svg.appendChild(document.createTextNode(str));
        return this;
    };

    context.translate = function(x, y) {
        var p = this.svg.getAttribute("transform") || "";
        this.svg.setAttribute("transform", p + "translate(" + [x,y].join(",") + ") ");
        return this;
    };

    context.on = function(event, callback) {
        this.svg.addEventListner(event, callback);
        return this;
    }

    return context;
}

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/vis/scale.js
function scale_scale(arg) {
    var option = arg || {},
        align = option.align || 'center',
        type = option.type || 'linear',
        domain = option.domain || [0,1],
        margin = option.margin || 0,
        exponent = option.exponent || 1,
        range = option.range || [0,1];

    function getInterpolateFunction() {
        //intercepts and slopes for domain and range
        var d0 = -domain[0] / (domain[1] - domain[0]),
            d1 = 1 / (domain[1] - domain[0]),
            r0 = range[0],
            r1 = range[1] - range[0];

        if(type == "linear") {
            return function(v) { return r0 + (d0 + v * d1) * r1 };
        } else if(type == "power") {
            d0 = -Math.pow(-d0, exponent);
            d1 = Math.pow(d1, exponent);
            return function(v) { return r0 + (d0 + Math.pow(v, exponent) * d1) * r1 };
        } else if (type == "log") {
            exponent = option.exponent || 10;
            d0 = -(Math.log(-d0) / Math.log(exponent));
            d1 = (Math.log(d1) / Math.log(exponent));

            return function(v) { return r0 + (d0 + Math.log(v) / Math.log(exponent) * d1) * r1 };

        } else if(type == "ordinal" || type == "categorical") {
            return function(v) {
                if(align == 'outer')
                    return r0 + (domain.indexOf(v)+0.5) / (domain.length-1) * r1;
                else
                    return r0 + (domain.indexOf(v)+0.5) / domain.length * r1;
            };
        } else {
            return function(v) { return v };
        }
    }

    var scale = getInterpolateFunction();

    scale.interval = function(ticks) {
        if (type == "ordinal" || type == "categorical") {
            return (1 / domain.length * Math.abs(range[1] - range[0]));
        } else {
            var s = Math.pow(10, Math.floor(Math.log10(Math.abs(range[1] - range[0])))-1);
            return Math.floor( Math.abs(range[1] - range[0]) / (ticks * s) )  * s;
        }
    };

    scale.domainLength = function() {
        if(type == "linear")
            return Math.abs(domain[1] - domain[0]);
        else if(type == "ordinal" || type == "categorical")
            return domain.length;
    };

    scale.rangeLength = function() {
        return Math.abs(range[1] - range[0]);
    };

    scale.invert = function(r) {
        if(type == "linear") {
            return domain[0] + (r - range[0]) / (range[1] - range[0]) * (domain[1] - domain[0]);
        } else if(type == "ordinal" || type == "categorical") {
            var intv = intv = r / scale.rangeLength();
            return domain[Math.floor(intv * (domain.length))];
        }
    }

    scale.domain = function() {
        return domain;
    }

    return scale;
};

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/vis/axis.js


function axis_axis(arg) {

    var option = arg || {},
        svg = option.container || option.parent,
        dim = option.dim || "x",
        color = option.color || "#000",
        position = option.position || 0,
        align = option.align || "",
        scale = option.scale || "linear",
        exponent = option.exponent || 1,
        metric = option.metric || null,
        domain = option.domain || [0, 1],
        width = option.width || svg.innerWidth(),
        height = option.height || svg.innerHeight(),
        padding = option.padding || svg.padding() || {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0
        },
        range = option.range || (dim == "x") ? [0, width] : [height, 0],
        styles = {
            stroke: color,
            'stroke-width': 1
        },
        ticks = option.ticks,
        tickLength = option.tickLength || 6,
        tickPosition = option.tickPosition || [0, 0],
        tickInterval = option.tickInterval || "auto",
        tickAlign = option.tickAlign || "center",
        skipLast = option.skipLast || false,
        tickFormat = option.tickFormat || null,
        grid = option.grid,
        format = option.format || function (_) {return _;},
        visable = option.visable || true,
        domainIntervals,
        labelPos = null,
        labelAngle = option.labelAngle || 0,
        X = [],
        Y = [];

    if (typeof (ticks) != "number") {
        ticks = (dim == "x") ? Math.ceil(width / 50) : Math.ceil(height / 50);
    }
    var tickLabelAlign = option.tickLabelAlign || "end";
    switch (align) {
        case "left" || "center":
            labelPos = option.labelPos || {
                x: -tickLength / 2,
                y: -5
            };
            tickLabelAlign = option.tickLabelAlign || "end";
            break;
        case "right":
            labelPos = {
                x: tickLength,
                y: -5
            };
            tickLabelAlign = option.tickLabelAlign || "start";
            if (!tickPosition) tickPosition = [tickLength / 2, 0];
            break;
        case "top":
            labelPos = {
                x: 0,
                y: 0
            };
            tickLabelAlign = "middle";
            if (!tickPosition) tickPosition = [0, -tickLength];
            break;
        case "bottom" || "middle":
            labelPos = option.labelPos || {
                x: 0,
                y: -tickLength * 3
            };
            tickLabelAlign = option.tickLabelAlign || "middle";
            break;
        default:
            labelPos = option.labelPos || option.labelPosition || {
                x: 0,
                y: 0
            };
            break;
    }

    function getTickInterval() {
        var vDomain = Math.abs(domain[1] - domain[0]),
            intv = vDomain / ticks,
            pow = Math.ceil(Math.log10(intv)),
            intv = intv / Math.pow(10, pow);

        if (intv > 0.2 && intv <= 0.25) {
            intv = 0.25;
        } else if (intv > 0.7 && intv <= 0.75) {
            intv = 0.75;
        } else {
            intv = Math.ceil(intv * 10) / 10;
        }
        return intv * Math.pow(10, pow);
    }

    if (scale == "categorical" || scale == "ordinal") {
        domainIntervals = function () {
            if(domain.length > 20) {
                var dstep = Math.floor(domain.length / 20);
                return domain.filter( (d,di) => di % dstep === 0)
            }
            return domain;
        };
    } else {
        var intv;

        if (tickInterval == "auto") {
            intv = getTickInterval();

        } else {
            if (typeof (tickInterval) == "number") {
                intv = tickInterval;
            } else {
                // intv = Math.abs(domain[1] - domain[0]) / ticks;
                intv = getTickInterval();
                domain[0] = intv * Math.floor(domain[0] / intv);
                domain[1] = intv * Math.ceil(domain[1] / intv);
            }
        }

        domainIntervals = function () {
            var di = [];

            if (domain[0] > domain[1]) {
                domain[0] += intv;
                for (var i = domain[0]; i > domain[1]; i = i - intv)
                    di.push(i);
            } else {
                for (var i = domain[0]; i < domain[1]; i = i + intv)
                    di.push(i);
            }

            if (di[di.length - 1] != domain[1] && !isNaN(domain[1]) && !skipLast) {

                if ((domain[1] - di[di.length - 1]) < 0.4 * intv)
                    di[di.length - 1] = domain[1];
                else
                    di.push(domain[1]);
            }
            return di;
        }
    }

    if (metric === null) {

        var scaleOptions = {
            align: tickAlign,
            type: scale,
            domain: domain,
            range: range
        };

        if (scale == "power") {
            scaleOptions.exponent = exponent;
        }

        metric = scale_scale(scaleOptions)
    } else {
        domain = metric.domain();
    }

    var axis = svg.append("g");

    if (dim == 'x') {
        if (!position && align) {
            position = [0, height / 2, height];
            position = position[["top", "middle", "bottom"].indexOf(align)];
        }
        Y[0] = Y[1] = position;
        X[0] = 0;
        X[1] = Math.abs(range[1] - range[0]);
    } else {
        if (!position && align) {
            position = [0, width / 2, width];
            position = position[["left", "center", "right"].indexOf(align)];
        }
        X[0] = X[1] = position;
        Y[0] = 0;
        Y[1] = Math.abs(range[1] - range[0]);
    }

    metric.show = metric.axis = function () {
        axis.append("g")
            .append("line")
            .Attr({
                x1: X[0],
                x2: X[1],
                y1: Y[0],
                y2: Y[1]
            })
            .Style(styles);

        var di = domainIntervals();

        for (var i = 0; i < di.length; i++) {
            var x1, x2, y1, y2;
            if (dim == 'x') {
                x1 = x2 = metric(di[i]) + tickPosition[0];
                y1 = position + tickPosition[1] + tickLength;
                y2 = y1 - tickLength;
            } else {
                y1 = y2 = metric(di[i]) + tickPosition[1];
                x1 = position + tickPosition[0];
                x2 = x1 - tickLength;
            }

            var svgTicks = axis.append("g");
            svgTicks.append("line", {
                x1: x1,
                x2: x2,
                y1: y1,
                y2: y2,
            }, styles);


            // if (dim == 'x') tickLabelAlign = "middle";
            // if (dim == 'x' && labelAngle) tickLabelAlign = "end";

            var tickLabel = svgTicks.append("text")
                .Attr({
                    x: x2 + labelPos.x,
                    y: y2 - labelPos.y,
                    class: "p4-axis-label",
                    "font-size": "0.9em",
                    textAnchor: tickLabelAlign
                });
            if (labelAngle) tickLabel.attr("transform", "rotate(" + [labelAngle, (x2 + labelPos.x), (y2 - labelPos.y)].join(",") + ")");

            var labelText = (typeof (tickFormat) == "function") ? format(tickFormat(di[i])) : format(di[i]);
            // tickLabel.appendChild( document.createTextNode(labelText) );
            tickLabel.text(labelText);

            if (grid) {
                var gx1, gx2, gy1, gy2;
                if (dim == 'x') {
                    gx1 = gx2 = metric(di[i]);
                    gy1 = 0;
                    gy2 = height;
                } else {
                    gy1 = gy2 = metric(di[i]);
                    gx1 = 0;
                    gx2 = width;
                }
                axis.append("line", {
                    x1: gx1,
                    x2: gx2,
                    y1: gy1,
                    y2: gy2,
                    class: "grid-lines"
                }, {
                    "stroke": color,
                    // "stroke-width": 0.5,
                    "stroke-opacity": 0.15
                });
            }
        }
        axis.translate(padding.left, padding.top);
        return axis;
    };

    metric.remove = function () {
        axis.remove();
    }

    if (visable) {
        metric.svg = metric.show();
    }

    return metric;
};
// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/vis/format.js


function printformat(spec) {
    return function(value){
        if(typeof value !== "number") return value;
        var ret,
            convert,
            numericSymbols = ['y', 'z', 'a', 'f', 'p', 'n', 'µ', 'm', '', 'k', 'M','G', 'T', 'P', 'E', 'Z', 'Y'],
            n = Object(arrays["a" /* seq */])(-24,24,3),
            i = numericSymbols.length-1,
            parts,
            precision = spec.match(/\d+/)[0] || 3,
            number = Number(value),
            exp,
            suffix;

        if(spec[spec.length-1] == 's')
            precision--;

        parts = number.toExponential(precision).toString().match(/^(-{0,1})(\d+)\.?(\d*)[eE]([+-]?\d+)$/);
        exp = parseInt(parts[4]) || 0;

        while (i--) {
            if (exp >= n[i]) {
                if(i==7 && (exp-n[i]) > 1) {
                    // console.log(exp-n[i]);
                    suffix = numericSymbols[i+1];
                    exp -= n[i+1];
                    break
                } else {
                    suffix = numericSymbols[i];
                    exp -= n[i];
                    break;
                }
            }
        }
        ret = parseFloat(parts[1] + parts[2] + '.' + (parts[3]||0) + 'e' + exp.toString());
        return ret.toString() + suffix;
    }
}

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/vis/legend.js




const defaultColors = ['white', 'steelblue'];
const defaultSize = 20;
var gradID = 0;

function legend_color(arg){
    var gradientID = gradID++;

    var option = arg || {},
        container = option.container || null,
        width = option.width || null,
        height = option.height || null,
        pos = option.pos ||[0, 0],
        dim = option.dim || 'x',
        padding = option.padding || {left: 0, right: 0, top: 0, bottom: 0},
        vmap = option.vmap || {},
        label = option.label || false,
        colors = option.colors || defaultColors,
        domain = option.domain || ['min', 'max'],
        format = option.format || printformat('.3s');


    if(colors.length < 2) colors = defaultColors;
    width -= padding.left + padding.right;
    height -= padding.top + padding.bottom;

    var legend = (container === null)
        ? new Svg({width: width, height: height, padding: padding})
        : container.append('g');

    var gradDirection;
    if(dim == 'x') {
        gradDirection = {x1: 0, x2: 1, y1: 0, y2: 0};
        if(height === null) height = defaultSize;
    } else {
        gradDirection = {x1: 0, x2: 0, y1: 0, y2: 1};
        if(width === null) width = defaultSize;
    }

    function linearGradient(colors) {
        var gradient = legend.append('defs')
            .append('linearGradient')
                .attr('id', 'gradlegend'+gradientID)
                .attr(gradDirection);

        colors.forEach(function(c, i){
            gradient.append('stop')
                .attr('offset', i / (colors.length-1) )
                .attr('stop-color', colors[colors.length-i-1]);
        });
        return gradient;
    }

    var grad = linearGradient(colors);

    var rect = legend.append('g');

    var colorScale = rect.append('rect')
        .attr('width', width-padding.left)
        .attr('height', height)
        .style('fill','url(#gradlegend' + gradientID + ')');

    var domainLabel = legend.append('text');
    if(label) {
        label.append('text')
            .attr('x', pos[0] - 5)
            .attr('y', pos[1] + height/2 + 5)
            .style('fill', '#222')
            .style('text-anchor', 'end')
            .text(printformat('2s')(domain[0]));

        legend.append('text')
            .attr('x', pos[0] + width - padding.left + 5)
            .attr('y', pos[1] + height/2 + 5)
            .style('fill', '#222')
            .style('text-anchor', 'begin')
            // .style('font-size', '.9em')
            .text(printformat('2s')(domain[1]));
    }

    if(option.title) {
        legend.append('g')
          .append('text')
            .attr('y', pos[1] - padding.top)
            .attr('x', pos[0] + width/2)
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .text(option.title);
    }

    if(dim == 'x') {
        new axis_axis({
            dim: 'x',
            domain: domain,
            container: legend,
            align: 'bottom',
            ticks: Math.floor(width / 30),
            height: height,
            width: width,
            labelPos: {x: 0, y: -20},
            format: format,
        });
    } else {
        new axis_axis({
            dim: 'y',
            domain: domain,
            container: legend,
            align: 'right',
            ticks: Math.floor(height / 30),
            height: height,
            width: width,
            labelPos: {x: 0, y: -20},
            format: format,
        });
    }


    // legend.appendChild(xAxis);

    legend.translate(pos[0]+padding.left, pos[1]+padding.top);

    // legend.update = function(newDomain, newColors) {
    //
    //     legend.removeChild(xAxis);
    //     xAxis = new Axis({
    //         dim: 'x',
    //         domain: newDomain,
    //         container: legend,
    //         align: 'bottom',
    //         ticks: 4,
    //         // tickInterval: 10000000,
    //         labelPos: {x: -5, y: -20},
    //          padding: padding,
    //         width: width-padding.left,
    //         format: format,
    //     }).show();
    //
    //     if(typeof(newColors) != 'undefined') {
    //         grad.remove();
    //         grad = linearGradient(newColors);
    //         colorScale.css('fill','url(#gradlegend' + gradientID + ')');
    //
    //     }
    //     // legend.appendChild(xAxis);
    //
    //     return legend;
    // }

    return legend;
}

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/vis/chart.js




function chart(frontSvg, backSvg, arg) {
    var options = arg || {},
        plot = frontSvg.append('g'),
        metavis = backSvg.append('g'),
        width = options.width,
        height = options.height,
        top = options.top || 0,
        left = options.left || 0,
        vmap = options.vmap || {},
        histogram =  options.histogram,
        features = options.fields || [],
        domain = options.domain,
        categories = options.categories,
        labels = plot.append('g'),
        onclick = options.onclick || null,
        onhover = options.onhover || null,
        showLegend = options.legend,
        tickOffset = options.axisOffset || [0, 0],
        padding = options.padding || {left: 0, right: 0, top: 0, bottom: 0},
        marks = [],
        frameBorder = options.frameBorder || false,
        gridlines = options.gridlines || {x: false, y: false},
        colors = options.colors;

    var scale = options.scale || {x: 'linear', y: 'linear'},
        domainX = options.domainX || domain[vmap.x] || domain[vmap.width],
        domainY = options.domainY || domain[vmap.y] || domain[vmap.height];

    width -= padding.left + padding.right;
    height -= padding.top + padding.bottom;

    var axisOption = {
        x: {
            container: metavis,
            dim: "x",
            width: width,
            height: height,
            domain: domainX,
            scale:  scale.x,
            align: "bottom",
            // ticks: 15,
            grid: gridlines.x,
            format: printformat(".3s"),
        },
        y: {
            container: metavis,
            dim: "y",
            domain: domainY,
            scale: scale.y,
            width: width,
            height: height,
            align: "left",
            // labelPos: {x: -5, y: -5},
            // ticks: 8,
            grid: gridlines.y,
            format: printformat(".3s"),
        }
    };

    let colorLegend;
    if(showLegend && features.indexOf(vmap.color) !== -1){
        colorLegend = legend_color({
            container: metavis,
            width: 20,
            height: 180,
            dim: "y",
            domain: domain[vmap.color],
            pos: [width + padding.right/2, 0],
            colors: colors
        });
    }

    let x, y, xAxes = [], yAxes = [];

    // For parallel coordinates
    if(Array.isArray(vmap.x)) {
        let axisDist = height / (vmap.x.length-1);

        vmap.x.forEach(function(d, i) {
            axisOption.x.position = i * axisDist + 1;
            axisOption.x.domain = domain[d];
            if(categories.hasOwnProperty(d)){
                axisOption.x.scale = 'ordinal';
                axisOption.x.tickAlign = 'outer';
                axisOption.x.domain = categories[d].reverse();
            }
            let labelOffset = 20;
            if(i === 0) {
                axisOption.x.tickPosition = [0, -5];
                axisOption.x.labelPos = {x: 0, y: 2};
                labelOffset = 35;
            } else {
                axisOption.x.tickPosition = null;
                axisOption.x.labelPos = null;
            }
            x = axis_axis(axisOption.x);
            xAxes[i] = x;

            labels
            .append("text")
              .attr("x", 5 )
              .attr("y", i * axisDist - labelOffset)
              .attr("dy", "1em")
              .css("text-anchor", "middle")
              .css("font-size", "1em")
              .text(d);
        });
    }

    if(Array.isArray(vmap.y)) {
        var axisDist = width / (vmap.y.length-1);

        vmap.y.forEach(function(d, i) {
            axisOption.y.position = i * axisDist;
            axisOption.y.domain = domain[d];
            if(categories.hasOwnProperty(d)){
                axisOption.y.scale = 'ordinal';
                axisOption.y.tickAlign = 'outer';
                axisOption.y.domain = categories[d].reverse();
            }
            if(i == vmap.y.length-1) {
                axisOption.y.tickPosition = [5, 0];
                axisOption.y.tickLabelAlign = "start";
                axisOption.y.labelPos = {x: 8, y: -5};

            }
            y = axis_axis(axisOption.y);
            yAxes[i] = y;

            labels.append("text")
              .attr("y", -padding.top + 10)
              .attr("x", i * axisDist)
              .attr("dy", "1em")
              .css("text-anchor", "middle")
              .css("font-size", "1em")
              .text(d);
        });
    }

    let histDomain = {
        x: domainX, 
        y: domainY
    };
    for(let dim of ['x', 'y']) {
        if(scale[dim] == 'ordinal' || scale[dim] == 'categorical') {
            if(width / histDomain[dim].length < 10) {
                axisOption[dim].ticks = histDomain[dim].length;
            }
            // while(width / axisOption[dim].ticks < 20) {
            //     axisOption[dim].ticks *= 0.5;
            // }
        }

        if(histogram[dim]) {
            axisOption[dim].tickPosition = (dim == 'x') 
                ? [-width / (histDomain[dim].length-1) /2, 0]
                : [0, height/ (histDomain[dim].length-1) /2]

            axisOption[dim].scale = "ordinal";
            axisOption[dim].tickAlign = "outer";
            axisOption[dim].domain = histDomain[dim];
            axisOption[dim].ticks = histDomain[dim].length;
        }
    }

    if((vmap.x || vmap.width) && !Array.isArray(vmap.x)) x = axis_axis(axisOption.x);
    if((vmap.y || vmap.height) && !Array.isArray(vmap.y)) y = axis_axis(axisOption.y);

    if((vmap.hasOwnProperty('x') || vmap.hasOwnProperty('width')) && !Array.isArray(vmap.x)) {
        let xAxisTitle = vmap.x || vmap.width;
        // xAxisTitle = xAxisTitle.replace(/_/g, ' ');
        // axisOption.x.grid = 1;
        labels.append("g")
          .append("text")
            .attr("x", width/2)
            .attr("y", height + padding.bottom/2 )
            .attr("dy", "1em")
            .css("text-anchor", "middle")
            .css("font-size", "1.0em")
            .css("font-weight", "bold")
            .css(" text-transform", "capitalize")
            .text(xAxisTitle);

    }
    if((vmap.hasOwnProperty('y') || vmap.hasOwnProperty('height')) && !Array.isArray(vmap.y)) {
        let yAxisTitle = vmap.y || vmap.height;
        // yAxisTitle = yAxisTitle.replace(/_/g, ' ');
        // axisOption.y.grid = 1;
        if(!Array.isArray(vmap.y)) {
            labels.append("g")
              .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", -padding.left/1.25 )
                .attr("x", -height/2 )
                .attr("dy", "1em")
                .css("text-anchor", "middle")
                .css("font-size", "1.0em")
                .css("font-weight", "bold")
                .css(" text-transform", "capitalize")
                .text(yAxisTitle);
        }
    }
    
    if(frameBorder) {
        plot.append("line")
            .attr('x1', 0)
            .attr('x2', width)
            .attr('y1', 0)
            .attr('y2', 0)
            .css('stroke', '#000')
        plot.append("line")
            .attr('x1', width)
            .attr('x2', width)
            .attr('y1', 0)
            .attr('y2', height)
            .css('stroke', '#000')
            .css('stroke-opacity', 0.5)
    }

    plot.translate(padding.left+left, padding.top+top);
    metavis.translate(padding.left+left, padding.top+top);

    let chartLayer = {};
    chartLayer.updateAxisX =  function(newDomain) {
        x.remove();
        axisOption.x.domain = newDomain;
        x = axis_axis(axisOption.x)
        return chartLayer;
    }
    chartLayer.updateAxisY =  function(newDomain) {
        y.remove();
        axisOption.y.domain = newDomain;
        y = axis_axis(axisOption.y)
        return chartLayer;
    }
    chartLayer.removeAxis = function() {

        if(yAxes.length) {
            yAxes.forEach(function(yp) {
                yp.remove();
            })
        } else if(xAxes.length) {
            xAxes.forEach(function(xp) {
                xp.remove();
            })
        } else {
            x.remove();
            y.remove();
        }
    }
    chartLayer.removeLegend = function() {
        if(showLegend) {
            colorLegend.remove();
        }
    }
    chartLayer.svg = plot;
    chartLayer.x = Array.isArray(vmap.x) ? xAxes : x;
    chartLayer.y = Array.isArray(vmap.y) ? yAxes : y;

    return chartLayer;
};

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/vis/layout.js



function layout_assign(object, source) {
    Object.keys(source).forEach(function(key) {
        object[key] = source[key];
    });
}
var defaultProperties = {
    width: 400,
    height: 300,
    padding: {left: 0, right: 0, top: 0, bottom: 0},
}

function layout(arg){
    "use strict";

    /* Private */
    var viz = this,
        option = arg || {},
        container = option.container || document.body,
        style = option.style || null,
        layers = [];

    this.width = container.clientWidth || 400;
    this.height = container.clientHeight || 300;

    if(typeof container == 'string') container = document.getElementById(container);
    layout_assign(viz, defaultProperties);
    layout_assign(viz, option);

    this.vmap = option.vmap;

    this.width -= (this.padding.left + this.padding.right);
    this.height -= (this.padding.top + this.padding.bottom);


    /* Public */
    this.data = option.data || [];
    this.div = document.createElement("div");
    if(style !== null) {
        Object.keys(style).forEach(function(prop){
            viz.div.style[prop] = style[prop];
        })
    }

    this.init = function(){
        // container = (containerId == "body") ? document.body : document.getElementById(containerId);

        this.div.className = option.className || "p6-viz";
        this.div.style.position = 'relative';
        this.resize(
            this.width + this.padding.left + this.padding.right,
            this.height + this.padding.top + this.padding.bottom
        );

        if(option.style) this.css(option.style);

        container.appendChild(this.div);
        this.viz();
        return viz;
    };

    this.createSVG = function(arg) {
        var arg = arg || {},
            width = arg.width || this.width,
            height = arg.height || this.height,
            padding = arg.padding || this.padding;

        return new Svg({
            width: width,
            height: height,
            padding: padding,
            style: {position: 'absolute'}
        });
    }

    var canvas = option.canvas,
        svg = this.createSVG(),
        vmap = option.vmap,
        chartPadding = this.padding || {left: 0, right: 0, top: 0, bottom: 0},
        domain = option.domain || {x: [0, 1000], y: [0, 1]},
        scales = option.scales || {x: 'linear', y: 'linear'};

    var backSVG = this.createSVG(),
        frontSVG = this.createSVG();

    this.set = function(props) {
        layout_assign(viz, props);
    };

    this.addProperty = function(obj, prop) {
        layout_assign(obj, prop);
        return obj;
    }

    this.viz = function() {
        viz.div.appendChild(backSVG.svg);
        viz.div.appendChild(canvas);
        viz.div.appendChild(frontSVG.svg);
        return viz;
    };

    this.render = this.viz;

    this.css = function(style){
        for(var key in style){
            this.div.style[key] = style[key];
        }
        return this;
    };

    this.resize = function(w,h){
        this.div.style.width = w + "px";
        this.div.style.height = h + "px";
    };

    this.destroy = function() {
        this._super.destroy();
        container.removeChild(this.div);
        div = null;
    };

    this.hide = function() {
        this.div.style.display = 'none';
    }

    this.show = function() {
        this.div.style.display = 'block';
    }

    this.innerWidth = function() {
        return this.width;
    }

    this.innerHeight = function() {
        return this.height;
    }

    this.addChart = function(options) {
        return chart(frontSVG, backSVG, options)
    };

    this.exportImage = function(beforeExport) {
        var imageCanvas = document.createElement("canvas");
        imageCanvas.width = this.width;
        imageCanvas.height = this.height;
        return new Promise(function(resolve, reject) {

            var ctx = imageCanvas.getContext("2d");
            var svgString = new XMLSerializer().serializeToString(frontSVG.svg);

            var DOMURL = self.URL || self.webkitURL || self;
            var svgBlob = new Blob([svgString], {type: "image/svg+xml;charset=utf-8"});
            var svgURL = DOMURL.createObjectURL(svgBlob);

            var canvasLayer = new Image();
            var svgLayer = new Image();
            canvasLayer.onload = function() {
                ctx.drawImage(canvasLayer, 0, 0);
                svgLayer.src = svgURL;
                svgLayer.onload = function() {
                    ctx.drawImage(svgLayer, 0, 0);
                    var png = imageCanvas.toDataURL("image/png");
                    DOMURL.revokeObjectURL(png);
                    resolve(png);
                };
            };

            canvasLayer.onerror = function() {
                reject(Error("Canvas Output Error!"));
            }

            svgLayer.onerror = function() {
                reject(Error("SVG Output Error!"));
            }
            beforeExport();
            canvasLayer.src = canvas.toDataURL("image/png");
        });

    }

    return viz.init();
};

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/vis/shaders/Renderer.gl.js
class Renderer {
  constructor({context, name}) {
    this.gl = context;
    this.name = name;
    this.gl.program(
      name,
      this.gl.shader.vertex(this.vertexShader),
      this.gl.shader.fragment(this.fragmentShader)
    )
  }

  vertexShader () {
    gl_Position = vec4(this._square, 0, 1);
  }

  fragmentShader () {
    if(this.vResult <= this.uVisLevel + 0.01 && this.vResult >= this.uVisLevel - 0.01) {
      gl_FragColor = this.vColorRGBA;
    } else {
      discard;
    }
  }

  load () {
    return this.gl.program(this.name);
  }

  render () {
    let gl = this.gl.ctx;
    gl.disable( gl.BLEND );
    gl.drawArrays(primitive || gl.TRIANGLES, 0, 6);
  }
}
// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/vis/shaders/Instanced.gl.js


class Instanced extends Renderer{
    constructor(arg) {
        super(arg)        
    }

    vertexShader () {
        var i, j, posX, posY, color, alpha, size;
        var rgb = new Vec3();

        i = (this.aDataIdx + 0.5) / this.uDataDim.x;
        j = (this.aDataIdy + 0.5) / this.uDataDim.y;

        if (this.uFilterFlag == 1) {
            this.vResult = texture2D(this.fFilterResults, vec2(i, j)).a;
        } else {
            this.vResult = this.uVisLevel;
        }

        posX = this.visMap(this.uVisualEncodings[0], i, j, this.aDataValx, this.aDataValy, 0.0, 0.0);
        posY = this.visMap(this.uVisualEncodings[1], i, j, this.aDataValx, this.aDataValy, 0.0, 0.0);
        color = this.visMap(this.uVisualEncodings[2], i, j, this.aDataValx, this.aDataValy, -1.0, 0.0);
        alpha = this.visMap(this.uVisualEncodings[3], i, j, this.aDataValx, this.aDataValy, this.uDefaultAlpha, 0.0);
        size = this.visMap(this.uVisualEncodings[6], i, j, this.aDataValx, this.aDataValy, 1.0, 0.0);

        if(this.uIsXYCategorical[0] == 1) {
            var width = this.uFieldWidths[this.uVisualEncodings[0]];
            posX = 0.5 / width + posX * (width-1.0) / width;
        }
        if(this.uIsXYCategorical[1] == 1) {
            var height = this.uFieldWidths[this.uVisualEncodings[1]];
            posY = 0.5 / height + posY * (height-1.0) / height;
        }

        posX = posX * 2.0 - 1.0;
        posY = posY * 2.0 - 1.0;

        rgb = this.mapColorRGB(this.uVisualEncodings[2], color);
        gl_PointSize = size * this.uMarkSize;
        this.vColorRGBA = vec4(rgb, alpha);
        gl_Position = vec4(posX, posY, 0.0, 1.0);
    }

    fragmentShader() {
        var valid = new Bool();
        valid = this.vResult <= this.uVisLevel + 0.01 && this.vResult >= this.uVisLevel - 0.01;
        if (this.uVisMark == 1) {
            var dist = length(gl_PointCoord.xy - vec2(0.5, 0.5));
            if (dist > 0.5) discard;
            var delta = 0.15;
            var alpha = this.vColorRGBA.a - smoothstep(0.5 - delta, 0.5, dist);
            if (valid) {
                gl_FragColor = vec4(this.vColorRGBA.rgb * alpha, alpha);
            } else {
                discard;
            }
        } else {
            if (valid) {
                gl_FragColor = vec4(this.vColorRGBA.rgb * this.vColorRGBA.a, this.vColorRGBA.a);
            } else {
                discard;
            }
        }
    }

    render(primitive) {
        let $p = this.gl;
        $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdx.location, 0);
        $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataValx.location, 0);
        $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdy.location, 1);
        $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataValy.location, 1);
        $p.ctx.ext.drawArraysInstancedANGLE(primitive, 0, $p.dataDimension[0], $p.dataDimension[1]);

    }
}
// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/vis/shaders/Polygon.gl.js


class Polygon extends Renderer{
  constructor (arg) {
    super(arg);
  }

  vertexShader () {
    var i, j;
    var rgb = new Vec3();
    var posX, posY, color, alpha, width, height, size;
    i = (mod(this.aDataItemId, this.uDataDim.x) + 0.5) / this.uDataDim.x;
    j = (floor(this.aDataItemId / this.uDataDim.x) + 0.5) / this.uDataDim.y;

    this.vResult = this.uVisLevel;

    if (this.uFilterFlag == 1) {
      this.vResult = texture2D(this.fFilterResults, vec2(i, j)).a;
    }
    var val0, val1;
    val0 = this.aDataItemVal0;
    val1 = this.aDataItemVal1;
    posX = this.visMap(this.uVisualEncodings[0], i, j, val0, val1, 0.0, 0.0);
    posY = this.visMap(this.uVisualEncodings[1], i, j, val0, val1, 0.0, 0.0);
    color = this.visMap(this.uVisualEncodings[2], i, j, val0, val1, -1.0, 0.0);
    alpha = this.visMap(this.uVisualEncodings[3], i, j, val0, val1, this.uDefaultAlpha, 0.0);
    width = this.visMap(this.uVisualEncodings[4], i, j, val0, val1, this.uDefaultWidth, 0.0);
    height = this.visMap(this.uVisualEncodings[5], i, j, val0, val1, this.uDefaultHeight, 0.0);
    size = this.visMap(this.uVisualEncodings[6], i, j, val0, val1, this.uMarkSize, 0.0);
    posX = posX * (this.uFieldWidths[this.uVisualEncodings[0]] - 1.0) / this.uFieldWidths[this.uVisualEncodings[0]];
    posY = posY * (this.uFieldWidths[this.uVisualEncodings[1]] - 1.0) / this.uFieldWidths[this.uVisualEncodings[1]];

    width *= 1.0 - this.uMarkSpace.x * 2.0;
    height *= 1.0 - this.uMarkSpace.y * 2.0;
    posX += this.uMarkSpace.x * width;
    posY += this.uMarkSpace.y * height;

    if (this.aVertexId == 0.0 || this.aVertexId == 3.0) {
      posX = posX * 2.0 - 1.0;
      posY = posY * 2.0 - 1.0;
    } else if (this.aVertexId == 1.0) {
      posX = posX * 2.0 - 1.0;
      posY = (posY + height) * 2.0 - 1.0;
    } else if (this.aVertexId == 2.0 || this.aVertexId == 5.0) {
      posX = (posX + width) * 2.0 - 1.0;
      posY = (posY + height) * 2.0 - 1.0;
    } else if (this.aVertexId == 4.0) {
      posX = (posX + width) * 2.0 - 1.0;
      posY = posY * 2.0 - 1.0;
    } else {
      posX = posX * 2.0 - 1.0;
      posY = posY * 2.0 - 1.0;
    }

    rgb = this.mapColorRGB(this.uVisualEncodings[2], color);
    this.vColorRGBA = vec4(rgb * alpha, alpha);
    gl_Position = vec4(posX, posY, 0.0, 1.0);
  }

  fragmentShader() {
    if (this.vResult <= this.uVisLevel + 0.01 && this.vResult >= this.uVisLevel - 0.01)
      gl_FragColor = this.vColorRGBA;
    else
      discard;
  }

  render() {
    let $p = this.gl;
    let primitive = $p.ctx.TRIANGLES;
    let val0 = new Float32Array($p.dataSize);
    let val1 = new Float32Array($p.dataSize);
    for(var y = 0; y < $p.dataDimension[1]; y++) {
      for(var x = 0; x < $p.dataDimension[0]; x++) {
        val0[y*$p.dataDimension[0] + x] = $p.attribute.aDataValx.data[x];
        val1[y*$p.dataDimension[0] + x] = $p.attribute.aDataValy.data[y];
      }
    }
    $p.attribute.aDataItemVal0 = val0;
    $p.attribute.aDataItemVal1 = val1;
    $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aVertexId.location, 0);
    $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataItemId.location, 1);
    $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataItemVal0.location, 1);
    $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataItemVal1.location, 1);
    $p.ctx.ext.drawArraysInstancedANGLE(primitive, 0, 6, $p.dataSize);
  }
}
// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/vis/shaders/Interleaved.gl.js


class Interleaved_gl_Instanced extends Renderer{
    constructor(arg) {
        super(arg)        
    }

    vertexShader () {
      var i, j;
      var rgb = new Vec3();
      var posX, posY, size, color, alpha;
      gl_PointSize = this.uMarkSize;
      i = (mod(this.aDataItemId, this.uDataDim.x) + 0.5) / this.uDataDim.x;
      j = (floor(this.aDataItemId / this.uDataDim.x) + 0.5) / this.uDataDim.y;
  
      this.vResult = this.uVisLevel;
      if(this.uFilterFlag == 1) {
          this.vResult = texture2D(this.fFilterResults, vec2(i, j)).a;
      }
      if(this.uInterleaveX == 1) {
          posX = this.aDataFieldId.y / float(this.uFeatureCount-1);
          posY = this.visMap(int(this.aDataFieldId.x), i, j, i, j, 1.0,  0.0);
      } else {
          posY = 1.0 - this.aDataFieldId.y / float(this.uFeatureCount-1);
          posX = this.visMap(int(this.aDataFieldId.x), i, j, i, j, 1.0,  0.0);
      }
      color = this.visMap(this.uVisualEncodings[2], i, j, i, j, -1.0,  0.0);
      alpha = this.visMap(this.uVisualEncodings[3], i, j, i, j, this.uDefaultAlpha, 0.0);
  
      posX = posX * 2.0 - 1.0;
      posY = posY * 2.0 - 1.0;
  
      rgb = this.mapColorRGB(this.uVisualEncodings[2], color);
      this.vColorRGBA = vec4(rgb*alpha, alpha);
      gl_Position = vec4(posX, posY, 0.0, 1.0);
    }

    updateInstancedAttribute(vm) {
      let $p = this.gl;
      if(Array.isArray(vm)){
          let fv = new Float32Array(vm.length*2);
          vm.forEach(function(f, i) {
              fv[i*2] = $p.fields.indexOf(f);
              fv[i*2+1] = i;
          });
          $p.attribute.aDataFieldId = fv;
          $p.uniform.uFeatureCount = vm.length;
      }
    }

    render(primitive) {
      let $p = this.gl;
      $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataFieldId.location, 0);
      $p.ctx.ext.vertexAttribDivisorANGLE($p.attribute.aDataItemId.location, 1);
      let count = $p.attribute.aDataFieldId.data.length / $p.attribute.aDataFieldId.size;
      $p.ctx.ext.drawArraysInstancedANGLE(primitive, 0, count, $p.dataSize);
    }
}
// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/vis/visualize.js











const visualize_visualEncodings = ['x', 'y', 'color', 'opacity', 'width', 'height', 'size'];
const userActions = ['click', 'hover', 'brush', 'zoom', 'pan'];
const visMarks = ['dot', 'circle', 'line', 'rect'];

function visualize($p) {

    let colorManager = color_color($p);
    let chartPadding = $p.padding || {left: 0, right: 0, top: 0, bottom: 0};
    let viewport = $p.viewport;

    let vis = new layout({
        container: $p.container,
        width: viewport[0] + chartPadding.left + chartPadding.right,
        height: viewport[1] + chartPadding.top + chartPadding.bottom,
        canvas: $p.canvas,
        padding: chartPadding
    });
    
    $p.uniform('uVisualEncodings',  'int',   new Array(visualize_visualEncodings.length).fill(-1))
        .uniform('uViewDim',        'vec2',  $p.viewport)
        .uniform('uVisMark',        'int',   1)
        .uniform('uInterleaveX',    'int',   0)
        .uniform('uVisDomains',     'vec2',  $p.fieldDomains.map(d=>d.slice()))
        .uniform('uVisScale',       'vec2',  [1.0, 1.0])
        .uniform('uPosOffset',      'vec2',  [0.0, 0.0])
        .uniform('uFeatureCount',   'int',   0)
        .uniform('uMarkSize',       'float', 16.0)
        .uniform('uMarkSpace',      'vec2',  [0.02, 0.02])
        .uniform('uDefaultAlpha',   'float', 1.0)
        .uniform('uDefaultWidth',   'float', 1.0 / $p.viewport[0])
        .uniform('uDefaultHeight',  'float', 1.0 / $p.viewport[1])
        .uniform('uMaxRGBA',        'vec4',  [0, 0, 0, 0])
        .uniform('uDefaultColor',   'vec3',  [0.8, 0, 0])
        .uniform('uColorMode',      'int',   1)
        .uniform('uIsXYCategorical','ivec2', [0, 0])
        .varying('vColorRGBA',      'vec4'   );

    let enhance = reveal($p);

    $p.framebuffer('offScreenFBO', 'float', $p.viewport);
    // $p.framebuffer('visStats', 'float', [1, 1]);
    // $p.framebuffer("visStats", "float", [$p.views.length, 1]);
    // $p.framebuffer.enableRead('offScreenFBO');
    $p.bindFramebuffer('offScreenFBO');
    $p.ctx.clearColor( 1.0, 1.0, 1.0, 0.0 );
    $p.ctx.clear( $p.ctx.COLOR_BUFFER_BIT | $p.ctx.DEPTH_BUFFER_BIT );
    $p.bindFramebuffer(null);
    $p.subroutine('visMap', 'float', interpolate_gl.visMap);
    
    let renderers = {
        instanced: new Instanced({context: $p, name: 'instanced'}),
        polygon: new Polygon({context: $p, name: 'polygon'}),
        interleave: new Interleaved_gl_Instanced({context: $p, name: 'interleave'})
    }

    return function(options) {
        $p.revealDensity = false;
        let renderer = 'instanced';
        let vmap = options.vmap || {};
        let mark = options.mark || vmap.mark || 'circle';
        let viewIndex = options.viewIndex;

        let visDomain = {};
        let visDimension = vmap.viewport || [$p.views[viewIndex].width, $p.views[viewIndex].height] || viewport;
        let width = visDimension[0];
        let height =  visDimension[1];
        let padding = vmap.padding || $p.views[viewIndex].padding || chartPadding;
        let offset = vmap.offset || $p.views[viewIndex].offset || [0, 0];
        let dimSetting = encode($p, vmap, colorManager);

        let pv = $p.views[viewIndex];
        let colorInfo = pv.color || vmap.color;
    
        let colorMode = 1;
        let colorMap;

        let viewSetting = {
            domain: visDomain,
            fields: $p.fields,
            vmap: vmap,
            // onclick: interaction,
            categories: $p.categoryLookup,
            padding: padding,
            left: offset[0],
            top:  offset[1],
            colors: colorManager.getColors(),
        };

        viewSetting = Object.assign(viewSetting, dimSetting);
        viewSetting = Object.assign(viewSetting, $p.views[viewIndex]);

        if(!$p._update){
            $p.fields.forEach(function(f, i){
                visDomain[f] = $p.fieldDomains[i].slice();
                if(vmap.zero  && visDomain[f][0]>0) visDomain[f][0] = 0;
            });

            pv.domains = Object.keys(visDomain).map(f=>visDomain[f]);
            $p.uniform.uVisDomains.data = pv.domains;
            if(vmap.append !== true && pv.hasOwnProperty('chart')) {
                pv.chart.svg.remove();
                pv.chart.removeAxis();
            }
            pv.chart = vis.addChart(viewSetting);

            if(typeof(colorInfo) === 'object') {
                if(Array.isArray(colorInfo)) {
                    colorMap = colorInfo;
                } else {
                    if(colorInfo.hasOwnProperty('interpolate')) {
                        colorMode = (colorInfo.interpolate) ? 1 : 0;
                    }
                    colorMap = colorInfo.range || colorInfo.values; 
                }
                
            }
            colorManager.updateColors(colorMap, colorMode);

        } else {
            $p.uniform.uVisDomains = pv.domains;
            if(pv.updateDomain === true) {
                pv.chart.updateAxisX(pv.domains[$p.fields.indexOf(vmap.x)]);
                pv.chart.updateAxisY(pv.domains[$p.fields.indexOf(vmap.y)]);
            }
        }

        $p.uniform.uVisMark.data = visMarks.indexOf(mark);

        //Check if need interleaving data attributes(e.g.,parallel coordinates)
        if(Array.isArray(vmap.x) || Array.isArray(vmap.y)) {
            renderer = 'interleave';
            if(Array.isArray(vmap.x)){
                // vmap.x = vmap.x.reverse();
                $p.uniform.uInterleaveX = 0;
            } else if(Array.isArray(vmap.y)) {
                $p.uniform.uInterleaveX = 1;
            }
            renderers[renderer].updateInstancedAttribute(vmap.x);
            renderers[renderer].updateInstancedAttribute(vmap.y);
        } else if(vmap.mark && ['rect', 'bar'].indexOf(vmap.mark) !== -1) {
            renderer = 'polygon';
        }

        let gl = renderers[renderer].load();
        $p.framebuffer.enableRead('fFilterResults');
        $p.framebuffer.enableRead('fDerivedValues');
        $p.framebuffer.enableRead('fGroupResults');

        if($p.revealDensity) {
            $p.bindFramebuffer('offScreenFBO');
            gl.clearColor( 1.0, 1.0, 1.0, 0.0 );
            gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
            gl.blendFunc(gl.ONE, gl.ONE );
        } else {
            $p.bindFramebuffer(null);
            // gl.clearColor( 1.0, 1.0, 1.0, 0.0 );
            gl.blendFunc( gl.ONE, gl.ONE_MINUS_SRC_ALPHA );
            // gl.blendFunc(gl.SRC_COLOR, gl.ONE_MINUS_SRC_ALPHA);
        }
        gl.viewport(
            offset[0] + padding.left,
            viewport[1] - height + padding.bottom - offset[1],
            width - padding.left - padding.right,
            height - padding.top - padding.bottom
        );
        gl.disable(gl.CULL_FACE);
        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendEquation(gl.FUNC_ADD);

        let primitive = gl.POINTS;

        if(mark == 'line') {
            primitive = gl.LINE_STRIP;
            gl.lineWidth(vmap.size || 1.0);
        }

        extend($p, vmap, viewIndex);

        if(!$p.skipRender) {
            renderers[renderer].render(primitive);
        } else {
            pv.chart.removeAxis();
            if($p.fields.indexOf(vmap.color)!==-1) pv.chart.removeLegend();
        }
        $p.skipRender = false;
        if($p.revealDensity) enhance({
            viewIndex: viewIndex,
            dim: [width, height],
            offset: offset,
            padding: padding
        });
        $p.bindFramebuffer(null);

        if(!$p._update) {
            let actions = Object.keys(vmap)
                .filter(function(act){ return userActions.indexOf(act) !== -1});

            actions.forEach(function(action) {
                let response = {};
                let viewId = vmap.id || $p.views[viewIndex].id;
                response[viewId] = vmap[action];
                $p.interactions.push({
                    event: action,
                    condition: vmap[action].condition,
                    from: viewId,
                    response: response,
                    callback: vmap[action].callback
                })
            })
        }
    }
}

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/kernels.js







/* harmony default export */ var src_kernels = ({
    aggregate: aggregate_aggregate,
    cache: cache_cache,
    derive: derive,
    extent: extent,
    match: match,
    visualize: visualize
});
// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/compile.js








function compile($p, fields, spec) {

    // if(spec.hasOwnProperty('perceptual'))
    //     operations.perceptual = kernels.perceptual($p);
    //
    // if(spec.hasOwnProperty('derive'))
    //     operations.derive = kernels.derive($p, spec.derive);

    return {
        aggregate : aggregate_aggregate($p),
        cache     : cache_cache($p),
        match     : match($p, fields),
        extent    : extent($p),
        visualize : visualize($p)
        // perceive  : kernels.reveal(fxgl)
    }
}

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/operate.js



/* harmony default export */ var operate = (function($p) {
    let operations = {};
    let kernels = compile($p);
    let bin = function (spec, binIndex) {
        let binAttr;
        let binCount;
    
        if (typeof spec == 'object') {
            binAttr = Object.keys(spec)[0];
            binCount = spec[binAttr];
        } else {
            binAttr = spec;
            // Apply Sturges' formula for determining the number of bins
            binCount = Math.ceil(Math.log2($p.dataSize)) + 1;
        }

        let binAttrId = $p.fields.indexOf(binAttr);
        let binDomain = $p.fieldDomains[$p.fields.indexOf(binAttr)];
        let binInterval = (binDomain[1] - binDomain[0]) / binCount;
        // debugger
        $p.uniform.uBinCount.data[binIndex] = binCount;
        $p.uniform.uBinIntervals.data[binIndex] = binInterval;
        $p.fieldWidths[binAttrId] = binCount;    
        $p.intervals[binAttr] = {};
        $p.intervals[binAttr].dtype = 'histogram';
        $p.intervals[binAttr].interval = binInterval;
        $p.intervals[binAttr].min = binDomain[0];
        $p.intervals[binAttr].max = binDomain[1];
        $p.histograms.push(binAttr);
        return binAttr;
    }
    
    operations.aggregate = function (spec) {
        if(spec.$bin) {
            let binSpecs = Array.isArray(spec.$bin) ? spec.$bin : [spec.$bin];
            spec.$group = binSpecs.map((spec, ii) => {
                return bin(spec, ii);
            })
        }
        if(Object.keys($p.crossfilters).length) {
            $p.uniform.uFilterFlag = 1;
        }
        if (!kernels.hasOwnProperty('aggregate')) {
            kernels.aggregate = src_kernels.aggregate($p, spec);
        }
        kernels.aggregate.execute(spec);
        return kernels.aggregate.result;
    }

    operations.match = function(spec) {
        if (!kernels.hasOwnProperty('match')) {
            kernels.match = src_kernels.match($p);
        }
        kernels.match.execute(spec);
        return kernels.match.result;
    }

    operations.cache = function(tag) {
        if (!kernels.hasOwnProperty('cache')) {
            kernels.cache = src_kernels.cache($p);
        }
        kernels.cache.execute(tag);
        return kernels.cache.result;
    }

    operations.derive = function(spec) {
        if (!kernels.hasOwnProperty('derive')) {
            kernels.derive = src_kernels.derive($p, spec);
        }
        kernels.derive.execute(spec);
        return kernels.derive.result;
    }

    operations.visualize = function(vmap) {
        // if(Object.keys($p.crossfilters).length > 0)
        //     operations.match({});
        let vmaps = Array.isArray(vmap) ? vmap : [vmap];
        if($p.grid.views.length < vmaps.length) {
            $p.grid.reset();
            $p.views = $p.grid.generateViews({
                count: vmaps.length, 
                width: $p.viewport[0],
                height: $p.viewport[1],
                padding: $p.padding
            })
        }

        vmaps.forEach( (vmap, vi) => {
            if (!kernels.hasOwnProperty('visualize')) {
                kernels.visualize = src_kernels.visualize($p);
            }
            let viewIndex = vi;
            if(typeof vmap.id == 'string') {
                viewIndex = $p.views.map(d=>d.id).indexOf(vmap.id);
                if(viewIndex == -1) {
                    //find the next available view slot in all views
                    for(let vi = 0; vi < $p.views.length; vi++){
                        if(!$p.views[vi].id) {
                            viewIndex = vi;
                            $p.views[viewIndex].id = vmap.id;
                            break;
                        }
                    }
                }
            }

            if(vmap.mark == 'bar') vmap.zero = true;
            $p.views[viewIndex].vmap = vmap;
            let encoding = vmap,
                viewTag = $p.views[viewIndex].id;
    
            if($p._update && $p.responses.hasOwnProperty(viewTag)) {
                if($p.responses[viewTag].hasOwnProperty($p._responseType)) {
                    encoding = Object.assign({}, vmap, $p.responses[viewTag][$p._responseType]);
                }
            }
            if(encoding.opacity != 0){
                kernels.visualize({
                    vmap: encoding,
                    viewIndex: viewIndex
                });
                $p.respond();
            }
        })
        $p.reset();
    }

    return operations;
});
// EXTERNAL MODULE: /home/kelvin/Dropbox/workspace/p.pack/p.plot/index.js + 4 modules
var p_plot = __webpack_require__("g2B4");

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/animate.js
function getValue ({fieldId = 'int', addrX = 'float', addrY = 'float'}){
    var value;
    var d = new Vec2();
    if(fieldId > -1) {
        value = this.getData(fieldId, addrX, addrY);
        d = this.uVisDomains[fieldId];
        value = (value - d.x) / (d.y - d.x);
    } else {
        value = 1.0;
    }
    return value;
};

function getVisProps({x = 'float', y = 'float'}) {
    var posX, posY, size; 
    posX = this.getValue(this.uAnimationEncodings[0], x, y);
    posY = this.getValue(this.uAnimationEncodings[1], x, y);
    size = this.getValue(this.uAnimationEncodings[6], x, y);

    var result = new Vec3();
    result = vec3(posX, posY, size);
    return result;
}

function interpolateVec3({
    v0 = 'vec3',
    v1 = 'vec3',
    dv = 'float'
}) {
    var x, y, z;

    x = v0.x + dv * (v1.x - v0.x);
    y = v0.y + dv * (v1.y - v0.y);
    z = v0.z + dv * (v1.z - v0.z);

    return vec3(x, y, z);
}

function interpolateVec4($vec4_v0, $vec4_v1, $float_dv) {
    var x, y, z, w;

    x = v0.x + dv * (v1.x - v0.x);
    y = v0.y + dv * (v1.y - v0.y);
    z = v0.z + dv * (v1.z - v0.z);
    z = v0.w + dv * (v1.w - v0.w);

    return vec3(x, y, z, w);
}

function getVisColor($float_x, $float_y) {
    var color, opacity;
    var rgb = new Vec3();
    color = this.getValue(this.uAnimationEncodings[2], x, y);
    opacity = this.getValue(this.uAnimationEncodings[3], x, y);
    rgb = this.mapColorRGB(this.uAnimationEncodings[2], color);
    return vec4(rgb, opacity);
}

let vShader  = function() {
    var i0, i1, j, posX, posY;
    var rgb = new Vec3();
    var props = new Vec3();
    var props0 = new Vec3();
    var props1 = new Vec3();

    i0 = (this.aDataIdx+0.5) / this.uDataDim.x;
    i1 = (this.aDataIdx+1.5) / this.uDataDim.x;
    j = (this.aDataIdy+0.5) / this.uDataDim.y;

    if(this.uFilterFlag == 1) {
        this.vResult = texture2D(this.fFilterResults, vec2(i0, j)).a;
    } else {
        this.vResult = this.uVisLevel;
    }
    
    this.vColorRGBA = this.getVisColor(i0, j);
    props0 = this.getVisProps(i0, j);
    props1 = this.getVisProps(i1, j);
    props = this.interpolateVec3(props0, props1, this.uAnimationInterval);
    // props = this.getVisProps(i0, j);
    posX = props[0] * 2.0 - 1.0;
    posY = props[1] * 2.0 - 1.0;
    gl_PointSize = props[2] * this.uMarkSize;
    gl_Position = vec4(posX, posY , 0.0, 1.0);
};

let fShader = function() {
    var valid = new Bool();
    valid = this.vResult <= this.uVisLevel + 0.01 && this.vResult >= this.uVisLevel - 0.01;
    if(this.uVisMark == 1) {
        var dist = length(gl_PointCoord.xy - vec2(0.5, 0.5));
        if (dist > 0.5) discard;
        var delta = 0.15;
        var alpha = this.vColorRGBA.a - smoothstep(0.5-delta, 0.5, dist);
        if(valid) {
            gl_FragColor = vec4(this.vColorRGBA.rgb*alpha, alpha);
        } else {
            discard;
        }
    } else {
        if(valid) {
            gl_FragColor = vec4(this.vColorRGBA.rgb * this.vColorRGBA.a,  this.vColorRGBA.a);
        } else {
            discard;
        }
    }
}

/* harmony default export */ var animate = (function($p) {
    $p.uniform('uAnimationInterval', 'float', 0.0);
    $p.uniform('uAnimationEncodings', 'int', $p.uniform.uVisualEncodings.data);

    $p.subroutine('getValue', 'float', getValue);
    $p.subroutine('getVisProps', 'vec3', getVisProps);
    $p.subroutine('getVisColor', 'vec4', getVisColor);
    $p.subroutine('interpolateVec3', 'vec3', interpolateVec3);
    $p.program("animate",
        $p.shader.vertex(vShader),
        $p.shader.fragment(fShader)
    );

    let animation = {
        elapsed : 0,
        interval : 500,
        then : 0,
        step : 0,
        stop: false,
    }

    $p.animation = animation;

    let animate = function(now) {
        if (animation.elapsed > animation.interval) {
            animation.elapsed = 0;
            animation.step += 1;
            console.log(animation.step);
        } else {
            animation.elapsed += now - animation.then; 
        }
        animation.then = now;
        $p.uniform.uAnimationInterval = animation.elapsed / animation.interval;
        if(animation.step <= $p.dataDimension[0] - 1) {
            $p.ctx.ext.drawArraysInstancedANGLE($p.ctx.POINTS, animation.step, 1, $p.dataDimension[1]);
            if(!animation.stop) requestAnimationFrame(animate);

        } else {
            console.log('animation completed with total steps of ' + animation.step)
        }
    }

    animation.start =  function() {
        requestAnimationFrame(animate);
    }

    return function() {
        let gl = $p.program('animate');
        $p.uniform.uAnimationEncodings = $p.uniform.uVisualEncodings.data;
        gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdx.location, 0);
        gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataValx.location, 0);
        gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataIdy.location, 1);
        gl.ext.vertexAttribDivisorANGLE($p.attribute.aDataValy.location, 1);
        animation.start();

        return animation;
    }
});

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/extensions.js



/* harmony default export */ var extensions = ([
    {
        name: 'spline',
        exportData: true,
        skipDefault: true,
        getContext: false,
        restartOnUpdate: false,
        compute: true,
        condition: vmap => vmap.mark === 'spline', 
        type: 'class',
        function: p_plot["a" /* default */].Spline
    },
    {
        name: 'area',
        exportData: true,
        skipDefault: true,
        getContext: false,
        restartOnUpdate: false,
        condition: vmap => vmap.mark === 'area', 
        type: 'class',
        function: p_plot["a" /* default */].AreaChart
    },
    // {
    //     name: 'animate',
    //     // exportData: true,
    //     skipDefault: true,
    //     getContext: true,
    //     restartOnUpdate: false,
    //     condition: vmap => vmap.mark === 'circle' && vmap.animate === true, 
    //     function: animation
    // }
]);
// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/grid.js
class Grid {
    constructor(views) {
        this.views = views
    }

    add (view) {
        this.view.push(view)
    }

    reset () {
        this.views.forEach(function(v){
            if(v.hasOwnProperty('chart')) {
                v.chart.svg.remove()
                v.chart.removeAxis()
                v.chart.removeLegend()
                delete v.chart
            }
        })
    }

    generateViews ({
        layout = 'rows',
        count = 1,
        width = 640,
        height = 480,
        padding = {left: 0, right: 0, top: 0, bottom: 0}
    }) {
        let views = new Array(count)
        let calcOffset
        height -= padding.top + padding.bottom;
        width -= padding.left + padding.right;
        if (layout == 'rows') {
            height = height / count
            calcOffset = (index) => [0, index * height]
        } else {
            width = width / count
            calcOffset = (index) => [index * width, 0]
        }
        for (let i = 0; i < count; i++) {
            let offset = calcOffset(i)
            views[i] = {width, height, padding, offset}
        }
        this.views = views;
        return views;
    }
}
// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/src/main.js
/* harmony export (immutable) */ __webpack_exports__["a"] = p4;













function p4(options) {
    let $p;
    $p = init(options);
    $p.views = [];
    $p.interactions = [];
    $p.histograms = [];
    $p.extensions = extensions;
    $p.responses = {};
    $p.crossfilters = {};
    $p.primitives = [];
    $p.dataSize = 0;
    $p.rowSize = options.dimX || 4096;
    $p.deriveMax = options.deriveMax || 4;
    $p.deriveCount = 0;
    
    $p._responseType = 'unselected';
    $p._update = false;
    $p._progress = false;
    $p.skipRender= false;

    $p.getResult = function() {};
    let api = pipeline($p);
    api.ctx = $p;
    api.addModule(control);
    api.addModule(output);
    // api.addModule(view);

    api.addOperation('head', function() {
        api.resume('__init__');
        if(Object.keys($p.crossfilters).length > 0) api.match({});
        $p.getResult = $p.getRawData;
        return api;
    });

    $p.grid = {views: []};
    api.view = function(views) {
        if($p.grid.views.length !== 0) {
            $p.grid.reset();
        } 
        $p.grid = new Grid(views);
        $p.views = $p.grid.views;
        return api;
    }
    
    $p.reset = api.head;
    $p.exportResult = api.result;

    function configPipeline($p) {
        $p.extent = src_kernels.extent($p);
        // $p.operations = compile($p);
        let operations = operate($p);
        api.getOperations = () => Object.keys(operations);
        for(let optName of Object.keys(operations)) {
            api.addOperation(optName, operations[optName], true);
        }
        
        for(let ext of $p.extensions) {
            if(ext.getContext === true) {
                ext.function = ext.function($p);
            }
        }
        api.register('__init__');
    }
    
    api.data = function(dataOptions) {
        allocate($p, dataOptions);
        configPipeline($p);
        $p.getResult = dataOptions.export;
        $p.getRawData = dataOptions.export;
        return api;
    }

    api.index = function(indexes) {
        data.indexes = indexes;
        return api;
    }

    api.input = function(arg) {
        let asyncPipeline = {};
        let inputReady = false;
        for(let program of Object.keys(api).concat(Object.keys(src_kernels))) {
            asyncPipeline[program] = function(spec) {
                api.addToQueue(program, spec);
                return asyncPipeline;
            }
        }

        asyncPipeline.execute = function() {
            return input(arg).then(function(data){
                if(Array.isArray(arg.indexes)) {
                    data.indexes = arg.indexes;
                }   
                api.data(data);
                api.async(true);
                api.run();
                api.async(false);
                inputReady = true;
                return new Promise(function(resolve, reject){
                    resolve(api.result('row'))
                    return api;
                })
            })
        }

        asyncPipeline.commit = asyncPipeline.execute;

        if(arg.dimX) $p.rowSize = arg.dimX;
        return asyncPipeline;
    }

    api.getResult = function (d) {
        return $p.getResult(d);
    }

    api.clearWebGLBuffers = function() {
        $p.bindFramebuffer("offScreenFBO");
        $p.ctx.clearColor( 0.0, 0.0, 0.0, 0.0 );
        $p.ctx.clear( $p.ctx.COLOR_BUFFER_BIT | $p.ctx.DEPTH_BUFFER_BIT );
        $p.bindFramebuffer("visStats");
        $p.ctx.clearColor( 0.0, 0.0, 0.0, 0.0 );
        $p.ctx.clear( $p.ctx.COLOR_BUFFER_BIT | $p.ctx.DEPTH_BUFFER_BIT );
        $p.bindFramebuffer(null);
        $p.ctx.clearColor( 0.0, 0.0, 0.0, 0.0 );
        $p.ctx.clear( $p.ctx.COLOR_BUFFER_BIT | $p.ctx.DEPTH_BUFFER_BIT );
    }

    api.runSpec = function(specs) {
        api.head();
        api.clearWebGLBuffers();
        $p.interactions = [];
        $p.responses = {};
        $p.crossfilters = [];
        $p.uniform.uFilterFlag.data = 0;
        api.clearQueue();
        // $p.uniform.uFilterRanges = $p.fieldDomains.concat($p.deriveDomains);
        specs.forEach(function(spec){
            let opt = Object.keys(spec)[0];
            let arg = spec[opt];
            opt = opt.slice(1); // ignore $ sign 
            if(typeof api[opt] == 'function') {
                api[opt](arg);
            }
        })
 
        return api;
    }
  
    api.interact = function(spec) {
        if(typeof(spec) != 'undefined') $p.interactions.push(spec);
        $p.interactions.forEach(function(interaction){
            
            let callback = interaction.callback || function(selection) {
                $p.responses = interaction.response;
                if(!$p._update) {
                    $p._update = true;
                    $p.crossfilters = {};
                    if(typeof selection == 'object') {
                        Object.keys(selection).forEach(function(k) {
                            if(selection[k].length < 2) {
                                if($p.intervals.hasOwnProperty(k)) {
                                    var value = (Array.isArray(selection[k]))
                                        ? selection[k][0]
                                        : selection[k];
                                    selection[k] = [value-$p.intervals[k].interval, value];
                                } else if(!$p.categoryLookup.hasOwnProperty(k)) {
                                    selection[k] = [selection[k][0] + selection[k][0] + 1];
                                }
                            }
                            $p.crossfilters[k] = selection[k];
                        });
                    }
                    $p._responseType = 'unselected';
                    $p.uniform.uFilterLevel.data = 0.2;
                    $p.uniform.uVisLevel.data = 0.1;
                    api.head().run();
                    $p._responseType = 'selected';
                    $p.uniform.uVisLevel.data = 0.2;
                    api.head().run();
                    $p._responseType = 'unselected';
                    $p._update = false;
                    $p.uniform.uFilterLevel.data = 0.1;
                    $p.uniform.uVisLevel.data = 0.1;
                }
            }
            interact($p, {
                actions: interaction.event,
                view: interaction.from,
                condition: interaction.condition,
                callback: callback  
            })
        })
    }
    $p.respond = api.interact;

    api.updateData = function(data) {
        if(data.size > 0) {
            $p.dataSize = data.size;
        }
        $p.fields.slice($p.indexes.length).forEach((attr, ai) => {
            let buf = new Float32Array($p.dataDimension[0] * $p.dataDimension[1]);
            for (let i = 0, l = data[attr].length; i < l; i++) {
                buf[i] = data[attr][i];
            }
            $p.texture.tData.update(
                buf, [0, $p.dataDimension[1] * ai], $p.dataDimension
            );
            $p.fieldDomains[ai] = [
                Math.min(data.stats[attr].min, $p.fieldDomains[ai][0]),
                Math.max(data.stats[attr].max, $p.fieldDomains[ai][1])
            ]
            $p.fieldWidths[ai] = $p.fieldDomains[ai][1] - $p.fieldDomains[ai][0];
            if(data.strLists.hasOwnProperty(attr)){
                $p.fieldDomains[ai] = [0, data.strLists[attr].length - 1];
                $p.categoryLookup[attr] = data.strLists[attr];
                $p.fieldWidths[ai] = data.strLists[attr].length;
            }
        });

        api.updateRegister('__init__', {
            fieldDomains: $p.fieldDomains,
            fieldWidths: $p.fieldWidths}
        )
        $p.uniform.uFieldDomains.data = $p.fieldDomains;
        $p.uniform.uFieldWidths.data = $p.fieldWidths;
        return api;
    }

    api.updateDataColumn = function(data, attribute) {
        if($p.fields.indexOf(attribute) === -1) {
            throw Error('Invalid attribute', attribute);
        }
        let buf = new Float32Array($p.dataDimension[0] * $p.dataDimension[1]);
        let attrId = $p.fields.indexOf(attribute) - $p.indexes.length;
        for (let i = 0, l = data[attribute].length; i < l; i++) {
            buf[i] = data[attr][i];
        }
        $p.texture.tData.update(
            buf, [0, $p.dataDimension[1] * attrId], $p.dataDimension
        );
    }

    api.updateDataRow = function(data, rowId) {
        let dataType = (Array.isArray(data)) ? 'array' : 'json';
        $p.fields.slice($p.indexes.length).forEach((attr, ai) => {
            let texPosX = rowId % $p.dataDimension[0];
            let value = (dataType == 'array') ? data[ai] : data[attr];
            if(value === undefined) throw Error('Cannot update data due to invalid data value');
            $p.texture.tData.update(
                new Float32Array(data[ai]), [texPosX, $p.dataDimension[1] * i], [1,1]
            );
        });
        return api;
    }

    api.extend = function(arg) {
        let extOptions = Object.assign({
            restartOnUpdate: true,
            skipDefault: false,
            exportData: false,
            getContext: false,
        }, arg)

        if(extOptions.name != undefined && 
            (typeof extOptions.function === 'function' 
            || typeof extOptions.constructor === 'function')
        ) {
            $p.extensions.push(extOptions);
        }
    }
    return api;
}


/***/ }),

/***/ "qI3u":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global, module) {/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__src_main__ = __webpack_require__("yVvK");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__src_Transpiler__ = __webpack_require__("Y1y4");



var root = typeof self == 'object' && self.self === self && self ||
           typeof global == 'object' && global.global === global && global ||
           this;

__WEBPACK_IMPORTED_MODULE_0__src_main__["a" /* default */].Transpiler = __WEBPACK_IMPORTED_MODULE_1__src_Transpiler__["a" /* default */];
root.p5 = __WEBPACK_IMPORTED_MODULE_0__src_main__["a" /* default */];

/* harmony default export */ __webpack_exports__["a"] = (__WEBPACK_IMPORTED_MODULE_0__src_main__["a" /* default */]);

if(typeof module != 'undefined' && module.exports)
    module.exports = __WEBPACK_IMPORTED_MODULE_0__src_main__["a" /* default */];
/* WEBPACK VAR INJECTION */}.call(__webpack_exports__, __webpack_require__("DuR2"), __webpack_require__("f1Eh")(module)))

/***/ }),

/***/ "rkGp":
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global) {var root = typeof self == 'object' && self.self === self && self ||
           typeof global == 'object' && global.global === global && global ||
           this;

var p3 = {
    allocate    : __webpack_require__("IlyB"),
    arrays      : __webpack_require__("6v4a"),
    aggregate   : __webpack_require__("4fa2"),
    pipeline    : __webpack_require__("HDeP"),
    derive      : __webpack_require__("Xxjy"),
    match       : __webpack_require__("aQHI"),
    join        : __webpack_require__("Ai9I"),
    stats       : __webpack_require__("UL+f"),
    embed       : __webpack_require__("mH2t"),
    toArray     : __webpack_require__("Lgo6"),
    vector     : __webpack_require__("FFav")
};

if(typeof root.p3 == 'object') {
    root.p3 = Object.assign(root.p3, p3);
} else {
    root.p3 = p3;
}

module.exports = p3;

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__("DuR2")))

/***/ }),

/***/ "uGFW":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global, module) {/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__src_main__ = __webpack_require__("1Mm8");


var root = typeof self == 'object' && self.self === self && self ||
           typeof global == 'object' && global.global === global && global ||
           this;

root.flexgl = __WEBPACK_IMPORTED_MODULE_0__src_main__["a" /* default */];

/* harmony default export */ __webpack_exports__["a"] = (__WEBPACK_IMPORTED_MODULE_0__src_main__["a" /* default */]);

if(typeof module != 'undefined' && module.exports)
    module.exports = __WEBPACK_IMPORTED_MODULE_0__src_main__["a" /* default */];
/* WEBPACK VAR INJECTION */}.call(__webpack_exports__, __webpack_require__("DuR2"), __webpack_require__("f1Eh")(module)))

/***/ }),

/***/ "yVvK":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";

// EXTERNAL MODULE: /home/kelvin/Dropbox/workspace/p.pack/p4/index.js
var p4 = __webpack_require__("8LhM");

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p5/src/FileLoader.js
let formats = {
  text: 'text',
  array: 'array',
  json: 'json'
}

class FileLoader {

  constructor({
    file,
    skip = 0,
    chunk = 64 * 1024,
    delimiter = ','
  }) {
    if (typeof (file) === 'undefined') {
      throw Error('No file provided for FileLoader.')
    }
    this.file = file
    this.fileSize = file.size
    this.reader = new FileReader()
    this.skip = skip
    this.chunk = chunk
    this.delimiter = delimiter
    this.reset()
  }

  static get format() {
    return formats
  }

  reset() {
    this.offset = 0
    this.lineTotal = 0
    this.leftOver = ''
  }

  parseDataSchema(rows) {
    let delimiter = rows[0].match(/(\,|\:|\t|\s{2,})/g)[0] || ','
    let header = rows[0].split(delimiter)
    let values = rows[1].split(delimiter)
    let schema = header.map((f, i) => {
      return {
        name: f,
        dtype: Number.isNaN(Number(values[i])) ? 'string' : 'int'
      }
    })
    this.delimiter = delimiter
    for (let rid = 1; rid < rows.length; rid++) {
      let values = rows[rid].split(delimiter)
      for (let fid = 0; fid < header.length; fid++) {
        let value = values[fid]
        if (schema[fid].dtype === 'int' && parseInt(value) !== parseFloat(value)) {
          schema[fid].dtype = 'float'
        }
      }
    }
    return schema
  }

  errorHandler(evt) {
    switch (evt.target.error.code) {
      case evt.target.error.NOT_FOUND_ERR:
        throw Error('File Not Found!', evt.target.error)

      case evt.target.error.NOT_READABLE_ERR:
        throw Error('File is not readable', evt.target.error)
      case evt.target.error.ABORT_ERR:
        throw Error('Aborted', evt.target.error)
      default:
        throw Error('An error occurred reading this file.', evt.target.error)
    };
  }

  getSchema() {
    this.reader.readAsBinaryString(this.file.slice(0, this.chunk / 16));
    return new Promise((resolve, reject) => {
      this.reader.onloadend = (evt) => {
        if (evt.target.readyState == FileReader.DONE) {
          let rawText = this.leftOver + evt.target.result
          let lines = rawText.split('\n')
          let schema = this.parseDataSchema(lines.slice(0, 10))
          resolve(schema)
        }
      }
      this.reader.onerror = (evt) => {
        reject(this.errorHandler(evt))
      }
    })
  }

  read(format) {
    this.reader.readAsBinaryString(this.file.slice(this.offset, Math.min(this.file.size, this.offset + this.chunk)));
    return new Promise((resolve, reject) => {
      this.reader.onloadend = (evt) => {
        if (evt.target.readyState == FileReader.DONE) {
          let rawText = this.leftOver + evt.target.result
          let lines = rawText.split('\n')
          this.leftOver = lines.pop()
          this.offset += this.chunk
          let results
          if (format == FileLoader.format.text) {
            results = lines
          } else {
            results = lines.map((line) => line.split(this.delimiter))
          }
          resolve(results)
        }
      }
      this.reader.onerror = (evt) => {
        reject(this.errorHandler(evt))
      }
    })
  }

  readAll(onprocess) {
    if (typeof onprocess !== 'function') {
      throw Error('undefined function specified for reading file content')
    }
    this.reader.readAsBinaryString(this.file.slice(this.offset, this.offset + this.chunk))
    return new Promise((resolve, reject) => {
      this.reader.onloadend = (evt) => {
        if (evt.target.readyState == FileReader.DONE) {
          let rawText = this.leftOver + evt.target.result
          let lines = rawText.split('\n')
          this.leftOver = lines.pop()

          if (this.offset == 0 && this.skip > 0) {
            if (this.skip > 0) lines.shift()
          }

          onprocess(lines.map((line) => line.split(this.delimiter)))
          this.lineTotal += lines.length

          if (this.offset < this.file.size) {
            this.offset += this.chunk
            this.reader.readAsBinaryString(this.file.slice(this.offset, this.offset + this.chunk));
          } else {
            resolve(this.lineTotal)
          }
        }
      }
      this.reader.onerror = (evt) => {
        reject(this.errorHandler(evt));
      }
    })
  }
}

// EXTERNAL MODULE: /home/kelvin/Dropbox/workspace/p.pack/p5/src/Transpiler.js
var Transpiler = __webpack_require__("Y1y4");

// CONCATENATED MODULE: /home/kelvin/Dropbox/workspace/p.pack/p5/src/main.js




const PROGRESS_MODES = ['automatic', 'semi-automatic', 'manual'];
const INPUT_METHODS = ['http', 'file', 'websocket'];
const OPERATIONS = ['aggregate', 'derive', 'match', 'visualize'];

/* harmony default export */ var main = __webpack_exports__["a"] = (function(arg) {
    let p5 = {}
    
    let p4x = Object(p4["a" /* default */])(Object.assign({preserveDrawingBuffer: true}, arg));

    let dataSchema;
    let dataSource;
    let fetchData;
    let progressStep = 0;
    let jobs = [];
    let dataSize = 0;
    let batchSize;
    let progressedSize = 0;
    let inProgress = false;

    p5.mode = arg.mode || PROGRESS_MODES[2];
    p5.data = function(arg) { p4x.data(arg); return p5};
    p5.view = function(arg) { p4x.view(arg); return p5};
    p5.runSpec = p4x.runSpec;
    p5.input = function({
        method = 'file',
        type = 'csv',
        delimiter = ',',
        source,
        size,
        schema
    }) {
        dataSchema = schema;
        batchSize = size;
        if(method == 'file') {
            dataSource = new FileLoader({
                file: source,
                chunk: size,
                delimiter
            })
            dataSize = source.size;
        } else {
            p4["a" /* default */].ajax.get({
                url: source + '?size=' + size,
                dataType: type
            })
        }
        
        fetchData = function() {
            return dataSource.read('json')
        }

        return p5;
    }

    for(let ops of OPERATIONS) {
        p5[ops] = function(arg) {
            let job = {};
            job[ops] = arg;
            jobs.push(job);
            return p5;
        }
    }

    p5.transpile = function(spec) {
        console.log(p4x.ctx.fields)
        let tplr = new Transpiler["a" /* default */](p4x.ctx.fields)
        return tplr.transpile(spec)
    }

    p5.jobs = function() {
        return jobs; 
    }

    p5.progress = function(newData, specs) {
        let jobs;
        if(Array.isArray(specs)) {
            jobs = [];
            specs.forEach(function(spec){
                let job = {};
                let opt = Object.keys(spec)[0];
                let arg = spec[opt];
                opt = opt.slice(1); // ignore $ sign 
                if(typeof p5[opt] == 'function') {
                    job[opt] = arg;
                }
                jobs.push(job);
            })
        }
        p4x.ctx._progress = true;
        p4x.head();
    
        p4x.updateData(newData);
        p4x.run(jobs);
        return p5;
    }

    p5.prepareData = function(data) {
        let cache = p4["a" /* default */].cstore({
            schema: dataSchema,
            size: data.size
        })
        cache.addRows(data);
        return cache.data();
    }

    p5.autoProgress = function() {
        p5.next().then(function(status){
            if (!status.done) {
                requestAnimationFrame(p5.autoProgress);
            }
        });
    }

    p5.start = function() {
        requestAnimationFrame(p5.autoProgress);
    }

    p5.next = function() {
        progressStep++;
        progressedSize += batchSize
        let done = (progressedSize >= dataSize ) ? true : false;
            
        let status =  {
            count: progressStep,
            done: done,
            completed: progressedSize,
            percentage: progressedSize / dataSize
        }

        if (done) {
            return new Promise((resolve, reject) => { resolve(status) })
        }

        return new Promise((resolve, reject) => {
            if(progressStep == 1) {
                if(dataSchema === undefined) {
                    dataSource.getSchema().then( schema => {
                        dataSchema = schema;
                        fetchData().then(data => {
                            p4x.data(p5.prepareData(data));
                            p4x.run(jobs);
                            resolve(status);
                        })
                    });
                }
            } else {
                fetchData().then(data => {
                    p4x.ctx._progress = true;
                    p4x.head();
                    p4x.updateData(p5.prepareData(data));
                    p4x.run(jobs);
                    resolve(status);
                })
            }

        })

    }

    return p5;
});

/***/ }),

/***/ "zzbV":
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ })

},["NHnr"]);
//# sourceMappingURL=app.c9a55680ea3b6d551404.js.map