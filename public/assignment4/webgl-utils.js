/**
 * @typedef RGBColor
 * @property {Number} red
 * @property {Number} green
 * @property {Number} blue
 */

const webglUtils = {
    /**
     * Converts a hex color to its rgb representation.
     * @param {String} hex The hexadecimal representation of a color
     * @returns {RGBColor}
     */
    hexToRgb: (hex) => {
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
    },
    /**
     * Creates a program from given shader scripts.
     * @param {WebGLRenderingContext} gl
     * @param {String} vertexShaderElementId
     * @param {String} fragmentShaderElementId
     * @returns {WebGLProgram}
     */
    createProgramFromScripts: (gl, vertexShaderElementId, fragmentShaderElementId) => {
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
    },
    /**
     * Return the hex digits of a decimal number
     * @param {Number} c
     * @returns {String}
     */
    componentToHex: (c) => {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    },
    /**
     * Converts a RGB color to its Hex equivalent.
     * @param {RGBColor} rgb
     * @returns {String}
     */
    rgbToHex: (rgb) => {
        const redHex = webglUtils.componentToHex(rgb.red * 256);
        const greenHex = webglUtils.componentToHex(rgb.green * 256);
        const blueHex = webglUtils.componentToHex(rgb.blue * 256);
        return `#${redHex}${greenHex}${blueHex}`;
    },
    /**
     * Toggles the canvas's "look at" strategy an rerenders.
     * @param {InputEvent} event
     */
    toggleLookAt: (event) => {
        lookAt = event.target.checked;
        render();
    },
    /**
     * Updates the given "look at" axis position and rerenders.
     * @param {InputEvent} event
     */
    updateLookAtTranslation: (event, index) => {
        target[index] = Number(event.target.value);
        render();
    },
    /**
     * Updates the given camera axis position and rerenders.
     * @param {InputEvent} event
     */
    updateCameraTranslation: (event, axis) => {
        camera.translation[axis] = Number(event.target.value);
        render();
    },
    /**
     * Updates the given camera axis rotation and rerenders.
     * @param {InputEvent} event
     */
    updateCameraRotation: (event, axis) => {
        camera.rotation[axis] = Number(event.target.value);
        render();
    },
};
