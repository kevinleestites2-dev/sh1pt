import type { Device, DeviceRegisterInput } from '@sh1pt/schemas';
import type { HttpClient } from './client.ts';

export function createDevicesApi(http: HttpClient) {
  return {
    list(): Promise<Device[]> {
      return http.request<Device[]>('/devices');
    },
    get(id: string): Promise<Device> {
      return http.request<Device>(`/devices/${encodeURIComponent(id)}`);
    },
    register(input: DeviceRegisterInput): Promise<Device> {
      return http.request<Device>('/devices/register', { method: 'POST', body: input });
    },
    delete(id: string): Promise<void> {
      return http.request<void>(`/devices/${encodeURIComponent(id)}`, { method: 'DELETE' });
    },
  };
}
