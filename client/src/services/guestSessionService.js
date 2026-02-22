/**
 * Guest Mode & Session Management Service
 * Handles guest ID generation and session tracking
 */

import { v4 as uuidv4 } from 'uuid';

class GuestSessionService {
  /**
   * Initialize guest ID on app load
   * @returns {string} - Guest ID from storage or new ID
   */
  static initializeGuestId() {
    let guestId = localStorage.getItem('guestId');

    if (!guestId) {
      guestId = `guest_${uuidv4()}`;
      localStorage.setItem('guestId', guestId);
    }

    return guestId;
  }

  /**
   * Store guest data locally with guestId
   * Called when guest creates transactions, goals, etc.
   * @param {string} key - Data key
   * @param {any} data - Data to store
   */
  static setGuestData(key, data) {
    const guestId = this.initializeGuestId();
    const dataKey = `guest_${guestId}_${key}`;
    localStorage.setItem(dataKey, JSON.stringify(data));
  }

  /**
   * Get guest data from localStorage
   * @param {string} key - Data key
   * @returns {any|null} - Stored data or null
   */
  static getGuestData(key) {
    const guestId = localStorage.getItem('guestId');
    if (!guestId) return null;

    const dataKey = `guest_${guestId}_${key}`;
    const data = localStorage.getItem(dataKey);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Clear guest data after successful login
   * Called after guest → authenticated user merge
   * @param {string} key - Optional specific key to clear
   */
  static clearGuestData(key = null) {
    const guestId = localStorage.getItem('guestId');
    if (!guestId) return;

    if (key) {
      // Clear specific key
      const dataKey = `guest_${guestId}_${key}`;
      localStorage.removeItem(dataKey);
    } else {
      // Clear all guest data
      const keys = Object.keys(localStorage);
      keys.forEach(k => {
        if (k.startsWith(`guest_${guestId}_`)) {
          localStorage.removeItem(k);
        }
      });
    }
  }

  /**
   * Clear guest ID on logout
   * Prevents data reuse across different users
   */
  static clearGuestId() {
    localStorage.removeItem('guestId');
  }

  /**
   * Get guest ID for OAuth flow
   * @returns {string|null} - Guest ID if exists
   */
  static getGuestId() {
    return localStorage.getItem('guestId');
  }
}

export default GuestSessionService;
