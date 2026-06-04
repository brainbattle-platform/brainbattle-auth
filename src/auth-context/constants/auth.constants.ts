export const APP_ROLES = ['learner', 'admin', 'moderator', 'auditor'] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const USER_STATUSES = ['active', 'blocked', 'disabled', 'pending'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const DEFAULT_ROLE: AppRole = 'learner';

export const DEFAULT_USER_SETTINGS = {
  timezone: 'Asia/Ho_Chi_Minh',
  language: 'vi',
  notificationEnabled: true,
};