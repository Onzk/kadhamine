import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

/** Deep link that closes the in-app auth session after FedaPay redirects. */
export function getFedapayReturnUrl() {
  return Linking.createURL('/payment/callback');
}

/** Opens FedaPay checkout in-app; resolves when the redirect URL is hit or the user dismisses. */
export async function openFedapayCheckout(paymentUrl: string) {
  return WebBrowser.openAuthSessionAsync(paymentUrl, getFedapayReturnUrl());
}
