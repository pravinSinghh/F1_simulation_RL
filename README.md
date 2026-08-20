# 🏎️ F1 Simulator — 3D Aerodynamics & Telemetry Platform

[![Live Demo](https://img.shields.io/badge/Live_Demo-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://f1-simulation-wp1q.onrender.com)
[![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

An engineering-grade, real-time Formula 1 digital twin and telemetry comparison platform. The simulator evaluates and compares vehicle dynamics, downforce profiles, tire thermal degradation, and DRS utilization between a **Reinforcement Learning (RL) Autonomous Racing Agent** and a **Baseline Telemetry Model** across 5 championship circuits.

**Live Application URL:** [https://f1-simulation-wp1q.onrender.com](https://f1-simulation-wp1q.onrender.com)

---

## 📑 Table of Contents
- [Key Features](#-key-features)
- [Simulated World Championship Circuits](#-simulated-world-championship-circuits)
- [Intelligent Auto-Director TV Camera Engine](#-intelligent-auto-director-tv-camera-engine)
- [Vehicle Dynamics & Aerodynamic Physics Engine](#-vehicle-dynamics--aerodynamic-physics-engine)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Local Installation & Setup](#-local-installation--setup)
- [Deployment on Render](#-deployment-on-render)
- [Telemetry Metrics & Engineering Reference](#-telemetry-metrics--engineering-reference)

---

## ⚡ Key Features

- **Real-Time 3D WebGL Visualization:**
  - High-precision 3D car models with moving DRS wing flaps, carbon fiber aero vanes, halo structures, and rotating wheels.
  - Realistic trackside elements: kerbs, run-off areas, tire barriers, DRS activation lines, and grandstands.
  - Custom particle engines simulating **underfloor titanium sparks**, **tire lockup smoke**, and **aerodynamic stream ribbons**.

- **Side-by-Side Telemetry Comparison:**
  - Synchronized live tracking between the **RL Agent (Cyan)** and **Baseline Car (Ghost/Red)**.
  - Real-time dials: Speedometer, Gear, RPM Tachometer, Lateral & Longitudinal G-forces, Downforce (kg), and Throttle/Brake pressure.
  - Interactive scrubbing timeline with playback speeds (0.25x, 0.5x, 1x, 2x, 4x) and pause/step capabilities.

- **Multi-Lap Stint Simulation & Degradation:**
  - Full 5-lap tire compound simulation (Soft, Medium, Hard, Wet).
  - Progressive thermal degradation and mechanical grip falloff curves.

- **Post-Race Engineering Debrief & Audit:**
  - Lap time deltas, Sector 1/2/3 split timing, apex speed audits, and AI race engineer strategic recommendations.

---

## 🏁 Simulated World Championship Circuits

| Circuit | Country | Length | Signature Characteristics |
| :--- | :--- | :--- | :--- |
| **Silverstone** | United Kingdom | 5,891 m | High-speed aerodynamic benchmark (Maggotts, Becketts, Chapel, Copse) |
| **Monza** | Italy | 5,793 m | Ultra-low drag "Temple of Speed" (Curva Grande, Parabolica, Ascari) |
| **Spa-Francorchamps** | Belgium | 7,004 m | Severe vertical compression and elevation changes (Eau Rouge, Raidillon, Blanchimont) |
| **Suzuka** | Japan | 5,807 m | High-G technical figure-eight flow and rapid load transitions (S-Curves, 130R) |
| **Monaco** | Monte Carlo | 3,337 m | Tight street circuit demanding maximum mechanical grip (Hairpin, Swimming Pool) |

---

## 🎥 Intelligent Auto-Director TV Camera Engine

The built-in Auto-Director evaluates vehicle telemetry in real time (speed, lateral Gs, heavy braking zones, DRS status) to switch between realistic broadcast television cameras:

| Camera Name | Lens Specs | Telemetry Trigger Condition |
| :--- | :--- | :--- |
| **Speed Trap Telephoto** | 400mm F/2.8 IS | Straightaways with speed > 265 km/h |
| **Apex Kerb Trackside** | 85mm F/1.4 Cine Prime | Corner apex clipping and trail-braking deceleration |
| **Grandstand Tower Pan** | 200mm Broadcast Zoom | Sector transitions and high-elevation pacing |
| **Gyro Heli-Sweep Crane** | 35mm Aerial Cine | High-G continuous sweeper complexes (> 1.8G) |
| **Driver T-Cam Airbox** | 18mm Ultra-Wide Action | Cockpit perspective during rapid gear shifts |
| **Front Nose-Wing Pod** | 24mm Macro Action | Low underfloor Venturi airflow and ground effects |
| **Reverse Battle Pursuit** | 35mm Action Prime | Wheel-to-wheel delta gap analysis |
| **Dynamic Broadcast Chase** | 50mm Broadcast Master | Pacing recovery and standard circuit tracking |

---

## 🔬 Vehicle Dynamics & Aerodynamic Physics Engine

### Downforce Calculation
Aerodynamic downforce is computed dynamically as a function of air density ($\rho$), vehicle frontal surface area ($A$), aerodynamic downforce coefficient ($C_L$), and velocity squared ($v^2$):
$$F_{\text{downforce}} = \frac{1}{2} \cdot \rho \cdot v^2 \cdot C_L \cdot A$$

### DRS (Drag Reduction System)
When passing active DRS detection zones, the rear wing flap angle is flattened, reducing overall drag coefficient ($C_D$) by **~20-25%** and yielding a **12–18 km/h** top-speed advantage on high-speed straights.

### Tire Degradation Model
Tire grip $G(t)$ degrades non-linearly according to compound stiffness ($k_{\text{compound}}$) and accumulated heat friction:
$$G(t) = G_0 \cdot \left(1 - \alpha \cdot \frac{t}{L_{\text{max}}}\right)^{\beta}$$

---

## 🏗️ System Architecture

```
                               +----------------------------------+
                               |        React 18 + TypeScript     |
                               +-----------------+----------------+
                                                 |
               +---------------------------------+---------------------------------+
               |                                                                   |
+--------------v----------------+                                 +----------------v---------------+
|     Three.js WebGL Engine     |                                 |    Physics & Telemetry Engine  |
| - Custom Procedural Geometries|                                 | - Vehicle Longitudinal/Lat Gs  |
| - Realistic PBR Track Textures|                                 | - Aerodynamic Downforce (kg)   |
| - Dynamic Lighting & Shadows  |                                 | - Tire Thermal Degradation     |
| - Spark/Smoke Particle Systems|                                 | - Multi-Lap Stint Delta Matrix |
+--------------+----------------+                                 +----------------+---------------+
               |                                                                   |
               +---------------------------------+---------------------------------+
                                                 |
                               +-----------------v----------------+
                               |    Auto-Director & UI Engine     |
                               | - Broadcast HUD Graphic Overlay  |
                               | - Bento Dashboard Controllers    |
                               | - Debrief & Sector Split Audits  |
                               +----------------------------------+
```

---

## 💻 Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS
- **3D / Graphics:** Three.js (WebGL), Canvas 2D
- **Icons:** Lucide React
- **Build Tool:** Vite (ESBuild)
- **Deployment:** Render (Static Site, Edge CDN)

---

## 🚀 Local Installation & Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **yarn** / **pnpm**

### Step-by-Step Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/<your-username>/f1-telemetry-simulation.git
   cd f1-telemetry-simulation
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Build for production:**
   ```bash
   npm run build
   ```
   The compiled static output will be generated inside the `/dist` directory.

---

## 🌐 Deployment on Render

This project is configured as a standalone, zero-backend React Single-Page Application (SPA) and requires **no environment variables**.

### Deployment Settings:
1. Connect your repository to **[Render](https://render.com/)**.
2. Select **Static Site**.
3. Set the following build settings:
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. Under **Redirects/Rewrites**, add an SPA rewrite rule:
   - **Type:** `Rewrite`
   - **Source:** `/*`
   - **Destination:** `/index.html`

---

## 📊 Telemetry Metrics & Engineering Reference

| Metric | Symbol / Unit | Typical Range | Engineering Relevance |
| :--- | :--- | :--- | :--- |
| **Vehicle Speed** | $v$ (km/h) | 65 – 355 km/h | Top speed efficiency & corner entry velocity |
| **Engine RPM** | $N$ (RPM) | 4,000 – 12,500 RPM | Powertrain power band optimization & shift timing |
| **Downforce** | $F_z$ (kg) | 400 – 2,200 kg | Aerodynamic grip in high-speed direction changes |
| **Lateral Acceleration** | $a_y$ (G) | 0.0 – 5.5 G | Tire adhesion limit during apex cornering |
| **Longitudinal Decel** | $a_x$ (G) | -1.0 – -5.2 G | Carbon-carbon brake disc deceleration threshold |
| **Throttle & Brake** | % (0 - 100) | 0 – 100% | Driver / RL agent pedal overlap & trail-braking |

---

## 📄 License
Distributed under the **MIT License**. Free for educational, research, and non-commercial simulation use.
