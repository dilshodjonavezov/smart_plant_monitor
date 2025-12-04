/**
 * Profile Manager - manages plant profiles
 */
class ProfileManager {
  constructor(wsManager) {
    this.wsManager = wsManager;
    this.profiles = [];
    this.activeProfile = null;
    this.automationRules = {};
    this.alertMessages = {};
  }

  // Load profiles from server
  loadProfiles() {
    this.wsManager.send({ type: 'getProfiles' });
  }

  // Set profiles data with automation config
  setProfiles(profiles, automationRules, alertMessages) {
    this.profiles = profiles;
    if (automationRules) this.automationRules = automationRules;
    if (alertMessages) this.alertMessages = alertMessages;
    this.renderProfileSelector();
  }

  // Transform thresholds for notification system
  transformThresholdsForNotification(thresholds) {
    if (!thresholds) return {};

    return {
      soil_moisture: thresholds.soilMoisture ? {
        min: thresholds.soilMoisture.min,
        max: thresholds.soilMoisture.max || 100
      } : null,
      air_temperature: thresholds.airTemperature ? {
        min: thresholds.airTemperature.min,
        max: thresholds.airTemperature.max
      } : null,
      air_humidity: thresholds.airHumidity ? {
        min: thresholds.airHumidity.min,
        max: thresholds.airHumidity.max
      } : null,
      light_lux: thresholds.lightLux ? {
        min: thresholds.lightLux.min,
        max: thresholds.lightLux.max
      } : null,
      soil_ph: thresholds.soilPH ? {
        min: thresholds.soilPH.min,
        max: thresholds.soilPH.max
      } : null
    };
  }

  // Switch to a profile
  switchProfile(profileId) {
    this.activeProfile = profileId;
    const profile = this.getCurrentProfile();

    this.wsManager.send({
      type: 'switchProfile',
      profileId: profileId
    });

    // Update notification system with new thresholds
    if (profile && window.app && window.app.notificationSystem) {
      window.app.notificationSystem.setAutomationConfig(
        this.automationRules,
        this.alertMessages,
        this.transformThresholdsForNotification(profile.thresholds)
      );
    }

    // Store in localStorage
    localStorage.setItem('activeProfile', profileId);

    // Update UI
    this.renderProfileSelector();
  }

  // Get current profile
  getCurrentProfile() {
    if (!this.activeProfile) {
      // Try to load from localStorage, default to first available profile
      const savedProfile = localStorage.getItem('activeProfile');
      if (savedProfile && this.profiles.find(p => p.id === savedProfile)) {
        this.activeProfile = savedProfile;
      } else if (this.profiles.length > 0) {
        this.activeProfile = this.profiles[0].id;
      }
    }

    return this.profiles.find(p => p.id === this.activeProfile);
  }

  // Render profile selector dropdown
  renderProfileSelector() {
    const container = document.querySelector('.profile-selector');
    if (!container) return;

    const currentProfile = this.getCurrentProfile();

    container.innerHTML = `
      <div class="dropdown dropdown-end">
        <label tabindex="0" class="btn btn-outline gap-2">
          <span class="text-2xl">${currentProfile?.icon || '🌱'}</span>
          <span>${currentProfile?.name || 'Выбрать профиль'}</span>
          <i data-feather="chevron-down" class="w-4 h-4"></i>
        </label>
        <ul tabindex="0" class="dropdown-content menu p-2 shadow-xl bg-base-200 rounded-box w-64 mt-2 max-h-96 overflow-y-auto">
          ${this.profiles.map(profile => `
            <li>
              <a onclick="app.profileManager.switchProfile('${profile.id}')"
                 class="${profile.id === this.activeProfile ? 'active' : ''}">
                <span class="text-2xl">${profile.icon}</span>
                <div class="flex-1">
                  <div class="font-bold">${profile.name}</div>
                  <div class="text-xs opacity-60">${profile.description}</div>
                </div>
                ${profile.id === this.activeProfile ? '<i data-feather="check" class="w-4 h-4"></i>' : ''}
              </a>
            </li>
          `).join('')}
          <div class="divider my-1"></div>
          <li>
            <a onclick="app.openProfileModal()">
              <i data-feather="plus" class="w-4 h-4"></i>
              Создать профиль
            </a>
          </li>
        </ul>
      </div>
    `;

    // Replace feather icons (throttled)
    if (typeof window.replaceFeatherIcons === 'function') {
      window.replaceFeatherIcons();
    }
  }

  // Save profile
  saveProfile(profile) {
    this.wsManager.send({
      type: 'saveProfile',
      profile: profile
    });
  }

  // Delete profile
  deleteProfile(profileId) {
    if (confirm('Вы уверены, что хотите удалить этот профиль?')) {
      this.wsManager.send({
        type: 'deleteProfile',
        profileId: profileId
      });
    }
  }

