<?php
require_once '../includes/conexion.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../index.php');
    exit;
}

$correo = filter_var($_POST['correo'] ?? '', FILTER_SANITIZE_EMAIL);
$password = $_POST['password'] ?? '';
$rol_id = (int)($_POST['rol_id'] ?? 0);

if ($correo === '' || $password === '' || $rol_id <= 0) {
    header('Location: ../index.php?error=' . urlencode('Todos los campos son obligatorios.'));
    exit;
}

$stmt = $pdo->prepare("
    SELECT u.*, r.nombre AS rol_nombre
    FROM usuarios u
    JOIN roles r ON u.id_rol = r.id_rol
    WHERE u.correo = ? AND u.id_rol = ? AND u.estado = 'Activo'
");
$stmt->execute([$correo, $rol_id]);
$usuario = $stmt->fetch();

if (!$usuario || !password_verify($password, $usuario['password'])) {
    header('Location: ../index.php?error=' . urlencode('Credenciales incorrectas o usuario inactivo.'));
    exit;
}

$_SESSION['usuario_id'] = $usuario['id_usuario'];
$_SESSION['usuario_nombre'] = $usuario['nombre'];
$_SESSION['usuario_rol'] = $usuario['rol_nombre'];
$_SESSION['usuario_rol_id'] = $usuario['id_rol'];
$_SESSION['logged_in'] = true;

if ((int)$usuario['id_rol'] === 3) {
    $stmt_pac = $pdo->prepare("SELECT id_paciente FROM pacientes WHERE id_usuario = ?");
    $stmt_pac->execute([$usuario['id_usuario']]);
    $paciente = $stmt_pac->fetch();
    $_SESSION['id_paciente'] = $paciente['id_paciente'] ?? null;
}

$pdo->prepare("UPDATE usuarios SET ultimo_acceso = NOW() WHERE id_usuario = ?")->execute([$usuario['id_usuario']]);

header('Location: ../dashboard.php');
exit;
