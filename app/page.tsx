"use client";

import type { Window as TauriWindow } from "@tauri-apps/api/window";

import React, { useState, useEffect, useRef } from "react";
import { Card, Button } from "@heroui/react";

import tomatoIcon from "../src-tauri/icons/icon.png";
import pinOn from "../src-tauri/icons/pin-on.png";
import pinOff from "../src-tauri/icons/pin-off.png";
import eyeOff from "../src-tauri/icons/eye-off.png";

type TauriEventModule = typeof import("@tauri-apps/api/event");

const DEFAULT_MINUTES = 25;
const DEFAULT_OPACITY = 0.95;
const ALARM_SOUND = "./sounds/audioclubz-audio-club-amapiano-319840.mp3";

export default function PomodoroWidget() {
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_MINUTES * 60);
  const [isActive, setIsActive] = useState(false);
  const [isAlarming, setIsAlarming] = useState(false);
  const [opacity, setOpacity] = useState(DEFAULT_OPACITY);
  const [isPinned, setIsPinned] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const tauriEventRef = useRef<TauriEventModule | null>(null);
  const tauriWindowRef = useRef<TauriWindow | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Beim Start: Alarm-Sound laden und Tauri-APIs nachladen
  // (dynamischer Import, weil die Seite beim Build ohne Fenster gerendert wird)
  useEffect(() => {
    audioRef.current = new Audio(ALARM_SOUND);
    if (audioRef.current) audioRef.current.loop = true;

    import("@tauri-apps/api/event").then((mod) => {
      tauriEventRef.current = mod;
    });
    import("@tauri-apps/api/window").then((mod) => {
      tauriWindowRef.current = mod.getCurrentWindow();
    });

    return () => {
      if (audioRef.current) audioRef.current.pause();
      if (fadeRef.current) clearInterval(fadeRef.current);
    };
  }, []);

  // Timer: jede Sekunde runterzählen, bei 0 Alarm auslösen
  useEffect(() => {
    if (isActive && secondsLeft > 0) {
      timerRef.current = setInterval(
        () => setSecondsLeft((prev) => prev - 1),
        1000,
      );
    } else if (secondsLeft === 0 && isActive) {
      setIsActive(false);
      setIsAlarming(true);

      if (audioRef.current) audioRef.current.play().catch(() => {});
      if (timerRef.current) clearInterval(timerRef.current);

      setOpacity(0);

      if (tauriEventRef.current) {
        tauriEventRef.current.emit("alarm-triggered");
      }

      // Fenster langsam wieder einblenden
      let currentOp = 0;

      if (fadeRef.current) clearInterval(fadeRef.current);
      fadeRef.current = setInterval(() => {
        currentOp += 0.05;
        if (currentOp >= DEFAULT_OPACITY) {
          currentOp = DEFAULT_OPACITY;
          if (fadeRef.current) clearInterval(fadeRef.current);
          fadeRef.current = null;
        }
        setOpacity(currentOp);
      }, 150);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, secondsLeft]);

  const stopAlarm = () => {
    if (isAlarming) {
      setIsAlarming(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setOpacity(DEFAULT_OPACITY);
    }
  };

  // Mausrad ändert die Deckkraft des Widgets
  const handleWheel = (e: React.WheelEvent) => {
    let nextOpacity = opacity + (e.deltaY > 0 ? -0.1 : 0.1);

    nextOpacity = Math.min(1.0, Math.max(0.1, nextOpacity));
    setOpacity(nextOpacity);
  };

  const hideToTray = async () => {
    if (tauriWindowRef.current) {
      await tauriWindowRef.current.hide();
    }
  };

  const setTimerMinutes = (minutes: number) => {
    if (isActive) return;
    stopAlarm();
    setSecondsLeft(minutes * 60);
  };

  return (
    <div
      className="flex h-screen w-screen items-center justify-center bg-transparent select-none p-2 cursor-default"
      data-tauri-drag-region={!isPinned ? true : undefined}
      onContextMenu={(e) => e.preventDefault()}
      onWheel={handleWheel}
    >
      <Card
        className="w-full h-full rounded-2xl p-4 flex flex-col items-center justify-between bg-zinc-950 border border-zinc-800 text-white backdrop-blur-md relative transition-opacity duration-300 ease-out cursor-default"
        data-tauri-drag-region={!isPinned ? true : undefined}
        style={{ opacity: opacity }}
      >
        {/* Buttons in den Ecken */}
        <button
          aria-label={isPinned ? "Widget lösen" : "Widget festpinnen"}
          className="absolute top-2 left-2 w-5 h-5 rounded-md flex items-center justify-center border bg-zinc-900 border-zinc-800 hover:border-zinc-700 cursor-pointer transition-colors"
          title={isPinned ? "Widget lösen" : "Widget festpinnen"}
          onClick={() => setIsPinned(!isPinned)}
        >
          <img
            alt=""
            className="w-3.5 h-3.5 object-contain"
            src={isPinned ? pinOn.src : pinOff.src}
          />
        </button>

        <button
          aria-label="In Info-Bereich verstecken"
          className="absolute top-2 right-2 w-5 h-5 rounded-md flex items-center justify-center bg-zinc-900 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-colors"
          title="In Info-Bereich verstecken"
          onClick={hideToTray}
        >
          <img alt="" className="w-3.5 h-3.5 object-contain" src={eyeOff.src} />
        </button>

        {/* Kopfbereich */}
        {/* Klick auf Kopf oder Zeit stoppt den Alarm (Start/Reset stoppen ihn auch) */}
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
        <div
          className="text-center w-full pt-1 flex flex-row items-baseline justify-center gap-2"
          data-tauri-drag-region={!isPinned ? true : undefined}
          onClick={stopAlarm}
        >
          {isAlarming ? (
            <p className="text-[11px] font-bold tracking-widest text-orange-500 uppercase animate-pulse">
              ⏰ AUFWACHEN!
            </p>
          ) : (
            <>
              <img
                alt=""
                className="w-3.5 h-3.5 object-contain select-none pointer-events-none align-baseline transform translate-y-[2px]"
                src={tomatoIcon.src}
              />
              <p
                className="text-[11px] font-bold tracking-widest text-orange-500 uppercase leading-none"
                data-tauri-drag-region={!isPinned ? true : undefined}
              >
                Pomodoro
              </p>
            </>
          )}
        </div>

        {/* Zeitanzeige */}
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
        <div
          className="py-2"
          data-tauri-drag-region={!isPinned ? true : undefined}
          onClick={stopAlarm}
        >
          <h1
            className={`text-5xl font-black font-mono tracking-tight transition-all duration-500 ${
              isAlarming
                ? "text-orange-500 animate-bounce scale-110"
                : "text-zinc-100"
            }`}
            data-tauri-drag-region={!isPinned ? true : undefined}
          >
            {formatTime(secondsLeft)}
          </h1>
        </div>

        {/* Steuerung */}
        <div className="flex gap-3 z-10">
          <Button
            className="rounded-xl font-semibold px-5 bg-orange-500 text-white cursor-pointer"
            size="sm"
            onPress={() => {
              stopAlarm();
              setIsActive(!isActive);
            }}
          >
            {isActive ? "Pause" : "Start"}
          </Button>
          <Button
            className="rounded-xl font-semibold px-5 bg-zinc-800 text-zinc-300 cursor-pointer disabled:opacity-30 disabled:cursor-default"
            isDisabled={isActive}
            size="sm"
            variant="outline"
            onPress={() => {
              stopAlarm();
              setIsActive(false);
              setSecondsLeft(DEFAULT_MINUTES * 60);
            }}
          >
            Reset
          </Button>
        </div>

        {/* Schnellauswahl */}
        <div className="grid grid-cols-5 gap-1 w-full pt-2 border-t border-zinc-800/60 z-10">
          {[5, 10, 15, 30, 60].map((min: number) => (
            <button
              key={min}
              className="text-[11px] font-bold py-1.5 rounded-lg bg-zinc-900 hover:bg-orange-500/20 hover:text-orange-400 text-zinc-400 transition-all active:scale-95 border border-zinc-800 cursor-pointer disabled:opacity-30 disabled:hover:bg-zinc-900 disabled:hover:text-zinc-400 disabled:cursor-default"
              disabled={isActive}
              onClick={() => setTimerMinutes(min)}
            >
              {min}m
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
