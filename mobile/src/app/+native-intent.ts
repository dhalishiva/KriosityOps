// Text shared into KriosityOps from another app (X, LinkedIn, Reddit…) arrives
// as a link with the "expo-sharing" host; send it to the share screen.
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    if (new URL(path).hostname === 'expo-sharing') return '/share';
    return path;
  } catch {
    return path.includes('expo-sharing') ? '/share' : path;
  }
}
