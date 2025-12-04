/**
 * Scheduler UI - manages watering schedule interface
 */
class SchedulerUI {
  constructor(wsManager) {
    this.wsManager = wsManager;
    this.schedules = [];
    this.enabled = false;
  }

  // Set schedules data
  setSchedules(data) {
    this.schedules = data.schedules || [];
    this.enabled = data.enabled || false;
  }

  // Render schedule list
  renderSchedules() {
    const container = document.getElementById('scheduleList');
    if (!container) return;

    if (this.schedules.length === 0) {
      container.innerHTML = `
        <div class="text-center text-gray-500 py-8">
          <i data-feather="calendar" class="w-12 h-12 mx-auto mb-2 opacity-50"></i>
          <p>No schedules configured</p>
          <button class="btn btn-sm btn-primary mt-4" onclick="app.schedulerUI.showScheduleModal()">
            <i data-feather="plus" class="w-4 h-4"></i>
            Add Schedule
          </button>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="space-y-2">
          ${this.schedules.map(schedule => this.renderScheduleItem(schedule)).join('')}
        </div>
        <button class="btn btn-sm btn-primary w-full mt-4" onclick="app.schedulerUI.showScheduleModal()">
          <i data-feather="plus" class="w-4 h-4"></i>
          Add New Schedule
        </button>
      `;
    }

    // Replace feather icons (throttled)
    if (typeof window.replaceFeatherIcons === 'function') {
      window.replaceFeatherIcons();
    }
  }

  // Render single schedule item
  renderScheduleItem(schedule) {
    const daysShort = {
      monday: 'Mon',
      tuesday: 'Tue',
      wednesday: 'Wed',
      thursday: 'Thu',
      friday: 'Fri',
      saturday: 'Sat',
      sunday: 'Sun'
    };

    const daysText = schedule.days.map(d => daysShort[d]).join(', ');
    const durationMin = Math.floor(schedule.duration / 60);
    const durationSec = schedule.duration % 60;

    return `
      <div class="card bg-base-200 p-4">
        <div class="flex items-center justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <i data-feather="clock" class="w-4 h-4"></i>
              <span class="font-bold text-lg">${schedule.time}</span>
              <span class="badge badge-sm">${durationMin}m ${durationSec}s</span>
            </div>
            <div class="text-sm opacity-70 mt-1">${daysText}</div>
          </div>
          <div class="flex items-center gap-2">
            <input type="checkbox" class="toggle toggle-success"
                   ${schedule.enabled ? 'checked' : ''}
                   onchange="app.schedulerUI.toggleSchedule('${schedule.id}', this.checked)">
            <button class="btn btn-square btn-sm btn-ghost"
                    onclick="app.schedulerUI.editSchedule('${schedule.id}')">
              <i data-feather="edit" class="w-4 h-4"></i>
            </button>
            <button class="btn btn-square btn-sm btn-ghost text-error"
                    onclick="app.schedulerUI.deleteSchedule('${schedule.id}')">
              <i data-feather="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Show scheduler modal
  showScheduleModal(scheduleId = null) {
    const schedule = scheduleId ? this.schedules.find(s => s.id === scheduleId) : null;

    const modal = document.getElementById('schedulerModal');
    if (!modal) return;

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    modal.innerHTML = `
      <div class="modal-box max-w-2xl">
        <h3 class="font-bold text-2xl mb-4">
          ${schedule ? 'Edit Schedule' : 'Create New Schedule'}
        </h3>

        <form id="scheduleForm" class="space-y-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Time</span>
            </label>
            <input type="time" name="time" class="input input-bordered"
                   value="${schedule?.time || '07:00'}" required>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Duration (seconds)</span>
            </label>
            <input type="number" name="duration" class="input input-bordered"
                   value="${schedule?.duration || 300}" min="1" max="3600" step="1" required>
            <label class="label">
              <span class="label-text-alt">How long to water (1-3600 seconds)</span>
            </label>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Days of Week</span>
            </label>
            <div class="grid grid-cols-4 gap-2">
              ${days.map(day => `
                <label class="label cursor-pointer justify-start gap-2">
                  <input type="checkbox" name="days" value="${day}" class="checkbox checkbox-sm"
                         ${schedule?.days?.includes(day) ? 'checked' : ''}>
                  <span class="label-text capitalize">${day}</span>
                </label>
              `).join('')}
            </div>
          </div>

          <div class="form-control">
            <label class="label cursor-pointer">
              <span class="label-text">Enable this schedule</span>
              <input type="checkbox" name="enabled" class="toggle toggle-success"
                     ${schedule?.enabled !== false ? 'checked' : ''}>
            </label>
          </div>

          <div class="modal-action">
            <button type="button" class="btn" onclick="document.getElementById('schedulerModal').close()">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              ${schedule ? 'Save Changes' : 'Create Schedule'}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button>close</button>
      </form>
    `;

    // Handle form submission
    document.getElementById('scheduleForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);

      const selectedDays = Array.from(formData.getAll('days'));
      if (selectedDays.length === 0) {
        alert('Please select at least one day');
        return;
      }

      const newSchedule = {
        id: schedule?.id || `schedule_${Date.now()}`,
        time: formData.get('time'),
        duration: parseInt(formData.get('duration')),
        days: selectedDays,
        enabled: formData.get('enabled') === 'on'
      };

      this.saveSchedule(newSchedule);
      modal.close();
    });

    modal.showModal();
  }

  // Edit schedule
  editSchedule(scheduleId) {
    this.showScheduleModal(scheduleId);
  }

  // Toggle schedule enabled/disabled
  toggleSchedule(scheduleId, enabled) {
    const schedule = this.schedules.find(s => s.id === scheduleId);
    if (schedule) {
      schedule.enabled = enabled;
      this.saveSchedule(schedule);
    }
  }

  // Save schedule
  saveSchedule(schedule) {
    this.wsManager.send({
      type: 'saveSchedule',
      schedule: schedule
    });
  }

  // Delete schedule
  deleteSchedule(scheduleId) {
    if (confirm('Are you sure you want to delete this schedule?')) {
      this.wsManager.send({
        type: 'deleteSchedule',
        scheduleId: scheduleId
      });
    }
  }

  // Toggle scheduler globally
  toggleScheduler(enabled) {
    this.wsManager.send({
      type: 'setSchedulerEnabled',
      enabled: enabled
    });
  }
}
