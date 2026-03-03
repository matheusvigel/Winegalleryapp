import { Country, Brand, Grape, Collection, WineItem } from '../types';

// ===== COUNTRIES & REGIONS (Hierarchical) =====

export const countries: Country[] = [
  {
    id: 'france',
    name: 'França',
    imageUrl: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmFuY2UlMjBwYXJpcyUyMGVpZmZlbCUyMHRvd2VyfGVufDF8fHx8MTc3MjU0MzU4NXww&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'Berço do vinho mundial, terra das maiores appellations',
    regions: [
      {
        id: 'bordeaux',
        name: 'Bordeaux',
        countryId: 'france',
        imageUrl: 'https://images.unsplash.com/photo-1760372055346-6eeb72076946?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVuY2glMjBib3JkZWF1eCUyMHdpbmUlMjBjaGF0ZWF1fGVufDF8fHx8MTc3MjQ4NDg2Nnww&ixlib=rb-4.1.0&q=80&w=1080',
        description: 'A região mais prestigiada do mundo do vinho',
        collections: [],
      },
      {
        id: 'burgundy',
        name: 'Borgonha',
        countryId: 'france',
        imageUrl: 'https://images.unsplash.com/photo-1761125263490-2164c910c504?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXJndW5keSUyMHdpbmUlMjByZWdpb24lMjBmcmFuY2V8ZW58MXx8fHwxNzcyNTQzNTg2fDA&ixlib=rb-4.1.0&q=80&w=1080',
        description: 'O terroir mais complexo e precioso do mundo',
        collections: [],
      },
      {
        id: 'champagne',
        name: 'Champagne',
        countryId: 'france',
        imageUrl: 'https://images.unsplash.com/photo-1666351028798-8920e510b705?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGFtcGFnbmUlMjBmcmFuY2UlMjB2aW5leWFyZHxlbnwxfHx8fDE3NzI1NDM1ODZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
        description: 'A única e verdadeira terra do espumante',
        collections: [],
      },
      {
        id: 'rhone',
        name: 'Rhône',
        countryId: 'france',
        imageUrl: 'https://images.unsplash.com/photo-1723413516174-8a76575dccd1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyaG9uZSUyMHZhbGxleSUyMGZyYW5jZSUyMHdpbmV8ZW58MXx8fHwxNzcyNTQzNTg2fDA&ixlib=rb-4.1.0&q=80&w=1080',
        description: 'Syrah e Grenache em seu habitat natural',
        collections: [],
      },
    ],
  },
  {
    id: 'italy',
    name: 'Itália',
    imageUrl: 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpdGFseSUyMHJvbWUlMjBjb2xvc3NldW18ZW58MXx8fHwxNzcyNTQzNTg2fDA&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'Tradição milenar e diversidade incomparável',
    regions: [
      {
        id: 'tuscany',
        name: 'Toscana',
        countryId: 'italy',
        imageUrl: 'https://images.unsplash.com/photo-1760192686356-4b9777a9ceb9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpdGFsaWFuJTIwdHVzY2FueSUyMHdpbmUlMjBjb3VudHJ5c2lkZXxlbnwxfHx8fDE3NzI0ODQ4NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
        description: 'Terra do Chianti e Brunello di Montalcino',
        collections: [],
      },
      {
        id: 'piedmont',
        name: 'Piemonte',
        countryId: 'italy',
        imageUrl: 'https://images.unsplash.com/photo-1669667867723-1e5dd1e8fec5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaWVkbW9udCUyMGl0YWx5JTIwd2luZSUyMGJhcm9sb3xlbnwxfHx8fDE3NzI1NDM1ODZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
        description: 'Barolo e Barbaresco, os reis da Nebbiolo',
        collections: [],
      },
      {
        id: 'veneto',
        name: 'Vêneto',
        countryId: 'italy',
        imageUrl: 'https://images.unsplash.com/photo-1620421381420-e7fa4a041b15?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2ZW5ldG8lMjBpdGFseSUyMHdpbmUlMjBwcm9zZWNjb3xlbnwxfHx8fDE3NzI1NDM1ODd8MA&ixlib=rb-4.1.0&q=80&w=1080',
        description: 'Prosecco, Amarone e Valpolicella',
        collections: [],
      },
    ],
  },
  {
    id: 'spain',
    name: 'Espanha',
    imageUrl: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcGFpbiUyMGJhcmNlbG9uYSUyMHNhZ3JhZGElMjBmYW1pbGlhfGVufDF8fHx8MTc3MjU0MzU4NXww&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'Tempranillo e tradição centenária',
    regions: [
      {
        id: 'rioja',
        name: 'Rioja',
        countryId: 'spain',
        imageUrl: 'https://images.unsplash.com/photo-1678127107811-5572dc0dcf92?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcGFuaXNoJTIwcmlvamElMjB3aW5lJTIwYm90dGxlc3xlbnwxfHx8fDE3NzI0ODQ4NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
        description: 'Tradição espanhola em cada garrafa',
        collections: [],
      },
      {
        id: 'priorat',
        name: 'Priorat',
        countryId: 'spain',
        imageUrl: 'https://images.unsplash.com/photo-1762926627606-74556c9b3b19?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcmlvcmF0JTIwc3BhaW4lMjB2aW5leWFyZCUyMHRlcnJhY2VzfGVufDF8fHx8MTc3MjU0MzU4OHww&ixlib=rb-4.1.0&q=80&w=1080',
        description: 'Vinhos de altitude em terraços históricos',
        collections: [],
      },
    ],
  },
  {
    id: 'portugal',
    name: 'Portugal',
    imageUrl: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0dWdhbCUyMGxpc2JvbiUyMGNpdHl8ZW58MXx8fHwxNzcyNTQzNTg1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'Uvas autóctones e tradição vinícola milenar',
    regions: [
      {
        id: 'douro',
        name: 'Douro',
        countryId: 'portugal',
        imageUrl: 'https://images.unsplash.com/photo-1693825207674-ae2ef8269be5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0dWd1ZXNlJTIwZG91cm8lMjB2YWxsZXklMjB3aW5lfGVufDF8fHx8MTc3MjQ4NDg2Mnww&ixlib=rb-4.1.0&q=80&w=1080',
        description: 'Vale mágico do vinho do Porto',
        collections: [],
      },
      {
        id: 'alentejo',
        name: 'Alentejo',
        countryId: 'portugal',
        imageUrl: 'https://images.unsplash.com/photo-1603099464683-164113fa56d1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb3J0byUyMHdpbmUlMjBwb3J0dWdhbCUyMGJvdHRsZXN8ZW58MXx8fHwxNzcyNTQzNTg3fDA&ixlib=rb-4.1.0&q=80&w=1080',
        description: 'Vinhos robustos do sul de Portugal',
        collections: [],
      },
    ],
  },
  {
    id: 'usa',
    name: 'Estados Unidos',
    imageUrl: 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1c2ElMjBuZXclMjB5b3JrJTIwc2t5bGluZXxlbnwxfHx8fDE3NzI1NDM1ODV8MA&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'O novo mundo em seu melhor',
    regions: [
      {
        id: 'napa',
        name: 'Napa Valley',
        countryId: 'usa',
        imageUrl: 'https://images.unsplash.com/photo-1656873593110-58a8b76823b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWxpZm9ybmlhJTIwbmFwYSUyMHZhbGxleSUyMHZpbmV5YXJkfGVufDF8fHx8MTc3MjQ4NDg2M3ww&ixlib=rb-4.1.0&q=80&w=1080',
        description: 'O ápice do vinho californiano',
        collections: [],
      },
      {
        id: 'sonoma',
        name: 'Sonoma',
        countryId: 'usa',
        imageUrl: 'https://images.unsplash.com/photo-1594790632237-d42f61396acc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb25vbWElMjBjYWxpZm9ybmlhJTIwd2luZSUyMHZhbGxleXxlbnwxfHx8fDE3NzI1NDM1ODh8MA&ixlib=rb-4.1.0&q=80&w=1080',
        description: 'Diversidade e excelência californiana',
        collections: [],
      },
    ],
  },
  {
    id: 'argentina',
    name: 'Argentina',
    imageUrl: 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcmdlbnRpbmElMjBidWVub3MlMjBhaXJlc3xlbnwxfHx8fDE3NzI1NDM1ODV8MA&ixlib=rb-4.1.0&q=80&w=1080',
    description: 'Malbec aos pés dos Andes',
    regions: [
      {
        id: 'mendoza',
        name: 'Mendoza',
        countryId: 'argentina',
        imageUrl: 'https://images.unsplash.com/photo-1765850257541-b70e125323d3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcmdlbnRpbmElMjBtZW5kb3phJTIwd2luZSUyMG1vdW50YWluc3xlbnwxfHx8fDE3NzI0ODQ4NjN8MA&ixlib=rb-4.1.0&q=80&w=1080',
        description: 'Capital mundial do Malbec',
        collections: [],
      },
    ],
  },
];

