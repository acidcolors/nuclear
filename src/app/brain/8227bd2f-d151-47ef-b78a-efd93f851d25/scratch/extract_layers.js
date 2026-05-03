const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/web/nuclear/public/relax.json', 'utf8'));

function findLayers(obj) {
    let layers = [];
    if (typeof obj === 'object' && obj !== null) {
        if (Array.isArray(obj)) {
            obj.forEach(item => {
                layers = layers.concat(findLayers(item));
            });
        } else {
            if (obj.layers) {
                obj.layers.forEach(l => {
                    layers.push(l.nm || 'unnamed');
                });
            }
            Object.values(obj).forEach(v => {
                layers = layers.concat(findLayers(v));
            });
        }
    }
    return layers;
}

const allNames = Array.from(new Set(findLayers(data)));
console.log(allNames.join(', '));
