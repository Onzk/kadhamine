import Resend from '@auth/core/providers/resend';
import { Resend as ResendAPI } from 'resend';
import { RandomReader, generateRandomString } from '@oslojs/crypto/random';

export const ResendOTPPasswordReset = Resend({
  id: 'resend-otp',
  apiKey: process.env.AUTH_RESEND_KEY,
  async generateVerificationToken() {
    const random: RandomReader = {
      read(bytes) {
        crypto.getRandomValues(bytes);
      },
    };

    const alphabet = '0123456789';
    const length = 8;
    return generateRandomString(random, alphabet, length);
  },
  async sendVerificationRequest({ identifier: email, provider, token }) {
    const apiKey = provider.apiKey ?? process.env.AUTH_RESEND_KEY;
    if (!apiKey) {
      throw new Error('AUTH_RESEND_KEY is not configured');
    }

    const resend = new ResendAPI(apiKey);
    const { error } = await resend.emails.send({
      from: 'Kadhamine <onboarding@resend.dev>',
      to: [email],
      subject: 'Réinitialisez votre mot de passe Kadhamine',
      text: `Votre code de réinitialisation Kadhamine est : ${token}\n\nEntrez ce code dans l'application pour choisir un nouveau mot de passe.`,
    });

    if (error) {
      throw new Error('Could not send password reset email');
    }
  },
});
