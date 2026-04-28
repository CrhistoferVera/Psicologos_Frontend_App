import { useEffect, useState } from 'react';
import { apiGetConfig } from '../api/userClient';

export function useCreditRate() {
  const [creditRate, setCreditRate] = useState<number>(1);

  useEffect(() => {
    apiGetConfig()
      .then((cfg) => setCreditRate(cfg.creditValueBs ?? cfg.creditToSolesRate))
      .catch(() => {});
  }, []);

  const toBs = (credits: number) => (credits * creditRate).toFixed(2);

  return { creditRate, toBs };
}
