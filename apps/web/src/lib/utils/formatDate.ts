import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export const formatDateShort = (date: string | Date): string => {
  return format(new Date(date), "dd MMM.", { locale: ptBR });
};

export const formatDateFull = (date: string | Date): string => {
  return format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
};

export const formatDateMonth = (date: string | Date): string => {
  return format(new Date(date), "MMMM yyyy", { locale: ptBR });
};

export const formatRelativeTime = (date: string | Date): string => {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
};
