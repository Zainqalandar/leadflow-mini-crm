<?php
/**
 * Main plugin bootstrapper.
 *
 * @package LeadFlowConnector
 */

if (!defined('ABSPATH')) {
    exit;
}

final class LeadFlow_Connector {
    private static ?LeadFlow_Connector $instance = null;

    public static function instance(): LeadFlow_Connector {
        if (self::$instance === null) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    public static function activate(): void {
        LeadFlow_Lead_Repository::register_post_type();
        flush_rewrite_rules();
    }

    public static function deactivate(): void {
        flush_rewrite_rules();
    }

    private function __construct() {
        add_action('init', array(LeadFlow_Lead_Repository::class, 'register_post_type'));

        $repository = new LeadFlow_Lead_Repository();
        $api_client = new LeadFlow_API_Client();

        new LeadFlow_Form($repository, $api_client);
        new LeadFlow_Admin($repository, $api_client);
    }
}
