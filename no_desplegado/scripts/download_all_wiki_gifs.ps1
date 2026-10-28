$assets = @{
    "Zombie-Man-Walking.gif"       = "https://static.wikia.nocookie.net/metalslug/images/4/49/Zombie-Man-Walking.gif/revision/latest?cb=20160724131752"
    "Zombie-Rebel-Walking.gif"     = "https://static.wikia.nocookie.net/metalslug/images/b/bd/Zombie-Rebel-Walking.gif/revision/latest?cb=20160724135032"
    "Zombie-Scientist-Walking.gif" = "https://static.wikia.nocookie.net/metalslug/images/6/6d/Zombie-Scientist-Walking.gif/revision/latest?cb=20160724140500"
    "Zombie-Woman-Walking.gif"     = "https://static.wikia.nocookie.net/metalslug/images/a/a8/Zombie-Woman-Walking.gif/revision/latest?cb=20160724124804"
    "Tarman-Walking.gif"           = "https://static.wikia.nocookie.net/metalslug/images/0/0f/Tarman-Walking.gif/revision/latest?cb=20160724135557"
    "Zombie-Fat-Walking.gif"       = "https://static.wikia.nocookie.net/metalslug/images/6/61/Zombie-Fat-Walking.gif/revision/latest?cb=20160724125826"
    "Zombie_Marco_Idle.gif"        = "https://static.wikia.nocookie.net/metalslug/images/f/f0/Zombie_Marco_Idle.gif/revision/latest?cb=20240417021003"
    "Zombie_Tarma_Idle.gif"        = "https://static.wikia.nocookie.net/metalslug/images/4/4b/Zombie_Tarma_Idle.gif/revision/latest?cb=20240417013938"
    "Zombie_Eri_Idle.gif"          = "https://static.wikia.nocookie.net/metalslug/images/9/95/Zombie_Eri_Idle.gif/revision/latest?cb=20240417031536"
    "Zombie_Fio_Idle.gif"          = "https://static.wikia.nocookie.net/metalslug/images/a/a2/Zombie_Fio_Idle.gif/revision/latest?cb=20240417024020"
    "Zombiesoldier.gif"            = "https://static.wikia.nocookie.net/metalslug/images/d/d0/Zombiesoldier.gif/revision/latest?cb=20081202220109"
    "Marco-ms4.gif"                = "https://static.wikia.nocookie.net/metalslug/images/6/60/Marco-ms4.gif/revision/latest?cb=20090919142334"
    "Tarma.gif"                    = "https://static.wikia.nocookie.net/metalslug/images/9/9b/Tarma.gif/revision/latest?cb=20090105061004"
    "Rebel.gif"                    = "https://static.wikia.nocookie.net/metalslug/images/9/91/Rebel.gif/revision/latest?cb=20081203233117"
    "RebelRifleman.gif"            = "https://static.wikia.nocookie.net/metalslug/images/d/db/RebelRifleman.gif/revision/latest?cb=20161228100944"
    "DoctorBraveGuerrier.gif"      = "https://static.wikia.nocookie.net/metalslug/images/2/21/DoctorBraveGuerrierMSAIdle.gif/revision/latest?cb=20170909150953"
    "Medicine.gif"                 = "https://static.wikia.nocookie.net/metalslug/images/6/69/Medicine.gif/revision/latest?cb=20090310142148"
}

$outDir = "assets\sprites"
if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

$ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
$referer = "https://metalslug.fandom.com/wiki/Zombies"

foreach ($name in $assets.Keys) {
    $url = $assets[$name]
    $dest = Join-Path $outDir $name
    Write-Host "Downloading $name..."
    & curl.exe -s -L -H "User-Agent: $ua" -H "Referer: $referer" $url -o $dest
}

Write-Host "Downloaded files:"
Get-ChildItem $outDir | Select-Object Name, Length
