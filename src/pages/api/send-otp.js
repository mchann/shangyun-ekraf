export const prerender = false;

import nodemailer from 'nodemailer';

export async function POST({ request }) {
  try {
    const body = await request.json();
    const { email, otp, name, role } = body || {};

    if (!email || !otp) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email dan kode OTP wajib disertakan.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '465', 10);
    const user = process.env.SMTP_USER || 'akuadaaa789@gmail.com';
    const pass = process.env.SMTP_PASS || 'kvtqzwennirvixzb';

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass
      }
    });

    const roleLabel = role === 'seller' ? 'Perajin / Seller Kriya' : 'Pembeli Koleksi';
    const recipientName = name ? name.trim() : 'Pelanggan Terhormat';

    const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Kode OTP Verifikasi Shang Yun (尚韵)</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0c0605; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f6efe2; }
    .wrapper { width: 100%; max-width: 600px; margin: 0 auto; background-color: #150b09; border: 1px solid rgba(185, 152, 92, 0.35); border-radius: 8px; overflow: hidden; }
    .header { background: radial-gradient(120% 90% at 50% 30%, #2a110c, #150b09 70%); padding: 36px 24px; text-align: center; border-bottom: 1px solid rgba(185, 152, 92, 0.25); }
    .seal-wrap { display: inline-block; width: 54px; height: 54px; line-height: 54px; background: #b8292c; border: 1px solid #b8292c; outline: 1px solid rgba(246, 239, 226, 0.35); border-radius: 3px; font-size: 30px; color: #ffffff; margin-bottom: 12px; }
    .brand-title { font-size: 26px; letter-spacing: 0.25em; color: #f6efe2; margin: 0; font-weight: 600; }
    .brand-subtitle { font-size: 15px; letter-spacing: 0.35em; color: #b9985c; margin-top: 6px; }
    .content { padding: 36px 28px; }
    .greeting { font-size: 18px; color: #f6efe2; margin-bottom: 16px; font-weight: 500; }
    .intro-text { font-size: 14px; line-height: 1.7; color: #a8968a; margin-bottom: 28px; }
    .otp-card { background: #0c0605; border: 1px solid #b9985c; border-radius: 6px; padding: 24px; text-align: center; margin: 24px 0; }
    .otp-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.2em; color: #b9985c; margin-bottom: 8px; }
    .otp-code { font-size: 38px; font-weight: bold; letter-spacing: 0.35em; color: #f6efe2; margin: 10px 0; font-family: 'Courier New', Courier, monospace; }
    .otp-validity { font-size: 12px; color: #a8968a; }
    .warning-box { background: rgba(184, 41, 44, 0.1); border-left: 3px solid #b8292c; padding: 12px 16px; font-size: 13px; color: #d6c8b4; line-height: 1.5; margin-top: 24px; }
    .footer { background: #0c0605; padding: 20px 24px; text-align: center; border-top: 1px solid rgba(185, 152, 92, 0.15); font-size: 12px; color: #7a6a5e; }
  </style>
</head>
<body>
  <div style="padding: 24px 12px; background-color: #0c0605;">
    <div class="wrapper">
      <div class="header">
        <div class="seal-wrap">尚</div>
        <h1 class="brand-title">Shang Yun</h1>
        <div class="brand-subtitle">尚韵 · 传承与精致</div>
      </div>
      <div class="content">
        <div class="greeting">Halo, ${recipientName}</div>
        <p class="intro-text">
          Terima kasih telah melakukan pendaftaran di platform kriya Imlek <b>Shang Yun (尚韵)</b> sebagai <b>${roleLabel}</b>.
          Untuk memastikan keamanan akun dan menyelesaikan proses aktivasi, gunakan 6-digit kode verifikasi di bawah ini:
        </p>

        <div class="otp-card">
          <div class="otp-label">Kode Verifikasi OTP Anda</div>
          <div class="otp-code">${otp}</div>
          <div class="otp-validity">Berlaku selama 10 menit</div>
        </div>

        <div class="warning-box">
          <strong>Perhatian Keamanan:</strong> Jangan membagikan kode OTP ini kepada siapa pun, termasuk pihak yang mengatasnamakan Shang Yun. Jika Anda tidak merasa melakukan pendaftaran ini, silakan abaikan email ini.
        </div>
      </div>
      <div class="footer">
        <p style="margin: 0 0 6px;">Shang Yun (尚韵) — Seni Kriya Imlek Mewah Nusantara.</p>
        <p style="margin: 0;">Email ini dikirimkan otomatis oleh sistem verifikasi keamanan Shang Yun.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const info = await transporter.sendMail({
      from: `"Shang Yun (尚韵)" <${user}>`,
      to: email,
      subject: `[Shang Yun 尚韵] ${otp} adalah Kode Verifikasi OTP Anda`,
      text: `Halo ${recipientName},\n\nKode verifikasi OTP pendaftaran Shang Yun Anda adalah: ${otp}\n\nKode ini berlaku selama 10 menit. Jangan berikan kode ini kepada siapa pun.\n\nSalam hangat,\nShang Yun (尚韵)`,
      html: htmlContent
    });

    return new Response(
      JSON.stringify({
        success: true,
        messageId: info.messageId,
        message: 'Kode OTP telah berhasil dikirimkan ke email Anda.'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Gagal mengirim email OTP'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

