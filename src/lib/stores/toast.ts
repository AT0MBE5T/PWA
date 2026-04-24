import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'info';

const { subscribe, set, update } = writable({
    show: false,
    message: '',
    type: 'info' as ToastType,
    duration: 2500
});

export const toast = {
    subscribe,
    show: (message: string, type: ToastType = 'info', duration: number = 2500) => {
        set({ show: true, message, type, duration });
        setTimeout(() => {
            set({ show: false, message: '', type: 'info', duration: 2500 });
        }, duration);
    },
    hide: () => update(s => ({ ...s, show: false }))
};