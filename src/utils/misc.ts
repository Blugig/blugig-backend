export function getFormName(formType: string): string {
    switch (formType) {
        case 'SOL': return 'Solution Implementation';
        case 'API': return 'API Integration';
        case 'EXP': return 'Hire Smartsheet Expert';
        case 'ADM': return 'System Admin Support';
        case 'ADH': return 'Adhoc Request';
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
        case 'API': return 'description';
        case 'EXP': return 'job_description';
        case 'ADM': return 'requirements';
        case 'ADH': return 'description';
        case 'PRM': return 'requirements';
        case 'ONE': return 'consultation_focus';
        case 'PMO': return 'required_features';
        case 'LIR': return 'project_needs';
        default: return 'null';
    }
}

export function getFormTitleKey(formType: string): string {
    switch (formType) {
        case 'SOL': return 'project_title';
        case 'API': return 'integration_type';
        case 'EXP': return 'job_title';
        case 'ADM': return 'support_needed';
        case 'ADH': return 'need_help_with';
        case 'PRM': return 'organization_name';
        case 'ONE': return 'consultation_focus';
        case 'PMO': return 'organization_name';
        case 'LIR': return 'company_name';
        default: return 'null';
    }
}

export const PERMISSIONS = [
    "FREE",
    "SOL",
    "API",
    "EXP",
    "ADM",
    "ADH",
    "PRM",
    "ONE",
    "PMO",
    "LIR"
];