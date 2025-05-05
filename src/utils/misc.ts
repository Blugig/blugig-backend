export function getFormName(formType: string): string {
    switch (formType) {
        case 'SOL': return 'Solution Implementation';
        case 'API': return 'API Integration';
        case 'EXP': return 'Hire Smartsheet Expert';
        case 'ADM': return 'System Admin Support';
        case 'REP': return 'Reports and Dashboards';
        case 'PRM': return 'Premium App Support';
        case 'ONE': return 'One-on-One Consultation';
        case 'PMO': return 'PMO Control Center';
        case 'LIR': return 'License Request';
        default: return 'Unknown Form';
    }
}

export function getFormDescriptionKey(formType: string): string {
    switch (formType) {
        case 'SOL': return 'requirements';
        case 'API': return 'instructions';
        case 'EXP': return 'requirements';
        case 'ADM': return 'support_needs';
        case 'REP': return 'requiremelnts';
        case 'PRM': return 'objective';
        case 'ONE': return 'agenda';
        case 'PMO': return 'project_details';
        case 'LIR': return 'instructions';
        default: return 'null';
    }
}

export function getFormTitleKey(formType: string): string {
    switch (formType) {
        case 'SOL': return 'project_name';
        case 'API': return 'integration_type';
        case 'EXP': return 'domain_focus';
        case 'ADM': return 'type_of_support';
        case 'REP': return 'request_type';
        case 'PRM': return 'add_on_to_configure';
        case 'ONE': return 'consultation_focus';
        case 'PMO': return 'service_type';
        case 'LIR': return 'company_name';
        default: return 'null';
    }
}