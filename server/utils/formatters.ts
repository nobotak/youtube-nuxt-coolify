export function parseISO8601Duration(duration: string): number {
    if (!duration) return 0;
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);

    if (!match) return 0;

    const hours = parseInt(match[1]?.slice(0, -1) || '0');
    const minutes = parseInt(match[2]?.slice(0, -1) || '0');
    const seconds = parseInt(match[3]?.slice(0, -1) || '0');

    return (hours * 3600) + (minutes * 60) + seconds;
}
