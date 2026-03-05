import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function safeFormat(dateStr: string | undefined | null, formatStr: string, fallback = 'N/A'): string {
  if (!dateStr) return fallback;
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return fallback;
    return format(date, formatStr, { locale: ptBR });
  } catch {
    return fallback;
  }
}

export function safeFormatDate(date: Date | null | undefined, formatStr: string, fallback = 'N/A'): string {
  if (!date || !isValid(date)) return fallback;
  try {
    return format(date, formatStr, { locale: ptBR });
  } catch {
    return fallback;
  }
}
