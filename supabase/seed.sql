INSERT INTO public.roles(id_rol,nombre,descripcion) OVERRIDING SYSTEM VALUE VALUES
(1,'Administrador','Acceso total al sistema'),(2,'Coordinador','Coordina actividades y aprueba incapacidades'),(3,'Estudiante','Acceso a servicios de salud y bienestar'),(4,'Enfermero','Gestiona consultas de enfermería'),(5,'Docente','Visualiza incapacidades'),(7,'Bienestar','Gestiona actividades de bienestar')
ON CONFLICT(id_rol) DO UPDATE SET nombre=EXCLUDED.nombre,descripcion=EXCLUDED.descripcion;
