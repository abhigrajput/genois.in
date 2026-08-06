'use client';
import { useState, useEffect } from 'react';
import { hasPermission, getDomainLimit, getEffectivePlan, getTrialDaysLeft } from './permissions';

export function usePermission() {
  const [userPlan, setUserPlan] = useState('spectator');
  const [trialEndsAt, setTrialEndsAt] = useState(null);
  const [isOnTrial, setIsOnTrial] = useState(false);
  const [planLoaded, setPlanLoaded] = useState(false);

  useEffect(() => {
    // FIX P4 follow-up: auth moved to the httpOnly `genois_token` cookie, which
    // JS cannot read. Bailing out when localStorage has no token left every
    // cookie-authenticated user stuck on the 'spectator' default — invisible
    // while BETA_MODE unlocks everything, but it would have locked Mentor for
    // everyone the moment the gates came back on.
    //
    // Always ask the server: `credentials: 'include'` sends the cookie, and the
    // Bearer header rides along only for sessions predating the migration.
    // getUserFromRequest accepts either (lib/auth.js).
    const token = localStorage.getItem('genois_token');
    fetch('/api/user/me', {
      credentials: 'include',
      ...(token && { headers: { Authorization: 'Bearer ' + token } }),
    })
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