// ===== BRANDS =====

export const brands: Brand[] = [
  {
    id: 'dom-perignon',
    name: 'Dom Pérignon',
    description: 'O champagne mais icônico do mundo',
    imageUrl: 'https://images.unsplash.com/photo-1547595628-c61a29f496f0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGFtcGFnbmUlMjBib3R0bGV8ZW58MXx8fHwxNzI1MzY0NzU5fDA&ixlib=rb-4.1.0&q=80&w=1080',
    country: 'França',
    region: 'Champagne',
    collections: [],
  },
  {
    id: 'chateau-margaux',
    name: 'Château Margaux',
    description: 'Premier Cru Classé de elegância sublime',
    imageUrl: 'https://images.unsplash.com/photo-1697115355266-50d2a44366ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWQlMjB3aW5lJTIwZ2xhc3MlMjBlbGVnYW50fGVufDF8fHx8MTc3MjM5NzkxOHww&ixlib=rb-4.1.0&q=80&w=1080',
    country: 'França',
    region: 'Bordeaux',
    collections: [],
  },
  {
    id: 'opus-one',
    name: 'Opus One',
    description: 'Joint venture Mondavi-Rothschild',
    imageUrl: 'https://images.unsplash.com/photo-1676276629066-5a0c849a1591?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpdGFsaWFuJTIwd2luZXJ5JTIwYXJjaGl0ZWN0dXJlfGVufDF8fHx8MTc3MjQ4NTE4MHww&ixlib=rb-4.1.0&q=80&w=1080',
    country: 'EUA',
    region: 'Napa Valley',
    collections: [],
  },
  {
    id: 'antinori',
    name: 'Antinori',
    description: '26 gerações produzindo vinho',
    imageUrl: 'https://images.unsplash.com/photo-1771846954643-6cf7a8dba814?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aW5lJTIwYm90dGxlJTIwY29sbGVjdGlvbiUyMHZpbnRhZ2V8ZW58MXx8fHwxNzcyNDg1MTgwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    country: 'Itália',
    region: 'Toscana',
    collections: [],
  },
  {
    id: 'catena-zapata',
    name: 'Catena Zapata',
    description: 'A família que elevou o Malbec argentino',
    imageUrl: 'https://images.unsplash.com/photo-1676276629066-5a0c849a1591?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpdGFsaWFuJTIwd2luZXJ5JTIwYXJjaGl0ZWN0dXJlfGVufDF8fHx8MTc3MjQ4NTE4MHww&ixlib=rb-4.1.0&q=80&w=1080',
    country: 'Argentina',
    region: 'Mendoza',
    collections: [],
  },
  {
    id: 'vega-sicilia',
    name: 'Vega Sicilia',
    description: 'O vinho mais prestigioso da Espanha',
    imageUrl: 'https://images.unsplash.com/photo-1697115355266-50d2a44366ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWQlMjB3aW5lJTIwZ2xhc3MlMjBlbGVnYW50fGVufDF8fHx8MTc3MjM5NzkxOHww&ixlib=rb-4.1.0&q=80&w=1080',
    country: 'Espanha',
    region: 'Ribera del Duero',
    collections: [],
  },
];

