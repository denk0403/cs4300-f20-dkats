/**
 * @typedef Shape
 * @property {"RECTANGLE" | "TRIANGLE" | "CIRCLE" | "STAR" | "CUBE"} type
 * @property {{ x: Number, y: Number, z: Number }} center
 * @property {{ width: Number, height: Number }} dimensions
 * @property {RGBColor} color
 * @property {{ x: Number, y: Number, z: Number }} translation
 * @property {{ x: Number, y: Number, z: Number }} rotation
 * @property {{ x: Number, y: Number, z: Number }} scale
 */

const RED_HEX = "#FF0000";
const RED_RGB = webglUtils.hexToRgb(RED_HEX);
const BLUE_HEX = "#0000FF";
const BLUE_RGB = webglUtils.hexToRgb(BLUE_HEX);
const GREEN_HEX = "#00FF00";
const GREEN_RGB = webglUtils.hexToRgb(GREEN_HEX);

// 2D-SHAPES
const RECTANGLE = "RECTANGLE";
const TRIANGLE = "TRIANGLE"; // Isosceles Triangle
const CIRCLE = "CIRCLE";
const STAR = "STAR"; // 5-point Star
// 3D-SHAPES
const CUBE = "CUBE";

const ORIGIN = { x: 0, y: 0, z: 0 };
const UNIT_SIZE = { width: 1, height: 1, depth: 1 };

// Camera constants and values
let camera = {
    translation: { x: -45, y: -35, z: 21 },
    rotation: { x: 40, y: 235, z: 0 },
};
const up = [0, 1, 0]; // declare up to be in +y direction
let target = [0, 0, 0]; // declare the origin as the target we'll look at
let lookAt = true; // we'll toggle lookAt on and off

/**
 * @type {Shape[]}
 */
