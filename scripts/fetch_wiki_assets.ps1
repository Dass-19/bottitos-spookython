$titles = @(
    "File:Zombie-Man-Walking.gif",
    "File:Zombie-Woman-Walking.gif",
    "File:Zombie-Scientist-Walking.gif",
    "File:Zombie-Rebel-Walking.gif",
    "File:Tarman-Walking.gif",
    "File:Zombie-Fat-Walking.gif"
)

$titlesJoined = [string]::Join('|', $titles)
$apiUrl = "https://metalslug.fandom.com/api.php?action=query&titles=$titlesJoined&prop=imageinfo&iiprop=url&format=json"

Write-Host "Fetching API: $apiUrl"
$resp = Invoke-RestMethod -Uri $apiUrl -UseBasicParsing

$outDir = "assets\sprites"
if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

foreach ($prop in $resp.query.pages.PSObject.Properties) {
    $page = $prop.Value
    if ($page.imageinfo -and $page.imageinfo.Count -gt 0) {
        $imgUrl = $page.imageinfo[0].url
        $title = $page.title -replace '^File:', ''
        $localPath = Join-Path $outDir $title
        Write-Host "Downloading $title from $imgUrl"
        Invoke-WebRequest -Uri $imgUrl -OutFile $localPath -UseBasicParsing
    }
}

Write-Host "Download complete. Files in $outDir :"
Get-ChildItem $outDir | Select-Object Name, Length
