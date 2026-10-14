export const routes = {
  home: "/",
  newVersion: (fromId: string) => `/?from=${fromId}`,
  result: (id: string) => `/customizations/${id}`,
  history: "/history",
} as const
