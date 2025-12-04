/**
 * Chart Manager - manages ApexCharts visualizations
 */
class ChartManager {
  constructor(containerId) {
    this.containerId = containerId;
    this.chart = null;
    this.currentSensor = 'soilMoisture';
    this.data = {};
    this.updateThrottleTimer = null;
    this.lastUpdateTime = 0;
    this.minUpdateInterval = 1000; // Minimum 1 second between updates
  }

  // Initialize chart
  initChart(sensorName = 'soilMoisture') {
    this.currentSensor = sensorName;

    const options = {
      series: [{
        name: 'Value',
        data: []
      }],
      chart: {
        type: 'area',
        height: 350,
        animations: {
          enabled: true,
          easing: 'linear',
          speed: 400,
          animateGradually: {
            enabled: false
          },
          dynamicAnimation: {
            enabled: true,
            speed: 200
          }
        },
        redrawOnParentResize: false,
        redrawOnWindowResize: true,
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true
          }
        },
        background: 'transparent',
        foreColor: '#9ca3af'
      },
      colors: ['#3b82f6'],
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth',
        width: 3
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.2,
          stops: [0, 90, 100]
        }
      },
      xaxis: {
        type: 'datetime',
        labels: {
          datetimeFormatter: {
            year: 'yyyy',
            month: 'MMM \'yy',
            day: 'dd MMM',
            hour: 'HH:mm',
            minute: 'HH:mm:ss'
          }
        }
      },
      yaxis: {
        title: {
          text: typeof i18nManager !== 'undefined' ? i18nManager.t('yAxisSoilMoisture') : 'Soil Moisture'
        },
        labels: {
          formatter: (value) => {
            return value.toFixed(1) + '%';
          }
        }
      },
      tooltip: {
        theme: 'dark',
        x: {
          format: 'dd MMM HH:mm:ss'
        },
        y: {
          formatter: (value) => {
            return value.toFixed(2);
          }
        }
      },
      grid: {
        borderColor: '#374151',
        strokeDashArray: 4
      },
      annotations: {
        yaxis: []
      }
    };

    this.chart = new ApexCharts(document.querySelector(`#${this.containerId}`), options);
    this.chart.render();
  }

  // Update chart with new data (throttled)
  updateChart(sensorName, history) {
    if (!this.chart) {
      this.initChart(sensorName);
      return;
    }

    // If sensor changed, re-initialize immediately
    if (sensorName !== this.currentSensor) {
      this.currentSensor = sensorName;
      this.chart.destroy();
      this.initChart(sensorName);
      return;
    }

    // Throttle updates to prevent forced reflows
    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastUpdateTime;

    if (timeSinceLastUpdate < this.minUpdateInterval) {
      // Schedule update for later
      if (this.updateThrottleTimer) {
        clearTimeout(this.updateThrottleTimer);
      }

      this.updateThrottleTimer = setTimeout(() => {
        this.performChartUpdate(sensorName, history);
      }, this.minUpdateInterval - timeSinceLastUpdate);
      return;
    }

    // Perform update immediately
    this.performChartUpdate(sensorName, history);
  }

  // Internal method to perform the actual chart update
  performChartUpdate(sensorName, history) {
    if (!this.chart) return;

    this.lastUpdateTime = Date.now();

    // Format data for ApexCharts
    const seriesData = history.map(item => ({
      x: new Date(item.timestamp).getTime(),
      y: item.value
    }));

    // Update series with animations disabled to reduce reflows
    requestAnimationFrame(() => {
      this.chart.updateSeries([{
        name: sensorName,
        data: seriesData
      }], false);
    });
  }

  // Add threshold annotations
  addThresholds(min, optimalMin, optimalMax) {
    if (!this.chart) return;

    // Get translated labels if i18n is available
    let minLabel = `Min: ${min}`;
    let optimalLabel = 'Optimal Range';
    let minOffsetX = 44; // default for English
    let optimalOffsetX = 80; // default for English

    if (typeof i18nManager !== 'undefined') {
      const annotations = i18nManager.getChartAnnotations(min);
      minLabel = annotations.minValue;
      optimalLabel = annotations.optimalRange;

      // Set offsetX based on current language
      const currentLang = i18nManager.getCurrentLanguage();
      switch (currentLang) {
        case 'tg': // Tajik
          minOffsetX = 86;
          optimalOffsetX = 112;
          break;
        case 'ru': // Russian
          minOffsetX = 46;
          optimalOffsetX = 128;
          break;
        case 'en': // English
        default:
          minOffsetX = 44;
          optimalOffsetX = 80;
          break;
      }
    }

    const annotations = [
      // Min threshold line
      {
        y: min,
        borderColor: '#ef4444',
        label: {
          borderColor: '#ef4444',
          style: {
            color: '#fff',
            background: '#ef4444'
          },
          text: minLabel,
          position: 'left',
          offsetX: minOffsetX
        }
      },
      // Optimal range zone
      {
        y: optimalMin,
        y2: optimalMax,
        fillColor: '#22c55e',
        opacity: 0.1,
        label: {
          borderColor: '#22c55e',
          style: {
            color: '#fff',
            background: '#22c55e'
          },
          text: optimalLabel,
          position: 'left',
          offsetX: optimalOffsetX
        }
      }
    ];

    this.chart.updateOptions({
      annotations: {
        yaxis: annotations
      }
    });
  }

  // Clear annotations
  clearAnnotations() {
    if (!this.chart) return;

    this.chart.updateOptions({
      annotations: {
        yaxis: []
      }
    });
  }

  // Update chart colors
  updateColors(colors) {
    if (!this.chart) return;

    this.chart.updateOptions({
      colors: colors
    });
  }

  // Destroy chart
  destroy() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }
}
