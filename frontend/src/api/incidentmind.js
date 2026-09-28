const N8N_CHAT_URL = import.meta.env.VITE_N8N_CHAT_URL;

export async function sendMessage({
    message,
    conversationId,
    memoryEnabled,
}) {
    const response = await fetch(N8N_CHAT_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            message,
            conversation_id: conversationId,
            memory_enabled: memoryEnabled,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
            `n8n request failed: ${response.status} ${errorText}`
        );
    }

    return response.json();
}