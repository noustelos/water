import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Resend } from 'resend';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Initialize Resend API client
const resendApiKey = process.env.RESEND_API_KEY;
const resend = new Resend(resendApiKey || 're_dummy_key');

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// API Endpoint to handle contact form submission
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, service, message } = req.body;

    // Basic input validation
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: 'Please provide required fields: name, email, and message.'
      });
    }

    console.log(`Processing contact submission from: ${name} (${email})`);

    // If using a placeholder key, simulate success to verify frontend flow
    if (!resendApiKey || resendApiKey.startsWith('re_dummy') || resendApiKey === 're_1234567890abcdefghijklmnopqrstuvwxyz') {
      console.warn('⚠️ Placeholder or missing RESEND_API_KEY detected. Simulating successful email dispatch.');
      return res.status(200).json({
        success: true,
        message: 'Message simulated successfully (Placeholder API key active).'
      });
    }

    // Send email via Resend API
    // Using Resend's default onboarding sender address which works on all unverified test accounts
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'Water Cycle Systems <onboarding@resend.dev>';
    const targetEmail = 'info@noustelos.gr';

    const data = await resend.emails.send({
      from: fromAddress,
      to: targetEmail,
      reply_to: email,
      subject: `New Lead: ${service ? service : 'General Inquiry'} - ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #0284c7; border-bottom: 2px solid #e0f2fe; padding-bottom: 10px;">New Contact Form Submission</h2>
          <p>You have received a new service inquiry from the <strong style="color: #0284c7;">Water Cycle Systems</strong> landing page.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; width: 120px;"><strong>Name:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #374151;">${escapeHtml(name)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;"><strong>Email:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #374151;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;"><strong>Phone:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #374151;">${escapeHtml(phone || 'Not provided')}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6;"><strong>Service Requested:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; color: #0284c7; font-weight: bold;">${escapeHtml(service || 'General Inquiry')}</td>
            </tr>
          </table>

          <h3 style="margin-top: 20px; color: #374151;">Message:</h3>
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; color: #4b5563; white-space: pre-wrap;">${escapeHtml(message)}</div>

          <p style="margin-top: 30px; font-size: 12px; color: #9ca3af; text-align: center;">
            Sent automatically from <strong style="color: #0284c7;">Water Cycle Systems</strong> Server.
          </p>
        </div>
      `
    });

    if (data.error) {
      console.error('Resend API Error:', data.error);
      return res.status(500).json({
        success: false,
        error: data.error.message || 'Failed to send email via Resend API.'
      });
    }

    console.log('Email dispatched successfully via Resend API:', data.id);
    return res.status(200).json({
      success: true,
      message: 'Your message has been sent successfully! We will get back to you shortly.',
      id: data.id
    });

  } catch (err) {
    console.error('Internal Server Error handling contact submission:', err);
    return res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while processing your request.'
    });
  }
});

// Helper function to prevent basic HTML injection in emails
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Fallback route for SPA / generic requests mapping back to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`🚀 Water Cycle Systems server running successfully on port ${port}`);
  console.log(`👉 Environment: ${process.env.NODE_ENV || 'development'}`);
});
