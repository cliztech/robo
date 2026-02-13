import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
CONTRACTS_DIR = REPO_ROOT / "contracts"
FRONTEND_SCHEMAS_DIR = CONTRACTS_DIR / "frontend_responses"
DENYLIST_PATH = CONTRACTS_DIR / "redaction_denylist.json"


def flatten_json(value, path="$"):
    yield path, value
    if isinstance(value, dict):
        for key, child in value.items():
            yield from flatten_json(child, f"{path}.{key}")
    elif isinstance(value, list):
        for index, child in enumerate(value):
            yield from flatten_json(child, f"{path}[{index}]")


def main():
    denylist = json.loads(DENYLIST_PATH.read_text(encoding="utf-8"))
    sensitive_keys = {key.lower() for key in denylist["sensitive_keys"]}
    sensitive_fragments = [fragment.lower() for fragment in denylist["sensitive_path_fragments"]]

    violations = []
    schema_files = sorted(FRONTEND_SCHEMAS_DIR.glob("*.schema.json"))

    for schema_file in schema_files:
        schema = json.loads(schema_file.read_text(encoding="utf-8"))
        for json_path, node in flatten_json(schema):
            if isinstance(node, dict):
                for key in node.keys():
                    key_lc = key.lower()
                    if key_lc in sensitive_keys or any(sensitive in key_lc for sensitive in sensitive_keys):
                        violations.append(
                            f"{schema_file.relative_to(REPO_ROOT)}: denylisted key '{key}' at {json_path}"
                        )
            elif isinstance(node, str):
                node_lc = node.lower()
                for fragment in sensitive_fragments:
                    if fragment and fragment in node_lc:
                        violations.append(
                            f"{schema_file.relative_to(REPO_ROOT)}: denylisted path fragment '{fragment}' in value at {json_path}"
                        )

    if violations:
        print("FAILED: frontend schema contracts expose denylisted key/path material")
        for violation in violations:
            print(f" - {violation}")
        raise SystemExit(1)

    print(f"PASS: checked {len(schema_files)} frontend response schema file(s); no denylisted fields found.")


if __name__ == "__main__":
    main()
