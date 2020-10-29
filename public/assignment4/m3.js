const m3 = {
    /**
     * Creates a matrix for projecting a given resolution within the
     * WebGL canvas.
     * @param {Number} width
     * @param {Number} height
     * @returns {Number[]}
     */
    projection: function (width, height) {
        // Note: This matrix flips the Y axis so that 0 is at the top.
        return [2 / width, 0, 0, 0, -2 / height, 0, -1, 1, 1];
    },
    /**
     * Creates a 3x3 identity matrix.
     * @returns {Number[]}
     */
    identity: function () {
        return [1, 0, 0, 0, 1, 0, 0, 0, 1];
    },
    /**
     * Creates a 2D translation matrix.
     * @param {Number} tx The amount to translate horizontally
     * @param {Number} ty The amount to translate vertically
     * @returns {Number[]}
     */
    translation: function (tx, ty) {
        return [1, 0, 0, 0, 1, 0, tx, ty, 1];
    },
    /**
     * Creates a 2D rotation matrix.
     * @param {Number} angleInRadians The angle in radians to rotate
     * @returns {Number[]}
     */
    rotation: function (angleInRadians) {
        var c = Math.cos(angleInRadians);
        var s = Math.sin(angleInRadians);
        return [c, -s, 0, s, c, 0, 0, 0, 1];
    },
    /**
     * Creates a 2D scaling matrix.
     * @param {Number} sx The amount to translate horizontally
     * @param {Number} sy The amount to translate vertically
     * @returns {Number[]}
     */
    scaling: function (sx, sy) {
        return [sx, 0, 0, 0, sy, 0, 0, 0, 1];
    },
    /**
     * Multiplies matrices A and B.
     * @param {Number[]} a Matrix A
     * @param {Number[]} b Matrix B
     * @returns {Number[]} The product BA
     */
    multiply: function (a, b) {
        var a00 = a[0 * 3 + 0];
        var a01 = a[0 * 3 + 1];
        var a02 = a[0 * 3 + 2];
        var a10 = a[1 * 3 + 0];
        var a11 = a[1 * 3 + 1];
        var a12 = a[1 * 3 + 2];
        var a20 = a[2 * 3 + 0];
        var a21 = a[2 * 3 + 1];
        var a22 = a[2 * 3 + 2];
        var b00 = b[0 * 3 + 0];
        var b01 = b[0 * 3 + 1];
        var b02 = b[0 * 3 + 2];
        var b10 = b[1 * 3 + 0];
        var b11 = b[1 * 3 + 1];
        var b12 = b[1 * 3 + 2];
        var b20 = b[2 * 3 + 0];
        var b21 = b[2 * 3 + 1];
        var b22 = b[2 * 3 + 2];
        return [
            b00 * a00 + b01 * a10 + b02 * a20,
            b00 * a01 + b01 * a11 + b02 * a21,
            b00 * a02 + b01 * a12 + b02 * a22,
            b10 * a00 + b11 * a10 + b12 * a20,
            b10 * a01 + b11 * a11 + b12 * a21,
            b10 * a02 + b11 * a12 + b12 * a22,
            b20 * a00 + b21 * a10 + b22 * a20,
            b20 * a01 + b21 * a11 + b22 * a21,
            b20 * a02 + b21 * a12 + b22 * a22,
        ];
    },
    /**
     * Translate the given matrix by the specified coordinates.
     * @param {Number[]} m The matrix
     * @param {Number} tx The amount to translate horizontally
     * @param {Number} ty The amount to translate vertically
     * @returns {Number[]}
     */
    translate: function (m, tx, ty) {
        return m3.multiply(m, m3.translation(tx, ty));
    },
    /**
     * Rotates the coordinates of the given matrix
     * by the specified angle around the origin.
     * @param {Number[]} m The matrix
     * @param {Number} angleInRadians The angle in radians
     * @returns {Number[]}
     */
    rotate: function (m, angleInRadians) {
        return m3.multiply(m, m3.rotation(angleInRadians));
    },
    /**
     * Scales the coordinates of the given matrix
     * by the specified scalars from the origin.
     * @param {Number[]} m The matrix
     * @param {Number} sx The amount to translate horizontally
     * @param {Number} sy The amount to translate vertically
     * @returns {Number[]}
     */
    scale: function (m, sx, sy) {
        return m3.multiply(m, m3.scaling(sx, sy));
    },
};
