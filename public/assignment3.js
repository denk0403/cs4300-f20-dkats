/**
 * @typedef RGBColor
 * @property {Number} red
 * @property {Number} green
 * @property {Number} blue
 */

/**
 * @typedef Shape
 * @property {"RECTANGLE" | "TRIANGLE"} type
 * @property {{ x: Number, y: Number }} center
 * @property {{ width: Number, height: Number }} dimensions
 * @property {RGBColor} color
 */

/**
 * Converts a hex color to its rgb representation.
 * @param {String} hex The hexadecimal representation of a color
 * @returns {RGBColor}
 */
const hexToRgb = (hex) => {
    let parseRgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    let rgb = {
        red: parseInt(parseRgb[1], 16),
        green: parseInt(parseRgb[2], 16),
        blue: parseInt(parseRgb[3], 16),
    };

    rgb.red /= 256;
    rgb.green /= 256;
    rgb.blue /= 256;

    return rgb;
};

const RED_HEX = "#FF0000";
const RED_RGB = hexToRgb(RED_HEX);
const BLUE_HEX = "#0000FF";
const BLUE_RGB = hexToRgb(BLUE_HEX);

/**
 * Creates a program from given shader scripts.
 * @param {WebGLRenderingContext} gl
 * @param {String} vertexShaderElementId
 * @param {String} fragmentShaderElementId
 */
const createProgramFromScripts = (gl, vertexShaderElementId, fragmentShaderElementId) => {
    // Get the strings for our GLSL shaders
    /** @type {WebGLShader} */
    const vertexShaderSource = document.querySelector(vertexShaderElementId).text;
    /** @type {WebGLShader} */
    const fragmentShaderSource = document.querySelector(fragmentShaderElementId).text;

    // Create GLSL shaders, upload the GLSL source, compile the shaders
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    // Link the two shaders into a program
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    return program;
};

const RECTANGLE = "RECTANGLE";
const TRIANGLE = "TRIANGLE"; // Isosceles Triangle

/**
 * @type {Shape[]}
 */
let shapes = [
    {
        type: RECTANGLE,
        center: { x: 200, y: 100 },
        dimensions: { width: 50, height: 50 },
        color: { ...BLUE_RGB },
    },
    {
        type: TRIANGLE,
        center: { x: 300, y: 100 },
        dimensions: { width: 50, height: 50 },
        color: { ...RED_RGB },
    },
];

/** @type {WebGLRenderingContext} */
let gl; // reference to canvas's WebGL context, main API

/** @type {Number} */
let attributeCoords; // sets 2D location of squares

/** @type {WebGLUniformLocation} */
let uniformColor; // sets the color of the squares

/** @type {WebGLBuffer} */
let bufferCoords; // sends geometry to GPU

/**
 * Handles mouse down events on the canvas
 * @param {MouseEvent} event
 */
const doMouseDown = (event) => {
    const boundingRectangle = canvas.getBoundingClientRect();
    const x = event.clientX - boundingRectangle.left;
    const y = event.clientY - boundingRectangle.top;
    const center = { position: { x, y } };
    const shape = document.querySelector("input[name='shape']:checked").value;

    if (shape === "RECTANGLE") {
        addRectangle(center);
    } else if (shape === "TRIANGLE") {
        addTriangle(center);
    }
};

const init = () => {
    // get a reference to the canvas
    const canvas = document.querySelector("#canvas");

    // Setup mouse event handlers
    canvas.addEventListener("mousedown", doMouseDown, false);

    // Get WebGL context
    gl = canvas.getContext("webgl");

    // create and use a GLSL program
    const program = createProgramFromScripts(gl, "#vertex-shader-2d", "#fragment-shader-2d");
    gl.useProgram(program);

    // get reference to GLSL attributes and uniforms
    attributeCoords = gl.getAttribLocation(program, "a_coords");
    const uniformResolution = gl.getUniformLocation(program, "u_resolution");
    uniformColor = gl.getUniformLocation(program, "u_color");

    // initialize coordinate attribute to send each vertex to GLSL program
    gl.enableVertexAttribArray(attributeCoords);

    // initialize coordinate buffer to send array of vertices to GPU
    bufferCoords = gl.createBuffer();

    // configure canvas resolution and clear the canvas
    gl.uniform2f(uniformResolution, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
};

const render = () => {
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferCoords);
    gl.vertexAttribPointer(attributeCoords, 2, gl.FLOAT, false, 0, 0);

    shapes.forEach((shape) => {
        gl.uniform4f(uniformColor, shape.color.red, shape.color.green, shape.color.blue, 1);

        if (shape.type === RECTANGLE) {
            renderRectangle(shape);
        } else if (shape.type === TRIANGLE) {
            renderTriangle(shape);
        }
    });
};

/**
 * @param {Shape} rectangle
 */
const renderRectangle = (rectangle) => {
    const x1 = rectangle.center.x - rectangle.dimensions.width / 2;
    const y1 = rectangle.center.y - rectangle.dimensions.height / 2;
    const x2 = rectangle.center.x + rectangle.dimensions.width / 2;
    const y2 = rectangle.center.y + rectangle.dimensions.height / 2;

    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2]),
        gl.STATIC_DRAW,
    );

    gl.drawArrays(gl.TRIANGLES, 0, 6);
};

/**
 * @param {Shape} rectangle
 */
const renderTriangle = (triangle) => {
    const x1 = triangle.center.x - triangle.dimensions.width / 2;
    const y1 = triangle.center.y + triangle.dimensions.height / 2;
    const x2 = triangle.center.x + triangle.dimensions.width / 2;
    const y2 = triangle.center.y + triangle.dimensions.height / 2;
    const x3 = triangle.center.x;
    const y3 = triangle.center.y - triangle.dimensions.height / 2;

    const float32Array = new Float32Array([x1, y1, x2, y2, x3, y3]);

    gl.bufferData(gl.ARRAY_BUFFER, float32Array, gl.STATIC_DRAW);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
};

/**
 * @param {{position: {x: Number, y: Number}}=} param0
 */
const addRectangle = ({ position }) => {
    let x = parseInt(document.getElementById("x").value);
    let y = parseInt(document.getElementById("y").value);
    const width = parseInt(document.getElementById("width").value);
    const height = parseInt(document.getElementById("height").value);
    const colorHex = document.getElementById("color").value;
    const colorRgb = hexToRgb(colorHex);

    if (position) {
        x = position.x;
        y = position.y;
    }

    const rectangle = {
        type: RECTANGLE,
        center: { x, y },
        dimensions: { width, height },
        color: colorRgb,
    };

    shapes.push(rectangle);
    render();
};

/**
 * @param {{position: {x: Number, y: Number}}=} param0
 */
const addTriangle = ({ position }) => {
    let x = parseInt(document.getElementById("x").value);
    let y = parseInt(document.getElementById("y").value);
    const width = parseInt(document.getElementById("width").value);
    const height = parseInt(document.getElementById("height").value);
    const colorHex = document.getElementById("color").value;
    const colorRgb = hexToRgb(colorHex);

    if (position) {
        x = position.x;
        y = position.y;
    }
    const triangle = {
        type: TRIANGLE,
        center: { x, y },
        dimensions: { width, height },
        color: colorRgb,
    };

    shapes.push(triangle);
    render();
};
