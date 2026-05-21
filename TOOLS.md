# Installed Tools

Tools installed to support GenAI development work with Claude Code.

---

## Git
**What it does:** Version control system. Tracks changes to files, allows you to save snapshots of your work, and syncs code to GitHub.

**Uninstall:**
```powershell
winget uninstall Git.Git
```

---

## GitHub CLI (`gh`)
**What it does:** Command-line interface for GitHub. Lets Claude create repositories, push code, manage pull requests, and interact with GitHub without a browser.

**Uninstall:**
```powershell
winget uninstall GitHub.cli
```

---

## uv
**What it does:** Fast Python package and environment manager. Replaces `pip` and `venv`. Used to install Python libraries (like the Anthropic SDK, LangChain, etc.) and create isolated project environments much faster than traditional tools.

**Uninstall:**
```powershell
winget uninstall astral-sh.uv
```

---

## Node.js (LTS)
**What it does:** JavaScript runtime. Required for many AI tools, MCP (Model Context Protocol) servers that extend Claude's capabilities, and any web-based frontends built alongside AI backends.

**Uninstall:**
```powershell
winget uninstall OpenJS.NodeJS.LTS
```

---

## Notes
- All tools were installed via **winget** (Windows Package Manager), which comes built into Windows 11.
- To list all winget-installed packages: `winget list`
- To update all tools at once: `winget upgrade --all`
