/**
 * Sensor Manager - manages sensor data and history
 */
class SensorManager {
  constructor(maxHistory = 50) {
    this.sensors = {};
    this.maxHistory = maxHistory;
    this.listeners = {};

    // Initialize sensors
    this.initializeSensors();
  }

  // Initialize sensor definitions
  initializeSensors() {
    const sensorDefinitions = {
      soilMoisture: {
        name: 'Soil Moisture',
        unit: '%',
        icon: 'droplet',
        ranges: {
          critical: { min: 0, max: 50, color: '#ef4444', label: 'Critical' },
          low: { min: 50, max: 60, color: '#f59e0b', label: 'Low' },
          optimal: { min: 60, max: 80, color: '#22c55e', label: 'Optimal' },
          high: { min: 80, max: 100, color: '#3b82f6', label: 'High' }
        }
      },
      temperature: {
        name: 'Temperature',
        unit: '°C',
        icon: 'thermometer',
        ranges: {
          cold: { min: 0, max: 18, color: '#3b82f6', label: 'Cold' },
          optimal: { min: 18, max: 28, color: '#22c55e', label: 'Optimal' },
          hot: { min: 28, max: 50, color: '#ef4444', label: 'Hot' }
        }
      },
      airHumidity: {
        name: 'Air Humidity',
        unit: '%',
        icon: 'cloud',
        ranges: {
          dry: { min: 0, max: 40, color: '#f59e0b', label: 'Dry' },
          optimal: { min: 40, max: 70, color: '#22c55e', label: 'Optimal' },
          humid: { min: 70, max: 100, color: '#3b82f6', label: 'Humid' }
        }
      },
      light: {
        name: 'Light Level',
        unit: '%',
        icon: 'sun',
        ranges: {
          dark: { min: 0, max: 20, color: '#9ca3af', label: 'Dark' },
          dim: { min: 20, max: 50, color: '#f59e0b', label: 'Dim' },
          bright: { min: 50, max: 100, color: '#fbbf24', label: 'Bright' }
        }
      },
      pH: {
        name: 'Soil pH',
        unit: '',
        icon: 'activity',
        ranges: {
          acidic: { min: 0, max: 6.0, color: '#f59e0b', label: 'Acidic' },
          optimal: { min: 6.0, max: 7.5, color: '#22c55e', label: 'Optimal' },
          alkaline: { min: 7.5, max: 14, color: '#3b82f6', label: 'Alkaline' }
        }
      }
    };

    // Initialize each sensor with definition and empty history
    Object.keys(sensorDefinitions).forEach(key => {
      this.sensors[key] = {
        ...sensorDefinitions[key],
        value: null,
        history: [],
        lastUpdate: null,
        status: 'unknown'
      };
    });
  }

  // Update sensor value
  updateSensor(name, value, timestamp) {
    if (!this.sensors[name]) {
      console.warn(`Unknown sensor: ${name}`);
      return;
    }

    const sensor = this.sensors[name];
    sensor.value = value;
    sensor.lastUpdate = timestamp || new Date().toISOString();

    // Add to history
    sensor.history.push({
      value: value,
      timestamp: sensor.lastUpdate
    });

    // Trim history if needed
    if (sensor.history.length > this.maxHistory) {
      sensor.history.shift();
    }

    // Update status based on ranges
    sensor.status = this.getSensorStatus(name, value);

    // Trigger update event
    this.trigger('sensorUpdate', { name, sensor });
  }

  // Get sensor status based on value and ranges
  getSensorStatus(name, value) {
    const sensor = this.sensors[name];
    if (!sensor || !sensor.ranges) return 'unknown';

    for (const [status, range] of Object.entries(sensor.ranges)) {
      // Use <= for max to include edge values (e.g., 100%)
      if (value >= range.min && value <= range.max) {
        return status;
      }
    }

    return 'unknown';
  }

  // Get sensor range info
  getSensorRange(name, value) {
    const sensor = this.sensors[name];
    if (!sensor || !sensor.ranges) return null;

    for (const range of Object.values(sensor.ranges)) {
      // Use <= for max to include edge values (e.g., 100%)
      if (value >= range.min && value <= range.max) {
        return range;
      }
    }

    return null;
  }

  // Get sensor data
  getSensor(name) {
    return this.sensors[name];
  }

  // Get all sensors
  getAllSensors() {
    return this.sensors;
  }

  // Get sensor history
  getHistory(name, limit = null) {
    const sensor = this.sensors[name];
    if (!sensor) return [];

    if (limit) {
      return sensor.history.slice(-limit);
    }

    return sensor.history;
  }

  // Get statistics for a sensor
  getStatistics(name) {
    const history = this.getHistory(name);
    if (history.length === 0) {
      return { min: 0, max: 0, avg: 0, current: 0 };
    }

    const values = history.map(h => h.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const current = values[values.length - 1];

    return {
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      avg: Math.round(avg * 100) / 100,
      current: Math.round(current * 100) / 100
    };
  }

  // Register event listener
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  // Trigger event
  trigger(event, data) {
    if (!this.listeners[event]) return;

    this.listeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  // Clear all history
  clearHistory() {
    Object.values(this.sensors).forEach(sensor => {
      sensor.history = [];
    });
  }
}
