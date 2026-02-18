import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
CONTRACTS_DIR = REPO_ROOT / "contracts"
FRONTEND_SCHEMAS_DIR = CONTRACTS_DIR / "frontend_responses"
DENYLIST_PATH = CONTRACTS_DIR / "redaction_denylist.json"
PUBLIC_FRONTEND_SCHEMA_PATH = CONTRACTS_DIR / "public_frontend_config.schema.json"

REQUIRED_UI_TOKEN_PATHS = [
    "$.properties.ui.properties.tokens",
    "$.properties.ui.properties.tokens.properties.primary_color",
    "$.properties.ui.properties.tokens.properties.accent_color",
    "$.properties.ui.properties.tokens.properties.surface_style",
    "$.properties.ui.properties.tokens.properties.density",
    "$.properties.ui.properties.tokens.properties.corner_radius_scale",
]


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
                    if key_lc in sensitive_keys:
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

    public_schema = json.loads(PUBLIC_FRONTEND_SCHEMA_PATH.read_text(encoding="utf-8"))
    public_paths = {json_path for json_path, _node in flatten_json(public_schema)}
    missing_token_paths = [path for path in REQUIRED_UI_TOKEN_PATHS if path not in public_paths]
    if missing_token_paths:
        joined = ", ".join(missing_token_paths)
        violations.append(
            "contracts/public_frontend_config.schema.json: missing required ui token path(s): "
            f"{joined}"
        )

    frontend_config_response_path = FRONTEND_SCHEMAS_DIR / "frontend_config_response.schema.json"
    frontend_config_response = json.loads(frontend_config_response_path.read_text(encoding="utf-8"))
    config_ref = frontend_config_response.get("properties", {}).get("config", {}).get("$ref")
    if config_ref != "../public_frontend_config.schema.json":
        violations.append(
            "contracts/frontend_responses/frontend_config_response.schema.json: "
            "properties.config.$ref must remain '../public_frontend_config.schema.json'"
        )

    if violations:
        print("FAILED: frontend schema contracts expose denylisted key/path material")
        for violation in violations:
            print(f" - {violation}")
        raise SystemExit(1)

    print(f"PASS: checked {len(schema_files)} frontend response schema file(s); no denylisted fields found.")


if __name__ == "__main__":
    main()
