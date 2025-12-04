/**
 * Main Application Controller
 */
class PlantMonitorApp {
  constructor() {
    this.wsManager = new WebSocketManager('ws://localhost:8080');
    this.sensorManager = new SensorManager(50);
    this.chartManager = new ChartManager('mainChart');
    this.notificationSystem = new NotificationSystem();
    this.profileManager = new ProfileManager(this.wsManager);
    this.schedulerUI = new SchedulerUI(this.wsManager);

    this.config = {};
    this.isWatering = false;
    this.manualMode = false;
    this.currentTheme = 'system';
    this.previousSensorValues = {}; // Store previous values for smooth animation
    this.lastEventCount = 0; // Track event count for incremental updates
    this.eventsDataTable = null; // DataTables instance
    this.selectedMode = 'auto'; // User-selected mode: 'auto' or 'manual'
    this.lastButtonState = null; // Track last button state to prevent unnecessary re-renders
    this.wateringEvents = []; // Store watering events for statistics

    this.init();
  }

  // Initialize application
  init() {
    console.log('🚀 Initializing Plant Monitor v2...');

    // Setup WebSocket listeners
    this.setupWebSocketListeners();

    // Connect to server
    this.wsManager.connect();

    // Setup UI event listeners
    this.setupUIListeners();

    // Setup scroll listener for status bar title
    this.setupScrollListener();

    // Load theme
    this.loadTheme();

    // Load mode
    this.loadMode();

    // Render mode selector
    this.renderModeSelector();

    // Render theme switcher
    this.renderThemeSwitcher();

    // Initialize notification bell
    this.notificationSystem.initBell();

    // Initialize chart
    this.chartManager.initChart('soilMoisture');

    // Initialize DataTables after a short delay to ensure DOM is ready
    setTimeout(() => {
      this.initEventsDataTable();
    }, 500);

    // Listen for language changes
    window.addEventListener('languageChanged', () => {
      this.onLanguageChanged();
    });

    console.log('✅ Application initialized');
  }

  // Handle language change
  onLanguageChanged() {
    // Re-render mode selector with new translations
    this.renderModeSelector();

    // Re-render theme switcher
    this.renderThemeSwitcher();

    // Update chart tabs
    this.createChartTabs();

    // Update watering button text
    this.lastButtonState = null; // Force re-render
    this.updateWateringStatus(this.isWatering, this.manualMode);

    // Re-initialize chart with new translations (for y-axis title)
    if (this.chartManager) {
      const currentSensor = this.chartManager.currentSensor;
      const history = this.sensorManager.getHistory(currentSensor);

      // Destroy and re-init chart to update y-axis title
      this.chartManager.destroy();
      this.chartManager.initChart(currentSensor);

      // Restore data
      if (history.length > 0) {
        this.chartManager.updateChart(currentSensor, history);
      }

      // Re-add thresholds with new translations
      if (this.config) {
        let minThreshold, optimalMin, optimalMax;
        if (this.config.soilMoisture) {
          minThreshold = this.config.soilMoisture.min;
          optimalMin = this.config.soilMoisture.optimalMin;
          optimalMax = this.config.soilMoisture.optimalMax;
        } else {
          minThreshold = this.config.minThreshold;
          optimalMin = this.config.optimalMin;
          optimalMax = this.config.optimalMax;
        }
        if (minThreshold !== undefined) {
          this.chartManager.addThresholds(minThreshold, optimalMin, optimalMax);
        }
      }
    }

    // Update statistics with new translations
    this.updateStatistics(this.wateringEvents);

    // Re-initialize DataTables with new language
    if (this.eventsDataTable && typeof i18nManager !== 'undefined') {
      // Destroy and recreate DataTable with new language
      const data = this.eventsDataTable.data().toArray();
      this.eventsDataTable.destroy();
      this.lastEventCount = 0;
      this.initEventsDataTable();

      // Restore data
      if (data.length > 0) {
        data.forEach(row => {
          this.eventsDataTable.row.add(row);
        });
        this.eventsDataTable.draw();
        this.lastEventCount = data.length;
      }
    }
  }

