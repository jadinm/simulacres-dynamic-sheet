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
let divine_spell_ap_cost = talent_increment_cost["x"]["0"]
let good_nature_evil_base_cost = 1
let good_nature_evil_level_cost = 3
let spell_same_realm_discount = 1

let power_level_ap_cost = 5 // From 1 to 2 and from 2 to 3

function compute_remaining_ap() {
    let consumed_points = compute_component_means_cost() + compute_status_cost()

    // Realm & energies
    let diff = 0
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
            diff += energy_cost_by_level[level] * energies_repartition_level[level]
        }
        const start_energies_2 = ($("#energies-started-level-2").val() || []).length
        const start_energies_1 = start_energies - start_energies_2 * 2
        diff -= (energy_cost_by_level[2] * start_energies_2 + energy_cost_by_level[1] * start_energies_1)
        consumed_points += diff
    }
    // Update tooltip
    let title = $("#realm-title, #energy-title")
    if (title.length > 0 && !intermediate_discovery) {
        title.each((i, elem) => elem.setAttribute("title", "Coût de tous les règnes et énergies: " + diff + " PA"))
        title.tooltip("dispose")
        title.tooltip()
    }

    // Talents
    consumed_points += talents_cost()

    // Spells
    const all_names = []
    const diff_level_2 = talent_increment_cost["x"]["-2"] - talent_increment_cost["x"]["-4"]
    const spells_raised_2 = ($("#spells-started-level-2").val() || [])
    const diff_level_0 = talent_increment_cost["x"]["0"] - talent_increment_cost["x"]["-4"]
    const spells_raised_0 = ($("#spells-started-level-0").val() || [])
    const spells_free_good_nature_evil = ($("#spells-free-good-nature-evil").val() || [])
    $(".spell").each((i, elem) => {
        diff = 0
        let name
        const spell = SpellRow.of(elem)
        const spell_list_div = spell.get("list")
        const spell_list = spell_list_div.length > 0 ? spell.get("list")[0].value.trim() : ""
        const spell_level = parseInt(spell.get("level")[0].value.trim())
        if (spell_list === hermetic_energy) {
            name = $(elem).find("select.spell-talent").val().trim()
        } else {
            name = $(elem).find(".spell-name").val().trim()
        }
        let split_spell_realm_modifier = spell_same_realm_discount
        if (name && name.length > 0) {
            if (!all_names.includes(name)) {
                split_spell_realm_modifier = 0
                all_names.push(name)
            }

            // Number of checked realms for the spell
            const inline_realms = spell.data.find("input[name*=-realm]:checked")
            const inline_realms_nbr = inline_realms.length
            if (inline_realms_nbr > 0) {
                if (spell_list === priest_energy || spell_list === hermetic_energy) {
                    diff += (divine_spell_ap_cost * inline_realms_nbr) - (inline_realms_nbr - 1) * spell_same_realm_discount
                        - split_spell_realm_modifier // Priest have level 0 spell directly
                } else if (spell_list !== instinctive_magic) {
                    diff += (mage_spell_ap_cost * inline_realms_nbr) - (inline_realms_nbr - 1) * spell_same_realm_discount
                        - split_spell_realm_modifier // Mages have -4 level spells at start
                }
            } else if (good_nature_evil_energies.includes(spell_list) && !spells_free_good_nature_evil.includes(elem.id)) {
                diff += (!spell_level || isNaN(spell_level) || spell_level === 0) ? good_nature_evil_base_cost : spell_level * good_nature_evil_level_cost
            }

            // Raised at the creation
            inline_realms.each((i, elem) => {
                if (spells_raised_0.includes(elem.id))
                    diff += diff_level_0
                else if (spells_raised_2.includes(elem.id))
                    diff += diff_level_2
            })

            consumed_points += diff
        }

        // Update tooltip
        title = spell.data.children().first()
        if (title.length > 0 && spell.data.id !== "spell-x" && !intermediate_discovery) {
            title.each((i, elem) => elem.setAttribute("title", "Coût: " + diff + " PA"))
            title.tooltip("dispose")
            title.tooltip()
        }
    })

    // Monk powers
    consumed_points += monk_power_cost()

    // Show difference with total points
    const total_points = (parseInt($("#adventure-points").val()) || 0) + (parseInt($("#adventure-points-discount").val()) || 0)
    $("#remaining-adventure-points").text(total_points - consumed_points)
}
