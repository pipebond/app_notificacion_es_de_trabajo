# App Notificacion Es De Trabajo

Stack actual:

- Flutter para aplicaciones móviles.
- React + Vite para la experiencia web.
- Node.js + Express + MySQL para backend.

La identidad visual de ReportaPro se unificó para web y móvil con una paleta azul cristalino, azul oscuro y blanco suave.

## Requisitos

- Flutter instalado
- Android Studio para Android
- Xcode para iOS (solo macOS)
- Cuentas de desarrollador:
  - Google Play Console
  - Apple Developer Program

## Ejecutar en desarrollo

En Windows, si Flutter no esta en PATH, usa ruta absoluta:

```powershell
C:/src/flutter/bin/flutter.bat pub get
C:/src/flutter/bin/flutter.bat run
```

## Estructura principal

- lib/main.dart: app Flutter orientada a móvil
- webapp/: frontend web en React + Vite
- backend/: API Express + MySQL

## Roadmap recomendado

1. Definir alcance MVP (login, perfil, notificaciones, backend).
2. Integrar gestion de estado (Riverpod o Bloc).
3. Configurar Firebase (Auth, Firestore, Messaging, Crashlytics).
4. Implementar analitica y manejo de errores.
5. Preparar assets finales (icono, splash, capturas, politica de privacidad).
6. Generar builds firmadas de release.

## Publicar en Play Store

1. Crear keystore y firma de app en Android.
2. Configurar version en pubspec.yaml.
3. Generar AAB:

```powershell
C:/src/flutter/bin/flutter.bat build appbundle --release
```

4. Subir el archivo generado en build/app/outputs/bundle/release.
5. Completar ficha de Play Console (descripcion, screenshots, clasificacion, privacidad).

## Publicar en App Store

1. Abrir ios en Xcode desde una Mac.
2. Configurar Bundle Identifier y Signing.
3. Actualizar version y build number.
4. Generar IPA o archivar desde Xcode.
5. Subir con Xcode Organizer o Transporter a App Store Connect.
6. Completar metadata y enviar a revision.

## Comandos utiles

```powershell
C:/src/flutter/bin/flutter.bat analyze
C:/src/flutter/bin/flutter.bat test
```

## Ejecucion Local (Backend + Web)

### 1. Backend local

Configura `backend/.env` con valores de base de datos local y claves de API.

```powershell
cd backend
npm install
npm start
```

Endpoint de salud esperado:

- `GET http://localhost:4000/api/health`

### 2. Frontend web local

Configura `webapp/.env` con:

- `VITE_API_BASE_URL=http://localhost:4000/api`
- `VITE_API_KEY=TU_API_KEY_LOCAL`

```powershell
cd webapp
npm install
npm run dev
```

Build local de verificacion:

```powershell
cd webapp
npm run build
```

## Variables para Flutter móvil

Para builds móviles, pasa las variables sensibles con `dart-define`:

```powershell
C:/src/flutter/bin/flutter.bat run --dart-define=API_BASE_URL=http://localhost:4000/api --dart-define=API_KEY=TU_API_KEY
```
