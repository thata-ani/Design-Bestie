import mixpanel from 'mixpanel-browser';

mixpanel.init('aa410ec7b476534151c51328e2dc82cc', {
  track_pageview: true,
  persistence: 'localStorage',
});

export default mixpanel;
