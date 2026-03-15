"use client";

const CHECKOUT_WINDOW_NAME = "zrt-alipay-checkout";

const writeCheckoutWindowContent = ({
  currentWindow,
  title,
  heading,
  description,
}: {
  currentWindow: Window;
  title: string;
  heading: string;
  description: string;
}) => {
  const doc = currentWindow.document;
  doc.open();
  doc.write(`<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      :root {
        color-scheme: light;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: linear-gradient(180deg, #f8fafc 0%, #eff6ff 52%, #ffffff 100%);
        color: #0f172a;
        font-family: "SF Pro Text", "Segoe UI", sans-serif;
      }

      main {
        width: min(100%, 520px);
        padding: 36px;
        border: 1px solid #dbeafe;
        border-radius: 32px;
        background: #ffffff;
      }

      .badge {
        display: inline-flex;
        align-items: center;
        padding: 8px 12px;
        border-radius: 999px;
        border: 1px solid #dbeafe;
        background: #eff6ff;
        color: #1d4ed8;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      h1 {
        margin: 20px 0 0;
        font-size: 30px;
        line-height: 1.15;
      }

      p {
        margin: 12px 0 0;
        color: #475569;
        font-size: 15px;
        line-height: 1.75;
      }

      .panel {
        margin-top: 24px;
        padding: 20px;
        border-radius: 24px;
        background: #f8fafc;
      }

      .progress {
        margin-top: 16px;
        height: 10px;
        overflow: hidden;
        border-radius: 999px;
        background: #dbeafe;
      }

      .progress::after {
        content: "";
        display: block;
        width: 44%;
        height: 100%;
        border-radius: inherit;
        background: #0f172a;
      }
    </style>
  </head>
  <body>
    <main>
      <span class="badge">支付宝收银台</span>
      <h1>${heading}</h1>
      <p>${description}</p>
      <div class="panel">
        <p style="margin: 0; color: #0f172a; font-weight: 700;">请保持当前标签页打开</p>
        <p style="margin-top: 8px;">订单已创建后会自动进入支付页，无需再次点击付款按钮。</p>
        <div class="progress" aria-hidden="true"></div>
      </div>
    </main>
  </body>
</html>`);
  doc.close();
};

export const openCheckoutWindowShell = () => {
  const opened = window.open("", CHECKOUT_WINDOW_NAME);
  if (!opened) {
    return null;
  }

  try {
    opened.opener = null;
    writeCheckoutWindowContent({
      currentWindow: opened,
      title: "正在跳转到支付宝",
      heading: "正在为你打开支付页",
      description: "正在生成订单并连接支付宝收银台，请不要关闭当前页面。",
    });
  } catch {
    // Ignore same-origin access failures and still try to navigate later.
  }

  opened.focus();
  return opened;
};

export const showCheckoutWindowError = (currentWindow: Window | null) => {
  if (!currentWindow || currentWindow.closed) {
    return;
  }

  try {
    writeCheckoutWindowContent({
      currentWindow,
      title: "订单创建失败",
      heading: "支付页未能成功打开",
      description: "订单没有创建成功，请返回充值弹窗查看提示后重新发起。",
    });
    window.setTimeout(() => {
      if (!currentWindow.closed) {
        currentWindow.close();
      }
    }, 1800);
  } catch {
    currentWindow.close();
  }
};

export const redirectCheckoutWindow = ({
  paymentUrl,
  currentWindow,
}: {
  paymentUrl: string;
  currentWindow: Window | null;
}) => {
  if (!currentWindow || currentWindow.closed) {
    return null;
  }

  try {
    currentWindow.opener = null;
    currentWindow.location.replace(paymentUrl);
  } catch {
    currentWindow.location.href = paymentUrl;
  }

  currentWindow.focus();
  return currentWindow;
};

export const openCheckoutWindow = (paymentUrl: string) => {
  const opened = window.open(paymentUrl, CHECKOUT_WINDOW_NAME);
  if (!opened) {
    return null;
  }

  try {
    opened.opener = null;
  } catch {
    // Ignore opener assignment issues across browsers.
  }

  opened.focus();
  return opened;
};
