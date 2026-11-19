<?php
/**
 * One service as a price-list row (same layout as the React booking app).
 * $args['service'] is one service from the Laravel API:
 *   [id, name, description, duration_minutes, price, is_active]
 * The name opens the service page in the booking app; "Book" opens its booking page directly.
 */
$service = $args['service'];
?>
<li class="price-row">
    <div class="price-info">
        <h3><a href="<?php echo esc_url(bookeasy_booking_url('/services/' . $service['id'])); ?>"><?php echo esc_html($service['name']); ?></a></h3>
        <?php if (! empty($service['description'])) : ?>
            <p class="excerpt"><?php echo esc_html($service['description']); ?></p>
        <?php endif; ?>
    </div>
    <div class="price-meta">
        <span class="duration"><?php echo esc_html($service['duration_minutes']); ?> min</span>
        <span class="price"><?php echo esc_html(bookeasy_format_price($service['price'])); ?></span>
    </div>
    <a class="button small" href="<?php echo esc_url(bookeasy_booking_url('/book/' . $service['id'])); ?>">Book</a>
</li>