  // Initialize DataTables for events table
  initEventsDataTable() {
    if (typeof $ === 'undefined' || typeof $.fn.DataTable === 'undefined') {
      console.warn('DataTables not loaded yet, retrying...');
      setTimeout(() => this.initEventsDataTable(), 500);
      return;
    }

    const table = document.getElementById('eventsTable');
    if (!table) {
      console.warn('Events table not found');
      return;
    }

    try {
      // Get language config from i18n manager if available
      const langConfig = typeof i18nManager !== 'undefined'
        ? i18nManager.getDataTablesLanguage()
        : {
            emptyTable: 'No watering events yet...',
            info: 'Showing _START_ to _END_ of _TOTAL_ events',
            infoEmpty: 'No events to show',
            infoFiltered: '(filtered from _MAX_ total events)',
            lengthMenu: 'Show _MENU_ events',
            search: '',
            searchPlaceholder: 'Search...',
            zeroRecords: 'No matching events found',
            paginate: {
              first: '«',
              last: '»',
              next: '›',
              previous: '‹'
            }
          };

      // Initialize DataTables with jQuery
      this.eventsDataTable = $('#eventsTable').DataTable({
        pageLength: 10,
        lengthMenu: [5, 10, 25, 50],
        order: [[0, 'desc']], // Sort by start time descending (newest first)
        language: langConfig,
        columnDefs: [
          { orderable: true, targets: [0, 1, 2, 3, 4] }
        ],
        // DOM layout: length + filter on top row, then table, then info + pagination on bottom row
        dom: '<"flex justify-between items-center mb-4"lf>rt<"flex justify-between items-center mt-4"ip>'
      });

      console.log('✅ DataTables initialized');
    } catch (error) {
      console.error('Failed to initialize DataTables:', error);
    }
  }

  // Setup WebSocket event listeners
  setupWebSocketListeners() {
    // Connection events
    this.wsManager.on('connected', () => {
      this.updateConnectionStatus(true);
      // Request profiles and schedules
      this.profileManager.loadProfiles();
      this.wsManager.send({ type: 'getSchedules' });
    });

    this.wsManager.on('disconnected', () => {
      this.updateConnectionStatus(false);
    });

    // Data messages
    this.wsManager.on('message', (data) => {
      // Handle sensor data
      if (data.sensors) {
        // Store watering events for statistics
        if (data.wateringEvents) {
          this.wateringEvents = data.wateringEvents;
        }

        this.updateSensors(data.sensors, data.timestamp);
        this.updateWateringStatus(data.isWatering, data.manualMode);
        this.updateEvents(data.wateringEvents);
        this.config = data.config;

        // Update chart thresholds (handle both legacy and new config format)
        if (this.config) {
          let minThreshold, optimalMin, optimalMax;

          // Check for new extended config format
          if (this.config.soilMoisture) {
            minThreshold = this.config.soilMoisture.min;
            optimalMin = this.config.soilMoisture.optimalMin;
            optimalMax = this.config.soilMoisture.optimalMax;
          } else {
            // Legacy format
            minThreshold = this.config.minThreshold;
            optimalMin = this.config.optimalMin;
            optimalMax = this.config.optimalMax;
          }

          this.chartManager.addThresholds(minThreshold, optimalMin, optimalMax);
        }

        // Check thresholds and notify
        this.notificationSystem.checkThresholds(this.sensorManager.getAllSensors(), this.config);
      }
    });

    // Profile events
    this.wsManager.on('profiles', (data) => {
      this.profileManager.setProfiles(data.data, data.automationRules, data.alertMessages);

      // Initialize notification system with config from current profile
      const currentProfile = this.profileManager.getCurrentProfile();
      if (currentProfile && currentProfile.thresholds) {
        this.notificationSystem.setAutomationConfig(
          data.automationRules,
          data.alertMessages,
          this.profileManager.transformThresholdsForNotification(currentProfile.thresholds)
        );
      }
    });

    // Schedule events
    this.wsManager.on('schedules', (data) => {
      this.schedulerUI.setSchedules(data.data);
      this.schedulerUI.renderSchedules();
    });
  }

