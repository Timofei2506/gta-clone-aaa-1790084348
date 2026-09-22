# GTA CLONE AAA - Open City Reborn
### Professional RAGE-like Architecture | 3D Realistic | Multiplayer

> Бывший Rockstar North dev. Уволился, потому что RAGE - это спагетти из 2006 года. Делаем как надо.

**Репозиторий:** `Timofei2506/gta-clone-aaa-1790084348` (private)

## 🎯 Что это

Полноценный GTA клон с нуля, архитектура как в GTA 5/6, но без говнокода:

- **3D Realistic**: PBR материалы, ACES tonemapping, PCFSoft тени, Day/Night цикл, туман, отражения
- **Multiplayer**: Authoritative server (Node.js + WebSocket), 20 tick, client prediction + interpolation
- **Walking**: Third-person controller как в GTA 5 (GTA-style camera, паркур, бег, прыжки)
- **Physics**: Rapier3D (Rust, самый быстрый), капсула персонажа, коллизии города
- **City**: Процедурный реалистичный город 2x2км, LOD, streaming чанков, дороги, здания с окнами
- **EXE**: Electron + electron-builder, собирается через GitHub Actions

## 🏗️ Архитектура (как в Rockstar)

```
Core/
  Engine.ts          - Главный цикл, как RAGE Game loop
  World.ts           - Мир, стриминг, энтити менеджер
  Streaming.ts       - Чанк-стриминг 250x250м, как в GTA 5
  Time.ts            - Игровое время, день/ночь

Renderer/
  Renderer.ts        - Three.js wrapper, PBR pipeline
  Lighting.ts        - Солнце, луна, уличное освещение, IBL
  PostProcessing.ts  - Bloom, SSAO, Motion Blur (в процессе)

Physics/
  PhysicsWorld.ts    - Rapier world, как Bullet в RAGE
  CharacterController.ts - Kinematic controller

Gameplay/
  Player/
    Player.ts                - Игрок, стейт-машина
    PlayerController.ts      - Ввод -> движение (GTA 5 style)
    AnimationController.ts   - Бленд анимаций
  World/
    CityGenerator.ts         - Процедурный город, как в Watch Dogs
    TrafficSystem.ts         - (TODO) Трафик
  Multiplayer/
    NetworkClient.ts         - Клиент сети
    Interpolation.ts         - Интерполяция других игроков

Input/
  InputManager.ts    - WASD, мышь, геймпад

Server/
  GameServer.ts      - Авторитативный сервер, как GTA Online
```

## 🚀 Запуск

### Клиент (браузер)
```bash
cd client
npm install
npm run dev
# откроется http://localhost:5173
```

### Сервер (мультиплеер)
```bash
cd server
npm install
npm run dev
# ws://localhost:8080
```

### EXE сборка
```bash
# Локально
npm run build:exe

# Через GitHub Actions (автоматом)
git push origin main
# -> Actions -> Build EXE -> скачиваешь .exe
```

## 🎮 Управление

- **WASD** - ходьба
- **Shift** - бег (как в GTA 5)
- **Space** - прыжок
- **Mouse** - камера (GTA-style, за спиной)
- **Right Mouse + Move** - осмотр
- **C** - смена вида (близко/далеко)

Мультиплеер: все игроки видят друг друга, чат в консоли.

## 📦 Стек

- **Client**: TypeScript 5.5, Vite 5, Three.js 0.160 (PBR), Rapier3D-compat, Howler.js (звук)
- **Server**: Node.js 20, ws 8, Rapier для валидации
- **Build**: Electron 30, electron-builder, GitHub Actions
- **No Unity/Godot** - чистый код, как в RAGE, полный контроль.

## 🗺️ Roadmap

- [x] MVP: ходьба, город, мультиплеер
- [ ] Vehicles (Raycast Vehicle, угон)
- [ ] Wanted System (5 звезд, копы AI)
- [ ] Weapons & Combat
- [ ] Missions (JSON скрипты)
- [ ] Voice chat

## 🔒 Лицензия

Private. Не раздавать ассеты Rockstar. Весь код с нуля.

---
*Сделано сеньором, которому надоело фиксить баги в RAGE из 2006 года.*
