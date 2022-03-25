/* Remaining adventure point computation in SimulacreS v8 */

let start_components = matrix_4x4 ? 17 : 13
let component_ap_cost = 14
let component_5_to_6_ap_cost = 20
let start_means = matrix_4x4 ? 10 : 8
let means_ap_cost = 10
let start_hp = 4
let health_ap_cost = 10
let start_breath = 5
let start_psychic_balance = 4
let breath_ap_cost = 6
let psychic_balance_ap_cost = 15

let target_ap_cost = 4
let start_energies = 4
let energy_cost_by_level = [0, 5, 15, 40]
let special_energy_cost_by_level = [0, 10, 35, 70]

talent_increment_cost = {
    x: {x: 0, "-4": NaN, "-2": 2, "0": 3, "1": 9, "2": 29, "3": 54},
    "-4": {x: NaN, "-4": 0, "-2": NaN, "0": 2, "1": 8, "2": 28, "3": 53},
    "-2": {x: NaN, "-4": NaN, "-2": 0, "0": 1, "1": 7, "2": 27, "3": 52},
    "0": {x: NaN, "-4": NaN, "-2": NaN, "0": 0, "1": 5, "2": 25, "3": 50},
    "1": {x: NaN, "-4": NaN, "-2": NaN, "0": NaN, "1": 0, "2": 20, "3": 45}
}
let indirect_x_to_0_raise_cost = 0 // No penalty
let advised_talent_save = 0 // No bonus

let power_level_ap_cost = 5 // From 1 to 2 and from 2 to 3

class AdventurePointsV8 extends AdventurePoints {
    static selects = intermediate_discovery ? [] : [...super.selects,
        ...["special-energies-started-level-1", "components-started-level-6"]]
    static selects_no_sanitize = intermediate_discovery ? [] : [...super.selects_no_sanitize, "special-energies-started-level-1", "components-started-level-6"]

    do_compute_remaining_ap() {
        const ap_div = $("#remaining-adventure-points")
        if (ap_div.length === 0) // No AP field => do not compute it
            return

        let consumed_points = this.compute_component_means_cost() + this.compute_status_cost()

        const characteristics = sheet["characteristics"]
        let max_health = sheet.status["hp-trunk.max"]
        if (characteristics["resistance." + light_bonus_class]) {
            max_health -= 1
        } else if (characteristics["resistance." + heavy_bonus_class]) {
            max_health -= 2
        }
        let diff = (max_health - start_hp) * health_ap_cost
        if (diff > 0)
            consumed_points += diff
        if (sheet.status["health_ap_cost"]) {
            let title = $("#hp-title")
            if (title.length > 0 && !intermediate_discovery) {
                let note = $("#details-hp-trunk").val()
                const base = "Coût: " + diff + " PA"
                if (note && note.length)
                    note = note + "<br/>" + base
                else
                    note = base
                title[0].setAttribute("title", note)
                title[0].setAttribute("data-original-title-base", base)
                title.tooltip("dispose")
                title.tooltip()
                sheet.status["health_ap_cost"] = diff
            }
        }

        // Targets
        diff = 0
        let target_sum = 0
        Characteristics.realms.forEach((elem) => {
            target_sum += characteristics[elem]
        })
        if (target_sum > 0) {// Supposed to be a 0-sum
            diff = target_sum * target_ap_cost
            consumed_points += diff
        }
        if (!characteristics["realm_ap_cost"] || characteristics["realm_ap_cost"] !== diff) {
            const title = $("#realm-title")
            if (title.length > 0 && !intermediate_discovery) {
                title[0].setAttribute("title", "Coût des cibles: " + diff + " PA")
                title.tooltip("dispose")
                title.tooltip()
            }
            characteristics["realm_ap_cost"] = diff
        }

        // Energies
        diff = 0
        let energy_point_increased = 0
        const energies_repartition_level = [0, 0, 0, 0] // Level ranges from 0 to 3
        const special_energies_repartition_level = [0, 0, 0, 0] // Level ranges from 0 to 3
        const energies = [...Characteristics.special_energies, ...Characteristics.base_energies]
        energies.forEach((elem) => {
            let value = characteristics[elem]
            energy_point_increased += value
            if (Characteristics.base_energies.includes(elem)) { // Classic energy
                energies_repartition_level[value] += 1
            } else { // Special energy
                special_energies_repartition_level[value] += 1
            }
        })
        if (energy_point_increased > start_energies) { // To check that at least the 8 starting points were spent
            /* Classic energies */
            for (let level = 0; level < energies_repartition_level.length; level++) {
                diff += energy_cost_by_level[level] * energies_repartition_level[level]
            }

            /* Special energies */
            for (let level = 0; level < special_energies_repartition_level.length; level++) {
                diff += special_energy_cost_by_level[level] * special_energies_repartition_level[level]
            }

            /* Energy optimisations */
            const start_special_energies_1 = multiselect_to_array(this["special-energies-started-level-1"]).length
            diff -= start_special_energies_1 * (special_energy_cost_by_level[1] - energy_cost_by_level[1])
            const start_energies_2 = multiselect_to_array(this["energies-started-level-2"]).length
            const start_energies_1 = start_energies - start_energies_2 * 2
            diff -= (energy_cost_by_level[2] * start_energies_2 + energy_cost_by_level[1] * start_energies_1)
            consumed_points += diff
        }
        if (!characteristics["energy_ap_cost"] || characteristics["energy_ap_cost"] !== diff) {
            const title = $("#energy-title")
            if (title.length > 0 && !intermediate_discovery) {
                title[0].setAttribute("title", "Coût de toutes les énergies: " + diff + " PA")
                title.tooltip("dispose")
                title.tooltip()
            }
            characteristics["energy_ap_cost"] = diff
        }

        // Talents
        consumed_points += this.talents_cost()

        // Monk powers
        consumed_points += this.monk_power_cost()

        // Show difference with total points
        const total_points = (parseInt($("#adventure-points").val()) || 0) + (parseInt($("#adventure-points-discount").val()) || 0)
        ap_div.text(total_points - consumed_points)
    }
}
