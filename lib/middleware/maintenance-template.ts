/**
 * Maintenance page HTML template
 */

export const maintenanceHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>System Maintenance | SonaMoney</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0D1F1E;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      text-align: center;
      max-width: 480px;
    }
    .logo {
      width: 64px;
      height: 64px;
      background: #00B9A7;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 32px;
    }
    .logo svg {
      width: 32px;
      height: 32px;
      color: white;
    }
    .card {
      background: white;
      border-radius: 24px;
      padding: 40px 32px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    h1 {
      color: #1A1A2E;
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 12px;
    }
    p {
      color: #6B7280;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .status {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #FFF8E6;
      color: #FFB800;
      padding: 12px 20px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 24px;
    }
    .status svg {
      width: 20px;
      height: 20px;
    }
    .progress {
      width: 100%;
      height: 6px;
      background: #F5F7FA;
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 12px;
    }
    .progress-bar {
      width: 60%;
      height: 100%;
      background: linear-gradient(90deg, #00B9A7 0%, #00A896 100%);
      border-radius: 3px;
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    .progress-text {
      color: #00B9A7;
      font-size: 14px;
      font-weight: 500;
    }
    .footer {
      color: #9CA3AF;
      font-size: 14px;
      margin-top: 24px;
    }
    .footer a {
      color: #00B9A7;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </div>
    <div class="card">
      <h1>System Maintenance</h1>
      <p>We're performing scheduled maintenance to improve your experience. SonaMoney will be back shortly.</p>
      <div class="status">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Service Temporarily Unavailable</span>
      </div>
      <div class="progress">
        <div class="progress-bar"></div>
      </div>
      <p class="progress-text">Maintenance in progress...</p>
    </div>
    <p class="footer">Need help? Contact <a href="mailto:support@sonamoney.my.id">support@sonamoney.my.id</a></p>
  </div>
</body>
</html>`
