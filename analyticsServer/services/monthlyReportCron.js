/**
 * Monthly Financial Report Cron Job — runs on the ANALYTICS server
 *
 * Fires at 00:00 on the 1st of every month.
 * Sends the previous month's financial report PDF to all active users.
 *
 * Required env vars (analytics server .env):
 *   MONGO_URI        — shared MongoDB (same as main server)
 *   RESEND_API_KEY   — copy from main server .env
 *   EMAIL_DOMAIN     — e.g. financetracker.space
 *   APP_URL          — e.g. https://financetracker.space
 *
 * Usage (analytics server entry point):
 *   const cron = require('./monthlyReportCron');
 *   cron.start();
 *
 *   // Manual test (skips date check):
 *   cron.triggerNow();
 *   cron.triggerNow({ year: 2026, month: 2 }); // specific month
 */

const monthlyReportService = require('./monthlyReportService');

class MonthlyReportCron {
  constructor() {
    this.timer        = null;
    this.isRunning    = false;
    this.checkInterval = 60 * 1000; // check every minute
  }

  /**
   * Returns true if right now is the 1st of the month within the trigger window.
   * We use a 1-minute window so a missed tick isn't a problem.
   */
  _shouldTrigger(now) {
    return (
      now.getDate()    === 1  &&
      now.getHours()   === 0  &&
      now.getMinutes() === 0
    );
  }

  /** How many ms until the next 00:00 on the 1st */
  _msUntilNextRun() {
    const now  = new Date();
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
    return next.getTime() - now.getTime();
  }

  /**
   * Core tick — called every minute.
   * Prevents overlapping runs with isRunning guard.
   */
  async _tick() {
    const now = new Date();

    if (!this._shouldTrigger(now)) return;
    if (this.isRunning) {
      console.warn('⚠️  Monthly report job already running — skipping duplicate trigger');
      return;
    }

    this.isRunning = true;
    console.log(`🚀 Monthly report job started at ${now.toISOString()}`);

    try {
      await monthlyReportService.sendReportsToAllUsers();
      console.log('✅ Monthly report job completed successfully');
    } catch (err) {
      console.error('❌ Monthly report job failed:', err.message);
    } finally {
      this.isRunning = false;
    }
  }

  /** Start the cron — logs next scheduled run */
  start() {
    if (this.timer) {
      console.warn('⚠️  Monthly report cron already started');
      return;
    }

    const msToNext = this._msUntilNextRun();
    const nextRun  = new Date(Date.now() + msToNext);
    console.log(`📅 Monthly report cron started. Next run: ${nextRun.toLocaleString('en-IN')}`);

    this.timer = setInterval(() => this._tick(), this.checkInterval);

    // Keep the interval from blocking process exit
    if (this.timer.unref) this.timer.unref();
  }

  stop() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
    console.log('🛑 Monthly report cron stopped');
  }

  /**
   * Manually trigger for testing / backfill — bypasses the date check.
   * Pass an explicit { year, month } to target a specific period (1-indexed month).
   */
  async triggerNow(overrideMonth = null) {
    if (this.isRunning) {
      console.warn('⚠️  Job already running');
      return;
    }
    this.isRunning = true;
    console.log('🔧 Manual trigger: monthly report job');
    try {
      await monthlyReportService.sendReportsToAllUsers(overrideMonth);
    } finally {
      this.isRunning = false;
    }
  }
}

module.exports = new MonthlyReportCron();