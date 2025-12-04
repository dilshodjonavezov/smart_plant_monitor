class WateringScheduler {
  constructor(simulator) {
    this.simulator = simulator;
    this.schedules = [];
    this.enabled = false;
    this.checkInterval = null;
  }

  // Start scheduler (check every minute)
  start() {
    if (this.checkInterval) {
      return; // Already running
    }

    this.enabled = true;
    console.log('⏰ Scheduler started');

    // Check immediately
    this.checkSchedule();

    // Then check every minute
    this.checkInterval = setInterval(() => {
      this.checkSchedule();
    }, 60000); // 60 seconds
  }

  // Stop scheduler
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      this.enabled = false;
      console.log('⏰ Scheduler stopped');
    }
  }

  // Check if any schedule should be triggered
  checkSchedule() {
    if (!this.enabled || this.schedules.length === 0) {
      return;
    }

    const now = new Date();
    const currentDay = this.getDayName(now.getDay());
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    this.schedules.forEach(schedule => {
      if (!schedule.enabled) {
        return;
      }

      // Check if today is in the schedule
      if (!schedule.days.includes(currentDay)) {
        return;
      }

      // Check if time matches
      if (schedule.time === currentTime) {
        console.log(`⏰ Schedule triggered: ${schedule.id} at ${currentTime}`);
        this.triggerSchedule(schedule);
      }
    });
  }

  // Trigger scheduled watering
  triggerSchedule(schedule) {
    // Start watering
    this.simulator.startWatering();

    // Stop after duration
    setTimeout(() => {
      this.simulator.stopWatering();
      console.log(`⏰ Scheduled watering completed: ${schedule.id}`);
    }, schedule.duration * 1000);
  }

  // Get day name from day number
  getDayName(dayNum) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[dayNum];
  }

  // Add or update schedule
  addSchedule(schedule) {
    const index = this.schedules.findIndex(s => s.id === schedule.id);

    if (index !== -1) {
      this.schedules[index] = schedule;
      console.log(`📝 Schedule updated: ${schedule.id}`);
    } else {
      this.schedules.push(schedule);
      console.log(`➕ Schedule added: ${schedule.id}`);
    }

    return true;
  }

  // Delete schedule
  deleteSchedule(id) {
    const index = this.schedules.findIndex(s => s.id === id);

    if (index !== -1) {
      this.schedules.splice(index, 1);
      console.log(`🗑️ Schedule deleted: ${id}`);
      return true;
    }

    return false;
  }

  // Get all schedules
  getSchedules() {
    return this.schedules;
  }

  // Enable/disable scheduler
  setEnabled(enabled) {
    this.enabled = enabled;

    if (enabled) {
      this.start();
    } else {
      this.stop();
    }
  }

  // Get scheduler status
  getStatus() {
    return {
      enabled: this.enabled,
      schedules: this.schedules
    };
  }
}

module.exports = WateringScheduler;
