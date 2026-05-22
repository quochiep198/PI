type CelebrationSoundOptions = {
  enabled?: boolean;
  volume?: number;
};

let sharedAudioContext: AudioContext | null = null;
let hasInstalledAudioUnlock = false;

function getAudioContext() {
  if (typeof window === 'undefined') {
    return null;
  }

  const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) {
    return null;
  }

  if (!sharedAudioContext) {
    sharedAudioContext = new AudioContextCtor();
  }

  return sharedAudioContext;
}

function scheduleCelebrationChime(context: AudioContext, volume: number) {
  const normalizedVolume = Math.min(Math.max(volume, 0), 100) / 100;
  const startAt = context.currentTime + 0.02;
  const notes = [
    { frequency: 523.25, duration: 0.12 },
    { frequency: 659.25, duration: 0.12 },
    { frequency: 783.99, duration: 0.16 },
    { frequency: 1046.5, duration: 0.24 },
  ];

  notes.forEach((note, index) => {
    const noteStart = startAt + index * 0.11;
    const noteEnd = noteStart + note.duration;

    const oscillator = context.createOscillator();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(note.frequency, noteStart);

    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, noteStart);
    gain.gain.exponentialRampToValueAtTime(0.16 * normalizedVolume, noteStart + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(noteStart);
    oscillator.stop(noteEnd + 0.02);
  });
}

function primeAudioContext(context: AudioContext) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  gain.gain.value = 0.00001;
  oscillator.frequency.value = 440;
  oscillator.connect(gain);
  gain.connect(context.destination);

  const startAt = context.currentTime;
  oscillator.start(startAt);
  oscillator.stop(startAt + 0.01);
}

export function installAudioUnlock() {
  if (typeof window === 'undefined' || hasInstalledAudioUnlock) {
    return;
  }

  const unlockAudio = () => {
    const context = getAudioContext();
    if (!context) {
      return;
    }

    if (context.state === 'suspended') {
      void context
        .resume()
        .then(() => {
          primeAudioContext(context);
        })
        .catch(() => undefined);
      return;
    }

    primeAudioContext(context);
  };

  hasInstalledAudioUnlock = true;
  window.addEventListener('pointerdown', unlockAudio, { passive: true });
  window.addEventListener('keydown', unlockAudio, { passive: true });
  window.addEventListener('touchstart', unlockAudio, { passive: true });
}

export function playCelebrationChime({ enabled = true, volume = 80 }: CelebrationSoundOptions = {}) {
  if (!enabled || volume <= 0) {
    return;
  }

  const context = getAudioContext();
  if (!context) {
    return;
  }

  if (context.state === 'suspended') {
    void context
      .resume()
      .then(() => {
        scheduleCelebrationChime(context, volume);
      })
      .catch(() => undefined);
    return;
  }

  scheduleCelebrationChime(context, volume);
}
