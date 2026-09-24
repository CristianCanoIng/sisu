<?php
/**
 * Funciones auxiliares del sistema SISU
 */

function getMesEspanol($fecha) {
    $meses = [
        'January' => 'Enero', 'February' => 'Febrero', 'March' => 'Marzo',
        'April' => 'Abril', 'May' => 'Mayo', 'June' => 'Junio',
        'July' => 'Julio', 'August' => 'Agosto', 'September' => 'Septiembre',
        'October' => 'Octubre', 'November' => 'Noviembre', 'December' => 'Diciembre'
    ];
    return $meses[date('F', strtotime($fecha))] ?? date('F', strtotime($fecha));
}

function getInitials($nombre) {
    $palabras = explode(' ', trim($nombre));
    $iniciales = '';
    foreach ($palabras as $palabra) {
        if (!empty($palabra)) {
            $iniciales .= strtoupper(mb_substr($palabra, 0, 1, 'UTF-8'));
        }
    }
    return substr($iniciales, 0, 2);
}

// ... resto de funciones
?>