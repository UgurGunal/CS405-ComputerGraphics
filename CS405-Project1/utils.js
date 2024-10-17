function multiplyMatrices(matrixA, matrixB) {
    var result = [];

    for (var i = 0; i < 4; i++) {
        result[i] = [];
        for (var j = 0; j < 4; j++) {
            var sum = 0;
            for (var k = 0; k < 4; k++) {
                sum += matrixA[i * 4 + k] * matrixB[k * 4 + j];
            }
            result[i][j] = sum;
        }
    }

    // Flatten the result array
    return result.reduce((a, b) => a.concat(b), []);
}
function createIdentityMatrix() {
    return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);
}
function createScaleMatrix(scale_x, scale_y, scale_z) {
    return new Float32Array([
        scale_x, 0, 0, 0,
        0, scale_y, 0, 0,
        0, 0, scale_z, 0,
        0, 0, 0, 1
    ]);
}

function createTranslationMatrix(x_amount, y_amount, z_amount) {
    return new Float32Array([
        1, 0, 0, x_amount,
        0, 1, 0, y_amount,
        0, 0, 1, z_amount,
        0, 0, 0, 1
    ]);
}

function createRotationMatrix_Z(radian) {
    return new Float32Array([
        Math.cos(radian), -Math.sin(radian), 0, 0,
        Math.sin(radian), Math.cos(radian), 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ])
}

function createRotationMatrix_X(radian) {
    return new Float32Array([
        1, 0, 0, 0,
        0, Math.cos(radian), -Math.sin(radian), 0,
        0, Math.sin(radian), Math.cos(radian), 0,
        0, 0, 0, 1
    ])
}

function createRotationMatrix_Y(radian) {
    return new Float32Array([
        Math.cos(radian), 0, Math.sin(radian), 0,
        0, 1, 0, 0,
        -Math.sin(radian), 0, Math.cos(radian), 0,
        0, 0, 0, 1
    ])
}

function getTransposeMatrix(matrix) {
    return new Float32Array([
        matrix[0], matrix[4], matrix[8], matrix[12],
        matrix[1], matrix[5], matrix[9], matrix[13],
        matrix[2], matrix[6], matrix[10], matrix[14],
        matrix[3], matrix[7], matrix[11], matrix[15]
    ]);
}

const vertexShaderSource = `
attribute vec3 position;
attribute vec3 normal; // Normal vector for lighting

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 normalMatrix;

uniform vec3 lightDirection;

varying vec3 vNormal;
varying vec3 vLightDirection;

void main() {
    vNormal = vec3(normalMatrix * vec4(normal, 0.0));
    vLightDirection = lightDirection;

    gl_Position = vec4(position, 1.0) * projectionMatrix * modelViewMatrix; 
}

`

const fragmentShaderSource = `
precision mediump float;

uniform vec3 ambientColor;
uniform vec3 diffuseColor;
uniform vec3 specularColor;
uniform float shininess;

varying vec3 vNormal;
varying vec3 vLightDirection;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(vLightDirection);
    
    // Ambient component
    vec3 ambient = ambientColor;

    // Diffuse component
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * diffuseColor;

    // Specular component (view-dependent)
    vec3 viewDir = vec3(0.0, 0.0, 1.0); // Assuming the view direction is along the z-axis
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
    vec3 specular = spec * specularColor;

    gl_FragColor = vec4(ambient + diffuse + specular, 1.0);
}

`

/**
 * @WARNING DO NOT CHANGE ANYTHING ABOVE THIS LINE
 */



/**
 * 
 * @TASK1 Calculate the model view matrix by using the chatGPT
 */

function getChatGPTModelViewMatrix() {
    const transformationMatrix = new Float32Array([
        0.17677669, -0.28661165,  0.7391989,  0.3,
        0.30618623,  0.36959946,  0.2803301, -0.25,
        -0.35355338,  0.17677669,  0.61237246,  0.0,
        0.0, 0.0, 0.0, 1.0
    ]);
    
    
    return (transformationMatrix);
}


/**
 * 
 * @TASK2 Calculate the model view matrix by using the given 
 * transformation methods and required transformation parameters
 * stated in transformation-prompt.txt
 */
