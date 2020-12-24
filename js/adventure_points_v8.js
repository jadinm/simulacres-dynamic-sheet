/* Remaining adventure point computation in SimulacreS v8 */

let start_components = matrix_4x4 ? 17 : 13
let component_ap_cost = 14
let component_5_to_6_ap_cost = 20
let start_means = matrix_4x4 ? 10 : 8
let means_ap_cost = 10
let start_hp = 4
let health_ap_cost = 10
let start_breath = 4
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
let mage_spell_ap_cost = 0  // No special cost, a spell is a talent
let ki_divine_spell_ap_cost = 0  // No special cost, a spell is a talent
let spell_same_realm_discount = 0  // No special cost, a spell is a talent

let power_level_ap_cost = 5 // From 1 to 2 and from 2 to 3

function compute_remaining_ap() {
    let consumed_points = compute_component_means_cost() + compute_status_cost()

    // Add costs for components raised to 6 (but not at the start of the campaign)
    let raised_to_6 = 0
    $(".component").each((i, elem) => {
        if (parseInt(elem.value) === 6)
            raised_to_6 += 1
    })
    raised_to_6 -= parseInt($("#components-started-level-6").val())
    if (raised_to_6 > 0)
        consumed_points += raised_to_6 * (component_5_to_6_ap_cost - component_ap_cost)

    // Health cost
    const health = $("#hp-trunk")
    let max_health = slider_max(health[0])
    const resistance = parseInt($("#resistance").val())
    if (resistance === 2) {
        max_health -= 1
    } else if (resistance >= 3) {
        max_health -= 2
    }
    const diff = max_health - start_hp
    if (diff > 0)
        consumed_points += diff * health_ap_cost

    // Targets
    let target_sum = 0
    $(".realm").each((i, elem) => {
        let value = parseInt(elem.value)
        if (isNaN(value))
            value = 0
        target_sum += value
    })
    if (target_sum > 0) // Supposed to be a 0-sum
        consumed_points += target_sum * target_ap_cost

    // Energies
    let energy_point_increased = 0
    const energies_repartition_level = [0, 0, 0, 0] // Level ranges from 0 to 3
    const special_energies_repartition_level = [0, 0, 0, 0] // Level ranges from 0 to 3
    $(".energy, .special-energy").each((i, elem) => {
        let value = parseInt(elem.value)
        if (isNaN(value))
            value = 0
        energy_point_increased += value
        if ($(elem).hasClass("energy")) { // Classic energy
            energies_repartition_level[value] += 1
        } else { // Special energy
            special_energies_repartition_level[value] += 1
        }
    })
    if (energy_point_increased > start_energies) { // To check that at least the 8 starting points were spent
        /* Classic energies */
        for (let level = 0; level < energies_repartition_level.length; level++) {
            consumed_points += energy_cost_by_level[level] * energies_repartition_level[level]
        }

        /* Special energies */
        for (let level = 0; level < special_energies_repartition_level.length; level++) {
            consumed_points += special_energy_cost_by_level[level] * special_energies_repartition_level[level]
        }

        /* Energy optimisations */
        const start_special_energies_1 = parseInt($("#special-energies-started-level-1").val())
        consumed_points -= start_special_energies_1 * (special_energy_cost_by_level[1] - energy_cost_by_level[1])
        const start_energies_2 = parseInt($("#energies-started-level-2").val())
        const start_energies_1 = start_energies - start_energies_2 * 2
        consumed_points -= (energy_cost_by_level[2] * start_energies_2 + energy_cost_by_level[1] * start_energies_1)
    }

    // Talents
    consumed_points += talents_cost()

    // Monk powers
    consumed_points += monk_power_cost()

    // Show difference with total points
    const total_points = parseInt($("#adventure-points").val()) + parseInt($("#adventure-points-discount").val())
    $("#remaining-adventure-points").text(total_points - consumed_points)
}
