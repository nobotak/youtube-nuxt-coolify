export type CommandPaletteAction = {
  id: string;
  label: string;
  hint: string;
  keywords: string;
  run: () => void | Promise<void>;
};

const contextualActions = ref<CommandPaletteAction[]>([]);

export function useCommandPaletteActions() {
  function setContextualActions(actions: CommandPaletteAction[]) {
    contextualActions.value = actions;
  }

  function clearContextualActions() {
    contextualActions.value = [];
  }

  return {
    contextualActions,
    setContextualActions,
    clearContextualActions,
  };
}
