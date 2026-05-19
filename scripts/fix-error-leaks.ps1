Get-ChildItem -Path "app\api" -Recurse -Filter "route.js" | ForEach-Object {
  $path = $_.FullName
  $content = [System.IO.File]::ReadAllText($path)
  $original = $content

  # Pattern 1: errorResponse(error.message, 500)
  $content = [regex]::Replace($content, "errorResponse\(error\.message,\s*500\)", "errorResponse('Internal server error', 500)")

  # Pattern 2: errorResponse(error.message || 'anything', 500)
  $content = [regex]::Replace($content, "errorResponse\(error\.message \|\| '[^']*',\s*500\)", "errorResponse('Internal server error', 500)")

  if ($content -ne $original) {
    [System.IO.File]::WriteAllText($path, $content)
    Write-Host "Fixed: $($path -replace '.*\\app\\api\\', 'app/api/')"
  }
}
Write-Host "Done - all error.message leaks patched."
