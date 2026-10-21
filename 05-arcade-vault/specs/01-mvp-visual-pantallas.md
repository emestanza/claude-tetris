# SPEC 01 — MVP visual de Arcade Vault (pantallas)

> **Status:** Aprobado
> **Depends on:** ninguna
> **Date:** 2026-10-18
> **Objective:** Implementar en Next.js las cinco pantallas de `references/templates/` (biblioteca, detalle, reproductor, auth y salón de la fama) con datos mock y sin ningún juego real.

---

## Por qué existe esta spec

`app/` sigue siendo el scaffold de `create-next-app`, pero `app/globals.css` y `app/layout.tsx` ya contienen el tema, las fuentes (`next/font`) y los fondos `av-bg` / `av-noise` portados de la plantilla. Falta portar los componentes y las pantallas, que hoy existen como JSX con React UMD, Babel y router por hash.

---

## Alcance

**Dentro:**

- Portar a TypeScript las pantallas de la plantilla: biblioteca, detalle de juego, reproductor, auth (iniciar sesión / crear cuenta) y salón de la fama.
- Portar el componente `Nav` (con menú móvil) y el footer, compartidos por todas las rutas.
- Navegación con rutas del App Router (ver modelo de datos), reemplazando el router por hash de `app.jsx`.
- Datos mock en `lib/data.ts` (`GAMES`, `CATS`, `PLAYERS`, `seededScores`), copiados de `data.jsx`.
- Sesión simulada con `localStorage` (`av_user`) y puntajes guardados en `localStorage` (`av_scores`), expuestos con un provider de cliente.
- Reproductor con la simulación de la plantilla: arena decorativa, puntaje que sube solo, pausa, fin de juego y modal para guardar el puntaje.
- Verificar que `app/globals.css` cubre todas las clases usadas por los componentes portados; agregar solo lo que falte desde `references/templates/styles.css`.
- Metadata por ruta y página 404 con el estilo del tema.

**Fuera de alcance (para futuras specs):**

- Cualquier juego real (Bloque Buster, Caída, etc.).
- Backend, base de datos, autenticación real, OAuth (los botones Google / GitHub son solo visuales).
- Mostrar en el salón de la fama los puntajes guardados en `av_scores` (el salón sigue usando datos sembrados).
- Contador de créditos funcional (se queda fijo en `03`).
- Reescribir los estilos en Tailwind.
- Tests automatizados.

---

## Modelo de datos

```ts
// lib/data.ts
export type Category = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type NeonColor = "cyan" | "magenta" | "green" | "yellow";

export type Game = {
  id: string;        // slug, ej. "bloque-buster"
  title: string;
  short: string;
  long: string;
  cat: Category;
  cover: string;     // clase CSS, ej. "cover-bricks"
  color: NeonColor;
  best: number;
  plays: string;     // ya formateado, ej. "12.4K"
};

export type ScoreRow = { rank: number; name: string; score: number; date: string };

// lib/session.tsx (provider de cliente)
export type User = { name: string }; // máx. 10 caracteres, en mayúsculas
export type SavedScore = { game: string; score: number; name: string; at: number };
```

Rutas:

| Ruta | Pantalla |
| --- | --- |
| `/` | Biblioteca |
| `/juegos/[id]` | Detalle |
| `/juegos/[id]/jugar` | Reproductor |
| `/auth` | Iniciar sesión / crear cuenta |
| `/salon` | Salón de la fama |

Claves de `localStorage`: `av_user` (`User | null`) y `av_scores` (`SavedScore[]`), idénticas a la plantilla.

---

## Plan de implementación

Antes del paso 1, leer `node_modules/next/dist/docs/` (según `AGENTS.md`) sobre `cacheComponents`, `partialPrefetching` y `generateStaticParams`, y usar `/frontend-design` para cualquier ajuste de HTML/diseño.

1. Crear `lib/data.ts` con los tipos y los datos mock. Verificar con `npx tsc --noEmit`.
2. Crear `lib/session.tsx` (`SessionProvider` + hook `useSession`) con `user`, `login`, `signOut` y `saveScore`, leyendo `localStorage` dentro de `useEffect` para evitar errores de hidratación.
3. Crear `components/nav.tsx` y `components/footer.tsx`; montarlos en `app/layout.tsx` junto con el provider y `<main className="av-main">`. Probar: la barra se ve en `/`, el enlace activo se resalta y el menú móvil abre y cierra.
4. Reemplazar `app/page.tsx` por la biblioteca (`components/library.tsx`): filtro por categoría y tarjetas enlazadas a `/juegos/[id]`.
5. Crear `app/juegos/[id]/page.tsx` (detalle) con `generateStaticParams` y `notFound()` para ids inexistentes.
6. Crear `app/auth/page.tsx` con pestañas, formulario simulado, "Jugar como invitado" y redirección a `/` tras el login.
7. Crear `app/salon/page.tsx` con pestañas por juego, podio, tabla y fila "tu mejor marca" cuando hay sesión.
8. Crear `app/juegos/[id]/jugar/page.tsx` con la simulación del reproductor, la pausa y el modal de fin de juego que guarda en `av_scores`.
9. Crear `app/not-found.tsx` y `metadata` por ruta. Comparar visualmente cada pantalla con `references/templates/Arcade Vault.html` abierto en un navegador y completar las clases CSS que falten en `app/globals.css`.