// ===== GRAPES =====

export const grapes: Grape[] = [
  {
    id: 'cabernet-sauvignon',
    name: 'Cabernet Sauvignon',
    description: 'A uva tinta mais plantada do mundo',
    imageUrl: 'https://images.unsplash.com/photo-1607720336444-7990bedc2bf9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWJlcm5ldCUyMHNhdXZpZ25vbiUyMGdyYXBlcyUyMHZpbmV5YXJkfGVufDF8fHx8MTc3MjU0MzU5MXww&ixlib=rb-4.1.0&q=80&w=1080',
    type: 'red',
    characteristics: 'Corpo pleno, taninos robustos, notas de cassis e cedro',
    collections: [],
  },
  {
    id: 'pinot-noir',
    name: 'Pinot Noir',
    description: 'A uva mais elegante e sensível do mundo',
    imageUrl: 'https://images.unsplash.com/photo-1561443883-b04d019d7675?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZXJsb3QlMjByZWQlMjB3aW5lJTIwZ3JhcGVzfGVufDF8fHx8MTc3MjU0MzU5Mnww&ixlib=rb-4.1.0&q=80&w=1080',
    type: 'red',
    characteristics: 'Corpo leve a médio, aromático, notas de frutas vermelhas',
    collections: [],
  },
  {
    id: 'chardonnay',
    name: 'Chardonnay',
    description: 'A uva branca mais versátil',
    imageUrl: 'https://images.unsplash.com/photo-1664432786683-01c3d5a2c08b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGFyZG9ubmF5JTIwd2hpdGUlMjBncmFwZXN8ZW58MXx8fHwxNzcyNTQzNTkxfDA&ixlib=rb-4.1.0&q=80&w=1080',
    type: 'white',
    characteristics: 'Corpo médio a pleno, notas de maçã, pêra e manteiga',
    collections: [],
  },
  {
    id: 'merlot',
    name: 'Merlot',
    description: 'Suavidade e elegância em forma de uva',
    imageUrl: 'https://images.unsplash.com/photo-1561443883-b04d019d7675?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZXJsb3QlMjByZWQlMjB3aW5lJTIwZ3JhcGVzfGVufDF8fHx8MTc3MjU0MzU5Mnww&ixlib=rb-4.1.0&q=80&w=1080',
    type: 'red',
    characteristics: 'Taninos macios, corpo médio, notas de ameixa e chocolate',
    collections: [],
  },
  {
    id: 'tempranillo',
    name: 'Tempranillo',
    description: 'A alma da Espanha',
    imageUrl: 'https://images.unsplash.com/photo-1561443883-b04d019d7675?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZXJsb3QlMjByZWQlMjB3aW5lJTIwZ3JhcGVzfGVufDF8fHx8MTc3MjU0MzU5Mnww&ixlib=rb-4.1.0&q=80&w=1080',
    type: 'red',
    characteristics: 'Acidez média, taninos moderados, notas de couro e tabaco',
    collections: [],
  },
  {
    id: 'malbec',
    name: 'Malbec',
    description: 'O orgulho argentino',
    imageUrl: 'https://images.unsplash.com/photo-1561443883-b04d019d7675?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZXJsb3QlMjByZWQlMjB3aW5lJTIwZ3JhcGVzfGVufDF8fHx8MTc3MjU0MzU5Mnww&ixlib=rb-4.1.0&q=80&w=1080',
    type: 'red',
    characteristics: 'Corpo pleno, taninos aveludados, notas de ameixa e violeta',
    collections: [],
  },
];

// Helper function to get all regions flattened
export function getAllRegions() {
  return countries.flatMap(country => country.regions);
}

// Helper function to find a region by ID
export function findRegion(regionId: string) {
  for (const country of countries) {
    const region = country.regions.find(r => r.id === regionId);
    if (region) return region;
  }
  return null;
}

// Helper function to find a country by ID
export function findCountry(countryId: string) {
  return countries.find(c => c.id === countryId);
}
