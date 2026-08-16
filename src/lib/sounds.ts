import { db } from "./db";

// Função para verificar se os sons estão habilitados
const isSoundEnabled = async (): Promise<boolean> => {
  try {
    const setting = await db.settings.get("soundEnabled");
    return setting ? setting.value : true;
  } catch (e) {
    return true;
  }
};

// Sintetizar som usando a Web Audio API
export const playSelectSound = async () => {
  if (!(await isSoundEnabled())) return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    // Começa em 400Hz e sobe rápido para 600Hz
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {}
};

export const playAchievementSound = async () => {
  if (!(await isSoundEnabled())) return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Tocar um arpejo mágico ascendente (C4 - E4 - G4 - C5)
    const notes = [261.63, 329.63, 392.00, 523.25];
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.1);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + index * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + index * 0.1 + 0.25);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime + index * 0.1);
      osc.stop(ctx.currentTime + index * 0.1 + 0.3);
    });
  } catch (e) {}
};

export const playCompleteSound = async () => {
  if (!(await isSoundEnabled())) return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Melodia de celebração feliz
    // C4 (0.1s) -> E4 (0.1s) -> G4 (0.1s) -> C5 (0.3s)
    const melody = [
      { freq: 261.63, start: 0, duration: 0.12 },
      { freq: 329.63, start: 0.12, duration: 0.12 },
      { freq: 392.00, start: 0.24, duration: 0.12 },
      { freq: 523.25, start: 0.36, duration: 0.5 },
    ];

    melody.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(note.freq, ctx.currentTime + note.start);

      gain.gain.setValueAtTime(0, ctx.currentTime + note.start);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + note.start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + note.start + note.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + note.start);
      osc.stop(ctx.currentTime + note.start + note.duration);
    });
  } catch (e) {}
};
