# Amigo Secreto Familiar 🎁

Aplicación web minimalista para organizar un **Amigo Secreto familiar**, diseñada con:

- **Privacidad cero spoilers:** El organizador también participa como uno más y su panel nunca muestra a quién le tocó a quién.
- **Modo asistido (Caso Abuela):** Pantalla previa de advertencia para quien abre el enlace por otra persona, botón gigante de alto contraste, resultado en letra extra grande y botón **`LISTO, OCULTAR RESULTADO`**.
- **Enlace real de un solo uso:** Se consume en la base de datos en el instante en que se revela el resultado. Si alguien lo vuelve a abrir después, queda bloqueado hasta que el organizador habilite una vista extra.
- **Protección contra vista previa de WhatsApp:** La carga inicial (`GET`) nunca revela ni quema el enlace; solo el clic explícito (`POST`) consume la vista.
- **Exclusiones opcionales:** Restricciones simples o mutuas (ej. parejas), mostrando solo el nombre sorteado más fecha y presupuesto si se definieron.

---

## Correr en local (con SQLite local, sin crear cuentas)

1. Instala dependencias:
   ```bash
   npm install
   ```
2. Crea tu archivo `.env` a partir de `.env.example` (ya viene listo para usar `file:local.db`):
   ```bash
   cp .env.example .env
   ```
3. Crea las tablas en `local.db`:
   ```bash
   npm run db:push
   ```
4. Inicia la aplicación en modo desarrollo:
   ```bash
   npm run dev
   ```
5. Abre `http://localhost:3000`.

### Pruebas y validación
```bash
npm test
npx tsc --noEmit
npm run build
```

---

## Desplegar gratis en Turso + Vercel

1. **Crear base de datos en Turso (gratis):**
   - Crea una cuenta en [Turso](https://turso.tech/) (puedes iniciar sesión con GitHub).
   - Crea una base de datos (por ejemplo `secret-santa`) y obtén:
     - `TURSO_DATABASE_URL` (formato `libsql://...turso.io`)
     - `TURSO_AUTH_TOKEN`
2. **Crear las tablas en Turso:**
   En tu terminal local, asignando temporalmente esas variables (o en `.env`), ejecuta:
   ```bash
   npx drizzle-kit push
   ```
3. **Desplegar en Vercel (gratis):**
   - Entra a [Vercel](https://vercel.com/) con tu cuenta de GitHub.
   - Importa el repositorio `bwnjawn/secret-santa`.
   - En **Environment Variables**, agrega:
     - `TURSO_DATABASE_URL`
     - `TURSO_AUTH_TOKEN`
   - Presiona **Deploy**. En ~1 minuto tendrás tu enlace HTTPS listo para compartir por WhatsApp.