let shapes = [
    {
        type: RECTANGLE,
        center: ORIGIN,
        dimensions: { ...UNIT_SIZE },
        color: { ...BLUE_RGB },
        translation: { x: -15, y: 0, z: -20 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 10, y: 10, z: 10 },
    },
    {
        type: TRIANGLE,
        center: ORIGIN,
        dimensions: { ...UNIT_SIZE },
        color: { ...RED_RGB },
        translation: { x: 15, y: 0, z: -20 },
        scale: { x: 10, y: 10, z: 10 },
        rotation: { x: 0, y: 0, z: 180 },
    },
    {
        type: CUBE,
        center: ORIGIN,
        dimensions: { ...UNIT_SIZE },
        color: { ...GREEN_RGB },
        translation: { x: -15, y: -15, z: -75 },
        scale: { x: 1, y: 1, z: 1 },
        rotation: { x: 0, y: 45, z: 0 },
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
    const boundingRectangle = gl.canvas.getBoundingClientRect();
    const x = Math.round(event.clientX - boundingRectangle.left - boundingRectangle.width / 2);
    const y = -Math.round(event.clientY - boundingRectangle.top - boundingRectangle.height / 2);
    const translation = { x, y, z: -150 };
    const rotation = { x: 0, y: 0, z: 180 };
    const type = document.querySelector("input[name='shape']:checked").value;
    const shape = {
        translation,
        rotation,
        type,
    };

    addShape(shape, type);
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
    shapes[selectedShapeIndex].rotation[axis] = event.target.value;
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
 * Event handler for field of view updates.
 * @param {InputEvent} event
 */
const updateFieldOfView = (event) => {
    fieldOfViewRadians = m4.degToRad(event.target.value);
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
    document.getElementById("tz").onchange = (event) => updateTranslation(event, "z");
    document.getElementById("sx").onchange = (event) => updateScale(event, "x");
    document.getElementById("sy").onchange = (event) => updateScale(event, "y");
    document.getElementById("sz").onchange = (event) => updateScale(event, "z");
    document.getElementById("rx").onchange = (event) => updateRotation(event, "x");
    document.getElementById("ry").onchange = (event) => updateRotation(event, "y");
    document.getElementById("rz").onchange = (event) => updateRotation(event, "z");
    document.getElementById("fv").onchange = (event) => updateFieldOfView(event);
    document.getElementById("color").onchange = (event) => updateColor(event);

    // Setup camera handlers
    document.getElementById("lookAt").onchange = (event) => {
        webglUtils.toggleLookAt(event);
        if (lookAt) {
            $("#lookAtGroup")
                .find('input[type="number"]')
                .each(function () {
                    this.disabled = false;
                });
            $("#cameraRotationGroup")
                .find('input[type="number"]')
                .each(function () {
                    this.disabled = true;
                });
        } else {
            $("#lookAtGroup")
                .find('input[type="number"]')
                .each(function () {
                    this.disabled = true;
                });
            $("#cameraRotationGroup")
                .find('input[type="number"]')
                .each(function () {
                    this.disabled = false;
                });
        }
    };

    const ctx = document.getElementById("ctx"),
        cty = document.getElementById("cty"),
        ctz = document.getElementById("ctz"),
        crx = document.getElementById("crx"),
        cry = document.getElementById("cry"),
        crz = document.getElementById("crz");

    ctx.onchange = (event) => webglUtils.updateCameraTranslation(event, "x");
    cty.onchange = (event) => webglUtils.updateCameraTranslation(event, "y");
    ctz.onchange = (event) => webglUtils.updateCameraTranslation(event, "z");
    crx.onchange = (event) => webglUtils.updateCameraRotation(event, "x");
    cry.onchange = (event) => webglUtils.updateCameraRotation(event, "y");
    crz.onchange = (event) => webglUtils.updateCameraRotation(event, "z");
    document.getElementById("ltx").onchange = (event) =>
        webglUtils.updateLookAtTranslation(event, 0);
    document.getElementById("lty").onchange = (event) =>
        webglUtils.updateLookAtTranslation(event, 1);
    document.getElementById("ltz").onchange = (event) =>
        webglUtils.updateLookAtTranslation(event, 2);

    document.getElementById("lookAt").checked = lookAt;
    ctx.value = camera.translation.x;
    cty.value = camera.translation.y;
    ctz.value = camera.translation.z;
    crx.value = camera.rotation.x;
    cry.value = camera.rotation.y;
    crz.value = camera.rotation.z;

    // document.getElementById("turnLeft").addEventListener("mousedown", () => {
    //     cry.value = Number(cry.value) + 1;
    //     cry.dispatchEvent(new Event("change"));
    // });
    // document.getElementById("forward").addEventListener("mousedown", () => {
    //     cty.value = Number(cty.value) + 1;
    //     cty.dispatchEvent(new Event("change"));
    // });
    // document.getElementById("turnRight").addEventListener("mousedown", () => {
    //     cry.value = Number(cry.value) - 1;
    //     cry.dispatchEvent(new Event("change"));
    // });
    // document.getElementById("left").addEventListener("mousedown", () => {
    //     ctx.value = Number(ctx.value) - 1;
    //     ctx.dispatchEvent(new Event("change"));
    // });
    // document.getElementById("back").addEventListener("mousedown", () => {
    //     cty.value = Number(cty.value) - 1;
    //     cty.dispatchEvent(new Event("change"));
    // });
    // document.getElementById("right").addEventListener("mousedown", () => {
    //     ctx.value = Number(ctx.value) + 1;
    //     ctx.dispatchEvent(new Event("change"));
    // });

    selectShape(0);

    // Get WebGL context
    gl = canvas.getContext("webgl");

    // create and use a GLSL program
    const program = webglUtils.createProgramFromScripts(
        gl,
        "#vertex-shader-3d",
        "#fragment-shader-3d",
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
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
};

let fieldOfViewRadians = m4.degToRad(60);
/**
 * Helper function for returning the transformation matrix for a given shape.
 * @param {Shape} shape
 * @param {number[]} viewProjectionMatrix
 */
const computeModelViewMatrix = (shape, viewProjectionMatrix) => {
    let M = m4.translate(
        viewProjectionMatrix,
        shape.translation.x,
        shape.translation.y,
        shape.translation.z,
    );
    M = m4.xRotate(M, m4.degToRad(shape.rotation.x));
    M = m4.yRotate(M, m4.degToRad(shape.rotation.y));
    M = m4.zRotate(M, m4.degToRad(shape.rotation.z));
    M = m4.scale(M, shape.scale.x, shape.scale.y, shape.scale.z);
    return M;
};

/**
 * Renders the array of shapes onto the WebGL canvas.
 */
const render = () => {
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferCoords);
    gl.vertexAttribPointer(attributeCoords, 3, gl.FLOAT, false, 0, 0);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 1;
    const zFar = 2000;

    let cameraMatrix = m4.identity();
    if (lookAt) {
        cameraMatrix = m4.translate(
            cameraMatrix,
            camera.translation.x,
            camera.translation.y,
            camera.translation.z,
        );
        const cameraPosition = [cameraMatrix[12], cameraMatrix[13], cameraMatrix[14]];
        cameraMatrix = m4.lookAt(cameraPosition, target, up);
        cameraMatrix = m4.inverse(cameraMatrix);
    } else {
        cameraMatrix = m4.zRotate(cameraMatrix, m4.degToRad(camera.rotation.z));
        cameraMatrix = m4.xRotate(cameraMatrix, m4.degToRad(camera.rotation.x));
        cameraMatrix = m4.yRotate(cameraMatrix, m4.degToRad(camera.rotation.y));
        cameraMatrix = m4.translate(
            cameraMatrix,
            camera.translation.x,
            camera.translation.y,
            camera.translation.z,
        );
    }
    const projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);
    const viewProjectionMatrix = m4.multiply(projectionMatrix, cameraMatrix);

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
                        Y: ${shape.translation.y};
                        Z: ${shape.translation.z}
                    </label>
                </li>
            `);
            $shapeList.append($li);

            gl.uniform4f(uniformColor, shape.color.red, shape.color.green, shape.color.blue, 1);

            const matrix = computeModelViewMatrix(shape, viewProjectionMatrix);

            // apply transformation matrix.
            gl.uniformMatrix4fv(uniformMatrix, false, matrix);

            if (shape.type === RECTANGLE) {
                renderRectangle(shape);
            } else if (shape.type === TRIANGLE) {
                renderTriangle(shape);
            } else if (shape.type === CIRCLE) {
                renderCircle(shape);
            } else if (shape.type === STAR) {
                renderStar(shape);
            } else if (shape.type === CUBE) {
                renderCube(shape);
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
        new Float32Array([x1, y1, 0, x2, y1, 0, x1, y2, 0, x1, y2, 0, x2, y1, 0, x2, y2, 0]),
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

    const float32Array = new Float32Array([x1, y1, 0, x3, y3, 0, x2, y2, 0]);

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
        points.push(x1, y1, 0, x2, y2, 0, x3, y3, 0);
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
        points.push(x1, y1, 0, x2, y2, 0, x3, y3, 0, x2, y2, 0, x4, y4, 0, x3, y3, 0);
    }

    const float32Array = new Float32Array(points);
    gl.bufferData(gl.ARRAY_BUFFER, float32Array, gl.STATIC_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, 30);
};

/**
 * @param {Shape} cube
 */
const renderCube = (cube) => {
    const geometry = [
        0,
        0,
        0,
        0,
        30,
        0,
        30,
        0,
        0,
        0,
        30,
        0,
        30,
        30,
        0,
        30,
        0,
        0,
        0,
        0,
        30,
        30,
        0,
        30,
        0,
        30,
        30,
        0,
        30,
        30,
        30,
        0,
        30,
        30,
        30,
        30,
        0,
        30,
        0,
        0,
        30,
        30,
        30,
        30,
        30,
        0,
        30,
        0,
        30,
        30,
        30,
        30,
        30,
        0,
        0,
        0,
        0,
        30,
        0,
        0,
        30,
        0,
        30,
        0,
        0,
        0,
        30,
        0,
        30,
        0,
        0,
        30,
        0,
        0,
        0,
        0,
        0,
        30,
        0,
        30,
        30,
        0,
        0,
        0,
        0,
        30,
        30,
        0,
        30,
        0,
        30,
        0,
        30,
        30,
        0,
        0,
        30,
        30,
        30,
        30,
        30,
        30,
        30,
        0,
        0,
        30,
        30,
        0,
    ];
    const float32Array = new Float32Array(geometry);
    gl.bufferData(gl.ARRAY_BUFFER, float32Array, gl.STATIC_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, 6 * 6);
};

/**
 * Adds an abstract shape to the array of shapes
 * and rerenders the canvas.
 * @param {Shape} newShape
 * @param {String} type
 */
const addShape = (newShape, type) => {
    const colorHex = document.getElementById("color").value;
    const colorRgb = webglUtils.hexToRgb(colorHex);
    let tx = 0;
    let ty = 0;
    let tz = 0;
    const shape = {
        type: type,
        center: ORIGIN,
        dimensions: UNIT_SIZE,
        color: colorRgb,
        translation: { x: tx, y: ty, z: tz },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 20, y: 20, z: 20 },
    };
    if (newShape) {
        Object.assign(shape, newShape);
    }
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
    document.getElementById("tz").value = shapes[selectedIndex].translation.z;
    document.getElementById("sx").value = shapes[selectedIndex].scale.x;
    document.getElementById("sy").value = shapes[selectedIndex].scale.y;
    document.getElementById("sz").value = shapes[selectedIndex].scale.z;
    document.getElementById("rx").value = shapes[selectedIndex].rotation.x;
    document.getElementById("ry").value = shapes[selectedIndex].rotation.y;
    document.getElementById("rz").value = shapes[selectedIndex].rotation.z;
    document.getElementById("fv").value = m4.radToDeg(fieldOfViewRadians);
    const hexColor = webglUtils.rgbToHex(shapes[selectedIndex].color);
    document.getElementById("color").value = hexColor;
};
