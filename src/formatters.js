export function formatResponse(response) {
  // Python parity: format LikeMinds API response for display
  if (!response?.success) {
    return `Error: ${response?.message ?? 'Unknown error occurred'}`;
  }
  const data = response.data ?? {};
  const answer = data.answer ?? '';
  const codeExamples = Array.isArray(data.code_examples) ? data.code_examples : [];
  const documentationLinks = Array.isArray(data.documentation_links) ? data.documentation_links : [];

  const out = [];
  if (answer) {
    out.push(`## Answer\n${answer}`);
  }
  if (codeExamples.length) {
    out.push('\n## Code Examples');
    codeExamples.forEach((example, i) => {
      const language = example?.language ?? 'javascript';
      const code = example?.code ?? '';
      const description = example?.description ?? '';
      if (description) out.push(`\n### ${description}`);
      out.push(`\n\`\`\`${language}\n${code}\n\`\`\``);
    });
  }
  if (documentationLinks.length) {
    out.push('\n## Documentation Links');
    documentationLinks.forEach((link) => {
      const title = link?.title ?? 'Documentation';
      const url = link?.url ?? '';
      out.push(`- [${title}](${url})`);
    });
  }
  return out.length ? out.join('\n') : 'No response received from LikeMinds AI Agent';
}

export function formatFlutterResponse(response) {
  try {
    const result = response?.result ?? {};
    const choices = Array.isArray(result?.choices) ? result.choices : [];
    if (!choices.length) return 'Error: No code generated from Flutter API';

    const content = choices[0]?.message?.content ?? '';
    const metadata = result?.metadata ?? {};
    if (!content) return 'Error: No code content received from Flutter API';

    const out = [];
    out.push('## Generated Flutter Code\n');
    out.push(content);

    if (Object.keys(metadata).length) {
      out.push('\n## Integration Details');

      const description = metadata?.description ?? '';
      if (description) out.push(`\n### Description\n${description}`);

      const suggested = metadata?.suggestedInsertion ?? {};
      const filePathHint = suggested?.filePathHint ?? '';
      if (filePathHint) out.push(`\n### File Structure\n${filePathHint}`);

      const widgetPlacement = suggested?.widgetPlacement ?? '';
      if (widgetPlacement) out.push(`\n### Placement Instructions\n${widgetPlacement}`);

      const dependencies = Array.isArray(suggested?.dependencies) ? suggested.dependencies : [];
      if (dependencies.length) {
        out.push('\n### Dependencies');
        dependencies.forEach((dep) => out.push(`- ${dep}`));
      }

      const preconditions = Array.isArray(suggested?.preconditions) ? suggested.preconditions : [];
      if (preconditions.length) {
        out.push('\n### Prerequisites');
        preconditions.forEach((p) => out.push(`- ${p}`));
      }
    }

    return out.join('\n');
  } catch (e) {
    return `Error formatting Flutter response: ${e.message}`;
  }
}
