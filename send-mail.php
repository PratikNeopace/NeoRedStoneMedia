<?php
/**
 * Secure Contact Form Handler using PHPMailer
 * Implements CSRF protection, Honeypot, Rate Limiting, and Time checks.
 */

session_start();
header('Content-Type: application/json');

// --- Configuration ---
$config = [
    'admin_email'       => 'info@neoredstonemedia.com', // Replace with your actual email
    'company_name'      => 'Neo Redstone Media',
    'smtp_host'         => 'smtp.hostinger.com',
    'smtp_user'         => 'info@neoredstonemedia.com', // Your Hostinger email address
    'smtp_pass'         => 'YOUR_EMAIL_PASSWORD',       // Your Hostinger email password
    'smtp_port'         => 465,                         // 465 for SSL, 587 for TLS
    'rate_limit_secs'   => 60,                          // Time between allowed submissions
    'min_submit_time'   => 3                            // Minimum time (in seconds) to fill out the form
];

// Include PHPMailer classes (Support Composer or Manual Bundling)
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    require_once __DIR__ . '/vendor/autoload.php';
} else {
    require_once __DIR__ . '/lib/PHPMailer/Exception.php';
    require_once __DIR__ . '/lib/PHPMailer/PHPMailer.php';
    require_once __DIR__ . '/lib/PHPMailer/SMTP.php';
}

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// --- Helper Functions ---
function jsonResponse($success, $message, $code = 200) {
    http_response_code($code);
    echo json_encode(['success' => $success, 'message' => $message]);
    exit;
}

function sanitizeInput($data) {
    return htmlspecialchars(stripslashes(trim($data)), ENT_QUOTES, 'UTF-8');
}

// Ensure the request is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, 'Invalid request method.', 405);
}

// --- Security Checks ---

// 1. Double Submit Cookie CSRF Check
$headers = getallheaders();
// PHP's getallheaders might lowercase headers in some environments, so we check both
$csrfTokenHeader = $headers['X-CSRF-Token'] ?? $headers['x-csrf-token'] ?? '';
$csrfTokenCookie = $_COOKIE['csrf_token'] ?? '';
if (empty($csrfTokenHeader) || empty($csrfTokenCookie) || !hash_equals($csrfTokenCookie, $csrfTokenHeader)) {
    jsonResponse(false, 'Security validation failed (CSRF).', 403);
}

// 2. Honeypot Check
$honeypot = $_POST['website_url'] ?? '';
if (!empty($honeypot)) {
    // Bot detected (filled out invisible field)
    jsonResponse(true, 'Enquiry sent successfully.'); // Fake success
}

// 3. Minimum Submit Time Check
$loadTime = $_POST['load_time'] ?? 0;
$currentTime = time();
if (!is_numeric($loadTime) || ($currentTime - (int)$loadTime) < $config['min_submit_time']) {
    jsonResponse(false, 'Form submitted too quickly. Please try again.', 400);
}

// 4. Rate Limiting Check
if (isset($_SESSION['last_submit_time'])) {
    if (($currentTime - $_SESSION['last_submit_time']) < $config['rate_limit_secs']) {
        jsonResponse(false, 'You are submitting too fast. Please wait a minute before trying again.', 429);
    }
}

// --- Data Validation ---
$name = sanitizeInput($_POST['name'] ?? '');
$email = filter_var(trim($_POST['email'] ?? ''), FILTER_SANITIZE_EMAIL);
$message = sanitizeInput($_POST['message'] ?? '');

// Ensure required fields
if (empty($name) || empty($email) || empty($message)) {
    jsonResponse(false, 'Please fill in all required fields.', 400);
}

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(false, 'Invalid email format.', 400);
}

// Log submit time
$_SESSION['last_submit_time'] = $currentTime;
$ipAddress = $_SERVER['REMOTE_ADDR'];
$date = date('Y-m-d H:i:s');

// --- Email Generation ---
$mail = new PHPMailer(true);

try {
    // SMTP Configuration
    $mail->isSMTP();
    $mail->Host       = $config['smtp_host'];
    $mail->SMTPAuth   = true;
    $mail->Username   = $config['smtp_user'];
    $mail->Password   = $config['smtp_pass'];
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS; // Using SSL for port 465
    $mail->Port       = $config['smtp_port'];

    // --- Send Email to Admin ---
    $mail->setFrom($config['smtp_user'], $config['company_name'] . ' Website');
    $mail->addAddress($config['admin_email']);
    $mail->addReplyTo($email, $name);
    
    $mail->isHTML(true);
    $mail->Subject = 'New Website Enquiry';
    
    // Admin HTML Template
    $adminHtml = "
    <div style='font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; padding: 20px; border-radius: 8px;'>
        <h2 style='color: #b0272d; border-bottom: 2px solid #eaeaea; padding-bottom: 10px;'>New Enquiry Received</h2>
        <p><strong>Name:</strong> {$name}</p>
        <p><strong>Email:</strong> <a href='mailto:{$email}'>{$email}</a></p>
        <p><strong>Message:</strong></p>
        <div style='background: #f9f9f9; padding: 15px; border-left: 4px solid #b0272d; margin-bottom: 20px;'>
            " . nl2br($message) . "
        </div>
        <hr style='border: 0; border-top: 1px solid #eaeaea;' />
        <p style='font-size: 12px; color: #777;'>
            <strong>IP Address:</strong> {$ipAddress}<br>
            <strong>Date & Time:</strong> {$date}
        </p>
    </div>";
    
    $mail->Body = $adminHtml;
    $mail->send();
    
    // --- Send Auto-Reply to Visitor ---
    $mail->clearAddresses();
    $mail->clearReplyTos();
    
    $mail->setFrom($config['smtp_user'], $config['company_name']);
    $mail->addAddress($email, $name);
    $mail->addReplyTo($config['admin_email'], $config['company_name']);
    
    $mail->Subject = 'Thank you for contacting ' . $config['company_name'];
    
    // Auto-Reply HTML Template
    $visitorHtml = "
    <div style='font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; padding: 20px; border-radius: 8px;'>
        <h2 style='color: #b0272d;'>Thank You for Reaching Out</h2>
        <p>Hi {$name},</p>
        <p>Thank you for contacting us. We have successfully received your enquiry.</p>
        <p>Our team will review your request and contact you as soon as possible.</p>
        <p>Thank you for choosing us.</p>
        <br>
        <p>Best regards,</p>
        <p><strong>{$config['company_name']} Team</strong></p>
    </div>";
    
    $mail->Body = $visitorHtml;
    $mail->send();

    jsonResponse(true, 'Enquiry sent successfully.');
} catch (Exception $e) {
    // Log exception details securely on the server instead of exposing to frontend
    error_log(\"Mail Error: {$mail->ErrorInfo}\");
    jsonResponse(false, 'Unable to send enquiry.', 500);
}
