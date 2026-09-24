<?php
require_once '../includes/conexion.php';

header('Content-Type: application/json');

if (!isset($_SESSION['logged_in']) || !$_SESSION['logged_in']) {
    echo json_encode(['error' => 'No autorizado']);
    exit;
}

$id = $_GET['id'] ?? 0;

$stmt = $pdo->prepare("
    SELECT u.*, p.programa_academico, p.semestre 
    FROM usuarios u
    LEFT JOIN pacientes p ON u.id_usuario = p.id_usuario
    WHERE u.id_usuario = ?
");
$stmt->execute([$id]);
$usuario = $stmt->fetch();

if ($usuario) {
    echo json_encode($usuario);
} else {
    echo json_encode(['error' => 'Usuario no encontrado']);
}
?>