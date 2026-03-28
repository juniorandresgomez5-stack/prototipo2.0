# Prototipo WebAR Educativo

Este proyecto es una prueba de concepto de realidad aumentada web pensada para demostrar viabilidad tecnica, bajo costo y facilidad de acceso en contextos educativos.

## Que incluye

- Pagina informativa con contexto del proyecto.
- Escena WebAR construida con `A-Frame` y `AR.js`.
- Activacion de camara desde el navegador.
- Deteccion del marcador clasico `Hiro`.
- Formulario conectado a una Function de Netlify.
- Guardado de registros en Firebase Firestore.

## Estructura nueva

- `index.html`: interfaz del prototipo y formulario de registro.
- `app.js`: envia datos del formulario a Netlify Functions.
- `netlify/functions/save-interest.js`: recibe datos y los guarda en Firestore.
- `.env.example`: variables necesarias para conectar Firebase.
- `netlify.toml`: configuracion de publicacion y carpeta de funciones.

## Crear la base de datos en Firebase

1. Entra a [Firebase Console](https://console.firebase.google.com/).
2. Crea un proyecto nuevo o usa uno existente.
3. Ve a `Firestore Database` y crea la base de datos en modo produccion o pruebas.
4. Crea una coleccion llamada `prototype_submissions` o deja que se cree sola con el primer envio.
5. Ve a `Project settings > Service accounts`.
6. Genera una nueva clave privada para el SDK de administrador.
7. Guarda estos valores:
- `project_id`
- `client_email`
- `private_key`

## Variables de entorno en Netlify

En Netlify agrega estas variables en `Site configuration > Environment variables`:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Importante: en `FIREBASE_PRIVATE_KEY` debes pegar la clave completa, incluyendo `-----BEGIN PRIVATE KEY-----` y los saltos de linea escapados como `\n`.

## Publicar en Netlify

1. Sube esta carpeta a un repositorio o importala en Netlify.
2. Netlify detectara `netlify.toml` y publicara la raiz del proyecto.
3. Antes del deploy, instala dependencias con `npm install` para incluir `firebase-admin`.
4. Despliega el sitio.
5. Prueba el formulario y revisa la coleccion `prototype_submissions` en Firestore.

## Nota local

En este equipo no hay `node` ni `npm` instalados ahora mismo, asi que deje la integracion preparada pero no pude ejecutar una prueba local de la Function.