  // Setup UI event listeners
  setupUIListeners() {
    // Manual watering button
    const manualBtn = document.getElementById('manualWateringBtn');
    if (manualBtn) {
      manualBtn.addEventListener('click', () => this.toggleManualWatering());
    }

    // Chart tabs
    this.createChartTabs();
  }

  // Setup scroll listener for status bar title
  setupScrollListener() {
    const statusBar = document.querySelector('.status-bar');
    const header = document.querySelector('.header-section');

    if (!statusBar || !header) return;

    let scrollTimeout;
    const handleScroll = () => {
      // Clear existing timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }

      // Throttle scroll events
      scrollTimeout = setTimeout(() => {
        const headerRect = header.getBoundingClientRect();

        // If header is completely scrolled out of view
        if (headerRect.bottom < 0) {
          statusBar.classList.add('scrolled');
        } else {
          statusBar.classList.remove('scrolled');
        }
      }, 50); // 50ms throttle
    };

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Initial check
    handleScroll();
  }

  // Update sensor values
  updateSensors(sensors, timestamp) {
    // Batch DOM updates to prevent forced reflow
    const updates = [];

    // First pass: Update data model and prepare DOM updates
    Object.entries(sensors).forEach(([name, value]) => {
      this.sensorManager.updateSensor(name, value, timestamp);

      const valueEl = document.getElementById(`${name}-value`);
      const statusEl = document.getElementById(`${name}-status`);
      const progressEl = document.getElementById(`${name}-progress`);

      if (!valueEl) return;

      // Format value with unit
      let formattedValue = name === 'pH' ? value.toFixed(2) : value.toFixed(1);
      const units = {
        soilMoisture: '%',
        temperature: '°C',
        airHumidity: '%',
        light: '%',
        pH: ''
      };
      formattedValue += units[name] || '';

      // Get range for status
      const range = this.sensorManager.getSensorRange(name, value);
      const percent = name === 'pH' ? ((value - 5.5) / (8.0 - 5.5)) * 100 : value;

      // Store updates
      updates.push({
        valueEl,
        statusEl,
        progressEl,
        formattedValue,
        range,
        percent,
        name,
        value
      });
    });

    // Second pass: Apply all DOM updates in one batch (write-only)
    requestAnimationFrame(() => {
      updates.forEach(({ valueEl, statusEl, progressEl, formattedValue, range, percent }) => {
        if (valueEl) {
          valueEl.textContent = formattedValue;
        }

        if (statusEl) {
          if (range) {
            // Translate status label if i18n is available
            let statusText = range.label;
            if (typeof i18nManager !== 'undefined') {
              statusText = i18nManager.translateSensorStatus(range.label);
            }
            statusEl.textContent = statusText;
            // Ensure better visibility on dark backgrounds
            // Replace dark colors with lighter versions
            let displayColor = range.color;
            if (displayColor === '#6b7280') { // Dark gray -> Light gray
              displayColor = '#9ca3af';
            }
            statusEl.style.color = displayColor;
          } else {
            // Fallback when no range matches
            const unknownText = typeof i18nManager !== 'undefined' ? i18nManager.t('unknown') : 'Unknown';
            statusEl.textContent = unknownText;
            statusEl.style.color = '#9ca3af';
          }
        }

        if (progressEl) {
          progressEl.style.width = `${Math.min(100, Math.max(0, percent))}%`;
          if (range) {
            progressEl.style.backgroundColor = range.color;
          }
        }
      });
    });

    // Store previous values
    updates.forEach(({ name, value }) => {
      this.previousSensorValues[name] = value;
    });

    // Update chart for current sensor
    const currentHistory = this.sensorManager.getHistory(this.chartManager.currentSensor);
    this.chartManager.updateChart(this.chartManager.currentSensor, currentHistory);

    // Update statistics with watering events
    this.updateStatistics(this.wateringEvents);
  }

