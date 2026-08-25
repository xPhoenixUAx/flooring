<?php
declare(strict_types=1);

const SUCCESS_MESSAGE = 'Thank you! We have successfully received your request. Our team will review your information and get back to you shortly.';
const GENERIC_ERROR = 'We could not send your request. Please review the highlighted fields and try again.';
const SERVER_ERROR = 'We could not send your request right now. Please try again later.';
const MAX_REQUEST_BYTES = 24000;
const MAX_FIELD_BYTES = 6000;
const RATE_WINDOW_SECONDS = 600;
const RATE_MAX_ATTEMPTS = 8;

header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Cache-Control: no-store');

$wantsJson = str_contains(strtolower((string) ($_SERVER['HTTP_ACCEPT'] ?? '')), 'application/json');

function text_length(string $value): int
{
    return function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
}

function clean_text(string $value): string
{
    $value = trim($value);
    return preg_replace('/[^\S\r\n]+/u', ' ', $value) ?? $value;
}

function safe_html(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function respond(int $status, bool $success, string $message, array $errors = []): never
{
    global $wantsJson;
    http_response_code($status);

    if ($wantsJson) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(
            ['success' => $success, 'message' => $message, 'errors' => (object) $errors],
            JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
        );
        exit;
    }

    header('Content-Type: text/html; charset=utf-8');
    $title = $success ? 'Request received' : 'Request not sent';
    $safeTitle = safe_html($title);
    $safeMessage = safe_html($message);
    $tone = $success ? '#276a50' : '#a43f32';
    echo <<<HTML
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{$safeTitle} | Flooring Match</title>
  <style>body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;color:#18201e;background:#171e1d;font:16px/1.55 Arial,sans-serif}.sheet{width:min(100%,680px);padding:clamp(32px,7vw,72px);box-sizing:border-box;background:#f3eee3;border-top:5px solid {$tone};box-shadow:0 24px 70px rgba(0,0,0,.3)}h1{margin:0 0 18px;font:400 clamp(2.4rem,8vw,4.5rem)/.95 Georgia,serif}p{margin:0 0 28px}.back{display:inline-block;padding:13px 18px;color:#f3eee5;background:#18201e;text-decoration:none}</style>
</head>
<body>
  <main class="sheet" tabindex="-1">
    <h1>{$safeTitle}</h1>
    <p>{$safeMessage}</p>
    <a class="back" href="index.html#request-form">Return to the request form</a>
  </main>
</body>
</html>
HTML;
    exit;
}

function scalar_post(string $name): string
{
    $value = $_POST[$name] ?? '';
    return is_string($value) ? clean_text($value) : '';
}

function add_error(array &$errors, string $field, string $message): void
{
    if (!isset($errors[$field])) {
        $errors[$field] = $message;
    }
}

function in_allowed(string $value, array $allowed, bool $optional = false): bool
{
    return ($optional && $value === '') || in_array($value, $allowed, true);
}

function config_string(string $source, string $key): string
{
    $escapedKey = preg_quote($key, '/');
    $pattern = '/(?:^|[\s,{])' . $escapedKey . '\s*:\s*(["\'])(.*?)\1/s';
    if (!preg_match($pattern, $source, $match)) {
        return '';
    }

    return clean_text(stripcslashes($match[2]));
}

function same_origin_is_plausible(string $configuredUrl): bool
{
    $source = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
    if ($source === '') {
        $source = (string) ($_SERVER['HTTP_REFERER'] ?? '');
    }
    if ($source === '') {
        return true;
    }

    $sourceHost = strtolower((string) parse_url($source, PHP_URL_HOST));
    if ($sourceHost === '') {
        return false;
    }

    if ($configuredUrl !== '') {
        $allowedHost = strtolower((string) parse_url($configuredUrl, PHP_URL_HOST));
        return $allowedHost !== '' && hash_equals($allowedHost, $sourceHost);
    }

    $requestHost = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
    $requestHost = preg_replace('/:\d+$/', '', $requestHost) ?? '';
    return $requestHost === '' || hash_equals($requestHost, $sourceHost);
}

function derived_from_email(string $configuredFrom, string $websiteUrl, string $recipient): string
{
    if (filter_var($configuredFrom, FILTER_VALIDATE_EMAIL)) {
        return $configuredFrom;
    }

    $domain = strtolower((string) parse_url($websiteUrl, PHP_URL_HOST));
    if ($domain === '' && filter_var($recipient, FILTER_VALIDATE_EMAIL)) {
        $domain = strtolower((string) substr(strrchr($recipient, '@') ?: '', 1));
    }
    if ($domain === '') {
        $domain = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
        $domain = preg_replace('/:\d+$/', '', $domain) ?? '';
    }

    $domain = preg_replace('/[^a-z0-9.-]/i', '', $domain) ?? '';
    return $domain !== '' ? 'website@' . $domain : '';
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, false, 'Method not allowed.');
}

$contentLength = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($contentLength > MAX_REQUEST_BYTES) {
    respond(413, false, GENERIC_ERROR);
}

