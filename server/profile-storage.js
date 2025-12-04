const fs = require('fs');
const path = require('path');

class ProfileStorage {
  constructor() {
    this.profilesFile = path.join(__dirname, 'profiles.json');

    // Load configuration files
    this.productStandards = this.loadJSON(path.join(__dirname, '..', 'product-standart-values.json'));
    this.automationRules = this.loadJSON(path.join(__dirname, '..', 'automation-rules.json'));
    this.alertMessages = this.loadJSON(path.join(__dirname, '..', 'alerts.json'));

    // Product metadata (icons, names, descriptions in Russian)
    this.productMeta = {
      strawberry: { name: 'Клубника', icon: '🍓', description: 'Ягодная культура, любит влагу' },
      tomato: { name: 'Помидор', icon: '🍅', description: 'Овощная культура, средняя влажность' },
      raspberry: { name: 'Малина', icon: '🫐', description: 'Ягодный кустарник' },
      cucumber: { name: 'Огурец', icon: '🥒', description: 'Влаголюбивая культура' },
      potato: { name: 'Картофель', icon: '🥔', description: 'Корнеплод, умеренная влажность' },
      grape: { name: 'Виноград', icon: '🍇', description: 'Лоза, умеренный полив' },
      cabbage: { name: 'Капуста', icon: '🥬', description: 'Листовой овощ, высокая влажность' },
      watermelon: { name: 'Арбуз', icon: '🍉', description: 'Бахчевая культура' },
      lemon: { name: 'Лимон', icon: '🍋', description: 'Цитрусовое дерево' }
    };

    // Get list of default product IDs
    this.defaultProductIds = Object.keys(this.productMeta);

    this.profiles = this.loadProfiles();
  }

  // Load JSON file helper
  loadJSON(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error(`Error loading ${filePath}:`, error);
    }
    return null;
  }

  // Load profiles from file
  loadProfiles() {
    try {
      if (fs.existsSync(this.profilesFile)) {
        const data = fs.readFileSync(this.profilesFile, 'utf8');
        const savedProfiles = JSON.parse(data);

        // Merge saved custom profiles with default product profiles
        const defaultProfiles = this.getDefaultProfiles();
        const customProfiles = savedProfiles.profiles.filter(
          p => !this.defaultProductIds.includes(p.id)
        );

        return {
          profiles: [...defaultProfiles.profiles, ...customProfiles]
        };
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
    }

    // Return default profiles if file doesn't exist or error occurs
    return this.getDefaultProfiles();
  }

  // Transform product standards JSON to profile format
  transformProductToProfile(productId, productData) {
    const meta = this.productMeta[productId];
    if (!meta) return null;

    return {
      id: productId,
      name: meta.name,
      icon: meta.icon,
      description: meta.description,
      thresholds: {
        soilMoisture: {
          min: productData.soil_moisture.min,
          optimal: [productData.soil_moisture.optimal, productData.soil_moisture.optimal],
          max: productData.soil_moisture.max
        },
        soilTemperature: {
          min: productData.soil_temperature.min,
          optimal: productData.soil_temperature.optimal,
          max: productData.soil_temperature.max
        },
        airTemperature: {
          min: productData.air_temperature.min,
          optimal: productData.air_temperature.optimal,
          max: productData.air_temperature.max
        },
        airHumidity: {
          min: productData.air_humidity.min,
          optimal: productData.air_humidity.optimal,
          max: productData.air_humidity.max
        },
        lightLux: {
          min: productData.light_lux.min,
          optimal: productData.light_lux.optimal,
          max: productData.light_lux.max
        },
        soilPH: {
          min: productData.soil_ph.min,
          optimal: productData.soil_ph.optimal,
          max: productData.soil_ph.max
        }
      }
    };
  }

  // Get default plant profiles from product-standart-values.json
  getDefaultProfiles() {
    const profiles = [];

    if (this.productStandards) {
      for (const [productId, productData] of Object.entries(this.productStandards)) {
        const profile = this.transformProductToProfile(productId, productData);
        if (profile) {
          profiles.push(profile);
        }
      }
    }

    // If no products loaded, return fallback
    if (profiles.length === 0) {
      console.warn('No product standards loaded, using fallback profiles');
      return this.getFallbackProfiles();
    }

    return { profiles };
  }

  // Fallback profiles in case JSON files are not available
  getFallbackProfiles() {
    return {
      profiles: [
        {
          id: 'tomato',
          name: 'Помидор',
          icon: '🍅',
          thresholds: {
            soilMoisture: { min: 55, optimal: [65, 65], max: 75 },
            soilTemperature: { min: 14, optimal: 20, max: 28 },
            airTemperature: { min: 15, optimal: 22, max: 30 },
            airHumidity: { min: 40, optimal: 60, max: 75 },
            lightLux: { min: 30000, optimal: 50000, max: 70000 },
            soilPH: { min: 6.0, optimal: 6.5, max: 7.0 }
          },
          description: 'Овощная культура, средняя влажность'
        }
      ]
    };
  }

  // Save profiles to file
  saveProfiles() {
    try {
      fs.writeFileSync(this.profilesFile, JSON.stringify(this.profiles, null, 2));
      console.log('✅ Profiles saved successfully');
      return true;
    } catch (error) {
      console.error('❌ Error saving profiles:', error);
      return false;
    }
  }

  // Get all profiles
  getAllProfiles() {
    return this.profiles.profiles;
  }

  // Get profile by ID
  getProfile(id) {
    return this.profiles.profiles.find(profile => profile.id === id);
  }

  // Get automation rules
  getAutomationRules() {
    return this.automationRules?.automation_rules || {};
  }

  // Get alert messages
  getAlertMessages() {
    return this.alertMessages?.alerts || {};
  }

  // Add or update profile
  saveProfile(profile) {
    const index = this.profiles.profiles.findIndex(p => p.id === profile.id);

    if (index !== -1) {
      // Update existing profile
      this.profiles.profiles[index] = profile;
      console.log(`📝 Profile updated: ${profile.name}`);
    } else {
      // Add new profile
      this.profiles.profiles.push(profile);
      console.log(`➕ New profile added: ${profile.name}`);
    }

    return this.saveProfiles();
  }

  // Delete profile
  deleteProfile(id) {
    // Don't allow deletion of default product profiles
    if (this.defaultProductIds.includes(id)) {
      console.warn('⚠️ Cannot delete default product profile');
      return false;
    }

    const index = this.profiles.profiles.findIndex(p => p.id === id);

    if (index !== -1) {
      const deletedProfile = this.profiles.profiles.splice(index, 1)[0];
      console.log(`🗑️ Profile deleted: ${deletedProfile.name}`);
      return this.saveProfiles();
    }

    console.warn(`⚠️ Profile not found: ${id}`);
    return false;
  }
}

module.exports = ProfileStorage;
