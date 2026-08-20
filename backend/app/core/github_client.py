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


class GithubContentError(Exception):
    """Raised when a file can't be read from a repo — not found, no read
    access with the configured token, or GitHub unreachable."""

    def __init__(self, message: str, *, status_code: int | None = None):
        super().__init__(message)
        self.status_code = status_code


def get_file_content(*, repo_url: str, path: str, token: str) -> bytes:
    """Reads one file's raw bytes from `repo_url` at `path` via the GitHub
    Contents API, authenticated with `token` — works for private repos as
    long as the token has read access, no collaborator invite or end-user
    GitHub account involved. Used to power the in-platform read-only
    resource viewer and download, always behind our own ownership check
    (see ConsumerCatalogService) — the caller never gets raw repo access,
    only the one file they're entitled to."""
    owner, repo = parse_owner_repo(repo_url)
    clean_path = path.strip().lstrip("/")
    if not clean_path:
        raise GithubContentError("No file path configured for this item")
    url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/contents/{clean_path}"
    headers = {
        "Authorization": f"Bearer {token}",
        # application/vnd.github.raw returns the file's raw bytes directly
        # instead of a JSON envelope with base64-encoded content.
        "Accept": "application/vnd.github.raw",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    try:
        response = httpx.get(url, headers=headers, timeout=_REQUEST_TIMEOUT_SECONDS, follow_redirects=True)
    except httpx.HTTPError as exc:
        raise GithubContentError(f"Could not reach GitHub: {exc}") from exc

    if response.status_code == 200:
        return response.content
    if response.status_code == 404:
        raise GithubContentError("File not found in the repository", status_code=404)
    if response.status_code in (401, 403):
        raise GithubContentError(
            "The GitHub token is missing or does not have read access to this repository",
            status_code=403,
        )
    raise GithubContentError(
        f"Unexpected response from GitHub ({response.status_code})", status_code=response.status_code
    )


def list_directory(*, repo_url: str, path: str, token: str) -> list[dict]:
    """Lists a folder's direct entries (name, path, type, ...) via the
    GitHub Contents API. Used for resource items' repo_path, which is meant
    to point at a folder — containing a README.md and/or a packaged .zip
    and/or a .docx/.xlsx — so we can find each one's exact filename without
    the admin having to type it in twice.

    Tolerates repo_path pointing directly at a single file instead of its
    containing folder (an easy admin mistake, and a perfectly reasonable
    thing to do for a one-file resource): the Contents API returns a lone
    JSON object rather than an array in that case, which we normalize into
    a one-entry list so every caller's "find README.md/.docx/.xlsx/.zip
    among these entries" logic keeps working unchanged, whether repo_path
    is a folder or the file itself."""
    owner, repo = parse_owner_repo(repo_url)
    clean_path = path.strip().strip("/")
    url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/contents/{clean_path}" if clean_path else f"{GITHUB_API_BASE}/repos/{owner}/{repo}/contents"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    try:
        response = httpx.get(url, headers=headers, timeout=_REQUEST_TIMEOUT_SECONDS, follow_redirects=True)
    except httpx.HTTPError as exc:
        raise GithubContentError(f"Could not reach GitHub: {exc}") from exc

    if response.status_code == 200:
        data = response.json()
        if isinstance(data, list):
            return data
        if isinstance(data, dict) and data.get("type") == "file":
            return [data]
        raise GithubContentError(
            "Unexpected response from GitHub for this path", status_code=422
        )
    if response.status_code == 404:
        raise GithubContentError("Folder not found in the repository", status_code=404)
    if response.status_code in (401, 403):
        raise GithubContentError(
            "The GitHub token is missing or does not have read access to this repository",
            status_code=403,
        )
    raise GithubContentError(
        f"Unexpected response from GitHub ({response.status_code})", status_code=response.status_code
    )


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
