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

$resp = Invoke-RestMethod -Uri $apiUrl -UseBasicParsing

foreach ($prop in $resp.query.pages.PSObject.Properties) {
    $page = $prop.Value
    if ($page.imageinfo) {
        $title = $page.title
        $url = $page.imageinfo[0].url
        Write-Host "$title -> $url"
    }
}
