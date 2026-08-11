from __future__ import annotations

from urllib.parse import urlparse

import httpx

GITHUB_API_BASE = "https://api.github.com"
_REQUEST_TIMEOUT_SECONDS = 10.0


class GithubInviteError(Exception):
    """Raised when a repo can't be resolved from a URL, or the GitHub API
    call to invite a collaborator fails for any reason."""

    def __init__(self, message: str, *, status_code: int | None = None):
        super().__init__(message)
        self.status_code = status_code


def parse_owner_repo(repo_url: str) -> tuple[str, str]:
    """Extract (owner, repo) from a GitHub repo URL, e.g.
    'https://github.com/arce-sabin/qa-book-code' -> ('arce-sabin', 'qa-book-code')."""
    parsed = urlparse(repo_url.strip())
    host = (parsed.netloc or "").lower()
    parts = [p for p in parsed.path.split("/") if p]
    if host not in ("github.com", "www.github.com") or len(parts) < 2:
        raise GithubInviteError("repo_url is not a valid GitHub repository URL (expected https://github.com/owner/repo)")
    owner, repo = parts[0], parts[1]
    if repo.endswith(".git"):
        repo = repo[:-4]
    return owner, repo


def invite_collaborator(*, repo_url: str, github_username: str, token: str) -> str:
    """Invites `github_username` as a collaborator on the private repo at
    `repo_url`, using a GitHub personal access token with admin rights on
    that repo. Returns 'invited' (a pending invitation was created — the
    user must accept it on GitHub) or 'already_collaborator' (they already
    had access, added immediately). Raises GithubInviteError otherwise."""
    owner, repo = parse_owner_repo(repo_url)
    url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/collaborators/{github_username}"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    try:
        response = httpx.put(url, headers=headers, timeout=_REQUEST_TIMEOUT_SECONDS)
    except httpx.HTTPError as exc:
        raise GithubInviteError(f"Could not reach GitHub: {exc}") from exc

    if response.status_code == 201:
        return "invited"
    if response.status_code == 204:
        return "already_collaborator"
    if response.status_code == 404:
        raise GithubInviteError("GitHub username not found", status_code=404)
    if response.status_code in (401, 403):
        raise GithubInviteError(
            "The GitHub token is missing or does not have admin rights on this repository",
            status_code=403,
        )
    raise GithubInviteError(
        f"Unexpected response from GitHub ({response.status_code})", status_code=response.status_code
    )
