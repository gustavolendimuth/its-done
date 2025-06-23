/**
 * Normaliza URLs adicionando https:// se necessário
 * @param url - URL que pode ou não ter protocolo
 * @returns URL completa com https://
 */
export function normalizeUrl(url: string | undefined): string {
  if (!url) return '';

  // Se já tem protocolo, retorna como está
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Se é localhost, adiciona http://
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    return `http://${url}`;
  }

  // Para URLs do Railway ou outros domínios, adiciona https://
  return `https://${url}`;
}
