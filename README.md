<a id="readme-top"></a>

<div align="center">
  <a href="https://github.com/CristianCanoIng/sisu">
    <img src="assets/img/logosisu.png" alt="Logo SISU" width="120">
  </a>

  <h3 align="center">SISU</h3>

  <p align="center">
    Sistema web para la gestión de servicios de salud y bienestar universitario.
    <br />
    Permite administrar usuarios, consultas de enfermería, incapacidades,
    actividades de bienestar, Seguridad y Salud en el Trabajo (SST)
    y procesos de acompañamiento.
    <br />
    <br />
    <a href="https://github.com/CristianCanoIng/sisu"><strong>Explorar el repositorio »</strong></a>
  </p>
</div>

---

## Construido Con

* [![PHP][PHP]][PHP-url]
* [![HTML5][HTML5]][HTML5-url]
* [![CSS3][CSS3]][CSS3-url]
* [![JavaScript][JavaScript]][JavaScript-url]
* [![MySQL][MySQL]][MySQL-url]
* [![Supabase][Supabase]][Supabase-url]
* [![Git][Git]][Git-url]
* [![GitHub][GitHub]][GitHub-url]

---

## Acerca de SISU

**SISU** centraliza diferentes procesos relacionados con salud, bienestar y gestión universitaria en una sola plataforma.

El proyecto contempla funcionalidades para distintos tipos de usuarios y áreas administrativas, buscando facilitar el registro, consulta y seguimiento de información de manera organizada.

### Módulos principales

- **Dashboard:** visualización general de indicadores y actividad reciente.
- **Usuarios:** administración de usuarios, roles y permisos.
- **Enfermería:** registro y seguimiento de consultas.
- **Incapacidades:** radicación, consulta y gestión de incapacidades.
- **Bienestar:** administración de actividades de bienestar universitario.
- **SST:** gestión de eventos de Seguridad y Salud en el Trabajo.
- **Acompañamiento:** seguimiento de procesos de acompañamiento a estudiantes.

---

## Estructura del proyecto

```text
sisu/
├── acciones/              # Acciones y procesos PHP
├── assets/
│   ├── css/               # Estilos
│   └── img/               # Logos e imágenes
├── database/              # Scripts de base de datos
├── includes/              # Conexión, permisos y funciones compartidas
├── uploads/
│   └── incapacidades/     # Archivos cargados por usuarios
├── index.html             # Acceso al sistema
├── dashboard.html         # Panel principal
├── bienestar.html
├── incapacidades.html
├── sst.html
├── usuarios.html
└── acompanamiento.html
```

---

## Instalación local

### Requisitos

- Windows 10/11
- WAMP Server o entorno equivalente con Apache y PHP
- MySQL/MariaDB para la arquitectura PHP actual
- Git
- Navegador web moderno

### 1. Clonar el repositorio

```bash
cd C:\\wamp64\\www
git clone https://github.com/CristianCanoIng/sisu.git
cd sisu
```

### 2. Crear la configuración local

Crea un archivo llamado `config.local.php` en la raíz del proyecto:

```php
<?php
$db_host = 'localhost';
$db_name = 'sisu';
$db_user = 'root';
$db_pass = '';
?>
```

> `config.local.php` está excluido del repositorio mediante `.gitignore` para evitar publicar credenciales.

### 3. Preparar la base de datos

El código PHP actual utiliza **PDO MySQL**.

El archivo `database/bd.sql` contiene una versión del esquema orientada a **PostgreSQL / Supabase**, por lo que la capa de datos debe mantenerse consistente con la tecnología elegida antes del despliegue productivo.

### 4. Ejecutar SISU

Inicia Apache y MySQL/MariaDB desde WAMP y abre:

```text
http://localhost/sisu/
```

---

## Nota sobre GitHub Pages

GitHub Pages publica únicamente contenido estático y **no ejecuta PHP**.

Para desplegar SISU en GitHub Pages es necesario utilizar una arquitectura frontend estática conectada directamente a un backend como **Supabase**.

Si se mantiene la versión PHP, el proyecto debe desplegarse en un servidor o servicio de hosting compatible con PHP.

---

## Seguridad

El repositorio incluye reglas en `.gitignore` para evitar versionar:

- Archivos de configuración con credenciales.
- Variables de entorno.
- Documentos cargados por usuarios.
- Backups y archivos temporales.
- Configuraciones locales de IDE.

Nunca publiques contraseñas, claves privadas o credenciales de producción dentro del repositorio.

---

## Colaboradores

- **CristianCanoIng** - [Perfil GitHub](https://github.com/CristianCanoIng)
- **DanielMoreno01** - [Perfil GitHub](https://github.com/DanielMoreno01)

---

<div align="center">
  <p>
    Proyecto SISU
  </p>
  <a href="#readme-top">Volver arriba ↑</a>
</div>

[PHP]: https://img.shields.io/badge/PHP-777BB4?style=for-the-badge&logo=php&logoColor=white
[PHP-url]: https://www.php.net/

[HTML5]: https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white
[HTML5-url]: https://developer.mozilla.org/docs/Web/HTML

[CSS3]: https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white
[CSS3-url]: https://developer.mozilla.org/docs/Web/CSS

[JavaScript]: https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black
[JavaScript-url]: https://developer.mozilla.org/docs/Web/JavaScript

[MySQL]: https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white
[MySQL-url]: https://www.mysql.com/

[Supabase]: https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white
[Supabase-url]: https://supabase.com/

[Git]: https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white
[Git-url]: https://git-scm.com/

[GitHub]: https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white
[GitHub-url]: https://github.com/
