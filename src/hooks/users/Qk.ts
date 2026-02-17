export const usersQkeys = {
  all: ["users"] as const,
  specific: (id: number) => ["users", id] as const,
};