foreach ($_POST as $value) {
    if (!is_string($value) || strlen($value) > MAX_FIELD_BYTES) {
        respond(400, false, GENERIC_ERROR);
    }
}

$configPath = __DIR__ . DIRECTORY_SEPARATOR . 'config' . DIRECTORY_SEPARATOR . 'site-config.js';
$configSource = is_readable($configPath) ? file_get_contents($configPath) : false;
if (!is_string($configSource)) {
    respond(503, false, SERVER_ERROR);
}

$siteName = config_string($configSource, 'brandName') ?: 'Flooring Match';
$recipient = config_string($configSource, 'corporateEmail');
$websiteUrl = config_string($configSource, 'websiteUrl');
$configuredFrom = config_string($configSource, 'formFromEmail');

if (!same_origin_is_plausible($websiteUrl)) {
    respond(403, false, SERVER_ERROR);
}

if (scalar_post('website') !== '') {
    respond(200, true, SUCCESS_MESSAGE);
}

$renderedAt = filter_var($_POST['rendered_at'] ?? null, FILTER_VALIDATE_INT);
if ($renderedAt !== false && (time() - (int) $renderedAt) < 2) {
    respond(400, false, GENERIC_ERROR);
}

if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'httponly' => true,
        'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
        'samesite' => 'Lax',
    ]);
    @session_start();
}

if (session_status() === PHP_SESSION_ACTIVE) {
    $now = time();
    $attempts = array_values(array_filter(
        is_array($_SESSION['flooring_form_attempts'] ?? null) ? $_SESSION['flooring_form_attempts'] : [],
        static fn ($timestamp): bool => is_int($timestamp) && ($now - $timestamp) < RATE_WINDOW_SECONDS
    ));
    if (count($attempts) >= RATE_MAX_ATTEMPTS) {
        respond(429, false, SERVER_ERROR);
    }
    $attempts[] = $now;
    $_SESSION['flooring_form_attempts'] = $attempts;
}

$formType = scalar_post('form_type') ?: 'service';
$errors = [];
$emailBody = '';
$replyTo = '';
$subject = '';

