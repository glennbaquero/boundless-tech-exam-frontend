import { create } from "zustand";

interface UserState {
  user: Record<string, unknown> | null;
  setUser: (user: UserState["user"]) => void;
}

const useUser = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));

export default useUser;
