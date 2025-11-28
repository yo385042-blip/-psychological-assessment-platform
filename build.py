#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import subprocess
import sys

# 获取脚本所在目录
script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)

print(f'Building project in: {os.getcwd()}')
print('Running npm run build...')

try:
    result = subprocess.run(
        ['npm', 'run', 'build'],
        cwd=script_dir,
        check=True,
        capture_output=False
    )
    print('Build completed successfully!')
    sys.exit(0)
except subprocess.CalledProcessError as e:
    print(f'Build failed with exit code {e.returncode}')
    sys.exit(e.returncode)
except Exception as e:
    print(f'Error: {e}')
    sys.exit(1)
