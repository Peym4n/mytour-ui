param(
  [string]$InputPath = (Join-Path $PSScriptRoot "..\final-protocol.md"),
  [string]$OutputPath = (Join-Path $PSScriptRoot "..\..\..\final-protocol.pdf")
)

$ErrorActionPreference = "Stop"

$inputFile = Resolve-Path -LiteralPath $InputPath
$docsDir = Split-Path -Parent $inputFile
$outputFile = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputPath)
$tempFile = Join-Path $docsDir ".final-protocol.pandoc.md"
$tempPdf = Join-Path $docsDir ".final-protocol.pandoc.pdf"
$fallbackPdf = Join-Path $docsDir "final-protocol-new.pdf"

function ConvertTo-LatexText {
  param([string]$Text)

  $result = [System.Text.StringBuilder]::new()
  foreach ($char in $Text.ToCharArray()) {
    $escaped = switch ($char) {
      '\' { '\textbackslash{}' }
      '&' { '\&' }
      '%' { '\%' }
      '$' { '\$' }
      '#' { '\#' }
      '_' { '\_' }
      '{' { '\{' }
      '}' { '\}' }
      '~' { '\textasciitilde{}' }
      '^' { '\textasciicircum{}' }
      default { [string]$char }
    }
    [void]$result.Append($escaped)
  }

  $result.ToString()
}

function ConvertTo-LatexCell {
  param([string]$Cell)

  $cellText = $Cell.Trim()
  if ($cellText -match '^\*\*(.*)\*\*$') {
    return "\textbf{$(ConvertTo-LatexText $Matches[1].Trim())}"
  }

  ConvertTo-LatexText $cellText
}

function Get-MarkdownTableRows {
  param([string]$TableMarkdown)

  $rows = @()
  foreach ($line in ($TableMarkdown -split '\r?\n')) {
    $trimmed = $line.Trim()
    if (-not $trimmed.StartsWith('|')) {
      continue
    }

    $cells = $trimmed.Trim('|').Split('|') | ForEach-Object { $_.Trim() }
    if ($cells.Count -eq 0) {
      continue
    }

    $isSeparator = $true
    foreach ($cell in $cells) {
      if ($cell -notmatch '^:?-{3,}:?$') {
        $isSeparator = $false
        break
      }
    }

    if (-not $isSeparator) {
      $rows += ,$cells
    }
  }

  $rows
}

function Convert-TimeTrackingTableToLatex {
  param([string]$TableMarkdown)

  $rows = Get-MarkdownTableRows $TableMarkdown
  if ($rows.Count -lt 2) {
    throw "The Markdown time tracking table does not contain enough rows."
  }

  $lines = [System.Collections.Generic.List[string]]::new()
  $lines.Add('\begingroup')
  $lines.Add('\footnotesize')
  $lines.Add('\setlength{\tabcolsep}{3pt}')
  $lines.Add('\renewcommand{\arraystretch}{1.2}')
  $lines.Add('\begin{longtable}{@{}p{1.75cm}p{2.8cm}p{2.2cm}p{1.0cm}p{8.15cm}@{}}')

  for ($i = 0; $i -lt $rows.Count; $i++) {
    $cells = @($rows[$i] | ForEach-Object { ConvertTo-LatexCell $_ })
    while ($cells.Count -lt 5) {
      $cells += ''
    }

    if ($i -eq 0) {
      $cells = @($rows[$i] | ForEach-Object { "\textbf{$(ConvertTo-LatexText $_)}" })
      $lines.Add(($cells -join ' & ') + ' \\')
      $lines.Add('\hline')
      continue
    }

    $firstCellPlain = ($rows[$i][0] -replace '^\*\*(.*)\*\*$', '$1').Trim()
    if ($firstCellPlain -eq 'Total') {
      $lines.Add('\hline')
    }

    $lines.Add(($cells[0..4] -join ' & ') + ' \\')
  }

  $lines.Add('\end{longtable}')
  $lines.Add('\endgroup')

  $lines -join [Environment]::NewLine
}

$markdown = Get-Content -Raw -LiteralPath $inputFile
$tableHeader = '| Phase | Person | Area | Time | Work performed |'
$tableStart = $markdown.IndexOf($tableHeader, [StringComparison]::Ordinal)
if ($tableStart -lt 0) {
  throw "Could not find the final protocol time tracking table header."
}

$nextHeading = [regex]::Match($markdown.Substring($tableStart), '(?m)^## \d+\. Git Repository\s*$')
if (-not $nextHeading.Success) {
  throw "Could not find the Git Repository heading after the time tracking table."
}

$tableEnd = $tableStart + $nextHeading.Index
$tableMarkdown = $markdown.Substring($tableStart, $tableEnd - $tableStart).TrimEnd()

$latexTimeTrackingTable = Convert-TimeTrackingTableToLatex $tableMarkdown
$replaced = $markdown.Substring(0, $tableStart) +
  $latexTimeTrackingTable.TrimEnd() +
  [Environment]::NewLine + [Environment]::NewLine +
  $markdown.Substring($tableEnd).TrimStart()

$tocPattern = '(?m)^## 1\..*$'
$tocMatch = [regex]::Match($replaced, $tocPattern)
if (-not $tocMatch.Success) {
  throw "Could not find the first numbered section for table-of-contents placement."
}

$tocBlock = @'
\tableofcontents
\clearpage

'@

$replaced = $replaced.Substring(0, $tocMatch.Index) +
  $tocBlock +
  $replaced.Substring($tocMatch.Index)

try {
  Remove-Item -Force -LiteralPath $tempPdf -ErrorAction SilentlyContinue
  Set-Content -LiteralPath $tempFile -Value $replaced -Encoding UTF8

  & pandoc $tempFile `
    --from markdown+raw_tex-implicit_figures `
    --to pdf `
    --resource-path $docsDir `
    -V papersize:a4 `
    -V geometry:margin=2cm `
    -V float-placement=H `
    --output $tempPdf

  if ($LASTEXITCODE -ne 0) {
    throw "Pandoc failed with exit code $LASTEXITCODE."
  }

  try {
    Move-Item -Force -LiteralPath $tempPdf -Destination $outputFile
    Write-Host "Generated $outputFile"
  } catch {
    Move-Item -Force -LiteralPath $tempPdf -Destination $fallbackPdf
    Write-Warning "Could not replace $outputFile, probably because it is open in another application."
    Write-Warning "Generated fallback PDF instead: $fallbackPdf"
  }
} finally {
  Remove-Item -Force -LiteralPath $tempFile -ErrorAction SilentlyContinue
  Remove-Item -Force -LiteralPath $tempPdf -ErrorAction SilentlyContinue
}
