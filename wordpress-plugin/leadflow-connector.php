<?php
/**
 * Plugin Name: LeadFlow Connector
 * Description: Connects the LeadFlow WordPress form to the LeadFlow CRM API.
 * Version: 1.0.0
 * Requires at least: 6.0
 * Requires PHP: 8.3
 * Author: LeadFlow Team
 * License: GPL-2.0-or-later
 */

if (!defined('ABSPATH')) {
    exit;
}

define('LEADFLOW_CONNECTOR_VERSION', '1.0.0');
define('LEADFLOW_CONNECTOR_FILE', __FILE__);
define('LEADFLOW_CONNECTOR_DIR', plugin_dir_path(__FILE__));
define('LEADFLOW_CONNECTOR_URL', plugin_dir_url(__FILE__));
define('LEADFLOW_CONNECTOR_OPTION', 'leadflow_connector_settings');

require_once LEADFLOW_CONNECTOR_DIR . 'includes/class-leadflow-lead-repository.php';
require_once LEADFLOW_CONNECTOR_DIR . 'includes/class-leadflow-api-client.php';
require_once LEADFLOW_CONNECTOR_DIR . 'includes/class-leadflow-form.php';
require_once LEADFLOW_CONNECTOR_DIR . 'includes/class-leadflow-admin.php';
require_once LEADFLOW_CONNECTOR_DIR . 'includes/class-leadflow-connector.php';

register_activation_hook(__FILE__, array('LeadFlow_Connector', 'activate'));
register_deactivation_hook(__FILE__, array('LeadFlow_Connector', 'deactivate'));

function leadflow_connector(): LeadFlow_Connector {
    return LeadFlow_Connector::instance();
}

leadflow_connector();
