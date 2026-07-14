const config = {
  appId: 'com.surimart.app',
  appName: 'SuriMart',
  server: {
    url: 'https://commerce-final-8bic.vercel.app/app',
    cleartext: false
  },
  webDir: 'public',
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      spinnerStyle: 'horizontal'
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#ffffff'
    },
    App: {
      deepLinks: [
        {
          scheme: 'surimart',
          host: 'auth',
          path: 'callback'
        }
      ]
    }
  }
};

export default config;
