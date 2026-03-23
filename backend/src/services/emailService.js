import crypto from 'crypto';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const RESEND_API_URL = 'https://api.resend.com/emails';
const OTP_EXPIRY_MINUTES = 10;

const escapeHtml = (value = '') =>
    String(value).replace(/[&<>"']/g, (character) => {
        const entities = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };

        return entities[character] || character;
    });

const getResendConfig = () => {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM;

    if (!apiKey || !from) {
        throw new Error('Resend is not configured. Set RESEND_API_KEY and RESEND_FROM.');
    }

    return { apiKey, from };
};

const createEmailHtml = ({
    accentGradient,
    code,
    codeBackground,
    codeBorder,
    codeColor,
    footerText,
    greeting,
    intro,
    noticeItems,
    noticeTitle,
    preheader,
    subjectLine,
    title
}) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(subjectLine)}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
            color: #1f2937;
            font-family: Arial, Helvetica, sans-serif;
            line-height: 1.6;
        }
        .wrapper {
            width: 100%;
            padding: 32px 16px;
            box-sizing: border-box;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 45px rgba(15, 23, 42, 0.12);
        }
        .header {
            background: ${accentGradient};
            color: #ffffff;
            padding: 32px 28px;
        }
        .header h1 {
            margin: 0 0 8px;
            font-size: 28px;
            line-height: 1.2;
        }
        .header p {
            margin: 0;
            opacity: 0.92;
            font-size: 15px;
        }
        .content {
            padding: 32px 28px;
        }
        .content h2 {
            margin: 0 0 16px;
            font-size: 22px;
            color: #111827;
        }
        .content p {
            margin: 0 0 16px;
            font-size: 15px;
        }
        .otp-code {
            margin: 28px 0;
            padding: 18px 20px;
            text-align: center;
            font-size: 32px;
            font-weight: 700;
            letter-spacing: 6px;
            border-radius: 12px;
            background: ${codeBackground};
            border: 2px solid ${codeBorder};
            color: ${codeColor};
        }
        .notice {
            margin: 24px 0;
            padding: 18px 20px;
            border-radius: 12px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
        }
        .notice strong {
            display: block;
            margin-bottom: 10px;
        }
        .notice ul {
            margin: 0;
            padding-left: 18px;
        }
        .footer {
            padding: 18px 28px 28px;
            font-size: 13px;
            color: #64748b;
            text-align: center;
        }
        @media (max-width: 640px) {
            .wrapper {
                padding: 20px 12px;
            }
            .header,
            .content,
            .footer {
                padding-left: 20px;
                padding-right: 20px;
            }
            .otp-code {
                font-size: 28px;
                letter-spacing: 4px;
            }
        }
    </style>
</head>
<body>
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>${escapeHtml(title)}</h1>
                <p>${escapeHtml(subjectLine)}</p>
            </div>
            <div class="content">
                <h2>${escapeHtml(greeting)}</h2>
                <p>${escapeHtml(intro)}</p>
                <div class="otp-code">${escapeHtml(code)}</div>
                <div class="notice">
                    <strong>${escapeHtml(noticeTitle)}</strong>
                    <ul>
                        ${noticeItems.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
                    </ul>
                </div>
                <p>${escapeHtml(footerText)}</p>
            </div>
            <div class="footer">
                This email was sent by CourseAI.
            </div>
        </div>
    </div>
</body>
</html>
`;

const createVerificationEmailContent = (name, code) => ({
    subject: 'Verify Your CourseAI Account',
    text: [
        `Hello ${name},`,
        '',
        `Your CourseAI verification code is ${code}.`,
        `This code expires in ${OTP_EXPIRY_MINUTES} minutes.`,
        'Do not share this code with anyone.'
    ].join('\n'),
    html: createEmailHtml({
        accentGradient: 'linear-gradient(135deg, #0f766e 0%, #0369a1 100%)',
        code,
        codeBackground: '#ecfeff',
        codeBorder: '#99f6e4',
        codeColor: '#0f766e',
        footerText: 'If you did not request this code, you can ignore this email.',
        greeting: `Hello ${name},`,
        intro: 'Use the verification code below to finish creating your CourseAI account.',
        noticeItems: [
            `This code expires in ${OTP_EXPIRY_MINUTES} minutes.`,
            'Enter the code in the verification screen to complete signup.',
            'Do not share this code with anyone.'
        ],
        noticeTitle: 'Verification instructions',
        preheader: `Your CourseAI verification code is ${code}.`,
        subjectLine: 'Complete your CourseAI signup',
        title: 'Account Verification'
    })
});

const createPasswordResetEmailContent = (name, code) => ({
    subject: 'Reset Your CourseAI Password',
    text: [
        `Hello ${name},`,
        '',
        `Your CourseAI password reset code is ${code}.`,
        `This code expires in ${OTP_EXPIRY_MINUTES} minutes.`,
        'If you did not request a password reset, you can ignore this email.'
    ].join('\n'),
    html: createEmailHtml({
        accentGradient: 'linear-gradient(135deg, #b91c1c 0%, #ea580c 100%)',
        code,
        codeBackground: '#fef2f2',
        codeBorder: '#fecaca',
        codeColor: '#b91c1c',
        footerText: 'If you did not request a password reset, you can ignore this email and your password will remain unchanged.',
        greeting: `Hello ${name},`,
        intro: 'Use the verification code below to reset your CourseAI password.',
        noticeItems: [
            `This code expires in ${OTP_EXPIRY_MINUTES} minutes.`,
            'Only use this code if you initiated the password reset.',
            'Do not share this code with anyone.'
        ],
        noticeTitle: 'Security notice',
        preheader: `Your CourseAI password reset code is ${code}.`,
        subjectLine: 'Complete your password reset',
        title: 'Password Reset'
    })
});

const sendEmail = async ({ html, subject, text, to }) => {
    const { apiKey, from } = getResendConfig();

    const response = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from,
            to: [to],
            subject,
            html,
            text
        })
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
        const errorMessage =
            payload?.message ||
            payload?.error ||
            `Resend request failed with status ${response.status}`;

        throw new Error(errorMessage);
    }

    return {
        success: true,
        messageId: payload?.id || null
    };
};

export const generateOTP = () => crypto.randomInt(100000, 999999).toString();

export const generateVerificationToken = () => crypto.randomBytes(32).toString('hex');

export const sendVerificationEmail = async (email, code, name = 'User') => {
    try {
        const content = createVerificationEmailContent(name, code);
        const result = await sendEmail({
            to: email,
            subject: content.subject,
            html: content.html,
            text: content.text
        });

        console.log('Verification email sent:', result.messageId);
        return result;
    } catch (error) {
        console.error('Verification email failed:', error);
        throw new Error('Failed to send verification email');
    }
};

export const sendPasswordResetEmail = async (email, code, name = 'User') => {
    try {
        const content = createPasswordResetEmailContent(name, code);
        const result = await sendEmail({
            to: email,
            subject: content.subject,
            html: content.html,
            text: content.text
        });

        console.log('Password reset email sent:', result.messageId);
        return result;
    } catch (error) {
        console.error('Password reset email failed:', error);
        throw new Error('Failed to send password reset email');
    }
};

export const testEmailConfig = async () => {
    try {
        getResendConfig();
        console.log('Resend configuration is present');
        return true;
    } catch (error) {
        console.error('Resend configuration failed:', error);
        return false;
    }
};
