<?php
/**
 * Safe server-to-server sync client for the LeadFlow Node API.
 *
 * @package LeadFlowConnector
 */

if (!defined('ABSPATH')) {
    exit;
}

final class LeadFlow_API_Client {
    /**
     * @param array<string, string> $payload
     * @return array{success: bool, message: string, remote_lead_id?: string}
     */
    public function sync(array $payload): array {
        $settings = get_option(LEADFLOW_CONNECTOR_OPTION, array());
        $endpoint = isset($settings['api_url']) ? trim((string) $settings['api_url']) : '';
        $secret = isset($settings['api_secret']) ? (string) $settings['api_secret'] : '';

        if ($endpoint === '' || $secret === '') {
            return array(
                'success' => false,
                'message' => __('CRM API URL and API secret must be configured before sync can run.', 'leadflow-connector'),
            );
        }

        $response = wp_remote_post(
            $endpoint,
            array(
                'timeout' => 15,
                'redirection' => 0,
                'headers' => array(
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json',
                    'X-API-Secret' => $secret,
                ),
                'body' => wp_json_encode($payload),
                'data_format' => 'body',
            )
        );

        if (is_wp_error($response)) {
            return array(
                'success' => false,
                'message' => sprintf(
                    /* translators: %s: WordPress HTTP error message. */
                    __('Connection failed: %s', 'leadflow-connector'),
                    $response->get_error_message()
                ),
            );
        }

        $status_code = (int) wp_remote_retrieve_response_code($response);
        $decoded = json_decode((string) wp_remote_retrieve_body($response), true);
        $message = is_array($decoded) && isset($decoded['message']) && is_string($decoded['message'])
            ? $decoded['message']
            : '';

        if ($status_code >= 200 && $status_code < 300) {
            $remote_id = '';
            if (is_array($decoded) && isset($decoded['lead']) && is_array($decoded['lead']) && isset($decoded['lead']['_id'])) {
                $remote_id = (string) $decoded['lead']['_id'];
            }

            return array(
                'success' => true,
                'message' => __('Synced successfully with the LeadFlow CRM.', 'leadflow-connector'),
                'remote_lead_id' => $remote_id,
            );
        }

        return array(
            'success' => false,
            'message' => $message !== ''
                ? $message
                : sprintf(
                    /* translators: %d: API HTTP status code. */
                    __('CRM API returned HTTP %d.', 'leadflow-connector'),
                    $status_code
                ),
        );
    }
}
