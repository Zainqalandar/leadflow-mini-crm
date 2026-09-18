<?php
/**
 * LeadFlow settings and lead-management screens in wp-admin.
 *
 * @package LeadFlowConnector
 */

if (!defined('ABSPATH')) {
    exit;
}

final class LeadFlow_Admin {
    private const LEADS_SLUG = 'leadflow-leads';
    private const SETTINGS_SLUG = 'leadflow-settings';
    private const DETAILS_SLUG = 'leadflow-lead-details';

    private LeadFlow_Lead_Repository $repository;
    private LeadFlow_API_Client $api_client;

    public function __construct(LeadFlow_Lead_Repository $repository, LeadFlow_API_Client $api_client) {
        $this->repository = $repository;
        $this->api_client = $api_client;

        add_action('admin_menu', array($this, 'register_menu'));
        add_action('admin_init', array($this, 'register_settings'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_assets'));
        add_action('admin_post_leadflow_retry_sync', array($this, 'retry_sync'));
    }

    public function register_menu(): void {
        add_menu_page(
            __('LeadFlow CRM', 'leadflow-connector'),
            __('LeadFlow', 'leadflow-connector'),
            'manage_options',
            self::LEADS_SLUG,
            array($this, 'render_leads_page'),
            'dashicons-chart-line',
            26
        );

        add_submenu_page(
            self::LEADS_SLUG,
            __('All leads', 'leadflow-connector'),
            __('All leads', 'leadflow-connector'),
            'manage_options',
            self::LEADS_SLUG,
            array($this, 'render_leads_page')
        );

        add_submenu_page(
            self::LEADS_SLUG,
            __('LeadFlow settings', 'leadflow-connector'),
            __('Settings', 'leadflow-connector'),
            'manage_options',
            self::SETTINGS_SLUG,
            array($this, 'render_settings_page')
        );

        add_submenu_page(
            null,
            __('Lead details', 'leadflow-connector'),
            __('Lead details', 'leadflow-connector'),
            'manage_options',
            self::DETAILS_SLUG,
            array($this, 'render_details_page')
        );
    }

    public function register_settings(): void {
        register_setting(
            'leadflow_connector_settings_group',
            LEADFLOW_CONNECTOR_OPTION,
            array(
                'type' => 'array',
                'sanitize_callback' => array($this, 'sanitize_settings'),
                'default' => array(),
            )
        );
    }

    /**
     * @param mixed $input
     * @return array<string, string>
     */
    public function sanitize_settings($input): array {
        $input = is_array($input) ? $input : array();
        $existing = get_option(LEADFLOW_CONNECTOR_OPTION, array());
        $api_url = isset($input['api_url']) && is_string($input['api_url']) ? trim($input['api_url']) : '';
        $api_secret = isset($input['api_secret']) && is_string($input['api_secret']) ? trim($input['api_secret']) : '';

        if ($api_url !== '') {
            $parsed_url = wp_parse_url($api_url);
            $is_valid_url = is_array($parsed_url)
                && isset($parsed_url['scheme'], $parsed_url['host'])
                && in_array(strtolower((string) $parsed_url['scheme']), array('http', 'https'), true);

            if (!$is_valid_url) {
                add_settings_error(
                    LEADFLOW_CONNECTOR_OPTION,
                    'leadflow_invalid_api_url',
                    __('Enter a complete http:// or https:// Node API endpoint.', 'leadflow-connector')
                );
                $api_url = isset($existing['api_url']) ? (string) $existing['api_url'] : '';
            } else {
                $api_url = esc_url_raw($api_url);
            }
        }

        if ($api_secret === '') {
            $api_secret = isset($existing['api_secret']) ? (string) $existing['api_secret'] : '';
        }

        return array(
            'api_url' => $api_url,
            'api_secret' => $api_secret,
        );
    }

    public function enqueue_assets(string $hook): void {
        if (strpos($hook, 'leadflow') === false) {
            return;
        }

        wp_enqueue_style(
            'leadflow-connector-admin',
            LEADFLOW_CONNECTOR_URL . 'admin/css/leadflow-admin.css',
            array(),
            LEADFLOW_CONNECTOR_VERSION
        );
    }

    public function render_leads_page(): void {
        if (!current_user_can('manage_options')) {
            return;
        }

        $current_page = isset($_GET['paged']) ? max(1, absint($_GET['paged'])) : 1;
        $query = new WP_Query(
            array(
                'post_type' => LeadFlow_Lead_Repository::POST_TYPE,
                'post_status' => 'publish',
                'posts_per_page' => 15,
                'paged' => $current_page,
                'orderby' => 'date',
                'order' => 'DESC',
            )
        );
        $total_leads = wp_count_posts(LeadFlow_Lead_Repository::POST_TYPE);
        $settings = get_option(LEADFLOW_CONNECTOR_OPTION, array());
        $configured = !empty($settings['api_url']) && !empty($settings['api_secret']);
        ?>
        <div class="wrap leadflow-admin-wrap">
            <section class="leadflow-admin-hero">
                <div>
                    <span><?php esc_html_e('LEADFLOW CONNECTOR', 'leadflow-connector'); ?></span>
                    <h1><?php esc_html_e('WordPress leads, in one calm place.', 'leadflow-connector'); ?></h1>
                    <p><?php esc_html_e('Every form submission is stored here first, then securely synced to your LeadFlow CRM.', 'leadflow-connector'); ?></p>
                </div>
                <div class="leadflow-admin-hero__actions">
                    <a href="<?php echo esc_url(admin_url('admin.php?page=' . self::SETTINGS_SLUG)); ?>" class="leadflow-button leadflow-button--light">
                        <span class="dashicons dashicons-admin-generic" aria-hidden="true"></span>
                        <?php echo $configured ? esc_html__('Review API settings', 'leadflow-connector') : esc_html__('Configure API sync', 'leadflow-connector'); ?>
                    </a>
                </div>
            </section>

            <?php $this->render_admin_notice(); ?>

            <div class="leadflow-admin-stats">
                <article><span class="leadflow-admin-stats__icon leadflow-admin-stats__icon--blue dashicons dashicons-groups"></span><div><small><?php esc_html_e('Total submissions', 'leadflow-connector'); ?></small><strong><?php echo esc_html(number_format_i18n((int) $total_leads->publish)); ?></strong></div></article>
                <article><span class="leadflow-admin-stats__icon leadflow-admin-stats__icon--green dashicons dashicons-yes-alt"></span><div><small><?php esc_html_e('Sync connection', 'leadflow-connector'); ?></small><strong><?php echo $configured ? esc_html__('Configured', 'leadflow-connector') : esc_html__('Needs setup', 'leadflow-connector'); ?></strong></div></article>
                <article><span class="leadflow-admin-stats__icon leadflow-admin-stats__icon--gold dashicons dashicons-database-view"></span><div><small><?php esc_html_e('Storage', 'leadflow-connector'); ?></small><strong><?php esc_html_e('WordPress', 'leadflow-connector'); ?></strong></div></article>
            </div>

            <section class="leadflow-admin-panel">
                <div class="leadflow-admin-panel__heading">
                    <div><h2><?php esc_html_e('Submitted leads', 'leadflow-connector'); ?></h2><p><?php esc_html_e('Latest enquiries and their CRM sync result.', 'leadflow-connector'); ?></p></div>
                    <span class="leadflow-count-badge"><?php echo esc_html(sprintf(_n('%d lead', '%d leads', (int) $query->found_posts, 'leadflow-connector'), (int) $query->found_posts)); ?></span>
                </div>
                <?php if ($query->have_posts()) : ?>
                    <div class="leadflow-table-scroll">
                        <table class="widefat fixed striped leadflow-admin-table">
                            <thead><tr><th><?php esc_html_e('Lead', 'leadflow-connector'); ?></th><th><?php esc_html_e('Project', 'leadflow-connector'); ?></th><th><?php esc_html_e('Submitted', 'leadflow-connector'); ?></th><th><?php esc_html_e('CRM sync', 'leadflow-connector'); ?></th><th><span class="screen-reader-text"><?php esc_html_e('Actions', 'leadflow-connector'); ?></span></th></tr></thead>
                            <tbody>
                            <?php while ($query->have_posts()) : $query->the_post(); ?>
                                <?php $this->render_lead_table_row(get_the_ID()); ?>
                            <?php endwhile; ?>
                            </tbody>
                        </table>
                    </div>
                    <?php $this->render_pagination($query, $current_page); ?>
                <?php else : ?>
                    <div class="leadflow-empty-state"><span class="dashicons dashicons-forms"></span><h2><?php esc_html_e('No leads yet', 'leadflow-connector'); ?></h2><p><?php esc_html_e('Add the [leadflow_form] shortcode to any page. New enquiries will appear here.', 'leadflow-connector'); ?></p></div>
                <?php endif; wp_reset_postdata(); ?>
            </section>
        </div>
        <?php
    }

    public function render_settings_page(): void {
        if (!current_user_can('manage_options')) {
            return;
        }

        $settings = get_option(LEADFLOW_CONNECTOR_OPTION, array());
        $api_url = isset($settings['api_url']) ? (string) $settings['api_url'] : '';
        $has_secret = !empty($settings['api_secret']);
        ?>
        <div class="wrap leadflow-admin-wrap">
            <section class="leadflow-page-heading">
                <a class="leadflow-back-link" href="<?php echo esc_url(admin_url('admin.php?page=' . self::LEADS_SLUG)); ?>">← <?php esc_html_e('Back to leads', 'leadflow-connector'); ?></a>
                <span><?php esc_html_e('CONNECTION SETTINGS', 'leadflow-connector'); ?></span>
                <h1><?php esc_html_e('Connect WordPress to your CRM.', 'leadflow-connector'); ?></h1>
                <p><?php esc_html_e('These credentials stay in WordPress and are used only for server-to-server lead sync.', 'leadflow-connector'); ?></p>
            </section>

            <div class="leadflow-settings-layout">
                <section class="leadflow-admin-panel leadflow-settings-panel">
                    <div class="leadflow-admin-panel__heading"><div><h2><?php esc_html_e('Node API connection', 'leadflow-connector'); ?></h2><p><?php esc_html_e('Use the secure WordPress integration endpoint from this project.', 'leadflow-connector'); ?></p></div></div>
                    <?php settings_errors(LEADFLOW_CONNECTOR_OPTION); ?>
                    <form action="options.php" method="post" class="leadflow-settings-form">
                        <?php settings_fields('leadflow_connector_settings_group'); ?>
                        <div class="leadflow-setting-field">
                            <label for="leadflow-api-url"><?php esc_html_e('Node API endpoint', 'leadflow-connector'); ?></label>
                            <input id="leadflow-api-url" name="<?php echo esc_attr(LEADFLOW_CONNECTOR_OPTION); ?>[api_url]" type="url" value="<?php echo esc_attr($api_url); ?>" placeholder="http://host.docker.internal:5000/api/integrations/wordpress/leads" autocomplete="off">
                            <p><?php esc_html_e('For the Docker setup in this repository, use host.docker.internal so WordPress can reach the API running on your computer.', 'leadflow-connector'); ?></p>
                        </div>
                        <div class="leadflow-setting-field">
                            <label for="leadflow-api-secret"><?php esc_html_e('Integration API secret', 'leadflow-connector'); ?></label>
                            <input id="leadflow-api-secret" name="<?php echo esc_attr(LEADFLOW_CONNECTOR_OPTION); ?>[api_secret]" type="password" value="" placeholder="<?php echo $has_secret ? esc_attr__('Secret saved — leave blank to keep it', 'leadflow-connector') : esc_attr__('Paste API_SECRET from api/.env', 'leadflow-connector'); ?>" autocomplete="new-password">
                            <p><?php echo $has_secret ? esc_html__('A secret is already saved. Enter a new value only when you want to replace it.', 'leadflow-connector') : esc_html__('This must match API_SECRET in api/.env. It is never displayed after saving.', 'leadflow-connector'); ?></p>
                        </div>
                        <div class="leadflow-settings-actions"><button type="submit" class="leadflow-button leadflow-button--primary"><?php esc_html_e('Save connection settings', 'leadflow-connector'); ?></button></div>
                    </form>
                </section>
                <aside class="leadflow-connection-note">
                    <span class="dashicons dashicons-shield-alt"></span>
                    <h2><?php esc_html_e('How sync stays protected', 'leadflow-connector'); ?></h2>
                    <ol><li><?php esc_html_e('The public form is protected with a WordPress nonce and server-side validation.', 'leadflow-connector'); ?></li><li><?php esc_html_e('Leads save in WordPress before any network request is made.', 'leadflow-connector'); ?></li><li><?php esc_html_e('The API secret is sent only from your server in the X-API-Secret header.', 'leadflow-connector'); ?></li><li><?php esc_html_e('Failed syncs remain visible and can be retried from the lead record.', 'leadflow-connector'); ?></li></ol>
                </aside>
            </div>
        </div>
        <?php
    }

    public function render_details_page(): void {
        if (!current_user_can('manage_options')) {
            return;
        }

        $post_id = isset($_GET['lead_id']) ? absint($_GET['lead_id']) : 0;
        $post = get_post($post_id);
        if (!$post || $post->post_type !== LeadFlow_Lead_Repository::POST_TYPE) {
            wp_die(esc_html__('This LeadFlow lead could not be found.', 'leadflow-connector'));
        }

        $lead = $this->repository->get($post_id);
        ?>
        <div class="wrap leadflow-admin-wrap">
            <section class="leadflow-page-heading leadflow-page-heading--compact">
                <a class="leadflow-back-link" href="<?php echo esc_url(admin_url('admin.php?page=' . self::LEADS_SLUG)); ?>">← <?php esc_html_e('Back to all leads', 'leadflow-connector'); ?></a>
                <span><?php esc_html_e('LEAD RECORD', 'leadflow-connector'); ?></span>
                <div class="leadflow-record-heading"><div><h1><?php echo esc_html($lead['name']); ?></h1><p><?php echo esc_html(get_the_date(get_option('date_format') . ' · ' . get_option('time_format'), $post_id)); ?></p></div><?php $this->render_sync_badge($lead['sync_status']); ?></div>
            </section>
            <?php $this->render_admin_notice(); ?>
            <div class="leadflow-details-layout">
                <section class="leadflow-admin-panel leadflow-detail-card"><div class="leadflow-admin-panel__heading"><div><h2><?php esc_html_e('Contact & project details', 'leadflow-connector'); ?></h2><p><?php esc_html_e('Captured directly from the WordPress lead form.', 'leadflow-connector'); ?></p></div></div>
                    <dl class="leadflow-details-list"><div><dt><?php esc_html_e('Email', 'leadflow-connector'); ?></dt><dd><a href="mailto:<?php echo esc_attr($lead['email']); ?>"><?php echo esc_html($lead['email']); ?></a></dd></div><div><dt><?php esc_html_e('Phone', 'leadflow-connector'); ?></dt><dd><a href="tel:<?php echo esc_attr($lead['phone']); ?>"><?php echo esc_html($lead['phone']); ?></a></dd></div><div><dt><?php esc_html_e('Service', 'leadflow-connector'); ?></dt><dd><?php echo esc_html($lead['service']); ?></dd></div><div><dt><?php esc_html_e('Budget range', 'leadflow-connector'); ?></dt><dd><?php echo esc_html($lead['budget_range']); ?></dd></div><div class="leadflow-details-list__message"><dt><?php esc_html_e('Project message', 'leadflow-connector'); ?></dt><dd><?php echo nl2br(esc_html($lead['message'])); ?></dd></div></dl>
                </section>
                <aside class="leadflow-admin-panel leadflow-sync-card"><div class="leadflow-admin-panel__heading"><div><h2><?php esc_html_e('CRM sync', 'leadflow-connector'); ?></h2><p><?php esc_html_e('Latest secure API delivery result.', 'leadflow-connector'); ?></p></div></div><?php $this->render_sync_badge($lead['sync_status']); ?><p class="leadflow-sync-message"><?php echo esc_html($lead['sync_message'] ?: __('No sync attempt has been made yet.', 'leadflow-connector')); ?></p><dl class="leadflow-sync-meta"><div><dt><?php esc_html_e('Last attempt', 'leadflow-connector'); ?></dt><dd><?php echo $lead['last_synced_at'] ? esc_html(mysql2date(get_option('date_format') . ' ' . get_option('time_format'), $lead['last_synced_at'])) : esc_html__('Not yet', 'leadflow-connector'); ?></dd></div><div><dt><?php esc_html_e('CRM record ID', 'leadflow-connector'); ?></dt><dd class="leadflow-code"><?php echo $lead['remote_lead_id'] ? esc_html($lead['remote_lead_id']) : '—'; ?></dd></div></dl><?php if ($lead['sync_status'] !== 'synced') : $this->render_retry_form($post_id); endif; ?></aside>
            </div>
        </div>
        <?php
    }

    public function retry_sync(): void {
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('You are not allowed to retry this sync.', 'leadflow-connector'), '', array('response' => 403));
        }

        $post_id = isset($_POST['lead_id']) ? absint($_POST['lead_id']) : 0;
        check_admin_referer('leadflow_retry_sync_' . $post_id);
        $post = get_post($post_id);

        if (!$post || $post->post_type !== LeadFlow_Lead_Repository::POST_TYPE) {
            wp_die(esc_html__('This LeadFlow lead could not be found.', 'leadflow-connector'), '', array('response' => 404));
        }

        $lead = $this->repository->get($post_id);
        $result = $this->api_client->sync($this->repository->api_payload($lead));
        $this->repository->save_sync_result($post_id, $result);

        $redirect = add_query_arg(
            array(
                'page' => self::DETAILS_SLUG,
                'lead_id' => $post_id,
                'leadflow_sync_retry' => !empty($result['success']) ? 'success' : 'failed',
            ),
            admin_url('admin.php')
        );
        wp_safe_redirect($redirect);
        exit;
    }

