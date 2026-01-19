
import { AppState, Template } from '../types';
import { STORAGE_KEY, TEMPLATES_KEY } from '../constants';

export const saveState = (state: AppState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const loadState = (): AppState | null => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return null;
  return JSON.parse(data);
};
