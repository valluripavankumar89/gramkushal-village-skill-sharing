// Speech & Audio Assistance Module for GramKushal
// Supporting English ('en') and Telugu ('te') for inclusive rural access

class VillageVoiceAssistant {
  constructor() {
    this.synth = window.speechSynthesis || null;
    this.currentUtterance = null;
    this.isSpeaking = false;
    this.voiceEnabled = true;
    this.currentLang = 'en';
    this.audioCtx = null;
    this.initAudioContext();
  }

  initAudioContext() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    } catch (e) {
      console.warn("AudioContext not supported", e);
    }
  }

  playChirp(type = 'click') {
    if (!this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      const now = this.audioCtx.currentTime;
      if (type === 'click') {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'success') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        osc.frequency.setValueAtTime(783.99, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch (e) {
      // Audio cue fallback
    }
  }

  speak(text, lang = null) {
    if (!this.synth || !this.voiceEnabled) return;

    this.stop();

    const targetLang = lang || this.currentLang;
    const utterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance = utterance;

    const langCode = (targetLang === 'te') ? 'te-IN' : 'en-US';
    utterance.lang = langCode;
    utterance.rate = (targetLang === 'te') ? 0.88 : 0.95;
    utterance.pitch = 1.0;

    const voices = this.synth.getVoices();
    if (targetLang === 'te') {
      const teVoice = voices.find(v => v.lang && (v.lang.startsWith('te') || v.lang.includes('Telugu')));
      if (teVoice) {
        utterance.voice = teVoice;
      }
    } else {
      const enVoice = voices.find(v => v.lang && v.lang.startsWith('en'));
      if (enVoice) {
        utterance.voice = enVoice;
      }
    }

    this.showVisualIndicator(true, text);

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.showVisualIndicator(true, text);
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.showVisualIndicator(false);
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      this.showVisualIndicator(false);
    };

    this.synth.speak(utterance);
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
      this.showVisualIndicator(false);
    }
  }

  toggleVoice() {
    this.voiceEnabled = !this.voiceEnabled;
    if (!this.voiceEnabled) {
      this.stop();
    } else {
      this.playChirp('success');
      const msg = (this.currentLang === 'te') 
        ? "వాయిస్ సహాయం ప్రారంభించబడింది." 
        : "Voice assistance is now enabled.";
      this.speak(msg);
    }
    return this.voiceEnabled;
  }

  showVisualIndicator(active, text = "") {
    const indicator = document.getElementById("voice-wave-banner");
    const label = document.getElementById("voice-wave-text");
    if (!indicator) return;

    if (active) {
      indicator.classList.remove("hidden");
      const defaultText = (this.currentLang === 'te') ? "🔊 మాట్లాడుతున్నాను..." : "🔊 Speaking...";
      if (label) label.textContent = text ? `🔊 "${text.substring(0, 60)}..."` : defaultText;
    } else {
      indicator.classList.add("hidden");
    }
  }
}

window.voiceAssistant = new VillageVoiceAssistant();
