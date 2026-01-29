export function formatMinutes(minutes = 0) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
}

export function formatTime(datetime) {
    if (!datetime) return '';
    return new Date(datetime.replace(' ', 'T'))
        .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
