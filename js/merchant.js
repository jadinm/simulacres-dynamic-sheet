/**
 * If you wish to produce this data easily, create a sheet that contains all the equipment that you want (and only that).
 * Then run the following code in the browser console on your Merchant sheet:
 *  JSON5.stringify(sheet.equipments().map((equipment) => sheet.export_equipment_data(equipment)))
 * Finally, use 'Copy object' and paste the result below
 */

let default_merchant = []

if (universe === med_fantasy) {
    default_merchant = [{
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Ration (1 jour)', price: '7', row_number: '0'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Bouclier rond', price: '100', row_number: '1'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Grand bouclier', price: '250', row_number: '2'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Casque en cuir', price: '35', row_number: '3'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Casque en cuir renforcé', price: '50', row_number: '4'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Casque en bronze', price: '250', row_number: '5'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Casque en fer', price: '500', row_number: '6'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Braies (qualité de base)', price: '20', row_number: '7'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Chemise (qualité de base)', price: '20', row_number: '8'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Robe (qualité de base)', price: '70', row_number: '9'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Cape (qualité de base)', price: '50', row_number: '10'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Manteau (qualité de base)', price: '80', row_number: '11'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Chapeau (qualité de base)', price: '20', row_number: '12'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Ceinture (qualité de base)', price: '25', row_number: '13'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Ceinturon (qualité de base)', price: '15', row_number: '14'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Souliers (qulité de base)', price: '60', row_number: '15'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Bottes (qualité de base)', price: '100', row_number: '16'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Sabots (prix moyen)', price: '25', row_number: '17'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Torche', price: '5', row_number: '18'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Lanterne', price: '120', row_number: '19'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Lampe-tempête', price: '200', row_number: '20'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Huile de lampe (3h)', price: '12', row_number: '21'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Sac à dos en cuir', price: '30', row_number: '22'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Étui en cuir (pour parchemins)', price: '10', row_number: '23'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Corde (20 mètres)', price: '50', row_number: '24'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Grappin', price: '40', row_number: '25'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Gourde (1 L)', price: '15', row_number: '26'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Miroir simple', price: '20', row_number: '27'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Bourse (100 pièces)', price: '2', row_number: '28'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Cagoule de mailles', price: '250', row_number: '29'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Repas simple', price: '2', row_number: '30'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Repas copieux', price: '5', row_number: '31'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Pichet de cervoise', price: '1', row_number: '32'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Bouteille de vin courant', price: '5', row_number: '33'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Bouteille de bon vin', price: '20', row_number: '34'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: "Bouteille d'hydromel", price: '10', row_number: '35'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: "Bouteille d'eau-de-vie", price: '20', row_number: '36'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Chambre (2 à 3 personnes)', price: '30', row_number: '37'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Dortoir (avec lit)', price: '3', row_number: '38'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Dortoir (à même le sol)', price: '2', row_number: '39'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Grange', price: '1', row_number: '40'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Écurie (pour un cheval)', price: '2', row_number: '41'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Fourrage (pour une journée)', price: '7', row_number: '42'}]}
    }, {
        close_combat: {
            rows: [{
                'details-bonus': 0,
                'details-equipment-always-expend-quantity': 1,
                effect: '[C] PV',
                'details-name': '',
                'details-max': '',
                'details-min': '',
                talent: 'Coutelas',
                equipment: 'equipment-43',
                'details-exploding-effect': false,
                'details-equipment-always-expend': false,
                'details-include-armor-penalty': true,
                body: true,
                instincts: false,
                heart: false,
                mind: false,
                perception: false,
                action: true,
                desire: false,
                resistance: false,
                mineral: false,
                vegetal: false,
                animal: false,
                humanoid: false,
                mechanical: true,
                void: false,
                row_number: '0'
            }]
        },
        required_talents: {'0': [], x: [], '-4': [], '-2': ['Coutelas']},
        equipment: {rows: [{quantity: 1, name: 'Coutelas', price: '20', row_number: '43'}]}
    }, {
        close_combat: {
            rows: [{
                'details-bonus': 0,
                'details-equipment-always-expend-quantity': 1,
                effect: '[D] PV',
                'details-name': '',
                'details-max': '',
                'details-min': '',
                talent: 'Dague',
                equipment: 'equipment-44',
                'details-exploding-effect': false,
                'details-equipment-always-expend': false,
                'details-include-armor-penalty': true,
                body: true,
                instincts: false,
                heart: false,
                mind: false,
                perception: false,
                action: true,
                desire: false,
                resistance: false,
                mineral: false,
                vegetal: false,
                animal: false,
                humanoid: false,
                mechanical: true,
                void: false,
                row_number: '1'
            }]
        },
        required_talents: {'0': [], x: [], '-4': [], '-2': ['Dague']},
        equipment: {rows: [{quantity: 1, name: 'Dague', price: '50', row_number: '44'}]}
    }, {
        close_combat: {
            rows: [{
                'details-bonus': 0,
                'details-equipment-always-expend-quantity': 1,
                effect: '[E] PV',
                'details-name': '',
                'details-max': '',
                'details-min': '',
                talent: 'Épée courte',
                equipment: 'equipment-45',
                'details-exploding-effect': false,
                'details-equipment-always-expend': false,
                'details-include-armor-penalty': true,
                body: true,
                instincts: false,
                heart: false,
                mind: false,
                perception: false,
                action: true,
                desire: false,
                resistance: false,
                mineral: false,
                vegetal: false,
                animal: false,
                humanoid: false,
                mechanical: true,
                void: false,
                row_number: '2'
            }]
        },
        required_talents: {'0': [], x: [], '-4': ['Épée courte'], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Épée courte', price: '150', row_number: '45'}]}
    }, {
        close_combat: {
            rows: [{
                'details-bonus': 0,
                'details-equipment-always-expend-quantity': 1,
                effect: '[E] PV [B] PS',
                'details-name': '',
                'details-max': '',
                'details-min': '',
                talent: 'Épée longue',
                equipment: 'equipment-46',
                'details-exploding-effect': false,
                'details-equipment-always-expend': false,
                'details-include-armor-penalty': true,
                body: true,
                instincts: false,
                heart: false,
                mind: false,
                perception: false,
                action: true,
                desire: false,
                resistance: false,
                mineral: false,
                vegetal: false,
                animal: false,
                humanoid: false,
                mechanical: true,
                void: false,
                row_number: '3'
            }]
        },
        required_talents: {'0': [], x: [], '-4': ['Épée longue'], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Épée longue', price: '300', row_number: '46'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: "Fléaut d'armes", price: '280', row_number: '47'}]}
    }, {
        close_combat: {
            rows: [{
                'details-bonus': 0,
                'details-equipment-always-expend-quantity': 1,
                effect: '[G] PV [C] PS',
                'details-name': '',
                'details-max': '',
                'details-min': '',
                talent: 'Lance',
                equipment: 'equipment-48',
                'details-exploding-effect': false,
                'details-equipment-always-expend': false,
                'details-include-armor-penalty': true,
                body: true,
                instincts: false,
                heart: false,
                mind: false,
                perception: false,
                action: true,
                desire: false,
                resistance: false,
                mineral: false,
                vegetal: false,
                animal: false,
                humanoid: false,
                mechanical: true,
                void: false,
                row_number: '5'
            }]
        },
        range_combat: {
            rows: [{
                'details-bonus': 0,
                'details-equipment-always-expend-quantity': 1,
                'distance-point_blank': 'Entre 0 m et 2 m',
                'distance-normal': 'Entre 2 m et 20 m',
                'distance-slightly_far': 'Entre 20 m et 30 m',
                'distance-very_far': 'Entre 30 m et 40 m',
                'effect-point_blank': '[G] PV [F] PS',
                'effect-normal': '[E] PV [D] PS',
                'effect-slightly_far': '[D] PV [C] PS',
                'effect-very_far': '[C] PV [B] PS',
                'details-name': '',
                'details-max': '',
                'details-min': '',
                talent: 'Lance',
                equipment: 'equipment-48',
                'details-exploding-effect': false,
                'details-equipment-always-expend': false,
                'details-include-armor-penalty': true,
                body: true,
                instincts: false,
                heart: false,
                mind: false,
                perception: true,
                action: false,
                desire: false,
                resistance: false,
                mineral: false,
                vegetal: false,
                animal: false,
                humanoid: false,
                mechanical: true,
                void: false,
                row_number: '24'
            }]
        },
        required_talents: {'0': [], x: [], '-4': ['Lance'], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Lance', price: '80', row_number: '48'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Poignard', price: '30', row_number: '49'}]}
    }, {
        close_combat: {
            rows: [{
                'details-bonus': 0,
                'details-equipment-always-expend-quantity': 1,
                effect: '[F] PV [A] PS',
                'details-name': '',
                'details-max': '',
                'details-min': '',
                talent: 'Sabre',
                equipment: 'equipment-50',
                'details-exploding-effect': false,
                'details-equipment-always-expend': false,
                'details-include-armor-penalty': true,
                body: true,
                instincts: false,
                heart: false,
                mind: false,
                perception: false,
                action: true,
                desire: false,
                resistance: false,
                mineral: false,
                vegetal: false,
                animal: false,
                humanoid: false,
                mechanical: true,
                void: false,
                row_number: '7'
            }]
        },
        required_talents: {'0': [], x: [], '-4': ['Sabre'], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Sabre', price: '300', row_number: '50'}]}
    }, {
        close_combat: {
            rows: [{
                'details-bonus': 0,
                'details-equipment-always-expend-quantity': 1,
                effect: '[G] PV [A] PS',
                'details-name': '',
                'details-max': '',
                'details-min': '',
                talent: 'Épieu',
                equipment: 'equipment-51',
                'details-exploding-effect': false,
                'details-equipment-always-expend': false,
                'details-include-armor-penalty': true,
                body: true,
                instincts: false,
                heart: false,
                mind: false,
                perception: false,
                action: true,
                desire: false,
                resistance: false,
                mineral: false,
                vegetal: false,
                animal: false,
                humanoid: false,
                mechanical: true,
                void: false,
                row_number: '8'
            }]
        },
        required_talents: {'0': [], x: [], '-4': ['Épieu'], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Épieu', price: '100', row_number: '51'}]}
    }, {
        close_combat: {
            rows: [{
                'details-bonus': 0,
                'details-equipment-always-expend-quantity': 1,
                effect: '[D] PV [G] PS',
                'details-name': '',
                'details-max': '',
                'details-min': '',
                talent: 'Étoile du matin',
                equipment: 'equipment-52',
                'details-exploding-effect': false,
                'details-equipment-always-expend': false,
                'details-include-armor-penalty': true,
                body: true,
                instincts: false,
                heart: false,
                mind: false,
                perception: false,
                action: true,
                desire: false,
                resistance: false,
                mineral: false,
                vegetal: false,
                animal: false,
                humanoid: false,
                mechanical: true,
                void: false,
                row_number: '9'
            }]
        },
        required_talents: {'0': [], x: [], '-4': ['Étoile du matin'], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Étoile du matin', price: '200', row_number: '52'}]}
    }, {
        close_combat: {
            rows: [{
                'details-bonus': 0,
                'details-equipment-always-expend-quantity': 1,
                effect: '[A-2] PV [F] PS',
                'details-name': '',
                'details-max': '',
                'details-min': '',
                talent: 'Gourdin',
                equipment: 'equipment-53',
                'details-exploding-effect': false,
                'details-equipment-always-expend': false,
                'details-include-armor-penalty': true,
                body: true,
                instincts: false,
                heart: false,
                mind: false,
                perception: false,
                action: true,
                desire: false,
                resistance: false,
                mineral: false,
                vegetal: false,
                animal: false,
                humanoid: false,
                mechanical: true,
                void: false,
                row_number: '10'
            }]
        },
        required_talents: {'0': [], x: [], '-4': [], '-2': ['Gourdin']},
        equipment: {rows: [{quantity: 1, name: 'Gourdin', price: '6', row_number: '53'}]}
    }, {
        close_combat: {
            rows: [{
                'details-bonus': 0,
                'details-equipment-always-expend-quantity': 1,
                effect: '[F] PV [B] PS',
                'details-name': '',
                'details-max': '',
                'details-min': '',
                talent: 'Hache à une main',
                equipment: 'equipment-54',
                'details-exploding-effect': false,
                'details-equipment-always-expend': false,
                'details-include-armor-penalty': true,
                body: true,
                instincts: false,
                heart: false,
                mind: false,
                perception: false,
                action: true,
                desire: false,
                resistance: false,
                mineral: false,
                vegetal: false,
                animal: false,
                humanoid: false,
                mechanical: false,
                void: false,
                row_number: '16'
            }]
        },
        required_talents: {'0': [], x: [], '-4': ['Hache à une main'], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Hache à une main', price: '150', row_number: '54'}]}
    }, {
        close_combat: {
            rows: [{
                'details-bonus': 0,
                'details-equipment-always-expend-quantity': 1,
                effect: '[H] PV [B] PS',
                'details-name': '',
                'details-max': '',
                'details-min': '',
                talent: 'Hache à deux mains',
                equipment: 'equipment-55',
                'details-exploding-effect': false,
                'details-equipment-always-expend': false,
                'details-include-armor-penalty': true,
                body: true,
                instincts: false,
                heart: false,
                mind: false,
                perception: false,
                action: true,
                desire: false,
                resistance: false,
                mineral: false,
                vegetal: false,
                animal: false,
                humanoid: false,
                mechanical: true,
                void: false,
                row_number: '11'
            }]
        },
        required_talents: {'0': [], x: [], '-4': ['Hache à deux mains'], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Hache à deux mains', price: '300', row_number: '55'}]}
    }, {
        close_combat: {
            rows: [{
                'details-bonus': 0,
                'details-equipment-always-expend-quantity': 1,
                effect: '[A] PV [F] PS',
                'details-name': '',
                'details-max': '',
                'details-min': '',
                talent: "Masse d'arme",
                equipment: 'equipment-56',
                'details-exploding-effect': false,
                'details-equipment-always-expend': false,
                'details-include-armor-penalty': true,
                body: true,
                instincts: false,
                heart: false,
                mind: false,
                perception: false,
                action: true,
                desire: false,
                resistance: false,
                mineral: false,
                vegetal: false,
                animal: false,
                humanoid: false,
                mechanical: true,
                void: false,
                row_number: '12'
            }]
        },
        required_talents: {'0': [], x: [], '-4': ["Masse d'arme"], '-2': []},
        equipment: {rows: [{quantity: 1, name: "Masse d'armes", price: '120', row_number: '56'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Arbalète légère', price: '300', row_number: '57'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Arbalète lourde', price: '500', row_number: '58'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Arc long', price: '140', row_number: '59'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Arc court', price: '200', row_number: '60'}]}
    }, {
        close_combat: {
            rows: [{
                'details-bonus': 0,
                'details-equipment-always-expend-quantity': 1,
                effect: '[A-3] PV [E] PS',
                'details-name': '',
                'details-max': '',
                'details-min': '',
                talent: 'Fouet',
                equipment: 'equipment-61',
                'details-exploding-effect': false,
                'details-equipment-always-expend': false,
                'details-include-armor-penalty': true,
                body: true,
                instincts: false,
                heart: false,
                mind: false,
                perception: false,
                action: true,
                desire: false,
                resistance: false,
                mineral: false,
                vegetal: false,
                animal: false,
                humanoid: false,
                mechanical: true,
                void: false,
                row_number: '13'
            }]
        },
        required_talents: {'0': [], x: [], '-4': ['Fouet'], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Fouet', price: '40', row_number: '61'}]}
    }, {
        range_combat: {
            rows: [{
                'details-bonus': 0,
                'details-equipment-always-expend-quantity': 1,
                'distance-point_blank': 'Entre 0 m et 3 m',
                'distance-normal': 'Entre 3 m et 25 m',
                'distance-slightly_far': 'Entre 25 m et 35 m',
                'distance-very_far': 'Entre 35 m et 40 m',
                'effect-point_blank': '[D] PV [E] PS',
                'effect-normal': '[B] PV [C] PS',
                'effect-slightly_far': '[A] PV [B] PS',
                'effect-very_far': '[A-1] PV [A] PS',
                'details-name': 'Fronde (cailloux)',
                'details-max': '',
                'details-min': '',
                talent: 'Fronde',
                equipment: 'equipment-62',
                'details-exploding-effect': false,
                'details-equipment-always-expend': false,
                'details-include-armor-penalty': true,
                body: true,
                instincts: false,
                heart: false,
                mind: false,
                perception: true,
                action: false,
                desire: false,
                resistance: false,
                mineral: false,
                vegetal: false,
                animal: false,
                humanoid: false,
                mechanical: true,
                void: false,
                row_number: '22'
            }]
        },
        required_talents: {'0': [], x: [], '-4': [], '-2': ['Fronde']},
        equipment: {rows: [{quantity: 1, name: 'Fronde', price: '6', row_number: '62'}]}
    }, {
        close_combat: {
            rows: [{
                'details-bonus': 0,
                'details-equipment-always-expend-quantity': 1,
                effect: '[B] PV [E] PS',
                'details-name': '',
                'details-max': '',
                'details-min': '',
                talent: 'Bâton',
                equipment: 'equipment-63',
                'details-exploding-effect': false,
                'details-equipment-always-expend': false,
                'details-include-armor-penalty': true,
                body: true,
                instincts: false,
                heart: false,
                mind: false,
                perception: false,
                action: true,
                desire: false,
                resistance: false,
                mineral: false,
                vegetal: false,
                animal: false,
                humanoid: false,
                mechanical: true,
                void: false,
                row_number: '15'
            }]
        },
        required_talents: {'0': [], x: [], '-4': ['Bâton'], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Bâton', price: '8', row_number: '63'}]}
    }, {
        range_combat: {
            rows: [{
                'details-bonus': 0,
                'details-equipment-always-expend-quantity': 1,
                'distance-point_blank': 'Entre 0 m et 2 m',
                'distance-normal': 'Entre 2 m et 25 m',
                'distance-slightly_far': 'Entre 25 m et 35 m',
                'distance-very_far': 'Entre 35 m et 50 m',
                'effect-point_blank': '[G] PV [D] PS',
                'effect-normal': '[E] PV [B] PS',
                'effect-slightly_far': '[D] PV [A] PS',
                'effect-very_far': '[C] PV [A-1] PS',
                'details-name': '',
                'details-max': '',
                'details-min': '',
                talent: 'Javelot',
                equipment: 'equipment-64',
                'details-exploding-effect': false,
                'details-equipment-always-expend': false,
                'details-include-armor-penalty': true,
                body: true,
                instincts: false,
                heart: false,
                mind: false,
                perception: true,
                action: false,
                desire: false,
                resistance: false,
                mineral: false,
                vegetal: false,
                animal: false,
                humanoid: false,
                mechanical: true,
                void: false,
                row_number: '25'
            }]
        },
        required_talents: {'0': [], x: [], '-4': ['Javelot'], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Javelot', price: '70', row_number: '64'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Lasso', price: '20', row_number: '65'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Bolas', price: '30', row_number: '66'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Garrot', price: '15', row_number: '67'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Sarbacane', price: '20', row_number: '68'}]}
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Carquois (20 flèches ou 10 carreaux)', price: '40', row_number: '69'}]}
    }, {
        range_combat: {
            rows: [{
                'details-bonus': 0,
                'details-equipment-always-expend-quantity': 1,
                'distance-point_blank': 'Entre 0 m et 3 m',
                'distance-normal': 'Entre 3 m et 45 m',
                'distance-slightly_far': 'Entre 45 m et 90 m',
                'distance-very_far': 'Entre 90 m et 200 m',
                'effect-point_blank': '[F] PV',
                'effect-normal': '[D] PV',
                'effect-slightly_far': '[C] PV',
                'effect-very_far': '[B] PV',
                'details-name': 'Arc long (flèches de chasse)',
                'details-max': '',
                'details-min': '',
                talent: 'Arc long',
                equipment: 'equipment-70',
                'details-exploding-effect': false,
                'details-equipment-always-expend': false,
                'details-include-armor-penalty': true,
                body: true,
                instincts: false,
                heart: false,
                mind: false,
                perception: true,
                action: false,
                desire: false,
                resistance: false,
                mineral: false,
                vegetal: false,
                animal: false,
                humanoid: false,
                mechanical: true,
                void: false,
                row_number: '2'
            }]
        },
        required_talents: {'0': [], x: [], '-4': ['Arc long'], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Flèche de Chasse (arc long): [D] PV', price: '15', row_number: '70'}]}
    }, {
        range_combat: {
            rows: [{
                'details-bonus': 0,
                'details-equipment-always-expend-quantity': 1,
                'distance-point_blank': 'Entre 0 m et 3 m',
                'distance-normal': 'Entre 3 m et 45 m',
                'distance-slightly_far': 'Entre 45 m et 50 m',
                'distance-very_far': 'Entre 50 m et 100 m',
                'effect-point_blank': '[F] PV',
                'effect-normal': '[D] PV',
                'effect-slightly_far': '[C] PV',
                'effect-very_far': '[B] PV',
                'details-name': 'Arc court (flèche de chasse)',
                'details-max': '',
                'details-min': '',
                talent: 'Arc court',
                equipment: 'equipment-79',
                'details-exploding-effect': false,
                'details-equipment-always-expend': false,
                'details-include-armor-penalty': true,
                body: true,
                instincts: false,
                heart: false,
                mind: false,
                perception: true,
                action: false,
                desire: false,
                resistance: false,
                mineral: false,
                vegetal: false,
                animal: false,
                humanoid: false,
                mechanical: true,
                void: false,
                row_number: '3'
            }]
        },
        required_talents: {'0': [], x: [], '-4': ['Arc court'], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Flèche de Chasse (arc court): [D] PV', price: '0', row_number: '79'}]}
    }, {
        range_combat: {
            rows: [{
                'details-bonus': 0,
                'details-equipment-always-expend-quantity': 1,
                'distance-point_blank': 'Entre 0 m et 3 m',
                'distance-normal': 'Entre 3 m et 35 m',
                'distance-slightly_far': 'Entre 35 m et 70 m',
                'distance-very_far': 'Entre 70 m et 150 m',
                'effect-point_blank': '[F] PV [C] PS',
                'effect-normal': '[D] PV [A] PS',
                'effect-slightly_far': '[C] PV [A-1] PS',
                'effect-very_far': '[B] PV [A-2] PS',
                'details-name': 'Arc long (flèches lourdes)',
                'details-max': '',
                'details-min': '',
                talent: 'Arc long',
                equipment: 'equipment-73',
                'details-exploding-effect': false,
                'details-equipment-always-expend': false,
                'details-include-armor-penalty': true,
                body: true,
                instincts: false,
                heart: false,
                mind: false,
                perception: true,
                action: false,
                desire: false,
                resistance: false,
                mineral: false,
                vegetal: false,
                animal: false,
                humanoid: false,
                mechanical: true,
                void: false,
                row_number: '10'
            }]
        },
        required_talents: {'0': [], x: [], '-4': ['Arc long'], '-2': []},
        equipment: {
            rows: [{
                quantity: 1,
                name: 'Flèche Lourde (arc long): [D] PV [A] PS',
                price: '0',
                row_number: '73'
            }]
        }
    }, {
        range_combat: {
            rows: [{
                'details-bonus': 0,
                'details-equipment-always-expend-quantity': 1,
                'distance-point_blank': 'Entre 0 m et 3 m',
                'distance-normal': 'Entre 3 m et 25 m',
                'distance-slightly_far': 'Entre 25 m et 50 m',
                'distance-very_far': 'Entre 50 m et 70 m',
                'effect-point_blank': '[F] PV [C] PS -2 protection',
                'effect-normal': '[D] PV [A] PS -2 protection',
                'effect-slightly_far': '[C] PV [A-1] PS -2 protection',
                'effect-very_far': '[B] PV [A-2] PS -2 protection',
                'details-name': 'Arc long (flèches perce armure)',
                'details-max': '',
                'details-min': '',
                talent: 'Arc long',
                equipment: 'equipment-74',
                'details-exploding-effect': false,
                'details-equipment-always-expend': false,
                'details-include-armor-penalty': true,
                body: true,
                instincts: false,
                heart: false,
                mind: false,
                perception: true,
                action: false,
                desire: false,
                resistance: false,
                mineral: false,
                vegetal: false,
                animal: false,
                humanoid: false,
                mechanical: true,
                void: false,
                row_number: '11'
            }]
        },
        required_talents: {'0': [], x: [], '-4': ['Arc long'], '-2': []},
        equipment: {
            rows: [{
                quantity: 1,
                name: 'Flèche Perce Armure (arc long): [D] PV [A] PS -2 protection',
                price: '0',
                row_number: '74'
            }]
        }
    }, {
        range_combat: {
            rows: [{
                'details-bonus': 0,
                'details-equipment-always-expend-quantity': 1,
                'distance-point_blank': 'Entre 0 m et 3 m',
                'distance-normal': 'Entre 3 m et 20 m',
                'distance-slightly_far': 'Entre 20 m et 30 m',
                'distance-very_far': 'Entre 30 m et 40 m',
                'effect-point_blank': '[F] PV [C] PS -2 protection',
                'effect-normal': '[D] PV [A] PS -2 protection',
                'effect-slightly_far': '[C] PV [A-1] PS -2 protection',
                'effect-very_far': '[B] PV [A-2] PS -2 protection',
                'details-name': 'Arc court (flèche perce armure)',
                'details-max': '',
                'details-min': '',
                talent: 'Arc court',
                equipment: 'equipment-80',
                'details-exploding-effect': false,
                'details-equipment-always-expend': false,
                'details-include-armor-penalty': true,
                body: true,
                instincts: false,
                heart: false,
                mind: false,
                perception: true,
                action: false,
                desire: false,
                resistance: false,
                mineral: false,
                vegetal: false,
                animal: false,
                humanoid: false,
                mechanical: true,
                void: false,
                row_number: '13'
            }]
        },
        required_talents: {'0': [], x: [], '-4': ['Arc court'], '-2': []},
        equipment: {
            rows: [{
                quantity: 1,
                name: 'Flèche Perce Armure (arc court): [D] PV [A] PS -2 protection',
                price: '0',
                row_number: '80'
            }]
        }
    }, {
        range_combat: {
            rows: [{
                'details-bonus': 0,
                'details-equipment-always-expend-quantity': 1,
                'distance-point_blank': 'Entre 0 m et 3 m',
                'distance-normal': 'Entre 3 m et 35 m',
                'distance-slightly_far': 'Entre 35 m et 50 m',
                'distance-very_far': 'Entre 50 m et 90 m',
                'effect-point_blank': '[G] PV',
                'effect-normal': '[E] PV',
                'effect-slightly_far': '[D] PV',
                'effect-very_far': '[C] PV',
                'details-name': 'Arc long (flèches tranchantes)',
                'details-max': '',
                'details-min': '',
                talent: 'Arc long',
                equipment: 'equipment-75',
                'details-exploding-effect': false,
                'details-equipment-always-expend': false,
                'details-include-armor-penalty': true,
                body: true,
                instincts: false,
                heart: false,
                mind: false,
                perception: true,
                action: false,
                desire: false,
                resistance: false,
                mineral: false,
                vegetal: false,
                animal: false,
                humanoid: false,
                mechanical: true,
                void: false,
                row_number: '12'
            }]
        },
        required_talents: {'0': [], x: [], '-4': ['Arc long'], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Flèche Tranchante (arc long): [E] PV', price: '0', row_number: '75'}]}
    }, {
        range_combat: {
            rows: [{
                'details-bonus': 0,
                'details-equipment-always-expend-quantity': 1,
                'distance-point_blank': 'Entre 0 m et 3 m',
                'distance-normal': 'Entre 3 m et 20 m',
                'distance-slightly_far': 'Entre 20 m et 35 m',
                'distance-very_far': 'Entre 35 m et 50 m',
                'effect-point_blank': '[G] PV',
                'effect-normal': '[E] PV',
                'effect-slightly_far': '[D] PV',
                'effect-very_far': '[C] PV',
                'details-name': 'Arc court (flèches tranchantes)',
                'details-max': '',
                'details-min': '',
                talent: 'Arc court',
                equipment: 'equipment-81',
                'details-exploding-effect': false,
                'details-equipment-always-expend': false,
                'details-include-armor-penalty': true,
                body: true,
                instincts: false,
                heart: false,
                mind: false,
                perception: true,
                action: false,
                desire: false,
                resistance: false,
                mineral: false,
                vegetal: false,
                animal: false,
                humanoid: false,
                mechanical: true,
                void: false,
                row_number: '14'
            }]
        },
        required_talents: {'0': [], x: [], '-4': ['Arc court'], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Flèche Tranchante (arc court): [E] PV', price: '0', row_number: '81'}]}
    }, {
        range_combat: {
            rows: [{
                'details-bonus': 0,
                'details-equipment-always-expend-quantity': 1,
                'distance-point_blank': 'Entre 0 m et 3 m',
                'distance-normal': 'Entre 3 m et 25 m',
                'distance-slightly_far': 'Entre 25 m et 40 m',
                'distance-very_far': 'Entre 40 m et 60 m',
                'effect-point_blank': '[G] PV [D] PS',
                'effect-normal': '[E] PV [B] PS',
                'effect-slightly_far': '[D] PV [A] PS',
                'effect-very_far': '[C] PV [A-1] PS',
                'details-name': 'Arbalète légère (carreaux lourds)',
                'details-max': '',
                'details-min': '',
                talent: 'Arbalète légère',
                equipment: 'equipment-71',
                'details-exploding-effect': false,
                'details-equipment-always-expend': false,
                'details-include-armor-penalty': true,
                body: true,
                instincts: false,
                heart: false,
                mind: false,
                perception: true,
                action: false,
                desire: false,
                resistance: false,
                mineral: false,
                vegetal: false,
                animal: false,
                humanoid: false,
                mechanical: true,
                void: false,
                row_number: '18'
            }]
        },
        required_talents: {'0': [], x: [], '-4': ['Arbalète légère'], '-2': []},
        equipment: {
            rows: [{
                quantity: 1,
                name: 'Carreau Lourd (arbalète légère): [E] PV [B] PS',
                price: '30',
                row_number: '71'
            }]
        }
    }, {
        range_combat: {
            rows: [{
                'details-bonus': 0,
                'details-equipment-always-expend-quantity': 1,
                'distance-point_blank': 'Entre 0 m et 3 m',
                'distance-normal': 'Entre 3 m et 30 m',
                'distance-slightly_far': 'Entre 30 m et 60 m',
                'distance-very_far': 'Entre 60 m et 100 m',
                'effect-point_blank': '[G] PV [D] PS',
                'effect-normal': '[E] PV [B] PS',
                'effect-slightly_far': '[D] PV [A] PS',
                'effect-very_far': '[C] PV [A-1] PS',
                'details-name': 'Arbalète lourde (carreaux lourds)',
                'details-max': '',
                'details-min': '',
                talent: 'Arbalète lourde',
                equipment: 'equipment-82',
                'details-exploding-effect': false,
                'details-equipment-always-expend': false,
                'details-include-armor-penalty': true,
                body: true,
                instincts: false,
                heart: false,
                mind: false,
                perception: true,
                action: false,
                desire: false,
                resistance: false,
                mineral: false,
                vegetal: false,
                animal: false,
                humanoid: false,
                mechanical: true,
                void: false,
                row_number: '15'
            }]
        },
        required_talents: {'0': [], x: [], '-4': ['Arbalète lourde'], '-2': []},
        equipment: {
            rows: [{
                quantity: 1,
                name: 'Carreau Lourd (arbalète lourde): [E] PV [B] PS',
                price: '0',
                row_number: '82'
            }]
        }
    }, {
        range_combat: {
            rows: [{
                'details-bonus': 0,
                'details-equipment-always-expend-quantity': 1,
                'distance-point_blank': 'Entre 0 m et 3 m',
                'distance-normal': 'Entre 3 m et 20 m',
                'distance-slightly_far': 'Entre 20 m et 35 m',
                'distance-very_far': 'Entre 35 m et 50 m',
                'effect-point_blank': '[G] PV [D] PS -2 protection',
                'effect-normal': '[E] PV [B] PS -2 protection',
                'effect-slightly_far': '[D] PV [A] PS -2 protection',
                'effect-very_far': '[C] PV [A-1] PS -2 protection',
                'details-name': 'Arbalète légère (carreaux perce armure)',
                'details-max': '',
                'details-min': '',
                talent: 'Arbalète légère',
                equipment: 'equipment-76',
                'details-exploding-effect': false,
                'details-equipment-always-expend': false,
                'details-include-armor-penalty': true,
                body: true,
                instincts: false,
                heart: false,
                mind: false,
                perception: true,
                action: false,
                desire: false,
                resistance: false,
                mineral: false,
                vegetal: false,
                animal: false,
                humanoid: false,
                mechanical: true,
                void: false,
                row_number: '19'
            }]
        },
        required_talents: {'0': [], x: [], '-4': ['Arbalète légère'], '-2': []},
        equipment: {
            rows: [{
                quantity: 1,
                name: 'Carreau Perce Armure (arbalète légère): [E] PV [B] PS -2 protection',
                price: '0',
                row_number: '76'
            }]
        }
    }, {
        range_combat: {
            rows: [{
                'details-bonus': 0,
                'details-equipment-always-expend-quantity': 1,
                'distance-point_blank': 'Entre 0 m et 3 m',
                'distance-normal': 'Entre 3 m et 25 m',
                'distance-slightly_far': 'Entre 25 m et 45 m',
                'distance-very_far': 'Entre 45 m et 70 m',
                'effect-point_blank': '[G] PV [D] PS -2 protection',
                'effect-normal': '[E] PV [B] PS -2 protection',
                'effect-slightly_far': '[D] PV [A] PS -2 protection',
                'effect-very_far': '[C] PV [A-1] PS -2 protection',
                'details-name': 'Arbalète lourde (carreaux perce armure)',
                'details-max': '',
                'details-min': '',
                talent: 'Arbalète lourde',
                equipment: 'equipment-83',
                'details-exploding-effect': false,
                'details-equipment-always-expend': false,
                'details-include-armor-penalty': true,
                body: true,
                instincts: false,
                heart: false,
                mind: false,
                perception: true,
                action: false,
                desire: false,
                resistance: false,
                mineral: false,
                vegetal: false,
                animal: false,
                humanoid: false,
                mechanical: true,
                void: false,
                row_number: '16'
            }]
        },
        required_talents: {'0': [], x: [], '-4': ['Arbalète lourde'], '-2': []},
        equipment: {
            rows: [{
                quantity: 1,
                name: 'Carreau Perce Armure (arbalète lourde): [E] PV [B] PS -2 protection',
                price: '0',
                row_number: '83'
            }]
        }
    }, {
        range_combat: {
            rows: [{
                'details-bonus': 0,
                'details-equipment-always-expend-quantity': 1,
                'distance-point_blank': 'Entre 0 m et 2 m',
                'distance-normal': 'Entre 2 m et 10 m',
                'distance-slightly_far': 'Entre 10 m et 20 m',
                'distance-very_far': 'Entre 20 m et 35 m',
                'effect-point_blank': '[G] PV',
                'effect-normal': '[E] PV',
                'effect-slightly_far': '[D] PV',
                'effect-very_far': '[C] PV',
                'details-name': 'Arbalète à poing (carreaux légers)',
                'details-max': '',
                'details-min': '',
                talent: 'Arbalète légère',
                equipment: 'equipment-72',
                'details-exploding-effect': false,
                'details-equipment-always-expend': false,
                'details-include-armor-penalty': true,
                body: true,
                instincts: false,
                heart: false,
                mind: false,
                perception: true,
                action: false,
                desire: false,
                resistance: false,
                mineral: false,
                vegetal: false,
                animal: false,
                humanoid: false,
                mechanical: true,
                void: false,
                row_number: '21'
            }]
        },
        required_talents: {'0': [], x: [], '-4': ['Arbalète légère'], '-2': []},
        equipment: {
            rows: [{
                quantity: 1,
                name: 'Carreau Léger (arbalète à poing): [E] PV',
                price: '20',
                row_number: '72'
            }]
        }
    }, {
        range_combat: {
            rows: [{
                'details-bonus': 0,
                'details-equipment-always-expend-quantity': 1,
                'distance-point_blank': 'Entre 0 m et 3 m',
                'distance-normal': 'Entre 3 m et 30 m',
                'distance-slightly_far': 'Entre 30 m et 50 m',
                'distance-very_far': 'Entre 50 m et 100 m',
                'effect-point_blank': '[G] PV',
                'effect-normal': '[E] PV',
                'effect-slightly_far': '[D] PV',
                'effect-very_far': '[C] PV',
                'details-name': 'Arbalète légère (carreaux légers)',
                'details-max': '',
                'details-min': '',
                talent: 'Arbalète légère',
                equipment: 'equipment-84',
                'details-exploding-effect': false,
                'details-equipment-always-expend': false,
                'details-include-armor-penalty': true,
                body: true,
                instincts: false,
                heart: false,
                mind: false,
                perception: true,
                action: false,
                desire: false,
                resistance: false,
                mineral: false,
                vegetal: false,
                animal: false,
                humanoid: false,
                mechanical: true,
                void: false,
                row_number: '20'
            }]
        },
        required_talents: {'0': [], x: [], '-4': ['Arbalète légère'], '-2': []},
        equipment: {
            rows: [{
                quantity: 1,
                name: 'Carreau Léger (arbalète légère): [E] PV',
                price: '0',
                row_number: '84'
            }]
        }
    }, {
        range_combat: {
            rows: [{
                'details-bonus': 0,
                'details-equipment-always-expend-quantity': 1,
                'distance-point_blank': 'Entre 0 m et 3 m',
                'distance-normal': 'Entre 3 m et 35 m',
                'distance-slightly_far': 'Entre 35 m et 70 m',
                'distance-very_far': 'Entre 70 m et 120 m',
                'effect-point_blank': '[G] PV',
                'effect-normal': '[E] PV',
                'effect-slightly_far': '[D] PV',
                'effect-very_far': '[C] PV',
                'details-name': 'Arbalète lourde (carreaux légers)',
                'details-max': '',
                'details-min': '',
                talent: 'Arbalète lourde',
                equipment: 'equipment-85',
                'details-exploding-effect': false,
                'details-equipment-always-expend': false,
                'details-include-armor-penalty': true,
                body: true,
                instincts: false,
                heart: false,
                mind: false,
                perception: true,
                action: false,
                desire: false,
                resistance: false,
                mineral: false,
                vegetal: false,
                animal: false,
                humanoid: false,
                mechanical: true,
                void: false,
                row_number: '17'
            }]
        },
        required_talents: {'0': [], x: [], '-4': ['Arbalète lourde'], '-2': []},
        equipment: {
            rows: [{
                quantity: 1,
                name: 'Carreau Léger (arbalète lourde): [E] PV',
                price: '0',
                row_number: '85'
            }]
        }
    }, {
        required_talents: {'0': [], x: [], '-4': [], '-2': []},
        equipment: {rows: [{quantity: 1, name: 'Arbalète à poing', price: '0', row_number: '77'}]}
    }, {
        range_combat: {
            rows: [{
                'details-bonus': 0,
                'details-equipment-always-expend-quantity': 1,
                'distance-point_blank': 'Entre 0 m et 3 m',
                'distance-normal': 'Entre 3 m et 25 m',
                'distance-slightly_far': 'Entre 25 m et 35 m',
                'distance-very_far': 'Entre 35 m et 40 m',
                'effect-point_blank': '[E] PV [E] PS',
                'effect-normal': '[C] PV [C] PS',
                'effect-slightly_far': '[B] PV [B] PS',
                'effect-very_far': '[A] PV [A] PS',
                'details-name': 'Fronde (bille métallique)',
                'details-max': '',
                'details-min': '',
                talent: 'Fronde',
                equipment: 'equipment-78',
                'details-exploding-effect': false,
                'details-equipment-always-expend': false,
                'details-include-armor-penalty': true,
                body: true,
                instincts: false,
                heart: false,
                mind: false,
                perception: true,
                action: false,
                desire: false,
                resistance: false,
                mineral: false,
                vegetal: false,
                animal: false,
                humanoid: false,
                mechanical: true,
                void: false,
                row_number: '23'
            }]
        },
        required_talents: {'0': [], x: [], '-4': [], '-2': ['Fronde']},
        equipment: {rows: [{quantity: 1, name: 'Bille métallique', price: '0', row_number: '78'}]}
    }]
}
