/**
 * Internationalization (i18n) Manager using i18next
 */
class I18nManager {
  constructor() {
    this.currentLanguage = 'tg'; // Default language is Tajik
    this.languages = [
      { id: 'tg', name: 'Tajik', nativeName: 'Тоҷикӣ', flag: '🇹🇯' },
      { id: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
      { id: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' }
    ];

    this.translations = {
      en: {
        translation: {
          // App title
          appTitle: 'IoT Plant Monitor v2',
          appSubtitle: 'Real-time environmental monitoring system',

          // Connection status
          connecting: 'Connecting...',
          connected: 'Connected',
          disconnected: 'Disconnected',

          // Mode
          autoMode: 'Auto Mode',
          manualMode: 'Manual Mode',
          autoModeDesc: 'Automatic watering control',
          manualModeDesc: 'Manual watering control',

          // Sensors
          soilMoisture: 'Soil Moisture',
          temperature: 'Temperature',
          airHumidity: 'Air Humidity',
          lightLevel: 'Light Level',
          soilPH: 'Soil pH',
          waiting: 'Waiting...',

          // Sensor status
          dry: 'Dry',
          low: 'Low',
          optimal: 'Optimal',
          high: 'High',
          wet: 'Wet',
          cold: 'Cold',
          cool: 'Cool',
          warm: 'Warm',
          hot: 'Hot',
          dark: 'Dark',
          dim: 'Dim',
          bright: 'Bright',
          veryBright: 'Very Bright',
          acidic: 'Acidic',
          neutral: 'Neutral',
          alkaline: 'Alkaline',
          unknown: 'Unknown',

          // Control buttons
          manualWatering: 'Manual Watering',
          startWatering: 'Start Watering',
          stopWatering: 'Stop Watering',
          watering: 'Watering',
          ready: 'Ready',
          scheduler: 'Scheduler',
          settings: 'Settings',

          // Chart
          sensorHistory: 'Sensor History',
          moisture: 'Moisture',
          humidity: 'Humidity',
          light: 'Light',
          ph: 'pH',

          // Statistics
          avgMoisture: 'Avg Moisture',
          waterings: 'Waterings',
          duration: 'Duration',
          maxMoisture: 'Max Moisture',
          minMoisture: 'Min Moisture',

          // Events table
          wateringEventsHistory: 'Watering Events History',
          startTime: 'Start Time',
          endTime: 'End Time',
          startPercent: 'Start %',
          endPercent: 'End %',
          noWateringEvents: 'No watering events yet...',
          showingEvents: 'Showing _START_ to _END_ of _TOTAL_ events',
          noEventsToShow: 'No events to show',
          filteredFromTotal: '(filtered from _MAX_ total events)',
          showEvents: 'Show _MENU_ events',
          search: 'Search...',
          noMatchingEvents: 'No matching events found',

          // Settings modal
          minThreshold: 'Min Threshold (%)',
          optimalMin: 'Optimal Min (%)',
          optimalMax: 'Optimal Max (%)',
          cancel: 'Cancel',
          apply: 'Apply',
          close: 'Close',

          // Scheduler modal
          wateringScheduler: 'Watering Scheduler',
          enableScheduler: 'Enable Scheduler',

          // Alerts
          sensorAlerts: 'Sensor Alerts',
          gotIt: 'Got it',

          // Theme
          dark: 'Dark',
          light: 'Light',
          system: 'System',

          // Notifications
          alerts: 'Alerts',
          clearAll: 'Clear all',
          noAlerts: 'No alerts',

          // Chart annotations
          optimalRange: 'Optimal Range',
          minValue: 'Min: {{value}}',

          // Chart y-axis labels
          yAxisSoilMoisture: 'Soil Moisture',

          // Duration format
          minuteShort: 'm',
          secondShort: 's',

          // Sensor status (from sensor-manager ranges)
          critical: 'Critical',
          humid: 'Humid'
        }
      },
      ru: {
        translation: {
          // App title
          appTitle: 'IoT Монитор Растений v2',
          appSubtitle: 'Система мониторинга окружающей среды в реальном времени',

          // Connection status
          connecting: 'Подключение...',
          connected: 'Подключено',
          disconnected: 'Отключено',

          // Mode
          autoMode: 'Авто режим',
          manualMode: 'Ручной режим',
          autoModeDesc: 'Автоматический полив',
          manualModeDesc: 'Ручной полив',

          // Sensors
          soilMoisture: 'Влажность почвы',
          temperature: 'Температура',
          airHumidity: 'Влажность воздуха',
          lightLevel: 'Уровень освещения',
          soilPH: 'pH почвы',
          waiting: 'Ожидание...',

          // Sensor status
          dry: 'Сухо',
          low: 'Низкий',
          optimal: 'Оптимальный',
          high: 'Высокий',
          wet: 'Влажно',
          cold: 'Холодно',
          cool: 'Прохладно',
          warm: 'Тепло',
          hot: 'Жарко',
          dark: 'Темно',
          dim: 'Тускло',
          bright: 'Светло',
          veryBright: 'Очень ярко',
          acidic: 'Кислый',
          neutral: 'Нейтральный',
          alkaline: 'Щелочной',
          unknown: 'Неизвестно',

          // Control buttons
          manualWatering: 'Ручной полив',
          startWatering: 'Начать полив',
          stopWatering: 'Остановить полив',
          watering: 'Полив',
          ready: 'Готов',
          scheduler: 'Планировщик',
          settings: 'Настройки',

          // Chart
          sensorHistory: 'История датчиков',
          moisture: 'Влажность',
          humidity: 'Влажность',
          light: 'Свет',
          ph: 'pH',

          // Statistics
          avgMoisture: 'Сред. влажность',
          waterings: 'Поливы',
          duration: 'Продолжительность',
          maxMoisture: 'Макс. влажность',
          minMoisture: 'Мин. влажность',

          // Events table
          wateringEventsHistory: 'История поливов',
          startTime: 'Начало',
          endTime: 'Окончание',
          startPercent: 'Нач. %',
          endPercent: 'Кон. %',
          noWateringEvents: 'Поливов пока нет...',
          showingEvents: 'Показано _START_ - _END_ из _TOTAL_ событий',
          noEventsToShow: 'Нет событий',
          filteredFromTotal: '(отфильтровано из _MAX_)',
          showEvents: 'Показать _MENU_',
          search: 'Поиск...',
          noMatchingEvents: 'Совпадений не найдено',

          // Settings modal
          minThreshold: 'Мин. порог (%)',
          optimalMin: 'Опт. мин. (%)',
          optimalMax: 'Опт. макс. (%)',
          cancel: 'Отмена',
          apply: 'Применить',
          close: 'Закрыть',

          // Scheduler modal
          wateringScheduler: 'Планировщик полива',
          enableScheduler: 'Включить планировщик',

          // Alerts
          sensorAlerts: 'Оповещения датчиков',
          gotIt: 'Понятно',

          // Theme
          dark: 'Тёмная',
          light: 'Светлая',
          system: 'Системная',

          // Notifications
          alerts: 'Оповещения',
          clearAll: 'Очистить',
          noAlerts: 'Нет оповещений',

          // Chart annotations
          optimalRange: 'Оптимальный диапазон',
          minValue: 'Мин: {{value}}',

          // Chart y-axis labels
          yAxisSoilMoisture: 'Влажность почвы',

          // Duration format
          minuteShort: 'мин',
          secondShort: 'сек',

          // Sensor status (from sensor-manager ranges)
          critical: 'Критический',
          humid: 'Влажный'
        }
      },
      tg: {
        translation: {
          // App title
          appTitle: 'IoT Монитори Рустанӣ v2',
          appSubtitle: 'Системаи назорати муҳит дар вақти воқеӣ',

          // Connection status
          connecting: 'Пайвастшавӣ...',
          connected: 'Пайваст',
          disconnected: 'Қатъ шуд',

          // Mode
          autoMode: 'Режаи автоматӣ',
          manualMode: 'Режаи дастӣ',
          autoModeDesc: 'Обёрии автоматӣ',
          manualModeDesc: 'Обёрии дастӣ',

          // Sensors
          soilMoisture: 'Намӣи замин',
          temperature: 'Ҳарорат',
          airHumidity: 'Намӣи ҳаво',
          lightLevel: 'Сатҳи равшанӣ',
          soilPH: 'pH замин',
          waiting: 'Интизорӣ...',

          // Sensor status
          dry: 'Хушк',
          low: 'Паст',
          optimal: 'Мувофиқ',
          high: 'Баланд',
          wet: 'Нам',
          cold: 'Хунук',
          cool: 'Салқин',
          warm: 'Гарм',
          hot: 'Тафсон',
          dark: 'Торик',
          dim: 'Камнур',
          bright: 'Равшан',
          veryBright: 'Ниҳоят равшан',
          acidic: 'Турш',
          neutral: 'Бетараф',
          alkaline: 'Ишқорӣ',
          unknown: 'Номаълум',

          // Control buttons
          manualWatering: 'Обёрии дастӣ',
          startWatering: 'Оғози обёрӣ',
          stopWatering: 'Истодани обёрӣ',
          watering: 'Обёрӣ',
          ready: 'Тайёр',
          scheduler: 'Барномарез',
          settings: 'Танзимот',

          // Chart
          sensorHistory: 'Таърихи датчикҳо',
          moisture: 'Намӣ',
          humidity: 'Намӣ',
          light: 'Равшанӣ',
          ph: 'pH',

          // Statistics
          avgMoisture: 'Миёнаи намӣ',
          waterings: 'Обёриҳо',
          duration: 'Давомнокӣ',
          maxMoisture: 'Макс. намӣ',
          minMoisture: 'Мин. намӣ',

          // Events table
          wateringEventsHistory: 'Таърихи обёриҳо',
          startTime: 'Оғоз',
          endTime: 'Анҷом',
          startPercent: 'Оғоз %',
          endPercent: 'Анҷом %',
          noWateringEvents: 'Обёрӣ ҳануз нест...',
          showingEvents: 'Нишон додани _START_ - _END_ аз _TOTAL_',
          noEventsToShow: 'Рӯйдодҳо нест',
          filteredFromTotal: '(филтр аз _MAX_)',
          showEvents: 'Нишон додан _MENU_',
          search: 'Ҷустуҷӯ...',
          noMatchingEvents: 'Мувофиқат нест',

          // Settings modal
          minThreshold: 'Ҳадди ақал (%)',
          optimalMin: 'Мувофиқ мин. (%)',
          optimalMax: 'Мувофиқ макс. (%)',
          cancel: 'Бекор',
          apply: 'Татбиқ',
          close: 'Пӯшидан',

          // Scheduler modal
          wateringScheduler: 'Барномарези обёрӣ',
          enableScheduler: 'Фаъоли барномарез',

          // Alerts
          sensorAlerts: 'Огоҳиҳои датчикҳо',
          gotIt: 'Фаҳмидам',

          // Theme
          dark: 'Торик',
          light: 'Равшан',
          system: 'Системӣ',

          // Notifications
          alerts: 'Огоҳиҳо',
          clearAll: 'Тоза кунед',
          noAlerts: 'Огоҳӣ нест',

          // Chart annotations
          optimalRange: 'Диапазони мувофиқ',
          minValue: 'Ҳадди ақал: {{value}}',

          // Chart y-axis labels
          yAxisSoilMoisture: 'Намии хок',

          // Duration format
          minuteShort: 'дақ',
          secondShort: 'сон',

          // Sensor status (from sensor-manager ranges)
          critical: 'Буҳронӣ',
          humid: 'Сернам'
        }
      }
    };

    this.init();
  }

  async init() {
    // Load saved language
    const savedLang = localStorage.getItem('language') || 'tg';
    this.currentLanguage = savedLang;

    // Initialize i18next
    await i18next.init({
      lng: savedLang,
      fallbackLng: 'en',
      resources: this.translations,
      interpolation: {
        escapeValue: false
      }
    });

    console.log('✅ i18next initialized with language:', savedLang);

    // Render language switcher
    this.renderLanguageSwitcher();

    // Apply translations to static content
    this.updatePageTranslations();
  }

  // Translate a key
  t(key, options) {
    return i18next.t(key, options);
  }

  // Get current language
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  // Get current language info
  getCurrentLanguageInfo() {
    return this.languages.find(l => l.id === this.currentLanguage);
  }

  // Switch language
  async switchLanguage(langId) {
    this.currentLanguage = langId;
    localStorage.setItem('language', langId);

    await i18next.changeLanguage(langId);

    // Close dropdown
    const dropdown = document.getElementById('languageDropdown');
    if (dropdown) {
      dropdown.classList.remove('active');
    }

    // Re-render switcher
    this.renderLanguageSwitcher();

    // Update page translations
    this.updatePageTranslations();

    // Trigger custom event for other components to update
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: langId } }));

    console.log('🌐 Language changed to:', langId);
  }

  // Render language switcher
  renderLanguageSwitcher() {
    const container = document.querySelector('.language-switcher');
    if (!container) return;

    const currentLang = this.getCurrentLanguageInfo();

    container.innerHTML = `
      <div class="dropdown" id="languageDropdown">
        <button class="dropdown-toggle" onclick="i18nManager.toggleLanguageDropdown()" title="${currentLang.nativeName}">
          <span>${currentLang.flag}</span>
        </button>
        <div class="dropdown-content">
          ${this.languages.map(lang => `
            <div class="dropdown-item ${lang.id === this.currentLanguage ? 'active' : ''}"
                 onclick="i18nManager.switchLanguage('${lang.id}')">
              <div class="dropdown-item-flag">${lang.flag}</div>
              <div class="dropdown-item-text">
                <div class="title">${lang.nativeName}</div>
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
      } else if (typeof feather !== 'undefined') {
        feather.replace();
      }
    }, 100);

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      const dropdown = document.getElementById('languageDropdown');
      if (dropdown && !dropdown.contains(e.target)) {
        dropdown.classList.remove('active');
      }
    });
  }

  // Toggle language dropdown
  toggleLanguageDropdown() {
    const dropdown = document.getElementById('languageDropdown');
    if (dropdown) {
      dropdown.classList.toggle('active');
    }
  }

  // Update all page translations
  updatePageTranslations() {
    // Update page title
    document.title = this.t('appTitle') + ' - Professional Dashboard';

    // Update HTML lang attribute
    document.documentElement.lang = this.currentLanguage;

    // Update static text elements
    const updates = [
      // Header
      { selector: '.main-title span, .main-title', text: 'appTitle', isInnerHTML: false },
      { selector: '.subtitle', text: 'appSubtitle' },
      { selector: '.status-bar-title span', text: 'appTitle' },

      // Connection status - wait text
      { selector: '.connection-status span', text: 'connecting' },

      // Sensor cards
      { selector: '[data-sensor="soilMoisture"] .sensor-header h3', text: 'soilMoisture' },
      { selector: '[data-sensor="temperature"] .sensor-header h3', text: 'temperature' },
      { selector: '[data-sensor="airHumidity"] .sensor-header h3', text: 'airHumidity' },
      { selector: '[data-sensor="light"] .sensor-header h3', text: 'lightLevel' },
      { selector: '[data-sensor="pH"] .sensor-header h3', text: 'soilPH' },

      // Sensor waiting status
      { selector: '#soilMoisture-status', text: 'waiting', condition: (el) => el.textContent === 'Waiting...' || el.textContent.includes('...') },
      { selector: '#temperature-status', text: 'waiting', condition: (el) => el.textContent === 'Waiting...' || el.textContent.includes('...') },
      { selector: '#airHumidity-status', text: 'waiting', condition: (el) => el.textContent === 'Waiting...' || el.textContent.includes('...') },
      { selector: '#light-status', text: 'waiting', condition: (el) => el.textContent === 'Waiting...' || el.textContent.includes('...') },
      { selector: '#pH-status', text: 'waiting', condition: (el) => el.textContent === 'Waiting...' || el.textContent.includes('...') },

      // Control buttons
      { selector: '#manualWateringBtn span', text: 'manualWatering' },
      { selector: '.control-btn:nth-child(2) span', text: 'scheduler' },
      { selector: '.control-btn:nth-child(3) span', text: 'settings' },

      // Chart
      { selector: '.chart-header h2 span, .chart-header h2', text: 'sensorHistory', isInnerHTML: false },

      // Statistics
      { selector: '.stat-card:nth-child(1) .stat-label', text: 'avgMoisture' },
      { selector: '.stat-card:nth-child(2) .stat-label', text: 'waterings' },
      { selector: '.stat-card:nth-child(3) .stat-label', text: 'duration' },
      { selector: '.stat-card:nth-child(4) .stat-label', text: 'maxMoisture' },
      { selector: '.stat-card:nth-child(5) .stat-label', text: 'minMoisture' },

      // Events section
      { selector: '.events-section summary span, .events-section summary', text: 'wateringEventsHistory', isInnerHTML: false },

      // Alert modal
      { selector: '#alertModalTitle', text: 'sensorAlerts' },
      { selector: '#alertModal .btn-primary', text: 'gotIt' }
    ];

    updates.forEach(({ selector, text, isInnerHTML, condition }) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (el) {
          // Check condition if provided
          if (condition && !condition(el)) return;

          // For elements that contain icons, we need to preserve them
          if (isInnerHTML === false) {
            // Find text node and update only text
            const childNodes = Array.from(el.childNodes);
            const textNode = childNodes.find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
            if (textNode) {
              textNode.textContent = this.t(text);
            } else {
              // If no text node, check for span
              const span = el.querySelector('span');
              if (span) {
                span.textContent = this.t(text);
              }
            }
          } else {
            el.textContent = this.t(text);
          }
        }
      });
    });

    // Update events table headers
    const tableHeaders = document.querySelectorAll('#eventsTable thead th');
    if (tableHeaders.length >= 5) {
      tableHeaders[0].textContent = this.t('startTime');
      tableHeaders[1].textContent = this.t('endTime');
      tableHeaders[2].textContent = this.t('duration');
      tableHeaders[3].textContent = this.t('startPercent');
      tableHeaders[4].textContent = this.t('endPercent');
    }

    // Update mode indicator
    this.updateModeIndicator();

    // Update chart tabs
    this.updateChartTabs();
  }

  // Update mode indicator text
  updateModeIndicator() {
    const modeIndicator = document.querySelector('.mode-indicator');
    if (modeIndicator) {
      const isManual = modeIndicator.classList.contains('manual');
      modeIndicator.textContent = isManual ? this.t('manualMode') : this.t('autoMode');
    }
  }

  // Update chart tabs
  updateChartTabs() {
    const tabs = document.querySelectorAll('.chart-tab');
    const labels = ['moisture', 'temperature', 'humidity', 'light', 'ph'];

    tabs.forEach((tab, index) => {
      if (labels[index]) {
        tab.textContent = this.t(labels[index]);
      }
    });
  }

  // Get DataTables language config
  getDataTablesLanguage() {
    return {
      emptyTable: this.t('noWateringEvents'),
      info: this.t('showingEvents'),
      infoEmpty: this.t('noEventsToShow'),
      infoFiltered: this.t('filteredFromTotal'),
      lengthMenu: this.t('showEvents'),
      search: '',
      searchPlaceholder: this.t('search'),
      zeroRecords: this.t('noMatchingEvents'),
      paginate: {
        first: '«',
        last: '»',
        next: '›',
        previous: '‹'
      }
    };
  }

  // Translate sensor status
  translateSensorStatus(status) {
    const statusMap = {
      'Dry': 'dry',
      'Low': 'low',
      'Optimal': 'optimal',
      'High': 'high',
      'Wet': 'wet',
      'Cold': 'cold',
      'Cool': 'cool',
      'Warm': 'warm',
      'Hot': 'hot',
      'Dark': 'dark',
      'Dim': 'dim',
      'Bright': 'bright',
      'Very Bright': 'veryBright',
      'Acidic': 'acidic',
      'Neutral': 'neutral',
      'Alkaline': 'alkaline',
      'Unknown': 'unknown',
      'Waiting...': 'waiting',
      'Critical': 'critical',
      'Humid': 'humid'
    };

    const key = statusMap[status];
    return key ? this.t(key) : status;
  }

  // Format duration with translations
  formatDuration(minutes, seconds) {
    const m = this.t('minuteShort');
    const s = this.t('secondShort');
    return `${minutes}${m} ${seconds}${s}`;
  }

  // Get chart annotation translations
  getChartAnnotations(min) {
    return {
      optimalRange: this.t('optimalRange'),
      minValue: this.t('minValue', { value: min })
    };
  }
}

// Initialize i18n manager
let i18nManager;
document.addEventListener('DOMContentLoaded', () => {
  // Wait for i18next to be loaded
  if (typeof i18next !== 'undefined') {
    i18nManager = new I18nManager();
  } else {
    console.error('i18next not loaded');
  }
});
