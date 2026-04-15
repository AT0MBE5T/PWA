export function getItemsProfilePerPage(): number {
    if (typeof window === 'undefined') return 8;

    const width = window.innerWidth;

    if (width > 1100) {
        return 9; 
    } else if (width > 768 && width <= 1100) {
        return 8;
    } else {
        return 6;
    }
}