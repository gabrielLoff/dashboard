# Dashboard Layout Mockup

## Desktop Layout (1024px+)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Dashboard                                              [🌙]                │
│  Your daily overview                                                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────┐    ┌─────────────────────────────────────┐  │
│  │ Weather              [↻]    │    │     📰 News   🎮 Games   📺 Shows   │  │
│  ├─────────────────────────────┤    │         ✅ Habits                    │
│  │                             │    ├─────────────────────────────────────┤  │
│  │      22°C                   │    │ News                       [↻]     │  │
│  │      Partly cloudy          │    ├─────────────────────────────────────┤  │
│  │                             │    │                                     │  │
│  │                             │    │ • Breaking: Tech stocks rally...    │  │
│  │                             │    │                                     │  │
│  │                             │    │ • New framework released...         │  │
│  │                             │    │                                     │  │
│  │                             │    │ • Climate summit results...         │  │
│  │                             │    │                                     │  │
│  │                             │    │                                     │  │
│  │                             │    │                                     │  │
│  └─────────────────────────────┘    │                                     │  │
│                                      │                                     │  │
│  ┌─────────────────────────────┐    │                                     │  │
│  │ Agenda               [↻]    │    │                                     │  │
│  ├─────────────────────────────┤    │                                     │  │
│  │                             │    │                                     │  │
│  │ • Team standup - 10:00      │    │                                     │  │
│  │                             │    │                                     │  │
│  │ • Lunch with client - 12:30 │    │                                     │  │
│  │                             │    │                                     │  │
│  │ • Code review - 15:00       │    │                                     │  │
│  │                             │    │                                     │  │
│  │                             │    │                                     │  │
│  │                             │    │                                     │  │
│  │                             │    │                                     │  │
│  │                             │    │                                     │  │
│  │                             │    │                                     │  │
│  │                             │    │                                     │  │
│  └─────────────────────────────┘    └─────────────────────────────────────┘  │
│                                                                              │
│  ◄───── 40% ─────►              ◄───────────── 60% ─────────────►           │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Mobile Layout (<640px)

```
┌──────────────────────────────┐
│  Dashboard           [🌙]    │
│  Your daily overview         │
├──────────────────────────────┤
│                              │
│  ┌──────────────────────────┐│
│  │ Weather           [↻]    ││
│  ├──────────────────────────┤│
│  │      22°C                ││
│  │      Partly cloudy       ││
│  └──────────────────────────┘│
│                              │
│  ┌──────────────────────────┐│
│  │ Agenda            [↻]    ││
│  ├──────────────────────────┤│
│  │ • Team standup - 10:00   ││
│  │ • Lunch - 12:30          ││
│  │ • Code review - 15:00    ││
│  └──────────────────────────┘│
│                              │
│    📰 News  🎮 Games         │
│    📺 Shows  ✅ Habits       │
│                              │
│  ┌──────────────────────────┐│
│  │ News               [↻]   ││
│  ├──────────────────────────┤│
│  │ • Breaking: Tech stocks..││
│  │ • New framework...       ││
│  │ • Climate summit...      ││
│  └──────────────────────────┘│
│                              │
└──────────────────────────────┘
```

## Widget Zones

| Zone | Widgets | Behavior |
|------|---------|----------|
| `left` | Weather, Agenda | Fixed position in left column (desktop), stacked on mobile |
| `carousel` | News, Games, Shows, Habits | In right column carousel (desktop), below left widgets on mobile |

## Interactive Elements

- **Carousel tabs**: Click to switch between News, Games, Shows, Habits
- **Swipe/scroll**: Touch swipe or mouse wheel to navigate carousel
- **Refresh button**: Click to refresh widget data, Alt+click to clear cache
- **Theme toggle**: Switch between light and dark mode

## Visual Mockup

For an interactive HTML mockup, open `dashboard-mockup.html` in a browser.
