<a id="readme-top"></a>

<div align="center">
  <a href="https://github.com/CristianCanoIng/sisu">
    <img src="assets/img/logosisu.png" alt="Logo SISU" width="120">
  </a>

  <h3 align="center">SISU</h3>

  <p align="center">
    Sistema Integral de Salud Universitaria.
    <br />
    Aplicación web para la gestión de salud, bienestar universitario, incapacidades y acompañamiento.
    <br />
    Arquitectura migrada a GitHub Pages + Supabase.
    <br /><br />
    <a href="https://github.com/CristianCanoIng/sisu"><strong>Explorar el repositorio »</strong></a>
  </p>
</div>

---

## Construido Con

* [![HTML5][HTML5]][HTML5-url]
* [![CSS3][CSS3]][CSS3-url]
* [![JavaScript][JavaScript]][JavaScript-url]
* [![Supabase][Supabase]][Supabase-url]
* [![PostgreSQL][PostgreSQL]][PostgreSQL-url]
* [![GitHub Pages][GitHubPages]][GitHubPages-url]
* [![Git][Git]][Git-url]
* [![GitHub][GitHub]][GitHub-url]

---

## Acerca de SISU

**SISU** centraliza procesos relacionados con salud, bienestar y gestión universitaria en una sola plataforma web.

La rama `main` contiene actualmente la versión migrada. El frontend funciona con **HTML, CSS y JavaScript**, mientras que **Supabase** se encarga de autenticación, PostgreSQL, políticas RLS, Storage y funciones de backend.

El proyecto principal ya no depende de PHP para ejecutar la aplicación.

### Módulos principales

- **Dashboard:** indicadores y actividad reciente.
- **Usuarios:** administración de usuarios, roles y permisos.
- **Enfermería:** registro y seguimiento de consultas.
- **Incapacidades:** radicación con soporte por estudiante o profesor de apoyo, revisión de Enfermería, aprobación final de Coordinación y seguimiento de estado.
- **Bienestar:** administración de actividades universitarias.
- **Acompañamiento:** seguimiento de procesos de acompañamiento.
- **Inventario y reportes:** módulos complementarios de gestión.

---

## Arquitectura

```text
Navegador / GitHub Pages
        |
        v
HTML + CSS + JavaScript
        |
        v
   Supabase JS
        |
        +-- Auth
        +-- PostgreSQL
        +-- Row Level Security (RLS)
        +-- Storage
        +-- Edge Functions
```

---

## Estructura del proyecto

```text
sisu/
├── assets/
│   ├── css/
│   ├── img/
│   └── js/
│       ├── auth.js
│       ├── session.js
│       ├── supabase.js
│       └── modules/
├── database/
│   └── bd.sql
├── supabase/
│   ├── schema.sql
│   ├── functions.sql
│   ├── policies.sql
│   ├── seed.sql
│   └── functions/
│       └── crear-usuario/
├── index.html
├── dashboard.html
├── consultas.html
├── enfermeria.html
├── incapacidades.html
├── bienestar.html
├── usuarios.html
├── inventario.html
├── reportes.html
└── acompanamiento.html
```

---

## Configuración de Supabase

1. Cree un proyecto en Supabase.
2. Ejecute en SQL Editor, en este orden:

```text
database/bd.sql
supabase/schema.sql
supabase/functions.sql
supabase/policies.sql
supabase/seed.sql
```

3. Configure o migre los usuarios a Supabase Auth.
4. Verifique que `public.usuarios.auth_user_id` apunte al UUID correspondiente de Auth.
5. Configure `assets/js/supabase.js` con la URL del proyecto y la **publishable/anon key**.
6. Despliegue la Edge Function `crear-usuario`.

> Nunca coloque una `service_role key` en el frontend.

Los soportes de incapacidades se almacenan en el bucket privado `incapacidades` de Supabase Storage.

---

## Ejecución local

La versión actual no necesita WAMP ni PHP.

Puede ejecutarse con cualquier servidor web estático. Por ejemplo, con **Live Server** en VS Code:

```text
1. Abrir la carpeta del proyecto.
2. Abrir index.html.
3. Ejecutar "Open with Live Server".
```

Se recomienda no abrir la aplicación directamente mediante `file://`, porque utiliza módulos ES de JavaScript.

---

## Despliegue en GitHub Pages

1. Abra **Settings → Pages** en el repositorio.
2. Seleccione **Deploy from a branch**.
3. Seleccione la rama `main`.
4. Seleccione la carpeta `/(root)`.
5. Guarde los cambios.

La rama `main` contiene la versión preparada para despliegue estático.

---

## Seguridad

- Supabase RLS controla el acceso real a los datos.
- La `service_role key` debe existir únicamente en entornos seguros.
- Los documentos de incapacidades se guardan en Storage privado.
- La interfaz puede ocultar acciones, pero la autorización real debe mantenerse en RLS y Edge Functions.

---

## Colaboradores

- **CristianCanoIng** - [Perfil GitHub](https://github.com/CristianCanoIng)

---

<div align="center">
  <p><strong>Proyecto SISU</strong></p>
  <a href="#readme-top">Volver arriba ↑</a>
</div>

[HTML5]: https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white
[HTML5-url]: https://developer.mozilla.org/docs/Web/HTML
[CSS3]: https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white
[CSS3-url]: https://developer.mozilla.org/docs/Web/CSS
[JavaScript]: https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black
[JavaScript-url]: https://developer.mozilla.org/docs/Web/JavaScript
[Supabase]: https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white
[Supabase-url]: https://supabase.com/
[PostgreSQL]: https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white
[PostgreSQL-url]: https://www.postgresql.org/
[GitHubPages]: https://img.shields.io/badge/GitHub_Pages-222222?style=for-the-badge&logo=github&logoColor=white
[GitHubPages-url]: https://pages.github.com/
[Git]: https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white
[Git-url]: https://git-scm.com/
[GitHub]: https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white
[GitHub-url]: https://github.com/
