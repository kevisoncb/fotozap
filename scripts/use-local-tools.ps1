$root = Split-Path -Parent $PSScriptRoot
$env:PATH = "$root\.tools\node;$root\.tools\git\cmd;" + $env:PATH
Write-Output "PATH atualizado para Node/Git portáteis deste repositório."
node -v
git --version
