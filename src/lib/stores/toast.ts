import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'info';

const { subscribe, set, update } = writable({
    show: false,
    message: '',
    type: 'info' as ToastType
});

export const toast = {
    subscribe,
    show: (message: string, type: ToastType = 'info', duration = 2500) => {
        set({ show: true, message, type });
        setTimeout(() => {
            set({ show: false, message: '', type: 'info' });
        }, duration);
    },
    hide: () => update(s => ({ ...s, show: false }))
};