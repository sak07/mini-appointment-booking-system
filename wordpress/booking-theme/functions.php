<?php
/**
 * BookEasy theme setup.
 *
 * 1. Where the booking app and its API live
 * 2. Theme features + stylesheet
 * 3. Services: read live from the Laravel API (one source of truth for names, prices, durations)
 */

// ---------------------------------------------------------------------------
// 1. Addresses (set as environment variables on the container in docker-compose.yml)
//    BOOKING_APP_URL: the React app the visitor's browser opens  → http://localhost:5173
//    BOOKING_API_URL: the Laravel API that WordPress itself calls → http://host.docker.internal:8000/api
//                     ("localhost" inside the container is the container, so Docker's name for the Mac is used)
// ---------------------------------------------------------------------------
define('BOOKEASY_BOOKING_URL', rtrim(getenv('BOOKING_APP_URL') ?: 'http://localhost:5173', '/'));
define('BOOKEASY_API_URL', rtrim(getenv('BOOKING_API_URL') ?: 'http://host.docker.internal:8000/api', '/'));

function bookeasy_booking_url(string $path = ''): string
{
    return BOOKEASY_BOOKING_URL . $path;
}

// ---------------------------------------------------------------------------
// 2. Theme features + stylesheet
// ---------------------------------------------------------------------------
add_action('after_setup_theme', function () {
    add_theme_support('title-tag'); // WordPress manages the <title>
});

// Browser tab title: "BookEasy | Online appointment booking" (WordPress's default separator is a dash).
add_filter('document_title_separator', fn () => '|');

add_action('wp_enqueue_scripts', function () {
    $theme = wp_get_theme();
    // Same fonts as the booking app: Bricolage Grotesque (headings) + Figtree (text)
    wp_enqueue_style(
        'bookeasy-fonts',
        'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=Figtree:wght@400;500;600&display=swap',
        [],
        null
    );
    wp_enqueue_style('bookeasy-style', get_stylesheet_uri(), ['bookeasy-fonts'], $theme->get('Version'));
});

// ---------------------------------------------------------------------------
// 3. Services from the Laravel API
// ---------------------------------------------------------------------------

/**
 * The bookable services, exactly as the booking app has them (only active ones).
 * The answer is cached for 60 seconds with a WordPress "transient", so the API isn't called on every page view.
 * Returns an array of services, or null if the booking API can't be reached.
 */
function bookeasy_get_services(): ?array
{
    $cached = get_transient('bookeasy_services');
    if ($cached !== false) {
        return $cached;
    }

    $response = wp_remote_get(BOOKEASY_API_URL . '/services', [
        'timeout' => 3,
        'headers' => ['Accept' => 'application/json'],
    ]);

    if (is_wp_error($response) || wp_remote_retrieve_response_code($response) !== 200) {
        return null; // API down: the page shows a friendly message instead
    }

    $services = json_decode(wp_remote_retrieve_body($response), true)['data'] ?? [];
    set_transient('bookeasy_services', $services, MINUTE_IN_SECONDS);

    return $services;
}

// 80 → "AED 80", 80.5 → "AED 80.50" (same format as the booking app).
function bookeasy_format_price($price): string
{
    $price = (float) $price;
    return 'AED ' . (floor($price) == $price ? (int) $price : number_format($price, 2, '.', ''));
}
