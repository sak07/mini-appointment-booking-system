<?php
/**
 * Fallback template (every WordPress theme must have index.php).
 * Used for anything without a more specific template: normal pages, blog posts, search, 404.
 */
get_header();
?>

<div class="container">
    <article class="content">
        <?php if (have_posts()) : ?>
            <?php while (have_posts()) : the_post(); ?>
                <h1><?php the_title(); ?></h1>
                <?php the_content(); ?>
            <?php endwhile; ?>
        <?php else : ?>
            <h1>Page not found</h1>
            <p>Sorry, we couldn't find that page. <a href="<?php echo esc_url(home_url('/')); ?>">Go to the home page</a>.</p>
        <?php endif; ?>
    </article>
</div>

<?php get_footer(); ?>
