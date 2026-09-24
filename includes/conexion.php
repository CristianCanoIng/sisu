<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Cargar configuración según entorno
if (file_exists(__DIR__ . '/../config.local.php')) {
    // Modo local
    require_once __DIR__ . '/../config.local.php';
    define('ENV', 'local');
} elseif (file_exists(__DIR__ . '/../config.php')) {
    // Modo producción (cPanel)
    require_once __DIR__ . '/../config.php';
    define('ENV', 'production');
} else {
    die('No se encontró archivo de configuración.');
}

// Debug en local
if (ENV === 'local') {
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
}

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch(PDOException $e) {
    die("Error de conexión: " . $e->getMessage());
}
