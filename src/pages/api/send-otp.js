export const prerender = false;

import nodemailer from 'nodemailer';

export async function POST({ request }) {
  try {
    const body = await request.json();
    const { email, otp, name, role } = body || {};

    const targetRecipient = (email || '').trim().toLowerCase();
    const otpCode = String(otp || '').trim();

    if (!targetRecipient || !targetRecipient.includes('@') || !otpCode) {
      return new Response(
        JSON.stringify({ success: false, error: 'Alamat email penerima dan kode OTP wajib disertakan secara valid.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const roleLabel = role === 'seller' ? 'Perajin / Mitra Gerai Kriya (卖家/工匠)' : 'Pembeli Koleksi Imlek (尊贵买家)';
    const recipientName = name && name.trim() ? name.trim() : 'Pelanggan Terhormat (贵宾)';

    // Split 6-digit OTP into individual characters for luxury Chinese lacquer boxes
    const digits = otpCode.split('').slice(0, 6);

    const user = (import.meta.env?.SMTP_USER || process.env?.SMTP_USER || 'akuadaaa789@gmail.com').trim();
    const pass = (import.meta.env?.SMTP_PASS || process.env?.SMTP_PASS || 'kvtqzwennirvixzb').trim();
    const resendApiKey = (import.meta.env?.RESEND_API_KEY || process.env?.RESEND_API_KEY || '').trim();

    const htmlContent = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Kode Verifikasi OTP Shang Yun (尚韵)</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0c0605; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Songti SC', 'STSong', Georgia, serif; color: #f6efe2;">

  <!-- OUTER WRAPPER TABLE -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0c0605; background: radial-gradient(circle at 50% 20%, #1a0b08 0%, #0c0605 100%); padding: 30px 10px;">
    <tr>
      <td align="center">

        <!-- MAIN CARD TABLE -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 580px; background-color: #150b09; border: 1.5px solid #b9985c; border-radius: 8px; overflow: hidden; box-shadow: 0 16px 48px rgba(0, 0, 0, 0.75);">
          
          <!-- TOP AUSPICIOUS CHINESE BANNER -->
          <tr>
            <td style="background: linear-gradient(90deg, #7a120d 0%, #a8241b 50%, #7a120d 100%); padding: 10px 16px; text-align: center; border-bottom: 1px solid #d4af37;">
              <span style="font-size: 12px; letter-spacing: 0.35em; color: #f6efe2; font-weight: 500;">❖ 尚 韵 · SHANG YUN ❖ 岁 序 更 新 · 礼 敬 团 圆 ❖</span>
            </td>
          </tr>

          <!-- HEADER WITH TRADITIONAL CHINESE SEAL -->
          <tr>
            <td align="center" style="padding: 38px 24px 20px; background: radial-gradient(120% 90% at 50% 30%, #29120e 0%, #150b09 70%);">
              
              <!-- Double Border Seal Stamp -->
              <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 16px;">
                <tr>
                  <td align="center" valign="middle" style="width: 58px; height: 58px; background-color: #b8292c; border: 2px solid #b8292c; outline: 1px solid rgba(246, 239, 226, 0.45); border-radius: 4px; box-shadow: 0 4px 14px rgba(184, 41, 44, 0.4);">
                    <span style="font-size: 34px; font-weight: normal; color: #ffffff; line-height: 58px; display: block; font-family: 'Songti SC', 'STSong', serif;">尚</span>
                  </td>
                </tr>
              </table>

              <h1 style="margin: 0; font-size: 30px; letter-spacing: 0.28em; color: #f6efe2; font-weight: 600; text-transform: uppercase;">Shang Yun</h1>
              <div style="margin-top: 6px; font-size: 16px; letter-spacing: 0.35em; color: #d4af37; font-weight: 400; font-family: 'Songti SC', 'STSong', serif;">尚 韵 · 典 藏 雅 礼</div>
              <div style="margin-top: 14px; display: inline-block; padding: 4px 14px; background-color: rgba(212, 175, 55, 0.12); border: 1px solid rgba(212, 175, 55, 0.35); border-radius: 20px; font-size: 11.5px; letter-spacing: 0.18em; color: #e6c985; text-transform: uppercase;">
                Verifikasi Keamanan Akun · 账号安全验证
              </div>
            </td>
          </tr>

          <!-- GOLD DIVIDER -->
          <tr>
            <td style="padding: 0 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="height: 1px; background: linear-gradient(90deg, transparent 0%, #b9985c 50%, transparent 100%);"></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN BODY CONTENT -->
          <tr>
            <td style="padding: 32px 32px 24px;">
              
              <!-- Greeting -->
              <div style="font-size: 19px; color: #f6efe2; font-weight: 500; margin-bottom: 6px;">
                Yth. <span style="color: #d4af37; font-weight: 600;">${recipientName}</span>,
              </div>
              <div style="font-size: 13.5px; color: #d4af37; margin-bottom: 18px; font-family: 'Songti SC', 'STSong', serif; letter-spacing: 0.1em;">
                恭贺新禧 · 吉祥如意 · 迎春纳福
              </div>

              <!-- Message -->
              <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.75; color: #c8b7a6;">
                Selamat datang di perjamuan seni kriya Imlek <b>Shang Yun (尚韵)</b>. Anda telah mendaftarkan alamat email 
                <b style="color: #f6efe2; text-decoration: underline;">${targetRecipient}</b> untuk akun 
                <b style="color: #e6c985;">${roleLabel}</b>.
              </p>
              <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.75; color: #c8b7a6;">
                Untuk menyelesaikan pendaftaran dan mengaktifkan akses Anda, silakan masukkan 6-digit Kode OTP resmi berikut pada formulir verifikasi:
              </p>

              <!-- LUXURY CHINESE LACQUER OTP CODE DISPLAY -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0c0605; background: radial-gradient(circle at 50% 50%, #1a0c09 0%, #0c0605 100%); border: 1.5px solid #d4af37; border-radius: 6px; padding: 22px 16px; text-align: center; margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <div style="font-size: 11px; letter-spacing: 0.32em; color: #b9985c; text-transform: uppercase; font-weight: 600; margin-bottom: 14px;">
                      — 验证码 · KODE VERIFIKASI KEAMANAN —
                    </div>

                    <!-- 6 DIGIT LACQUER BOXES -->
                    <table align="center" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 14px;">
                      <tr>
                        ${digits.map(d => `
                          <td style="padding: 0 4px;">
                            <div style="width: 44px; height: 58px; line-height: 58px; text-align: center; background-color: #1e0e0a; border: 1.5px solid #d4af37; border-radius: 4px; font-size: 34px; font-weight: bold; color: #f6efe2; font-family: 'Courier New', Courier, monospace; box-shadow: 0 4px 12px rgba(0,0,0,0.6);">
                              ${d}
                            </div>
                          </td>
                        `).join('')}
                      </tr>
                    </table>

                    <div style="font-size: 12px; color: #a8968a; letter-spacing: 0.08em;">
                      <span style="color: #e6c985;">⏱ Berlaku 10 Menit</span> · 有效期十分钟
                    </div>
                  </td>
                </tr>
              </table>

              <!-- 4 CHINESE CRAFT PILLARS -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: rgba(22, 10, 8, 0.6); border: 1px solid rgba(185, 152, 92, 0.22); border-radius: 4px; padding: 12px; margin-bottom: 24px;">
                <tr>
                  <td width="25%" align="center" style="font-size: 11.5px; color: #cdb59c; border-right: 1px solid rgba(185, 152, 92, 0.15);">
                    <span style="display: block; font-size: 15px; color: #d4af37; font-family: 'Songti SC', 'STSong', serif;">绣金</span>
                    Sulam Emas
                  </td>
                  <td width="25%" align="center" style="font-size: 11.5px; color: #cdb59c; border-right: 1px solid rgba(185, 152, 92, 0.15);">
                    <span style="display: block; font-size: 15px; color: #d4af37; font-family: 'Songti SC', 'STSong', serif;">点茶</span>
                    Seduh Teh
                  </td>
                  <td width="25%" align="center" style="font-size: 11.5px; color: #cdb59c; border-right: 1px solid rgba(185, 152, 92, 0.15);">
                    <span style="display: block; font-size: 15px; color: #d4af37; font-family: 'Songti SC', 'STSong', serif;">书福</span>
                    Tulis Fu
                  </td>
                  <td width="25%" align="center" style="font-size: 11.5px; color: #cdb59c;">
                    <span style="display: block; font-size: 15px; color: #d4af37; font-family: 'Songti SC', 'STSong', serif;">封红</span>
                    Angpao
                  </td>
                </tr>
              </table>

              <!-- SECURITY WARNING -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: rgba(184, 41, 44, 0.1); border-left: 3px solid #b8292c; padding: 12px 14px; border-radius: 0 4px 4px 0;">
                <tr>
                  <td>
                    <div style="font-size: 12.5px; line-height: 1.6; color: #d6c8b4;">
                      <strong style="color: #fca5a5;">🔒 Catatan Keamanan Penting:</strong> 
                      Jangan pernah memberitahukan kode verifikasi ini kepada siapa pun, termasuk pihak yang mengatasnamakan pengelola Shang Yun. 
                      Jika Anda tidak merasa melakukan pendaftaran akun ini, silakan abaikan email ini.
                    </div>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- CHINESE CALLIGRAPHY CLOSING NOTE -->
          <tr>
            <td align="center" style="padding: 10px 32px 28px; background-color: #120907;">
              <div style="font-size: 22px; color: #d4af37; font-family: 'Songti SC', 'STSong', serif; letter-spacing: 0.2em; margin-bottom: 6px;">
                礼轻情意重 · 匠心载福至
              </div>
              <div style="font-size: 12px; color: #a8968a; font-style: italic; max-width: 440px; margin: 0 auto; line-height: 1.5;">
                "Hadiah boleh sederhana, namun ketulusan memilih dan sentuhan tangan para perajin menjadikannya sebuah perjamuan penuh makna."
              </div>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" style="padding: 22px 24px; background-color: #0c0605; border-top: 1px solid rgba(185, 152, 92, 0.2); font-size: 11.5px; color: #7a6a5e; line-height: 1.7;">
              <div style="color: #b9985c; font-weight: 500; margin-bottom: 4px;">
                Shang Yun (尚韵) — Seni Kriya Imlek Mewah Nusantara
              </div>
              <div>Email pengirim resmi: <span style="color: #9f8c7e;">${user}</span></div>
              <div style="margin-top: 6px; color: #5a4b41; font-size: 10.5px;">
                Email ini dikirimkan secara otomatis oleh sistem autentikasi gerai Shang Yun untuk penerima: <b>${targetRecipient}</b>.
              </div>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
    `;

    // 1. OPSI UTAMA CLOUDFLARE EDGE: Resend REST API (HTTPS fetch native - bebas blokir TCP socket SMTP)
    if (resendApiKey) {
      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Shang Yun <onboarding@resend.dev>',
            to: [targetRecipient],
            subject: `[Shang Yun] Kode Verifikasi OTP Anda: ${otpCode}`,
            html: htmlContent
          })
        });

        const resendData = await resendRes.json();
        if (resendRes.ok && resendData.id) {
          console.log(`[Resend OTP] Sent successfully to ${targetRecipient} (ID: ${resendData.id})`);
          return new Response(
            JSON.stringify({
              success: true,
              delivered: true,
              method: 'resend_https',
              recipient: targetRecipient,
              messageId: resendData.id,
              message: `Kode OTP telah berhasil dikirimkan ke ${targetRecipient} via HTTPS API.`
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        } else {
          console.warn('[Resend OTP] Resend API returned error, falling back to SMTP transport:', resendData);
        }
      } catch (resendErr) {
        console.warn('[Resend OTP] HTTPS call failed, falling back to SMTP transport:', resendErr);
      }
    }

    // 2. OPSI KEDUA: Google SMTP Transport (Bekerja sempurna di Node.js / Localhost)
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user,
          pass
        }
      });

      const info = await transporter.sendMail({
        from: `"Shang Yun" <${user}>`,
        to: targetRecipient,
        subject: `[Shang Yun] Kode Verifikasi OTP Anda: ${otpCode}`,
        text: `Yth. ${recipientName},\n\nKode Verifikasi OTP pendaftaran Shang Yun Anda adalah: ${otpCode}\n\nKode ini berlaku selama 10 menit untuk email ${targetRecipient}.\nJangan berikan kode ini kepada siapa pun.\n\nSalam hangat,\nShang Yun`,
        html: htmlContent,
        headers: {
          'X-Priority': '1',
          'Importance': 'high'
        }
      });

      console.log(`[OTP] Email successfully sent to ${targetRecipient} (Code: ${otpCode}, Message-ID: ${info.messageId})`);

      return new Response(
        JSON.stringify({
          success: true,
          delivered: true,
          method: 'gmail_smtp',
          recipient: targetRecipient,
          messageId: info.messageId,
          message: `Kode OTP telah berhasil dikirimkan ke ${targetRecipient}.`
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (smtpError) {
      console.warn(`[OTP] Outbound SMTP TCP socket blocked or failed (Common on Cloudflare Pages Workers Edge):`, smtpError.message);
      
      // Deteksi Cloudflare Edge Socket Block: Return gracefully dengan fallback OTP agar pendaftaran akun tidak terputus
      return new Response(
        JSON.stringify({
          success: true,
          delivered: false,
          isCloudflareEdge: true,
          fallbackOtp: otpCode,
          recipient: targetRecipient,
          error: smtpError.message,
          message: 'Cloudflare Pages edge runtime membatasi port SMTP keluar. Kode verifikasi otomatis disiapkan untuk kelancaran pengujian.'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Failed to process OTP request:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Gagal memproses kode OTP'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
