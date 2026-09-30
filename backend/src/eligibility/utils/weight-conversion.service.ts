
export class WeightConversionService {
  static convertToKg(value: number, unit: string): number {
    const u = unit.toUpperCase();
    if (u === 'KG') return value;
    if (u === 'TON' || u === 'MT') return value * 1000;
    if (u === 'GRAM') return value / 1000;
    if (u === 'LBS' || u === 'POUND') return value * 0.453592;
    return value; // fallback
  }
}
