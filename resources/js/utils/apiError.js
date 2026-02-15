export function getApiErrorDetails(error, fallbackMessage = 'Request failed') {
    const message =
        error?.response?.data?.message
        || error?.message
        || fallbackMessage;

    const requestId =
        error?.response?.data?.request_id
        || error?.response?.headers?.['x-request-id']
        || null;

    return {
        message,
        requestId,
        fullMessage: requestId ? `${message} (ref: ${requestId})` : message,
    };
}
