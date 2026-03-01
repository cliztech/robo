with open("backend/security/approval_policy.py", "r") as f:
    content = f.read()

# Someone appended the entire file contents at the end or middle?
# Let's see what's happening at line 116.
