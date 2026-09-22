# ARCHITECTURE - RAGE-like

## Почему не Godot/Unity?

Как бывший Rockstar, скажу: движки общего назначения - говно для GTA. RAGE - это кастомный движок с 20 лет истории, оптимизированный под open world streaming. Unity не умеет стримить мир 10x10км без просадок, Godot тем более.

Поэтому делаем свой мини-RAGE на Three.js + Rapier.

## Поток данных

```
Input -> PlayerController -> CharacterController (Rapier) -> Position
  -> World -> Streaming -> Renderer
  -> NetworkClient -> Server -> Broadcast -> Remote Players (Interpolation)
```

## Физика

- Rapier3D - Rust, SIMD, быстрее Bullet который в RAGE
- KinematicCharacterController - как в GTA 5, не падает, автоподъем на ступеньки
- Гравитация x2 для аркадности

## Рендер

- PBR материалы, ACES Filmic
- Day/Night: солнце по орбите, туман, hemi light
- Тени: PCFSoft, 2048x2048 для солнца
- Город: процедурный, каждый билд разный, но сид фиксирован для мультиплеера

## Мультиплеер

- Authoritative server (как GTA Online)
- 20 tick - достаточно для ходьбы, для машин надо 60
- Client prediction: пока нет, будет
- Interpolation: lerp 10Hz для плавности
- Античит: проверка скорости

## Что дальше

1. Vehicles - Raycast Vehicle, как в GTA 3 (4 raycast колеса)
2. Wanted - state machine, копы спавнятся вне FOV
3. Weapons - hitscan + projectile
4. Missions - JSON скрипты, как в RAGE ScriptHook
