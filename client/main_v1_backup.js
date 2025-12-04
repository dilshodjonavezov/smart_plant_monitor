// WebSocket connection
let ws = null;
let chart = null;
let moistureHistory = [];
const MAX_HISTORY_POINTS = 30;

// Initialize application
function init() {
    setupChart();
    connectWebSocket();
    setupEventListeners();
}

// Setup Chart.js
function setupChart() {
    const ctx = document.getElementById('moistureChart').getContext('2d');

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Moisture Level (%)',
                data: [],
                borderColor: 'rgb(96, 165, 250)',
                backgroundColor: 'rgba(96, 165, 250, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: 'rgb(96, 165, 250)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: 'rgb(156, 163, 175)',
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'rgb(96, 165, 250)',
                    bodyColor: 'rgb(255, 255, 255)',
                    borderColor: 'rgb(96, 165, 250)',
                    borderWidth: 1
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        color: 'rgb(156, 163, 175)',
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: 'rgba(75, 85, 99, 0.3)'
                    }
                },
                x: {
                    ticks: {
                        color: 'rgb(156, 163, 175)',
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        color: 'rgba(75, 85, 99, 0.3)'
                    }
                }
            },
            animation: {
                duration: 750,
                easing: 'easeInOutQuart'
            }
        }
    });
}

// Connect to WebSocket server
function connectWebSocket() {
    ws = new WebSocket('ws://localhost:8080');

    ws.onopen = () => {
        console.log('✅ Connected to WebSocket server');
        updateConnectionStatus(true);
    };

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            handleServerData(data);
        } catch (error) {
            console.error('Error parsing server data:', error);
        }
    };

    ws.onclose = () => {
        console.log('❌ Disconnected from WebSocket server');
        updateConnectionStatus(false);

        // Try to reconnect after 3 seconds
        setTimeout(() => {
            console.log('🔄 Attempting to reconnect...');
            connectWebSocket();
        }, 3000);
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
}

// Update connection status indicator
function updateConnectionStatus(isConnected) {
    const statusElement = document.getElementById('connectionStatus');

    if (isConnected) {
        statusElement.innerHTML = '<span class="status-indicator status-active"></span> Connected';
        statusElement.className = 'badge badge-lg badge-success';
    } else {
        statusElement.innerHTML = '<span class="status-indicator status-inactive"></span> Disconnected';
        statusElement.className = 'badge badge-lg badge-error';
    }
}

// Handle data from server
function handleServerData(data) {
    // Update moisture display
    updateMoistureDisplay(data.moisture);

    // Update watering status
    updateWateringStatus(data.isWatering);

    // Update chart
    updateChart(data.moisture, data.timestamp);

    // Update watering events table
    updateEventsTable(data.wateringEvents);

    // Update statistics
    updateStatistics(data.wateringEvents);

    // Update settings if config received
    if (data.config) {
        updateSettingsDisplay(data.config);
    }

    // Update last update timestamp
    updateLastUpdateTime(data.timestamp);
}

// Update moisture display
function updateMoistureDisplay(moisture) {
    const moistureElement = document.getElementById('moistureValue');
    const progressElement = document.getElementById('moistureProgress');

    // Smooth transition
    moistureElement.style.opacity = '0.5';
    setTimeout(() => {
        moistureElement.textContent = moisture.toFixed(1);
        progressElement.value = moisture;
        moistureElement.style.opacity = '1';
    }, 150);

    // Color coding based on moisture level
    if (moisture < 60) {
        moistureElement.className = 'moisture-display text-red-400';
        progressElement.className = 'progress progress-error w-full h-4';
    } else if (moisture < 70) {
        moistureElement.className = 'moisture-display text-yellow-400';
        progressElement.className = 'progress progress-warning w-full h-4';
    } else {
        moistureElement.className = 'moisture-display text-green-400';
        progressElement.className = 'progress progress-success w-full h-4';
    }
}

// Update watering status
function updateWateringStatus(isWatering) {
    const statusElement = document.getElementById('wateringStatus');

    if (isWatering) {
        statusElement.innerHTML = `
            <div class="text-5xl mb-2 animate-pulse-slow">💧</div>
            <div class="text-xl text-green-400 font-bold">Watering Active</div>
            <div class="mt-2">
                <span class="loading loading-dots loading-lg text-green-400"></span>
            </div>
        `;
    } else {
        statusElement.innerHTML = `
            <div class="text-5xl mb-2">⏸️</div>
            <div class="text-xl text-gray-400">Inactive</div>
        `;
    }
}

