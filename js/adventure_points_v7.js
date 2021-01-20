let start_components = 18
let component_ap_cost = 20
let start_means = 10
let means_ap_cost = 10
let start_breath = 4
let breath_ap_cost = 30
let start_psychic_balance = 4
let psychic_balance_ap_cost = 30

let start_energies = 8
let energy_cost_by_level = [0, 5, 15, 35]

let talent_increment_cost = {
    x: {x: 0, "-4": 2, "-2": 3, "0": 5, "1": 10, "2": 30, "3": 70},
    "-4": {x: NaN, "-4": 0, "-2": 1, "0": 4, "1": 9, "2": 29, "3": 69},
    "-2": {x: NaN, "-4": NaN, "-2": 0, "0": 3, "1": 8, "2": 28, "3": 68},
    "0": {x: NaN, "-4": NaN, "-2": NaN, "0": 0, "1": 5, "2": 25, "3": 65},
    "1": {x: NaN, "-4": NaN, "-2": NaN, "0": NaN, "1": 0, "2": 20, "3": 60}
}
let talent_increment_cost_discovery_2 = 0
let talent_increment_cost_discovery_3 = 0
let indirect_x_to_0_raise_cost = 1
let advised_talent_save = 1
let mage_spell_ap_cost = talent_increment_cost["x"]["-4"]
let ki_divine_spell_ap_cost = talent_increment_cost["x"]["0"]
let spell_same_realm_discount = 1

let power_level_ap_cost = 5 // From 1 to 2 and from 2 to 3

function compute_remaining_ap() {
    let consumed_points = compute_component_means_cost() + compute_status_cost()

    // Realm & energies
    let energy_point_increased = 0
    const energies_repartition_level = [0, 0, 0, 0] // Level ranges from 0 to 3
    $(".realm, .energy, .special-energy").each((i, elem) => {
        let value = parseInt(elem.value)
        if (isNaN(value) || elem.id === "void")
            value = 0
        energy_point_increased += value
        energies_repartition_level[value] += 1
    })
    if (energy_point_increased > start_energies) { // To check that at least the 8 starting points were spent
        for (let level = 0; level < energies_repartition_level.length; level++) {
            consumed_points += energy_cost_by_level[level] * energies_repartition_level[level]
        }
        const start_energies_2 = ($("#energies-started-level-2").val() || []).length
        const start_energies_1 = start_energies - start_energies_2 * 2
        consumed_points -= (energy_cost_by_level[2] * start_energies_2 + energy_cost_by_level[1] * start_energies_1)
    }

    // Talents
    consumed_points += talents_cost()

    // Spells
    const all_names = []
    $(".spell-name").each((i, elem) => {
        const name = elem.value.trim()
        let realm_modifier = spell_same_realm_discount
        if (name.length > 0) {
            if (!all_names.includes(name)) {
                realm_modifier = 0
                all_names.push(name)
            }

            const spell_list = row_elem(elem, "list")[0].value.trim()
            if (spell_list === priest_energy)
                consumed_points += ki_divine_spell_ap_cost - realm_modifier // Priest and monk have level 0 spell directly
            else if (spell_list.length > 0 && spell_list !== hermetic_energy && spell_list !== instinctive_magic)
                consumed_points += mage_spell_ap_cost - realm_modifier // Mages have -4 level spells at start
        }
    })
    // Spell increased above level 0 at start of the campaign
    const diff_level_2 = talent_increment_cost["x"]["-2"] - talent_increment_cost["x"]["-4"]
    consumed_points += diff_level_2 * ($("#spells-started-level-2").val() || []).length
    const diff_level_0 = talent_increment_cost["x"]["0"] - talent_increment_cost["x"]["-4"]
    consumed_points += diff_level_0 * ($("#spells-started-level-0").val() || []).length

    // Monk powers
    consumed_points += monk_power_cost()

    // Show difference with total points
    const total_points = (parseInt($("#adventure-points").val()) || 0) + (parseInt($("#adventure-points-discount").val()) || 0)
    $("#remaining-adventure-points").text(total_points - consumed_points)
}
