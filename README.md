# Prototipo WebAR Educativo

Este proyecto es una prueba de concepto de realidad aumentada web pensada para demostrar viabilidad tecnica, bajo costo y facilidad de acceso en contextos educativos.

## Que incluye

- Pagina informativa con contexto del proyecto.
- Escena WebAR construida con `A-Frame` y `AR.js`.
- Activacion de camara desde el navegador.
- Deteccion del marcador clasico `Hiro`.
- Formulario conectado directamente a Firebase Firestore.
- Compatible con despliegue en GitHub Pages.

## Estructura

- `index.html`: interfaz del prototipo y formulario de registro.
- `app.js`: conecta el formulario con Firestore desde el navegador.
- `firebase-config.js`: configuracion publica de tu proyecto Firebase web.
- `styles.css`: estilos del prototipo.

## Conectar Firebase

1. Entra a [Firebase Console](https://console.firebase.google.com/).
2. Crea un proyecto nuevo o usa uno existente.
3. En `Build > Firestore Database`, crea la base de datos.
4. En `Project settings > General`, dentro de `Your apps`, crea una app web.
5. Copia los datos de configuracion web de Firebase.
6. Abre `firebase-config.js` y reemplaza:
- `apiKey`
- `authDomain`
- `projectId`
- `storageBucket`
- `messagingSenderId`
- `appId`

## Coleccion usada

El formulario guarda datos en la coleccion:

- `prototype_submissions`

Cada registro guarda:

- `name`
- `email`
- `role`
- `notes`
- `createdAt`
- `source`

## Reglas recomendadas para pruebas

Si quieres probar rapido desde GitHub Pages, puedes usar reglas temporales de Firestore que permitan escribir en esa coleccion.

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /prototype_submissions/{document=**} {
      allow create: if true;
      allow read: if false;
    }
  }
}
```

## Publicar con GitHub Pages

1. Sube los cambios a GitHub.
2. Ve al repositorio.
3. Abre `Settings > Pages`.
4. En `Source`, elige `Deploy from a branch`.
5. Selecciona `main` y la carpeta `/ (root)`.
6. Guarda y espera el enlace publico.

## Nota importante

Como este flujo usa Firebase desde el navegador, no necesita Netlify ni funciones serverless.
