import Cookies from 'js-cookie';
import { clearClubFundDetailSession } from './clubFundDetailSession';

if (typeof window !== 'undefined') {
  window.addEventListener('authchange', () => {
    if (!Cookies.get('accessToken')) {
      clearClubFundDetailSession();
    }
  });
}
