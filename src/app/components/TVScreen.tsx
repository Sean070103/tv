"use client";

import React, { useState, useRef, useCallback } from "react";
import YouTube, { YouTubePlayer } from "react-youtube";
import styles from "./TVScreen.module.css";

interface Channel {
  ch: number;
  videoId: string;
  playlist?: string | string[];
}

const CHANNELS: Channel[] = [
  {
    ch: 4,
    videoId: "Mxv5h-RZWVs", // Basketball playlist - first video
    playlist: "Mxv5h-RZWVs,uqf13CnVVSo,UKvcGBlV2iA,7CyFymdSZ2E", // Basketball playlist
  },
  {
    ch: 5,
    videoId: "VlPsZzVPbXk", // Myx PH playlist - first video
    playlist: "VlPsZzVPbXk,xgq_fv1nrvQ,8JebJIbCeO8", // Myx PH playlist
  },
  {
    ch: 6,
    videoId: "Smh_SorjozU", // Cartoons channel - first video
    playlist: "Smh_SorjozU", // Cartoons playlist (single video for now)
  },
  {
    ch: 7,
    videoId: "jTAHebEVEPI", // Fish Hooks
    playlist: "jTAHebEVEPI",
  },
  {
    ch: 8,
    videoId: "xgq_fv1nrvQ", // New channel
    playlist: "xgq_fv1nrvQ",
  },
  {
    ch: 9,
    videoId: "_nb2wqB1vSY", // New channel
    playlist: "_nb2wqB1vSY",
  }
];

const MIN_CHANNEL = CHANNELS[0].ch;
const MAX_CHANNEL = CHANNELS[CHANNELS.length - 1].ch;
const MIN_VOLUME = 0;
const MAX_VOLUME = 20;

type ChannelNumber = (typeof CHANNELS)[number]["ch"];

type PlaybackMap = Record<ChannelNumber, number>;

