# =========================================================================
#  URBAN TRAIL · 랜드마크 이미지 PNG 변환
#  tools/_dl/manifest.json 을 읽어 assets/landmarks/<도시명>-<랜드마크>.png 생성
#  실행:  powershell -ExecutionPolicy Bypass -File tools\convert-png.ps1
# =========================================================================
Add-Type -AssemblyName System.Drawing
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$root     = Split-Path -Parent $PSScriptRoot
$manifest = Join-Path $PSScriptRoot "_dl\manifest.json"
$outDir   = Join-Path $root "assets\landmarks"

# 가로세로 비율은 그대로 두고 1200 x 900 박스 안에 들어오게 축소한다.
# (탑·고층건물 사진이 세로로 극단적으로 길어져 파일이 비대해지는 것을 막는다)
$maxWidth  = 1200
$maxHeight = 900

if (-not (Test-Path $manifest)) { Write-Error "manifest.json 이 없습니다. 먼저 fetch-landmarks.js 를 실행하세요."; exit 1 }
if (-not (Test-Path $outDir))   { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }

$items = Get-Content -Raw -Encoding UTF8 $manifest | ConvertFrom-Json
$ok = 0; $fail = 0; $total = 0

foreach ($it in $items) {
  $srcPath = $it.src
  if (-not (Test-Path $srcPath)) { Write-Host ("✗ {0}  원본 없음" -f $it.city); $fail++; continue }

  # 파일명에 쓸 수 없는 문자 치환
  $name = $it.out
  foreach ($ch in [System.IO.Path]::GetInvalidFileNameChars()) { $name = $name.Replace($ch, '_') }
  $dest = Join-Path $outDir $name

  try {
    $src = [System.Drawing.Image]::FromFile($srcPath)
    $ow = $src.Width; $oh = $src.Height

    $scale = [Math]::Min(1.0, [Math]::Min($maxWidth / $ow, $maxHeight / $oh))
    $w = [int][Math]::Round($ow * $scale)
    $h = [int][Math]::Round($oh * $scale)

    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g   = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode   = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.CompositingQuality= [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.DrawImage($src, 0, 0, $w, $h)

    $bmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)

    $g.Dispose(); $bmp.Dispose(); $src.Dispose()

    $kb = [Math]::Round((Get-Item $dest).Length / 1KB)
    $total += (Get-Item $dest).Length
    Write-Host ("✓ {0,-38} {1,4}x{2,-4} {3,6} KB" -f $name, $w, $h, $kb)
    $ok++
  }
  catch {
    Write-Host ("✗ {0}  변환 실패: {1}" -f $it.city, $_.Exception.Message)
    $fail++
  }
}

Write-Host ""
Write-Host ("완료: {0}개 성공 / {1}개 실패 · 합계 {2} MB" -f $ok, $fail, [Math]::Round($total/1MB, 1))
