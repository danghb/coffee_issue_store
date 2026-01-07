export const IssueStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  NEED_INFO: 'NEED_INFO',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const;

export type IssueStatus = typeof IssueStatus[keyof typeof IssueStatus];
