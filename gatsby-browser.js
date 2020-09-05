/* eslint-disable no-alert */
import React from 'react';
import { AppLayout } from './src/containers/AppLayout';

export const wrapPageElement = ({
  element,
  props: {
    pageContext: { langKey = 'en' },
  },
}) => {
  return <AppLayout langKey={langKey}>{element}</AppLayout>;
};
export const onServiceWorkerUpdateReady = () => {
  const answer = window.confirm(
    `Piyush has updated the App. Why not reload and be up to date?`
  );
  if (answer === true) {
    window.location.reload();
  }
};
export const registerServiceWorker = () => true;
