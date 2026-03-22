# App Notificacion Es De Trabajo

Base Flutter para construir una app movil y publicarla en Play Store y App Store.

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

## Estructura inicial

- lib/main.dart: pantalla inicial y tema base

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

## Despliegue en GitHub, Vercel y Render

### 1. Subir repositorio a GitHub

```powershell
cd c:/Users/kakas/OneDrive/Desktop/app_notificacion_es_de_trabajo
git init
git add .
git commit -m "feat: proyecto Flutter + backend Node listo para deploy"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

### 2. Backend en Render

- Este repo ya incluye `render.yaml` para crear el servicio web desde el archivo.
- En Render, crea un servicio desde repositorio y selecciona Blueprint.
- Configura estas variables (las marcadas en `render.yaml` con `sync: false`):
  - `DB_HOST`
  - `DB_PORT`
  - `DB_USER`
  - `DB_PASSWORD`
  - `DB_NAME`
  - `API_KEY`
  - `CORS_ORIGINS` (incluye la URL final de Vercel)

Healthcheck esperado del backend:

- `GET /api/health`

### 3. Frontend web en Vercel

- Este repo ya incluye `vercel.json` y `scripts/vercel-build.sh`.
- En Vercel, importa el repositorio.
- Variables de entorno requeridas para build:
  - `API_BASE_URL` (ejemplo: `https://tu-backend.onrender.com/api`)
  - `API_KEY` (misma del backend)

El build de Vercel genera Flutter web con `dart-define`.

### 4. Orden recomendado

1. Publicar backend en Render y copiar URL publica.
2. Configurar `API_BASE_URL` en Vercel.
3. Publicar frontend en Vercel.
4. Actualizar `CORS_ORIGINS` en Render con la URL final de Vercel.
