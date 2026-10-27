# Receptor Cast de OBSIDIAN (diseño B «Cine» + A sin letra)

- `index.html`, `receiver.css`, `receiver.js`: el receptor (CAF Web Receiver). Esto es lo que se aloja (ver `GUIA_REGISTRO.md`).
- `demo/`: prueba local sin Chromecast (mensajes falsos). Capturas:
  `google-chrome --headless=new --allow-file-access-from-files --window-size=1920,1080 --virtual-time-budget=4000 --screenshot=out.png "file://$PWD/demo/demo.html?state=lyrics"`
  (`state` = `lyrics` | `nolyrics` | `paused` | `cd`, y `&cover=none` para la losa sin portada; v37: `loading` | `late` | `none` | `next` | `latelyrics` | `chunks`. Servir con `python3 -m http.server` desde esta carpeta y abrir `http://localhost:8000/demo/demo.html?state=…`).

Mensajes del móvil por `urn:x-cast:com.obsidian.music` (JSON):
- `{"type":"hello","device":"Galaxy S26 Ultra"}` → chip «Transmitiendo desde …»
- `{"type":"lyrics","key":"…","synced":[[ms,"línea"],…]}` → letra sincronizada (vacía → diseño A)
- `{"type":"cover","key":"…","url":"https://…/1000x1000bb.jpg"}` → portada Apple/Deezer (1000 px)
- `{"type":"cover","key":"…","data":"data:image/jpeg;base64,…","src":"embedded|telegram"}` → portada del archivo o miniatura de Telegram, en línea (≤ 800 px)
- `{"type":"cover","key":"…","none":true}` → el móvil confirma que no hay portada (solo entonces se ven las iniciales)
- `"next":true` en un mensaje de portada → precarga de la siguiente pista (cambio instantáneo)
- `{"type":"chunk","id":"…","i":0,"n":8,"part":"…"}` → mensaje grande troceado (≤ 20 000 caracteres por trozo); se reensambla y se procesa
El receptor pide `{"type":"need","key":"…"}` si carga una pista sin letra o sin portada recibidas.
Portada: se descarga y decodifica fuera de pantalla y entra con fundido; mientras tanto se mantiene la anterior con un brillo
suave (3,5 s), luego un marco vacío; las iniciales solo con `none` (o tras 20 s sin ninguna respuesta del móvil).
La aurora y el resplandor se calculan con la portada real ya cargada.
Metadatos de cada pista: `MediaInfo.metadata` (título, artista, álbum, portada real) + `customData`
(`key`, `explicit`, `label.kind` = HI-RES/CD, `label.detail` = «24 bit · 48 kHz», `bits`, `rate`).

Rendimiento: aurora pintada una vez por canción en un lienzo de 240×135 escalado; resplandor en un lienzo de 64×64;
solo se animan `transform`/`opacity` (deriva de la aurora, respiración del resplandor 4,5 s, barra de progreso, letra).