  // Show profile details in modal with all threshold fields
  showProfileModal(profileId = null) {
    const profile = profileId ? this.profiles.find(p => p.id === profileId) : null;

    const modal = document.getElementById('profileModal');
    if (!modal) return;

    modal.innerHTML = `
      <div class="modal-box max-w-3xl">
        <h3 class="font-bold text-2xl mb-4">
          ${profile ? 'Редактировать профиль' : 'Создать новый профиль'}
        </h3>

        <form id="profileForm" class="space-y-4">
          <!-- Basic Info -->
          <div class="grid grid-cols-2 gap-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text">Название профиля</span>
              </label>
              <input type="text" name="name" class="input input-bordered"
                     value="${profile?.name || ''}" required>
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">Иконка (эмодзи)</span>
              </label>
              <input type="text" name="icon" class="input input-bordered"
                     value="${profile?.icon || '🌱'}" maxlength="2">
            </div>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Описание</span>
            </label>
            <textarea name="description" class="textarea textarea-bordered"
                      rows="2">${profile?.description || ''}</textarea>
          </div>

          <!-- Soil Moisture -->
          <div class="divider">Влажность почвы (%)</div>
          <div class="grid grid-cols-3 gap-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text">Мин.</span>
              </label>
              <input type="number" name="moistureMin" class="input input-bordered"
                     value="${profile?.thresholds?.soilMoisture?.min || 60}"
                     min="0" max="100" step="1" required>
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Оптимально</span>
              </label>
              <input type="number" name="moistureOptimal" class="input input-bordered"
                     value="${Array.isArray(profile?.thresholds?.soilMoisture?.optimal) ? profile.thresholds.soilMoisture.optimal[0] : (profile?.thresholds?.soilMoisture?.optimal || 70)}"
                     min="0" max="100" step="1" required>
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Макс.</span>
              </label>
              <input type="number" name="moistureMax" class="input input-bordered"
                     value="${profile?.thresholds?.soilMoisture?.max || 85}"
                     min="0" max="100" step="1" required>
            </div>
          </div>

          <!-- Air Temperature -->
          <div class="divider">Температура воздуха (°C)</div>
          <div class="grid grid-cols-3 gap-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text">Мин.</span>
              </label>
              <input type="number" name="airTempMin" class="input input-bordered"
                     value="${profile?.thresholds?.airTemperature?.min || 15}"
                     min="-10" max="50" step="1" required>
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Оптимально</span>
              </label>
              <input type="number" name="airTempOptimal" class="input input-bordered"
                     value="${profile?.thresholds?.airTemperature?.optimal || 22}"
                     min="-10" max="50" step="1" required>
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Макс.</span>
              </label>
              <input type="number" name="airTempMax" class="input input-bordered"
                     value="${profile?.thresholds?.airTemperature?.max || 30}"
                     min="-10" max="50" step="1" required>
            </div>
          </div>

          <!-- Air Humidity -->
          <div class="divider">Влажность воздуха (%)</div>
          <div class="grid grid-cols-3 gap-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text">Мин.</span>
              </label>
              <input type="number" name="humidityMin" class="input input-bordered"
                     value="${profile?.thresholds?.airHumidity?.min || 40}"
                     min="0" max="100" step="1" required>
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Оптимально</span>
              </label>
              <input type="number" name="humidityOptimal" class="input input-bordered"
                     value="${profile?.thresholds?.airHumidity?.optimal || 60}"
                     min="0" max="100" step="1" required>
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Макс.</span>
              </label>
              <input type="number" name="humidityMax" class="input input-bordered"
                     value="${profile?.thresholds?.airHumidity?.max || 80}"
                     min="0" max="100" step="1" required>
            </div>
          </div>

          <!-- Soil pH -->
          <div class="divider">pH почвы</div>
          <div class="grid grid-cols-3 gap-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text">Мин.</span>
              </label>
              <input type="number" name="phMin" class="input input-bordered"
                     value="${profile?.thresholds?.soilPH?.min || 6.0}"
                     min="0" max="14" step="0.1" required>
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Оптимально</span>
              </label>
              <input type="number" name="phOptimal" class="input input-bordered"
                     value="${profile?.thresholds?.soilPH?.optimal || 6.5}"
                     min="0" max="14" step="0.1" required>
            </div>
            <div class="form-control">
              <label class="label">
                <span class="label-text">Макс.</span>
              </label>
              <input type="number" name="phMax" class="input input-bordered"
                     value="${profile?.thresholds?.soilPH?.max || 7.0}"
                     min="0" max="14" step="0.1" required>
            </div>
          </div>

          <div class="modal-action">
            <button type="button" class="btn" onclick="document.getElementById('profileModal').close()">
              Отмена
            </button>
            <button type="submit" class="btn btn-primary">
              ${profile ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    `;

    // Handle form submission
    document.getElementById('profileForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);

      const newProfile = {
        id: profile?.id || `custom_${Date.now()}`,
        name: formData.get('name'),
        icon: formData.get('icon'),
        description: formData.get('description'),
        thresholds: {
          soilMoisture: {
            min: parseInt(formData.get('moistureMin')),
            optimal: [parseInt(formData.get('moistureOptimal')), parseInt(formData.get('moistureOptimal'))],
            max: parseInt(formData.get('moistureMax'))
          },
          soilTemperature: {
            min: parseInt(formData.get('airTempMin')),
            optimal: parseInt(formData.get('airTempOptimal')),
            max: parseInt(formData.get('airTempMax'))
          },
          airTemperature: {
            min: parseInt(formData.get('airTempMin')),
            optimal: parseInt(formData.get('airTempOptimal')),
            max: parseInt(formData.get('airTempMax'))
          },
          airHumidity: {
            min: parseInt(formData.get('humidityMin')),
            optimal: parseInt(formData.get('humidityOptimal')),
            max: parseInt(formData.get('humidityMax'))
          },
          lightLux: {
            min: 20000,
            optimal: 40000,
            max: 60000
          },
          soilPH: {
            min: parseFloat(formData.get('phMin')),
            optimal: parseFloat(formData.get('phOptimal')),
            max: parseFloat(formData.get('phMax'))
          }
        }
      };

      this.saveProfile(newProfile);
      modal.close();
    });

    modal.showModal();
  }
}
