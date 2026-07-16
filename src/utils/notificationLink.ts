import type { Notification, ProjectTask, ProjectDocument, PurchaseOrder } from '../types';

interface Lookups {
  tasks: ProjectTask[];
  documents: ProjectDocument[];
  purchaseOrders: PurchaseOrder[];
}

export function getNotificationLink(n: Notification, lookups: Lookups): string {
  switch (n.relatedType) {
    case 'project':
      return `/projects/${n.relatedId}`;
    case 'bid':
      return `/bidding/${n.relatedId}`;
    case 'task': {
      const task = lookups.tasks.find(t => t.id === n.relatedId);
      return task ? `/projects/${task.projectId}/tasks` : '/tasks';
    }
    case 'document': {
      const doc = lookups.documents.find(dc => dc.id === n.relatedId);
      return doc ? `/projects/${doc.projectId}/documents` : '/documents';
    }
    case 'purchaseOrder': {
      const po = lookups.purchaseOrders.find(p => p.id === n.relatedId);
      return po ? `/projects/${po.projectId}/procurement` : '/procurement';
    }
    default:
      return '/dashboard';
  }
}
