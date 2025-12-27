package com.teo.app;

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.graphics.Insets;
import com.getcapacitor.BridgeActivity;

/**
 * MainActivity para ClassApp
 * Configuración estándar de Capacitor con Android 12+ SplashScreen API
 * Incluye soporte para safe areas (status bar y navigation bar)
 * 
 * @see https://capacitorjs.com/docs/android/custom-code
 */
public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Instalar SplashScreen API antes de super.onCreate()
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);

        super.onCreate(savedInstanceState);

        // Deshabilitar edge-to-edge para respetar safe areas
        // Esto evita que el contenido se dibuje debajo de la status bar y navigation
        // bar
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
    }
}
