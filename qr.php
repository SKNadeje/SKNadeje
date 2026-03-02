<?php
// qr.php
require __DIR__ . '/vendor/autoload.php';

use Defr\QRPlatba\QRPlatba;

// 1. Získání a očištění jména z URL
$playerName = $_GET['name'] ?? '';
$cleanName = iconv('UTF-8', 'ASCII//TRANSLIT', $playerName);
$cleanName = preg_replace('/[^a-zA-Z0-9 ]/', '', $cleanName);
$cleanName = substr($cleanName, 0, 15);

// 2. Vytvoření SPAYD platby
$qrPlatba = new QRPlatba();
$qrPlatba->setAccount('295511827/0300') // Knihovna si IBAN (CZ12...) spočítá a ověří sama!
         ->setAmount(200.00)
         ->setCurrency('CZK')
         ->setMessage('WC26 ' . $cleanName);

// 3. Odeslání obrázku zpět do prohlížeče
header('Content-Type: image/png');
echo $qrPlatba->getQRCodeImage();
exit;
