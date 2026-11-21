import type { TeamCategory } from '../types';

export const TEAM_GROUPS: { category: TeamCategory; label: string }[] = [
  { category: 'leader', label: 'Team Leader' },
  { category: 'core', label: 'Core Team' },
  { category: 'member', label: 'Members' },
  { category: 'former', label: 'Former Members' },
];
