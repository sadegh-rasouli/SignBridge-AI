# SignBridge AI — Product Specification (Phase 0)

## 1. Executive Summary

**Product Name:** SignBridge AI  
**Version:** 1.0.0-MVP  
**Classification:** Real-Time AI-Powered Sign Language Accessibility Platform  
**Target Domain:** Real-time sign recognition for a defined vocabulary, translation to text, and synthesis to speech.

SignBridge AI is designed to reduce communication barriers between Deaf / Hard-of-Hearing individuals using sign language and non-signing hearing individuals. Rather than making unsubstantiated claims of "universal sign translation," SignBridge AI establishes an honest, production-quality, modular, and privacy-preserving architecture focused on a verified vocabulary in **American Sign Language (ASL)** with real-time landmark extraction, ML classification, temporal smoothing, sentence construction, and speech synthesis.

---

## 2. Problem Statement & Core Principles

### 2.1 The Problem
Over 70 million deaf people worldwide use sign language as their primary or preferred language. Communication with non-signers in everyday transactional, educational, and social settings often relies on written notes, third-party human interpreters (which may not always be available), or generic gesture tools that suffer from severe latency, privacy violations (uploading raw video streams to external clouds), or unstable frame-by-frame flicker.

### 2.2 Core Product Principles
1. **Honest Scope & Responsible AI:** Do not claim to translate unrestricted natural sign language. Sign languages have rich spatial grammars, non-manual markers (facial expressions, mouthings, body shifts), and dynamic multi-modal temporal dependencies. The MVP explicitly defines its supported ASL vocabulary and operating envelope.
2. **Privacy by Design:** Raw camera video frames are processed entirely client-side using WebAssembly / WebGL landmark extraction. No raw video or identifiable facial imagery is stored or transmitted over the network.
3. **Temporal Stability over Raw Accuracy:** A 98% per-frame classifier is useless if it flickers between predictions 30 times a second. SignBridge AI implements a temporal state machine with confidence thresholds, hysteresis buffers, and gesture cooldowns.
4. **Universal Accessibility:** The user interface adheres to WCAG 2.1 AA standards, supporting full keyboard navigation, ARIA announcements, screen reader compatibility, high-contrast modes, and reduced-motion preferences.

---

## 3. MVP Scope & Target Sign Language

### 3.1 Target Language: American Sign Language (ASL)
- **Selection Rationale:** ASL possesses extensive standardized morphological references, verified landmark datasets, and established linguistic documentation.
- **Scope Limitation:** The MVP covers isolated word-level signs and foundational conversational tokens. It does not claim full ASL sentence-level syntactic inversion or non-manual marker translation.

### 3.2 MVP Supported Vocabulary (12 Core High-Utility Signs)

| Token ID | ASL Sign Gloss | Semantic Function | Handedness / Type | Linguistic Description |
|---|---|---|---|---|
| `HELLO` | Hello / Hi | Greeting | 1-Hand (Dominant) | Flat-B hand starting near temple/forehead, moving outward in a salute-like motion. |
| `THANK_YOU`| Thank You | Politeness | 1-Hand (Dominant) | Flat open-hand starting from chin/lips, moving forward and outward toward recipient. |
| `YES` | Yes | Affirmation | 1-Hand (Dominant) | S-fist bobbing up and down at the wrist (nodding motion). |
| `NO` | No | Negation | 1-Hand (Dominant) | Index and middle fingers snap shut against the thumb. |
| `PLEASE` | Please | Politeness | 1-Hand (Dominant) | Flat-B hand placed over the chest in a circular rubbing motion. |
| `HELP` | Help | Assistance | 2-Hands / 1-Hand Var | Dominant A-fist (thumbs up) resting on non-dominant flat palm, lifted upwards together. |
| `STOP` | Stop | Safety / Halt | 2-Hands / 1-Hand Var | Open flat hand chopped perpendicularly down onto the flat palm of the non-dominant hand. |
| `GOOD` | Good | Evaluation (+) | 1-Hand (Dominant) | Flat hand touches chin, then moves downward into open palm / forward. |
| `BAD` | Bad | Evaluation (-) | 1-Hand (Dominant) | Flat hand touches chin, then turns palm downward with a pushing away motion. |
| `NAME` | Name | Identity | 2-Hands / 1-Hand Var | H-fingers (index and middle extended together) tapped perpendicularly across each other. |
| `ME` | Me / I | 1st Person Index | 1-Hand (Dominant) | Index finger pointing directly to the center of the chest. |
| `YOU` | You | 2nd Person Index | 1-Hand (Dominant) | Index finger pointing directly toward the conversation partner. |

---

## 4. User Journey & Core Features

### 4.1 Real-Time Sign Recognition Flow
1. **Camera Authorization:** User grants webcam permissions via intuitive browser prompt.
2. **Visual Feedback:** Live camera feed renders with optional toggleable 21-point hand landmark skeletal overlays, FPS counter, and detection status indicator.
3. **Inference Pipeline:**
   - Client-side MediaPipe landmark extraction (21 3D coordinates per hand).
   - Invariant geometric coordinate normalization (wrist centering + scale normalization).
   - Neural/ML classification delivering predicted token + confidence distribution.
   - Multi-frame temporal smoothing and gesture debounce filter.
4. **Live Transcript & Sentence Construction:**
   - Stable gesture triggers a token addition to the active sentence builder.
   - Punctuation, capitalization, and formatting applied.
   - Interactive transcript controls: Undo, Delete Word, Clear All, Copy Text, Pause/Resume Stream.
5. **Speech Synthesis (TTS):**
   - Single-click or auto-speak synthesis using native browser SpeechSynthesis API.
   - Selectable natural voices, pitch control, and speed rate modulation.

### 4.2 Future Speech-to-Sign Architecture Experience
- Interactive educational preview illustrating the reverse pipeline:
  `Spoken Voice → Web Speech Recognition → Gloss Tokenizer / Grammar Normalizer → 3D Sign Avatar / Keyframe Animation Renderer`.
- Clearly labeled as an active research & development roadmap module.

---

## 5. Non-Functional Requirements

- **Latency:** End-to-end landmark extraction + classification < 25 ms (maintaining 30+ FPS on modern hardware).
- **Confidence Cutoff:** Minimum threshold default $0.75$ (configurable $0.50 - 0.95$). Below threshold, status displays "Uncertain / Hand not clear".
- **Browser Compatibility:** Chromium 90+, Firefox 95+, Safari 15.4+, Edge 90+ supporting WebGL and MediaDevices API.
- **Accessibility:** Full WCAG 2.1 AA compliance, high color contrast ratios ($\ge 4.5:1$ text, $\ge 3:1$ UI controls), screen-reader friendly live regions (`aria-live="polite"`).

---

## 6. Success Metrics & Validation Strategy

1. **Model Performance:** Test Set Accuracy $\ge 95\%$, Macro F1-Score $\ge 0.94$, per-class precision and recall documented without data leakage.
2. **Inference Stability:** Elimination of rapid flickering and repetition during sustained gestures via state-machine debouncing.
3. **User Experience:** Zero-install instant onboarding via web browser with responsive layout across desktops, tablets, and laptops.
