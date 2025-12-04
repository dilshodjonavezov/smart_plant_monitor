const WebSocket = require('ws');
const MoistureSimulator = require('./simulator');
const ProfileStorage = require('./profile-storage');
const WateringScheduler = require('./scheduler');

const PORT = 8080;
const wss = new WebSocket.Server({ port: PORT });

const simulator = new MoistureSimulator();
const profileStorage = new ProfileStorage();
const scheduler = new WateringScheduler(simulator);

// Pass automation rules to simulator
simulator.setAutomationRules(profileStorage.getAutomationRules());

console.log(`🚀 WebSocket server started on port ${PORT}`);
console.log(`📊 IoT simulation running with ${profileStorage.getAllProfiles().length} profiles...`);
console.log(`📋 Automation rules loaded: ${Object.keys(profileStorage.getAutomationRules()).length} sensors`);

// Broadcast data to all connected clients
function broadcast(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// Main simulation loop - runs every 2 seconds
setInterval(() => {
  simulator.simulate();
  const data = simulator.getData();
  broadcast(data);
}, 2000);

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('✅ Client connected');

  // Send current state immediately on connection
  ws.send(JSON.stringify(simulator.getData()));

  // Handle messages from client
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'configUpdate') {
        simulator.updateConfig(data.settings);
        // Broadcast updated config to all clients
        broadcast(simulator.getData());
      } else if (data.type === 'manualWatering') {
        // Handle manual watering control
        if (data.action === 'start') {
          simulator.startManualWatering();
        } else if (data.action === 'stop') {
          simulator.stopManualWatering();
        }
        // Broadcast updated state to all clients
        broadcast(simulator.getData());
      } else if (data.type === 'getProfiles') {
        // Send profiles with automation config to client
        ws.send(JSON.stringify({
          type: 'profiles',
          data: profileStorage.getAllProfiles(),
          automationRules: profileStorage.getAutomationRules(),
          alertMessages: profileStorage.getAlertMessages()
        }));
      } else if (data.type === 'saveProfile') {
        // Save profile
        const success = profileStorage.saveProfile(data.profile);
        ws.send(JSON.stringify({
          type: 'profileSaved',
          success: success,
          profile: data.profile
        }));
        // Broadcast updated profiles to all clients
        broadcast({
          type: 'profiles',
          data: profileStorage.getAllProfiles(),
          automationRules: profileStorage.getAutomationRules(),
          alertMessages: profileStorage.getAlertMessages()
        });
      } else if (data.type === 'deleteProfile') {
        // Delete profile
        const success = profileStorage.deleteProfile(data.profileId);
        ws.send(JSON.stringify({
          type: 'profileDeleted',
          success: success,
          profileId: data.profileId
        }));
      } else if (data.type === 'switchProfile') {
        // Switch active profile and update ALL thresholds
        const profile = profileStorage.getProfile(data.profileId);
        if (profile && profile.thresholds) {
          // Pass all thresholds to simulator
          simulator.updateConfig({
            thresholds: profile.thresholds
          });
          console.log(`🌱 Switched to profile: ${profile.name} (${profile.icon})`);
          console.log(`   Soil Moisture: min=${profile.thresholds.soilMoisture?.min}%, optimal=${profile.thresholds.soilMoisture?.optimal}`);
          console.log(`   Air Temp: min=${profile.thresholds.airTemperature?.min}°C, max=${profile.thresholds.airTemperature?.max}°C`);
          console.log(`   Air Humidity: min=${profile.thresholds.airHumidity?.min}%, max=${profile.thresholds.airHumidity?.max}%`);
          console.log(`   Soil pH: min=${profile.thresholds.soilPH?.min}, max=${profile.thresholds.soilPH?.max}`);
        }
        broadcast(simulator.getData());
      } else if (data.type === 'getSchedules') {
        // Send schedules to client
        ws.send(JSON.stringify({
          type: 'schedules',
          data: scheduler.getStatus()
        }));
      } else if (data.type === 'saveSchedule') {
        // Save schedule
        const success = scheduler.addSchedule(data.schedule);
        ws.send(JSON.stringify({
          type: 'scheduleSaved',
          success: success,
          schedule: data.schedule
        }));
      } else if (data.type === 'deleteSchedule') {
        // Delete schedule
        const success = scheduler.deleteSchedule(data.scheduleId);
        ws.send(JSON.stringify({
          type: 'scheduleDeleted',
          success: success,
          scheduleId: data.scheduleId
        }));
      } else if (data.type === 'setSchedulerEnabled') {
        // Enable/disable scheduler
        scheduler.setEnabled(data.enabled);
        broadcast({
          type: 'schedules',
          data: scheduler.getStatus()
        });
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('❌ Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  wss.close(() => {
    console.log('👋 Server closed');
    process.exit(0);
  });
});
