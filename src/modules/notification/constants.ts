export const notificationTemplates = {
  LEAVE_REQUEST: (from: string) => `You have a new leave request from ${from}`,
  LEAVE_REQUEST_APPROVED: (from: string) => `Your leave request has been approved by ${from}`,
  LEAVE_REQUEST_REJECTED: (from: string) => `Your leave request has been rejected by ${from}`,
  LEAVE_REQUEST_CANCELLED: (from: string) => `Your leave request has been cancelled by ${from}`,
};
