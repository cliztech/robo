export interface FrequencyBands {
  subBass: number;
  bass: number;
  lowMid: number;
  mid: number;
  highMid: number;
  presence: number;
  brilliance: number;
}

export class AudioAnalyzer {
  static analyzeFrequencyBands(frequencyData: Uint8Array, sampleRate = 48_000): FrequencyBands {
    const nyquist = sampleRate / 2;
    const binWidth = nyquist / frequencyData.length;

    const getBandAverage = (startFreq: number, endFreq: number): number => {
      const startBin = Math.floor(startFreq / binWidth);
      const endBin = Math.ceil(endFreq / binWidth);

      let sum = 0;
      let count = 0;
      for (let i = startBin; i < endBin && i < frequencyData.length; i += 1) {
        sum += frequencyData[i];
        count += 1;
      }

      return count > 0 ? sum / count / 255 : 0;
    };

    return {
      subBass: getBandAverage(20, 60),
      bass: getBandAverage(60, 250),
      lowMid: getBandAverage(250, 500),
      mid: getBandAverage(500, 2000),
      highMid: getBandAverage(2000, 4000),
      presence: getBandAverage(4000, 6000),
      brilliance: getBandAverage(6000, 20000),
    };
  }

  static calculateSpectralCentroid(frequencyData: Uint8Array, sampleRate = 48_000): number {
    let weightedSum = 0;
    let sum = 0;

    const nyquist = sampleRate / 2;
    const binWidth = nyquist / frequencyData.length;

    for (let i = 0; i < frequencyData.length; i += 1) {
      const frequency = i * binWidth;
      const magnitude = frequencyData[i];
      weightedSum += frequency * magnitude;
      sum += magnitude;
    }

    return sum > 0 ? weightedSum / sum : 0;
  }

  static calculateEnergy(waveformData: Uint8Array): number {
    let sum = 0;
    for (let i = 0; i < waveformData.length; i += 1) {
      const normalized = (waveformData[i] - 128) / 128;
      sum += normalized * normalized;
    }
    return sum / waveformData.length;
  }

  static calculateRMS(waveformData: Uint8Array): number {
    return Math.sqrt(this.calculateEnergy(waveformData));
  }

  static calculatePeak(waveformData: Uint8Array): number {
    let peak = 0;
    for (let i = 0; i < waveformData.length; i += 1) {
      const normalized = Math.abs((waveformData[i] - 128) / 128);
      peak = Math.max(peak, normalized);
    }
    return peak;
  }

  static detectClipping(waveformData: Uint8Array, threshold = 0.99): boolean {
    return this.calculatePeak(waveformData) >= threshold;
  }
}
