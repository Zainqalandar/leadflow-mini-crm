<?php
/**
 * Public shortcode form, client validation and secure submission handler.
 *
 * @package LeadFlowConnector
 */

if (!defined('ABSPATH')) {
    exit;
}

final class LeadFlow_Form {
    private LeadFlow_Lead_Repository $repository;
    private LeadFlow_API_Client $api_client;

    public function __construct(LeadFlow_Lead_Repository $repository, LeadFlow_API_Client $api_client) {
        $this->repository = $repository;
        $this->api_client = $api_client;

        add_shortcode('leadflow_form', array($this, 'render_shortcode'));
        add_action('wp_enqueue_scripts', array($this, 'register_assets'), 1);
        add_action('wp_enqueue_scripts', array($this, 'enqueue_shortcode_assets'), 20);
        add_action('admin_post_nopriv_leadflow_submit_lead', array($this, 'handle_submission'));
        add_action('admin_post_leadflow_submit_lead', array($this, 'handle_submission'));
    }

    public function register_assets(): void {
        wp_register_style(
            'leadflow-connector-form',
            LEADFLOW_CONNECTOR_URL . 'public/css/leadflow-form.css',
            array(),
            LEADFLOW_CONNECTOR_VERSION
        );

        wp_register_script(
            'leadflow-connector-form',
            LEADFLOW_CONNECTOR_URL . 'public/js/leadflow-form.js',
            array(),
            LEADFLOW_CONNECTOR_VERSION,
            true
        );
    }

    public function enqueue_shortcode_assets(): void {
        $post = get_post();
        if (!$post instanceof WP_Post || !has_shortcode($post->post_content, 'leadflow_form')) {
            return;
        }

        $this->enqueue_assets();
    }

    /**
     * Render [leadflow_form].
     *
     * @return string
     */
    public function render_shortcode(): string {
        $this->enqueue_assets();

        ob_start();
        ?>
        <section class="leadflow-form-shell" id="leadflow-form" aria-labelledby="leadflow-form-title">
            <div class="leadflow-form-intro">
                <span class="leadflow-kicker"><?php esc_html_e('LET’S TALK', 'leadflow-connector'); ?></span>
                <h2 id="leadflow-form-title"><?php esc_html_e('Start your next great project.', 'leadflow-connector'); ?></h2>
                <p><?php esc_html_e('Tell us a little about what you are building. Our team will get back to you shortly.', 'leadflow-connector'); ?></p>
                <div class="leadflow-trust-row" aria-label="LeadFlow response promise">
                    <span class="leadflow-trust-check" aria-hidden="true">✓</span>
                    <span><?php esc_html_e('Clear next steps, no pressure.', 'leadflow-connector'); ?></span>
                </div>
            </div>

            <div class="leadflow-form-card">
                <?php $this->render_public_notice(); ?>
                <form class="leadflow-form" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" method="post" novalidate>
                    <input type="hidden" name="action" value="leadflow_submit_lead">
                    <?php wp_nonce_field('leadflow_submit_lead', 'leadflow_nonce'); ?>

                    <div class="leadflow-field-grid">
                        <?php $this->render_text_field('name', __('Your name', 'leadflow-connector'), 'text', __('e.g. Sarah Johnson', 'leadflow-connector'), 'name'); ?>
                        <?php $this->render_text_field('email', __('Work email', 'leadflow-connector'), 'email', __('sarah@company.com', 'leadflow-connector'), 'email'); ?>
                        <?php $this->render_text_field('phone', __('Phone number', 'leadflow-connector'), 'tel', __('+1 555 000 0000', 'leadflow-connector'), 'tel'); ?>

                        <div class="leadflow-field">
                            <label for="leadflow-service"><?php esc_html_e('How can we help?', 'leadflow-connector'); ?><span aria-hidden="true">*</span></label>
                            <select id="leadflow-service" name="service" required data-leadflow-required>
                                <option value=""><?php esc_html_e('Select a service', 'leadflow-connector'); ?></option>
                                <option value="Web development"><?php esc_html_e('Web development', 'leadflow-connector'); ?></option>
                                <option value="Web design"><?php esc_html_e('Web design', 'leadflow-connector'); ?></option>
                                <option value="Branding"><?php esc_html_e('Branding', 'leadflow-connector'); ?></option>
                                <option value="SEO"><?php esc_html_e('SEO', 'leadflow-connector'); ?></option>
                                <option value="Digital marketing"><?php esc_html_e('Digital marketing', 'leadflow-connector'); ?></option>
                                <option value="E-commerce development"><?php esc_html_e('E-commerce development', 'leadflow-connector'); ?></option>
                                <option value="Other"><?php esc_html_e('Something else', 'leadflow-connector'); ?></option>
                            </select>
                            <p class="leadflow-field-error" aria-live="polite"></p>
                        </div>

                        <div class="leadflow-field">
                            <label for="leadflow-budget-range"><?php esc_html_e('Estimated budget', 'leadflow-connector'); ?><span aria-hidden="true">*</span></label>
                            <select id="leadflow-budget-range" name="budget_range" required data-leadflow-required>
                                <option value=""><?php esc_html_e('Choose a range', 'leadflow-connector'); ?></option>
                                <option value="Under $2,500"><?php esc_html_e('Under $2,500', 'leadflow-connector'); ?></option>
                                <option value="$2,500–$5,000"><?php esc_html_e('$2,500–$5,000', 'leadflow-connector'); ?></option>
                                <option value="$5,000–$10,000"><?php esc_html_e('$5,000–$10,000', 'leadflow-connector'); ?></option>
                                <option value="$10,000+"><?php esc_html_e('$10,000+', 'leadflow-connector'); ?></option>
                                <option value="Custom quote"><?php esc_html_e('Custom quote', 'leadflow-connector'); ?></option>
                            </select>
                            <p class="leadflow-field-error" aria-live="polite"></p>
                        </div>

                        <div class="leadflow-field leadflow-field--full">
                            <label for="leadflow-message"><?php esc_html_e('Tell us about the project', 'leadflow-connector'); ?><span aria-hidden="true">*</span></label>
                            <textarea id="leadflow-message" name="message" rows="5" maxlength="2000" placeholder="<?php esc_attr_e('Goals, timeline, or anything useful for a first conversation…', 'leadflow-connector'); ?>" required data-leadflow-required></textarea>
                            <div class="leadflow-field-footer"><p class="leadflow-field-error" aria-live="polite"></p><span class="leadflow-character-count">0 / 2000</span></div>
                        </div>
                    </div>

                    <div class="leadflow-form-footer">
                        <p><?php esc_html_e('We only use these details to reply to your enquiry.', 'leadflow-connector'); ?></p>
                        <button type="submit" class="leadflow-submit-button"><span><?php esc_html_e('Send project enquiry', 'leadflow-connector'); ?></span><span aria-hidden="true">→</span></button>
                    </div>
                </form>
            </div>
        </section>
        <?php

        return (string) ob_get_clean();
    }

