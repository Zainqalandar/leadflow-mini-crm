<?php
/**
 * WordPress storage for leads submitted through the LeadFlow form.
 *
 * @package LeadFlowConnector
 */

if (!defined('ABSPATH')) {
    exit;
}

final class LeadFlow_Lead_Repository {
    public const POST_TYPE = 'leadflow_lead';

    private const META_PREFIX = '_leadflow_';

    /**
     * Register a private custom post type. WordPress manages its database table,
     * timestamps and capabilities while individual lead fields live in post meta.
     */
    public static function register_post_type(): void {
        $labels = array(
            'name' => __('LeadFlow Leads', 'leadflow-connector'),
            'singular_name' => __('LeadFlow Lead', 'leadflow-connector'),
            'edit_item' => __('Edit LeadFlow Lead', 'leadflow-connector'),
        );

        register_post_type(
            self::POST_TYPE,
            array(
                'labels' => $labels,
                'public' => false,
                'publicly_queryable' => false,
                'exclude_from_search' => true,
                'show_ui' => false,
                'show_in_menu' => false,
                'show_in_rest' => false,
                'query_var' => false,
                'rewrite' => false,
                'supports' => array('title'),
                'map_meta_cap' => true,
                'capability_type' => 'post',
            )
        );
    }

    /**
     * Create a WordPress lead record before attempting the CRM sync.
     *
     * @param array<string, string> $lead Lead form values.
     * @return int|WP_Error
     */
    public function create(array $lead) {
        $post_id = wp_insert_post(
            array(
                'post_type' => self::POST_TYPE,
                'post_status' => 'publish',
                'post_title' => sprintf(
                    /* translators: 1: lead name, 2: submission date. */
                    __('%1$s — %2$s', 'leadflow-connector'),
                    $lead['name'],
                    current_time(get_option('date_format') . ' ' . get_option('time_format'))
                ),
            ),
            true
        );

        if (is_wp_error($post_id)) {
            return $post_id;
        }

        foreach ($lead as $key => $value) {
            $this->update($post_id, $key, $value);
        }

        $this->update($post_id, 'sync_status', 'pending');
        $this->update($post_id, 'sync_message', __('Waiting to sync with the CRM.', 'leadflow-connector'));

        return (int) $post_id;
    }

    /**
     * @return array<string, string>
     */
    public function get(int $post_id): array {
        $fields = array('name', 'email', 'phone', 'service', 'budget_range', 'message', 'sync_status', 'sync_message', 'remote_lead_id', 'last_synced_at');
        $lead = array();

        foreach ($fields as $field) {
            $lead[$field] = (string) get_post_meta($post_id, $this->meta_key($field), true);
        }

        return $lead;
    }

    /**
     * @param array<string, string> $sync_result
     */
    public function save_sync_result(int $post_id, array $sync_result): void {
        $is_successful = !empty($sync_result['success']);
        $this->update($post_id, 'sync_status', $is_successful ? 'synced' : 'failed');
        $this->update($post_id, 'sync_message', $sync_result['message'] ?? '');
        $this->update($post_id, 'last_synced_at', current_time('mysql'));

        if ($is_successful && !empty($sync_result['remote_lead_id'])) {
            $this->update($post_id, 'remote_lead_id', $sync_result['remote_lead_id']);
        }
    }

    /**
     * @param array<string, string> $lead
     * @return array<string, string>
     */
    public function api_payload(array $lead): array {
        return array(
            'name' => $lead['name'],
            'email' => $lead['email'],
            'phone' => $lead['phone'],
            'service' => $lead['service'],
            'budgetRange' => $lead['budget_range'],
            'message' => $lead['message'],
        );
    }

    private function update(int $post_id, string $field, string $value): void {
        update_post_meta($post_id, $this->meta_key($field), $value);
    }

    private function meta_key(string $field): string {
        return self::META_PREFIX . $field;
    }
}
