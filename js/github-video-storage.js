/**
 * Save and load lesson videos from the site's GitHub repository.
 * Uploads require a Personal Access Token with repo Contents write access.
 */
(function () {
  const cfg = window.GITHUB_VIDEO_CONFIG;
  if (!cfg) return;

  const API = "https://api.github.com";
  const MAX_BYTES = 50 * 1024 * 1024;

  function apiUrl(path) {
    return `${API}/repos/${cfg.owner}/${cfg.repo}/contents/${path}`;
  }

  function getToken() {
    return localStorage.getItem(cfg.tokenStorageKey) || "";
  }

  function setToken(token) {
    if (token) {
      localStorage.setItem(cfg.tokenStorageKey, token);
    } else {
      localStorage.removeItem(cfg.tokenStorageKey);
    }
  }

  function hasToken() {
    return Boolean(getToken());
  }

  function siteBasePath() {
    if (cfg.siteBasePath) {
      return cfg.siteBasePath.endsWith("/") ? cfg.siteBasePath : `${cfg.siteBasePath}/`;
    }

    const path = window.location.pathname;
    if (path.endsWith("/")) return path;
    if (/\.[a-z0-9]+$/i.test(path)) {
      return path.replace(/\/[^/]*$/, "/");
    }
    return `${path}/`;
  }

  function videoPublicUrl(fileName, cacheBust) {
    const relative = `${siteBasePath()}${cfg.videosDir}/${fileName}`.replace(/\/{2,}/g, "/");
    const url = new URL(relative, window.location.origin).href;
    return cacheBust ? `${url}?v=${encodeURIComponent(cacheBust)}` : url;
  }

  async function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result !== "string") {
          reject(new Error("Could not encode file."));
          return;
        }
        resolve(result.split(",")[1]);
      };
      reader.onerror = () => reject(reader.error || new Error("Could not read file."));
      reader.readAsDataURL(blob);
    });
  }

  async function apiRequest(path, { method = "GET", body, token } = {}) {
    const authToken = token || getToken();
    const headers = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const res = await fetch(apiUrl(path), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 404) return null;

    const text = await res.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!res.ok) {
      const message =
        data?.message || `GitHub API error (${res.status})`;
      const err = new Error(message);
      err.status = res.status;
      throw err;
    }

    return data;
  }

  async function fetchManifest() {
    try {
      const res = await fetch(videoPublicUrl("manifest.json", Date.now()), { cache: "no-store" });
      if (!res.ok) return { version: 1, slots: { 1: null, 2: null, 3: null, 4: null } };
      return await res.json();
    } catch {
      return { version: 1, slots: { 1: null, 2: null, 3: null, 4: null } };
    }
  }

  async function putRepoFile(path, base64Content, message, sha) {
    const body = {
      message,
      content: base64Content,
      branch: cfg.branch,
    };
    if (sha) body.sha = sha;

    return apiRequest(path, { method: "PUT", body });
  }

  async function getRepoFileSha(path) {
    const data = await apiRequest(path);
    return data?.sha || null;
  }

  function extensionForFile(file) {
    const name = file.name || "";
    const dot = name.lastIndexOf(".");
    if (dot > -1) {
      const ext = name.slice(dot + 1).toLowerCase();
      if (/^[a-z0-9]{2,5}$/.test(ext)) return ext;
    }
    if (file.type === "video/webm") return "webm";
    if (file.type === "video/quicktime") return "mov";
    return "mp4";
  }

  async function validateToken(token) {
    const res = await fetch(`${API}/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || "Invalid GitHub token.");
    }
    return res.json();
  }

  async function saveVideoToGitHub(slotId, file) {
    if (!hasToken()) {
      throw new Error("Connect GitHub first to save uploads.");
    }
    if (file.size > MAX_BYTES) {
      throw new Error("Video is too large for GitHub (max 50 MB).");
    }

    const ext = extensionForFile(file);
    const repoFileName = `slot-${slotId}.${ext}`;
    const repoPath = `${cfg.videosDir}/${repoFileName}`;
    const base64 = await blobToBase64(file);

    const existingSha = await getRepoFileSha(repoPath);
    await putRepoFile(
      repoPath,
      base64,
      `Upload lesson video ${slotId}`,
      existingSha
    );

    const manifest = await fetchManifest();
    manifest.slots = manifest.slots || {};
    manifest.slots[String(slotId)] = {
      file: repoFileName,
      fileName: file.name || repoFileName,
      mimeType: file.type || `video/${ext}`,
      updatedAt: new Date().toISOString(),
    };

    const manifestSha = await getRepoFileSha(cfg.manifestPath);
    await putRepoFile(
      cfg.manifestPath,
      await blobToBase64(new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" })),
      `Update video manifest for slot ${slotId}`,
      manifestSha
    );

    return {
      manifest,
      slot: manifest.slots[String(slotId)],
      url: videoPublicUrl(repoFileName, manifest.slots[String(slotId)].updatedAt),
    };
  }

  window.GitHubVideoStorage = {
    cfg,
    getToken,
    setToken,
    hasToken,
    validateToken,
    fetchManifest,
    videoPublicUrl,
    saveVideoToGitHub,
    MAX_BYTES,
  };
})();
