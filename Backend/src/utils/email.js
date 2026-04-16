const nodemailer = require('nodemailer');
const env = require('../configs/env');

const transporter = nodemailer.createTransport({
  host: env.mail.host,
  port: env.mail.port,
  secure: false,
  auth: {
    user: env.mail.user,
    pass: env.mail.pass,
  },
});

const sendVerificationEmail = async (toEmail, fullName, otp) => {
  await transporter.sendMail({
    from: env.mail.from,
    to: toEmail,
    subject: 'TaskFlow — Mã xác minh email của bạn',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;border:1px solid #e5e7eb;border-radius:8px;">
        <h2 style="color:#0052CC;margin-bottom:8px;">TaskFlow</h2>
        <p style="font-size:16px;">Xin chào <strong>${fullName}</strong>,</p>
        <p style="color:#374151;">Mã OTP xác minh email của bạn là:</p>
        <div style="margin:24px 0;text-align:center;">
          <span style="display:inline-block;padding:16px 40px;background:#f0f4ff;border:2px dashed #0052CC;border-radius:8px;font-size:36px;font-weight:bold;letter-spacing:10px;color:#0052CC;">
            ${otp}
          </span>
        </div>
        <p style="color:#6b7280;font-size:13px;">Mã có hiệu lực trong <strong>15 phút</strong>. Không chia sẻ mã này với bất kỳ ai.</p>
        <p style="color:#6b7280;font-size:13px;">Nếu bạn không đăng ký tài khoản, hãy bỏ qua email này.</p>
      </div>
    `,
  });
};

const sendPasswordResetEmail = async (toEmail, fullName, token) => {
  const resetUrl = `http://localhost:${process.env.PORT || 3000}/api/v1/auth/reset-password?token=${token}`;

  await transporter.sendMail({
    from: env.mail.from,
    to: toEmail,
    subject: 'TaskFlow — Đặt lại mật khẩu',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;border:1px solid #e5e7eb;border-radius:8px;">
        <h2 style="color:#0052CC;margin-bottom:8px;">TaskFlow</h2>
        <p style="font-size:16px;">Xin chào <strong>${fullName}</strong>,</p>
        <p style="color:#374151;">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
        <a href="${resetUrl}"
           style="display:inline-block;margin:24px 0;padding:12px 28px;background:#DC2626;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">
          Đặt lại mật khẩu
        </a>
        <p style="color:#6b7280;font-size:13px;">Link có hiệu lực trong <strong>1 giờ</strong>. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
      </div>
    `,
  });
};

const sendBoardAddedEmail = async (toEmail, fullName, boardName, inviterName) => {
  await transporter.sendMail({
    from: env.mail.from,
    to: toEmail,
    subject: `TaskFlow — Bạn đã được thêm vào board "${boardName}"`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;border:1px solid #e5e7eb;border-radius:8px;">
        <h2 style="color:#0052CC;margin-bottom:8px;">TaskFlow</h2>
        <p style="font-size:16px;">Xin chào <strong>${fullName}</strong>,</p>
        <p style="color:#374151;">
          <strong>${inviterName}</strong> đã thêm bạn vào board
          <strong>"${boardName}"</strong> với vai trò thành viên.
        </p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/home"
           style="display:inline-block;margin:24px 0;padding:12px 28px;background:#0052CC;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">
          Mở TaskFlow
        </a>
        <p style="color:#6b7280;font-size:13px;">Nếu bạn không mong đợi lời mời này, hãy liên hệ quản trị viên.</p>
      </div>
    `,
  });
};

const sendBoardInvitationEmail = async (toEmail, boardName, inviterName, token) => {
  const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/accept-invite?token=${token}`;
  await transporter.sendMail({
    from: env.mail.from,
    to: toEmail,
    subject: `TaskFlow — ${inviterName} mời bạn tham gia board "${boardName}"`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;border:1px solid #e5e7eb;border-radius:8px;">
        <h2 style="color:#0052CC;margin-bottom:8px;">TaskFlow</h2>
        <p style="font-size:16px;">Xin chào,</p>
        <p style="color:#374151;">
          <strong>${inviterName}</strong> đã mời bạn tham gia board
          <strong>"${boardName}"</strong> trên TaskFlow.
        </p>
        <a href="${inviteUrl}"
           style="display:inline-block;margin:24px 0;padding:12px 28px;background:#0052CC;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">
          Chấp nhận lời mời
        </a>
        <p style="color:#6b7280;font-size:13px;">Link có hiệu lực trong <strong>7 ngày</strong>.</p>
        <p style="color:#6b7280;font-size:13px;">Nếu bạn không mong đợi lời mời này, hãy bỏ qua email này.</p>
      </div>
    `,
  });
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendBoardAddedEmail, sendBoardInvitationEmail };
