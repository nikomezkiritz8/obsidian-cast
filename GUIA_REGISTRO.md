# OBSIDIAN en el proyector — registrar tu receptor propio (diseño «Cine»)

**Estado actual (v37): hecho.** El receptor OBSIDIAN está registrado con el App ID **`8BF01B6D`**, alojado en
<https://nikomezkiritz8.github.io/obsidian-cast/>, y es el receptor por defecto de la app desde la v33.
Si un dispositivo no puede abrirlo, la app usa automáticamente el *Default Media Receiver* de Google (`CC1AD845`).
Esta guía queda como referencia (otro proyector, otra cuenta, o volver a registrar tras un restablecimiento de fábrica).

Lo que tienes que hacer tú (yo no puedo crear cuentas ni pagar):

1. Alojar gratis los 3 archivos del receptor en una URL HTTPS fija (GitHub Pages).
2. Darte de alta en la Google Cast SDK Developer Console (pago único de 5 US$, **no reembolsable**).
3. Registrar la app «Custom Receiver» con esa URL → te da un **App ID**.
4. Registrar el número de serie (Cast) del Xgimi para poder probar sin publicar.
5. Poner el App ID en OBSIDIAN (una línea) y recompilar.

Fuente de los pasos de Google: <https://developers.google.com/cast/docs/registration>
(las capturas de pantalla de la consola pueden cambiar; los nombres de botones de abajo son los que da esa página).

---

## 1. Alojar el receptor (gratis, GitHub Pages)

Archivos necesarios (todos están en esta carpeta): `index.html`, `receiver.css`, `receiver.js`.
La carpeta `demo/` es solo para probar en el ordenador; no hace falta subirla.

1. Entra en <https://github.com> (crea una cuenta gratuita si no tienes).
2. Crea un repositorio **público**, por ejemplo `obsidian-cast`.
3. Sube `index.html`, `receiver.css` y `receiver.js` a la raíz del repositorio (*Add file → Upload files*).
4. En el repositorio: **Settings → Pages**. En *Build and deployment*, origen **Deploy from a branch**,
   rama `main`, carpeta `/ (root)`, y guarda.
5. A los pocos minutos tendrás la URL: `https://TU_USUARIO.github.io/obsidian-cast/`
   Ábrela en el navegador: debe verse la pantalla negra con «OBSIDIAN · Listo para reproducir».

Notas:
- El receptor **no contiene nada privado**: la música y las portadas no pasan por GitHub; el Chromecast las pide
  directamente al móvil por tu Wi-Fi (con un token aleatorio que cambia en cada sesión).
- Google exige HTTPS para receptores publicados; GitHub Pages ya da HTTPS. El SDK de Cast se carga siempre desde
  `www.gstatic.com` (Google pide no copiarlo localmente).
- Si más adelante cambias el diseño, basta con volver a subir los archivos (misma URL, mismo App ID).

## 2. Cuenta de desarrollador de Google Cast

1. Abre la **Google Cast SDK Developer Console**: <https://cast.google.com/publish>
2. Inicia sesión con la cuenta de Google que quieras usar. **Ojo:** Google avisa de que el correo de la cuenta de
   desarrollador **no se puede cambiar** después.
3. Acepta las condiciones y paga la cuota única de **5 US$** (Google indica que no es reembolsable).

## 3. Registrar la aplicación (Custom Receiver)

1. En la consola, desde *Overview* o *Applications*, pulsa **Add New Application**.
2. Elige **Custom Receiver**.
3. Rellena:
   - **Name**: `OBSIDIAN`
   - **URL**: la de GitHub Pages del paso 1, p. ej. `https://TU_USUARIO.github.io/obsidian-cast/`
   - *Supports relay casting* y *Supports casting to audio-only devices*: puedes dejarlas **sin marcar**
     (el Xgimi es una pantalla y el móvil está en tu misma Wi-Fi).
4. Pulsa **Save**. Aparecerá el **Application ID** (8 caracteres, p. ej. `A1B2C3D4`). **Cópialo.**
5. Pulsa **Done**. No hace falta publicar la aplicación: sin publicar funciona en los dispositivos registrados (paso 4).

## 4. Registrar el Xgimi Horizon Pro para pruebas

El Xgimi Horizon Pro lleva Android TV con Chromecast integrado. Google indica que en los Android TV hay **varios
números de serie** y que hay que usar el **número de serie de software (Cast)**:

- **Forma 1 (la más sencilla):** desde Chrome en el ordenador, en la propia página de la consola, usa el botón
  de **Enviar/Cast** de Chrome y elige el Xgimi: en la pantalla aparecerá (y se leerá en voz alta) su número de serie.
- **Forma 2:** en el proyector activa el modo desarrollador (Ajustes → Sistema → Información → pulsa varias veces
  en *Compilación del SO de Android TV*), y luego mira el número de serie en *Ajustes → Preferencias del dispositivo
  → Google Cast* o *Ajustes → Sistema → Cast* (depende del modelo; los menús del Xgimi pueden llamarse algo distinto).

Luego, en la consola:

1. Desde *Overview* o *Devices*, pulsa **Add New Device**.
2. Escribe el **número de serie** y una descripción (p. ej. `Xgimi salón`). Pulsa **OK**.
3. **Espera unos 15 minutos** hasta que el estado sea **Ready for Testing**.
4. **Reinicia el proyector** desconectándolo de la corriente y volviéndolo a conectar.

Si algún día restableces el proyector de fábrica, el número de serie de software cambia y hay que registrarlo otra vez.

## 5. Poner el App ID en OBSIDIAN

En `app/build.gradle.kts` (bloque `defaultConfig`), cambia **solo esta línea**:

```kotlin
val castAppId = (project.findProperty("castAppId") as String?) ?: "8BF01B6D"
```

(valor actual: `8BF01B6D`, el receptor OBSIDIAN). Para otro receptor, cambia ese valor o compila con
`./gradlew assembleRelease -PcastAppId=OTRO_ID`. Con `CC1AD845` la app usaría la pantalla genérica de Google.

## Comprobación

1. Móvil y proyector en la **misma Wi-Fi**.
2. En OBSIDIAN, en la pantalla de reproducción, toca el icono dorado de arriba a la derecha → **Reproducir en**
   → elige el Xgimi.
3. Deberías ver la pantalla «Cine»: carátula flotante con reflejo, letra sincronizada a la derecha (o el diseño
   de carátula grande si la canción no tiene letra), pastilla HI-RES/CD y «Transmitiendo desde …».
4. El móvil sigue siendo el mando (pausa, saltar, buscar); al desconectar, la reproducción vuelve al móvil en pausa.

## Actualizar el receptor

Sube `index.html`, `receiver.css` y `receiver.js` nuevos al mismo repositorio (sustituyendo los anteriores). La URL y
el App ID no cambian. El proyector puede tener la versión anterior en caché: cierra la transmisión y vuelve a empezar
(si persiste, reinicia el proyector).

## Si no funciona

- **La pantalla se queda en el logo de Cast / carga la app genérica:** el App ID todavía no está en la app,
  o el dispositivo no está *Ready for Testing*, o falta reiniciar el proyector.
- **Se ve la pantalla pero no suena:** el móvil y el proyector no están en la misma red (o la red de invitados aísla
  los dispositivos). OBSIDIAN avisa si el móvil no está en Wi-Fi.
- **La URL de GitHub Pages da 404:** espera unos minutos tras activarla y comprueba que `index.html` está en la raíz.