function getModelViewMatrix() {
    
    const translation = createTranslationMatrix(0.3, -0.25, 0);
    const scaling = createScaleMatrix(0.5, 0.5, 1);
    const rotationX = createRotationMatrix_X(Math.PI / 6); // 30 degrees in radians
    const rotationY = createRotationMatrix_Y(Math.PI / 4); // 45 degrees in radians
    const rotationZ = createRotationMatrix_Z(Math.PI / 3); // 60 degrees in radians

    let modelViewMatrix = multiplyMatrices(translation, scaling);
    modelViewMatrix = multiplyMatrices(rotationZ, modelViewMatrix);
    modelViewMatrix = multiplyMatrices(rotationY, modelViewMatrix);
    modelViewMatrix = multiplyMatrices(rotationX, modelViewMatrix);

    return modelViewMatrix;
}

/**
 * 
 * @TASK3 Ask CHAT-GPT to animate the transformation calculated in 
 * task2 infinitely with a period of 10 seconds. 
 * First 5 seconds, the cube should transform from its initial 
 * position to the target position.
 * The next 5 seconds, the cube should return to its initial position.
 */
function interpolate(value1, value2, factor) {
    return value1 * (1 - factor) + value2 * factor;
}

function getPeriodicMovement(startTime) {
    // Define the initial and target transformations
    const initialTranslation = [0, 0, 0];
    const targetTranslation = [0.3, -0.25, 0];

    const initialScale = [1, 1, 1];
    const targetScale = [0.5, 0.5, 1];

    const initialRotationX = 0;
    const targetRotationX = Math.PI / 6; // 30 degrees

    const initialRotationY = 0;
    const targetRotationY = Math.PI / 4; // 45 degrees

    const initialRotationZ = 0;
    const targetRotationZ = Math.PI / 3; // 60 degrees

    // Calculate elapsed time in seconds
    const currentTime = (performance.now() - startTime) / 1000;
    const period = 10; // Total animation period is 10 seconds
    const halfPeriod = period / 2;
    const cycleTime = currentTime % period;

    // Calculate interpolation factor (0 to 1 for the first 5 seconds, then 1 to 0 for the next 5 seconds)
    let factor;
    if (cycleTime < halfPeriod) {
        factor = cycleTime / halfPeriod; // Forward transition
    } else {
        factor = 1 - (cycleTime - halfPeriod) / halfPeriod; // Reverse transition
    }

    // Interpolate transformation parameters
    const translation = [
        interpolate(initialTranslation[0], targetTranslation[0], factor),
        interpolate(initialTranslation[1], targetTranslation[1], factor),
        interpolate(initialTranslation[2], targetTranslation[2], factor)
    ];

    const scale = [
        interpolate(initialScale[0], targetScale[0], factor),
        interpolate(initialScale[1], targetScale[1], factor),
        interpolate(initialScale[2], targetScale[2], factor)
    ];

    const rotationX = interpolate(initialRotationX, targetRotationX, factor);
    const rotationY = interpolate(initialRotationY, targetRotationY, factor);
    const rotationZ = interpolate(initialRotationZ, targetRotationZ, factor);

    // Recreate transformation matrices using the interpolated values
    const translationMatrix = createTranslationMatrix(translation[0], translation[1], translation[2]);
    const scaleMatrix = createScaleMatrix(scale[0], scale[1], scale[2]);
    const rotationMatrixX = createRotationMatrix_X(rotationX);
    const rotationMatrixY = createRotationMatrix_Y(rotationY);
    const rotationMatrixZ = createRotationMatrix_Z(rotationZ);

    // Combine transformations: T * Rz * Ry * Rx * S
    let modelViewMatrix = multiplyMatrices(translationMatrix, scaleMatrix);
    modelViewMatrix = multiplyMatrices(rotationMatrixZ, modelViewMatrix);
    modelViewMatrix = multiplyMatrices(rotationMatrixY, modelViewMatrix);
    modelViewMatrix = multiplyMatrices(rotationMatrixX, modelViewMatrix);

    return modelViewMatrix;
}