const TVScreen: React.FC = () => {
  const [powerOn, setPowerOn] = useState(true);
  const [channel, setChannel] = useState<ChannelNumber>(CHANNELS[0].ch);
  const [volume, setVolume] = useState(10);
  const [loading, setLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [playbackMap, setPlaybackMap] = useState<PlaybackMap>(
    {} as PlaybackMap
  );
  const playerRef = useRef<YouTubePlayer | null>(null);
  const mountedRef = useRef(true);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Save playback time every 2 seconds
  React.useEffect(() => {
    if (!powerOn) return;
    const interval = setInterval(async () => {
      if (playerRef.current) {
        try {
          const time = await playerRef.current.getCurrentTime();
          setPlaybackMap((prev) => ({ ...prev, [channel]: time }));
        } catch {}
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [channel, powerOn]);

  const onPlayerReady = useCallback(
    (event: { target: YouTubePlayer }) => {
      if (!powerOn || !mountedRef.current) return;
      playerRef.current = event.target;
      try {
        event.target.unMute();
        const resumeTime = playbackMap[channel] || 0;
        event.target.seekTo(resumeTime, true);
        event.target.playVideo();
        event.target.setVolume(volume * 5);
      } catch {}
      setLoading(false);
    },
    [powerOn, volume, channel, playbackMap]
  );

  const handleChannelUp = useCallback(async () => {
    if (isSwitching) return;
    setIsSwitching(true);
    if (playerRef.current) {
      try {
        const time = await playerRef.current.getCurrentTime();
        setPlaybackMap((prev) => ({ ...prev, [channel]: time }));
      } catch {}
    }
    setChannel(
      (ch) => (ch < MAX_CHANNEL ? ch + 1 : MIN_CHANNEL) as ChannelNumber
    );
    setLoading(true);
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    loadingTimeoutRef.current = setTimeout(() => {
      setIsSwitching(false);
    }, 500);
  }, [isSwitching, channel]);

  const handleChannelDown = useCallback(async () => {
    if (isSwitching) return;
    setIsSwitching(true);
    if (playerRef.current) {
      try {
        const time = await playerRef.current.getCurrentTime();
        setPlaybackMap((prev) => ({ ...prev, [channel]: time }));
      } catch {}
    }
    setChannel(
      (ch) => (ch > MIN_CHANNEL ? ch - 1 : MAX_CHANNEL) as ChannelNumber
    );
    setLoading(true);
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    loadingTimeoutRef.current = setTimeout(() => {
      setIsSwitching(false);
    }, 500);
  }, [isSwitching, channel]);

  const handlePower = useCallback(() => {
    if (isSwitching) return;
    setIsSwitching(true);
    setPowerOn((on) => !on);
    setLoading(true);
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    loadingTimeoutRef.current = setTimeout(() => {
      setIsSwitching(false);
    }, 500);
  }, [isSwitching]);

  const handleVolumeUp = useCallback(() => {
    if (isSwitching) return;
    setVolume((v) => (v < MAX_VOLUME ? v + 1 : MAX_VOLUME));
    if (playerRef.current) {
      try {
        playerRef.current.setVolume((volume + 1) * 5);
      } catch {}
    }
  }, [isSwitching, volume]);

  const handleVolumeDown = useCallback(() => {
    if (isSwitching) return;
    setVolume((v) => (v > MIN_VOLUME ? v - 1 : MIN_VOLUME));
    if (playerRef.current) {
      try {
        playerRef.current.setVolume((volume - 1) * 5);
      } catch {}
    }
  }, [isSwitching, volume]);

  const onStateChange = useCallback(
    (event: { data: number }) => {
      if (event.data === 1) {
        // Playing
        setLoading(false);
        setIsSwitching(false);
      } else if (event.data === 0) {
        // Ended
        if (playerRef.current) {
          try {
            const currentChannel = CHANNELS.find((c) => c.ch === channel);
            if (currentChannel?.playlist) {
              playerRef.current.nextVideo();
            } else {
              playerRef.current.playVideo();
            }
          } catch {}
        }
      } else if (event.data === 3) {
        // Buffering
        setLoading(true);
      }
    },
    [channel]
  );

  React.useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "ArrowUp") {
        handleChannelUp();
      } else if (event.key === "ArrowDown") {
        handleChannelDown();
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleChannelUp, handleChannelDown]);

  const currentChannel = CHANNELS.find((c) => c.ch === channel);

  return (
    <div className={styles.tvContainer}>
      <div className={styles.tvBody}>
        <div className={styles.tvOuter}>
          <div className={styles.tvBezel}>
            <div className={styles.speakerSide}></div>
            <div className={styles.tvFrame}>
              <div className={styles.tvScreen}>
                <div className={styles.phSun}></div>
                {powerOn ? (
                  <>
                    <YouTube
                      videoId={currentChannel?.videoId}
                      onReady={onPlayerReady}
                      onStateChange={onStateChange}
                      opts={{
                        width: "100%",
                        height: "100%",
                        playerVars: {
                          autoplay: 1,
                          controls: 0,
                          rel: 0,
                          modestbranding: 1,
                          fs: 0,
                          disablekb: 1,
                          iv_load_policy: 3,
                          showinfo: 0,
                          playsinline: 1,
                          preload: "auto",
                          loop: 1,
                          playlist: Array.isArray(currentChannel?.playlist)
                            ? currentChannel.playlist.join(",")
                            : currentChannel?.playlist ||
                              currentChannel?.videoId,
                        },
                      }}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        border: "none",
                        zIndex: 1,
                        borderRadius: "inherit",
                        opacity: loading ? 0 : 1,
                        transition: "opacity 0.3s ease-in-out",
                      }}
                      className="yt-embed"
                    />
                    {loading && (
                      <div className={styles.staticScreen}>
                        <div className={styles.staticNoise}></div>
                        <div className={styles.staticColorNoise}></div>
                        <div className={styles.noSignalBox}>NO SIGNAL</div>
                      </div>
                    )}
                    <div className={styles.screenOverlay}>
                      <div>CH {channel.toString().padStart(2, "0")}</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                        Volume: {volume}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className={styles.staticScreen}>
                    <div className={styles.staticNoise}></div>
                    <div className={styles.staticColorNoise}></div>
                    <div className={styles.noSignalBox}>NO SIGNAL</div>
                  </div>
                )}
              </div>
            </div>
            <div className={`${styles.speakerSide} ${styles.right}`}></div>
          </div>
          <div className={styles.phFlagBar}>
            <div className="phBlue"></div>
            <div className="phRed"></div>
            <div className="phYellow"></div>
          </div>
          <div className={styles.buttonPanel}>
            <div className={styles.buttonWithLabel}>
              <button
                className={styles.panelBtn}
                aria-label="Power"
                onClick={handlePower}
                style={{
                  outline: "none",
                  cursor: isSwitching ? "not-allowed" : "pointer",
                  opacity: isSwitching ? 0.5 : 1,
                }}
                disabled={isSwitching}
              ></button>
              <span className={styles.buttonLabel}>Power</span>
            </div>
            <div className={styles.buttonWithLabel}>
              <button
                className={styles.panelBtn}
                aria-label="Channel Down"
                onClick={handleChannelDown}
                style={{
                  outline: "none",
                  cursor: isSwitching ? "not-allowed" : "pointer",
                  opacity: isSwitching ? 0.5 : 1,
                }}
                disabled={isSwitching}
              ></button>
              <span className={styles.buttonLabel}>CH-</span>
            </div>
            <div className={styles.buttonWithLabel}>
              <button
                className={`${styles.panelBtn} ${styles.oval}`}
                aria-label="Channel Up"
                onClick={handleChannelUp}
                style={{
                  outline: "none",
                  cursor: isSwitching ? "not-allowed" : "pointer",
                  opacity: isSwitching ? 0.5 : 1,
                }}
                disabled={isSwitching}
              ></button>
              <span className={styles.buttonLabel}>CH+</span>
            </div>
            <div className={styles.buttonWithLabel}>
              <button
                className={styles.panelBtn}
                aria-label="Volume Down"
                onClick={handleVolumeDown}
                style={{
                  outline: "none",
                  cursor: isSwitching ? "not-allowed" : "pointer",
                  opacity: isSwitching ? 0.5 : 1,
                }}
                disabled={isSwitching}
              ></button>
              <span className={styles.buttonLabel}>VOL-</span>
            </div>
            <div className={styles.buttonWithLabel}>
              <button
                className={styles.panelBtn}
                aria-label="Volume Up"
                onClick={handleVolumeUp}
                style={{
                  outline: "none",
                  cursor: isSwitching ? "not-allowed" : "pointer",
                  opacity: isSwitching ? 0.5 : 1,
                }}
                disabled={isSwitching}
              ></button>
              <span className={styles.buttonLabel}>VOL+</span>
            </div>
            <span
              className={`${styles.powerLED} ${!powerOn ? styles.off : ""}`}
            ></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TVScreen;
