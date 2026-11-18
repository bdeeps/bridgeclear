// The box and its chapters, in reading order.
import forces from './forces.js';
import truss from './truss.js';
import arch from './arch.js';
import cables from './cables.js';
import failure from './failure.js';

export const BOX = { slug: 'bridgeclear', title: "BridgeClear" };
export const CHAPTERS = [forces, truss, arch, cables, failure];
