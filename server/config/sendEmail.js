import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API);

if (!process.env.RESEND_API) {
    console.error("❌ RESEND_API key is missing! Please add it to your .env file");
} else {
    console.log("✅ Resend API key configured");
}
const sendEmail = async ({sendTo, subject, html}) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'TerraTrack <onboarding@resend.dev>',
            to: sendTo,
            subject: subject,
            html: html,
        });

        if (error) {
            console.error('Email sending error:', error);
            throw new Error(`Failed to send email: ${error.message}`);
        }
        console.log('Email sent successfully:', data);
        return data;
    } catch (error) {
        console.error('Email sending failed:', error);
        throw error;
    }
}

export default sendEmail;