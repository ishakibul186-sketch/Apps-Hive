declare const emailjs: any;

const SERVICE_ID = 'service_dkrsr7i';
const TEMPLATE_ID = 'template_ufr31wk';
const PUBLIC_KEY = 'S18QPcsHACfzcnjB2';

export const initEmailJS = () => {
    if (typeof emailjs !== 'undefined') {
        emailjs.init({ publicKey: PUBLIC_KEY });
    } else {
        console.error("EmailJS script not loaded. Make sure to include it in your index.html");
    }
};

export const sendWelcomeEmail = async (userName: string, toEmail: string): Promise<void> => {
    if (typeof emailjs === 'undefined') {
        console.error("EmailJS is not available. Cannot send email.");
        return;
    }

    const year = new Date().getFullYear();
    const mailContent = `Hi ${userName},

Thank you for signing up at Apps Hive !

Your account has been successfully created. You can now log in and start using our platform.

Status: Active

Click the link below to log into your account:
[https://apps-hive-view.web.app]

If you didn’t create this account or feel this was a mistake, please contact us immediately: support@yourdomain.com

Welcome aboard!
[Apps Hive] Team
© [${year}] [Apps Hive]. All rights reserved.`;

    const templateParams = {
        datamail: mailContent,
        tomail: toEmail,
        title: 'Apps Hive login compleacted'
    };

    try {
        await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams);
        console.log('Welcome email sent successfully!');
    } catch (error) {
        console.error('Failed to send welcome email:', error);
    }
};
