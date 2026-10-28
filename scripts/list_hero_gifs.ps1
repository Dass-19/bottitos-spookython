$prefixes = @('Marco', 'Tarma', 'Eri', 'Fio', 'Rebel', 'Doctor', 'Medic')

foreach ($pre in $prefixes) {
    $apiUrl = "https://metalslug.fandom.com/api.php?action=query&list=allimages&aiprefix=$pre&ailimit=30&format=json"
    $resp = Invoke-RestMethod -Uri $apiUrl -UseBasicParsing
    foreach ($img in $resp.query.allimages) {
        if ($img.name -match '\.gif$') {
            Write-Host "$($img.name) -> $($img.url)"
        }
    }
}
