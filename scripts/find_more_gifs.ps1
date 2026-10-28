$titles = @(
    "File:Marco-Walking.gif",
    "File:Marco_Walk.gif",
    "File:Marco-Zombie.gif",
    "File:Zombie-Marco.gif",
    "File:Zombie-Attack.gif",
    "File:Blood-Vomit.gif",
    "File:First-Aid-Kit.gif",
    "File:FirstAidKit.gif",
    "File:Cure.gif",
    "File:Doctor.gif",
    "File:Rebel-Soldier-Walk.gif"
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
