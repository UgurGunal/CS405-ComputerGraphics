function GetModelViewProjection(projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY) {
    var trans1 = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        translationX, translationY, translationZ, 1
    ];

    var rotatXCos = Math.cos(rotationX);
    var rotatXSin = Math.sin(rotationX);

    var rotatYCos = Math.cos(rotationY);
    var rotatYSin = Math.sin(rotationY);

    var rotatx = [
        1, 0, 0, 0,
        0, rotatXCos, -rotatXSin, 0,
        0, rotatXSin, rotatXCos, 0,
        0, 0, 0, 1
    ];

    var rotaty = [
        rotatYCos, 0, -rotatYSin, 0,
        0, 1, 0, 0,
        rotatYSin, 0, rotatYCos, 0,
        0, 0, 0, 1
    ];

    var combinedRotation = MatrixMult(rotaty, rotatx);
    var combinedTranslation = MatrixMult(trans1, combinedRotation);
    var mvp = MatrixMult(projectionMatrix, combinedTranslation);

    return mvp;
}


class MeshDrawer {
    constructor() {
        this.prog = InitShaderProgram(meshVS, meshFS);
        this.mvpLoc = gl.getUniformLocation(this.prog, 'mvp');
        this.showTexLoc = gl.getUniformLocation(this.prog, 'showTex');
        this.colorLoc = gl.getUniformLocation(this.prog, 'color');
        this.vertPosLoc = gl.getAttribLocation(this.prog, 'pos');
        this.texCoordLoc = gl.getAttribLocation(this.prog, 'texCoord');
        this.normalLoc = gl.getAttribLocation(this.prog, 'normal');

        this.vertbuffer = gl.createBuffer();
        this.texbuffer = gl.createBuffer();
        this.normalBuffer = gl.createBuffer();

        this.numTriangles = 0;

        // Lighting variables
        this.lightPosLoc = gl.getUniformLocation(this.prog, 'lightPos');
        this.enableLightingLoc = gl.getUniformLocation(this.prog, 'enableLighting');
        this.ambientLoc = gl.getUniformLocation(this.prog, 'ambient');
        this.specularLoc = gl.getUniformLocation(this.prog, 'specularLight');
    }

    setMesh(vertPos, texCoords, normalCoords) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

        this.numTriangles = vertPos.length / 3;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalCoords), gl.STATIC_DRAW);
    }

    draw(trans) {
        gl.useProgram(this.prog);

        gl.uniformMatrix4fv(this.mvpLoc, false, trans);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
        gl.enableVertexAttribArray(this.vertPosLoc);
        gl.vertexAttribPointer(this.vertPosLoc, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
        gl.enableVertexAttribArray(this.texCoordLoc);
        gl.vertexAttribPointer(this.texCoordLoc, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.enableVertexAttribArray(this.normalLoc);
        gl.vertexAttribPointer(this.normalLoc, 3, gl.FLOAT, false, 0, 0);

        gl.uniform3fv(this.lightPosLoc, normalize([lightX, lightY, 1]));
        updateLightPos();

        gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
    }

    setTexture(img, textureIndex = 0) {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGB,
            gl.RGB,
            gl.UNSIGNED_BYTE,
            img
        );

        // Handle non-power-of-2 textures
        if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        }

        if (textureIndex === 0) {
            this.texture0 = texture;
        } else if (textureIndex === 1) {
            this.texture1 = texture;
        }

        gl.useProgram(this.prog);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture0);
        gl.uniform1i(this.tex0Loc, 0);

        if (this.texture1) {
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, this.texture1);
            gl.uniform1i(this.tex1Loc, 1);
        }
    }

    showTexture(show) {
        gl.useProgram(this.prog);
        gl.uniform1i(this.showTexLoc, show);
    }

    enableLighting(show) {
        gl.useProgram(this.prog);
        gl.uniform1i(this.enableLightingLoc, show);
    }

    setAmbientLight(ambient) {
        gl.useProgram(this.prog);
        gl.uniform1f(this.ambientLoc, ambient);
    }

    setSpecularLight(intensity) {
        gl.useProgram(this.prog);
        gl.uniform1f(this.specularLoc, intensity);
    }
}

function isPowerOf2(value) {
    return (value & (value - 1)) === 0;
}

function normalize(v, dst) {
    dst = dst || new Float32Array(3);
    var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    if (length > 0.00001) {
        dst[0] = v[0] / length;
        dst[1] = v[1] / length;
        dst[2] = v[2] / length;
    }
    return dst;
}

const meshVS = `
    attribute vec3 pos; 
    attribute vec2 texCoord; 
    attribute vec3 normal;

    uniform mat4 mvp; 

    varying vec2 v_texCoord; 
    varying vec3 v_normal; 

    void main() {
        v_texCoord = texCoord;
        v_normal = normal;
        gl_Position = mvp * vec4(pos, 1);
    }
`;

const meshFS = `
    precision mediump float;
    uniform bool showTex;
    uniform bool enableLighting;

    uniform sampler2D tex0;
    uniform sampler2D tex1;
    uniform vec3 color; 
    uniform vec3 lightPos;
    uniform float ambient;
    uniform float specularLight;

    const float shininess = 1.0;

    varying vec2 v_texCoord;
    varying vec3 v_normal;

    void main() {
        if (showTex && enableLighting) {
            vec3 normal = normalize(v_normal);
            vec3 lightDirection = normalize(lightPos);

            float diffuseLight = max(dot(normal, -lightDirection), 0.0);
            vec3 viewDirection = vec3(0.0, 0.0, 1.0);
            vec3 reflectDirection = reflect(-lightDirection, normal);

            float specular = 0.0;
            if (dot(normal, -lightDirection) > 0.0) {
                specular = pow(max(dot(viewDirection, reflectDirection), 0.0), shininess);
            }

            vec4 TexColor1 = texture2D(tex0, v_texCoord);
            vec4 TexColor2 = texture2D(tex1, v_texCoord);

            vec4 combinedColor = mix(TexColor1, TexColor2, 0.5);

            gl_FragColor = combinedColor * (ambient + diffuseLight + specular * specularLight);
        } else if (showTex) {

            vec4 color0 = texture2D(tex0, v_texCoord);
            vec4 color1 = texture2D(tex1, v_texCoord);
            gl_FragColor = color0 + color1;  // Directly combine colors if no lighting
        } else {
		 
            gl_FragColor = vec4(color, 1.0);  // Default color if no texture
        }
    }
`;

// Light direction parameters for Task 2
var lightX = 1;
var lightY = 1;

const keys = {};
function updateLightPos() {
    const translationSpeed = 1;
    if (keys['ArrowUp']) lightY -= translationSpeed;
    if (keys['ArrowDown']) lightY += translationSpeed;
    if (keys['ArrowLeft']) lightX -= translationSpeed;
    if (keys['ArrowRight']) lightX += translationSpeed;
    meshDrawer.lightPos = [lightX, lightY, 1];
}
