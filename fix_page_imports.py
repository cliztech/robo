import re

file_path = 'src/app/page.tsx'

with open(file_path, 'r') as f:
    lines = f.readlines()

# Simple deduplication strategy:
# 1. Collect all lines.
# 2. If a line is an import, check if we've seen a "similar" import.
# But imports can be complex.
# "import { useMemo, useState } from 'react';" vs "import React, { useState, ... } from 'react';"

# Better strategy:
# Just remove the specific known duplicates I saw in `head`.

clean_lines = []
seen_react_import = False
seen_framer_import = False

for line in lines:
    stripped = line.strip()

    # Handle React imports
    if 'from \'react\'' in stripped or 'from "react"' in stripped:
        if not seen_react_import:
            # Replace with a comprehensive one
            clean_lines.append("import React, { useState, useEffect, useCallback, useMemo } from 'react';\n")
            seen_react_import = True
        continue

    # Handle framer-motion imports
    if 'from \'framer-motion\'' in stripped or 'from "framer-motion"' in stripped:
        if not seen_framer_import:
            clean_lines.append("import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';\n")
            seen_framer_import = True
        continue

    clean_lines.append(line)

with open(file_path, 'w') as f:
    f.writelines(clean_lines)

print("Imports cleaned.")
