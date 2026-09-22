# GTA CLONE AAA - Open City Reborn v0.3
### Professional RAGE-like Architecture | 3D Realistic | Multiplayer | Vehicles

> Бывший Rockstar North dev. Уволился, потому что RAGE - спагетти из 2006. Делаем как надо.

**Repo:** `Timofei2506/gta-clone-aaa-1790084348` (private -> public для Vercel)

## 🎯 v0.3 Что нового

- **FIXED Vercel deploy:** root `vercel.json` с buildCommand, теперь деплоится автоматом
- **FIXED git email:** `tgargach12@gmail.com` вместо фейка
- **FIXED WSS Mixed Content:** теперь `wss://` на https, оффлайн режим без ошибок на vercel.app
- **Graphics AAA:**
  - Procedural PBR textures: concrete, brick, asphalt, windows emissive
  - Sky shader, ACES tonemapping, PCFSoft shadows
  - Buildings с окнами, крышами, AC блоками, уличными фонарями emissive
  - 50 деревьев icosahedron, 50 фонарей с тенями
- **Controls GTA 5:**
  - Smooth accel/decel lerp, inertia 0.2
  - Camera yaw 0.0022 sensitivity, shoulder offset V, C дистанция
  - Pointer lock с crosshair
- **Model Realistic:**
  - Torso + shoulders + head + hair + arms (upper+fore) + legs + shoes
  - Все castShadow, PBR материалы
- **New Features:**
  - **Vehicles:** 15 машин по городу, F чтобы сесть/выйти, WASD рулить
  - **Minimap:** GTA style круглый, здания, игроки, стрелка
  - **No spam logs:** чистый boot, фикс RAPIER.init({})

## 🚀 Deploy на Vercel (фикс)

### Проблема была:
- `timofei@gta.clone` не валидный email -> Vercel не идентифицирует автора
- Нет root `vercel.json` -> Vercel не знает что билдить
- `ws://` на `https://` -> Mixed Content блок

### Решение в v0.3:
1. **Root vercel.json:**
```json
{
  "buildCommand": "cd client && npm install && npm run build",
  "outputDirectory": "client/dist",
  "framework": "vite"
}
```
2. **Git email fixed:** `git config --global user.email "tgargach12@gmail.com"`
3. **NetworkClient:** если `vercel.app` -> offline без ошибок, или используй `VITE_WS_URL`

### Как деплоить:
1. Сделай репо Public (Vercel не всегда видит private без интеграции)
2. Vercel -> Add New Project -> Import `gta-clone-aaa-1790084348`
3. **Framework Preset:** Vite
4. **Root Directory:** `./` (не client, т.к. root vercel.json сам cd client)
5. **Build Command:** оставь дефолт из vercel.json
6. Deploy -> должно собраться

**Для мультиплеера на Vercel:**
- Деплой `server` на Render.com (есть render.yaml)
- В Vercel Client -> Settings -> Env Vars: `VITE_WS_URL=wss://your-server.onrender.com`
- Redeploy

## 🎮 Управление v0.3

- **WASD** - ходьба (с инерцией)
- **Shift** - бег (стамина)
- **Space** - прыжок (one-shot)
- **Mouse** - камера GTA style
- **C** - дистанция камеры (2.2 / 4.5 / 7)
- **V** - смена плеча
- **F** - сесть в машину / выйти
- **Click** - lock мыши

## 🏗️ Архитектура

```
Core/Engine.ts - fixed 60Hz + variable render
World.ts - vehicles, minimap, streaming
Renderer/ - PBR, sky shader, lighting day/night
Physics/ - Rapier, CharacterController kinematic
Gameplay/
  Player/ - realistic model, GTA5 controls
  Vehicle/ - arcade Raycast-like
  World/ - CityGenerator procedural PBR, Minimap
  Multiplayer/ - WSS fixed, offline graceful
```

## 📦 Стек

- Client: TS 5.5, Vite 5, Three.js 0.160, Rapier3D-compat
- Server: Node 20, ws 8, 20 tick
- Deploy: Vercel (client), Render (server), Electron exe

## 🔜 v0.4 Roadmap

- [ ] Post-processing: Bloom, SSAO via EffectComposer
- [ ] Weapons
- [ ] Wanted system
- [ ] Better vehicle physics (real Raycast Vehicle)

---
*Senior Rockstar dev, теперь без вранья в резюме*
