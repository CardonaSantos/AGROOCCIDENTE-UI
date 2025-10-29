export const NOTIFICATIONS_BASE_KEY = "notifications-qk" as const;
export const NOTIFICATIONS_QK = (userId?: number | string) =>
  [NOTIFICATIONS_BASE_KEY, userId] as const;
