export function getActiveBranch(): string | null {
  return sessionStorage.getItem('karate_active_branch')
}

export function setActiveBranch(branch: string) {
  sessionStorage.setItem('karate_active_branch', branch)
  window.location.href = '/' // Reload app to apply branch
}

export function clearActiveBranch() {
  sessionStorage.removeItem('karate_active_branch')
  window.location.href = '/'
}

export function getBranchPrefix(): string {
  const branch = getActiveBranch() || 'branch1'
  return `karate_${branch}`
}
