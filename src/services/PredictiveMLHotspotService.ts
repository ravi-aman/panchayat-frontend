// ===== PREDICTIVE ML HOTSPOT DETECTION =====
// TensorFlow.js powered machine learning for civic activity prediction
// Uber-style predictive analytics for proactive planning

export interface HotspotPrediction {
  location: [number, number]; // [longitude, latitude]
  confidence: number; // 0-1
  predictedValue: number;
  timeframe: 'next-hour' | 'next-day' | 'next-week';
  factors: PredictionFactor[];
  accuracy: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface PredictionFactor {
  name: string;
  weight: number;
  value: number;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface TrainingData {
  timestamp: number;
  location: [number, number];
  value: number;
  weather?: WeatherData;
  events?: EventData[];
  demographics?: DemographicsData;
  historical?: HistoricalPattern;
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  visibility: number;
}

export interface EventData {
  type: 'festival' | 'meeting' | 'construction' | 'emergency' | 'sports';
  distance: number; // meters from location
  capacity: number;
  duration: number; // minutes
}

export interface DemographicsData {
  population: number;
  density: number;
  ageGroups: Record<string, number>;
  income: number;
  education: number;
}

export interface HistoricalPattern {
  hourOfDay: number;
  dayOfWeek: number;
  dayOfMonth: number;
  month: number;
  season: 'spring' | 'summer' | 'fall' | 'winter';
  isHoliday: boolean;
  isWeekend: boolean;
}

export interface ModelConfig {
  modelType: 'neural-network' | 'random-forest' | 'linear-regression' | 'lstm' | 'ensemble';
  features: string[];
  targetVariable: string;
  timeWindow: number; // hours
  predictionHorizon: number; // hours
  updateFrequency: number; // milliseconds
  accuracyThreshold: number;
}

/**
 * Predictive ML Hotspot Detection Service
 * Uses TensorFlow.js for client-side machine learning
 * Predicts civic activity hotspots based on multiple factors
 */
export class PredictiveMLHotspotService {
  private model: any = null; // TensorFlow.js model
  private isTraining: boolean = false;
  private trainingData: TrainingData[] = [];
  private predictions: Map<string, HotspotPrediction> = new Map();
  private modelConfig: ModelConfig;
  private featureScaler: any = null;
  private predictionTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.modelConfig = this.getDefaultConfig();
    this.initializeModel();
  }

  /**
   * Get default model configuration
   */
  private getDefaultConfig(): ModelConfig {
    return {
      modelType: 'neural-network',
      features: [
        'hour_of_day',
        'day_of_week',
        'month',
        'temperature',
        'precipitation',
        'population_density',
        'distance_to_events',
        'historical_avg',
        'recent_trend'
      ],
      targetVariable: 'civic_activity_level',
      timeWindow: 24, // 24 hours
      predictionHorizon: 4, // 4 hours ahead
      updateFrequency: 300000, // 5 minutes
      accuracyThreshold: 0.75
    };
  }

  /**
   * Initialize TensorFlow.js model
   */
  private async initializeModel(): Promise<void> {
    try {
      // Dynamically import TensorFlow.js
      const tf = await import('@tensorflow/tfjs');
      
      // Create neural network model
      this.model = tf.sequential({
        layers: [
          tf.layers.dense({
            inputShape: [this.modelConfig.features.length],
            units: 64,
            activation: 'relu',
            kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
          }),
          tf.layers.dropout({ rate: 0.3 }),
          tf.layers.dense({
            units: 32,
            activation: 'relu',
            kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
          }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({
            units: 16,
            activation: 'relu'
          }),
          tf.layers.dense({
            units: 1,
            activation: 'sigmoid' // Output 0-1 for normalized activity level
          })
        ]
      });

      // Compile model with optimizer
      this.model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'meanSquaredError',
        metrics: ['mae']
      });

      console.log('ML model initialized successfully');
      this.startPredictionLoop();
    } catch (error) {
      console.error('Failed to initialize ML model:', error);
      // Fallback to simple heuristic predictions
      this.initializeFallbackModel();
    }
  }

  /**
   * Initialize fallback heuristic model
   */
  private initializeFallbackModel(): void {
    console.log('Using fallback heuristic model for predictions');
    this.startPredictionLoop();
  }