    private function render_lead_table_row(int $post_id): void {
        $lead = $this->repository->get($post_id);
        $details_url = add_query_arg(array('page' => self::DETAILS_SLUG, 'lead_id' => $post_id), admin_url('admin.php'));
        ?>
        <tr>
            <td><strong><?php echo esc_html($lead['name']); ?></strong><span class="leadflow-table-subtext"><?php echo esc_html($lead['email']); ?></span></td>
            <td><strong><?php echo esc_html($lead['service']); ?></strong><span class="leadflow-table-subtext"><?php echo esc_html($lead['budget_range']); ?></span></td>
            <td><?php echo esc_html(get_the_date(get_option('date_format'), $post_id)); ?><span class="leadflow-table-subtext"><?php echo esc_html(get_the_date(get_option('time_format'), $post_id)); ?></span></td>
            <td><?php $this->render_sync_badge($lead['sync_status']); ?><span class="leadflow-table-subtext leadflow-table-subtext--message"><?php echo esc_html($this->shorten_message($lead['sync_message'])); ?></span></td>
            <td class="leadflow-table-actions"><a href="<?php echo esc_url($details_url); ?>"><?php esc_html_e('View', 'leadflow-connector'); ?> <span aria-hidden="true">→</span></a></td>
        </tr>
        <?php
    }

