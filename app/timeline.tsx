import { router } from 'expo-router';
import React, { useEffect } from 'react';

export default function TimelineRedirectScreen() {
  useEffect(() => {
    router.replace('/timeline-list');
  }, []);

  return null;
}
