/**
 * Branded Types for Physical Units
 *
 * Estos tipos garantizan type safety para unidades físicas,
 * previniendo mezcla accidental de valores sin unidades.
 *
 * Uso:
 *   const ior: IOR = 2.417 as IOR;
 *   const freq: FrequencyHz = 432 as FrequencyHz;
 *   // Error: const wrong: IOR = 432 as FrequencyHz; // Type mismatch
 */

// Branded type helper
type Brand<K, T> = K & { __brand: T };

/** Índice de refracción (ej: diamond 2.417, water 1.33, glass 1.5) */
export type IOR = Brand<number, 'IOR'>;

/** Frecuencia en Hertz (ej: 432Hz tuning, 440Hz standard) */
export type FrequencyHz = Brand<number, 'FrequencyHz'>;

/** Longitud de onda en nanómetros (ej: 650nm red, 450nm blue) */
export type WavelengthNm = Brand<number, 'WavelengthNm'>;

/** Distancia en kilómetros (escala planetaria) */
export type DistanceKm = Brand<number, 'DistanceKm'>;

/** Distancia en metros (escena local) */
export type DistanceM = Brand<number, 'DistanceM'>;

/** Temperatura en Kelvin (ej: star color temperature) */
export type TemperatureK = Brand<number, 'TemperatureK'>;

/** Semilla determinística para generadores */
export type Seed = Brand<string | number, 'Seed'>;

/** Tiempo en segundos */
export type TimeSeconds = Brand<number, 'TimeSeconds'>;

/** Tiempo en milisegundos */
export type TimeMs = Brand<number, 'TimeMs'>;

/** Ángulo en radianes */
export type Radians = Brand<number, 'Radians'>;

/** Ángulo en grados */
export type Degrees = Brand<number, 'Degrees'>;

/** Porcentaje normalizado 0-1 */
export type Normalized = Brand<number, 'Normalized'>;

/** Densidad de partículas por unidad de volumen */
export type ParticleDensity = Brand<number, 'ParticleDensity'>;

/** Intensidad de luz (candelas/lúmenes) */
export type LightIntensity = Brand<number, 'LightIntensity'>;

/** Factor de escala (multiplicador) */
export type ScaleFactor = Brand<number, 'ScaleFactor'>;

/** Constructores type-safe */
export const Units = {
  ior: (value: number): IOR => value as IOR,
  hz: (value: number): FrequencyHz => value as FrequencyHz,
  nm: (value: number): WavelengthNm => value as WavelengthNm,
  km: (value: number): DistanceKm => value as DistanceKm,
  m: (value: number): DistanceM => value as DistanceM,
  kelvin: (value: number): TemperatureK => value as TemperatureK,
  seed: (value: string | number): Seed => value as Seed,
  seconds: (value: number): TimeSeconds => value as TimeSeconds,
  ms: (value: number): TimeMs => value as TimeMs,
  rad: (value: number): Radians => value as Radians,
  deg: (value: number): Degrees => value as Degrees,
  norm: (value: number): Normalized => value as Normalized,
  density: (value: number): ParticleDensity => value as ParticleDensity,
  intensity: (value: number): LightIntensity => value as LightIntensity,
  scale: (value: number): ScaleFactor => value as ScaleFactor,
} as const;

// Constantes físicas comunes
export const CONSTANTS = {
  // Índices de refracción estándar
  IOR: {
    VACUUM: 1.0 as IOR,
    AIR: 1.000293 as IOR,
    WATER: 1.333 as IOR,
    GLASS: 1.52 as IOR,
    DIAMOND: 2.417 as IOR,
    SAPPHIRE: 1.77 as IOR,
    EMERALD: 1.57 as IOR,
    CITRINE: 1.55 as IOR,
  } as const,

  // Frecuencias musicales
  FREQUENCY: {
    A4_STANDARD: 440 as FrequencyHz,
    A4_BELENTANI: 432 as FrequencyHz, // Frecuencia raíz del lore
    C4: 261.63 as FrequencyHz,
  } as const,

  // Longitudes de onda visibles (nm)
  WAVELENGTH: {
    RED: 650 as WavelengthNm,
    GREEN: 530 as WavelengthNm,
    BLUE: 450 as WavelengthNm,
    VIOLET: 400 as WavelengthNm,
  } as const,

  // Dispersión cromática (Abbe number inverso aprox)
  DISPERSION: {
    DIAMOND: 0.044 as Normalized,
    GLASS: 0.018 as Normalized,
    WATER: 0.012 as Normalized,
  } as const,
} as const;

// Utilidades de conversión
export const convert = {
  degToRad: (deg: Degrees): Radians => ((deg * Math.PI) / 180) as Radians,
  radToDeg: (rad: Radians): Degrees => ((rad * 180) / Math.PI) as Degrees,
  hzToPeriod: (hz: FrequencyHz): TimeSeconds => (1 / hz) as TimeSeconds,
  kmToM: (km: DistanceKm): DistanceM => (km * 1000) as DistanceM,
  mToKm: (m: DistanceM): DistanceKm => (m / 1000) as DistanceKm,
} as const;