    private function render_pagination(WP_Query $query, int $current_page): void {
        if ($query->max_num_pages < 2) {
            return;
        }

        $links = paginate_links(
            array(
                'base' => add_query_arg('paged', '%#%', admin_url('admin.php?page=' . self::LEADS_SLUG)),
                'format' => '',
                'current' => $current_page,
                'total' => (int) $query->max_num_pages,
                'type' => 'list',
            )
        );

        if ($links) {
            echo '<nav class="leadflow-pagination" aria-label="' . esc_attr__('Lead pagination', 'leadflow-connector') . '">' . wp_kses_post($links) . '</nav>';
        }
    }

    private function render_sync_badge(string $status): void {
        $labels = array(
            'synced' => __('Synced', 'leadflow-connector'),
            'failed' => __('Needs attention', 'leadflow-connector'),
            'pending' => __('Pending', 'leadflow-connector'),
        );
        $status = isset($labels[$status]) ? $status : 'pending';
        echo '<span class="leadflow-sync-badge leadflow-sync-badge--' . esc_attr($status) . '"><i aria-hidden="true"></i>' . esc_html($labels[$status]) . '</span>';
    }

    private function render_retry_form(int $post_id): void {
        ?>
        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" class="leadflow-retry-form">
            <input type="hidden" name="action" value="leadflow_retry_sync">
            <input type="hidden" name="lead_id" value="<?php echo esc_attr((string) $post_id); ?>">
            <?php wp_nonce_field('leadflow_retry_sync_' . $post_id); ?>
            <button type="submit" class="leadflow-button leadflow-button--primary"><span class="dashicons dashicons-update" aria-hidden="true"></span><?php esc_html_e('Retry CRM sync', 'leadflow-connector'); ?></button>
        </form>
        <?php
    }

    private function render_admin_notice(): void {
        $result = isset($_GET['leadflow_sync_retry']) && is_string($_GET['leadflow_sync_retry'])
            ? sanitize_key(wp_unslash($_GET['leadflow_sync_retry']))
            : '';
        if ($result === 'success') {
            echo '<div class="leadflow-admin-notice leadflow-admin-notice--success"><span class="dashicons dashicons-yes-alt"></span><p>' . esc_html__('The lead was synced with the CRM successfully.', 'leadflow-connector') . '</p></div>';
        }
        if ($result === 'failed') {
            echo '<div class="leadflow-admin-notice leadflow-admin-notice--error"><span class="dashicons dashicons-warning"></span><p>' . esc_html__('The CRM sync could not be completed. Check the lead record for details, then try again.', 'leadflow-connector') . '</p></div>';
        }
    }

    private function shorten_message(string $message): string {
        return strlen($message) > 68 ? substr($message, 0, 65) . '…' : $message;
    }
}
