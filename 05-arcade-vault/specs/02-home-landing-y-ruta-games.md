# SPEC 02 — Home landing y ruta `/games`

> **Status:** Aprobado
> **Depends on:** SPEC 01 (`01-mvp-visual-pantallas.md`)
> **Date:** 2026-10-20
> **Objective:** Mover la biblioteca de juegos de `/` a una nueva ruta `/games` (junto con detalle y reproductor) y reemplazar `/` por la landing page de `references/templates/home-about/home.jsx`.

---

## Por qué existe esta spec

La SPEC 01 dejó la biblioteca como página principal (`/`). La plantilla `references/templates/home-about/` añade una landing (`home.jsx`) con hero, características, vista previa de juegos, estadísticas, actividad en vivo, precios y CTA final. Para que la landing sea la entrada al sitio, la biblioteca debe pasar a su propia ruta. Los estilos de la landing (`.home-*`, `.feature-*`, `.mini-*`, `.activity-*`, `.pricing-*`, etc.) están en `references/templates/home-about/styles.css` y todavía no existen en `app/globals.css`.

---

## Alcance

**Dentro:**

- Nueva ruta `/games` con la biblioteca actual (`components/library.tsx`, sin cambios de comportamiento).
- Mover el detalle y el reproductor de `/juegos/[id]` y `/juegos/[id]/jugar` a `/games/[id]` y `/games/[id]/jugar`. Se elimina `app/juegos/`. Sin redirects desde `/juegos`.
- Landing en `/` portada a TypeScript desde `home.jsx`, con estas secciones: hero con siluetas flotantes, "¿Por qué Arcade Vault?", "Juegos disponibles ahora" (`MiniCard` con los 6 primeros de `GAMES`), estadísticas, "Actividad en vivo" (últimas puntuaciones + top jugadores), precios con FAQ y CTA final.
- Animación de revelado al hacer scroll (`useReveal` con `IntersectionObserver`, clases `.reveal` / `.in`) como hook de cliente.
- Nav (escritorio y panel móvil): añadir "Inicio" (`/`); "Biblioteca" pasa a apuntar a `/games`; el logo apunta a `/`. Resaltado de enlace activo ajustado a las nuevas rutas.
- Actualizar todos los enlaces internos que apuntan a `/juegos/...` o a `/` como "biblioteca" (ver tabla de destinos).
- Portar a `app/globals.css` los estilos que falten de `home-about/styles.css` (secciones `HOME PAGE`, `ACTIVITY` y `PRICING`, más cualquier clase usada por la landing que no exista).
- Datos mock de la landing en `lib/data.ts`.
- Metadata de `/` y `/games`.

**Fuera de alcance (para futuras specs):**

- Página "Acerca de" (`about.jsx`), formulario de contacto y su enlace de nav.
- Conectar "Actividad en vivo" o "Top jugadores" con `seededScores` o `av_scores`: son listas fijas.
- Redirects desde `/juegos/*` a `/games/*`.
- Contador de créditos funcional, backend, autenticación real, juegos reales.
- Reescribir estilos en Tailwind.
- Tests automatizados.

---

## Modelo de datos

Se añaden dos listas estáticas en `lib/data.ts`, extraídas de los literales de `home.jsx`:

```ts
// lib/data.ts
export type LatestScore = {
  player: string;    // ej. "NEONFOX"
  game: string;      // nombre mostrado, ej. "Caída"
  score: number;
  ago: string;       // ya formateado, ej. "hace 2 min"
  color: NeonColor;
};

export type TopPlayer = { rank: number; player: string; score: number };

export const LATEST_SCORES: LatestScore[]; // 7 filas, mismo contenido que home.jsx
export const TOP_TODAY: TopPlayer[];       // 5 filas, mismo contenido que home.jsx
```

Las características (4 tarjetas), las estadísticas (3 bloques) y las FAQ (3 ítems) quedan como constantes locales en los componentes de la landing, porque son texto de marketing sin reutilización.

Rutas resultantes:

| Ruta | Pantalla |
| --- | --- |
| `/` | Landing (nueva) |
| `/games` | Biblioteca (antes `/`) |
| `/games/[id]` | Detalle (antes `/juegos/[id]`) |
| `/games/[id]/jugar` | Reproductor (antes `/juegos/[id]/jugar`) |
| `/auth` | Iniciar sesión / crear cuenta (sin cambios) |
| `/salon` | Salón de la fama (sin cambios) |

