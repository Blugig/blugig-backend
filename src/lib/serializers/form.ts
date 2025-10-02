import { Prisma } from '@prisma/client'

export const formSelectFields: Prisma.FormSubmissionSelect = {
    solution_implementation: true,
    api_integration: true,
    hire_smartsheet_expert: true,
    system_admin_support: true,
    adhoc_request: true,
    premium_app_support: true,
    book_one_on_one: true,
    pmo_control_center: true,
    license_request: true,
}

export function serializeConversationMessages(conversation: any) {
    return {
        id: conversation.id,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at,
        user_id: conversation.user_id,
        form_id: conversation.job?.form_submission_id || null,
        messages: conversation.messages?.map((message: any) => {
            // Determine the actual sender_user_id
            let user_type = "user";
            if (message.sender_admin_id) {
                user_type = "admin";
            } else if (message.sender_freelancer_id) {
                user_type = "freelancer";
            }

            const serializedMessage: any = {
                id: message.id,
                body: message.body,
                time: message.time,
                user_type,
            };

            // Add media fields if message type is MEDIA
            if (message.message_type === 'MEDIA') {
                serializedMessage.media_url = message.media_url;
                serializedMessage.media_type = message.media_type;
            }

            // Add offer if message type is OFFER
            if (message.message_type === 'OFFER' && message.offer) {
                serializedMessage.offer = message.offer;
            }

            return serializedMessage;
        }) || []
    };
}