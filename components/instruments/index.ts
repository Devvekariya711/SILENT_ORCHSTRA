/**
 * All Visual Instruments - Index
 * Export all instrument visual components
 */

export { default as PianoVisual } from './PianoVisual';
export { default as DrumVisual } from './DrumVisual';
export { default as GuitarVisual } from './GuitarVisual';
export { default as ThereminVisual } from './ThereminVisual';
export { default as PadsVisual } from './PadsVisual';

// Bass uses guitar visual (same component, different tuning)
export { default as BassVisual } from './GuitarVisual';

// Strings - similar to guitar but with bow visualization
export { default as StringsVisual } from './GuitarVisual';