Destinos de enlaces:

| Origen | Destino |
| --- | --- |
| Landing: `EXPLORAR JUEGOS`, `VER TODOS LOS JUEGOS →`, `INSERTAR MONEDA →` | `/games` |
| Landing: `CREAR CUENTA`, `EMPEZAR GRATIS →` | `/auth` |
| Landing: `VER SALÓN →` | `/salon` |
| Landing: `MiniCard` | `/games/[id]` |
| Logo de la nav, `VOLVER AL VAULT` (404, detalle, reproductor), `VOLVER A LA BIBLIOTECA` del salón, redirect tras login / invitado | `/` (excepto lo indicado abajo) |
| Nav "Biblioteca", `SALIR` del reproductor (→ detalle) | `/games`, `/games/[id]` |

> Nota: `VOLVER A LA BIBLIOTECA` del salón de la fama debe apuntar a `/games` (el texto dice biblioteca). Los `VOLVER AL VAULT` sí van a `/`.

---

## Plan de implementación

Antes del paso 1, leer en `node_modules/next/dist/docs/` lo relativo a `cacheComponents`, `partialPrefetching` y componentes de cliente con `IntersectionObserver`, y usar `/frontend-design` para cualquier ajuste de HTML/diseño.

1. Mover `app/juegos/[id]/` a `app/games/[id]/` (detalle y `jugar`) y crear `app/games/page.tsx` con `<Library />`. Actualizar los enlaces `/juegos/...` en `components/library.tsx`, `components/game-player.tsx` y `app/games/[id]/page.tsx`. Verificar con `npx tsc --noEmit`; `/` sigue mostrando temporalmente la biblioteca.
2. Actualizar `components/nav.tsx`: añadir "Inicio" en barra y panel móvil, "Biblioteca" → `/games`, `isLibrary` para `/games*`, `isHome` para `/` exacto. Probar el resaltado en `/`, `/games`, `/games/<id>`, `/salon` y `/auth`.
3. Añadir `LatestScore`, `TopPlayer`, `LATEST_SCORES` y `TOP_TODAY` a `lib/data.ts`.
4. Portar a `app/globals.css` los estilos de landing faltantes desde `references/templates/home-about/styles.css` (`HOME PAGE`, `ACTIVITY`, `PRICING`), sin duplicar reglas ya presentes. Verificar que `.reveal`, `.btn.xl`, `.btn.pulse` y `.neon-*` existan.
5. Crear `components/home/` con `floating-silhouettes.tsx`, `feature-icon.tsx`, `mini-card.tsx`, `use-reveal.ts` y `home-page.tsx` (secciones de `home.jsx`). Los botones de navegación se convierten en `<Link>`; `MiniCard` enlaza a `/games/[id]`. `useReveal` vive en un componente de cliente y limpia el observer al desmontar.
6. Reemplazar `app/page.tsx` por la landing y definir `metadata` de `/` y `/games` (`app/games/page.tsx`).
7. Ajustar los destinos restantes de la tabla (404, salón, auth-form, detalle, reproductor) y comparar visualmente `/` con la landing de `references/templates/home-about/arcade-vault-standalone.html` en escritorio y a 375 px; completar el CSS que falte.

---

## Criterios de aceptación

