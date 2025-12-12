# Silent Orchestra 🎵✋

**AI-Powered Gesture Music Performance Platform**

Transform your hand gestures into symphonic music using computer vision and AI. No instruments required - just your hands and a camera!

[![Live Demo](https://img.shields.io/badge/Live-Demo-blue)](https://silent-orchestra.vercel.app)
[![Hackathon](https://img.shields.io/badge/Google-Gemini%20Hackathon-orange)](https://www.kaggle.com/competitions/gemini-3)

## 🎯 What is Silent Orchestra?

Silent Orchestra revolutionizes music creation by translating hand movements into real-time musical performances. Built for accessibility and creative expression, it enables anyone to become a musician instantly.

### ✨ Features

- **7 Virtual Instruments**: Piano, Drums, Guitar, Bass, Theremin, Strings, Synth Pads
- **Multi-Touch Gestures**: Play chords and complex rhythms with multiple fingers
- **Physics-Based Visuals**: Interactive SVG instruments with wobble, vibration, and glow effects
- **AI Accompaniment**: Context-aware harmonic support powered by Gemini AI
- **Spatial Audio**: 3D sound positioning based on hand location
- **Real-Time Hand Tracking**: MediaPipe Hands for precise gesture detection

## 🚀 Live Demo

**Try it now:** [https://silent-orchestra.vercel.app](https://silent-orchestra.vercel.app)

**Demo Video:** [Watch 2-min demo](YOUR_YOUTUBE_LINK_HERE)

## 🎮 How to Play

1. **Select an Instrument** - Choose from 7 virtual instruments
2. **Allow Camera Access** - Enable your webcam for hand tracking
3. **Start Playing!** - Move your hands to create music:
   - 🎹 **Piano**: Tap fingers for keys, play chords
   - 🥁 **Drums**: Hit different zones (hi-hat, snare, kick)
   - 🎸 **Guitar**: Strum across strings
   - 🎺 **Theremin**: Move hands for pitch/volume control

## 🏆 Hackathon Submission

**Google DeepMind - Vibe Code with Gemini 3 Pro in AI Studio**

### Track: Overall Track

### Innovation Highlights

1. **Multimodal AI Integration**
   - MediaPipe vision for gesture recognition
   - Gemini AI for intelligent musical accompaniment
   - Tone.js for professional audio synthesis

2. **Accessibility Impact**
   - Zero learning curve - instant music creation
   - Enables music for people with motor disabilities
   - Free and browser-based - no apps to install

3. **Technical Excellence**
   - 60fps animations with physics-based effects
   - Multi-touch support (10+ simultaneous fingers)
   - Advanced trigger system with cooldown timers
   - Spatial audio with real-time positioning

## 🛠️ Technology Stack

- **Frontend**: React + TypeScript
- **Hand Tracking**: MediaPipe Hands
- **Audio Engine**: Tone.js
- **Visuals**: SVG with physics animations
- **AI**: Gemini integration for accompaniment
- **Deployment**: Vercel

## 📊 Technical Architecture

```
┌─────────────────────────────────────────┐
│   Browser (Camera + Audio)             │
├─────────────────────────────────────────┤
│   MediaPipe Hands                       │
│   ↓ (21 landmarks per hand)            │
├─────────────────────────────────────────┤
│   Gesture Detection                     │
│   - Velocity calculation                │
│   - Trigger control                     │
│   - Multi-touch tracking                │
├─────────────────────────────────────────┤
│   Audio Engine (Tone.js)                │
│   - 7 Synth types                       │
│   - Spatial audio                       │
│   - ADSR envelopes                      │
├─────────────────────────────────────────┤
│   Visual Renderer (SVG)                 │
│   - 60fps animations                    │
│   - Physics simulations                 │
│   - Multi-touch feedback                │
└─────────────────────────────────────────┘
```

## 🎨 Instruments Gallery

### Piano
- 7 white keys + 5 black keys
- Multi-touch chord support
- 3D press animations
- Velocity-sensitive

### Drums
- 5-piece kit (hi-hat, snare, tom, crash, kick)
- Wobble physics on hit
- Zone-based detection
- Simultaneous multi-drum hits

### Guitar
- 6 vibrating strings
- Realistic acoustic body
- String vibration physics
- Strum detection

### Theremin
- Hexagonal electromagnetic field
- Glowing hand tracker
- Pitch control (Y-axis)
- Volume control (X-axis)

### Synth Pads
- 4x4 hexagonal grid (16 pads)
- Distinct colors per pad
- Press animations
- Pulse effects

## 📈 Impact Areas

### Education
- Interactive music theory learning
- Rhythm training
- Instrument familiarization

### Accessibility
- Music creation for motor disabilities
- No physical instruments needed
- Visual and audio feedback

### Therapy
- Physical rehabilitation through gesture
- Cognitive engagement
- Stress relief and creative expression

### Entertainment
- Instant music creation
- Multiplayer jam sessions
- Creative performance tool

## 🚀 Getting Started Locally

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/SILENT_ORCHSTRA.git
cd SILENT_ORCHSTRA

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

## 📝 Project Structure

```
SILENT_ORCHSTRA/
├── components/
│   ├── instruments/        # SVG visual components
│   │   ├── PianoVisual.tsx
│   │   ├── DrumVisual.tsx
│   │   ├── GuitarVisual.tsx
│   │   ├── ThereminVisual.tsx
│   │   └── PadsVisual.tsx
│   ├── Stage.tsx          # Main performance stage
│   ├── Lobby.tsx          # Instrument selection
│   └── NewTutorial.tsx    # Interactive tutorial
├── utils/
│   ├── audio.ts           # Tone.js audio engine
│   ├── handsGestures.ts   # MediaPipe integration
│   ├── instrumentGestures.ts  # Gesture detection
│   └── triggerControl.ts  # Advanced trigger system
└── types.ts               # TypeScript definitions
```

## 🎥 Demo Video

[**Watch the 2-minute demo →**](YOUR_YOUTUBE_LINK)

Showcases:
- Real-time gesture detection
- All 7 instruments in action
- Multi-touch capabilities
- AI accompaniment
- Visual feedback system

## 🏅 Awards & Recognition

**Google DeepMind Gemini 3 Hackathon 2025**
- Category: Overall Track
- Built with: Gemini AI + MediaPipe + Tone.js

## 🤝 Contributing

Contributions welcome! Areas for improvement:
- Additional instruments
- MIDI export functionality
- Recording and playback
- Multiplayer networking
- Mobile app version

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- Google DeepMind for Gemini AI
- MediaPipe team for hand tracking
- Tone.js community for audio engine
- Hexpress for visual inspiration

## 📞 Contact

**Developer**: [Your Name]
**Email**: your.email@example.com
**Twitter**: @yourhandle

---

**Built with ❤️ for the Google DeepMind Gemini 3 Hackathon**

*Making music creation accessible, joyful, and instant for everyone.*