  // Create rain effect for button
  createRainEffect(button) {
    // Remove existing rain container if any
    const existingRain = button.querySelector('.rain-container');
    if (existingRain) {
      existingRain.remove();
    }

    // Create rain container
    const rainContainer = document.createElement('div');
    rainContainer.className = 'rain-container';

    // Get button dimensions
    const btnWidth = button.offsetWidth;
    const btnHeight = button.offsetHeight;

    // Create rain drops (adjusted number for button size)
    const numDrops = Math.floor(btnWidth / 15); // Responsive number of drops

    for (let i = 0; i < numDrops; i++) {
      const drop = document.createElement('div');
      drop.className = 'rain-drop';

      // Random horizontal position
      const leftPos = Math.random() * btnWidth;
      drop.style.left = leftPos + 'px';

      // Random delay for staggered effect
      const delay = Math.random() * 0.7;
      drop.style.animationDelay = delay + 's';

      // Random top position for initial spread
      const topPos = Math.random() * btnHeight - btnHeight;
      drop.style.top = topPos + 'px';

      rainContainer.appendChild(drop);
    }

    button.appendChild(rainContainer);
  }

  // Remove rain effect
  removeRainEffect(button) {
    const rainContainer = button.querySelector('.rain-container');
    if (rainContainer) {
      rainContainer.remove();
    }
  }

  // Update watering status
  updateWateringStatus(isWatering, manualMode) {
    this.isWatering = isWatering;
    this.manualMode = manualMode;

    // Get translations if i18n is available
    const t = (key) => typeof i18nManager !== 'undefined' ? i18nManager.t(key) : {
      watering: 'Watering',
      ready: 'Ready',
      stopWatering: 'Stop Watering',
      startWatering: 'Start Watering',
      autoMode: 'Auto Mode',
      manualMode: 'Manual Mode'
    }[key] || key;

    const btn = document.getElementById('manualWateringBtn');
    const modeIndicator = document.querySelector('.mode-indicator');

    if (btn) {
      // Determine current button state
      let newButtonState;
      if (this.selectedMode === 'auto') {
        newButtonState = isWatering ? 'auto-watering' : 'auto-idle';
      } else {
        newButtonState = (isWatering && manualMode) ? 'manual-watering' : 'manual-idle';
      }

      // Only update DOM if state has changed
      if (this.lastButtonState !== newButtonState) {
        this.lastButtonState = newButtonState;

        // Button behavior based on selected mode
        if (this.selectedMode === 'auto') {
          // Auto mode: button is disabled
          btn.disabled = true;

          if (isWatering) {
            // Show watering status in auto mode
            btn.classList.add('active');
            btn.innerHTML = `
              <i data-feather="droplet"></i>
              <span>${t('watering')}<span class="dots-animation">...</span></span>
            `;
            // Add rain effect when watering
            this.createRainEffect(btn);
          } else {
            // Not watering
            btn.classList.remove('active');
            btn.innerHTML = `
              <i data-feather="check-circle"></i>
              <span>${t('ready')}</span>
            `;
            // Remove rain effect
            this.removeRainEffect(btn);
          }
        } else {
          // Manual mode: button is enabled
          btn.disabled = false;
          if (isWatering && manualMode) {
            // Currently watering in manual mode
            btn.classList.add('active');
            btn.innerHTML = `
              <i data-feather="stop-circle"></i>
              <span>${t('stopWatering')}</span>
            `;
            // Add rain effect when watering
            this.createRainEffect(btn);
          } else {
            // Not watering: ready to start
            btn.classList.remove('active');
            btn.innerHTML = `
              <i data-feather="droplet"></i>
              <span>${t('startWatering')}</span>
            `;
            // Remove rain effect
            this.removeRainEffect(btn);
          }
        }

        // Replace icons only when DOM was updated
        if (typeof window.replaceFeatherIcons === 'function') {
          window.replaceFeatherIcons();
        }
      }
    }

    if (modeIndicator) {
      // Mode indicator shows the SELECTED mode, not server's manualMode
      const newModeText = this.selectedMode === 'manual' ? t('manualMode') : t('autoMode');
      const newModeClass = this.selectedMode === 'manual' ? 'mode-indicator manual' : 'mode-indicator auto';

      // Only update if changed
      if (modeIndicator.textContent !== newModeText) {
        modeIndicator.textContent = newModeText;
      }
      if (modeIndicator.className !== newModeClass) {
        modeIndicator.className = newModeClass;
      }
    }
  }

