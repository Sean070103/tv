'use client';

import React, { useState, useRef } from 'react';
import YouTube, { YouTubePlayer } from 'react-youtube';
import styles from './TVScreen.module.css';

const CHANNELS = [
  { ch: 4, videoId: 'Ayd8skzZU74' }, // original
  { ch: 5, videoId: 'xGo9ny7G_j4' },
  { ch: 6, videoId: 'iDCegwpnlbM' },
  { ch: 7, videoId: 'xgq_fv1nrvQ' },
  { ch: 8, videoId: 'WNumxta7z48' },
  { ch: 9, videoId: 'zjuFxPxw0SQ' },
  { ch: 10, videoId: '8dY_13bk0hs' },
  { ch: 11, videoId: 'ue6Lieg7ZM4' },
  { ch: 12, videoId: 'RW2fFdjfzOU' },
  { ch: 13, videoId: 's32cDa5WFiI' },
  { ch: 14, videoId: 'hETZMLyvNac', playlist: 'PLH4KMG-7qrJd_eU6b9v4N01eVVZaRUoPN' },
  { ch: 15, videoId: 'V3ba6ZrBvVU' },
];
const MIN_CHANNEL = CHANNELS[0].ch;
const MAX_CHANNEL = CHANNELS[CHANNELS.length - 1].ch;
const MIN_VOLUME = 0;
const MAX_VOLUME = 20;

const TVScreen: React.FC = () => {
  const [powerOn, setPowerOn] = useState(true);
  const [channel, setChannel] = useState(CHANNELS[0].ch);
  const [volume, setVolume] = useState(10);
  const [playerReady, setPlayerReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const mountedRef = useRef(true);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const handlePower = () => {
    if (powerOn && playerRef.current) {
      try {
        playerRef.current.pauseVideo();
      } catch {}
      playerRef.current = null;
      setPlayerReady(false);
    }
    setPowerOn((on) => !on);
    setLoading(true);
  };
  const handleChannelUp = () => {
    setChannel((ch) => (ch < MAX_CHANNEL ? ch + 1 : MIN_CHANNEL));
    setLoading(true);
  };
  const handleChannelDown = () => {
    setChannel((ch) => (ch > MIN_CHANNEL ? ch - 1 : MAX_CHANNEL));
    setLoading(true);
  };
  const handleVolumeUp = () => setVolume((v) => (v < MAX_VOLUME ? v + 1 : MAX_VOLUME));
  const handleVolumeDown = () => setVolume((v) => (v > MIN_VOLUME ? v - 1 : MIN_VOLUME));

  // Get the videoId for the current channel
  const currentChannel = CHANNELS.find((c) => c.ch === channel) || CHANNELS[0];

  // Sync volume with YouTube player
  React.useEffect(() => {
    if (powerOn && playerReady && playerRef.current) {
      try {
        playerRef.current.setVolume(volume * 5); // YouTube volume is 0-100
      } catch {}
    }
  }, [volume, powerOn, playerReady]);

  // When channel changes, cue the new video
  React.useEffect(() => {
    if (powerOn && playerReady && playerRef.current) {
      try {
        setLoading(true);
        playerRef.current.cueVideoById(currentChannel.videoId);
      } catch {}
    }
  }, [channel, powerOn, playerReady, currentChannel.videoId]);

  // Hide loading when video starts playing
  const onPlayerReady = (event: { target: YouTubePlayer }) => {
    if (!powerOn || !mountedRef.current) return;
    playerRef.current = event.target;
    setPlayerReady(true);
    try {
      event.target.setVolume(volume * 5);
    } catch {}
  };
  const onStateChange = (event: { data: number }) => {
    // 1 = playing, 2 = paused, 3 = buffering
    if (event.data === 1) setLoading(false);
    if (event.data === 3) setLoading(true);
  };

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
                      videoId={currentChannel.videoId}
                      opts={{
                        width: '100%',
                        height: '100%',
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
                          ...(currentChannel.playlist ? { list: currentChannel.playlist, loop: 1 } : {}),
                        },
                      }}
                      onReady={onPlayerReady}
                      onStateChange={onStateChange}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', zIndex: 1, borderRadius: 'inherit' }}
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
                      <div>CH {channel.toString().padStart(2, '0')}</div>
                      <div style={{fontSize: '1.1rem', fontWeight: 700}}>Volume: {volume}</div>
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
              <button className={styles.panelBtn} aria-label="Power" onClick={handlePower} style={{outline: 'none', cursor: 'pointer'}}></button>
              <span className={styles.buttonLabel}>Power</span>
            </div>
            <div className={styles.buttonWithLabel}>
              <button className={styles.panelBtn} aria-label="Channel Down" onClick={handleChannelDown} style={{outline: 'none', cursor: 'pointer'}}></button>
              <span className={styles.buttonLabel}>CH-</span>
            </div>
            <div className={styles.buttonWithLabel}>
              <button className={`${styles.panelBtn} ${styles.oval}`} aria-label="Channel Up" onClick={handleChannelUp} style={{outline: 'none', cursor: 'pointer'}}></button>
              <span className={styles.buttonLabel}>CH+</span>
            </div>
            <div className={styles.buttonWithLabel}>
              <button className={styles.panelBtn} aria-label="Volume Down" onClick={handleVolumeDown} style={{outline: 'none', cursor: 'pointer'}}></button>
              <span className={styles.buttonLabel}>VOL-</span>
            </div>
            <div className={styles.buttonWithLabel}>
              <button className={styles.panelBtn} aria-label="Volume Up" onClick={handleVolumeUp} style={{outline: 'none', cursor: 'pointer'}}></button>
              <span className={styles.buttonLabel}>VOL+</span>
            </div>
            <span className={`${styles.powerLED} ${!powerOn ? styles.off : ''}`}></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TVScreen; 