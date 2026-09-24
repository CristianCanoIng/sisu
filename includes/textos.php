<?php
// Úsalo al momento de renderizar o comparar valores provenientes de BD.

function normalizar_texto($texto): string
{
    if ($texto === null) return '';
    if (!is_string($texto)) $texto = (string)$texto;

    // Quita caracteres no imprimibles
    $texto = trim($texto);

    // Intenta convertir secuencias mal codificadas (UTF-8 interpretado como ISO-8859-1)
    // Si no hay problema de encoding, iconv no dañará el texto de forma importante.
    $convertido = @iconv('UTF-8', 'UTF-8//IGNORE', $texto);

    // Si la conversión no cambió nada, intentamos la ruta típica: UTF-8->ISO-8859-1->UTF-8
    if ($convertido === false || $convertido === $texto) {
        $convertido = @iconv('ISO-8859-1', 'UTF-8//IGNORE', $texto);
    }

    if ($convertido !== false && is_string($convertido) && $convertido !== '') {
        return $convertido;
    }

    return $texto;
}

// Normaliza para comparaciones sin acentos/ñ (si quieres lógica por keywords)
function normalizar_texto_sin_tildes($texto): string
{
    $texto = normalizar_texto($texto);
    $texto = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $texto);
    $texto = strtolower(trim($texto));
    return $texto;
}

