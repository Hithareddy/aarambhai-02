import subprocess
result = subprocess.run([".venv\\Scripts\\alembic", "revision", "--autogenerate", "-m", "auto sync missing fields"], capture_output=True, text=True)
with open("alembic_out.log", "w") as f:
    f.write(result.stdout)
with open("alembic_err.log", "w") as f:
    f.write(result.stderr)
