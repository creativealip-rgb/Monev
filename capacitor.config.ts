import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.creativealip.monev',
  appName: 'Monev',
  webDir: 'out',
  server: {
    url: 'https://emmalynn-unstiffened-elvera.ngrok-free.dev',
    cleartext: true
  }
};

export default config;
