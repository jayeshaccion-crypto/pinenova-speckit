const API_KEY = process.env.EMAIL_API_KEY || "";
const FROM = process.env.EMAIL_FROM || "noreply@pinenova.com";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (process.env.NODE_ENV === "development") {
    const masked = options.to.replace(/(.{2}).+(@.+)/, "$1***$2");
    console.log(`[EMAIL DEV] To: ${masked}, Subject: ${options.subject}`);
    return true;
  }

  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: options.to }] }],
        from: { email: FROM },
        subject: options.subject,
        content: [
          { type: "text/html", value: options.html },
          ...(options.text ? [{ type: "text/plain", value: options.text }] : []),
        ],
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("[EMAIL ERROR]", error);
    return false;
  }
}

export const emailTemplates = {
  welcome: (name: string) => ({
    subject: "Welcome to PineNova!",
    html: `<h1>Welcome, ${name}!</h1><p>Thank you for joining PineNova. Start exploring our sustainable pineapple-fiber collection.</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL || ""}/products">Shop Now</a></p>`,
  }),

  orderConfirmation: (orderId: string, items: Array<{ name: string; qty: number; price: string }>, total: string) => ({
    subject: `Order Confirmed - ${orderId.slice(0, 8).toUpperCase()}`,
    html: `<h1>Thank you for your order!</h1><p>Order ID: <strong>${orderId}</strong></p><table border="1" cellpadding="8"><tr><th>Item</th><th>Qty</th><th>Price</th></tr>${items.map((i) => `<tr><td>${i.name}</td><td>${i.qty}</td><td>$${i.price}</td></tr>`).join("")}</table><p><strong>Total: $${total}</strong></p>`,
  }),

  shippingNotification: (orderId: string, tracking?: string) => ({
    subject: `Your PineNova Order Has Shipped - ${orderId.slice(0, 8).toUpperCase()}`,
    html: `<h1>Your order is on the way!</h1><p>Order ID: <strong>${orderId}</strong></p>${tracking ? `<p>Tracking Number: <strong>${tracking}</strong></p>` : ""}<p>Thank you for choosing PineNova.</p>`,
  }),

  passwordReset: (resetUrl: string) => ({
    subject: "Reset Your PineNova Password",
    html: `<h1>Password Reset</h1><p>Click the link below to reset your password. This link expires in 1 hour.</p><p><a href="${resetUrl}">Reset Password</a></p><p>If you didn't request this, please ignore this email.</p>`,
  }),

  orderCancellation: (orderId: string, reason?: string) => ({
    subject: `Order Cancelled - ${orderId.slice(0, 8).toUpperCase()}`,
    html: `<h1>Order Cancelled</h1><p>Order ID: <strong>${orderId}</strong></p>${reason ? `<p>Reason: ${reason}</p>` : ""}<p>Your refund will be processed within 5-10 business days.</p>`,
  }),

  refundProcessed: (orderId: string, amount: string) => ({
    subject: `Refund Processed - ${orderId.slice(0, 8).toUpperCase()}`,
    html: `<h1>Refund Processed</h1><p>Order ID: <strong>${orderId}</strong></p><p>Amount: <strong>$${amount}</strong></p><p>The refund has been sent to your original payment method.</p>`,
  }),
};
