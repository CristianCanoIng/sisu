<?php
require_once '../includes/conexion.php';

if (!isset($_SESSION['logged_in']) || !$_SESSION['logged_in']) {
    header('Location: ../index.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id_paciente = $_POST['id_paciente'] ?? null;
    $tipo_consulta = $_POST['tipo_consulta'] ?? 'Enfermería';
    $motivo = $_POST['motivo'] ?? '';
    $sintomas = $_POST['sintomas'] ?? '';
    $signos_vitales = $_POST['signos_vitales'] ?? null;
    $diagnostico = $_POST['diagnostico'] ?? null;
    $tratamiento = $_POST['tratamiento'] ?? null;
    $observaciones = $_POST['observaciones'] ?? null;
    
    // Si es estudiante, obtener su id_paciente
    if ($_SESSION['usuario_rol_id'] == 3) {
        $stmt = $pdo->prepare("SELECT id_paciente FROM pacientes WHERE id_usuario = ?");
        $stmt->execute([$_SESSION['usuario_id']]);
        $paciente = $stmt->fetch();
        $id_paciente = $paciente ? $paciente['id_paciente'] : null;
    }
    
    // Profesional que atiende (si está logueado un profesional)
    $id_profesional = null;
    if ($_SESSION['usuario_rol_id'] == 4 || $_SESSION['usuario_rol_id'] == 6) {
        $id_profesional = $_SESSION['usuario_id'];
    }
    
    if (!$id_paciente) {
        header('Location: ../consultas.php?error=' . urlencode('❌ No se encontró información del paciente'));
        exit;
    }
    
    $stmt = $pdo->prepare("
        INSERT INTO consultas (id_paciente, id_profesional, tipo_consulta, motivo, sintomas, signos_vitales, diagnostico, tratamiento, observaciones, estado) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pendiente')
    ");
    
    $stmt->execute([$id_paciente, $id_profesional, $tipo_consulta, $motivo, $sintomas, $signos_vitales, $diagnostico, $tratamiento, $observaciones]);
    
    header('Location: ../consultas.php?mensaje=' . urlencode('✅ Consulta registrada correctamente'));
    exit;
}
?>