- [ ] `npx tsc --noEmit` y `npm run lint` terminan sin errores.
- [ ] `npm run build` termina sin errores.
- [ ] `/` muestra la landing con las 7 secciones: hero, por qué, juegos disponibles, estadísticas, actividad en vivo, precios y CTA final.
- [ ] `/games` muestra los 8 juegos de `GAMES` y los chips `TODOS`, `ARCADE`, `PUZZLE`, `SHOOTER`, `VERSUS` filtran la lista.
- [ ] `/juegos` y `/juegos/<id>` devuelven la página 404 del tema (no existen redirects).
- [ ] `/games/<id>` muestra el detalle y `/games/<id>/jugar` el reproductor, con el mismo comportamiento que en la SPEC 01; `/games/no-existe` muestra el 404.
- [ ] La sección "Juegos disponibles ahora" muestra exactamente los 6 primeros juegos de `GAMES`; hacer clic en una tarjeta navega a `/games/<id>`.
- [ ] `EXPLORAR JUEGOS`, `VER TODOS LOS JUEGOS →` e `INSERTAR MONEDA →` navegan a `/games`.
- [ ] `CREAR CUENTA` y `EMPEZAR GRATIS →` navegan a `/auth`; `VER SALÓN →` navega a `/salon`.
- [ ] La sección "Actividad en vivo" muestra 7 puntuaciones recientes y un top de 5 jugadores con los datos de `LATEST_SCORES` y `TOP_TODAY`.
- [ ] Las secciones con clase `.reveal` empiezan ocultas y reciben la clase `in` al entrar en pantalla; con `prefers-reduced-motion` el contenido sigue visible.
- [ ] La nav muestra "Inicio", "Biblioteca" y "Salón de la Fama" (barra y panel móvil); solo el enlace de la ruta actual está resaltado y el logo lleva a `/`.
- [ ] Tras iniciar sesión o pulsar `JUGAR COMO INVITADO` se redirige a `/`.
- [ ] `VOLVER A LA BIBLIOTECA` en `/salon` navega a `/games`; `VOLVER AL VAULT` navega a `/`.
- [ ] No quedan referencias a `/juegos` en `app/`, `components/` ni `lib/` (`grep -rn "juegos" app components lib` solo devuelve textos visibles, no rutas).
- [ ] A 375 px de ancho `/` y `/games` no tienen scroll horizontal.
- [ ] La carga inicial de `/` no produce advertencias de hidratación ni errores en la consola.

---

## Decisiones tomadas y descartadas

- **Sí:** mover detalle y reproductor a `/games/[id]`. URLs coherentes bajo un mismo prefijo.
- **No:** dejar `/juegos/[id]` y mezclar español e inglés en las URLs.
- **No:** redirects desde `/juegos`. El sitio no está publicado ni tiene enlaces externos; añadirlos sería ruido.
- **Sí:** solo añadir "Inicio" a la nav. La nav de `home-about` también trae "Acerca de", que se difiere con `about.jsx`.
- **No:** portar `about.jsx` ahora. Es otra pantalla con formulario y estados propios; va en su propia spec.
- **Sí:** listas de actividad y top en `lib/data.ts` como mock estático. Es determinista, evita desajustes de hidratación y no mezcla la landing con `av_scores`.
- **No:** derivar la actividad de `seededScores`. Los nombres de juego y tiempos relativos de la plantilla no salen de esa función.
- **Sí:** `VOLVER AL VAULT` y el redirect tras login van a `/` (la landing es la "puerta" del sitio).
- **Sí:** seguir con CSS propio `av-*` / clases de plantilla en `globals.css`, como en la SPEC 01.
- **Sí:** `useReveal` como hook de cliente con `IntersectionObserver`; la landing en sí puede seguir siendo un componente de servidor que compone partes de cliente.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| `.reveal` oculta las secciones y, si el observer falla o no hay JS, el contenido queda invisible | Ocultar solo bajo una clase que añade el hook al montar, o mostrar todo bajo `prefers-reduced-motion`; probar con JS deshabilitado. |
| `cacheComponents: true` cambia cómo se trata lo dinámico al mover rutas y usar `generateStaticParams` en `/games/[id]` | Leer la guía antes del paso 1; el contenido es estático y el estado vive en componentes de cliente. |
| Mover carpetas rompe enlaces olvidados | Criterio de aceptación con `grep` y recorrido manual de todos los destinos de la tabla. |
| Conflictos al portar CSS (reglas duplicadas o que pisan estilos de la SPEC 01) | Portar solo secciones nuevas y comparar visualmente `/games`, `/auth` y `/salon` antes y después. |
| `references/templates/home-about/` aún está sin versionar en git | Confirmar que la carpeta se commitea antes o junto con esta spec; la implementación depende de ella como fuente. |

---

## Lo que **no** está en esta spec

- Página "Acerca de" y formulario de contacto.
- Redirects de `/juegos/*`.
- Actividad y rankings de la landing conectados a datos reales o a `av_scores`.
- Créditos funcionales, backend, autenticación real, juegos jugables.
- Tests automatizados.

Cada uno de esos puntos, si se aborda, va en su propia spec.
