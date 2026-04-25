import {apiFetch} from './api';

export interface ModuleConfigData {
  module: string;
  settings: Record<string, unknown>;
  scope: 'tenant' | 'user';
}

export async function getModuleConfig(module: string): Promise<ModuleConfigData> {
  return apiFetch<ModuleConfigData>(`/api/modules/${module}/config`);
}

export async function updateModuleConfig(module: string, settings: Record<string, unknown>): Promise<ModuleConfigData> {
  return apiFetch<ModuleConfigData>(`/api/admin/modules/${module}/config`, {
    method: 'PATCH',
    body: JSON.stringify({ settings }),
  });
}

export async function getUserModuleConfig(module: string): Promise<ModuleConfigData | null> {
  try {
    return await apiFetch<ModuleConfigData>(`/api/users/me/modules/${module}/config`);
  } catch {
    return null;
  }
}

export async function updateUserModuleConfig(module: string, settings: Record<string, unknown>): Promise<ModuleConfigData> {
  return apiFetch<ModuleConfigData>(`/api/users/me/modules/${module}/config`, {
    method: 'PATCH',
    body: JSON.stringify({ settings }),
  });
}
