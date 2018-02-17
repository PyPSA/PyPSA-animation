import pypsa, json

import pandas as pd

#%matplotlib inline

network_name = "/home/tom/results/tom/snakemake/version-16/postnetworks/postnetwork-elec_only_opt.h5"

network_name = "/home/tom/results/supplementary_data_benefits_of_cooperation/results/diw2030-CO0-T1_8761-wWsgrpHb-LV0.25_c0_base_diw2030_solar1_7_angles-2017-01-31-20-12-02/"

n = pypsa.Network(network_name)

coord_round = 3

power_round = 0

num_snapshots = 168

folder = "./"

colors = {"OCGT" :"#835C3B",
          "onwind":"#3B6182",
          "offwind" :"#ADD8E6",
          "solar" :"#FFFF00",
          "load": "#FF0000",
          "battery" : "#999999",
          "H2" : "#FF00EE",
          "PHS" : "#1dff00",
          "hydro" : "#008000",
          "ror" : "#90EE90",
          }

def rename_techs(label):
    if "H2" in label:
        label = "hydrogen storage"
    if label == "solar":
        label = "solar PV"
    if label == "offwind":
        label = "offshore wind"
    if label == "onwind":
        label = "onshore wind"
    if label == "ror":
        label = "run-of-river"
    if label == "hydro":
        label = "hydro reservoir"
    if label == "PHS":
        label = "pumped hydro"
    if "battery" in label:
        label = "battery storage"
    if label == "OCGT":
        label = "gas OCGT"
    return label

#corrections to improve optics

n.buses.loc["NO",["x","y"]] = [9.5,61.5]
n.buses.loc["SE",["x","y"]] = [15,60.5]
n.buses.at["FI","y"] = 62

carrier = "AC"

buses = n.buses[n.buses.carrier == carrier]

data = {"index" : list(buses.index),
        "x" : list(buses.x.round(coord_round)),
        "y" : list(buses.y.round(coord_round)),
       }


with open(folder + 'buses.json', 'w') as fp:
    fp.write("var buses = ")
    json.dump(data, fp)

links = n.links[n.links.index.str[2:3] == "-"]

links.bus0.map(buses.x)

data = {"index" : list(links.index),
        "bus0" : list(links.bus0),
        "bus1" : list(links.bus1),
        "x0" : list(links.bus0.map(buses.x).round(coord_round)),
        "y0" : list(links.bus0.map(buses.y).round(coord_round)),
        "x1" : list(links.bus1.map(buses.x).round(coord_round)),
        "y1" : list(links.bus1.map(buses.y).round(coord_round)),
        "p_nom_opt" : list(links.p_nom_opt.round(power_round)),
       }


with open(folder + 'links.json', 'w') as fp:
    fp.write("var links = ")
    json.dump(data, fp)

with open(folder + 'flow.json', 'w') as fp:
    fp.write("var flows = ")
    json.dump(n.links_t.p0[links.index][:num_snapshots].round(power_round).values.tolist(),fp)


with open(folder + 'snapshots.json', 'w') as fp:
    fp.write("var snapshots= ")
    json.dump([str(i) for i in n.snapshots[:num_snapshots]], fp)

preferred_order = pd.Index(["offwind","onwind","solar","OCGT","ror","hydro","PHS","battery","H2"])

generation_carriers = n.generators.carrier.value_counts().index
generation_carriers = (preferred_order&generation_carriers).append(generation_carriers.difference(preferred_order))
generation_carriers

storage_carriers = n.storage_units.carrier.value_counts().index
storage_carriers = (preferred_order&storage_carriers).append(storage_carriers.difference(preferred_order))
storage_carriers

carriers = {}

carriers["positive"] = generation_carriers.append(storage_carriers)

carriers["negative"] = pd.Index(["load"]).append(storage_carriers)
print(carriers)

with open(folder + 'carriers.json', 'w') as fp:
        fp.write("var carriers = ")
        json.dump({sign : {"index" : [rename_techs(c) for c in carriers[sign]],
                   "color" : [colors[c] for c in carriers[sign]]} for sign in ["positive","negative"]}, fp)

data = {"positive" : [],
        "negative" : []}
for ct in buses.index:

    storage = n.storage_units_t.p.loc[:,n.storage_units.bus == ct].groupby(n.storage_units.carrier,axis=1).sum().reindex(columns=storage_carriers).fillna(0.)
    generation = n.generators_t.p.loc[:,n.generators.bus == ct].groupby(n.generators.carrier,axis=1).sum().reindex(columns=generation_carriers).fillna(0.)
    load = n.loads_t.p_set.loc[:,n.loads.bus == ct].sum(axis=1)
    load.name = "load"
    
    data["positive"].append(pd.concat((generation,storage[storage > 0]),axis=1).fillna(0.)[:num_snapshots].round(power_round).values.tolist())
    data["negative"].append(pd.concat((load,-storage[storage < 0]),axis=1).fillna(0.)[:num_snapshots].round(power_round).values.tolist())


with open(folder + 'power.json', 'w') as fp:
    fp.write("var power = ")
    json.dump(data,fp)


