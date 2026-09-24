<?php
require_once '../includes/conexion.php';

if (!isset($_SESSION['logged_in']) || !$_SESSION['logged_in'] || !in_array((int)$_SESSION['usuario_rol_id'], [1, 2], true)) {
    header('Location: ../index.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../usuarios.php');
    exit;
}

$nombre = trim($_POST['nombre'] ?? '');
$correo = filter_var($_POST['correo'] ?? '', FILTER_SANITIZE_EMAIL);
$password = $_POST['password'] ?? '123456';
$documento = trim($_POST['documento'] ?? '');
$telefono = trim($_POST['telefono'] ?? '');
$id_rol = (int)($_POST['id_rol'] ?? 3);

if ($nombre === '' || $correo === '' || $password === '') {
    header('Location: ../usuarios.php?error=' . urlencode('Nombre, correo y contrasena son obligatorios.'));
    exit;
}

$stmt_check = $pdo->prepare("SELECT id_usuario FROM usuarios WHERE correo = ?");
$stmt_check->execute([$correo]);
if ($stmt_check->fetch()) {
    header('Location: ../usuarios.php?error=' . urlencode('El correo ya esta registrado.'));
    exit;
}

$stmt = $pdo->prepare("
    INSERT INTO usuarios (nombre, correo, password, documento, telefono, id_rol, estado)
    VALUES (?, ?, ?, ?, ?, ?, 'Activo')
");
$stmt->execute([$nombre, $correo, password_hash($password, PASSWORD_DEFAULT), $documento, $telefono, $id_rol]);

header('Location: ../usuarios.php?mensaje=' . urlencode('Usuario creado correctamente.'));
exit;
