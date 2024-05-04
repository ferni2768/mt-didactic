import subprocess
import sys

def upgrade_packages():
    result = subprocess.run([sys.executable, '-m', 'pip', 'list', '--outdated', '--format=freeze'], 
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    packages = [pkg.split('==')[0] for pkg in result.stdout.splitlines()]
    for package in packages:
        subprocess.run([sys.executable, '-m', 'pip', 'install', '--upgrade', package])

if __name__ == '__main__':
    upgrade_packages()