<?php
require_once __DIR__ . '/textos.php';
if (!isset($_SESSION['logged_in']) || !$_SESSION['logged_in']) {
    return;
}
$current_page = basename($_SERVER['PHP_SELF'], '.php');
?>
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>
<aside class="sidebar">
    <div class="sidebar-header">
        <div class="logo">SISU</div>
        <div class="user-info-sidebar">
            <div class="user-avatar"><?php echo substr($_SESSION['usuario_nombre'], 0, 1); ?></div>
            <div class="user-details">
            <div class="user-name"><?php echo htmlspecialchars(normalizar_texto($_SESSION['usuario_nombre'] ?? '')); ?></div>
            <div class="user-role-sidebar"><?php echo htmlspecialchars(normalizar_texto($_SESSION['usuario_rol'] ?? '')); ?></div>

            </div>
        </div>
    </div>
    
    <nav class="sidebar-nav">
        <a href="dashboard.php" class="nav-item <?php echo $current_page == 'dashboard' ? 'active' : ''; ?>">
            <i class="fas fa-chart-line"></i>
            <span>Dashboard</span>
        </a>
        <a href="usuarios.php" class="nav-item <?php echo $current_page == 'usuarios' ? 'active' : ''; ?>">
            <i class="fas fa-users"></i>
            <span>Usuarios</span>
        </a>
        <a href="incapacidades.php" class="nav-item <?php echo $current_page == 'incapacidades' ? 'active' : ''; ?>">
            <i class="fas fa-file-medical"></i>
            <span>Incapacidades</span>
            <?php
            $stmt = $pdo->query("SELECT COUNT(*) as total FROM incapacidades WHERE estado = 'pendiente'");
            $pendientes = (int)($stmt->fetch()['total'] ?? 0);
            if ($pendientes > 0): ?>
                <span class="badge"><?php echo $pendientes; ?></span>
            <?php endif; ?>
        </a>
        <a href="consultas.php" class="nav-item <?php echo $current_page == 'consultas' ? 'active' : ''; ?>">
            <i class="fas fa-stethoscope"></i>
            <span>Enfermería</span>
        </a>
        <a href="bienestar.php" class="nav-item <?php echo $current_page == 'bienestar' ? 'active' : ''; ?>">
            <i class="fas fa-heartbeat"></i>
            <span>Bienestar</span>
        </a>
        <a href="sst.php" class="nav-item <?php echo $current_page == 'sst' ? 'active' : ''; ?>">
            <i class="fas fa-hard-hat"></i>
            <span>SST</span>
        </a>
    </nav>
    
    <div class="sidebar-footer">
        <a href="acciones/logout.php" class="nav-item">
            <i class="fas fa-sign-out-alt"></i>
<span>Cerrar sesión</span>
        </a>
    </div>
</aside>

<style>
.sidebar {
    position: fixed;
    left: 0;
    top: 0;
    width: 260px;
    height: 100vh;
    background: #002470;
    color: white;
    display: flex;
    flex-direction: column;
    z-index: 100;
}

.sidebar-header {
    padding: 20px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
}

.logo {
    font-size: 24px;
    font-weight: bold;
    text-align: center;
    margin-bottom: 20px;
    color: #F5C400;
}

.user-info-sidebar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px;
    background: rgba(255,255,255,0.1);
    border-radius: 8px;
}

.user-avatar {
    width: 40px;
    height: 40px;
    background: #F5C400;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    color: #002470;
}

.user-details {
    flex: 1;
}

.user-name {
    font-size: 14px;
    font-weight: 600;
}

.user-role-sidebar {
    font-size: 11px;
    opacity: 0.7;
}

.sidebar-nav {
    flex: 1;
    padding: 20px 0;
}

.nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 20px;
    color: rgba(255,255,255,0.7);
    text-decoration: none;
    transition: all 0.3s;
}

.nav-item:hover {
    background: rgba(255,255,255,0.1);
    color: white;
}

.nav-item.active {
    background: rgba(245,196,0,0.2);
    color: #F5C400;
    border-left: 3px solid #F5C400;
}

.nav-item i {
    width: 20px;
}

.nav-item .badge {
    margin-left: auto;
    background: #dc2626;
    color: white;
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 10px;
}

.sidebar-footer {
    padding: 20px;
    border-top: 1px solid rgba(255,255,255,0.1);
}

.main-content {
    margin-left: 260px;
    min-height: 100vh;
    background: #f5f5f5;
}

.top-bar {
    background: white;
    padding: 15px 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.top-bar h1 {
    font-size: 20px;
    color: #333;
}

.user-info {
    display: flex;
    align-items: center;
    gap: 15px;
}

.role-badge {
    padding: 5px 12px;
    background: #e8effe;
    color: #003DA5;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
}

.content {
    padding: 30px;
}

/* Cards */
.welcome-banner {
    background: linear-gradient(135deg, #003DA5, #002470);
    color: white;
    padding: 30px;
    border-radius: 12px;
    margin-bottom: 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.banner-badge {
    background: #F5C400;
    color: #002470;
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: bold;
}

.kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    margin-bottom: 30px;
}

.kpi-card {
    background: white;
    padding: 20px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 15px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.kpi-icon {
    width: 50px;
    height: 50px;
    background: #e8effe;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
}

.kpi-value {
    font-size: 28px;
    font-weight: bold;
    color: #333;
}

.kpi-label {
    font-size: 12px;
    color: #666;
    margin-top: 5px;
}

.card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.card-header {
    padding: 20px;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.card-header h3 {
    font-size: 16px;
    color: #333;
}

.card-body {
    padding: 20px;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
}

.data-table th,
.data-table td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #eee;
}

.data-table th {
    background: #f8f9fa;
    font-weight: 600;
    color: #555;
    font-size: 13px;
}

.badge {
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
}

.badge-pendiente {
    background: #fff8d6;
    color: #c49a00;
}

.badge-aprobada {
    background: #dcfce7;
    color: #16a34a;
}

.badge-rechazada {
    background: #fee2e2;
    color: #dc2626;
}

.btn {
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    text-decoration: none;
    display: inline-block;
}

.btn-primary {
    background: #003DA5;
    color: white;
}

.btn-primary:hover {
    background: #002470;
}

.btn-sm {
    padding: 5px 12px;
    font-size: 12px;
}

.form-group {
    margin-bottom: 15px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-size: 13px;
    font-weight: 600;
    color: #555;
}

.form-control {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
}

.form-control:focus {
    outline: none;
    border-color: #003DA5;
}
</style>
</body>
</html>