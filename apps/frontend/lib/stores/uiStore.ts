import { create } from "zustand";

type ModalType = "auth" | "cart" | "search" | null;

interface UIState {
    // Modal state
    activeModal: ModalType;
    modalData: Record<string, any>;

    // Sidebar state
    isMobileSidebarOpen: boolean;

    // Auth modal specific
    authTab: "login" | "register";

    // Actions
    openModal: (modal: ModalType, data?: Record<string, any>) => void;
    closeModal: () => void;
    setAuthTab: (tab: "login" | "register") => void;
    openAuthModal: (tab?: "login" | "register") => void;
    toggleMobileSidebar: () => void;
    closeMobileSidebar: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
    activeModal: null,
    modalData: {},
    isMobileSidebarOpen: false,
    authTab: "login",

    openModal: (modal, data = {}) =>
        set({
            activeModal: modal,
            modalData: data,
        }),

    closeModal: () =>
        set({
            activeModal: null,
            modalData: {},
        }),

    setAuthTab: (tab) => set({ authTab: tab }),

    openAuthModal: (tab = "login") =>
        set({
            activeModal: "auth",
            authTab: tab,
        }),

    toggleMobileSidebar: () =>
        set((state) => ({
            isMobileSidebarOpen: !state.isMobileSidebarOpen,
        })),

    closeMobileSidebar: () => set({ isMobileSidebarOpen: false }),
}));
