import { invoke } from "@tauri-apps/api/core";

export interface UserInfo {
  id: number;
  username: string;
}

export interface KeyItem {
  id: number;
  name: string;
  provider: string;
  key_preview: string;
  created_at: string;
  expires_at: string | null;
  status: string;
  notes: string;
  last_checked_at: string | null;
  check_message: string;
}

export interface Stats {
  total: number;
  active: number;
  expired: number;
  invalid: number;
  unknown: number;
}

export interface NewKeyPayload {
  name: string;
  provider: string;
  api_key: string;
  expires_at: string | null;
  notes: string;
}

export interface UpdateKeyPayload {
  name: string;
  provider: string;
  api_key: string | null;
  expires_at: string | null;
  notes: string;
}

export const api = {
  currentUser: () => invoke<UserInfo | null>("current_user"),
  register: (username: string, password: string) =>
    invoke<void>("register", { username, password }),
  login: (username: string, password: string) =>
    invoke<UserInfo>("login", { username, password }),
  logout: () => invoke<void>("logout"),
  listKeys: () => invoke<KeyItem[]>("list_keys"),
  createKey: (payload: NewKeyPayload) => invoke<KeyItem>("create_key", { payload }),
  updateKey: (id: number, payload: UpdateKeyPayload, password: string) =>
    invoke<KeyItem>("update_key", { id, payload, password }),
  deleteKey: (id: number) => invoke<void>("delete_key", { id }),
  exportKey: (id: number, password: string) =>
    invoke<string>("export_key", { id, password }),
  changePassword: (oldPassword: string, newPassword: string) =>
    invoke<void>("change_password", { oldPassword, newPassword }),
  exportAll: (password: string, path: string) =>
    invoke<number>("export_all", { password, path }),
  importKeys: (password: string, path: string) =>
    invoke<number>("import_keys", { password, path }),
  checkKey: (id: number) => invoke<KeyItem>("check_key", { id }),
  checkAllKeys: () => invoke<KeyItem[]>("check_all_keys"),
  stats: () => invoke<Stats>("stats"),
};
