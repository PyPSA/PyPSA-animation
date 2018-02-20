import json

with open('ne_50m_admin_0_countries_simplified.json', 'r') as fp:
    ne = json.load(fp)

ne.keys()

ne["type"]

type(ne["features"]),len(ne["features"])

ne["features"][0]["properties"]["iso_a2"]

cts = ['AT', 'FI', 'NL', 'BA', 'FR', 'NO', 'BE', 'GB', 'PL', 'BG', 'GR', 'PT',
       'CH', 'HR', 'RO', 'CZ', 'HU', 'RS', 'DE', 'IE', 'SE', 'DK', 'IT', 'SI',
       'ES', 'LU', 'SK', 'EE', 'LV', 'LT']

new = {}

new["type"] = ne["type"]

new["features"] = []

for feature in ne["features"]:
    if feature["properties"]["iso_a2"] in cts:
        new["features"].append(feature)

print(len(new["features"]))
for feature in new["features"]:
    print(feature["properties"]["iso_a2"])

with open('ne_50m_admin_0_countries_simplified_europe.json', 'w') as fp:
    json.dump(new,fp)


