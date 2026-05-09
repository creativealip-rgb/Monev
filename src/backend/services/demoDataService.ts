// Simplified demo data service - will be implemented fully later
export async function getTemplateByScope(scope: "quick" | "standard" | "complete") {
  // TODO: Implement template fetching
  return null;
}

export async function applyDemoData(userId: number, scope: "quick" | "standard" | "complete") {
  // TODO: Implement demo data application
  console.log(`Applying demo data for user ${userId} with scope ${scope}`);
}