  /**
   * Add training data point
   */
  addTrainingData(data: TrainingData): void {
    this.trainingData.push(data);
    
    // Keep only recent data for training
    const maxDataPoints = 10000;
    if (this.trainingData.length > maxDataPoints) {
      this.trainingData = this.trainingData.slice(-maxDataPoints);
    }

    // Auto-retrain if enough new data
    if (this.trainingData.length % 100 === 0 && !this.isTraining) {
      this.scheduleRetraining();
    }
  }

  /**
   * Train the model with collected data
   */
  async trainModel(): Promise<void> {
    if (this.isTraining || this.trainingData.length < 100) return;

    this.isTraining = true;
    console.log('Starting model training...');

    try {
      if (this.model) {
        await this.trainTensorFlowModel();
      } else {
        await this.trainFallbackModel();
      }
      
      console.log('Model training completed');
    } catch (error) {
      console.error('Model training failed:', error);
    } finally {
      this.isTraining = false;
    }
  }

  /**
   * Train TensorFlow.js model
   */
  private async trainTensorFlowModel(): Promise<void> {
    const tf = await import('@tensorflow/tfjs');
    
    // Prepare training data
    const features = this.trainingData.map(data => this.extractFeatures(data));
    const targets = this.trainingData.map(data => this.normalizeTarget(data.value));

    // Convert to tensors
    const featureTensor = tf.tensor2d(features);
    const targetTensor = tf.tensor2d(targets, [targets.length, 1]);

    // Normalize features
    this.featureScaler = this.createFeatureScaler(featureTensor);
    const normalizedFeatures = this.featureScaler.transform(featureTensor);

    // Split data for training and validation
    const splitIndex = Math.floor(features.length * 0.8);
    
    const trainFeatures = normalizedFeatures.slice([0, 0], [splitIndex, -1]);
    const trainTargets = targetTensor.slice([0, 0], [splitIndex, -1]);
    const valFeatures = normalizedFeatures.slice([splitIndex, 0], [-1, -1]);
    const valTargets = targetTensor.slice([splitIndex, 0], [-1, -1]);

    // Train model
    await this.model.fit(trainFeatures, trainTargets, {
      epochs: 50,
      batchSize: 32,
      validationData: [valFeatures, valTargets],
      callbacks: {
        onEpochEnd: (epoch: number, logs: any) => {
          if (epoch % 10 === 0) {
            console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}, val_loss = ${logs.val_loss.toFixed(4)}`);
          }
        }
      }
    });

    // Cleanup tensors
    featureTensor.dispose();
    targetTensor.dispose();
    normalizedFeatures.dispose();
    trainFeatures.dispose();
    trainTargets.dispose();
    valFeatures.dispose();
    valTargets.dispose();
  }

  /**
   * Train fallback heuristic model
   */
  private async trainFallbackModel(): Promise<void> {
    // Simple statistical analysis for fallback
    const hourlyPatterns = new Map<number, number[]>();
    const dailyPatterns = new Map<number, number[]>();
    
    this.trainingData.forEach(data => {
      const date = new Date(data.timestamp);
      const hour = date.getHours();
      const day = date.getDay();
      
      if (!hourlyPatterns.has(hour)) hourlyPatterns.set(hour, []);
      if (!dailyPatterns.has(day)) dailyPatterns.set(day, []);
      
      hourlyPatterns.get(hour)!.push(data.value);
      dailyPatterns.get(day)!.push(data.value);
    });

    // Store patterns for prediction
    (this as any).hourlyAverages = new Map();
    (this as any).dailyAverages = new Map();
    
    hourlyPatterns.forEach((values, hour) => {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      (this as any).hourlyAverages.set(hour, avg);
    });

    dailyPatterns.forEach((values, day) => {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      (this as any).dailyAverages.set(day, avg);
    });
  }

  /**
   * Extract features from training data
   */
  private extractFeatures(data: TrainingData): number[] {
    const date = new Date(data.timestamp);
    const historical = data.historical || this.inferHistoricalPattern(date);
    
    return [
      historical.hourOfDay / 24,
      historical.dayOfWeek / 7,
      historical.month / 12,
      (data.weather?.temperature || 20) / 40, // normalize 0-40°C to 0-1
      (data.weather?.precipitation || 0) / 100, // normalize mm to 0-1
      Math.log10((data.demographics?.density || 100) + 1) / 5, // log scale
      this.calculateEventProximity(data),
      this.getHistoricalAverage(data.location, historical),
      this.getRecentTrend(data.location)
    ];
  }

  /**
   * Normalize target value
   */
  private normalizeTarget(value: number): number {
    // Assuming civic activity values range 0-100
    return Math.min(Math.max(value / 100, 0), 1);
  }

  /**
   * Create feature scaler
   */
  private createFeatureScaler(features: any): any {
    // Simple min-max scaler
    const min = features.min(0);
    const max = features.max(0);
    const range = max.sub(min);
    
    return {
      transform: (data: any) => data.sub(min).div(range.add(1e-8)),
      min,
      max,
      range
    };
  }

  /**
   * Generate predictions for given locations
   */
  async generatePredictions(
    locations: [number, number][],
    timeframe: HotspotPrediction['timeframe'] = 'next-hour'
  ): Promise<HotspotPrediction[]> {
    const predictions: HotspotPrediction[] = [];
    
    for (const location of locations) {
      try {
        const prediction = await this.predictSingleLocation(location, timeframe);
        if (prediction) {
          predictions.push(prediction);
        }
      } catch (error) {
        console.error(`Failed to predict for location ${location}:`, error);
      }
    }

    return predictions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Predict for single location
   */
  private async predictSingleLocation(
    location: [number, number],
    timeframe: HotspotPrediction['timeframe']
  ): Promise<HotspotPrediction | null> {
    const currentTime = Date.now();
    const futureTime = this.calculateFutureTime(currentTime, timeframe);
    
    // Gather current context
    const contextData = await this.gatherContextData(location, futureTime);
    
    let predictedValue: number;
    let confidence: number;
    
    if (this.model && this.featureScaler) {
      // Use TensorFlow model
      const result = await this.predictWithTensorFlow(contextData);
      predictedValue = result.value;
      confidence = result.confidence;
    } else {
      // Use fallback heuristic
      const result = this.predictWithHeuristic(contextData);
      predictedValue = result.value;
      confidence = result.confidence;
    }

    // Calculate factors that influenced the prediction
    const factors = this.calculatePredictionFactors(contextData);
    
    // Determine trend
    const trend = this.calculateTrend(location);

    return {
      location,
      confidence,
      predictedValue,
      timeframe,
      factors,
      accuracy: this.estimateAccuracy(location),
      trend
    };
  }

  /**
   * Predict using TensorFlow model
   */
  private async predictWithTensorFlow(contextData: any): Promise<{ value: number; confidence: number }> {
    const tf = await import('@tensorflow/tfjs');
    
    const features = this.extractFeatures(contextData);
    const featureTensor = tf.tensor2d([features]);
    const normalizedFeatures = this.featureScaler.transform(featureTensor);
    
    const prediction = this.model.predict(normalizedFeatures) as any;
    const result = await prediction.data();
    
    // Cleanup
    featureTensor.dispose();
    normalizedFeatures.dispose();
    prediction.dispose();
    
    return {
      value: result[0] * 100, // denormalize
      confidence: Math.min(result[0] * 2, 1) // rough confidence estimate
    };
  }

  /**
   * Predict using heuristic fallback
   */
  private predictWithHeuristic(contextData: any): { value: number; confidence: number } {
    const date = new Date(contextData.timestamp);
    const hour = date.getHours();
    const day = date.getDay();
    
    const hourlyAvg = (this as any).hourlyAverages?.get(hour) || 50;
    const dailyAvg = (this as any).dailyAverages?.get(day) || 50;
    
    // Simple weighted average
    let baseValue = (hourlyAvg * 0.6 + dailyAvg * 0.4);
    
    // Weather adjustment
    if (contextData.weather?.precipitation > 5) {
      baseValue *= 0.7; // reduce activity in rain
    }
    
    if (contextData.weather?.temperature < 5 || contextData.weather?.temperature > 35) {
      baseValue *= 0.8; // reduce activity in extreme temperatures
    }
    
    // Event proximity adjustment
    const eventBoost = this.calculateEventProximity(contextData);
    baseValue *= (1 + eventBoost * 0.5);
    
    return {
      value: Math.max(0, Math.min(100, baseValue)),
      confidence: 0.6 // lower confidence for heuristic
    };
  }

  /**
   * Calculate future time based on timeframe
   */
  private calculateFutureTime(currentTime: number, timeframe: HotspotPrediction['timeframe']): number {
    const multipliers = {
      'next-hour': 60 * 60 * 1000,
      'next-day': 24 * 60 * 60 * 1000,
      'next-week': 7 * 24 * 60 * 60 * 1000
    };
    
    return currentTime + multipliers[timeframe];
  }

  /**
   * Gather context data for prediction
   */
  private async gatherContextData(location: [number, number], timestamp: number): Promise<TrainingData> {
    const date = new Date(timestamp);
    
    return {
      timestamp,
      location,
      value: 0, // placeholder
      weather: await this.fetchWeatherData(location, timestamp),
      events: await this.fetchNearbyEvents(location, timestamp),
      demographics: await this.fetchDemographicsData(location),
      historical: this.inferHistoricalPattern(date)
    };
  }

  /**
   * Fetch weather data (mock implementation)
   */
  private async fetchWeatherData(_location: [number, number], _timestamp: number): Promise<WeatherData> {
    // Mock weather data - replace with real API call
    return {
      temperature: 20 + Math.random() * 15,
      humidity: 50 + Math.random() * 30,
      precipitation: Math.random() * 10,
      windSpeed: Math.random() * 20,
      visibility: 8 + Math.random() * 2
    };
  }

  /**
   * Fetch nearby events (mock implementation)
   */
  private async fetchNearbyEvents(_location: [number, number], _timestamp: number): Promise<EventData[]> {
    // Mock events data - replace with real API call
    return [
      {
        type: 'meeting',
        distance: 500 + Math.random() * 2000,
        capacity: 50 + Math.random() * 200,
        duration: 60 + Math.random() * 120
      }
    ];
  }

  /**
   * Fetch demographics data (mock implementation)
   */
  private async fetchDemographicsData(_location: [number, number]): Promise<DemographicsData> {
    // Mock demographics - replace with real data
    return {
      population: 1000 + Math.random() * 10000,
      density: 100 + Math.random() * 500,
      ageGroups: {
        '0-18': 0.2,
        '18-35': 0.3,
        '35-55': 0.3,
        '55+': 0.2
      },
      income: 30000 + Math.random() * 50000,
      education: Math.random()
    };
  }

  /**
   * Infer historical pattern from date
   */
  private inferHistoricalPattern(date: Date): HistoricalPattern {
    const month = date.getMonth();
    const season = this.getSeason(month);
    
    return {
      hourOfDay: date.getHours(),
      dayOfWeek: date.getDay(),
      dayOfMonth: date.getDate(),
      month: month,
      season,
      isHoliday: this.isHoliday(date),
      isWeekend: date.getDay() === 0 || date.getDay() === 6
    };
  }

  /**
   * Get season from month
   */
  private getSeason(month: number): HistoricalPattern['season'] {
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  /**
   * Check if date is a holiday (simplified)
   */
  private isHoliday(date: Date): boolean {
    // Simplified holiday detection - extend as needed
    const month = date.getMonth();
    const day = date.getDate();
    
    // January 1 (New Year)
    if (month === 0 && day === 1) return true;
    // December 25 (Christmas)
    if (month === 11 && day === 25) return true;
    
    return false;
  }

  /**
   * Calculate event proximity factor
   */
  private calculateEventProximity(data: TrainingData): number {
    if (!data.events || data.events.length === 0) return 0;
    
    let totalInfluence = 0;
    data.events.forEach(event => {
      const distanceFactor = Math.max(0, 1 - event.distance / 5000); // 5km max influence
      const capacityFactor = Math.min(event.capacity / 1000, 1); // normalize capacity
      totalInfluence += distanceFactor * capacityFactor;
    });
    
    return Math.min(totalInfluence, 1);
  }

  /**
   * Get historical average for location
   */
  private getHistoricalAverage(_location: [number, number], pattern: HistoricalPattern): number {
    // Find similar historical data points
    const similarData = this.trainingData.filter(data => {
      const hist = data.historical || this.inferHistoricalPattern(new Date(data.timestamp));
      return Math.abs(hist.hourOfDay - pattern.hourOfDay) <= 2 &&
             hist.dayOfWeek === pattern.dayOfWeek;
    });
    
    if (similarData.length === 0) return 0.5;
    
    const avg = similarData.reduce((sum, data) => sum + data.value, 0) / similarData.length;
    return Math.min(avg / 100, 1);
  }

  /**
   * Get recent trend for location
   */
  private getRecentTrend(_location: [number, number]): number {
    const recentData = this.trainingData
      .filter(data => Date.now() - data.timestamp < 7 * 24 * 60 * 60 * 1000) // last week
      .sort((a, b) => a.timestamp - b.timestamp);
    
    if (recentData.length < 2) return 0;
    
    const firstHalf = recentData.slice(0, Math.floor(recentData.length / 2));
    const secondHalf = recentData.slice(Math.floor(recentData.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, d) => sum + d.value, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.value, 0) / secondHalf.length;
    
    return (secondAvg - firstAvg) / 100; // normalized trend
  }

  /**
   * Calculate prediction factors
   */
  private calculatePredictionFactors(contextData: any): PredictionFactor[] {
    const factors: PredictionFactor[] = [];
    
    const date = new Date(contextData.timestamp);
    const hour = date.getHours();
    
    // Time of day factor
    factors.push({
      name: 'Time of Day',
      weight: 0.3,
      value: hour,
      impact: (hour >= 9 && hour <= 17) ? 'positive' : 'negative'
    });
    
    // Weather factor
    if (contextData.weather) {
      factors.push({
        name: 'Weather',
        weight: 0.2,
        value: contextData.weather.temperature,
        impact: (contextData.weather.precipitation < 1) ? 'positive' : 'negative'
      });
    }
    
    // Event proximity factor
    const eventProximity = this.calculateEventProximity(contextData);
    factors.push({
      name: 'Nearby Events',
      weight: 0.25,
      value: eventProximity,
      impact: eventProximity > 0.3 ? 'positive' : 'neutral'
    });
    
    // Population density factor
    if (contextData.demographics) {
      factors.push({
        name: 'Population Density',
        weight: 0.15,
        value: contextData.demographics.density,
        impact: contextData.demographics.density > 200 ? 'positive' : 'neutral'
      });
    }
    
    return factors;
  }

  /**
   * Calculate trend for location
   */
  private calculateTrend(location: [number, number]): HotspotPrediction['trend'] {
    const trendValue = this.getRecentTrend(location);
    
    if (trendValue > 0.1) return 'increasing';
    if (trendValue < -0.1) return 'decreasing';
    return 'stable';
  }

  /**
   * Estimate prediction accuracy
   */
  private estimateAccuracy(location: [number, number]): number {
    // Base accuracy depends on available data
    const localDataCount = this.trainingData.filter(data => {
      const distance = this.calculateDistance(data.location, location);
      return distance < 1000; // within 1km
    }).length;
    
    const baseAccuracy = Math.min(localDataCount / 100, 0.9);
    
    // Adjust for model type
    if (this.model && this.featureScaler) {
      return Math.min(baseAccuracy + 0.1, 0.95);
    }
    
    return baseAccuracy;
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(point1: [number, number], point2: [number, number]): number {
    const [lon1, lat1] = point1;
    const [lon2, lat2] = point2;
    
    const R = 6371000; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
  }

  /**
   * Start prediction loop
   */
  private startPredictionLoop(): void {
    this.predictionTimer = setInterval(() => {
      this.updatePredictionsCache();
    }, this.modelConfig.updateFrequency);
  }

  /**
   * Update predictions cache
   */
  private async updatePredictionsCache(): Promise<void> {
    // This would typically be called with a set of important locations
    // For now, we'll just log that the update would happen
    console.log('Updating prediction cache...');
  }

  /**
   * Schedule model retraining
   */
  private scheduleRetraining(): void {
    // Schedule retraining for when system is idle
    setTimeout(() => {
      this.trainModel();
    }, 1000);
  }

  /**
   * Get cached predictions
   */
  getCachedPredictions(): HotspotPrediction[] {
    return Array.from(this.predictions.values());
  }

  /**
   * Update model configuration
   */
  updateConfig(newConfig: Partial<ModelConfig>): void {
    this.modelConfig = { ...this.modelConfig, ...newConfig };
  }

  /**
   * Export model for backup
   */
  async exportModel(): Promise<any> {
    if (this.model) {
      return await this.model.save('downloads://civic-hotspot-model');
    }
    return null;
  }

  /**
   * Import model from backup
   */
  async importModel(modelData: any): Promise<void> {
    try {
      const tf = await import('@tensorflow/tfjs');
      this.model = await tf.loadLayersModel(modelData);
      console.log('Model imported successfully');
    } catch (error) {
      console.error('Failed to import model:', error);
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.predictionTimer) {
      clearInterval(this.predictionTimer);
      this.predictionTimer = null;
    }
    
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    
    if (this.featureScaler) {
      this.featureScaler.min?.dispose();
      this.featureScaler.max?.dispose();
      this.featureScaler.range?.dispose();
      this.featureScaler = null;
    }
    
    this.trainingData = [];
    this.predictions.clear();
  }
}

// Singleton instance
export const predictiveMLHotspotService = new PredictiveMLHotspotService();