  // Toggle manual watering
  toggleManualWatering() {
    // Only allow toggling in manual mode
    if (this.selectedMode !== 'manual') {
      return;
    }

    // Toggle based on current watering state
    if (this.isWatering && this.manualMode) {
      // Currently watering → stop it
      this.wsManager.send({
        type: 'manualWatering',
        action: 'stop'
      });
    } else {
      // Not watering → start it
      this.wsManager.send({
        type: 'manualWatering',
        action: 'start'
      });
    }
  }

  // Update watering events table with DataTables
  updateEvents(events) {
    if (!this.eventsDataTable) {
      // DataTables not initialized yet, retry later
      setTimeout(() => this.updateEvents(events), 500);
      return;
    }

    // Handle empty state
    if (!events || events.length === 0) {
      this.eventsDataTable.clear().draw();
      this.lastEventCount = 0;
      return;
    }

    // Check if we have new events
    const newEventCount = events.length - this.lastEventCount;

    if (newEventCount > 0) {
      // Get only the new events
      const newEvents = events.slice(this.lastEventCount);

      // Add new events to DataTable
      newEvents.forEach(event => {
        const start = new Date(event.start).toLocaleTimeString();
        const end = new Date(event.end).toLocaleTimeString();
        const duration = `${Math.floor(event.durationSec / 60)}m ${event.durationSec % 60}s`;

        this.eventsDataTable.row.add([
          start,
          end,
          duration,
          `${event.moistureStart}%`,
          `${event.moistureEnd}%`
        ]);
      });

      // Redraw table to show new rows
      this.eventsDataTable.draw(false); // false = stay on current page

      this.lastEventCount = events.length;
    } else if (newEventCount < 0) {
      // Event list was reset (e.g., page reload), rebuild from scratch
      this.eventsDataTable.clear();

      events.forEach(event => {
        const start = new Date(event.start).toLocaleTimeString();
        const end = new Date(event.end).toLocaleTimeString();
        const duration = `${Math.floor(event.durationSec / 60)}m ${event.durationSec % 60}s`;

        this.eventsDataTable.row.add([
          start,
          end,
          duration,
          `${event.moistureStart}%`,
          `${event.moistureEnd}%`
        ]);
      });

      this.eventsDataTable.draw();
      this.lastEventCount = events.length;
    }
  }

  // Update statistics
  updateStatistics(wateringEvents = null) {
    const stats = this.sensorManager.getStatistics('soilMoisture');

    // Calculate watering statistics if events are provided
    let wateringCount = 0;
    let totalDuration = 0;

    if (wateringEvents && wateringEvents.length > 0) {
      wateringCount = wateringEvents.length;
      totalDuration = wateringEvents.reduce((sum, event) => sum + event.durationSec, 0);
    }

    // Format duration as minutes and seconds with translations
    const durationMinutes = Math.floor(totalDuration / 60);
    const durationSeconds = totalDuration % 60;
    let durationText = '--';
    if (totalDuration > 0) {
      if (typeof i18nManager !== 'undefined') {
        durationText = i18nManager.formatDuration(durationMinutes, durationSeconds);
      } else {
        durationText = `${durationMinutes}m ${durationSeconds}s`;
      }
    }

    // Batch DOM updates
    requestAnimationFrame(() => {
      const avgEl = document.getElementById('stat-avg');
      const maxEl = document.getElementById('stat-max');
      const minEl = document.getElementById('stat-min');
      const countEl = document.getElementById('stat-count');
      const durationEl = document.getElementById('stat-duration');

      if (avgEl) avgEl.textContent = stats.avg + '%';
      if (maxEl) maxEl.textContent = stats.max + '%';
      if (minEl) minEl.textContent = stats.min + '%';
      if (countEl) countEl.textContent = wateringCount > 0 ? wateringCount : '--';
      if (durationEl) durationEl.textContent = durationText;
    });
  }

