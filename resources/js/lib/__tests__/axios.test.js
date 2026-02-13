import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('axios', () => {
    const create = vi.fn(() => {
        const instance = vi.fn();
        instance.get = vi.fn();
        instance.interceptors = {
            response: {
                use: vi.fn((onFulfilled, onRejected) => {
                    instance.__onFulfilled = onFulfilled;
                    instance.__onRejected = onRejected;
                }),
            },
        };
        return instance;
    });

    return {
        default: { create },
        create,
    };
});

describe('axios client csrf retry', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    async function loadClient() {
        const axiosModule = await import('axios');
        const clientModule = await import('../axios');
        const instance = axiosModule.default.create.mock.results.at(-1).value;

        return { instance, client: clientModule.default };
    }

    it('retries once after refreshing csrf cookie on 419', async () => {
        const { instance } = await loadClient();
        const originalRequest = { url: '/api/time-entries/start' };
        const error = {
            response: { status: 419 },
            config: originalRequest,
        };

        instance.get.mockResolvedValue({});
        instance.mockResolvedValue({ ok: true });

        const response = await instance.__onRejected(error);

        expect(instance.get).toHaveBeenCalledWith('/sanctum/csrf-cookie');
        expect(instance).toHaveBeenCalledWith(originalRequest);
        expect(originalRequest._retryAfterCsrfRefresh).toBe(true);
        expect(response).toEqual({ ok: true });
    });

    it('does not retry csrf endpoint request itself', async () => {
        const { instance } = await loadClient();
        const error = {
            response: { status: 419 },
            config: { url: '/sanctum/csrf-cookie' },
        };

        await expect(instance.__onRejected(error)).rejects.toBe(error);
        expect(instance.get).not.toHaveBeenCalled();
    });
});
