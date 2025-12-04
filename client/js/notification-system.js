/**
 * Notification System - visual alerts and indicators
 */
class NotificationSystem {
  constructor() {
    this.activeAlerts = new Map();
    this.automationRules = {};
    this.alertMessages = {};
    this.currentThresholds = {};
    this.bellInitialized = false;
    // Track previous state to avoid unnecessary re-renders
    this.prevAlertCount = 0;
    this.prevAlertKeys = '';
  }

  // Initialize the bell icon (called once on app start)
  initBell() {
    if (this.bellInitialized) return;

    const bellContainer = document.querySelector('.notification-bell');
    if (!bellContainer) return;

    bellContainer.innerHTML = `
      <div class="dropdown" id="notificationDropdown">
        <button class="bell-button" onclick="app.notificationSystem.toggleDropdown()" title="Уведомления">
          <i data-feather="bell"></i>
          <span class="badge-count" style="display: none;">0</span>
        </button>
        <div class="dropdown-content">
          <div class="dropdown-header">
            <h4>Уведомления</h4>
            <button class="clear-btn" style="display: none;" onclick="app.notificationSystem.clearAll()">Очистить</button>
          </div>
          <div class="notification-list">
            <div class="no-notifications">
              <i data-feather="check-circle"></i>
              <div>Нет активных оповещений</div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Replace feather icons
    if (typeof window.replaceFeatherIcons === 'function') {
      window.replaceFeatherIcons();
    }

    // Setup click outside listener
    this.setupDropdownCloseListener();
    this.bellInitialized = true;
  }

  // Set automation configuration from server
  setAutomationConfig(rules, alerts, thresholds) {
    this.automationRules = rules || {};
    this.alertMessages = alerts || {};
    this.currentThresholds = thresholds || {};
  }

  // Notify about sensor status
  notifySensor(sensorId, level, message) {
    const sensorCard = document.querySelector(`[data-sensor="${sensorId}"]`);
    if (!sensorCard) return;

    // Remove previous alerts
    this.clearSensorAlert(sensorId);

    // Add visual indicator based on level
    switch (level) {
      case 'critical':
        sensorCard.classList.add('alert-critical', 'animate__animated', 'animate__shakeX');
        break;
      case 'warning':
        sensorCard.classList.add('alert-warning', 'animate__animated', 'animate__pulse');
        break;
      case 'success':
        sensorCard.classList.add('alert-success');
        break;
    }

    // Store active alert
    this.activeAlerts.set(sensorId, { level, message, timestamp: Date.now() });

    // Auto-clear animation classes
    setTimeout(() => {
      sensorCard.classList.remove('animate__animated', 'animate__shakeX', 'animate__pulse');
    }, 1000);
  }

  // Clear sensor alert
  clearSensorAlert(sensorId) {
    const sensorCard = document.querySelector(`[data-sensor="${sensorId}"]`);
    if (!sensorCard) return;

    sensorCard.classList.remove('alert-critical', 'alert-warning', 'alert-success');
    this.activeAlerts.delete(sensorId);
  }

  // Update status bar
  updateStatusBar(status) {
    const statusBar = document.querySelector('.status-bar');
    if (!statusBar) return;

    // Update based on overall system status
    statusBar.className = 'status-bar';

    if (status.alerts > 0) {
      statusBar.classList.add('status-alert');
    } else if (status.warnings > 0) {
      statusBar.classList.add('status-warning');
    } else {
      statusBar.classList.add('status-normal');
    }
  }

  // Update badge count and dropdown content - only updates what changed
  updateBadge(count) {
    // Initialize bell if not done yet
    if (!this.bellInitialized) {
      this.initBell();
    }

    const hasAlerts = count > 0;

    // Generate current alert keys to detect changes
    const currentAlertKeys = Array.from(this.activeAlerts.keys()).sort().join(',');
    const alertsChanged = currentAlertKeys !== this.prevAlertKeys;
    const countChanged = count !== this.prevAlertCount;

    // Only update badge count if changed
    if (countChanged) {
      const badgeEl = document.querySelector('.notification-bell .badge-count');
      if (badgeEl) {
        badgeEl.textContent = count;
        badgeEl.style.display = hasAlerts ? 'flex' : 'none';
      }

      // Update clear button visibility
      const clearBtn = document.querySelector('.notification-bell .clear-btn');
      if (clearBtn) {
        clearBtn.style.display = hasAlerts ? 'block' : 'none';
      }

      // Animate bell only when count increases (new alert)
      if (count > this.prevAlertCount) {
        const bellButton = document.querySelector('.notification-bell .bell-button');
        if (bellButton) {
          bellButton.classList.remove('has-alerts');
          // Force reflow to restart animation
          void bellButton.offsetWidth;
          bellButton.classList.add('has-alerts');
        }
      } else if (!hasAlerts) {
        const bellButton = document.querySelector('.notification-bell .bell-button');
        if (bellButton) {
          bellButton.classList.remove('has-alerts');
        }
      }

      this.prevAlertCount = count;
    }

    // Only update notification list if alerts actually changed
    if (alertsChanged) {
      this.updateNotificationList();
      this.prevAlertKeys = currentAlertKeys;
    }
  }

  // Update only the notification list items
  updateNotificationList() {
    const listContainer = document.querySelector('.notification-bell .notification-list');
    if (!listContainer) return;

    if (this.activeAlerts.size === 0) {
      listContainer.innerHTML = `
        <div class="no-notifications">
          <i data-feather="check-circle"></i>
          <div>Нет активных оповещений</div>
        </div>
      `;
    } else {
      let html = '';
      for (const [sensorId, alert] of this.activeAlerts) {
        const icon = this.getSensorIcon(sensorId);
        const sensorName = this.getSensorName(sensorId);

        html += `
          <div class="notification-item ${alert.level}" data-sensor="${sensorId}">
            <div class="notification-icon">
              <i data-feather="${icon}"></i>
            </div>
            <div class="notification-content">
              <div class="notification-title">${sensorName}</div>
              <div class="notification-message">${alert.message}</div>
            </div>
          </div>
        `;
      }
      listContainer.innerHTML = html;
    }

    // Replace feather icons only in the list
    if (typeof window.replaceFeatherIcons === 'function') {
      window.replaceFeatherIcons();
    }
  }

  // Toggle notification dropdown
  toggleDropdown() {
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) {
      dropdown.classList.toggle('active');
    }
  }

  // Close dropdown when clicking outside
  setupDropdownCloseListener() {
    // Remove old listener if exists
    if (this.dropdownCloseHandler) {
      document.removeEventListener('click', this.dropdownCloseHandler);
    }

    this.dropdownCloseHandler = (e) => {
      const dropdown = document.getElementById('notificationDropdown');
      if (dropdown && !dropdown.contains(e.target)) {
        dropdown.classList.remove('active');
      }
    };

    document.addEventListener('click', this.dropdownCloseHandler);
  }

  // Get icons for sensors with active alerts
  getAlertIcons() {
    const icons = [];
    const sensorIcons = {
      'soilMoisture': 'droplet',
      'temperature': 'thermometer',
      'airHumidity': 'cloud',
      'light': 'sun',
      'pH': 'activity'
    };

    // Get up to 3 sensor icons
    let count = 0;
    for (const [sensorId, alert] of this.activeAlerts) {
      if (count >= 3) break;
      const iconName = sensorIcons[sensorId];
      if (iconName) {
        icons.push(`<i data-feather="${iconName}" style="width: 14px; height: 14px;"></i>`);
        count++;
      }
    }

    return icons;
  }

  // Highlight element
  highlight(elementId, duration = 2000) {
    const element = document.getElementById(elementId);
    if (!element) return;

    element.classList.add('highlight', 'animate__animated', 'animate__pulse');

    setTimeout(() => {
      element.classList.remove('highlight', 'animate__animated', 'animate__pulse');
    }, duration);
  }

  // Mapping from internal sensor IDs to JSON keys
  getSensorMapping() {
    return {
      soilMoisture: 'soil_moisture',
      temperature: 'air_temperature',
      airHumidity: 'air_humidity',
      light: 'light_lux',
      pH: 'soil_ph'
    };
  }

  // Check sensor thresholds and notify using dynamic thresholds
  checkThresholds(sensors, config) {
    let alertCount = 0;
    const sensorMapping = this.getSensorMapping();

    // Check soil moisture
    if (sensors.soilMoisture) {
      const moisture = sensors.soilMoisture.value;
      const thresholds = this.currentThresholds.soil_moisture;
      const alerts = this.alertMessages.soil_moisture;

      if (thresholds && alerts) {
        if (moisture < thresholds.min) {
          this.notifySensor('soilMoisture', 'critical', alerts.too_low);
          alertCount++;
        } else if (moisture > thresholds.max) {
          this.notifySensor('soilMoisture', 'warning', alerts.too_high);
          alertCount++;
        } else {
          this.clearSensorAlert('soilMoisture');
        }
      } else {
        // Fallback to legacy config
        if (moisture < config.minThreshold) {
          this.notifySensor('soilMoisture', 'critical', 'Почва чрезмерно сухая. Рекомендуется включить полив.');
          alertCount++;
        } else if (moisture > (config.optimalMax || 80) + 10) {
          this.notifySensor('soilMoisture', 'warning', 'Почва слишком влажная. Возможен риск гниения корней.');
          alertCount++;
        } else {
          this.clearSensorAlert('soilMoisture');
        }
      }
    }

    // Check temperature
    if (sensors.temperature) {
      const temp = sensors.temperature.value;
      const thresholds = this.currentThresholds.air_temperature;
      const alerts = this.alertMessages.air_temperature;

      if (thresholds && alerts) {
        if (temp < thresholds.min) {
          this.notifySensor('temperature', 'critical', alerts.too_low);
          alertCount++;
        } else if (temp > thresholds.max) {
          this.notifySensor('temperature', 'critical', alerts.too_high);
          alertCount++;
        } else {
          this.clearSensorAlert('temperature');
        }
      } else {
        // Fallback to hardcoded values
        if (temp < 15 || temp > 35) {
          this.notifySensor('temperature', 'critical', 'Температура воздуха вне диапазона!');
          alertCount++;
        } else if (temp < 18 || temp > 30) {
          this.notifySensor('temperature', 'warning', 'Температура воздуха не оптимальна');
          alertCount++;
        } else {
          this.clearSensorAlert('temperature');
        }
      }
    }

    // Check air humidity
    if (sensors.airHumidity) {
      const humidity = sensors.airHumidity.value;
      const thresholds = this.currentThresholds.air_humidity;
      const alerts = this.alertMessages.air_humidity;

      if (thresholds && alerts) {
        if (humidity < thresholds.min) {
          this.notifySensor('airHumidity', 'warning', alerts.too_low);
          alertCount++;
        } else if (humidity > thresholds.max) {
          this.notifySensor('airHumidity', 'warning', alerts.too_high);
          alertCount++;
        } else {
          this.clearSensorAlert('airHumidity');
        }
      } else {
        this.clearSensorAlert('airHumidity');
      }
    }

    // Check light level
    if (sensors.light) {
      const light = sensors.light.value;
      const lightLux = light * 600; // Convert % to approximate lux
      const thresholds = this.currentThresholds.light_lux;
      const alerts = this.alertMessages.light_lux;

      if (thresholds && alerts) {
        if (lightLux < thresholds.min) {
          this.notifySensor('light', 'warning', alerts.too_low);
          alertCount++;
        } else if (lightLux > thresholds.max) {
          this.notifySensor('light', 'warning', alerts.too_high);
          alertCount++;
        } else {
          this.clearSensorAlert('light');
        }
      } else {
        this.clearSensorAlert('light');
      }
    }

    // Check pH
    if (sensors.pH) {
      const pH = sensors.pH.value;
      const thresholds = this.currentThresholds.soil_ph;
      const alerts = this.alertMessages.soil_ph;

      if (thresholds && alerts) {
        if (pH < thresholds.min) {
          this.notifySensor('pH', 'critical', alerts.too_low);
          alertCount++;
        } else if (pH > thresholds.max) {
          this.notifySensor('pH', 'critical', alerts.too_high);
          alertCount++;
        } else {
          this.clearSensorAlert('pH');
        }
      } else {
        // Fallback to hardcoded values
        if (pH < 5.5 || pH > 8.0) {
          this.notifySensor('pH', 'critical', 'Кислотность почвы вне диапазона!');
          alertCount++;
        } else if (pH < 6.0 || pH > 7.5) {
          this.notifySensor('pH', 'warning', 'Кислотность почвы не оптимальна');
          alertCount++;
        } else {
          this.clearSensorAlert('pH');
        }
      }
    }

    // Update badge
    this.updateBadge(alertCount);

    return alertCount;
  }

  // Clear all alerts
  clearAll() {
    // Close dropdown first
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) {
      dropdown.classList.remove('active');
    }

    // Clear all sensor alerts
    this.activeAlerts.forEach((alert, sensorId) => {
      this.clearSensorAlert(sensorId);
    });
    this.updateBadge(0);
  }

  // Get active alerts count
  getAlertCount() {
    return this.activeAlerts.size;
  }

  // Helper: Get sensor icon name
  getSensorIcon(sensorId) {
    const sensorIcons = {
      'soilMoisture': 'droplet',
      'temperature': 'thermometer',
      'airHumidity': 'cloud',
      'light': 'sun',
      'pH': 'activity'
    };
    return sensorIcons[sensorId] || 'alert-circle';
  }

  // Helper: Get human-readable sensor name (Russian)
  getSensorName(sensorId) {
    const sensorNames = {
      'soilMoisture': 'Влажность почвы',
      'temperature': 'Температура воздуха',
      'airHumidity': 'Влажность воздуха',
      'light': 'Освещённость',
      'pH': 'pH почвы'
    };
    return sensorNames[sensorId] || sensorId;
  }

  // Show alert modal with detailed information
  showAlertModal() {
    const modal = document.getElementById('alertModal');
    const content = document.getElementById('alertModalContent');

    if (!modal || !content) return;

    // Build alert list from activeAlerts Map
    let alertsHTML = '';
    for (const [sensorId, alert] of this.activeAlerts) {
      const icon = this.getSensorIcon(sensorId);
      const sensorName = this.getSensorName(sensorId);
      const levelClass = alert.level === 'critical' ? 'alert-error' : 'alert-warning';

      alertsHTML += `
        <div class="alert ${levelClass}">
          <i data-feather="${icon}"></i>
          <div>
            <h4 class="font-bold">${sensorName}</h4>
            <div class="text-sm">${alert.message}</div>
          </div>
        </div>
      `;
    }

    // If no alerts (shouldn't happen, but handle it)
    if (alertsHTML === '') {
      alertsHTML = '<div class="alert alert-info"><i data-feather="info"></i><span>Нет активных оповещений</span></div>';
    }

    content.innerHTML = alertsHTML;

    // Replace feather icons in modal
    if (typeof feather !== 'undefined') {
      setTimeout(() => {
        feather.replace();
      }, 50);
    }

    modal.showModal();
  }
}
