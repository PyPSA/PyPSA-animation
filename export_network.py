## Copyright 2018 Tom Brown

## This program is free software; you can redistribute it and/or
## modify it under the terms of the GNU Affero General Public License as
## published by the Free Software Foundation; either version 3 of the
## License, or (at your option) any later version.

## This program is distributed in the hope that it will be useful,
## but WITHOUT ANY WARRANTY; without even the implied warranty of
## MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
## GNU Affero General Public License for more details.

## License and more information at:
## https://github.com/PyPSA/PyPSA-animation

import pypsa, json, os

import pandas as pd

from vresutils.costdata import annuity

#%matplotlib inline

preferred_order = pd.Index(["offwind","onwind","solar","OCGT","ror","hydro","PHS","battery","H2"])

colors = {"OCGT" :"#835C3B",
          "OCGT marginal" : "#fc7502",
          "onwind":"#3B6182",
          "offwind" :"#ADD8E6",
          "solar" :"#FFFF00",
          "electricity demand": "#FF0000",
          "battery" : "#999999",
          "H2" : "#FF00EE",
          "PHS" : "#1dff00",
          "hydro" : "#008000",
          "ror" : "#90EE90",
          "transmission" : "#000000",
          
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

country_to_code = {
'Europe' : 'EU',
'EA19' : 'EA',
'Belgium' : 'BE',
'Bulgaria' : 'BG',
'Czech Republic' : 'CZ',
'Denmark' : 'DK',
'Germany' : 'DE',
'Estonia' : 'EE',
'Ireland' : 'IE',
'Greece' : 'GR',
'Spain' : 'ES',
'France' : 'FR',
'Croatia' : 'HR',
'Italy' : 'IT',
'Cyprus' : 'CY',
'Latvia' : 'LV',
'Lithuania' : 'LT',
'Luxembourg' : 'LU',
'Hungary' : 'HU',
'Malta' : 'MA',
'Netherlands' : 'NL',
'Austria' : 'AT',
'Poland' : 'PL',
'Portugal' : 'PT',
'Romania' : 'RO',
'Slovenia' : 'SI',
'Slovakia' : 'SK',
'Finland' : 'FI',
'Sweden' : 'SE',
'United Kingdom' : 'GB',
'Iceland' : 'IS',
'Norway' : 'NO',
'Montenegro' : 'ME',
'FYR of Macedonia' : 'MK',
'Albania' : 'AL',
'Serbia' : 'RS',
'Turkey' : 'TU',
'Bosnia and Herzegovina' : 'BA',
'Kosovo\n(UNSCR 1244/99)' : 'KO',  #2017 version
'Kosovo\n(under United Nations Security Council Resolution 1244/99)' : 'KO',  #2016 version
'Moldova' : 'MO',
'Ukraine' : 'UK',
'Switzerland' : 'CH',
}

code_to_country = { v : k for k,v in country_to_code.items()}


#convert MW to GW
factor = 1e3

def export_network_to_json(network, export_folder, snapshots=None, coord_round=3, power_round=1):
    """power_round refers to GW of power"""
    
    n = network
    folder = export_folder
    
    if not os.path.isdir(folder):
        print("Directory {} does not exist, creating it"
                           .format(folder))
        os.mkdir(folder)

    
    if snapshots is None:
        snapshots = n.snapshots

    with open(folder + 'snapshots.json', 'w') as fp:
        json.dump([str(i) for i in snapshots], fp)

    #corrections to improve optics
    n.buses.loc["NO",["x","y"]] = [9.5,61.5]
    n.buses.loc["SE",["x","y"]] = [15,60.5]
    n.buses.at["FI","y"] = 62
    
    #only take AC buses
    carrier="AC"
    buses = n.buses[n.buses.carrier == carrier]
    
    #Add back in a coordinate for Europe far out of graph
    data = {"index" : ["EU"] + list(buses.index),
            "x" : [-20.0] + list(buses.x.round(coord_round)),
            "y" : [80] + list(buses.y.round(coord_round)),
            "name" : [code_to_country[code] for code in ["EU"] + list(buses.index)]
           }


    with open(folder + 'buses.json', 'w') as fp:
        json.dump(data, fp)
    
    #select links between relevant buses
    carrier0 = (n.links.bus0.map(n.buses.carrier) == "AC")
    carrier1 = (n.links.bus1.map(n.buses.carrier) == "AC")

    links = n.links[carrier0 & carrier1]
    
    
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
        json.dump(data, fp)
        
        
    with open(folder + 'flow.json', 'w') as fp:
        json.dump((n.links_t.p0.reindex(columns=links.index).fillna(0.).loc[snapshots]/factor).round(power_round).values.tolist(),fp)
        
        
    generation_carriers = n.generators.carrier.value_counts().index
    generation_carriers = (preferred_order&generation_carriers).append(generation_carriers.difference(preferred_order))
    print("generation carriers:",generation_carriers)
    
    storage_carriers = n.storage_units.carrier.value_counts().index
    storage_carriers = (preferred_order&storage_carriers).append(storage_carriers.difference(preferred_order))
    print("storage carriers:",storage_carriers)
    
    carriers = {}

    carriers["positive"] = generation_carriers.append(storage_carriers)

    carriers["negative"] = pd.Index(["electricity demand"]).append(storage_carriers)

    with open(folder + 'carriers.json', 'w') as fp:
        json.dump({sign : {"index" : [rename_techs(c) for c in carriers[sign]],
                   "color" : [colors[c] for c in carriers[sign]]} for sign in ["positive","negative"]}, fp)

    #prepare empty DataFrame for European totals
    data = {sign : [pd.DataFrame(columns=carriers[sign],index=snapshots).fillna(0.)] for sign in carriers}

    for i,ct in enumerate(buses.index):

        storage = n.storage_units_t.p.loc[:,n.storage_units.bus == ct].groupby(n.storage_units.carrier,axis=1).sum().reindex(columns=storage_carriers).fillna(0.)
        generation = n.generators_t.p.loc[:,n.generators.bus == ct].groupby(n.generators.carrier,axis=1).sum().reindex(columns=generation_carriers).fillna(0.)
        load = n.loads_t.p_set.loc[:,n.loads.bus == ct].sum(axis=1)
        load.name = "electricity demand"
        
        to_add = {}
        
        to_add["positive"] = (pd.concat((generation,storage[storage > 0]),axis=1).fillna(0.)/factor).round(power_round)
        to_add["negative"] = (pd.concat((load,-storage[storage < 0]),axis=1).fillna(0.)/factor).round(power_round)
        
        for sign in carriers:
            data[sign][0] += to_add[sign].loc[snapshots]
            data[sign].append(to_add[sign].loc[snapshots].values.tolist())

    for sign in carriers:
        data[sign][0] = data[sign][0].values.tolist()



    with open(folder + 'power.json', 'w') as fp:
        json.dump(data,fp)

def export_metrics_to_json(network, power_round=1):
    """power_round refers to GW of power"""
   
    
    n = network
    
    #add missing costs
    
    n.links.capital_cost = (400*1.25*n.links.length+150000.)*1.5*(annuity(40., 0.07)+0.02)
    
    hydro = n.storage_units.index[n.storage_units.carrier=="hydro"]
    PHS = n.storage_units.index[n.storage_units.carrier=="PHS"]
    ror = n.generators.index[n.generators.carrier=="ror"]
    
    n.storage_units.loc[hydro,"p_nom_opt"] = n.storage_units.loc[hydro,"p_nom"]
    n.storage_units.loc[PHS,"p_nom_opt"] = n.storage_units.loc[PHS,"p_nom"]
    n.generators.loc[ror,"p_nom_opt"] = n.generators.loc[ror,"p_nom"]

    n.storage_units.loc[hydro,"capital_cost"] = (0.01)*2e6
    n.storage_units.loc[PHS,"capital_cost"] = (0.01)*2e6
    n.generators.loc[ror,"capital_cost"] = (0.02)*3e6
    
    #only take AC buses
    carrier="AC"
    buses = n.buses[n.buses.carrier == carrier]
    
            
    generation_carriers = n.generators.carrier.value_counts().index
    generation_carriers = (preferred_order&generation_carriers).append(generation_carriers.difference(preferred_order))
    print("generation carriers:",generation_carriers)
    
    storage_carriers = n.storage_units.carrier.value_counts().index
    storage_carriers = (preferred_order&storage_carriers).append(storage_carriers.difference(preferred_order))
    print("storage carriers:",storage_carriers)
    
    carriers = {}

    carriers["positive"] = generation_carriers.append(storage_carriers)

    carriers["negative"] = pd.Index(["electricity demand"]).append(storage_carriers)
    
    
    if len(metrics["energy"]) == 0:
        metrics["energy"] = [[] for i in range(len(buses.index)+1)]
        metrics["power"] = [[] for i in range(len(buses.index)+1)]
        metrics["cost"] = [[] for i in range(len(buses.index)+1)]
    
    energy_carriers = generation_carriers.append(carriers["negative"])
    cost_carriers = carriers["positive"].append(pd.Index(["OCGT marginal","transmission"]))
    
    metrics["energy"][0].append(pd.Series(index=energy_carriers).fillna(0.))
    metrics["power"][0].append(pd.Series(index=carriers["positive"]).fillna(0.))
    metrics["cost"][0].append(pd.Series(index=cost_carriers).fillna(0.))
    
    
    for i,ct in enumerate(buses.index):

        storage = n.storage_units_t.p.loc[:,n.storage_units.bus == ct].groupby(n.storage_units.carrier,axis=1).sum().reindex(columns=storage_carriers).fillna(0.)
        generation = n.generators_t.p.loc[:,n.generators.bus == ct].groupby(n.generators.carrier,axis=1).sum().reindex(columns=generation_carriers).fillna(0.)
        load = n.loads_t.p_set.loc[:,n.loads.bus == ct].sum(axis=1)
        load.name = "electricity demand"
        
        data = {}

        data["energy"] = (pd.concat((generation.sum(),storage.sum(),pd.Series([-load.sum()],[load.name])))/factor).round(power_round).reindex(energy_carriers)

        
        data["power"] = (pd.concat((n.generators.p_nom_opt[n.generators.bus==ct].groupby(n.generators.carrier).sum(),
                            n.storage_units.p_nom_opt[n.storage_units.bus==ct].groupby(n.storage_units.carrier).sum()))/factor).round(power_round).reindex(carriers["positive"]).fillna(0.)

        generation_cost = (n.generators.p_nom_opt*n.generators.capital_cost)[n.generators.bus==ct].groupby(n.generators.carrier).sum()
        
        storage_cost = (n.storage_units.p_nom_opt*n.storage_units.capital_cost)[n.storage_units.bus==ct].groupby(n.storage_units.carrier).sum()
        
        transmission_cost = pd.Series([(n.links.p_nom_opt*n.links.capital_cost)[(n.links.bus0 == ct) ^ (n.links.bus1 == ct)].sum()],
                                      index=["transmission"])
        
        marginal_cost = pd.Series([n.generators.at[ct+" OCGT","marginal_cost"]*n.generators_t.p[ct+" OCGT"].sum()],
                                  index=["OCGT marginal"])
        
        data["cost"] = pd.concat((generation_cost,storage_cost,transmission_cost,marginal_cost)).reindex(cost_carriers).fillna(0.)
        
        
        for item in ["energy","power","cost"]:
            metrics[item][0][-1] += data[item]
            metrics[item][i+1].append(data[item].values.tolist())
        
    for item in ["energy","power","cost"]:
        metrics[item][0][-1] = metrics[item][0][-1].values.tolist()

        
    metrics["energy_carriers"] = energy_carriers.tolist()
    metrics["energy_colors"] = [colors[i] for i in energy_carriers]
    
    metrics["power_carriers"] = carriers["positive"].tolist()
    metrics["power_colors"] = [colors[i] for i in carriers["positive"]]

    metrics["cost_carriers"] = cost_carriers.tolist()
    metrics["cost_colors"] = [colors[i] for i in cost_carriers]

seasons = {"winter" : "01",
           "spring" : "04",
           "summer" : "07",
           "autumn" : "10",
          }


to_export = {0 : "/home/tom/results/supplementary_data_benefits_of_cooperation/results/diw2030-CO0-T1_8761-wWsgrpHb-LV0.0_c0_base_diw2030_solar1_7_angles-2017-01-31-20-12-02/",
             1 : "/home/tom/results/supplementary_data_benefits_of_cooperation/results/diw2030-CO0-T1_8761-wWsgrpHb-LV0.0625_c0_base_diw2030_solar1_7_angles-2017-02-13-18-51-06/",
             2 : "/home/tom/results/supplementary_data_benefits_of_cooperation/results/diw2030-CO0-T1_8761-wWsgrpHb-LV0.125_c0_base_diw2030_solar1_7-2017-01-31-20-10-10/",
             4 : "/home/tom/results/supplementary_data_benefits_of_cooperation/results/diw2030-CO0-T1_8761-wWsgrpHb-LV0.25_c0_base_diw2030_solar1_7_angles-2017-01-31-20-12-02/",
             8 : "/home/tom/results/supplementary_data_benefits_of_cooperation/results/diw2030-CO0-T1_8761-wWsgrpHb-LV0.5_c0_base_diw2030_solar1_7-2017-01-31-20-10-10/"}

metrics = {"cost" : [],
           "power" : [],
           "energy" : [],
           "price" : []}

to_export_selection = [0,1,2,4,8]
             
for k in to_export_selection:
    v = to_export[k]
    n = pypsa.Network(v)
    
    for season, month in seasons.items():
        snapshots = n.snapshots[n.snapshots.slice_indexer("2011-" + month + "-01","2011-" + month + "-07")]
        export_network_to_json(n,"./{}-{}/".format(k,season),snapshots=snapshots)
    export_metrics_to_json(n)
with open('metrics.json', 'w') as fp:
    json.dump(metrics,fp)

