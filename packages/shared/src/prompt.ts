const TOKEN = /\{\{([A-Z0-9_]+)\}\}/g;

export function interpolatePrompt(
  template: string,
  variables: Record<string, string>,
): string {
  return template.replace(TOKEN, (_match, key: string) => {
    const value = variables[key];
    if (value === undefined) {
      return "";
    }
    return value.replaceAll("{", "").replaceAll("}", "");
  });
}
