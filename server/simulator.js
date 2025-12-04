class MoistureSimulator {
  constructor() {
    // Sensor values
    this.moisture = 65; // Initial moisture level
    this.temperature = 22; // Initial temperature (°C)
    this.airHumidity = 55; // Initial air humidity (%)
    this.light = 50; // Initial light level (%)
    this.pH = 6.8; // Initial pH level

    // Watering state
    this.isWatering = false;
    this.manualMode = false; // Manual watering control
    this.wateringEvents = [];
    this.currentWateringStart = null;
    this.moistureAtWateringStart = null;

    // Time tracking for day/night cycle
    this.simulationStartTime = Date.now();

    // Extended configuration settings for all sensors (can be updated from client)
    this.config = {
      soilMoisture: { min: 60, optimalMin: 70, optimalMax: 80, max: 100 },
      soilTemperature: { min: 14, optimal: 20, max: 28 },
      airTemperature: { min: 15, optimal: 22, max: 30 },
      airHumidity: { min: 40, optimal: 60, max: 75 },
      lightLux: { min: 30000, optimal: 50000, max: 70000 },
      soilPH: { min: 6.0, optimal: 6.5, max: 7.0 }
    };

    // Track triggered automation actions
    this.triggeredActions = [];

    // Store automation rules (set from server.js)
    this.automationRules = {};

    // Cycle configuration for systematic sensor testing
    // Sensors cycle through: min → optimal → max → optimal → min (triangle wave)
    this.cycleConfig = {
      enabled: true,              // Enable/disable cycling mode
      cycleDuration: 120,         // Full cycle duration in seconds (default 2 min)
      tempPhaseOffset: 0,         // Temperature starts at min
      humidityPhaseOffset: 0.25,  // Humidity starts at optimal (going up)
      lightPhaseOffset: 0.5,      // Light starts at max (going down)
      phPhaseOffset: 0.75         // pH starts at optimal (going down)
    };
  }

  setAutomationRules(rules) {
    this.automationRules = rules || {};
  }

  // Calculate triangle wave value for systematic cycling through min → optimal → max → optimal → min
  getTriangleWaveValue(min, optimal, max, phaseOffset = 0) {
    const elapsed = (Date.now() - this.simulationStartTime) / 1000;
    const cyclePosition = ((elapsed / this.cycleConfig.cycleDuration) + phaseOffset) % 1;

    // Triangle wave phases:
    // 0.00 - 0.25: min → optimal
    // 0.25 - 0.50: optimal → max
    // 0.50 - 0.75: max → optimal
    // 0.75 - 1.00: optimal → min

    if (cyclePosition < 0.25) {
      // min → optimal
      const t = cyclePosition / 0.25;
      return min + (optimal - min) * t;
    } else if (cyclePosition < 0.5) {
      // optimal → max
      const t = (cyclePosition - 0.25) / 0.25;
      return optimal + (max - optimal) * t;
    } else if (cyclePosition < 0.75) {
      // max → optimal
      const t = (cyclePosition - 0.5) / 0.25;
      return max - (max - optimal) * t;
    } else {
      // optimal → min
      const t = (cyclePosition - 0.75) / 0.25;
      return optimal - (optimal - min) * t;
    }
  }

  updateConfig(newConfig) {
    // Handle legacy format (backward compatibility)
    if (newConfig.minThreshold !== undefined) {
      this.config.soilMoisture = {
        min: newConfig.minThreshold,
        optimalMin: newConfig.optimalMin,
        optimalMax: newConfig.optimalMax,
        max: 100
      };
    }

    // Handle new extended format with all thresholds
    if (newConfig.thresholds) {
      if (newConfig.thresholds.soilMoisture) {
        const sm = newConfig.thresholds.soilMoisture;
        this.config.soilMoisture = {
          min: sm.min,
          optimalMin: Array.isArray(sm.optimal) ? sm.optimal[0] : sm.optimal,
          optimalMax: Array.isArray(sm.optimal) ? sm.optimal[1] : sm.optimal,
          max: sm.max || 100
        };
      }
      if (newConfig.thresholds.soilTemperature) {
        this.config.soilTemperature = newConfig.thresholds.soilTemperature;
      }
      if (newConfig.thresholds.airTemperature) {
        this.config.airTemperature = newConfig.thresholds.airTemperature;
      }
      if (newConfig.thresholds.airHumidity) {
        this.config.airHumidity = newConfig.thresholds.airHumidity;
      }
      if (newConfig.thresholds.lightLux) {
        this.config.lightLux = newConfig.thresholds.lightLux;
      }
      if (newConfig.thresholds.soilPH) {
        this.config.soilPH = newConfig.thresholds.soilPH;
      }
    }

    console.log('Configuration updated:', this.config);
  }

  simulate() {
    // Simulate all sensors
    this.simulateMoisture();
    this.simulateTemperature();
    this.simulateAirHumidity();
    this.simulateLight();
    this.simulatepH();

    // Evaluate automation rules
    this.evaluateRules();
  }

  evaluateRules() {
    this.triggeredActions = [];

    const sensorValues = {
      soil_moisture: this.moisture,
      soil_temperature: this.temperature, // Using air temp as proxy
      air_temperature: this.temperature,
      air_humidity: this.airHumidity,
      light_lux: this.light * 600, // Convert % to approximate lux (60000 max)
      soil_ph: this.pH
    };

    const configMapping = {
      soil_moisture: this.config.soilMoisture,
      soil_temperature: this.config.soilTemperature,
      air_temperature: this.config.airTemperature,
      air_humidity: this.config.airHumidity,
      light_lux: this.config.lightLux,
      soil_ph: this.config.soilPH
    };

    if (!this.automationRules) return;

    Object.entries(this.automationRules).forEach(([sensor, ruleSet]) => {
      const config = configMapping[sensor];
      if (!config) return;

      const value = sensorValues[sensor];
      const minThreshold = config.min;
      const maxThreshold = config.max;
      const optimalThreshold = config.optimalMin || config.optimal;

      if (value < minThreshold && ruleSet.if_below_min) {
        this.triggeredActions.push({
          sensor,
          condition: 'below_min',
          action: ruleSet.if_below_min,
          value: Math.round(value * 100) / 100,
          threshold: minThreshold
        });
      } else if (value < optimalThreshold && ruleSet.if_below_optimal) {
        this.triggeredActions.push({
          sensor,
          condition: 'below_optimal',
          action: ruleSet.if_below_optimal,
          value: Math.round(value * 100) / 100,
          threshold: optimalThreshold
        });
      } else if (value > maxThreshold && ruleSet.if_above_max) {
        this.triggeredActions.push({
          sensor,
          condition: 'above_max',
          action: ruleSet.if_above_max,
          value: Math.round(value * 100) / 100,
          threshold: maxThreshold
        });
      }
    });
  }

  simulateMoisture() {
    const moistureConfig = this.config.soilMoisture;

    // If not watering, moisture slowly decreases with random fluctuation
    if (!this.isWatering) {
      // Random decrease (evaporation, plant absorption)
      const decrease = Math.random() * 1.5 + 0.3; // 0.3 to 1.8% per cycle
      this.moisture = Math.max(0, this.moisture - decrease);

      // Add some random natural variation
      this.moisture += (Math.random() - 0.5) * 0.5;

      // Check if watering should start (only if not in manual mode)
      if (!this.manualMode && this.moisture <= moistureConfig.min) {
        this.startWatering();
      }
    } else {
      // During watering, moisture increases
      const increase = Math.random() * 2 + 1; // 1 to 3% per cycle
      this.moisture = Math.min(100, this.moisture + increase);

      // Check if optimal level reached (only if not in manual mode)
      if (!this.manualMode && this.moisture >= moistureConfig.optimalMin) {
        this.stopWatering();
      }
    }

    // Ensure moisture stays within bounds
    this.moisture = Math.max(0, Math.min(100, this.moisture));
  }

  simulateTemperature() {
    const cfg = this.config.airTemperature;

    // Systematic cycling through min → optimal → max → optimal → min
    this.temperature = this.getTriangleWaveValue(
      cfg.min,
      cfg.optimal,
      cfg.max,
      this.cycleConfig.tempPhaseOffset
    );

    // Add small noise for realism
    this.temperature += (Math.random() - 0.5) * 0.2;
  }

  simulateAirHumidity() {
    const cfg = this.config.airHumidity;

    // Systematic cycling through min → optimal → max → optimal → min
    this.airHumidity = this.getTriangleWaveValue(
      cfg.min,
      cfg.optimal,
      cfg.max,
      this.cycleConfig.humidityPhaseOffset
    );

    // Add small noise for realism
    this.airHumidity += (Math.random() - 0.5) * 0.5;
  }

  simulateLight() {
    const cfg = this.config.lightLux;

    // Convert lux thresholds to percentage (0-100%)
    // Assuming max possible lux is around 60000
    const minPercent = (cfg.min / 60000) * 100;
    const optPercent = (cfg.optimal / 60000) * 100;
    const maxPercent = (cfg.max / 60000) * 100;

    // Systematic cycling through min → optimal → max → optimal → min
    this.light = this.getTriangleWaveValue(
      minPercent,
      optPercent,
      maxPercent,
      this.cycleConfig.lightPhaseOffset
    );

    // Add small noise for realism
    this.light += (Math.random() - 0.5) * 1;

    // Ensure light stays within 0-100%
    this.light = Math.max(0, Math.min(100, this.light));
  }

  simulatepH() {
    const cfg = this.config.soilPH;

    // Systematic cycling through min → optimal → max → optimal → min
    this.pH = this.getTriangleWaveValue(
      cfg.min,
      cfg.optimal,
      cfg.max,
      this.cycleConfig.phPhaseOffset
    );

    // Add tiny noise for realism
    this.pH += (Math.random() - 0.5) * 0.02;
  }

  startWatering() {
    if (!this.isWatering) {
      this.isWatering = true;
      this.currentWateringStart = new Date().toISOString();
      this.moistureAtWateringStart = Math.round(this.moisture * 10) / 10;
      console.log(`💧 Watering started at ${this.moisture.toFixed(1)}%`);
    }
  }

  stopWatering() {
    if (this.isWatering) {
      this.isWatering = false;
      const endTime = new Date();
      const startTime = new Date(this.currentWateringStart);
      const durationSec = Math.round((endTime - startTime) / 1000);

      const event = {
        start: this.currentWateringStart,
        end: endTime.toISOString(),
        durationSec: durationSec,
        moistureStart: this.moistureAtWateringStart,
        moistureEnd: Math.round(this.moisture * 10) / 10
      };

      this.wateringEvents.push(event);
      console.log(`💧 Watering stopped at ${this.moisture.toFixed(1)}% (duration: ${durationSec}s)`);

      // Keep only today's events
      this.cleanOldEvents();
    }
  }

  cleanOldEvents() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.wateringEvents = this.wateringEvents.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate >= today;
    });
  }

  // Manual watering control
  startManualWatering() {
    console.log('🎮 Manual watering mode activated');
    this.manualMode = true;
    this.startWatering();
  }

  stopManualWatering() {
    console.log('🎮 Manual watering mode deactivated');
    this.manualMode = false;
    if (this.isWatering) {
      this.stopWatering();
    }
  }

  getData() {
    return {
      timestamp: new Date().toISOString(),
      sensors: {
        soilMoisture: Math.round(this.moisture * 10) / 10,
        temperature: Math.round(this.temperature * 10) / 10,
        airHumidity: Math.round(this.airHumidity * 10) / 10,
        light: Math.round(this.light * 10) / 10,
        pH: Math.round(this.pH * 100) / 100
      },
      isWatering: this.isWatering,
      manualMode: this.manualMode,
      wateringEvents: this.wateringEvents,
      config: this.config,
      triggeredActions: this.triggeredActions
    };
  }
}

module.exports = MoistureSimulator;
