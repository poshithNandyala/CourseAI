import nodemailer from 'nodemailer';
import crypto from 'crypto';

// ES Module syntax
import dotenv from "dotenv";
dotenv.config();
// Create reusable transporter
const createTransporter = () => {
    // Check if email is configured
    if (!process.env.EMAIL_USER && process.env.NODE_ENV === 'development') {
        console.log('⚠️ Email not configured - using console logging for development');
        return null; // We'll handle this case separately
    }

    // For development, use a service like Gmail or a test service
    if (process.env.NODE_ENV === 'development') {
        // Using Gmail for development (you can change this)
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD // Use App Password for Gmail
            }
        });
    } else {
        // For production, use a professional email service like SendGrid, AWS SES, etc.
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD
            }
        });
    }
};

// Generate 6-digit OTP
export const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

// Generate secure verification token
export const generateVerificationToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

// Send verification email with OTP
export const sendVerificationEmail = async (email, code, name = 'User') => {
    try {
        const transporter = createTransporter();
        
        // Development fallback - log to console if email not configured
        if (!transporter && process.env.NODE_ENV === 'development') {
            console.log('📧 DEVELOPMENT MODE - Email would be sent to:', email);
            console.log('🔑 Verification Code:', code);
            console.log('👤 User Name:', name);
            console.log('⏰ Code expires in 10 minutes');
            console.log('📝 In production, configure EMAIL_USER and EMAIL_PASSWORD in .env');
            return { success: true, messageId: 'dev-mode-' + Date.now() };
        }
        
        if (!transporter) {
            throw new Error('Email service not configured');
        }
        
        const mailOptions = {
            from: {
                name: 'CourseAI',
                address: process.env.EMAIL_FROM || process.env.EMAIL_USER
            },
            to: email,
            subject: 'Verify Your CourseAI Account',
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Account</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6; 
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
        }
        .container { 
            max-width: 600px; 
            margin: 40px auto; 
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .content { 
            padding: 40px 30px;
        }
        .otp-code {
            background: #f1f5f9;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 32px;
            font-weight: bold;
            text-align: center;
            padding: 20px;
            margin: 30px 0;
            letter-spacing: 4px;
            color: #1e293b;
        }
        .info-box {
            background: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .footer {
            background: #f8fafc;
            padding: 20px 30px;
            text-align: center;
            font-size: 14px;
            color: #64748b;
        }
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
        }
        @media (max-width: 600px) {
            .container { margin: 20px; }
            .content, .header { padding: 30px 20px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧠 CourseAI</h1>
            <p>Welcome to the future of course creation</p>
        </div>
        
        <div class="content">
            <h2>Hello ${name}! 👋</h2>
            <p>Thank you for signing up for CourseAI. To complete your registration and verify your email address, please use the verification code below:</p>
            
            <div class="otp-code">${code}</div>
            
            <div class="info-box">
                <strong>Important:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>This code will expire in <strong>10 minutes</strong></li>
                    <li>Enter this code in the verification form</li>
                    <li>Do not share this code with anyone</li>
                </ul>
            </div>
            
            <p>If you didn't request this verification, please ignore this email or contact our support team.</p>
            
            <p>Once verified, you'll be able to:</p>
            <ul>
                <li>✨ Create AI-powered courses instantly</li>
                <li>🎥 Generate video content and quizzes</li>
                <li>🌍 Share your knowledge with the world</li>
                <li>📊 Track your course performance</li>
            </ul>
        </div>
        
        <div class="footer">
            <p>This email was sent by CourseAI. If you have any questions, contact us at support@courseai.com</p>
            <p>&copy; 2024 CourseAI. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Verification email sent:', result.messageId);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error('❌ Email sending failed:', error);
        throw new Error('Failed to send verification email');
    }
};

// Send password reset email
export const sendPasswordResetEmail = async (email, code, name = 'User') => {
    try {
        const transporter = createTransporter();
        
        // Development fallback - log to console if email not configured
        if (!transporter && process.env.NODE_ENV === 'development') {
            console.log('📧 DEVELOPMENT MODE - Password reset email would be sent to:', email);
            console.log('🔑 Reset Code:', code);
            console.log('👤 User Name:', name);
            console.log('⏰ Code expires in 10 minutes');
            return { success: true, messageId: 'dev-mode-reset-' + Date.now() };
        }
        
        if (!transporter) {
            throw new Error('Email service not configured');
        }
        
        const mailOptions = {
            from: {
                name: 'CourseAI',
                address: process.env.EMAIL_FROM || process.env.EMAIL_USER
            },
            to: email,
            subject: 'Reset Your CourseAI Password',
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6; 
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
        }
        .container { 
            max-width: 600px; 
            margin: 40px auto; 
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        .content { 
            padding: 40px 30px;
        }
        .otp-code {
            background: #fef2f2;
            border: 2px solid #fecaca;
            border-radius: 8px;
            font-size: 32px;
            font-weight: bold;
            text-align: center;
            padding: 20px;
            margin: 30px 0;
            letter-spacing: 4px;
            color: #dc2626;
        }
        .warning-box {
            background: #fef3cd;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .footer {
            background: #f8fafc;
            padding: 20px 30px;
            text-align: center;
            font-size: 14px;
            color: #64748b;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔒 Password Reset</h1>
            <p>CourseAI Security</p>
        </div>
        
        <div class="content">
            <h2>Hello ${name},</h2>
            <p>We received a request to reset your CourseAI account password. Use the verification code below to proceed:</p>
            
            <div class="otp-code">${code}</div>
            
            <div class="warning-box">
                <strong>Security Notice:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>This code expires in <strong>10 minutes</strong></li>
                    <li>Only use this code if you requested a password reset</li>
                    <li>Never share this code with anyone</li>
                </ul>
            </div>
            
            <p>If you didn't request this password reset, please ignore this email and your password will remain unchanged.</p>
        </div>
        
        <div class="footer">
            <p>This email was sent by CourseAI. If you have any questions, contact us at support@courseai.com</p>
        </div>
    </div>
</body>
</html>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Password reset email sent:', result.messageId);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error('❌ Password reset email failed:', error);
        throw new Error('Failed to send password reset email');
    }
};

// Test email configuration
export const testEmailConfig = async () => {
    try {
        const transporter = createTransporter();
        await transporter.verify();
        console.log('✅ Email configuration is valid');
        return true;
    } catch (error) {
        console.error('❌ Email configuration failed:', error);
        return false;
    }
};
