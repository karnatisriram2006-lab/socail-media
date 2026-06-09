/**
 * Database Cleanup Cron Job
 *
 * Run manually:  node jobs/cleanup.js
 * Scheduled:     every day at 3:00 AM (via node-cron or system cron)
 *
 * Cleans up:
 *   1. Unverified users older than 7 days
 *   2. Read notifications older than 90 days
 *   3. Old chat messages (keep last 6 months)
 *   4. Orphaned Cloudinary images (optional, requires Cloudinary API)
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Message = require('../models/Message');
const Report = require('../models/Report');

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
const NINETY_DAYS = 90 * 24 * 60 * 60 * 1000;
const SIX_MONTHS = 180 * 24 * 60 * 60 * 1000;

async function cleanup() {
  const start = Date.now();
  console.log(`[Cleanup] Starting at ${new Date().toISOString()}`);

  try {
    await connectDB();
    console.log('[Cleanup] MongoDB connected');

    // ──────────────────────────────────────────
    // 1. Delete unverified users older than 7 days
    //    Note: Firebase account is NOT deleted here — that would require
    //    the Firebase Admin SDK. This only removes the MongoDB record.
    // ──────────────────────────────────────────
    const oldUsers = await User.find({
      isVerified: false,
      createdAt: { $lt: new Date(Date.now() - SEVEN_DAYS) },
    }).select('_id');

    if (oldUsers.length > 0) {
      const oldIds = oldUsers.map((u) => u._id);
      const delResult = await User.deleteMany({ _id: { $in: oldIds } });
      console.log(`[Cleanup] Deleted ${delResult.deletedCount} unverified users (older than 7 days)`);
    } else {
      console.log('[Cleanup] No unverified users to delete');
    }

    // ──────────────────────────────────────────
    // 2. Delete read notifications older than 90 days
    // ──────────────────────────────────────────
    const oldNotifs = await Notification.deleteMany({
      isRead: true,
      createdAt: { $lt: new Date(Date.now() - NINETY_DAYS) },
    });
    if (oldNotifs.deletedCount > 0) {
      console.log(`[Cleanup] Deleted ${oldNotifs.deletedCount} old notifications`);
    } else {
      console.log('[Cleanup] No old notifications to delete');
    }

    // ──────────────────────────────────────────
    // 3. Delete messages older than 6 months
    // ──────────────────────────────────────────
    const oldMessages = await Message.deleteMany({
      createdAt: { $lt: new Date(Date.now() - SIX_MONTHS) },
    });
    if (oldMessages.deletedCount > 0) {
      console.log(`[Cleanup] Deleted ${oldMessages.deletedCount} old messages`);
    } else {
      console.log('[Cleanup] No old messages to delete');
    }

    // ──────────────────────────────────────────
    // 4. Dismiss reports older than 90 days (cleanup)
    // ──────────────────────────────────────────
    const oldReports = await Report.deleteMany({
      status: { $in: ['dismissed', 'action_taken'] },
      updatedAt: { $lt: new Date(Date.now() - NINETY_DAYS) },
    });
    if (oldReports.deletedCount > 0) {
      console.log(`[Cleanup] Deleted ${oldReports.deletedCount} old reports`);
    } else {
      console.log('[Cleanup] No old reports to delete');
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`[Cleanup] Completed in ${elapsed}s`);
  } catch (error) {
    console.error('[Cleanup] Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('[Cleanup] MongoDB connection closed');
    process.exit(0);
  }
}

cleanup();