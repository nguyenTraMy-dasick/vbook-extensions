"""Build plugin.zip for each extension in ./extensions.

Usage:  python build.py            # build all
        python build.py ao3        # build one

Zip entries always use "/" (src/chap.js). Zipping on Windows with Explorer/7-Zip
can store "src\\chap.js", which vBook does not treat as the src/ folder.
"""
import json
import os
import sys
import zipfile

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "extensions")


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
    names = sys.argv[1:] or sorted(
        d for d in os.listdir(ROOT) if os.path.isfile(os.path.join(ROOT, d, "plugin.json"))
    )
    for n in names:
        build(n)
