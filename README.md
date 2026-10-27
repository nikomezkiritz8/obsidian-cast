# Receptor Cast de OBSIDIAN (diseño B «Cine» + A sin letra)

- `index.html`, `receiver.css`, `receiver.js`: el receptor (CAF Web Receiver). Esto es lo que se aloja (ver `GUIA_REGISTRO.md`).
- `demo/`: prueba local sin Chromecast (mensajes falsos). Capturas:
  `google-chrome --headless=new --allow-file-access-from-files --window-size=1920,1080 --virtual-time-budget=4000 --screenshot=out.png "file://$PWD/demo/demo.html?state=lyrics"`
  (`state` = `lyrics` | `nolyrics` | `paused` | `cd`, y `&cover=none` para la losa sin portada).

Mensajes del móvil por `urn:x-cast:com.obsidian.music` (JSON):
- `{"type":"hello","device":"Galaxy S26 Ultra"}` → chip «Transmitiendo desde …»
- `{"type":"lyrics","key":"…","synced":[[ms,"línea"],…]}` → letra sincronizada (vacía → diseño A)
- `{"type":"cover","key":"…","data":"data:image/jpeg;base64,…"}` → portada incrustada/miniatura enviada en línea
El receptor pide `{"type":"need","key":"…"}` si carga una pista sin letra recibida.
Metadatos de cada pista: `MediaInfo.metadata` (título, artista, álbum, portada real) + `customData`
(`key`, `explicit`, `label.kind` = HI-RES/CD, `label.detail` = «24 bit · 48 kHz», `bits`, `rate`).

Rendimiento: aurora pintada una vez por canción en un lienzo de 240×135 escalado; resplandor en un lienzo de 64×64;
solo se animan `transform`/`opacity` (deriva de la aurora, respiración del resplandor 4,5 s, barra de progreso, letra).
