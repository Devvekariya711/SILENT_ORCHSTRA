# Changelog

All notable changes to Silent Orchestra will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-12

### Added
- 🎹 Interactive SVG instrument visuals for all 7 instruments
  - Piano: Multi-touch 12-key keyboard with press animations
  - Drums: 5-piece kit with physics-based wobble effects
  - Guitar: 6 vibrating strings with realistic physics
  - Theremin: Hexagonal electromagnetic field visualization
  - Synth Pads: 4x4 hexagonal pad grid
  - Bass: String instrument visual (uses Guitar component)
  - Strings: Orchestral strings visual (uses Guitar component)

- 👆 Multi-touch gesture support
  - Simultaneous finger tracking for chords and drum rolls
  - Touch event handling with identifier tracking
  - Support for 10+ simultaneous touch points

- 🎮 Advanced trigger control system (`utils/triggerControl.ts`)
  - Cooldown timers to prevent accidental double-triggers
  - Note retrigger detection for key changes
  - Velocity-based dynamics
  - Frame buffer debouncing

- 🎨 Visual improvements
  - Reduced opacity (70-95%) for better video visibility
  - 3:1 contrast ratio compliance (WCAG standards)
  - 60fps animations using requestAnimationFrame
  - Physics-based effects (wobble, vibration, glow)

- 📚 Tutorial system (`NewTutorial.tsx`)
  - Instrument-specific tutorials
  - Interactive gesture guidance
  - Progress tracking

- 🤖 AI accompaniment system
  - Context-aware harmonic support
  - Gemini AI integration
  - Adaptive musical backing

### Changed
- Enlarged piano visual by 90% for better visibility
- Updated hand gesture detection sensitivity
- Improved spatial audio positioning
- Optimized component structure

### Fixed
- Piano keys now fully visible with stronger colors
- Multi-touch conflicts resolved
- TypeScript compilation errors resolved
- Animation performance optimizations

### Removed
- Old tutorial components (GhostHandGuide, MusicTutorial)
- Unused instructor components (VirtualInstructor, InstructorPoses)
- Duplicate stage implementations (VirtualStage)
- Legacy overlay components (SimpleTutorialOverlay)

## [0.5.0] - 2025-12-05

### Added
- Initial hand tracking with MediaPipe
- Basic 7-instrument support
- Simple visual zones for instruments
- Tone.js audio engine integration
- Multiplayer lobby system
- WebSocket synchronization

### Changed
- Migrated from basic zones to instrument-specific detection

## [0.1.0] - 2025-11-20

### Added
- Project initialization
- Basic React + TypeScript setup
- Vite build configuration
- Initial component structure

---

## Upcoming Features

### Planned for v1.1.0
- [ ] MIDI export functionality
- [ ] Recording and playback
- [ ] Custom sound banks
- [ ] Advanced settings panel
- [ ] Performance analytics

### Planned for v1.2.0
- [ ] Mobile app version
- [ ] Offline mode support
- [ ] Cloud save for recordings
- [ ] Social sharing features
- [ ] Custom themes/skins

### Under Consideration
- Desktop app (Electron)
- VR support
- Collaborative jam sessions
- Music theory education mode
- Integration with DAWs

---

[Unreleased]: https://github.com/YOUR_USERNAME/SILENT_ORCHSTRA/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/YOUR_USERNAME/SILENT_ORCHSTRA/releases/tag/v1.0.0
[0.5.0]: https://github.com/YOUR_USERNAME/SILENT_ORCHSTRA/releases/tag/v0.5.0
[0.1.0]: https://github.com/YOUR_USERNAME/SILENT_ORCHSTRA/releases/tag/v0.1.0
