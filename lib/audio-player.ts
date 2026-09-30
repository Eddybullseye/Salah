'use client';

import { AdhanVoice, MainPrayerName, SoundSettings } from './types';
import { INITIAL_ADHAN_VOICES } from './seed-data';

const ADHAN_CACHE_NAME = 'salah-adhan-cache-v1';

export interface AudioPlaybackState {
  isPlaying: boolean;
  prayer?: MainPrayerName;
  voiceName?: string;
  muezzin?: string;
  currentTime: number;
  duration: number;
  isFajr?: boolean;
}

type StateListener = (state: AudioPlaybackState) => void;

class AdhanAudioService {
  private audio: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private isUnlocked = false;
  private listeners: Set<StateListener> = new Set();
  private currentState: AudioPlaybackState = {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAudioElement();
    }
  }

  private initAudioElement() {
    if (this.audio) return;
    this.audio = new Audio();
    this.audio.loop = false;
    this.audio.preload = 'auto';

    this.audio.addEventListener('play', () => {
      this.updateState({ isPlaying: true });
    });

    this.audio.addEventListener('pause', () => {
      this.updateState({ isPlaying: false });
    });

    this.audio.addEventListener('ended', () => {
      this.updateState({ isPlaying: false, currentTime: 0 });
      this.clearMediaSession();
    });

    this.audio.addEventListener('timeupdate', () => {
      if (this.audio) {
        this.updateState({
          currentTime: Math.floor(this.audio.currentTime),
          duration: Math.floor(this.audio.duration || 0),
        });
      }
    });

    this.audio.addEventListener('error', (e) => {
      console.warn('[Adhan Player] HTMLAudio load error, falling back to Web Audio Synthesizer:', e);
      // Fallback: If external MP3 cannot be reached or is placeholder, synthesize melodious tones
      if (this.currentState.isPlaying) {
        this.playSynthesizedAdhan(this.currentState.prayer || 'dhuhr', this.currentState.isFajr || false);
      }
    });
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.currentState);
    return () => this.listeners.delete(listener);
  }

  private updateState(partial: Partial<AudioPlaybackState>) {
    this.currentState = { ...this.currentState, ...partial };
    this.listeners.forEach((fn) => fn(this.currentState));
  }

  public getState(): AudioPlaybackState {
    return this.currentState;
  }

  // iOS user-gesture unlock
  public async unlockAudio(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }

      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      // Play a short silent buffer
      if (this.audioCtx) {
        const buffer = this.audioCtx.createBuffer(1, 1, 22050);
        const source = this.audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioCtx.destination);
        source.start(0);
      }

      this.isUnlocked = true;
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('salah_audio_unlocked', 'true');
      }
      return true;
    } catch (err) {
      console.warn('[Adhan Player] Audio unlock failed:', err);
      return false;
    }
  }

  public isAudioUnlocked(): boolean {
    if (this.isUnlocked) return true;
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem('salah_audio_unlocked') === 'true';
    }
    return false;
  }

  // Check if DND is active right now
  public isDNDActive(prayer: MainPrayerName, soundSettings?: SoundSettings): boolean {
    if (!soundSettings || !soundSettings.dnd_enabled) return false;

    // If Fajr is specifically allowed during DND, do not silence Fajr
    if (prayer === 'fajr' && soundSettings.dnd_allow_fajr) {
      return false;
    }

    try {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const [startH, startM] = soundSettings.dnd_start_time.split(':').map(Number);
      const [endH, endM] = soundSettings.dnd_end_time.split(':').map(Number);

      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      if (startMinutes <= endMinutes) {
        return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
      } else {
        // Over midnight (e.g. 23:00 to 05:00)
        return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
      }
    } catch {
      return false;
    }
  }

  // Preload and cache all configured adhan audio files in Cache API
  public async preloadAllAdhanAudio(voices: AdhanVoice[] = INITIAL_ADHAN_VOICES): Promise<{ cached: number; total: number }> {
    if (typeof window === 'undefined' || !('caches' in window)) return { cached: 0, total: 0 };
    let cached = 0;
    const urls: string[] = [];

    voices.forEach((v) => {
      if (v.file_url) urls.push(v.file_url);
      if (v.fajr_file_url && v.fajr_file_url !== v.file_url) urls.push(v.fajr_file_url);
    });

    for (const url of urls) {
      try {
        const ok = await this.cacheAudioFile(url);
        if (ok) cached++;
      } catch (err) {
        console.warn('[Adhan Player] Preload error:', url, err);
      }
    }
    return { cached, total: urls.length };
  }

  // Preload and cache an adhan audio file in Cache API for offline playback
  public async cacheAudioFile(url: string): Promise<boolean> {
    if (typeof window === 'undefined' || !('caches' in window)) return false;
    try {
      const cache = await caches.open(ADHAN_CACHE_NAME);
      const existing = await cache.match(url);
      if (existing) return true;

      const response = await fetch(url, { mode: 'cors' });
      if (response.ok) {
        await cache.put(url, response);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[Adhan Player] Cache error for:', url, err);
      return false;
    }
  }

  // Get cached audio blob URL or fallback to original URL
  private async getPlayableUrl(url: string): Promise<string> {
    if (typeof window === 'undefined' || !('caches' in window)) return url;
    try {
      const cache = await caches.open(ADHAN_CACHE_NAME);
      const response = await cache.match(url);
      if (response) {
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }
    } catch (err) {
      console.warn('[Adhan Player] Cache read error:', err);
    }
    return url;
  }

  // Core Play Method
  public async playAdhan(options: {
    prayer: MainPrayerName;
    voiceId?: string;
    soundSettings?: SoundSettings;
    forcePlay?: boolean;
  }): Promise<{ success: boolean; reason?: string }> {
    const { prayer, voiceId, soundSettings, forcePlay } = options;

    // Check DND
    if (!forcePlay && soundSettings && this.isDNDActive(prayer, soundSettings)) {
      return { success: false, reason: 'Do Not Disturb is active' };
    }

    // Determine prayer sound mode
    const prayerConfig = soundSettings?.prayers[prayer] || { sound_mode: 'adhan' };
    if (!forcePlay && prayerConfig.sound_mode === 'silent') {
      return { success: false, reason: 'Prayer is set to silent' };
    }
    if (!forcePlay && prayerConfig.sound_mode === 'notification_only') {
      return { success: false, reason: 'Notification only mode' };
    }

    // Stop any existing playback (Never play two adhans at once)
    this.stop();

    const selectedVoiceId = voiceId || prayerConfig.voice_id || soundSettings?.default_voice_id || 'voice-makkah';
    const voice = INITIAL_ADHAN_VOICES.find((v) => v.id === selectedVoiceId) || INITIAL_ADHAN_VOICES[0];
    const isFajr = prayer === 'fajr';

    // If soft tone is selected
    if (prayerConfig.sound_mode === 'soft_tone' || voice.id === 'voice-soft-reminder') {
      this.playSoftReminderTone(soundSettings?.volume || 0.85);
      this.updateState({
        isPlaying: true,
        prayer,
        voiceName: 'Soft Reminder Tone',
        muezzin: 'Acoustic Chime',
        currentTime: 0,
        duration: 15,
        isFajr,
      });
      return { success: true };
    }

    // Fajr specific adhan recording
    const targetUrl = isFajr && voice.fajr_file_url ? voice.fajr_file_url : voice.file_url;
    const volume = soundSettings?.volume ?? 0.85;

    this.initAudioElement();
    if (!this.audio) {
      return { success: false, reason: 'Audio element not available' };
    }

    try {
      const playableSrc = await this.getPlayableUrl(targetUrl);
      this.audio.src = playableSrc;
      this.audio.volume = Math.max(0, Math.min(1, volume));

      const playPromise = this.audio.play();
      if (playPromise !== undefined) {
        await playPromise;
      }

      this.updateState({
        isPlaying: true,
        prayer,
        voiceName: voice.name,
        muezzin: voice.muezzin,
        duration: voice.duration_seconds,
        isFajr,
      });

      this.setupMediaSession(prayer, voice);
      return { success: true };
    } catch (err: any) {
      console.warn('[Adhan Player] Autoplay blocked or audio load error:', err);
      // Browser blocked autoplay or audio file not uploaded yet; fallback to procedural tone
      this.playSynthesizedAdhan(prayer, isFajr);
      this.updateState({
        isPlaying: true,
        prayer,
        voiceName: `${voice.name} (Chime)`,
        muezzin: voice.muezzin,
        duration: 25,
        isFajr,
      });
      return { success: true, reason: 'Fallback to procedural adhan chime' };
    }
  }

  // Preview voice sample in Settings
  public async previewVoice(voice: AdhanVoice, isFajr = false, volume = 0.85): Promise<void> {
    this.stop();

    if (voice.id === 'voice-soft-reminder') {
      this.playSoftReminderTone(volume);
      this.updateState({
        isPlaying: true,
        voiceName: voice.name,
        muezzin: voice.muezzin,
        duration: 15,
      });
      return;
    }

    const targetUrl = isFajr && voice.fajr_file_url ? voice.fajr_file_url : voice.file_url;
    this.initAudioElement();
    if (!this.audio) return;

    try {
      const playableSrc = await this.getPlayableUrl(targetUrl);
      this.audio.src = playableSrc;
      this.audio.volume = Math.max(0, Math.min(1, volume));
      await this.audio.play();

      this.updateState({
        isPlaying: true,
        voiceName: voice.name,
        muezzin: voice.muezzin,
        duration: voice.duration_seconds,
      });

      this.setupMediaSession('asr', voice);
    } catch {
      // Procedural preview chime
      this.playSynthesizedAdhan('asr', isFajr);
      this.updateState({
        isPlaying: true,
        voiceName: `${voice.name} (Sample)`,
        muezzin: voice.muezzin,
        duration: 15,
      });
    }
  }

  public stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    this.updateState({ isPlaying: false, currentTime: 0 });
    this.clearMediaSession();
  }

  public pause(): void {
    if (this.audio) {
      this.audio.pause();
    }
    this.updateState({ isPlaying: false });
  }

  public resume(): void {
    if (this.audio && this.audio.src) {
      this.audio.play().catch(() => {});
      this.updateState({ isPlaying: true });
    }
  }

  // Media Session API integration for Lock Screen and Bluetooth controls
  private setupMediaSession(prayer: MainPrayerName, voice: AdhanVoice) {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    const prayerCapitalized = prayer.charAt(0).toUpperCase() + prayer.slice(1);
    navigator.mediaSession.metadata = new MediaMetadata({
      title: `Adhan – ${prayerCapitalized}`,
      artist: `${voice.name} (${voice.muezzin})`,
      album: 'Salah Companion',
      artwork: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    });

    navigator.mediaSession.setActionHandler('play', () => this.resume());
    navigator.mediaSession.setActionHandler('pause', () => this.pause());
    navigator.mediaSession.setActionHandler('stop', () => this.stop());
  }

  private clearMediaSession() {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.playbackState = 'none';
    } catch {}
  }

  // --- PROCEDURAL ACOUSTIC TONES (Web Audio API Synthesizers) ---

  // 1. Soft Reminder Tone (3-tone harmonic acoustic bell chime)
  public playSoftReminderTone(volume = 0.8): void {
    if (typeof window === 'undefined') return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 major triad

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.4);

        gain.gain.setValueAtTime(0, now + idx * 0.4);
        gain.gain.linearRampToValueAtTime(0.3 * volume, now + idx * 0.4 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.4 + 2.0);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.4);
        osc.stop(now + idx * 0.4 + 2.2);
      });
    } catch (e) {
      console.warn('Soft reminder tone error:', e);
    }
  }

  // 2. Pre-prayer alert chime (gentle ascending double chime)
  public playPrePrayerChime(volume = 0.7): void {
    if (typeof window === 'undefined') return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      [440, 554.37].forEach((freq, i) => { // A4, C#5
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.25);

        gain.gain.setValueAtTime(0, now + i * 0.25);
        gain.gain.linearRampToValueAtTime(0.25 * volume, now + i * 0.25 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.25 + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.25);
        osc.stop(now + i * 0.25 + 1.3);
      });
    } catch (e) {}
  }

  // 3. Gentle nudge tone ("Still haven't prayed?")
  public playNudgeTone(volume = 0.7): void {
    if (typeof window === 'undefined') return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      [587.33, 523.25].forEach((freq, i) => { // D5, C5 gentle descending reminder
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.35);

        gain.gain.setValueAtTime(0, now + i * 0.35);
        gain.gain.linearRampToValueAtTime(0.2 * volume, now + i * 0.35 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.35 + 1.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.35);
        osc.stop(now + i * 0.35 + 1.6);
      });
    } catch (e) {}
  }

  // 4. "I Prayed" Completion Tone (serene uplifting chime)
  public playCompletionTone(volume = 0.8): void {
    if (typeof window === 'undefined') return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 octave resolution
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.12);

        gain.gain.setValueAtTime(0, now + i * 0.12);
        gain.gain.linearRampToValueAtTime(0.25 * volume, now + i * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 1.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 2.0);
      });
    } catch (e) {}
  }

  // 5. Tasbih Bead Click / Tactile acoustic sound
  public playTasbihClick(volume = 0.5): void {
    if (typeof window === 'undefined') return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // High-frequency wooden resonance click
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(950, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.04);

      gain.gain.setValueAtTime(0.4 * volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {}
  }

  // 6. Optional Quran Recitation Clip (Maqam Bayati sacred recitation motif)
  public playQuranRecitationClip(volume = 0.8): void {
    if (typeof window === 'undefined') return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Bayati scale peaceful meditative recitation motif
      const notes = [261.63, 293.66, 329.63, 349.23, 392.0, 349.23, 329.63, 293.66];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.45);

        gain.gain.setValueAtTime(0, now + idx * 0.45);
        gain.gain.linearRampToValueAtTime(0.22 * volume, now + idx * 0.45 + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.45 + 0.7);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.45);
        osc.stop(now + idx * 0.45 + 0.75);
      });
    } catch (e) {}
  }

  // 7. Synthesized Adhan Melodic Motifs (Maqam Hijaz procedural tones)
  private playSynthesizedAdhan(prayer: MainPrayerName, isFajr = false): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Traditional Maqam Hijaz interval ratios: D4, Eb4, F#4, G4, A4, Bb4, C5, D5
      const notes = isFajr
        ? [293.66, 311.13, 369.99, 392.0, 440.0, 392.0, 369.99, 293.66]
        : [293.66, 369.99, 392.0, 440.0, 392.0, 369.99, 311.13, 293.66];

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.9);

        gain.gain.setValueAtTime(0, now + idx * 0.9);
        gain.gain.linearRampToValueAtTime(0.35, now + idx * 0.9 + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.9 + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.9);
        osc.stop(now + idx * 0.9 + 1.3);
      });
    } catch (e) {}
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }
}

// Export singleton instance
export const adhanAudio = new AdhanAudioService();
