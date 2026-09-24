<?php
function sisu_rol_id() {
    return (int)($_SESSION['usuario_rol_id'] ?? 0);
}

function sisu_puede_ver($modulo) {
    $rol = sisu_rol_id();
    
    $permisos = [
        'dashboard' => [1, 2, 3, 4, 5, 6, 7],
        'incapacidades' => [1, 2, 3, 4, 5],
        'consultas' => [1, 3, 4, 6],
        'bienestar' => [1, 3, 7],
        'sst' => [1, 3],
        'reportes' => [1, 7],
        'usuarios' => [1],
        'enfermeria' => [1, 2, 4, 6],
        'inventario' => [1, 2, 4],
        'historial_consultas' => [1, 2, 4, 6],
        'acompanamiento' => [1, 3, 4, 6],
    ];
    
    return in_array($rol, $permisos[$modulo] ?? [], true);
}

function sisu_requerir_modulo($modulo) {
    if (!sisu_puede_ver($modulo)) {
        header('Location: dashboard.php');
        exit;
    }
}

function sisu_render_nav($activo) {
    // RUTAS ABSOLUTAS - Con /sisu/ al inicio
    $items = [
        'dashboard' => ['Dashboard', '/sisu/dashboard.php', 'fas fa-chart-line'],
        'incapacidades' => ['Incapacidades', '/sisu/incapacidades.php', 'fas fa-file-medical'],
        'consultas' => ['Info Médica', '/sisu/consultas.php', 'fas fa-notes-medical'],
        'enfermeria' => ['Enfermería', '/sisu/enfermeria/index.php', 'fas fa-stethoscope'],
        'inventario' => ['Inventario', '/sisu/enfermeria/inventario.php', 'fas fa-boxes'],
        'historial_consultas' => ['Historial', '/sisu/enfermeria/historial_consultas.php', 'fas fa-history'],
        'acompanamiento' => ['Acompañamiento', '/sisu/acompanamiento.php', 'fas fa-hands-helping'],
        'bienestar' => ['Bienestar', '/sisu/bienestar.php', 'fas fa-heartbeat'],
        'sst' => ['SST', '/sisu/sst.php', 'fas fa-hard-hat'],
        'reportes' => ['Reportes', '/sisu/reportes.php', 'fas fa-chart-pie'],
        'usuarios' => ['Usuarios', '/sisu/usuarios.php', 'fas fa-users'],
    ];
    
    foreach ($items as $modulo => $item) {
        if (!sisu_puede_ver($modulo)) continue;
        $active = $activo === $modulo ? ' active' : '';
        echo '<a href="' . $item[1] . '" class="nav-item' . $active . '"><i class="' . $item[2] . '"></i><span>' . $item[0] . '</span></a>';
    }
}