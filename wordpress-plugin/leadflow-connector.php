<?php
/**
 * Plugin Name: LeadFlow Connector
 * Description: Connects the LeadFlow WordPress form to the LeadFlow CRM API.
 * Version: 0.1.0
 * Requires at least: 6.0
 * Requires PHP: 8.3
 * Author: LeadFlow Team
 * License: GPL-2.0-or-later
 */

if (!defined('ABSPATH')) {
    exit;
}

define('LEADFLOW_CONNECTOR_VERSION', '0.1.0');

add_action('admin_notices', function (): void {
    if (!current_user_can('manage_options')) {
        return;
    }

    echo '<div class="notice notice-info is-dismissible"><p>LeadFlow Connector is loaded. Form and API integration are next.</p></div>';
});
