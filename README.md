# Terreno Seguro · versión multiempresa

Sistema de prevención de riesgos y trabajo en terreno. Usa **una copia del backend por empresa**: cada una tiene su planilla y su carpeta en Drive. La **app de técnicos y el panel son uno solo para todas**: cada empresa entra con su código.

```
apps-script/        → backend (se pega en Google Apps Script)
  Code.gs           → servidor
  Tecnico.html      → app de técnicos servida por el script
  Admin.html        → panel
  Alta.html         → asistente "Crear mi empresa"
index.html          → app única de técnicos (GitHub Pages, funciona sin señal)
empresa.html        → pantalla "Código de tu empresa"
panel/index.html    → panel único: panel/?c=CODIGO
empresas.json       → lista de empresas: código → URL de su sistema
```

## 1. Preparar la plantilla (una sola vez)

1. Abre el proyecto de Apps Script que usarás como **Plantilla** y crea 4 archivos: `Code` (secuencia de comandos) y `Tecnico`, `Admin` y `Alta` (HTML).
2. Pega en cada uno el contenido de la carpeta `apps-script/`.
3. **No implementes ni abras la URL de la plantilla.** Siempre se copia y se instala la copia.

## 2. Crear una empresa nueva (unos 10 minutos)

1. Entra a script.google.com con la cuenta que va a guardar los datos. Lo ideal es un correo de la empresa cliente, así los datos quedan en su Drive. Abre la Plantilla y haz **Información general → Hacer una copia**. Ponle de nombre "Terreno Seguro · NOMBRE EMPRESA".
2. En la copia, elige la función `autorizar` y presiona **Ejecutar**. Acepta los permisos.
3. Ve a **Implementar → Nueva implementación → Aplicación web**. En "Ejecutar como" elige **Yo**, y en "Quién tiene acceso", **Cualquier usuario**. Copia la URL, que termina en `/exec`.
4. Abre esa URL. Aparece **Crear mi empresa**: ahí van los datos, el logo, los colores, los módulos y el administrador (RUT y PIN). Al terminar se crean la planilla y las carpetas, y el sistema queda listo. Hazlo con el cliente o apenas implementes: mientras no esté hecho, cualquiera que tenga la URL podría hacer el alta.
5. Agrega la empresa a `empresas.json` y súbelo a GitHub:
   ```json
   "clopez": { "nombre": "Constructora López", "url": "https://script.google.com/macros/s/…/exec" }
   ```
6. Envía los enlaces a la empresa:
   - Técnicos: `https://USUARIO.github.io/Terreno-Seguro/?c=clopez` (se instala como app y recuerda la empresa).
   - Panel: `https://USUARIO.github.io/Terreno-Seguro/panel/?c=clopez`

Para cambiar de empresa en un teléfono: `…/Terreno-Seguro/?empresa`

## 3. Qué cambia por empresa sin tocar código

En el panel, en **Configuración → Marca y módulos de la empresa**:
- Código de la empresa, rubro, colores y logo.
- Módulos que se usan. Los apagados no los ve nadie, ni el administrador.
- Lo que ya existía: razón social, RUT, ciudad, comunas, correos, Mikrowisp, SmartOLT, etc.

Módulos apagados por defecto según el rubro:
- **ISP:** ninguno.
- **Contratista y Otro:** Equipos con serie y Fallas de red.
- **Construcción:** Equipos con serie, Fallas de red y Clientes.

## 4. Actualizar el sistema a todas las empresas

Por ahora hay que pegar el `Code.gs` y los HTML nuevos en cada copia y luego ir a **Implementar → Gestionar implementaciones → Editar → Nueva versión**. La URL no cambia. Cuando haya más de 3 o 4 empresas, conviene usar `clasp` para subirlo a todas con un comando.

## 5. APPLY-NET y Pulso (instalaciones anteriores)

La versión nueva reconoce las instalaciones antiguas y siguen funcionando con sus datos. **Antes de actualizarlas**, su logo deja de venir dentro del código. Hay dos formas de ponerlo:
- Sube `logo-applynet.jpg` en Configuración → Logo.
- O deja un archivo `logo.jpg` en la carpeta raíz del sistema en Drive.

## Seguridad

- El sistema no usa los datos de otra empresa: si una copia trae datos de otra instalación, los ignora y pide su propia alta.
- El alta se puede hacer una sola vez. El PIN se guarda cifrado y el usuario inicial ADMIN/1234 se reemplaza por el administrador real.
- `empresas.json` es público: solo tiene los nombres y las URL. Para entrar siempre se necesita RUT y PIN.
