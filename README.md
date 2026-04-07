<div align="center">

# ECIBET — Casino Online

### Plataforma de casino en línea moderna, responsiva y construida con tecnologías de vanguardia.

<br/>

[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React Router](https://img.shields.io/badge/React_Router-6.21-CA4245?style=for-the-badge&logo=react-router&logoColor=white)](https://reactrouter.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-10.16-0055FF?style=for-the-badge&logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![CSS3](https://img.shields.io/badge/CSS3-Variables_&_Grid-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/es/docs/Web/CSS)

<br/>

![Estado](https://img.shields.io/badge/Estado-En_Desarrollo-yellow?style=for-the-badge)
![Versión](https://img.shields.io/badge/Versión-1.0.0-gold?style=for-the-badge)
![Licencia](https://img.shields.io/badge/Licencia-Privada-red?style=for-the-badge)

</div>

---

## Tabla de Contenidos

1. [Descripción General](#-descripción-general)
2. [Tecnologías Utilizadas](#-tecnologías-utilizadas)
3. [Estructura del Proyecto](#-estructura-del-proyecto)
4. [Páginas y Funcionalidades](#-páginas-y-funcionalidades)
5. [Sistema de Autenticación](#-sistema-de-autenticación)
6. [Componentes](#-componentes)
7. [Tipos TypeScript](#-tipos-typescript)
8. [Sistema de Diseño](#-sistema-de-diseño)
9. [Instalación y Uso](#-instalación-y-uso)
10. [Scripts Disponibles](#-scripts-disponibles)
11. [Mejoras Futuras](#-mejoras-futuras)

---

## Descripción General

**ECIBET** es una plataforma de casino en línea desarrollada como proyecto académico. El frontend está construido con React y TypeScript, ofreciendo una experiencia de usuario moderna, fluida y completamente responsiva.

La aplicación cuenta con:

- **4 juegos de casino** (en desarrollo): Ruleta Clásica, Poker Texas Hold'em, Ruleta Rusa y Juego Retro
- **Apuestas deportivas** con boleto de apuestas interactivo en tiempo real
- **Sistema de recarga de crédito** con múltiples métodos de pago
- **Autenticación completa** con login, registro y sesión persistente
- **Diseño responsivo** adaptado a móvil, tablet y escritorio

---

## Tecnologías Utilizadas

| Tecnología | Versión | Uso |
|---|---|---|
| [![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)](https://react.dev/) | 18.2 | Librería principal de UI con hooks |
| [![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/) | 5.2 | Tipado estático para mayor robustez |
| [![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/) | 5.0 | Bundler y servidor de desarrollo ultrarrápido |
| [![React Router](https://img.shields.io/badge/React_Router-CA4245?logo=react-router&logoColor=white)](https://reactrouter.com/) | 6.21 | Enrutamiento del lado del cliente (SPA) |
| [![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?logo=framer&logoColor=white)](https://www.framer.com/motion/) | 10.16 | Animaciones declarativas y transiciones |
| [![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/es/docs/Web/CSS) | — | Estilos con variables CSS, Grid y Flexbox |

---

## Estructura del Proyecto

```
Front_Service/
│
├── 📂 img/                          # Imágenes de los juegos
│   ├── Poker.jpg
│   ├── Roulette.jpg
│   └── Russian Roulette.jpg
│
├── 📂 src/
│   │
│   ├── 📂 components/               # Componentes reutilizables
│   │   ├── 📂 GameCard/             # Tarjeta de juego
│   │   │   ├── GameCard.tsx
│   │   │   └── GameCard.css
│   │   ├── 📂 Layout/               # Estructura base de la app
│   │   │   ├── Layout.tsx
│   │   │   └── Layout.css
│   │   ├── 📂 Navbar/               # Barra de navegación
│   │   │   ├── Navbar.tsx
│   │   │   └── Navbar.css
│   │   ├── 📂 Footer/               # Pie de página
│   │   │   ├── Footer.tsx
│   │   │   └── Footer.css
│   │   └── ProtectedRoute.tsx       # Guard de rutas privadas
│   │
│   ├── 📂 context/
│   │   └── AuthContext.tsx          # Contexto global de autenticación
│   │
│   ├── 📂 pages/                    # Páginas de la aplicación
│   │   ├── 📂 Auth/                 # Login y Registro
│   │   │   ├── Auth.tsx
│   │   │   └── Auth.css
│   │   ├── 📂 Home/                 # Página de inicio
│   │   │   ├── Home.tsx
│   │   │   └── Home.css
│   │   ├── 📂 Games/                # Catálogo de juegos
│   │   │   ├── Games.tsx
│   │   │   └── Games.css
│   │   ├── 📂 Sports/               # Apuestas deportivas
│   │   │   ├── Sports.tsx
│   │   │   └── Sports.css
│   │   └── 📂 Recharge/             # Recarga de crédito
│   │       ├── Recharge.tsx
│   │       └── Recharge.css
│   │
│   ├── 📂 types/
│   │   └── index.ts                 # Interfaces TypeScript globales
│   │
│   ├── App.tsx                      # Componente raíz con rutas
│   ├── App.css                      # Estilos del componente raíz
│   ├── main.tsx                     # Punto de entrada de la aplicación
│   └── index.css                    # Estilos globales y variables CSS
│
├── index.html                       # HTML base
├── package.json                     # Dependencias y scripts
├── tsconfig.json                    # Configuración de TypeScript
├── tsconfig.node.json               # Configuración de TypeScript para Vite
├── vite.config.ts                   # Configuración de Vite
├── .gitignore
└── README.md
```

---

## Páginas y Funcionalidades

### Página de Inicio — `/`

La página principal de la plataforma. Está compuesta por tres secciones:

**1. Hero Section**
- Título animado con efecto de entrada desde arriba
- Subtítulo con efecto de entrada desde abajo
- Dos botones de llamada a la acción: *Explorar Juegos* y *Recargar Saldo*
- Efecto de pulso radial en el fondo

**2. Tarjetas de Características**
- Tres tarjetas animadas que se revelan al hacer scroll (`whileInView`)
- Destacan: variedad de juegos, seguridad y bonos
- Efecto hover con borde dorado y elevación

**3. Juegos Destacados**
- Grid con los 3 juegos principales usando el componente `GameCard`
- Cada tarjeta muestra imagen, nombre, descripción, apuesta mínima y jugadores máximos

---

### Catálogo de Juegos — `/games`

Lista completa de los 4 juegos disponibles en la plataforma:

| Juego | Apuesta Mín. | Jugadores | Estado |
|---|---|---|---|
| Ruleta Clásica | $10 | 8 | Próximamente |
| Poker Texas Hold'em | $50 | 6 | Próximamente |
| Ruleta Rusa | $100 | 4 | Próximamente |
| Juego Retro | $25 | 1 | Próximamente |

Al final de la página hay un banner promocional que enlaza directamente a la sección de **Apuestas Deportivas**.

---

### Apuestas Deportivas — `/sports`

Página completa de apuestas con dos columnas:

**Columna izquierda — Lista de partidos:**
- Filtros por deporte: Todos, Fútbol, Baloncesto, Tenis, Béisbol
- Tarjetas de partido con: liga, equipos, fecha, hora y cuotas
- Botones de cuota interactivos (local / empate / visitante)
- Animación escalonada al cargar los partidos

**Columna derecha — Boleto de apuestas (sticky):**
- Se actualiza en tiempo real al seleccionar cuotas
- Muestra cada apuesta con su cuota individual
- Calcula automáticamente la **cuota combinada** (parlay)
- Input para ingresar el monto a apostar
- Botón para realizar la apuesta
- Botón para limpiar el boleto completo

> En móvil, el boleto se muestra debajo de los partidos.

---

### Recarga de Crédito — `/recharge`

Formulario de recarga con los siguientes elementos:

**Métodos de pago disponibles:**

| Método | Mín. | Máx. |
|---|---|---|
| Tarjeta de Crédito/Débito | $10 | $10,000 |
| PayPal | $10 | $5,000 |
| Criptomonedas | $50 | $50,000 |
| Transferencia Bancaria | $100 | $20,000 |

**Funcionalidades:**
- Selector visual de método de pago con estado activo
- Input numérico para monto personalizado
- Botones de montos sugeridos: $50, $100, $250, $500, $1,000, $2,500
- Banner informativo con límites del método seleccionado
- Botón de envío deshabilitado hasta que se completen los campos requeridos

---

### Autenticación — `/auth`

Página dual que alterna entre **Login** y **Registro** sin cambiar de ruta.

**Login:**
- Campos: correo electrónico y contraseña
- Validación de campos vacíos
- Mensaje de error en credenciales inválidas

**Registro:**
- Campos: nombre de usuario, correo electrónico, contraseña y confirmación
- Validaciones: campos requeridos, contraseña mínimo 6 caracteres, coincidencia de contraseñas
- Indicador visual de requisitos de contraseña

---

## Sistema de Autenticación

La autenticación está implementada con **React Context API** y **localStorage** para persistencia de sesión.

### Flujo de autenticación

```
Usuario accede a ruta protegida
        │
        ▼
  ProtectedRoute verifica isAuthenticated
        │
   ┌────┴────┐
   │         │
  SÍ        NO
   │         │
   ▼         ▼
Renderiza  Redirige a /auth
 la página
```

### AuthContext — Valores expuestos

| Valor | Tipo | Descripción |
|---|---|---|
| `user` | `User \| null` | Datos del usuario autenticado |
| `isAuthenticated` | `boolean` | `true` si hay sesión activa |
| `isLoading` | `boolean` | `true` mientras se verifica localStorage |
| `login()` | `async function` | Inicia sesión con email y contraseña |
| `register()` | `async function` | Registra un nuevo usuario |
| `logout()` | `function` | Cierra sesión y limpia localStorage |

### Persistencia de sesión

Al iniciar la app, `AuthContext` lee `localStorage` para restaurar la sesión automáticamente. Al hacer logout, se elimina la entrada del storage.

---

## Componentes

### `<Layout />`
Envuelve todas las páginas. Renderiza `<Navbar />` en la parte superior, el contenido de la página en `<main>` y `<Footer />` al final. El `main` tiene un `margin-top` para compensar el navbar fijo.

---

### `<Navbar />`
Barra de navegación fija con efecto de desenfoque (`backdrop-filter: blur`).

| Elemento | Descripción |
|---|---|
| Logo ECIBET | Enlace a la página de inicio |
| Links de navegación | Inicio, Juegos, Apuestas, Recargar |
| Balance del usuario | Muestra el saldo actual en formato `$X,XXX` |
| Dropdown de usuario | Muestra nombre, email y botón de cerrar sesión |
| Menú hamburguesa | Visible solo en móvil, colapsa los links |

> El navbar se oculta completamente en la ruta `/auth`.

---

### `<Footer />`
Pie de página con cuatro columnas en grid responsivo:
- **ECIBET**: descripción de la marca
- **Juegos**: enlaces a cada juego y apuestas deportivas
- **Soporte**: ayuda, términos y privacidad
- **Contacto**: email, teléfono y disponibilidad

---

### `<GameCard />`
Tarjeta reutilizable para mostrar un juego del catálogo.

**Props:**

| Prop | Tipo | Requerido | Descripción |
|---|---|---|---|
| `game` | `Game` | ✅ | Objeto con todos los datos del juego |
| `onClick` | `() => void` | ❌ | Callback al hacer click (solo si está disponible) |

**Comportamiento:**
- Si `game.image` existe, muestra la imagen con `object-fit: cover`
- Si no hay imagen, muestra `game.icon` como texto
- Si `game.available` es `false`, muestra el badge *"Próximamente"* y deshabilita el click
- Animación de entrada con Framer Motion (`opacity: 0 → 1`, `y: 20 → 0`)

---

### `<ProtectedRoute />`
Guard de rutas que verifica la autenticación antes de renderizar una página.

```tsx
// Uso en App.tsx
<Route path="/" element={
  <ProtectedRoute>
    <Home />
  </ProtectedRoute>
} />
```

---

## Tipos TypeScript

Definidos en `src/types/index.ts`:

```typescript
// Usuario autenticado
interface User {
  id: string;
  username: string;
  email: string;
  balance: number;       // Saldo en USD
}

// Juego del catálogo
interface Game {
  id: string;
  name: string;
  description: string;
  minBet: number;        // Apuesta mínima en USD
  maxPlayers: number;    // Jugadores simultáneos máximos
  icon?: string;         // Texto alternativo si no hay imagen
  image?: string;        // Ruta a la imagen del juego
  gradient: string;      // Clave del gradiente CSS del encabezado
  available: boolean;    // Si el juego está activo o no
}

// Método de recarga de crédito
interface RechargeMethod {
  id: string;
  name: string;
  icon: string;          // Etiqueta de texto del método
  minAmount: number;     // Monto mínimo en USD
  maxAmount: number;     // Monto máximo en USD
}
```

---

## Sistema de Diseño

### Paleta de Colores

| Variable CSS | Valor | Uso |
|---|---|---|
| `--primary` | `#FFD700` | Dorado — color principal, bordes activos, títulos |
| `--secondary` | `#1a1a2e` | Azul oscuro — fondo de tarjetas y navbar |
| `--accent` | `#e94560` | Rojo — badges, errores, botón de logout |
| `--dark` | `#0f0f1e` | Azul muy oscuro — fondo general de la app |
| `--light` | `#ffffff` | Blanco — texto principal |

### Gradientes

| Variable CSS | Colores | Uso |
|---|---|---|
| `--gradient-gold` | `#FFD700 → #FFA500` | Botones primarios, logo, títulos |
| `--gradient-1` | `#667eea → #764ba2` | Encabezado de Ruleta Clásica |
| `--gradient-2` | `#f093fb → #f5576c` | Encabezado de Poker |
| `--gradient-3` | `#4facfe → #00f2fe` | Encabezado de Ruleta Rusa |

### Tipografía

- **Fuente**: `Segoe UI`, Tahoma, Geneva, Verdana, sans-serif (sistema)
- **Títulos de página**: `2.5rem – 4rem`, gradiente dorado con `background-clip: text`
- **Subtítulos**: `1.2rem – 1.5rem`, blanco con opacidad reducida
- **Texto de cuerpo**: `1rem`, blanco

### Breakpoints Responsivos

| Breakpoint | Ancho | Cambios |
|---|---|---|
| Desktop | `> 768px` | Layout completo de dos columnas |
| Mobile | `≤ 768px` | Una columna, menú hamburguesa, fuentes reducidas |
| Tablet Sports | `≤ 1024px` | Boleto de apuestas pasa a posición estática |

### Animaciones (Framer Motion)

| Animación | Dónde se usa |
|---|---|
| `fadeInDown` | Título del hero |
| `fadeInUp` | Subtítulo del hero |
| `fadeIn` | Botones del hero |
| `slideInLeft / Right` | Tarjetas de características |
| `slideInUp + stagger` | Tarjetas de juegos (delay escalonado) |
| `scaleIn` | Banner de apuestas deportivas |
| `slideInUp` | Contenedor del formulario de recarga |
| `fadeIn + stagger` | Partidos en la página de apuestas |

---

## Instalación y Uso

### Prerrequisitos

- ![Node.js](https://img.shields.io/badge/Node.js-≥18.0-339933?logo=node.js&logoColor=white) 
- ![npm](https://img.shields.io/badge/npm-≥9.0-CB3837?logo=npm&logoColor=white)

### Pasos

**1. Clonar el repositorio**
```bash
git clone <url-del-repositorio>
cd Front_Service
```

**2. Instalar dependencias**
```bash
npm install
```

**3. Iniciar el servidor de desarrollo**
```bash
npm run dev
```

**4. Abrir en el navegador**
```
http://localhost:5173
```

---

## Scripts Disponibles

| Script | Comando | Descripción |
|---|---|---|
| Desarrollo | `npm run dev` | Inicia el servidor con HMR (Hot Module Replacement) |
| Compilar | `npm run build` | Compila TypeScript y genera el bundle de producción en `/dist` |
| Vista previa | `npm run preview` | Sirve el bundle de producción localmente |
| Lint | `npm run lint` | Ejecuta ESLint para verificar calidad del código |

---

## Mejoras Futuras

- [ ] Integrar con la API real del backend (reemplazar mocks en `AuthContext`)
- [ ] Implementar la lógica de los 4 juegos de casino
- [ ] Conectar apuestas deportivas a una API de datos en tiempo real
- [ ] Integrar pasarela de pago real en la página de recarga
- [ ] Agregar historial de apuestas y transacciones por usuario
- [ ] Implementar sistema de notificaciones en tiempo real (WebSockets)
- [ ] Agregar soporte para múltiples idiomas (i18n)
- [ ] Convertir en Progressive Web App (PWA)
- [ ] Agregar modo oscuro / claro configurable por el usuario
- [ ] Implementar pruebas unitarias con Vitest

---

## Compatibilidad de Navegadores

| Navegador | Soporte |
|---|---|
| ![Chrome](https://img.shields.io/badge/Chrome-última_versión-4285F4?logo=google-chrome&logoColor=white) | ✅ Completo |
| ![Firefox](https://img.shields.io/badge/Firefox-última_versión-FF7139?logo=firefox&logoColor=white) | ✅ Completo |
| ![Safari](https://img.shields.io/badge/Safari-última_versión-000000?logo=safari&logoColor=white) | ✅ Completo |
| ![Edge](https://img.shields.io/badge/Edge-última_versión-0078D7?logo=microsoft-edge&logoColor=white) | ✅ Completo |

---

<div align="center">

**Construido con dedicación para el proyecto ECIBET**

[![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)

*© 2026 ECIBET — Todos los derechos reservados*

</div>
