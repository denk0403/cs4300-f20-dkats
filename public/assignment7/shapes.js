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
const LETTER_F = "LETTER_F";

const ORIGIN = { x: 0, y: 0, z: 0 };
const UNIT_SIZE = { width: 1, height: 1, depth: 1 };

// Camera constants and values
const camera = {
    translation: { x: -45, y: -10, z: -35 },
    rotation: { x: 40, y: 235, z: 0 },
};

// Light Source constants
const lightSource = [0.4, 0.3, 0.5];

/**
 * @type {Shape[]}
 */
const shapes = [
    // {
    //     type: RECTANGLE,
    //     center: ORIGIN,
    //     dimensions: { ...UNIT_SIZE },
    //     color: { ...BLUE_RGB },
    //     translation: { x: -15, y: 0, z: -20 },
    //     rotation: { x: 0, y: 0, z: 0 },
    //     scale: { x: 10, y: 10, z: 10 },
    // },
    // {
    //     type: TRIANGLE,
    //     center: ORIGIN,
    //     dimensions: { ...UNIT_SIZE },
    //     color: { ...RED_RGB },
    //     translation: { x: 15, y: 0, z: -20 },
    //     scale: { x: 10, y: 10, z: 10 },
    //     rotation: { x: 0, y: 0, z: 180 },
    // },
    {
        type: CUBE,
        center: ORIGIN,
        dimensions: { ...UNIT_SIZE },
        color: { ...GREEN_RGB },
        translation: { x: 20, y: 0, z: 0 },
        scale: { x: 0.5, y: 0.5, z: 0.5 },
        rotation: { x: 0, y: 0, z: 0 },
    },
    {
        type: CUBE,
        center: ORIGIN,
        dimensions: { ...UNIT_SIZE },
        color: { ...BLUE_RGB },
        translation: { x: 0, y: 0, z: 0 },
        scale: { x: 0.5, y: 0.5, z: 0.5 },
        rotation: { x: 0, y: 0, z: 0 },
    },
    {
        type: CUBE,
        center: ORIGIN,
        dimensions: { ...UNIT_SIZE },
        color: { ...RED_RGB },
        translation: { x: -20, y: 0, z: 0 },
        scale: { x: 0.5, y: 0.5, z: 0.5 },
        rotation: { x: 0, y: 0, z: 0 },
    },
    // {
    //     type: LETTER_F,
    //     center: ORIGIN,
    //     dimensions: { ...UNIT_SIZE },
    //     color: { ...BLUE_RGB },
    //     translation: { x: -150, y: 0, z: -360 },
    //     scale: { x: 1, y: 1, z: 1 },
    //     rotation: { x: m4.degToRad(190), y: m4.degToRad(40), z: m4.degToRad(320) },
    // },
    // {
    //     type: LETTER_F,
    //     center: ORIGIN,
    //     dimensions: { ...UNIT_SIZE },
    //     color: { ...RED_RGB },
    //     translation: { x: -100, y: 0, z: -400 },
    //     scale: { x: 1, y: 1, z: 1 },
    //     rotation: { x: m4.degToRad(190), y: m4.degToRad(40), z: m4.degToRad(320) },
    // },
];
