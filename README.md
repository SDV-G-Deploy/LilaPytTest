# Kislota Bloom Engine v0

Template-engine v0 для **красивых мобильных фоновых анимаций** в чистом фронте:

- **Plain HTML/CSS/JS only**
- **No dependencies**
- **GitHub Pages compatible**
- **Mobile-first performance discipline** (adaptive quality, fps cap, dpr clamp)

---

## Что это теперь

Проект больше не «одна жёстко прошитая сцена», а **мини-движок сцен**:

- единый rendering каркас;
- scene presets через config objects;
- переключение сцен **без перезагрузки**:
  - через `?scene=lily`
  - через встроенный selector в UI.

---

## Текущие сцены (presets)

1. **Lily** (`scene=lily`)  
   Красная spider lily в духе исходника.

2. **Acid Daisy** (`scene=acid-daisy`)  
   Кислотный цветок с neon green / magenta палитрой, более плотным венчиком.

3. **Neon Pollen** (`scene=neon-pollen`)  
   Электрический cyan-violet bloom, более воздушный слой лепестков/пыльцы.

---

## Архитектура engine-style

В `app.js` есть ключевой объект:

- `SCENES` — словарь пресетов.

Каждая сцена описывает:

- `title`, `subtitle`, `label`;
- `bloom` (геометрия: радиус, слои, лепестки, стебель);
- `motion` (пульсация, sway, wiggle);
- `palette` (фон, haze, glow, core, petals, filaments).

Общий каркас переиспользуется для всех сцен:

- canvas lifecycle (`resize`, render loop);
- sprite pre-render (`glow`, `petal`, `core`, `tip`);
- draw stages (`background`, `stem`, `petals`, `filaments`, `core`);
- adaptive perf loop (quality index + render scale).

Смена сцены делает только:

1. переключение active config;
2. пересборку sprite-пакета под палитру/форму;
3. пересчёт размеров/фонового слоя;
4. обновление URL и UI.

Без reload, без пересоздания всего приложения.

---

## Performance discipline (сохранена)

- **FPS cap**: mobile ~30, desktop ~45.
- **DPR clamp**: ограничение внутреннего DPR для адекватного fill-rate.
- **Adaptive quality**:
  - если кадр тяжёлый → уменьшаем density (filaments), затем render scale;
  - если снова быстро → постепенно возвращаем качество.
- Используется **sprite reuse**, без тяжёлых per-frame эффектов типа `shadowBlur` на каждый элемент.

---

## Быстрый старт

Открой `index.html` в браузере.

Примеры:

- `index.html?scene=lily`
- `index.html?scene=acid-daisy`
- `index.html?scene=neon-pollen`

---

## Deploy на GitHub Pages

Положи файлы в root репозитория (или `/docs`) и включи Pages в настройках репо.

---

## Как добавить новую сцену

1. Открой `app.js`.
2. Добавь новый объект в `SCENES`, например `moon-orchid`.
3. Заполни:
   - `id`, `label`, `title`, `subtitle`
   - `bloom`
   - `motion`
   - `palette`
4. Готово: сцена автоматически попадёт в selector и будет доступна как `?scene=moon-orchid`.

Мини-шаблон:

```js
SCENES['moon-orchid'] = {
  id: 'moon-orchid',
  label: 'Moon Orchid',
  title: 'Moon Orchid',
  subtitle: 'silver haze • deep night',
  bloom: {
    layers: 2,
    petalsPerLayer: 16,
    radiusFactor: 0.16,
    stemHeightFactor: 0.34,
    petalLength: 170,
    petalThickness: 40,
    spread: 1.25
  },
  motion: {
    pulse: 0.03,
    sway: 0.09,
    filamentWiggle: 0.24
  },
  palette: {
    body: ['#05060a', '#0a0d15', '#040509'],
    vignette: ['rgba(90,95,130,0.14)', 'rgba(26,20,38,0.10)', 'rgba(0,0,0,0.64)'],
    haze: ['rgba(170,190,255,ALPHA)', 'rgba(120,90,220,ALPHA2)', 'rgba(0,0,0,0)'],
    stem: ['rgba(120,150,170,0.58)', 'rgba(34,45,62,0.82)'],
    petalStops: ['rgba(230,236,255,0.9)', 'rgba(190,206,255,0.9)', 'rgba(145,120,230,0.9)', 'rgba(70,56,130,0.92)'],
    petalStroke: 'rgba(230,236,255,0.3)',
    glowStops: ['rgba(180,210,255,0.3)', 'rgba(136,160,255,0.2)', 'rgba(86,70,180,0.1)'],
    coreStops: ['rgba(245,248,255,0.94)', 'rgba(190,210,255,0.82)', 'rgba(120,98,220,0.55)'],
    filamentA: 'rgba(214,228,255,0.58)',
    filamentB: 'rgba(156,134,255,0.44)',
    tipStops: ['rgba(245,249,255,0.96)', 'rgba(215,226,255,0.82)', 'rgba(160,138,255,0.22)']
  }
};
```