---

## Criterios de aceptación

- [ ] `npx tsc --noEmit` y `npm run lint` terminan sin errores.
- [ ] `npm run build` termina sin errores.
- [ ] Las cinco rutas de la tabla cargan sin errores en la consola del navegador.
- [ ] `/` muestra los 8 juegos de `GAMES` y los chips `TODOS`, `ARCADE`, `PUZZLE`, `SHOOTER`, `VERSUS` filtran la lista.
- [ ] Hacer clic en una tarjeta navega a `/juegos/<id>` y muestra título, descripción larga, categoría, récord y partidas de ese juego.
- [ ] `/juegos/no-existe` muestra la página 404 del tema.
- [ ] El botón de jugar en el detalle navega a `/juegos/<id>/jugar`.
- [ ] En el reproductor el puntaje sube solo, `PAUSA` lo detiene y `REANUDAR` lo retoma, mostrando el overlay `EN PAUSA`.
- [ ] `FIN` abre el modal con la puntuación final; `GUARDAR PUNTUACIÓN` agrega una entrada a `localStorage.av_scores` y muestra `PUNTUACIÓN GUARDADA`.
- [ ] `JUGAR DE NUEVO` reinicia puntaje, vidas y nivel; `SALIR` vuelve al detalle del juego.
- [ ] En `/auth`, enviar el formulario guarda `av_user` con el nombre en mayúsculas (máx. 10 caracteres) y redirige a `/`.
- [ ] La pestaña `CREAR CUENTA` muestra el campo de correo; `INICIAR SESIÓN` lo oculta.
- [ ] `JUGAR COMO INVITADO` redirige a `/` sin guardar `av_user`.
- [ ] Tras recargar la página, el nombre del usuario sigue visible en la barra; hacer clic en él lo cierra y borra `av_user`.
- [ ] `/salon` muestra podio y tabla de 12 filas para el juego seleccionado y cambia al elegir otra pestaña.
- [ ] La fila "TU MEJOR MARCA" aparece en `/salon` solo con sesión iniciada.
- [ ] A 375 px de ancho no hay scroll horizontal y la barra muestra el botón hamburguesa con el panel móvil funcional.
- [ ] La carga inicial no produce advertencias de hidratación en la consola.

---

## Decisiones tomadas y descartadas

- **Sí:** rutas del App Router. URLs reales y compartibles, y aprovecha Next.js.
- **No:** una sola página con router por hash como en `app.jsx`. Va contra el framework y rompe `generateStaticParams` y `notFound()`.
- **Sí:** mantener `app/globals.css` como CSS propio con clases `av-*`. Ya está portado y garantiza fidelidad visual.
- **No:** reescribir en Tailwind. Mucho trabajo y riesgo de divergir del diseño.
- **Sí:** sesión y puntajes en `localStorage` con las claves `av_user` / `av_scores` de la plantilla. Sin backend es lo más simple que persiste.
- **No:** autenticación real. Va en otra spec cuando exista backend.
- **Sí:** reproductor con la simulación de la plantilla. Permite validar el flujo completo de fin de juego y guardado.
- **No:** placeholder estático. Dejaría sin probar el modal y el guardado.
- **Sí:** datos sembrados (`seededScores`) en el salón. Son deterministas y evitan hidratación inconsistente.
- **Sí:** el provider de sesión es un componente de cliente que lee `localStorage` tras montar. Evita desajustes servidor/cliente.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| `cacheComponents: true` exige tratar el acceso a datos dinámicos de forma distinta a lo habitual | Leer la guía en `node_modules/next/dist/docs/` antes del paso 1; las páginas solo usan datos estáticos y estado de cliente. |
| `localStorage` no existe en el servidor o está bloqueado | Leer y escribir solo en `useEffect` o eventos, siempre dentro de `try/catch`. Sin él la app sigue funcionando sin persistir. |
| El nombre del usuario aparece en la barra tras montar y causa un parpadeo | Renderizar el botón "Iniciar Sesión" por defecto y actualizar tras leer `av_user`. |
| Faltan clases CSS en `globals.css` respecto de `styles.css` | El paso 9 compara pantalla por pantalla y completa lo que falte. |

---

## Lo que **no** está en esta spec

- Ningún juego jugable.
- Backend, autenticación real u OAuth.
- Puntajes guardados visibles en el salón de la fama.
- Créditos funcionales.
- Tests automatizados.

Cada uno de esos puntos, si se aborda, va en su propia spec.