    public function handle_submission(): void {
        $nonce = sanitize_text_field($this->post_string('leadflow_nonce'));
        if ($nonce === '' || !wp_verify_nonce($nonce, 'leadflow_submit_lead')) {
            wp_die(esc_html__('Your form session has expired. Please go back and try again.', 'leadflow-connector'), esc_html__('LeadFlow form error', 'leadflow-connector'), array('response' => 403));
        }

        $lead = $this->sanitize_submission();
        if (!$this->is_valid_submission($lead)) {
            $this->redirect_with_status('error');
        }

        $post_id = $this->repository->create($lead);
        if (is_wp_error($post_id)) {
            $this->redirect_with_status('error');
        }

        $sync_result = $this->api_client->sync($this->repository->api_payload($lead));
        $this->repository->save_sync_result((int) $post_id, $sync_result);

        $this->redirect_with_status('success');
    }

    /**
     * @return array<string, string>
     */
    private function sanitize_submission(): array {
        $phone = preg_replace('/[^0-9+().\s-]/', '', $this->post_string('phone'));

        return array(
            'name' => sanitize_text_field($this->post_string('name')),
            'email' => sanitize_email($this->post_string('email')),
            'phone' => sanitize_text_field((string) $phone),
            'service' => sanitize_text_field($this->post_string('service')),
            'budget_range' => sanitize_text_field($this->post_string('budget_range')),
            'message' => sanitize_textarea_field($this->post_string('message')),
        );
    }

    /**
     * @param array<string, string> $lead
     */
    private function is_valid_submission(array $lead): bool {
        $phone_digits = preg_replace('/\D/', '', $lead['phone']);

        return strlen($lead['name']) >= 2
            && strlen($lead['name']) <= 100
            && is_email($lead['email'])
            && strlen($lead['email']) <= 254
            && strlen((string) $phone_digits) >= 7
            && strlen($lead['phone']) <= 30
            && $lead['service'] !== ''
            && strlen($lead['service']) <= 120
            && $lead['budget_range'] !== ''
            && strlen($lead['budget_range']) <= 100
            && strlen($lead['message']) >= 10
            && strlen($lead['message']) <= 2000;
    }

    private function redirect_with_status(string $status): void {
        $redirect_url = wp_validate_redirect(wp_get_referer(), home_url('/'));
        $redirect_url = add_query_arg('leadflow_status', $status, $redirect_url);
        $redirect_url .= '#leadflow-form';

        wp_safe_redirect($redirect_url);
        exit;
    }

    private function enqueue_assets(): void {
        wp_enqueue_style('leadflow-connector-form');
        wp_enqueue_script('leadflow-connector-form');
    }

    private function post_string(string $key): string {
        if (!isset($_POST[$key]) || !is_string($_POST[$key])) {
            return '';
        }

        return (string) wp_unslash($_POST[$key]);
    }

    private function render_public_notice(): void {
        $status = isset($_GET['leadflow_status']) && is_string($_GET['leadflow_status'])
            ? sanitize_key(wp_unslash($_GET['leadflow_status']))
            : '';

        if ($status === 'success') {
            echo '<div class="leadflow-public-notice leadflow-public-notice--success" role="status"><span aria-hidden="true">✓</span><p>' . esc_html__('Thanks — your enquiry has reached our team. We’ll be in touch soon.', 'leadflow-connector') . '</p></div>';
        }

        if ($status === 'error') {
            echo '<div class="leadflow-public-notice leadflow-public-notice--error" role="alert"><span aria-hidden="true">!</span><p>' . esc_html__('Please check the required fields and try again.', 'leadflow-connector') . '</p></div>';
        }
    }

    private function render_text_field(string $name, string $label, string $type, string $placeholder, string $autocomplete): void {
        $id = 'leadflow-' . $name;
        ?>
        <div class="leadflow-field">
            <label for="<?php echo esc_attr($id); ?>"><?php echo esc_html($label); ?><span aria-hidden="true">*</span></label>
            <input id="<?php echo esc_attr($id); ?>" name="<?php echo esc_attr($name); ?>" type="<?php echo esc_attr($type); ?>" maxlength="<?php echo $name === 'email' ? '254' : ($name === 'phone' ? '30' : '100'); ?>" autocomplete="<?php echo esc_attr($autocomplete); ?>" placeholder="<?php echo esc_attr($placeholder); ?>" required data-leadflow-required>
            <p class="leadflow-field-error" aria-live="polite"></p>
        </div>
        <?php
    }
}
