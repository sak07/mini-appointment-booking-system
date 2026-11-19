<!doctype html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <?php wp_head(); // WordPress adds the <title>, our stylesheet, and plugin assets here ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<header class="site-header">
    <div class="container">
        <a class="site-title" href="<?php echo esc_url(home_url('/')); ?>"><?php bloginfo('name'); ?></a>

        <nav class="site-nav" aria-label="Main">
            <a href="<?php echo esc_url(home_url('/')); ?>">Home</a>
            <a href="<?php echo esc_url(home_url('/#services')); ?>">Services</a>
            <a href="<?php echo esc_url(bookeasy_booking_url('/my-bookings')); ?>">My bookings</a>
            <a class="button small" href="<?php echo esc_url(bookeasy_booking_url('/')); ?>">Book now</a>
        </nav>
    </div>
</header>

<main><?php // closed in footer.php ?>
