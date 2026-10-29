"""Build plugin.zip for each extension in ./extensions and regenerate the
repository index ./plugin.json (the file the vBook "Extension URL" points to).

Usage:  python build.py            # build all
        python build.py ao3        # build one (the index still lists all)

Zip entries always use "/" (src/chap.js). Zipping on Windows with Explorer/7-Zip
can store "src\\chap.js", which vBook does not treat as the src/ folder.
"""
import json
import os
import sys
import zipfile

REPO_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(REPO_DIR, "extensions")
RAW_BASE = "https://raw.githubusercontent.com/nguyenTraMy-dasick/vbook-extensions/main/extensions"
INDEX_AUTHOR = "Ivy"
INDEX_DESCRIPTION = "Extension vBook cho AO3 và FanFiction.net"


def list_extensions():
    return sorted(d for d in os.listdir(ROOT) if os.path.isfile(os.path.join(ROOT, d, "plugin.json")))


def write_index():
    data = []
    for name in list_extensions():
        with open(os.path.join(ROOT, name, "plugin.json"), encoding="utf-8") as f:
            m = json.load(f)["metadata"]
        entry = {
            "name": m.get("name", name),
            "author": m.get("author", INDEX_AUTHOR),
            "path": "%s/%s/plugin.zip" % (RAW_BASE, name),
            "version": m.get("version", 1),
            "source": m.get("source", ""),
            "icon": "%s/%s/icon.png" % (RAW_BASE, name),
            "description": m.get("description", ""),
            "type": m.get("type", "novel"),
            "locale": m.get("locale", ""),
        }
        if not os.path.isfile(os.path.join(ROOT, name, "icon.png")):
            del entry["icon"]
        data.append(entry)
    index = {"metadata": {"author": INDEX_AUTHOR, "description": INDEX_DESCRIPTION}, "data": data}
    with open(os.path.join(REPO_DIR, "plugin.json"), "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print("wrote plugin.json (%d extensions)" % len(data))


def build(name):
    ext_dir = os.path.join(ROOT, name)
    manifest = os.path.join(ext_dir, "plugin.json")
    with open(manifest, encoding="utf-8") as f:
        meta = json.load(f)
    for script in meta.get("script", {}).values():
        if not os.path.isfile(os.path.join(ext_dir, "src", script)):
            raise SystemExit("%s: missing src/%s" % (name, script))

    out = os.path.join(ext_dir, "plugin.zip")
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        z.write(manifest, "plugin.json")
        icon = os.path.join(ext_dir, "icon.png")
        if os.path.isfile(icon):
            z.write(icon, "icon.png")
        for fn in sorted(os.listdir(os.path.join(ext_dir, "src"))):
            if fn.endswith(".js"):
                z.write(os.path.join(ext_dir, "src", fn), "src/" + fn)
    print("built %s (v%s)" % (os.path.relpath(out), meta["metadata"].get("version")))


if __name__ == "__main__":
    for n in sys.argv[1:] or list_extensions():
        build(n)
    write_index()