if ($formType === 'homeowner') {
    $projectDirection = scalar_post('project_direction');
    $roomArea = scalar_post('room_area');
    $currentSurface = scalar_post('current_surface');
    $materialDirection = scalar_post('material_direction');
    $postalCode = scalar_post('postal_code');
    $desiredTiming = scalar_post('desired_timing');
    $approximateSize = scalar_post('approximate_size');
    $propertyType = scalar_post('property_type');
    $projectDetails = scalar_post('project_details');
    $fullName = scalar_post('full_name');
    $email = scalar_post('email');
    $preferredContactTime = scalar_post('preferred_contact_time');
    $privacyConsent = scalar_post('privacy_consent');

    $directions = ['Installation & replacement', 'Repair & refinishing', 'Not sure'];
    $surfaces = ['Hardwood', 'Engineered wood', 'Laminate', 'Vinyl / resilient', 'Tile', 'Carpet', 'Concrete', 'Multiple / mixed surfaces', 'Not sure', 'Other'];
    $materials = ['Hardwood', 'Engineered wood', 'Laminate', 'Vinyl / resilient', 'Tile', 'Carpet', 'Still exploring', 'Not sure', 'Other'];
    $timings = ['As soon as practical', 'Within 1 month', 'Within 1–3 months', 'Within 3–6 months', 'More than 6 months', 'Researching / no fixed timing'];
    $sizes = ['Under 250 sq ft', '250–500 sq ft', '500–1,000 sq ft', 'Over 1,000 sq ft', 'Not sure'];
    $properties = ['Single-family home', 'Apartment / condo', 'Townhome', 'Rental property', 'Commercial space', 'Other'];
    $contactTimes = ['Morning', 'Afternoon', 'Evening'];

    if (!in_allowed($projectDirection, $directions)) add_error($errors, 'project_direction', 'Choose a project direction.');
    if ($roomArea === '' || text_length($roomArea) > 140) add_error($errors, 'room_area', 'Enter the room or area.');
    if (!in_allowed($currentSurface, $surfaces, true)) add_error($errors, 'current_surface', 'Choose a valid current surface.');
    if (!in_allowed($materialDirection, $materials, true)) add_error($errors, 'material_direction', 'Choose a valid material direction.');
    if (!preg_match('/^\d{5}(-\d{4})?$/', $postalCode)) add_error($errors, 'postal_code', 'Enter a five-digit ZIP code or ZIP+4.');
    if (!in_allowed($desiredTiming, $timings)) add_error($errors, 'desired_timing', 'Choose a desired timing.');
    if (!in_allowed($approximateSize, $sizes, true)) add_error($errors, 'approximate_size', 'Choose a valid approximate size.');
    if (!in_allowed($propertyType, $properties, true)) add_error($errors, 'property_type', 'Choose a valid property type.');
    if (text_length($projectDetails) < 20 || text_length($projectDetails) > 2000) add_error($errors, 'project_details', 'Enter 20 to 2,000 characters about the project.');
    if ($fullName === '' || text_length($fullName) > 120 || preg_match('/[\r\n]/', $fullName)) add_error($errors, 'full_name', 'Enter your full name.');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254 || preg_match('/[\r\n]/', $email)) add_error($errors, 'email', 'Enter a valid email address.');
    if (!in_allowed($preferredContactTime, $contactTimes, true)) add_error($errors, 'preferred_contact_time', 'Choose a valid preferred contact time.');
    if ($privacyConsent !== 'yes') add_error($errors, 'privacy_consent', 'Consent is required to send this form.');

    $replyTo = $email;
    $subject = '[' . $siteName . '] New homeowner project request';
    $emailBody = "FORM TYPE: Homeowner flooring request\n";
    $emailBody .= 'SUBMITTED AT: ' . gmdate('Y-m-d H:i:s') . " UTC\n\n";
    $emailBody .= "CONTACT\nFull name: {$fullName}\nEmail: {$email}\nPreferred contact time: " . ($preferredContactTime ?: 'No preference') . "\n\n";
    $emailBody .= "PROJECT\nDirection: {$projectDirection}\nRoom or area: {$roomArea}\nCurrent surface: " . ($currentSurface ?: 'Not provided') . "\n";
    $emailBody .= 'Material direction: ' . ($materialDirection ?: 'Not provided') . "\nZIP code: {$postalCode}\nDesired timing: {$desiredTiming}\n";
    $emailBody .= 'Approximate size: ' . ($approximateSize ?: 'Not provided') . "\nProperty type: " . ($propertyType ?: 'Not provided') . "\n\n";
    $emailBody .= "DETAILS\n{$projectDetails}\n\nCONSENT\nPrivacy consent: Yes\n";
} elseif ($formType === 'service') {
    $name = scalar_post('name');
    $email = scalar_post('email');
    $service = scalar_post('service');
    $details = scalar_post('details');
    $consent = scalar_post('consent');
    $allowedServices = ['Floor Installation & Replacement', 'Floor Repair & Refinishing'];

    if ($name === '' || text_length($name) > 100 || preg_match('/[\r\n]/', $name)) add_error($errors, 'name', 'Please enter a valid name.');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254 || preg_match('/[\r\n]/', $email)) add_error($errors, 'email', 'Please enter a valid email address.');
    if (!in_allowed($service, $allowedServices)) add_error($errors, 'service', 'Please choose a valid service.');
    if ($details === '' || text_length($details) > 4000) add_error($errors, 'details', 'Please provide valid project details.');
    if ($consent !== 'yes') add_error($errors, 'consent', 'Consent is required.');

    $replyTo = $email;
    $subject = '[' . $siteName . '] New service-page project request';
    $emailBody = "FORM TYPE: Service-page flooring request\n";
    $emailBody .= 'SUBMITTED AT: ' . gmdate('Y-m-d H:i:s') . " UTC\n\n";
    $emailBody .= "Name: {$name}\nEmail: {$email}\nService: {$service}\n\nProject details:\n{$details}\n\nConsent: Yes\n";
} else {
    respond(422, false, GENERIC_ERROR, ['form_type' => 'Choose a valid form type.']);
}

if ($errors !== []) {
    respond(422, false, GENERIC_ERROR, $errors);
}

$fromEmail = derived_from_email($configuredFrom, $websiteUrl, $recipient);
if (!filter_var($recipient, FILTER_VALIDATE_EMAIL) || !filter_var($fromEmail, FILTER_VALIDATE_EMAIL)) {
    error_log('Flooring Match form delivery is not configured.');
    respond(503, false, SERVER_ERROR);
}

if (preg_match('/[\r\n]/', $replyTo . $fromEmail . $recipient . $subject)) {
    respond(422, false, GENERIC_ERROR);
}

$submissionHash = hash('sha256', $formType . "\0" . $replyTo . "\0" . $emailBody);
if (session_status() === PHP_SESSION_ACTIVE && isset($_SESSION['flooring_last_submission'])) {
    $last = $_SESSION['flooring_last_submission'];
    if (is_array($last) && ($last['hash'] ?? '') === $submissionHash && (time() - (int) ($last['time'] ?? 0)) < 30) {
        respond(429, false, SERVER_ERROR);
    }
}

$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'From: ' . $siteName . ' Website <' . $fromEmail . '>',
    'Reply-To: ' . $replyTo,
];

$sent = @mail($recipient, $subject, $emailBody, implode("\r\n", $headers));
if (!$sent) {
    error_log('Flooring Match form mail transport failed.');
    respond(500, false, SERVER_ERROR);
}

if (session_status() === PHP_SESSION_ACTIVE) {
    $_SESSION['flooring_last_submission'] = ['hash' => $submissionHash, 'time' => time()];
}

respond(200, true, SUCCESS_MESSAGE);
