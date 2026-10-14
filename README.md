# ELITE FOOTBALL 26 - ROBOT LEAGUE - CENITAL EDITION

Juego de fútbol 3D con robots basados en jugadores reales, cámara cenital estática desplazable y control por celular via QR.

## Estructura de archivos
```
elite-football-project/
├── index.html          # Juego principal 3D (PC)
├── controller.html     # Mando consola para celular
├── css/
│   └── style.css       # Estilos cyberpunk
├── js/
│   └── main.js         # Lógica 3D, robots, cámara cenital, QR
└── README.md
```

## Características implementadas
1. **Vista 3D cenital estática**: Cámara en Y=55, mira al centro, se desplaza lateralmente con A/D y sigue suavemente el balón en Z. No va detrás del jugador.
2. **Robots basados en reales**: MESSI-BOT, CR7-BOT, MBAPPE-BOT, HAALAND-BOT, VINICIUS-BOT con tipos LIGHT/TANK/SPEEDSTER, materiales metálicos y visor emissive.
3. **Animaciones**: Procedurales con sin/cos - correr (piernas alternas), sprint inclinado, patada, pase, tackle.
4. **QR + Mando celular**: 
   - Panel derecho genera ROOM_ID ELITE-XXXX y QR (canvas local + img api.qrserver.com fallback)
   - Link: controller.html?room=ELITE-XXXX
   - controller.html es mando tipo consola: joystick izquierdo 160px + botones A/B/X/Y + L1/R1
   - Comunicación via localStorage elite_ctrl_ROOM cada 50ms + PeerJS opcional para P2P real
5. **Controles**: PC WASD, X pase, C tiro con potencia, SHIFT sprint, Q cambio, E entrada. Celular joystick + botones.

## Cómo usar
### Opción 1 - Local (2 pestañas mismo navegador)
1. Abre index.html en tu PC
2. Copia link del mando o abre "Abrir Mando Aquí"
3. Se abre controller.html en nueva pestaña - mueve joystick, el robot en la primera pestaña se mueve.

### Opción 2 - PC + Celular real (recomendado)
1. Sube toda la carpeta a Netlify: drag & drop en https://app.netlify.com/drop
2. Netlify te da URL tipo https://tu-juego.netlify.app
3. Abre esa URL en tu PC - el QR ahora apunta a https://tu-juego.netlify.app/controller.html?room=ELITE-XXXX
4. Escanea QR con tu celular - tu celular se convierte en mando de consola
5. Juega!

### Despliegue
- **Netlify**: Arrastra carpeta elite-football-project a https://app.netlify.com/drop
- **Vercel**: `npx vercel` dentro de la carpeta
- **GitHub Pages**: Sube a repo y activa Pages

## Prompt profesional usado
Ver conversación para prompt maestro completo.

## Tecnologías
- Three.js 0.160.0 via importmap
- WebGL, Canvas QR, localStorage, Web Audio API
- Sin build, single file deployable


## 🚀 Subir a GitHub Pages (para QR real PC + Celular)

### Opción A - Web (más fácil, sin comandos):
1. Crea repo en https://github.com/new - Nombre: elite-football-26 - Público
2. Haz click en "uploading an existing file" o arrastra TODOS los archivos de esta carpeta a GitHub
3. Commit directo a main
4. Ve a Settings > Pages > Source: GitHub Actions (o Deploy from branch: main / root)
5. Espera 1 minuto - GitHub te da URL: https://TU-USUARIO.github.io/elite-football-26/
6. Abre esa URL en tu PC - el QR ahora genera links con tu dominio real y tu celular se conectará!

### Opción B - Con Git (terminal):
```bash
git init
git add .
git commit -m "Elite Football 26 - Robot League Cenital"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/elite-football-26.git
git push -u origin main
```
Luego activa Pages en Settings > Pages.

### Cómo funciona el QR en GitHub Pages:
- Antes (file://): QR no es escaneable entre dispositivos porque es archivo local
- Después (https://...github.io/...): QR codifica https://TU-USUARIO.github.io/elite-football-26/controller.html?room=ELITE-XXXX
- Tu celular escanea y abre el mando consola real conectado a tu PC por localStorage + P2P
