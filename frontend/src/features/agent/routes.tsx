import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';

import { AGENT_ROUTES, relativeTo } from '@/features/agent/paths';

const AgentDashboardPage = lazy(() => import('@/features/agent/dashboard/pages/AgentDashboardPage'));
const CaseListPage = lazy(() => import('@/features/agent/cases/pages/CaseListPage'));
const CaseDetailPage = lazy(() => import('@/features/agent/cases/pages/CaseDetailPage'));
const ValidationQueuePage = lazy(
  () => import('@/features/agent/validation/pages/ValidationQueuePage'),
);
const ValidationDetailPage = lazy(
  () => import('@/features/agent/validation/pages/ValidationDetailPage'),
);
const AgentAssistantPage = lazy(() => import('@/features/agent/assistant/pages/AgentAssistantPage'));
const AgentSettingsPage = lazy(() => import('@/features/agent/settings/pages/AgentSettingsPage'));
const AgentProfilePage = lazy(() => import('@/features/agent/profile/pages/AgentProfilePage'));
const AgentNotificationsPage = lazy(
  () => import('@/features/agent/notifications/pages/AgentNotificationsPage'),
);

export const agentRoutes: RouteObject[] = [
  { index: true, element: <AgentDashboardPage /> },

  { path: relativeTo(AGENT_ROUTES.cases), element: <CaseListPage /> },
  { path: relativeTo(AGENT_ROUTES.caseDetail()), element: <CaseDetailPage /> },

  { path: relativeTo(AGENT_ROUTES.validation), element: <ValidationQueuePage /> },
  { path: relativeTo(AGENT_ROUTES.validationDetail()), element: <ValidationDetailPage /> },

  { path: relativeTo(AGENT_ROUTES.assistant), element: <AgentAssistantPage /> },
  { path: relativeTo(AGENT_ROUTES.settings), element: <AgentSettingsPage /> },
  { path: relativeTo(AGENT_ROUTES.profile), element: <AgentProfilePage /> },
  { path: relativeTo(AGENT_ROUTES.notifications), element: <AgentNotificationsPage /> },
];