  // Create chart tabs
  createChartTabs() {
    const tabsContainer = document.getElementById('chartTabs');
    if (!tabsContainer) return;

    // Get translations if i18n is available
    const t = (key) => typeof i18nManager !== 'undefined' ? i18nManager.t(key) : {
      moisture: 'Moisture',
      temperature: 'Temperature',
      humidity: 'Humidity',
      light: 'Light',
      ph: 'pH'
    }[key] || key;

    const sensors = ['soilMoisture', 'temperature', 'airHumidity', 'light', 'pH'];
    const labels = [t('moisture'), t('temperature'), t('humidity'), t('light'), t('ph')];

    // Find currently active sensor
    const currentSensor = this.chartManager ? this.chartManager.currentSensor : 'soilMoisture';
    const currentIndex = sensors.indexOf(currentSensor);

    tabsContainer.innerHTML = sensors.map((sensor, i) => `
      <button class="chart-tab ${i === (currentIndex >= 0 ? currentIndex : 0) ? 'active' : ''}"
              onclick="app.switchChart('${sensor}')">
        ${labels[i]}
      </button>
    `).join('');
  }

  // Switch chart sensor
  switchChart(sensorName) {
    const history = this.sensorManager.getHistory(sensorName);
    this.chartManager.updateChart(sensorName, history);

    // Map sensor names to tab labels
    const sensorToLabel = {
      'soilMoisture': 'moisture',
      'temperature': 'temperature',
      'airHumidity': 'humidity',
      'light': 'light',
      'pH': 'ph'
    };

    const targetLabel = sensorToLabel[sensorName];

    // Update active tab
    document.querySelectorAll('.chart-tab').forEach(tab => {
      const tabText = tab.textContent.toLowerCase().trim();
      if (tabText === targetLabel) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  }

  // Update connection status
  updateConnectionStatus(connected) {
    const statusEl = document.querySelector('.connection-status');
    if (!statusEl) return;

    // Get translations if i18n is available
    const t = (key) => typeof i18nManager !== 'undefined' ? i18nManager.t(key) : {
      connected: 'Connected',
      disconnected: 'Disconnected'
    }[key] || key;

    if (connected) {
      statusEl.innerHTML = `
        <i data-feather="wifi"></i>
        <span>${t('connected')}</span>
      `;
      statusEl.classList.add('connected');
    } else {
      statusEl.innerHTML = `
        <i data-feather="wifi-off"></i>
        <span>${t('disconnected')}</span>
      `;
      statusEl.classList.remove('connected');
    }
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
  }

  // Open settings modal
  openSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (!modal) return;

    // Get translations if i18n is available
    const t = (key) => typeof i18nManager !== 'undefined' ? i18nManager.t(key) : {
      settings: 'Settings',
      minThreshold: 'Min Threshold (%)',
      optimalMin: 'Optimal Min (%)',
      optimalMax: 'Optimal Max (%)',
      cancel: 'Cancel',
      apply: 'Apply'
    }[key] || key;

    modal.innerHTML = `
      <div class="modal-box">
        <h3 class="font-bold text-2xl mb-4">${t('settings')}</h3>
        <form id="settingsForm" class="space-y-4">
          <div class="form-control">
            <label class="label"><span class="label-text">${t('minThreshold')}</span></label>
            <input type="number" name="minThreshold" class="input input-bordered"
                   value="${this.config.minThreshold || 60}" min="0" max="100">
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">${t('optimalMin')}</span></label>
            <input type="number" name="optimalMin" class="input input-bordered"
                   value="${this.config.optimalMin || 70}" min="0" max="100">
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">${t('optimalMax')}</span></label>
            <input type="number" name="optimalMax" class="input input-bordered"
                   value="${this.config.optimalMax || 80}" min="0" max="100">
          </div>
          <div class="modal-action">
            <button type="button" class="btn" onclick="document.getElementById('settingsModal').close()">${t('cancel')}</button>
            <button type="submit" class="btn btn-primary">${t('apply')}</button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    `;

    document.getElementById('settingsForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      this.wsManager.send({
        type: 'configUpdate',
        settings: {
          minThreshold: parseInt(formData.get('minThreshold')),
          optimalMin: parseInt(formData.get('optimalMin')),
          optimalMax: parseInt(formData.get('optimalMax'))
        }
      });
      modal.close();
    });

    modal.showModal();
  }

  // Open scheduler modal
  openSchedulerModal() {
    const modal = document.getElementById('schedulerModal');
    if (!modal) return;

    // Get translations if i18n is available
    const t = (key) => typeof i18nManager !== 'undefined' ? i18nManager.t(key) : {
      wateringScheduler: 'Watering Scheduler',
      enableScheduler: 'Enable Scheduler',
      close: 'Close'
    }[key] || key;

    modal.innerHTML = `
      <div class="modal-box max-w-3xl">
        <h3 class="font-bold text-2xl mb-4">${t('wateringScheduler')}</h3>
        <div class="form-control mb-4">
          <label class="label cursor-pointer">
            <span class="label-text">${t('enableScheduler')}</span>
            <input type="checkbox" class="toggle toggle-success"
                   ${this.schedulerUI.enabled ? 'checked' : ''}
                   onchange="app.schedulerUI.toggleScheduler(this.checked)">
          </label>
        </div>
        <div id="scheduleList"></div>
        <div class="modal-action">
          <button class="btn" onclick="document.getElementById('schedulerModal').close()">${t('close')}</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    `;

    this.schedulerUI.renderSchedules();
    modal.showModal();
  }

  // Render mode selector dropdown
  renderModeSelector() {
    const container = document.querySelector('.mode-selector');
    if (!container) return;

    // Get translations if i18n is available
    const t = (key) => typeof i18nManager !== 'undefined' ? i18nManager.t(key) : {
      autoMode: 'Auto Mode',
      manualMode: 'Manual Mode',
      autoModeDesc: 'Automatic watering control',
      manualModeDesc: 'Manual watering control'
    }[key] || key;

    const modes = [
      { id: 'auto', name: t('autoMode'), icon: '🤖', description: t('autoModeDesc') },
      { id: 'manual', name: t('manualMode'), icon: '👋', description: t('manualModeDesc') }
    ];

    const currentMode = modes.find(m => m.id === this.selectedMode) || modes[0];

    container.innerHTML = `
      <div class="dropdown dropdown-end">
        <label tabindex="0" class="btn btn-outline gap-2">
          <span class="text-xl">${currentMode.icon}</span>
          <span>${currentMode.name}</span>
          <i data-feather="chevron-down" class="w-4 h-4"></i>
        </label>
        <ul tabindex="0" class="dropdown-content menu p-2 shadow-xl bg-base-200 rounded-box w-64 mt-2">
          ${modes.map(mode => `
            <li>
              <a onclick="app.switchMode('${mode.id}')"
                 class="${mode.id === this.selectedMode ? 'active' : ''}">
                <span class="text-xl">${mode.icon}</span>
                <div class="flex-1">
                  <div class="font-bold">${mode.name}</div>
                  <div class="text-xs opacity-60">${mode.description}</div>
                </div>
                ${mode.id === this.selectedMode ? '<i data-feather="check" class="w-4 h-4"></i>' : ''}
              </a>
            </li>
          `).join('')}
        </ul>
      </div>
    `;

    // Replace feather icons
    setTimeout(() => {
      if (typeof window.replaceFeatherIcons === 'function') {
        window.replaceFeatherIcons();
      }
    }, 100);
  }

  // Switch mode
  switchMode(modeName) {
    this.selectedMode = modeName;
    localStorage.setItem('wateringMode', modeName);

    // Reset button state tracking to force re-render on mode change
    this.lastButtonState = null;

    // If switching to auto mode and currently watering manually, stop it
    if (modeName === 'auto' && this.manualMode) {
      this.wsManager.send({
        type: 'manualWatering',
        action: 'stop'
      });
    }

    // Re-render selector to update active state
    this.renderModeSelector();

    // Update button state
    this.updateWateringStatus(this.isWatering, this.manualMode);
  }

  // Load saved mode
  loadMode() {
    const savedMode = localStorage.getItem('wateringMode') || 'auto';
    this.selectedMode = savedMode;
  }

  // Render theme switcher dropdown
  renderThemeSwitcher() {
    const container = document.querySelector('.theme-switcher');
    if (!container) return;

    // Get translations if i18n is available
    const t = (key) => typeof i18nManager !== 'undefined' ? i18nManager.t(key) : {
      dark: 'Dark',
      light: 'Light',
      system: 'System'
    }[key] || key;

    const themes = [
      { id: 'dark', name: t('dark'), icon: 'moon' },
      { id: 'light', name: t('light'), icon: 'sun' },
      { id: 'system', name: t('system'), icon: 'monitor' }
    ];

    const currentTheme = themes.find(t => t.id === this.currentTheme) || themes[0];

    container.innerHTML = `
      <div class="dropdown" id="themeDropdown">
        <button class="dropdown-toggle" onclick="app.toggleThemeDropdown()" title="Theme: ${currentTheme.name}">
          <i data-feather="${currentTheme.icon}"></i>
        </button>
        <div class="dropdown-content">
          ${themes.map(theme => `
            <div class="dropdown-item ${theme.id === this.currentTheme ? 'active' : ''}"
                 onclick="app.switchTheme('${theme.id}')">
              <div class="dropdown-item-icon">
                <i data-feather="${theme.icon}"></i>
              </div>
              <div class="dropdown-item-text">
                <div class="title">${theme.name}</div>
              </div>
              <div class="dropdown-item-check">
                <i data-feather="check"></i>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Replace feather icons
    setTimeout(() => {
      if (typeof window.replaceFeatherIcons === 'function') {
        window.replaceFeatherIcons();
      }
    }, 100);

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      const dropdown = document.getElementById('themeDropdown');
      if (dropdown && !dropdown.contains(e.target)) {
        dropdown.classList.remove('active');
      }
    });
  }

  // Toggle theme dropdown
  toggleThemeDropdown() {
    const dropdown = document.getElementById('themeDropdown');
    if (dropdown) {
      dropdown.classList.toggle('active');
    }
  }

  // Get system theme preference
  getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  // Apply theme (handles system theme detection)
  applyTheme(themeName) {
    const themeCSS = document.getElementById('theme-css');
    if (!themeCSS) return;

    // Determine actual theme to apply
    let actualTheme = themeName;
    if (themeName === 'system') {
      actualTheme = this.getSystemTheme();
    }

    // Map theme names to CSS files
    const cssFile = actualTheme === 'dark' ? 'minimal.css' : 'minimal-light.css';
    themeCSS.href = `css/${cssFile}`;

    // Update HTML data-theme attribute for DaisyUI
    document.documentElement.setAttribute('data-theme', actualTheme);

    // Add/remove 'dark' class for Tailwind CSS dark mode
    if (actualTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  // Switch theme
  switchTheme(themeName) {
    this.currentTheme = themeName;
    localStorage.setItem('theme', themeName);

    // Apply the theme
    this.applyTheme(themeName);

    // Close dropdown
    const dropdown = document.getElementById('themeDropdown');
    if (dropdown) {
      dropdown.classList.remove('active');
    }

    // Re-render switcher to update icon and active state
    this.renderThemeSwitcher();
  }

  // Load saved theme
  loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'system';
    this.currentTheme = savedTheme;
    this.applyTheme(savedTheme);

    // Listen for system theme changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        // Only update if current theme is set to 'system'
        if (this.currentTheme === 'system') {
          this.applyTheme('system');
        }
      });
    }
  }

  // Open profile modal
  openProfileModal() {
    this.profileManager.showProfileModal();
  }
}

// Initialize app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new PlantMonitorApp();
});
