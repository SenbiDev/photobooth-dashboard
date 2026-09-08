param(
  [int]$Width = 390,
  [int]$Height = 844,
  [string]$Browser = 'C:\Users\user\AppData\Roaming\npm\agent-browser.cmd',
  [string]$Session = 'photobooth-refactor'
)

$ErrorActionPreference = 'Stop'
$qaRoot = Split-Path -Parent $PSScriptRoot
$qaPages = & rg --files "$qaRoot/app/(console)"
$qaRoutes = @($qaPages | Where-Object { $_ -match 'page\.tsx$' -and $_ -notmatch '\[' } | ForEach-Object {
  $relative = $_.Replace("$qaRoot/app/(console)", '').Replace('\', '/')
  $relative -replace '/page\.tsx$', ''
}) + @('/devices/LIL-BOOTH-014', '/devices/LIL-BOOTH-022/policy')

& $Browser --session $Session set viewport $Width $Height | Out-Null
$qaScript = 'JSON.stringify({url:location.pathname,title:document.querySelector("main h1")?.textContent,overflow:document.documentElement.scrollWidth>innerWidth,undefinedText:/undefined/.test(document.querySelector("main")?.innerText||""),lang:document.documentElement.lang})'
$qaEncoded = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($qaScript))
$qaResults = @()
foreach ($qaRoute in $qaRoutes) {
  & $Browser --session $Session open "http://localhost:3000$qaRoute" | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Navigation failed: $qaRoute" }
  & $Browser --session $Session snapshot -i | Out-Null
  $qaRaw = & $Browser --session $Session --json eval -b $qaEncoded
  $qaEnvelope = $qaRaw | ConvertFrom-Json
  if (-not $qaEnvelope.success) { throw "Inspection failed: $qaRoute" }
  $qaResult = $qaEnvelope.data.result | ConvertFrom-Json
  $qaResults += $qaResult
  Write-Output "$Width | $($qaResult.url) | overflow=$($qaResult.overflow) | undefined=$($qaResult.undefinedText) | $($qaResult.title)"
  if (-not $qaResult.title -or $qaResult.overflow -or $qaResult.undefinedText) {
    throw "UI smoke check failed: $qaRoute"
  }
}
Write-Output "PASS: $($qaResults.Count) routes at ${Width}x${Height}"
