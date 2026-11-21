import { useCallback, useEffect, useState } from 'react';
import { teamApi } from '../lib/api';
import type { TeamMember } from '../types';

export function useTeamMembers() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await teamApi.list();
      setMembers(
        [...response.members].sort(
          (left, right) => left.display_order - right.display_order || left.id - right.id,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load team members.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { members, loading, error, reload };
}
