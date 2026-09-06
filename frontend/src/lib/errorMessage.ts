import { AxiosError } from 'axios';

// Turns any API failure into a message worth showing a person — distinguishing
// "the server told us something specific" from "we couldn't even reach it."
export function getErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (err && typeof err === 'object' && 'isAxiosError' in err) {
    const axiosErr = err as AxiosError<{ message?: string }>;

    if (!axiosErr.response) {
      return 'Could not reach the server. Check your connection and try again.';
    }

    const serverMessage = axiosErr.response.data?.message;
    if (serverMessage) return serverMessage;

    if (axiosErr.response.status >= 500) {
      return 'Something went wrong on our end. Please try again in a moment.';
    }
  }
  return fallback;
}
