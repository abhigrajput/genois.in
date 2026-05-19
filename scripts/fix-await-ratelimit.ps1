$files = Get-ChildItem -Path "app\api" -Recurse -Filter "route.js"
$count = 0

foreach ($file in $files) {
  $content = [System.IO.File]::ReadAllText($file.FullName)
  $original = $content

  # Add await before rateLimit( calls that are missing it
  # Pattern: if (!rateLimit( or if (rateLimit(
  $content = [regex]::Replace(
    $content,
    'if \(!rateLimit\(',
    'if (!await rateLimit('
  )
  $content = [regex]::Replace(
    $content,
    'if \(rateLimit\(',
    'if (await rateLimit('
  )

  if ($content -ne $original) {
    [System.IO.File]::WriteAllText($file.FullName, $content)
    Write-Host "Patched: $($file.FullName -replace '.*\\app\\api\\', 'app/api/')"
    $count++
  }
}

Write-Host "`nDone. Patched $count files."
