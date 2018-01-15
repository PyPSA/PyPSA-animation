
import pypsa, json

network_name = "/home/tom/results/tom/snakemake/version-16/postnetworks/postnetwork-elec_only_opt.h5"

coord_round = 3

power_round = 0

num_snapshots = 24

folder = "./"



n = pypsa.Network(network_name)

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


data = {"index" : [str(i) for i in n.loads_t.p_set.index[:num_snapshots]]}

for b in buses.index:
    data[b] = list(n.loads_t.p_set[b][:num_snapshots].round(power_round))

with open(folder + 'load-day.json', 'w') as fp:
    fp.write("var load = ")
    json.dump(data, fp)
