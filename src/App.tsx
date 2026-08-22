import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { CameraMode, SyncMode, TelemetryPoint, TrackId, WeatherConditionId, StintLengthOption } from './types';
import { generateLapSimulations, generateStintEvaluation } from './physics/carSimulation';
import { TRACKS_DATA, WEATHER_CONDITIONS, getTrackCurve } from './physics/f1Track';
import { F1Scene } from './components/F1Scene';
import { TelemetryHUD } from './components/TelemetryHUD';
import { ComparisonHeader } from './components/ComparisonHeader';
import { PlaybackControls } from './components/PlaybackControls';
import { RLComponentInspector } from './components/RLComponentInspector';
import { TelemetryGraphModal } from './components/TelemetryGraphModal';
import { StintEvaluationModal } from './components/StintEvaluationModal';
import { f1Audio } from './audio/f1Audio';

export default function App() {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0.08); // Start entering Turn 1
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [cameraMode, setCameraMode] = useState<CameraMode>('director'); // Auto-Director dynamic broadcast TV camera
  const [syncMode, setSyncMode] = useState<SyncMode>('time'); // Live race mode
  const [showAeroFlow, setShowAeroFlow] = useState<boolean>(true);
  const [showRacingLines, setShowRacingLines] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [useMph, setUseMph] = useState<boolean>(false);

  // Multi-Track and Seasonal Environmental Weather States
  const [trackId, setTrackId] = useState<TrackId>('silverstone');
  const [weatherId, setWeatherId] = useState<WeatherConditionId>('dry');

  // Multi-Lap Fixed Stint Evaluation States (5 / 10 / 20 laps)
  const [targetLaps, setTargetLaps] = useState<StintLengthOption>(5);
  const [currentLap, setCurrentLap] = useState<number>(1);

  // Modals
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [isTelemetryGraphOpen, setIsTelemetryGraphOpen] = useState<boolean>(false);
  const [isStintEvaluationOpen, setIsStintEvaluationOpen] = useState<boolean>(false);

  const reqAnimRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Dynamic simulation data computed for the active track and weather
  const simulationData = useMemo(() => {
    return generateLapSimulations(trackId, weatherId);
  }, [trackId, weatherId]);

  // Full multi-lap stint evaluation report
  const stintReport = useMemo(() => {
    return generateStintEvaluation(trackId, weatherId, targetLaps);
  }, [trackId, weatherId, targetLaps]);

  const activeTrack = TRACKS_DATA[trackId] || TRACKS_DATA.silverstone;
  const activeWeather = WEATHER_CONDITIONS[weatherId] || WEATHER_CONDITIONS.dry;
  const trackCurveData = getTrackCurve(trackId);

  const basePoints = simulationData.baselineTelemetry;
  const rlPoints = simulationData.rlTelemetry;
  const lapSummary = simulationData.lapSummary;
  const totalPoints = basePoints.length;

  // In 'time' sync mode: both cars run on common lap elapsed time.
  // In 'distance' sync mode: both cars are sampled at the exact same track coordinate.
  const currentTime = progress * lapSummary.lapTimeRL;

  let currentBaseTelemetry: TelemetryPoint;
  let currentRLTelemetry: TelemetryPoint;

  if (syncMode === 'time') {
    // Lookup RL point by current time
    const rlIdx = Math.min(
      totalPoints - 1,
      Math.max(0, Math.floor(progress * totalPoints))
    );
    currentRLTelemetry = rlPoints[rlIdx] || rlPoints[0];

    // Lookup Baseline point at that same elapsed time
    let baseIdx = basePoints.findIndex((pt) => pt.time >= currentTime);
    if (baseIdx === -1) baseIdx = totalPoints - 1;
    currentBaseTelemetry = basePoints[baseIdx] || basePoints[0];
  } else {
    // Distance sync
    const activeIndex = Math.min(
      totalPoints - 1,
      Math.max(0, Math.floor(progress * totalPoints))
    );
    currentBaseTelemetry = basePoints[activeIndex] || basePoints[0];
    currentRLTelemetry = rlPoints[activeIndex] || rlPoints[0];
  }

  // Identify current corner or track segment
  const currentDist = currentRLTelemetry.distance;
  let currentCornerName = `${activeTrack.name} (Sector 1)`;
  for (let i = activeTrack.corners.length - 1; i >= 0; i--) {
    if (currentDist >= activeTrack.corners[i].distance - 40) {
      currentCornerName = activeTrack.corners[i].name;
      break;
    }
  }

  // Animation Loop with Multi-Lap Stint Progression
  const animate = useCallback(
    (time: number) => {
      if (lastTimeRef.current !== null && isPlaying) {
        const deltaSeconds = (time - lastTimeRef.current) / 1000;
        const lapDuration = lapSummary.lapTimeRL;
        const progressIncrement = (deltaSeconds / Math.max(1, lapDuration)) * playbackSpeed;

        setProgress((prev) => {
          const next = prev + progressIncrement;
          if (next >= 1) {
            // Lap complete!
            setCurrentLap((prevLap) => {
              const nextLap = prevLap + 1;
              if (nextLap > targetLaps) {
                // Completed the fixed stint! Show Evaluation Modal
                setIsStintEvaluationOpen(true);
                return 1;
              }
              return nextLap;
            });
            return 0;
          }
          return next;
        });
      }
      lastTimeRef.current = time;
      reqAnimRef.current = requestAnimationFrame(animate);
    },
    [isPlaying, playbackSpeed, lapSummary.lapTimeRL, targetLaps]
  );

  useEffect(() => {
    reqAnimRef.current = requestAnimationFrame(animate);
    return () => {
      if (reqAnimRef.current) cancelAnimationFrame(reqAnimRef.current);
    };
  }, [animate]);

  // Audio update sync
  useEffect(() => {
    if (!isMuted) {
      f1Audio.updateTelemetry(
        currentBaseTelemetry.rpm,
        currentBaseTelemetry.throttle,
        currentBaseTelemetry.brake,
        currentRLTelemetry.rpm,
        currentRLTelemetry.throttle,
        currentRLTelemetry.brake,
        Math.max(Math.abs(currentBaseTelemetry.lateralG), Math.abs(currentRLTelemetry.lateralG))
      );
    }
  }, [currentBaseTelemetry, currentRLTelemetry, isMuted]);

  const handleToggleMute = () => {
    f1Audio.init();
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    f1Audio.setMuted(nextMute);
  };

  const handleSeek = (newProgress: number) => {
    setProgress(Math.max(0, Math.min(1, newProgress)));
  };

  const handleReset = () => {
    setProgress(0);
    setCurrentLap(1);
  };

  const handleTrackChange = (newTrackId: TrackId) => {
    setTrackId(newTrackId);
    setProgress(0.04);
    setCurrentLap(1);
  };

  const handleWeatherChange = (newWeatherId: WeatherConditionId) => {
    setWeatherId(newWeatherId);
  };

  const handleChangeTargetLaps = (newLaps: StintLengthOption) => {
    setTargetLaps(newLaps);
    setCurrentLap(1);
    setProgress(0);
  };

  const handleRestartStint = () => {
    setCurrentLap(1);
    setProgress(0);
    setIsPlaying(true);
    setIsStintEvaluationOpen(false);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-100 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 text-slate-900 overflow-hidden font-sans select-none p-1 sm:p-2 gap-1.5">
      {/* 1. Bento Comparison & Track / Seasonal Weather Header */}
      <ComparisonHeader
        currentTrackId={trackId}
        onChangeTrack={handleTrackChange}
        currentWeatherId={weatherId}
        onChangeWeather={handleWeatherChange}
        baseTelemetry={currentBaseTelemetry}
        rlTelemetry={currentRLTelemetry}
        lapSummary={lapSummary}
        progress={progress}
        currentLap={currentLap}
        targetLaps={targetLaps}
        onChangeTargetLaps={handleChangeTargetLaps}
        onOpenInspector={() => setIsInspectorOpen(true)}
        onOpenTelemetryGraph={() => setIsTelemetryGraphOpen(true)}
        onOpenStintEvaluation={() => setIsStintEvaluationOpen(true)}
      />

      {/* 2. Bento Framed Single-Screen 3D Racing Viewport */}
      <main className="relative flex-1 w-full max-w-7xl mx-auto h-full min-h-0 rounded-2xl overflow-hidden border border-slate-200/90 bg-slate-100 shadow-md">
        {/* Three.js Canvas Container */}
        <F1Scene
          trackId={trackId}
          weatherId={weatherId}
          cameraMode={cameraMode}
          syncMode={syncMode}
          baseTelemetry={currentBaseTelemetry}
          rlTelemetry={currentRLTelemetry}
          timeProgress={progress}
          isGhostOverlay={false}
          showAeroFlow={showAeroFlow}
          showRacingLines={showRacingLines}
        />

        {/* Unified Single-Screen Telemetry Comparison HUD */}
        <TelemetryHUD
          baseTelemetry={currentBaseTelemetry}
          rlTelemetry={currentRLTelemetry}
          deltaSeconds={currentRLTelemetry.time - currentBaseTelemetry.time}
          useMph={useMph}
          currentCornerName={currentCornerName}
          currentLap={currentLap}
          targetLaps={targetLaps}
        />
      </main>

      {/* 3. Bento Interactive Playback Scrubber, Camera Angles & Controls Bar */}
      <PlaybackControls
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onReset={handleReset}
        progress={progress}
        onSeek={handleSeek}
        playbackSpeed={playbackSpeed}
        onChangeSpeed={setPlaybackSpeed}
        cameraMode={cameraMode}
        onChangeCameraMode={(mode) => setCameraMode(mode)}
        syncMode={syncMode}
        onToggleSyncMode={() => setSyncMode(syncMode === 'time' ? 'distance' : 'time')}
        showAeroFlow={showAeroFlow}
        onToggleAeroFlow={() => setShowAeroFlow(!showAeroFlow)}
        showRacingLines={showRacingLines}
        onToggleRacingLines={() => setShowRacingLines(!showRacingLines)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        useMph={useMph}
        onToggleUnit={() => setUseMph(!useMph)}
        currentTimeSeconds={currentRLTelemetry.time}
        totalLapTimeSeconds={lapSummary.lapTimeRL}
        currentCornerName={currentCornerName}
        sectors={activeTrack.sectors}
        totalTrackLength={trackCurveData.totalLength}
      />

      {/* 4. RL Component Inspector Modal */}
      <RLComponentInspector
        lapSummary={lapSummary}
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
      />

      {/* 5. Lap Telemetry Trace Chart Modal */}
      <TelemetryGraphModal
        isOpen={isTelemetryGraphOpen}
        onClose={() => setIsTelemetryGraphOpen(false)}
        currentProgress={progress}
        onSeek={handleSeek}
        baselineTelemetry={basePoints}
        rlTelemetry={rlPoints}
        activeTrack={activeTrack}
        activeWeather={activeWeather}
      />

      {/* 6. Grand Prix Evaluation & Multi-Lap Stint Report Modal */}
      <StintEvaluationModal
        isOpen={isStintEvaluationOpen}
        onClose={() => setIsStintEvaluationOpen(false)}
        report={stintReport}
        targetLaps={targetLaps}
        onChangeTargetLaps={handleChangeTargetLaps}
        onRestartStint={handleRestartStint}
        activeTrack={activeTrack}
        activeWeather={activeWeather}
      />
    </div>
  );
}
