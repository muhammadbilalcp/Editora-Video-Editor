class AudioEngine {
  private ctx: AudioContext | null = null;
  private activeSources: Map<string, { source: AudioBufferSourceNode; gainNode: GainNode }> = new Map();
  private audioBuffers: Map<string, AudioBuffer> = new Map();

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public async loadAudio(url: string): Promise<AudioBuffer> {
    if (this.audioBuffers.has(url)) {
      return this.audioBuffers.get(url)!;
    }

    const ctx = this.getContext();
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    this.audioBuffers.set(url, audioBuffer);
    return audioBuffer;
  }

  public async playTrack(
    clipId: string,
    url: string,
    startTimeInMedia: number,
    duration: number,
    volume: number = 1,
    fadeInSec: number = 0,
    fadeOutSec: number = 0
  ) {
    this.stopTrack(clipId);

    try {
      const buffer = await this.loadAudio(url);
      const ctx = this.getContext();

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const gainNode = ctx.createGain();
      
      // Volume & Fades
      const now = ctx.currentTime;
      gainNode.gain.setValueAtTime(0, now);

      if (fadeInSec > 0) {
        gainNode.gain.linearRampToValueAtTime(volume, now + fadeInSec);
      } else {
        gainNode.gain.setValueAtTime(volume, now);
      }

      if (fadeOutSec > 0 && duration > fadeOutSec) {
        gainNode.gain.setValueAtTime(volume, now + duration - fadeOutSec);
        gainNode.gain.linearRampToValueAtTime(0, now + duration);
      }

      source.connect(gainNode);
      gainNode.connect(ctx.destination);

      source.start(now, startTimeInMedia, duration);

      this.activeSources.set(clipId, { source, gainNode });

      source.onended = () => {
        this.activeSources.delete(clipId);
      };
    } catch (err) {
      console.error(`Failed to play audio track ${clipId}:`, err);
    }
  }

  public stopTrack(clipId: string) {
    if (this.activeSources.has(clipId)) {
      const { source } = this.activeSources.get(clipId)!;
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // Source might already be stopped
      }
      this.activeSources.delete(clipId);
    }
  }

  public stopAll() {
    this.activeSources.forEach(({ source }) => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {}
    });
    this.activeSources.clear();
  }

  public setVolume(clipId: string, volume: number) {
    if (this.activeSources.has(clipId) && this.ctx) {
      const { gainNode } = this.activeSources.get(clipId)!;
      gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
    }
  }
}

export const audioEngine = new AudioEngine();
