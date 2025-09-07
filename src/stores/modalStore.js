import { create } from "zustand";

export const useModalStore = create((set) => ({
  // Modal state
  modals: {},

  // Open a modal
  openModal: (modalId, props = {}) =>
    set((state) => ({
      modals: {
        ...state.modals,
        [modalId]: {
          isOpen: true,
          props,
        },
      },
    })),

  // Close a modal
  closeModal: (modalId) =>
    set((state) => ({
      modals: {
        ...state.modals,
        [modalId]: {
          ...state.modals[modalId],
          isOpen: false,
        },
      },
    })),

  // Close all modals
  closeAllModals: () =>
    set((state) => {
      const updatedModals = {};
      Object.keys(state.modals).forEach((modalId) => {
        updatedModals[modalId] = {
          ...state.modals[modalId],
          isOpen: false,
        };
      });
      return { modals: updatedModals };
    }),

  // Check if a modal is open
  isModalOpen: (modalId) => (state) => state.modals[modalId]?.isOpen || false,

  // Get modal props
  getModalProps: (modalId) => (state) => state.modals[modalId]?.props || {},
}));
