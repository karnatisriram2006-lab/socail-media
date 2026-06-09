/**
 * Email Notification Service
 *
 * Uses Resend (https://resend.com) for transactional emails.
 * Set RESEND_API_KEY in your .env to enable. Falls back to console logging
 * in development if the key is missing.
 *
 * Resend API: https://resend.com/docs/api-reference/emails/send-email
 */

const RESEND_API_URL = 'https://api.resend.com/emails';

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@socialmedia.app';
const FROM_NAME = process.env.RESEND_FROM_NAME || 'Social Media';
const API_KEY = process.env.RESEND_API_KEY;

let resendConfigured = false;
if (API_KEY) {
  resendConfigured = true;
}

/**
 * Send an email via Resend HTTP API.
 * Falls back to console logging in development.
 */
async function sendEmail({ to, subject, html, text }) {
  if (!to) {
    console.warn('[Email] No recipient specified, skipping');
    return;
  }

  if (resendConfigured) {
    try {
      const response = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: [to],
          subject,
          html: html || text,
          text,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Resend API error: ${response.status} ${err}`);
      }

      const result = await response.json();
      console.log(`[Email] Sent to ${to}: ${subject} (id: ${result.id})`);
      return { success: true, id: result.id };
    } catch (error) {
      console.error('[Email] Resend error:', error.message);
      // Fall through to console fallback
    }
  }

  // Development fallback: log to console
  console.log(`[Email] ────────────────────────────────────────`);
  console.log(`[Email] To: ${to}`);
  console.log(`[Email] Subject: ${subject}`);
  console.log(`[Email] Body: ${text || html?.replace(/<[^>]*>/g, '')}`);
  console.log(`[Email] ────────────────────────────────────────`);
  return { success: true, dev: true };
}

/**
 * Send welcome email after registration
 */
async function sendWelcomeEmail(user) {
  return sendEmail({
    to: user.email,
    subject: `Welcome to Social Media, ${user.name || user.username}!`,
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:-apple-system,sans-serif;">
        <div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:40px;text-align:center;border-radius:12px 12px 0 0;">
          <h1 style="color:#fff;margin:0;font-size:28px;">Welcome! 🎉</h1>
        </div>
        <div style="padding:40px;background:#fff;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px;">
          <p style="font-size:16px;color:#374151;">Hi <strong>${user.name || user.username}</strong>,</p>
          <p style="font-size:16px;color:#374151;line-height:1.6;">
            Welcome to Social Media! We're excited to have you on board.
            Share your moments, connect with friends, and explore content from people around the world.
          </p>
          <div style="text-align:center;margin:30px 0;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/app"
               style="background:#667eea;color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;display:inline-block;">
              Start Exploring
            </a>
          </div>
          <p style="font-size:14px;color:#9ca3af;margin-top:30px;">
            If you didn't create this account, please ignore this email.
          </p>
        </div>
      </div>
    `,
    text: `Welcome to Social Media, ${user.name || user.username}! Share your moments, connect with friends, and explore content from people around the world. Visit ${process.env.CLIENT_URL || 'http://localhost:5173'}/app to get started.`,
  });
}

/**
 * Send notification about new follower
 */
async function sendFollowerNotification(user, follower) {
  return sendEmail({
    to: user.email,
    subject: `${follower.name || follower.username} started following you`,
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:-apple-system,sans-serif;">
        <div style="padding:40px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;">
          <div style="text-align:center;margin-bottom:20px;">
            <img src="${follower.profileImage || 'https://ui-avatars.com/api/?name=' + (follower.username || 'U')}"
                 style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid #667eea;" />
          </div>
          <p style="font-size:16px;color:#374151;text-align:center;">
            <strong>${follower.name || follower.username}</strong> started following you!
          </p>
          <div style="text-align:center;margin:25px 0;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/profile/${follower.username}"
               style="background:#667eea;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block;">
              View Profile
            </a>
          </div>
        </div>
      </div>
    `,
    text: `${follower.name || follower.username} started following you! View their profile: ${process.env.CLIENT_URL || 'http://localhost:5173'}/profile/${follower.username}`,
  });
}

/**
 * Send notification about new message
 */
async function sendMessageNotification(user, sender, messagePreview) {
  return sendEmail({
    to: user.email,
    subject: `New message from ${sender.name || sender.username}`,
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:-apple-system,sans-serif;">
        <div style="padding:40px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;">
          <p style="font-size:16px;color:#374151;">
            <strong>${sender.name || sender.username}</strong> sent you a message:
          </p>
          <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0;">
            <p style="margin:0;color:#374151;font-style:italic;">
              "${messagePreview?.substring(0, 200)}${messagePreview?.length > 200 ? '...' : ''}"
            </p>
          </div>
          <div style="text-align:center;margin:20px 0;">
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/messages"
               style="background:#667eea;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block;">
              Reply
            </a>
          </div>
        </div>
      </div>
    `,
    text: `${sender.name || sender.username} sent you a message: "${messagePreview?.substring(0, 200)}"`,
  });
}

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendFollowerNotification,
  sendMessageNotification,
};