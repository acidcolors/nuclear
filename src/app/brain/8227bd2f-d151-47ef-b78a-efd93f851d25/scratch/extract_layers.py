import json
with open('d:/web/nuclear/public/relax.json', 'r') as f:
    data = json.load(f)

def find_layers(obj):
    layers = []
    if isinstance(obj, dict):
        if 'layers' in obj:
            for l in obj['layers']:
                layers.append(l.get('nm', 'unnamed'))
        for v in obj.values():
            layers.extend(find_layers(v))
    elif isinstance(obj, list):
        for item in obj:
            layers.extend(find_layers(item))
    return layers

print(list(set(find_layers(data))))
