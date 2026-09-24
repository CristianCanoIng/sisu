<?php
require_once '../includes/conexion.php';

if (!isset($_SESSION['logged_in']) || (int)$_SESSION['usuario_rol_id'] !== 3) {
    header('Location: ../index.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../incapacidades.php');
    exit;
}

$motivo = trim($_POST['motivo'] ?? '');
$fecha_inicio = $_POST['fecha_inicio'] ?? '';
$fecha_fin = $_POST['fecha_fin'] ?? '';
$diagnostico = trim($_POST['diagnostico'] ?? '');
$observaciones = trim($_POST['observaciones'] ?? '');

if ($motivo === '' || $fecha_inicio === '' || $fecha_fin === '') {
    header('Location: ../incapacidades.php?error=' . urlencode('Completa los campos obligatorios.'));
    exit;
}

$inicio = new DateTime($fecha_inicio);
$fin = new DateTime($fecha_fin);
if ($fin < $inicio) {
    header('Location: ../incapacidades.php?error=' . urlencode('La fecha final no puede ser anterior a la fecha inicial.'));
    exit;
}
$dias_totales = $inicio->diff($fin)->days + 1;

$archivo_soporte = null;
if (isset($_FILES['archivo_soporte']) && $_FILES['archivo_soporte']['error'] !== UPLOAD_ERR_NO_FILE) {
    if ($_FILES['archivo_soporte']['error'] !== UPLOAD_ERR_OK) {
        header('Location: ../incapacidades.php?error=' . urlencode('No se pudo cargar el archivo de soporte.'));
        exit;
    }

    if ($_FILES['archivo_soporte']['size'] > 5 * 1024 * 1024) {
        header('Location: ../incapacidades.php?error=' . urlencode('El archivo no puede superar 5 MB.'));
        exit;
    }

    $extension = strtolower(pathinfo($_FILES['archivo_soporte']['name'], PATHINFO_EXTENSION));
    if (!in_array($extension, ['pdf', 'jpg', 'jpeg', 'png'], true)) {
        header('Location: ../incapacidades.php?error=' . urlencode('Formato no permitido. Usa PDF, JPG o PNG.'));
        exit;
    }

    $upload_dir = __DIR__ . '/../uploads/incapacidades';
    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0775, true);
    }

    $nombre_archivo = 'incapacidad_' . $_SESSION['usuario_id'] . '_' . date('YmdHis') . '_' . bin2hex(random_bytes(4)) . '.' . $extension;
    $destino = $upload_dir . '/' . $nombre_archivo;

    if (!move_uploaded_file($_FILES['archivo_soporte']['tmp_name'], $destino)) {
        header('Location: ../incapacidades.php?error=' . urlencode('No se pudo guardar el archivo de soporte.'));
        exit;
    }

    $archivo_soporte = 'uploads/incapacidades/' . $nombre_archivo;
}

$stmt = $pdo->prepare("SELECT id_paciente FROM pacientes WHERE id_usuario = ?");
$stmt->execute([$_SESSION['usuario_id']]);
$paciente = $stmt->fetch();

if (!$paciente) {
    header('Location: ../incapacidades.php?error=' . urlencode('No se encontro informacion del paciente.'));
    exit;
}

$stmt = $pdo->prepare("
    INSERT INTO incapacidades (id_paciente, fecha_inicio, fecha_fin, dias_totales, motivo, diagnostico, archivo_soporte, observaciones, estado)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Radicada')
");
$stmt->execute([$paciente['id_paciente'], $fecha_inicio, $fecha_fin, $dias_totales, $motivo, $diagnostico, $archivo_soporte, $observaciones]);

header('Location: ../incapacidades.php?mensaje=' . urlencode('Incapacidad radicada correctamente.'));
exit;
