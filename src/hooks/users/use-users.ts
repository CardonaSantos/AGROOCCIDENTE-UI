import { useApiQuery } from "../genericoCall/genericoCallHook";
import { usersQkeys } from "./Qk";

export interface UsersToSelect {
  id: number;
  nombre: string;
  rol: string;
}
export function useGetUsersToSelect() {
  return useApiQuery<Array<UsersToSelect>>(
    usersQkeys.all,
    "user/to-select",
    undefined,
    {
      staleTime: 0,
      refetchOnReconnect: true,
    },
  );
}
