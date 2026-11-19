<?php
/**
 * Landing page (WordPress uses front-page.php for the site's home page).
 * Sections: welcome with booking button, services (custom post type), how booking works, call to action.
 */
get_header();
?>

<section class="hero">
    <div class="container">
        <h1>Grooming and wellness, booked in a minute</h1>
        <p>Haircuts, beard trims, facials and massage. See the free times for any day and book the one that suits you.</p>
        <a class="button light" href="<?php echo esc_url(bookeasy_booking_url('/')); ?>">Book an appointment</a>
    </div>
</section>

<section class="section" id="services">
    <div class="container">
        <h2>Services and prices</h2>
        <p class="lead">All prices include a consultation. Pay at the studio after your appointment.</p>

        <?php $services = bookeasy_get_services(); // live from the booking app's API ?>
        <?php if ($services === null) : ?>
            <p class="notice">
                Services can't be loaded right now.
                <a href="<?php echo esc_url(bookeasy_booking_url('/')); ?>">See them in the booking app</a>.
            </p>
        <?php elseif (! $services) : ?>
            <p class="lead">Services will be listed here soon.</p>
        <?php else : ?>
            <ul class="price-list">
                <?php foreach ($services as $service) : ?>
                    <?php get_template_part('template-parts/service-card', null, ['service' => $service]); ?>
                <?php endforeach; ?>
            </ul>
        <?php endif; ?>
    </div>
</section>

<section class="section alt">
    <div class="container">
        <h2>How booking works</h2>
        <p class="lead">No phone calls, no waiting.</p>
        <ol class="steps">
            <li>
                <h3>Choose a service</h3>
                <p>Check what's included, how long it takes and the price.</p>
            </li>
            <li>
                <h3>Pick a free time</h3>
                <p>Times that are already taken are crossed out.</p>
            </li>
            <li>
                <h3>Get your confirmation</h3>
                <p>We email you the details as soon as you book.</p>
            </li>
        </ol>
    </div>
</section>

<section class="cta">
    <div class="container">
        <h2>Ready when you are.</h2>
        <a class="button" href="<?php echo esc_url(bookeasy_booking_url('/')); ?>">Open the booking app</a>
    </div>
</section>

<?php get_footer(); ?>
