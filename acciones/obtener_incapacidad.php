<?php
require_once '../includes/conexion.php';

header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION['logged_in']) || !$_SESSION['logged_in']) {
    http_response_code(401);
    echo json_encode(['error' => 'No autorizado']);
    exit;
}

$id_incapacidad = (int)($_GET['id'] ?? 0);
if ($id_incapacidad <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'ID invalido']);
    exit;
}

$sql = "
    SELECT i.*, u.nombre AS estudiante_nombre, u.documento, p.programa_academico, p.codigo_estudiantil,
           aprobador.nombre AS aprobado_por_nombre
    FROM incapacidades i
    JOIN pacientes p ON i.id_paciente = p.id_paciente
    JOIN usuarios u ON p.id_usuario = u.id_usuario
    LEFT JOIN usuarios aprobador ON i.aprobado_por = aprobador.id_usuario
    WHERE i.id_incapacidad = ?
";
$params = [$id_incapacidad];

if ((int)$_SESSION['usuario_rol_id'] === 3) {
    $sql .= " AND p.id_usuario = ?";
    $params[] = $_SESSION['usuario_id'];
}

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$incapacidad = $stmt->fetch();

if (!$incapacidad) {
    http_response_code(404);
    echo json_encode(['error' => 'Incapacidad no encontrada']);
    exit;
}

echo json_encode($incapacidad);
