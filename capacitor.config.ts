import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.creativealip.monev',
  appName: 'Monev',
  webDir: 'out',
  plugins: {
    StatusBar: {
      overlaysWebView: true,
      style: 'LIGHT',
      backgroundColor: '#00000000',
    },
    Keyboard: {
      resize: 'body' as any,
      resizeOnFullScreen: true,
    },
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#0EA5E9',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
  },
  /*
  server: {
    url: 'https://www.monevapp.web.id',
    cleartext: true
  }
  */
};

export default config;
