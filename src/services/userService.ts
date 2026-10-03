import { User } from '../types/financial';
import { authService } from './authService';

export const userService = {
  /**
   * Get current authenticated user profile
   */
  getProfile(): User | null {
    return authService.getCurrentUser();
  },

  /**
   * Update profile fields (name, email, profileImage, preferredLanguage, currency, monthlyIncome, riskTolerance)
   */
  async updateProfile(updates: Partial<User>): Promise<User> {
    return authService.updateProfile(updates);
  },

  /**
   * Update preferred language ('en' | 'bn')
   */
  async setLanguage(preferredLanguage: 'en' | 'bn'): Promise<User> {
    return authService.updateProfile({ preferredLanguage });
  },

  /**
   * Update preferred currency (e.g. '৳')
   */
  async setCurrency(currency: string): Promise<User> {
    return authService.updateProfile({ currency });
  },
};
