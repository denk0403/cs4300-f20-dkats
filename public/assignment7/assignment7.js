"use strict";

const up = [0, 1, 0]; // declare up to be in +y direction
let target = [5, 5, 5]; // declare the origin as the target we'll look at
let lookAt = true; // we'll toggle lookAt on and off

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

let attributeNormals; // links to shader's a_normal
let uniformWorldViewProjection; // links to shader's u_worldViewProjection
let uniformWorldInverseTranspose; // links to shader's u_worldInverseTranspose
let uniformReverseLightDirectionLocation; // links to shader's u_reverseLightDirectionLocation
let normalBuffer; // buffer to send normals to GPU

/**
 * Initializes the WebGL canvas and draw initial shapes.
 */
const init = () => {
    // get a reference to the canvas
    const canvas = document.querySelector("#canvas");

    // Setup mouse event handlers
    canvas.addEventListener("mousedown", webglUtils.doMouseDown, false);

    // Setup transformation handlers
    document.getElementById("tx").onchange = (event) => webglUtils.updateTranslation(event, "x");
    document.getElementById("ty").onchange = (event) => webglUtils.updateTranslation(event, "y");
    document.getElementById("tz").onchange = (event) => webglUtils.updateTranslation(event, "z");
    document.getElementById("sx").onchange = (event) => webglUtils.updateScale(event, "x");
    document.getElementById("sy").onchange = (event) => webglUtils.updateScale(event, "y");
    document.getElementById("sz").onchange = (event) => webglUtils.updateScale(event, "z");
    document.getElementById("rx").onchange = (event) => webglUtils.updateRotation(event, "x");
    document.getElementById("ry").onchange = (event) => webglUtils.updateRotation(event, "y");
    document.getElementById("rz").onchange = (event) => webglUtils.updateRotation(event, "z");
    document.getElementById("fv").onchange = (event) => webglUtils.updateFieldOfView(event);
    document.getElementById("color").onchange = (event) => webglUtils.updateColor(event);

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
        crz = document.getElementById("crz"),
        ltx = document.getElementById("ltx"),
        lty = document.getElementById("lty"),
        ltz = document.getElementById("ltz"),
        dlrx = document.getElementById("dlrx"),
        dlry = document.getElementById("dlry"),
        dlrz = document.getElementById("dlrz");

    ctx.onchange = (event) => webglUtils.updateCameraTranslation(event, "x");
    cty.onchange = (event) => webglUtils.updateCameraTranslation(event, "y");
    ctz.onchange = (event) => webglUtils.updateCameraTranslation(event, "z");
    crx.onchange = (event) => webglUtils.updateCameraRotation(event, "x");
    cry.onchange = (event) => webglUtils.updateCameraRotation(event, "y");
    crz.onchange = (event) => webglUtils.updateCameraRotation(event, "z");
    ltx.onchange = (event) => webglUtils.updateLookAtTranslation(event, 0);
    lty.onchange = (event) => webglUtils.updateLookAtTranslation(event, 1);
    ltz.onchange = (event) => webglUtils.updateLookAtTranslation(event, 2);
    dlrx.onchange = (event) => webglUtils.updateLightDirection(event, 0);
    dlry.onchange = (event) => webglUtils.updateLightDirection(event, 1);
    dlrz.onchange = (event) => webglUtils.updateLightDirection(event, 2);

    document.getElementById("lookAt").checked = lookAt;
    ctx.value = camera.translation.x;
    cty.value = camera.translation.y;
    ctz.value = camera.translation.z;
    crx.value = camera.rotation.x;
    cry.value = camera.rotation.y;
    crz.value = camera.rotation.z;
    ltx.value = target[0];
    lty.value = target[1];
    ltz.value = target[2];
    dlrx.value = lightSource[0];
    dlry.value = lightSource[1];
    dlrz.value = lightSource[2];

    // const turnLeftAction = (diff) => {
    //     cry.value = Number(cry.value) + diff;
    //     cry.dispatchEvent(new Event("change"));
    // };
    // const forwardAction = (diff) => {
    //     if (lookAt) {
    //         const { x: cx, y: cy, z: cz } = camera.translation;
    //         const [lx, ly, lz] = target;

    //         const dx = lx - cx,
    //             dy = ly - cy,
    //             dz = lz - cz;
    //         const length = Math.hypot(dx, dy, dz);

    //         const nx = cx + (dx / length) * diff;
    //         const ny = cy + (dy / length) * diff;
    //         const nz = cz + (dz / length) * diff;

    //         ctx.value = nx;
    //         cty.value = ny;
    //         ctz.value = nz;

    //         camera.translation.x = nx;
    //         camera.translation.y = ny;
    //         camera.translation.z = nz;
    //         render();
    //     }
    // };
    // const turnRightAction = (diff) => {
    //     cry.value = Number(cry.value) - diff;
    //     cry.dispatchEvent(new Event("change"));
    // };
    // const leftAction = (diff) => {
    //     if (lookAt) {
    //         const { x: cx, z: cz } = camera.translation;
    //         const [lx, ly, lz] = target;

    //         const rotationAngle = (diff * Math.PI) / 180;
    //         const mat = m3.multiply(
    //             m3.translation(-lx, -lz),
    //             m3.multiply(m3.rotation(rotationAngle), m3.translation(lx, lz)),
    //         );

    //         let result = [];
    //         for (let row = 0; row < 3; row++) {
    //             result.push(mat[row * 3] * cx + mat[row * 3 + 1] * cz + mat[row * 3 + 2] * 1);
    //         }

    //         const nx = mat[0] * cx + mat[1] * cz + mat[2];
    //         const nz = mat[3] * cx + mat[4] * cz + mat[5];

    //         ctx.value = nx;
    //         ctz.value = nz;

    //         camera.translation.x = nx;
    //         camera.translation.z = nz;
    //         render();
    //     }
    // };
    // const backAction = (diff) => {
    //     if (lookAt) {
    //         const { x: cx, y: cy, z: cz } = camera.translation;
    //         const [lx, ly, lz] = target;

    //         const dx = lx - cx,
    //             dy = ly - cy,
    //             dz = lz - cz;
    //         const length = Math.hypot(dx, dy, dz);

    //         const nx = cx + (dx / length) * -diff;
    //         const ny = cy + (dy / length) * -diff;
    //         const nz = cz + (dz / length) * -diff;

    //         ctx.value = nx;
    //         cty.value = ny;
    //         ctz.value = nz;

    //         camera.translation.x = nx;
    //         camera.translation.y = ny;
    //         camera.translation.z = nz;
    //         render();
    //     }
    // };
    // const rightAction = (diff) => {
    //     if (lookAt) {
    //         const { x: cx, y: cy, z: cz } = camera.translation;
    //         const [lx, ly, lz] = target;

    //         const rotationAngle = (-diff * Math.PI) / 180;
    //         const mat = m3.multiply(
    //             m3.translation(-lx, -lz),
    //             m3.multiply(m3.rotation(rotationAngle), m3.translation(lx, lz)),
    //         );

    //         let result = [];
    //         for (let row = 0; row < 3; row++) {
    //             result.push(mat[row * 3] * cx + mat[row * 3 + 1] * cz + mat[row * 3 + 2] * 1);
    //         }

    //         const nx = mat[0] * cx + mat[1] * cz + mat[2];
    //         const nz = mat[3] * cx + mat[4] * cz + mat[5];

    //         ctx.value = nx;
    //         ctz.value = nz;

    //         camera.translation.x = nx;
    //         camera.translation.z = nz;
    //         render();
    //     }
    // };

    // document.getElementById("turnLeft").addEventListener("mousedown", () => turnLeftAction(1));
    // document.getElementById("forward").addEventListener("mousedown", () => forwardAction(1));
    // document.getElementById("turnRight").addEventListener("mousedown", () => turnRightAction(1));
    // document.getElementById("left").addEventListener("mousedown", () => leftAction(1));
    // document.getElementById("back").addEventListener("mousedown", () => backAction(1));
    // document.getElementById("right").addEventListener("mousedown", () => rightAction(1));

    // document.addEventListener("keypress", (keyEvent) => {
    //     const delay = 50;
    //     switch (keyEvent.key) {
    //         case "q":
    //             !lookAt && turnLeftAction(5);
    //             break;
    //         case "w": {
    //             const elt = $("#forward");
    //             elt.addClass("active");
    //             forwardAction(1);
    //             setTimeout(() => elt.removeClass("active"), delay);
    //             break;
    //         }
    //         case "e":
    //             !lookAt && turnRightAction(5);
    //             break;
    //         case "a": {
    //             const elt = $("#left");
    //             elt.addClass("active");
    //             leftAction(5);
    //             setTimeout(() => elt.removeClass("active"), delay);
    //             break;
    //         }
    //         case "s": {
    //             const elt = $("#back");
    //             elt.addClass("active");
    //             backAction(1);
    //             setTimeout(() => elt.removeClass("active"), delay);
    //             break;
    //         }
    //         case "d": {
    //             const elt = $("#right");
    //             elt.addClass("active");
    //             rightAction(5);
    //             setTimeout(() => elt.removeClass("active"), delay);
    //             break;
    //         }
    //     }
    // });

    webglUtils.selectShape(0);

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

    // get the "a_normals" attribute
    attributeNormals = gl.getAttribLocation(program, "a_normals");
    // enable it
    gl.enableVertexAttribArray(attributeNormals);
    // create a buffer to send normals
    normalBuffer = gl.createBuffer();

    // Get various uniforms:
    // u_worldViewProjection
    uniformWorldViewProjection = gl.getUniformLocation(program, "u_worldViewProjection");
    // u_worldInverseTranspose
    uniformWorldInverseTranspose = gl.getUniformLocation(program, "u_worldInverseTranspose");
    // u_reverseLightDirection
    uniformReverseLightDirectionLocation = gl.getUniformLocation(
        program,
        "u_reverseLightDirection",
    );

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

    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.vertexAttribPointer(attributeNormals, 3, gl.FLOAT, false, 0, 0);

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

    const worldMatrix = m4.identity();
    const worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix, worldMatrix);
    const worldInverseMatrix = m4.inverse(worldMatrix);
    const worldInverseTransposeMatrix = m4.transpose(worldInverseMatrix);

    gl.uniformMatrix4fv(uniformWorldViewProjection, false, worldViewProjectionMatrix);
    gl.uniformMatrix4fv(uniformWorldInverseTranspose, false, worldInverseTransposeMatrix);

    gl.uniform3fv(uniformReverseLightDirectionLocation, m4.normalize(lightSource));

    const $shapeList = $("#object-list");
    $shapeList.empty();

    if (shapes.length === 0) {
        gl.drawArrays(gl.TRIANGLES, 0, 0);
    } else {
        shapes.forEach((shape, index) => {
            const $li = $(`
                <li>
                    <button onclick="webglUtils.deleteShape(${index})" title="Delete Shape">
                        Delete
                    </button>

                    <label>
                        <input
                            type="radio"
                            id="${shape.type}-${index}"
                            name="shape-index"
                            ${index === selectedShapeIndex ? "checked" : ""}
                            onclick="webglUtils.selectShape(${index})"
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

            const matrix = computeModelViewMatrix(shape, worldViewProjectionMatrix);

            // apply transformation matrix.
            gl.uniformMatrix4fv(uniformWorldViewProjection, false, matrix);

            if (shape.type === RECTANGLE) {
                webglUtils.renderRectangle(shape);
            } else if (shape.type === TRIANGLE) {
                webglUtils.renderTriangle(shape);
            } else if (shape.type === CIRCLE) {
                webglUtils.renderCircle(shape);
            } else if (shape.type === STAR) {
                webglUtils.renderStar(shape);
            } else if (shape.type === CUBE) {
                webglUtils.renderCube(shape);
            }
        });
    }
};

let animation;
const startAnimation = () => {
    animation = setInterval(() => {
        ctx.value = Number(ctx.value) + 1;
        if (ctx.value > 160) ctx.value = -160;
        ctx.dispatchEvent(new Event("change"));
        render();
    }, 17);
};

const stopAnimation = () => {
    clearInterval(animation);
};
