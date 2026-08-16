import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || 'ScrollNom <onboarding@resend.dev>';

const isMockEmail = !resendApiKey || resendApiKey.includes('mock') || resendApiKey.includes('placeholder');
const resend = isMockEmail ? null : new Resend(resendApiKey);

export const sendOrderConfirmation = async (order) => {
  const subject = `Order Confirmed: ${order.orderId} - ScrollNom 🍔`;
  const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #FDFBF7; padding: 24px; color: #1E2022;">
      <div style="max-width: 540px; margin: 0 auto; background: #ffffff; padding: 24px; border-radius: 16px; border: 1px solid #EAE4D5;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #FF5A36; margin: 0; font-size: 28px;">scrollnom</h1>
          <p style="color: #00A896; font-size: 11px; font-weight: bold; text-transform: uppercase; tracking-wider; margin-top: 4px;">Discover • Nom • Order</p>
        </div>

        <div style="border-top: 2px solid #FF5A36; padding-top: 16px; margin-bottom: 20px;">
          <h2 style="font-size: 18px; margin: 0 0 8px 0; color: #1E2022;">Order Confirmation</h2>
          <p style="font-size: 13px; color: #666; margin: 0;">Order ID: <strong>${order.orderId}</strong></p>
          <p style="font-size: 13px; color: #666; margin: 4px 0 0 0;">Date: ${new Date(order.createdAt).toLocaleString()}</p>
        </div>

        <div style="background-color: #F7F4EB; padding: 16px; border-radius: 12px; margin-bottom: 20px;">
          <p style="font-size: 12px; font-weight: bold; color: #00A896; text-transform: uppercase; margin: 0 0 8px 0;">${order.restaurantName}</p>
          ${(order.items || []).map(item => `
            <div style="display: flex; justify-content: space-between; font-size: 14px; padding: 6px 0; border-bottom: 1px border #EAE4D5;">
              <span>${item.quantity}x ${item.title}</span>
              <strong>₹${item.price * item.quantity}</strong>
            </div>
          `).join('')}
        </div>

        <div style="font-size: 14px; space-y: 6px; border-top: 1px solid #EAE4D5; padding-top: 12px;">
          <div style="display: flex; justify-content: space-between; color: #555;">
            <span>Subtotal:</span>
            <span>₹${order.subtotal}</span>
          </div>
          <div style="display: flex; justify-content: space-between; color: #555;">
            <span>Delivery Fee:</span>
            <span>₹${order.deliveryFee}</span>
          </div>
          <div style="display: flex; justify-content: space-between; color: #555;">
            <span>Taxes:</span>
            <span>₹${order.taxes}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; color: #FF5A36; padding-top: 8px; border-top: 2px solid #1E2022;">
            <span>Total Paid (TEST MODE):</span>
            <span>₹${order.amount}</span>
          </div>
        </div>

        <div style="margin-top: 24px; text-align: center; font-size: 12px; color: #888;">
          <p style="margin: 0;">Thank you for ordering with ScrollNom!</p>
          <p style="margin: 4px 0 0 0; color: #00A896;">Payment Verified via Razorpay TEST MODE</p>
        </div>
      </div>
    </div>
  `;

  console.log(`[EMAIL SERVICE] Sending Order Confirmation Email to User for ${order.orderId}...`);

  if (isMockEmail) {
    console.log(`[EMAIL SERVICE] Mock Mode active. Email rendered successfully (Resend API key unconfigured).`);
    return { success: true, mock: true, recipient: 'customer@example.com' };
  }

  try {
    const data = await resend.emails.send({
      from: fromEmail,
      to: ['delivered@resend.dev'], // Resend sandbox test recipient
      subject,
      html
    });
    console.log(`[EMAIL SERVICE] Resend Email Sent Successfully! ID: ${data.id}`);
    return { success: true, id: data.id };
  } catch (error) {
    console.error(`[EMAIL SERVICE] Resend Email Error:`, error);
    return { success: false, error: error.message };
  }
};

export const sendFoodOnFriendRequest = async (request) => {
  const subject = `ScrollNom Food on Friend Request from ${request.friendName || 'a Friend'} 🍕`;
  const html = `
    <div style="font-family: sans-serif; background: #FDFBF7; padding: 24px; color: #1E2022;">
      <div style="max-width: 500px; margin: 0 auto; background: #ffffff; padding: 24px; border-radius: 16px; border: 2px solid #00A896;">
        <h2 style="color: #FF5A36; margin-top: 0;">Food on Friend Split Request</h2>
        <p>Your friend is ordering food on <strong>ScrollNom</strong> and invited you to split the order!</p>
        
        <div style="background: #F7F4EB; padding: 16px; border-radius: 12px; margin: 16px 0;">
          <p style="margin: 0 0 6px 0; font-size: 14px;"><strong>Order Total:</strong> ₹${request.totalAmount}</p>
          <p style="margin: 0 0 6px 0; font-size: 14px;"><strong>Organizer Paying:</strong> ₹${request.organizerContribution}</p>
          <p style="margin: 0; font-size: 16px; color: #FF5A36;"><strong>Requested Contribution:</strong> ₹${request.requestedContribution}</p>
        </div>

        <p style="font-size: 13px; color: #666;">Open your ScrollNom app or click the button below to respond to this request.</p>

        <div style="text-align: center; margin-top: 20px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/cart" style="background: #00A896; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block;">
            Respond to Request in ScrollNom →
          </a>
        </div>
      </div>
    </div>
  `;

  console.log(`[EMAIL SERVICE] Sending Food on Friend Request Email for Request ID ${request.requestId}...`);

  if (isMockEmail) {
    console.log(`[EMAIL SERVICE] Mock Mode active. Food on Friend email logged.`);
    return { success: true, mock: true };
  }

  try {
    const data = await resend.emails.send({
      from: fromEmail,
      to: ['delivered@resend.dev'],
      subject,
      html
    });
    return { success: true, id: data.id };
  } catch (error) {
    console.error(`[EMAIL SERVICE] Resend Error:`, error);
    return { success: false, error: error.message };
  }
};
