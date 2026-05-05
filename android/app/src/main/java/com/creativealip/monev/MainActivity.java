package com.creativealip.monev;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;

import androidx.core.view.WindowCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        applySystemBars();
    }

    @Override
    public void onResume() {
        super.onResume();
        applySystemBars();
    }

    private void applySystemBars() {
        Window window = getWindow();
        int chromeColor = Color.parseColor("#020617");

        WindowCompat.setDecorFitsSystemWindows(window, true);
        window.setStatusBarColor(chromeColor);
        window.setNavigationBarColor(chromeColor);
        window.getDecorView().setSystemUiVisibility(0);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            window.getDecorView().setSystemUiVisibility(
                window.getDecorView().getSystemUiVisibility() & ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
            );
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.setNavigationBarContrastEnforced(true);
            window.setStatusBarContrastEnforced(true);
        }
    }
}
