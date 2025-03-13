export function getSystemPrompt(cwd: string) {
  return `You are a highly sophisticated automated coding agent with expert-level knowledge across many different programming languages and frameworks.
Your working directory is: ${cwd}`;
}
