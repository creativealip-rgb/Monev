import type { CapacitorConfig } from '@capacitor/cli';

const apkWebUrl = process.env.CAPACITOR_SERVER_URL;

const config: CapacitorConfig = {
  appId: 'com.creativealip.monev',
  appName: 'Monev',
  webDir: 'out',
  server: {
    ...(apkWebUrl ? { url: apkWebUrl } : {}),
    androidScheme: "https",
    cleartext: true,
  },
  plugins: {
    StatusBar: {
      overlaysWebView: true,
      style: 'LIGHT',
      backgroundColor: '#00000000',
    },
    Keyboard: {
      resize: 'body' as never,
      resizeOnFullScreen: true,
    },
    SplashScreen: {
      launchAutoHide: true, // Auto hide splash screen
      backgroundColor: '#0EA5E9',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
  },
};

export default config;
