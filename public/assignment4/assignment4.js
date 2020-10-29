/**
 * @typedef Shape
 * @property {"RECTANGLE" | "TRIANGLE" | "CIRCLE" | "STAR"} type
 * @property {{ x: Number, y: Number }} center
 * @property {{ width: Number, height: Number }} dimensions
 * @property {RGBColor} color
 * @property {{ x: Number, y: Number }} translation
 * @property {{ z: Number}} rotation
 * @property {{ x: Number, y: Number }} scale
 */

const RED_HEX = "#FF0000";
const RED_RGB = webglUtils.hexToRgb(RED_HEX);
const BLUE_HEX = "#0000FF";
const BLUE_RGB = webglUtils.hexToRgb(BLUE_HEX);

// SHAPES
const RECTANGLE = "RECTANGLE";
const TRIANGLE = "TRIANGLE"; // Isosceles Triangle
const CIRCLE = "CIRCLE";
const STAR = "STAR"; // 5-point Star

const ORIGIN = { x: 0, y: 0 };
const UNIT_SIZE = { width: 1, height: 1 };

/**
 * @type {Shape[]}
 */
let shapes = [
    {
        type: RECTANGLE,
        center: ORIGIN,
        dimensions: { ...UNIT_SIZE },
        color: { ...BLUE_RGB },
        translation: { x: 200, y: 100 },
        rotation: { z: 0 },
        scale: { x: 50, y: 50 },
    },
    {
        type: TRIANGLE,
        center: ORIGIN,
        dimensions: { ...UNIT_SIZE },
        color: { ...RED_RGB },
        translation: { x: 300, y: 100 },
        rotation: { z: 0 },
        scale: { x: 50, y: 50 },
    },
];

/** @type {WebGLRenderingContext} */
let gl; // reference to canvas's WebGL context, main API

/** @type {Number} */
let attributeCoords; // sets 2D location of shapes

/** @type {WebGLUniformLocation} */
let uniformMatrix; // sets transformation matrix of shapes

/** @type {WebGLUniformLocation} */
let uniformColor; // sets the color of the squares

/** @type {WebGLBuffer} */
let bufferCoords; // sends geometry to GPU

/** @type {Number} */
let selectedShapeIndex = 0; // The index of the currently selected shape in the shapes array

/**
 * Handles mouse down events on the canvas
 * @param {MouseEvent} event
 */
const doMouseDown = (event) => {
    const boundingRectangle = canvas.getBoundingClientRect();
    const x = event.clientX - boundingRectangle.left;
    const y = event.clientY - boundingRectangle.top;
    const translation = { x, y };
    const shape = document.querySelector("input[name='shape']:checked").value;

    addShape(translation, shape);
};

/**
 * Event handler for translation updates on shape.
 * @param {InputEvent} event
 * @param {String} axis The property to update
 */
const updateTranslation = (event, axis) => {
    const value = event.target.value;
    shapes[selectedShapeIndex].translation[axis] = value;
    render();
};

/**
 * Event handler for scaling updates on shape.
 * @param {InputEvent} event
 * @param {String} axis The property to update
 */
const updateScale = (event, axis) => {
    const value = event.target.value;
    shapes[selectedShapeIndex].scale[axis] = value;
    render();
};

/**
 * Event handler for rotation updates on shape.
 * @param {InputEvent} event
 * @param {String} axis The property to update
 */
const updateRotation = (event, axis) => {
    const value = event.target.value;
    const angleInDegrees = ((360 - value) * Math.PI) / 180;
    shapes[selectedShapeIndex].rotation[axis] = angleInDegrees;
    render();
};

/**
 * Event handler for color updates on shape.
 * @param {InputEvent} event
 */
const updateColor = (event) => {
    const colorValue = webglUtils.hexToRgb(event.target.value);
    shapes[selectedShapeIndex].color = colorValue;
    render();
};

/**
 * Initializes the WebGL canvas and draw initial shapes.
 */