// Update chart with new data
function updateChart(moisture, timestamp) {
    const time = new Date(timestamp).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    moistureHistory.push({ time, moisture });

    // Keep only last MAX_HISTORY_POINTS
    if (moistureHistory.length > MAX_HISTORY_POINTS) {
        moistureHistory.shift();
    }

    // Update chart data
    chart.data.labels = moistureHistory.map(item => item.time);
    chart.data.datasets[0].data = moistureHistory.map(item => item.moisture);
    chart.update('none'); // 'none' for no animation on update
}

// Update watering events table
function updateEventsTable(events) {
    const tableBody = document.getElementById('eventsTable');

    if (!events || events.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-gray-500">No watering events yet...</td>
            </tr>
        `;
        return;
    }

    // Show events in reverse order (newest first)
    const sortedEvents = [...events].reverse();

    tableBody.innerHTML = sortedEvents.map(event => {
        const startTime = new Date(event.start).toLocaleTimeString('ru-RU');
        const endTime = new Date(event.end).toLocaleTimeString('ru-RU');
        const duration = formatDuration(event.durationSec);

        return `
            <tr class="fade-in">
                <td>${startTime}</td>
                <td>${endTime}</td>
                <td><span class="badge badge-info">${duration}</span></td>
                <td><span class="text-red-400">${event.moistureStart}%</span></td>
                <td><span class="text-green-400">${event.moistureEnd}%</span></td>
            </tr>
        `;
    }).join('');
}

// Update statistics
function updateStatistics(events) {
    if (!events || events.length === 0) {
        document.getElementById('statAvg').textContent = '--';
        document.getElementById('statCount').textContent = '0';
        document.getElementById('statDuration').textContent = '0';
        document.getElementById('statMax').textContent = '--';
        document.getElementById('statMin').textContent = '--';
        return;
    }

    // Calculate statistics from moisture history
    if (moistureHistory.length > 0) {
        const moistureValues = moistureHistory.map(item => item.moisture);
        const avg = (moistureValues.reduce((a, b) => a + b, 0) / moistureValues.length).toFixed(1);
        const max = Math.max(...moistureValues).toFixed(1);
        const min = Math.min(...moistureValues).toFixed(1);

        document.getElementById('statAvg').textContent = avg;
        document.getElementById('statMax').textContent = max;
        document.getElementById('statMin').textContent = min;
    }

    // Watering statistics
    document.getElementById('statCount').textContent = events.length;

    const totalDuration = events.reduce((sum, event) => sum + event.durationSec, 0);
    document.getElementById('statDuration').textContent = totalDuration;
}

// Format duration in seconds to readable string
function formatDuration(seconds) {
    if (seconds < 60) {
        return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
}

// Update settings display
function updateSettingsDisplay(config) {
    document.getElementById('minThreshold').value = config.minThreshold;
    document.getElementById('optimalMin').value = config.optimalMin;
    document.getElementById('optimalMax').value = config.optimalMax;
}

// Update last update timestamp
function updateLastUpdateTime(timestamp) {
    const time = new Date(timestamp).toLocaleTimeString('ru-RU');
    document.getElementById('lastUpdate').textContent = time;
}

// Setup event listeners
function setupEventListeners() {
    // Apply settings button
    document.getElementById('applySettings').addEventListener('click', () => {
        const settings = {
            minThreshold: parseInt(document.getElementById('minThreshold').value),
            optimalMin: parseInt(document.getElementById('optimalMin').value),
            optimalMax: parseInt(document.getElementById('optimalMax').value)
        };

        // Validate settings
        if (settings.minThreshold >= settings.optimalMin) {
            alert('Min threshold must be less than optimal minimum!');
            return;
        }

        if (settings.optimalMin >= settings.optimalMax) {
            alert('Optimal min must be less than optimal max!');
            return;
        }

        // Send to server
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'configUpdate',
                settings: settings
            }));

            // Show success feedback
            const button = document.getElementById('applySettings');
            const originalText = button.textContent;
            button.textContent = '✓ Applied!';
            button.classList.add('btn-success');

            setTimeout(() => {
                button.textContent = originalText;
                button.classList.remove('btn-success');
            }, 2000);
        } else {
            alert('Not connected to server!');
        }
    });
}

// Start the application when page loads
document.addEventListener('DOMContentLoaded', init);
