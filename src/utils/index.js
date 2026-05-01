export function createPageUrl(pageNameWithQuery) {
  const [page, query] = pageNameWithQuery.split('?');
  return query ? `/${page}?${query}` : `/${page}`;
}
