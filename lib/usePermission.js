'use client';
import { useState, useEffect } from 'react';
import { hasPermission, getDomainLimit, getEffectivePlan, getTrialDaysLeft } from './permissions';

export function usePermission() {
  const [userPlan, setUserPlan] = useState('spectator');
  const [trialEndsAt, setTrialEndsAt] = useState(null);
  const [isOnTrial, setIsOnTrial] = useState(false);
  const [planLoaded, setPlanLoaded] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('genois_token');
    if (!token) {
      setPlanLoaded(true);
      return;
    }
    fetch('/api/user/me', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.json())
      .then(d => {
        const plan = (d.data?.user?.subscription_plan || 'spectator').toLowerCase();
        const trial = d.data?.user?.trial_ends_at;
        const onTrial = d.data?.user?.is_on_trial;
        setUserPlan(plan);
        setTrialEndsAt(trial);
        setIsOnTrial(onTrial);
        localStorage.setItem('genois_plan', plan);
        if (trial) localStorage.setItem('genois_trial_ends', trial);
        setPlanLoaded(true);
      })
      .catch(() => setPlanLoaded(true));
  }, []);

  const effectivePlan = getEffectivePlan(userPlan, trialEndsAt, isOnTrial);
  const trialDaysLeft = getTrialDaysLeft(trialEndsAt);
  const isInTrial = isOnTrial && trialDaysLeft > 0;

  return {
    userPlan,
    effectivePlan,
    trialEndsAt,
    isInTrial,
    trialDaysLeft,
    planLoaded,
    can: (feature) => hasPermission(userPlan, feature, trialEndsAt, isOnTrial),
    domainLimit: getDomainLimit(effectivePlan),
  };
}
