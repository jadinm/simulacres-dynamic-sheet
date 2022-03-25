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
let indirect_x_to_0_raise_cost = 1
let advised_talent_save = 1
let mage_spell_ap_cost = talent_increment_cost["x"]["-4"]
let divine_spell_ap_cost = talent_increment_cost["x"]["0"]
let good_nature_evil_base_cost = 1
let good_nature_evil_level_cost = 3
let spell_same_realm_discount = 1
let rune_base_cost = 2
let name_magic_cost = {
    "species-name": 1,
    "simple-verb": 2,
    "race-name": 2,
    "transformation-verb": 3,
    "individual-name": 5,
    "creation-destruction-verb": 5
}

let power_level_ap_cost = 5 // From 1 to 2 and from 2 to 3

let survival_check_cost = 25

class AdventurePointsV7 extends AdventurePoints {
    static numeric_inputs = intermediate_discovery ? super.numeric_inputs
        : [...super.numeric_inputs, "adventure-points-survive-paid"]
    static basic_inputs = [...this.numeric_inputs]
    static selects = intermediate_discovery ? [] : [...super.selects,
        ...["talents-inefficient-raise", "advised-talents", "spells-started-level-2",
            "spells-started-level-0", "spells-free-good-nature-evil"]]
    static selects_no_sanitize = [...super.selects_no_sanitize, "spells-started-level-2", "spells-started-level-0", "spells-free-good-nature-evil"]

    advised_talent() {
        return multiselect_to_array(this["advised-talents"])
    }

    talent_x_inefficient_raise() {
        return multiselect_to_array(this["talents-inefficient-raise"])
    }

    update_tooltip_cost(row, diff) {
        // Do not update a tooltip if the value did not change
        if (!row["ap_cost"] || row["ap_cost"] !== diff) {
            const title = row.data.children().first()
            if (title.length > 0 && !row.id.includes("-x") && !intermediate_discovery) {
                title.each((i, elem) => elem.setAttribute("title", "Coût: " + diff + " PA"))
                title.tooltip("dispose")
                title.tooltip()
            }
            row["ap_cost"] = diff
        }
    }

    do_compute_remaining_ap() {
        const ap_div = $("#remaining-adventure-points")
        if (ap_div.length === 0) // No AP field => do not compute it
            return
        if (!sheet)
            return

        let consumed_points = this.compute_component_means_cost() + this.compute_status_cost()

        // Realm & energies
        const characteristics = sheet["characteristics"]
        const energies = [...Characteristics.realms, ...Characteristics.base_energies, ...Characteristics.special_energies]

        let diff = 0
        let energy_point_increased = 0
        const energies_repartition_level = [0, 0, 0, 0] // Level ranges from 0 to 3
        energies.forEach(energy => {
            if (characteristics[energy] >= 0) { // Do not add "void" realm
                energy_point_increased += characteristics[energy]
                energies_repartition_level[characteristics[energy]] += 1
            }
        })
        if (energy_point_increased > start_energies) { // To check that at least the 8 starting points were spent
            for (let level = 0; level < energies_repartition_level.length; level++) {
                diff += energy_cost_by_level[level] * energies_repartition_level[level]
            }
            const start_energies_2 = multiselect_to_array(this["energies-started-level-2"]).length
            const start_energies_1 = start_energies - start_energies_2 * 2
            diff -= (energy_cost_by_level[2] * start_energies_2 + energy_cost_by_level[1] * start_energies_1)
            consumed_points += diff
        }
        // Update tooltip
        if (!characteristics["energy_ap_cost"] || characteristics["energy_ap_cost"] !== diff) {
            let title = $("#realm-title, #energy-title")
            if (title.length > 0 && !intermediate_discovery) {
                title.each((i, elem) => elem.setAttribute("title", "Coût de tous les règnes et énergies: " + diff + " PA"))
                title.tooltip("dispose")
                title.tooltip()
            }
            characteristics["energy_ap_cost"] = diff
        }

        // Talents
        consumed_points += this.talents_cost()

        // Spells
        const all_names = []
        const diff_level_2 = talent_increment_cost["x"]["-2"] - talent_increment_cost["x"]["-4"]
        const diff_level_0 = talent_increment_cost["x"]["0"] - talent_increment_cost["x"]["-4"]
        const spells_raised_2 = multiselect_to_array(this["spells-started-level-2"])
        const spells_raised_0 = multiselect_to_array(this["spells-started-level-0"])
        const spells_free_good_nature_evil = multiselect_to_array(this["spells-free-good-nature-evil"])
        const spell_like_rows = [...sheet["spells"].rows, ...sheet["psi_powers"].rows, ...sheet["warrior_way"].rows]
        spell_like_rows.forEach(spell => {
            diff = 0
            let name
            const spell_level = spell.level
            if (spell.is_talent_based_spell()) {
                name = spell["talent"]
            } else {
                name = spell.name
            }
            let split_spell_realm_modifier = spell_same_realm_discount

            const ap_overwrite = parseInt(spell["details-ap-cost"])
            if (!isNaN(ap_overwrite)) {
                diff = ap_overwrite
            } else if (name && name.length > 0) {
                if (!all_names.includes(name)) {
                    split_spell_realm_modifier = 0
                    all_names.push(name)
                }

                // Number of checked realms for the spell
                const inline_realms_nbr = spell.nbr_realms()
                if (inline_realms_nbr > 0) {
                    if (spell.is_priest_magic() || spell.is_hermetic_spell()) {
                        diff += (divine_spell_ap_cost * inline_realms_nbr) - (inline_realms_nbr - 1) * spell_same_realm_discount
                            - split_spell_realm_modifier // Priest have level 0 spell directly
                    } else if (!spell.is_instinctive_magic()) {
                        diff += (mage_spell_ap_cost * inline_realms_nbr) - (inline_realms_nbr - 1) * spell_same_realm_discount
                            - split_spell_realm_modifier // Mages have -4 level spells at start
                    }
                } else if (spell.is_evil_nature_good() && !spells_free_good_nature_evil.includes(spell.id)) {
                    diff += (!spell_level || isNaN(spell_level) || spell_level === 0) ? good_nature_evil_base_cost : spell_level * good_nature_evil_level_cost
                }

                // Raised at the creation
                spells_raised_0.forEach(elem => {
                    if (elem.includes(spell.id))
                        diff += diff_level_0
                })
                spells_raised_2.forEach(elem => {
                    if (elem.includes(spell.id))
                        diff += diff_level_2
                })

            }
            consumed_points += diff

            // Update tooltip
            this.update_tooltip_cost(spell, diff)
        })

        // Runes
        sheet["runes"].rows.forEach(rune => {
            let diff = 0
            if (rune.name) {
                diff += rune_base_cost
            }
            // Update tooltip
            this.update_tooltip_cost(rune, diff)
            consumed_points += diff
        })

        // Name magic
        sheet["words"].rows.forEach(word => {
            let diff = 0
            if (word.name && word.type) {
                diff += name_magic_cost[word.type]
            }
            // Update tooltip
            this.update_tooltip_cost(word, diff)
            consumed_points += diff
        })

        // Monk powers
        consumed_points += this.monk_power_cost()

        // Survival checks
        consumed_points += this["adventure-points-survive-paid"] * survival_check_cost

        // Show difference with total points
        const total_points = this["adventure-points"] + this["adventure-points-discount"]
        ap_div.text(total_points - consumed_points)
    }
}