const init = () => {
    // get a reference to the canvas
    const canvas = document.querySelector("#canvas");

    // Setup mouse event handlers
    canvas.addEventListener("mousedown", doMouseDown, false);

    // Setup transformation handlers
    document.getElementById("tx").onchange = (event) => updateTranslation(event, "x");
    document.getElementById("ty").onchange = (event) => updateTranslation(event, "y");
    document.getElementById("sx").onchange = (event) => updateScale(event, "x");
    document.getElementById("sy").onchange = (event) => updateScale(event, "y");
    document.getElementById("rz").onchange = (event) => updateRotation(event, "z");
    document.getElementById("color").onchange = (event) => updateColor(event);
    selectShape(0);

    // Get WebGL context
    gl = canvas.getContext("webgl");

    // create and use a GLSL program
    const program = webglUtils.createProgramFromScripts(
        gl,
        "#vertex-shader-2d",
        "#fragment-shader-2d",
    );
    gl.useProgram(program);

    // get reference to GLSL attributes and uniforms
    attributeCoords = gl.getAttribLocation(program, "a_coords");
    uniformMatrix = gl.getUniformLocation(program, "u_matrix");
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

/**
 * Renders the array of shapes onto the WebGL canvas.
 */
const render = () => {
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferCoords);
    gl.vertexAttribPointer(attributeCoords, 2, gl.FLOAT, false, 0, 0);

    const $shapeList = $("#object-list");
    $shapeList.empty();

    if (shapes.length === 0) {
        gl.drawArrays(gl.TRIANGLES, 0, 0);
    } else {
        shapes.forEach((shape, index) => {
            const $li = $(`
                <li>
                    <button onclick="deleteShape(${index})" title="Delete Shape">
                        Delete
                    </button>

                    <label>
                        <input
                            type="radio"
                            id="${shape.type}-${index}"
                            name="shape-index"
                            ${index === selectedShapeIndex ? "checked" : ""}
                            onclick="selectShape(${index})"
                            value="${index}"
                        />
                        ${shape.type};
                        X: ${shape.translation.x};
                        Y: ${shape.translation.y}
                    </label>
                </li>
            `);
            $shapeList.append($li);

            gl.uniform4f(uniformColor, shape.color.red, shape.color.green, shape.color.blue, 1);

            // compute transformation matrix
            let matrix = m3.projection(gl.canvas.clientWidth, gl.canvas.clientHeight);
            matrix = m3.translate(matrix, shape.translation.x, shape.translation.y);
            matrix = m3.rotate(matrix, shape.rotation.z);
            matrix = m3.scale(matrix, shape.scale.x, shape.scale.y);

            // apply transformation matrix.
            gl.uniformMatrix3fv(uniformMatrix, false, matrix);

            if (shape.type === RECTANGLE) {
                renderRectangle(shape);
            } else if (shape.type === TRIANGLE) {
                renderTriangle(shape);
            } else if (shape.type === CIRCLE) {
                renderCircle(shape);
            } else if (shape.type === STAR) {
                renderStar(shape);
            }
        });
    }
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
 * @param {Shape} circle
 * @param {Number=} precision
 */
const renderCircle = (circle, precision = 30) => {
    const TWO_PI = Math.PI * 2;

    const points = [];
    for (let count = 0; count < precision; count++) {
        const angle1 = (count / precision) * TWO_PI;
        const angle2 = ((count + 1) / precision) * TWO_PI;
        let x1 = circle.center.x;
        let y1 = circle.center.y;
        let x2 = (Math.cos(angle1) * circle.dimensions.width) / 2;
        let y2 = (Math.sin(angle1) * circle.dimensions.height) / 2;
        let x3 = (Math.cos(angle2) * circle.dimensions.width) / 2;
        let y3 = (Math.sin(angle2) * circle.dimensions.height) / 2;
        points.push(x1, y1, x2, y2, x3, y3);
    }

    const float32Array = new Float32Array(points);
    gl.bufferData(gl.ARRAY_BUFFER, float32Array, gl.STATIC_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, precision * 3);
};

/**
 * @param {Shape} star
 */
const renderStar = (star) => {
    const INCREMENT_ANGLE = (72 * Math.PI) / 180;

    const points = [];
    for (let angle = -Math.PI / 2; angle < 1.5 * Math.PI; angle += INCREMENT_ANGLE) {
        const angle1 = angle - INCREMENT_ANGLE / 2;
        const angle2 = angle + INCREMENT_ANGLE / 2;
        let x1 = star.center.x;
        let y1 = star.center.y;
        let x2 = (Math.cos(angle1) * star.dimensions.width) / 3;
        let y2 = (Math.sin(angle1) * star.dimensions.height) / 3;
        let x3 = (Math.cos(angle2) * star.dimensions.width) / 3;
        let y3 = (Math.sin(angle2) * star.dimensions.height) / 3;
        let x4 = (Math.cos(angle) * star.dimensions.width * 2) / 3;
        let y4 = (Math.sin(angle) * star.dimensions.height * 2) / 3;
        points.push(x1, y1, x2, y2, x3, y3, x2, y2, x3, y3, x4, y4);
    }

    const float32Array = new Float32Array(points);
    gl.bufferData(gl.ARRAY_BUFFER, float32Array, gl.STATIC_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, 30);
};

/**
 * Adds an abstract shape to the array of shapes
 * and rerenders the canvas.
 * @param {{x: Number, y: Number}} translation
 * @param {String} type
 */
const addShape = (translation, type) => {
    const colorHex = document.getElementById("color").value;
    const colorRgb = webglUtils.hexToRgb(colorHex);
    let tx = 0;
    let ty = 0;
    if (translation) {
        tx = translation.x;
        ty = translation.y;
    }
    const shape = {
        type: type,
        center: ORIGIN,
        dimensions: UNIT_SIZE,
        color: colorRgb,
        translation: { x: tx, y: ty, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 20, y: 20, z: 20 },
    };
    shapes.push(shape);
    render();
};

/**
 * Removes the shape at the given index from the
 * shapes array and rerenders the canvas.
 * @param {Number} shapeIndex
 */
const deleteShape = (shapeIndex) => {
    shapes.splice(shapeIndex, 1);
    render();
};

/**
 * Selects the shape at the given index by
 * updating and filling all the input values.
 * @param {Number} selectedIndex
 */
const selectShape = (selectedIndex) => {
    selectedShapeIndex = selectedIndex;
    document.getElementById("tx").value = shapes[selectedIndex].translation.x;
    document.getElementById("ty").value = shapes[selectedIndex].translation.y;
    document.getElementById("sx").value = shapes[selectedIndex].scale.x;
    document.getElementById("sy").value = shapes[selectedIndex].scale.y;
    document.getElementById("rz").value = shapes[selectedIndex].rotation.z;
    const hexColor = webglUtils.rgbToHex(shapes[selectedIndex].color);
    document.getElementById("color").value = hexColor;
};
