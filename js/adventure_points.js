/* Remaining adventure point computation */

const start_components = 18
const component_ap_cost = 20
const start_means = 10
const means_ap_cost = 10
const start_breath = 4
const breath_ap_cost = 30
const start_psychic_balance = 4
const psychic_balance_ap_cost = 30

const start_energies = 8
const energy_cost_by_level = [0, 5, 15, 35]

const talent_increment_cost = {
    x: {x: 0, "-4": 2, "-2": 3, "0": 5, "1": 10, "2": 30, "3": 70},
    "-4": {x: 0, "-4": 0, "-2": 1, "0": 4, "1": 9, "2": 29, "3": 69},
    "-2": {x: 0, "-4": 0, "-2": 0, "0": 3, "1": 8, "2": 28, "3": 68},
    "0": {x: 0, "-4": 0, "-2": 0, "0": 0, "1": 5, "2": 25, "3": 65}
}
const mage_spell_ap_cost = talent_increment_cost["x"]["-4"]
const ki_divine_spell_ap_cost = talent_increment_cost["x"]["0"]

const power_level_ap_cost = 5 // From 1 to 2 and from 2 to 3

function compute_remaining_ap() {
    let consumed_points = 0

    // Components
    let sum_points = 0
    $(".component").each((i, elem) => {
        sum_points += parseInt(elem.value)
    })
    if (sum_points > start_components)
        consumed_points += (sum_points - start_components) * component_ap_cost

    // Means
    sum_points = 0
    $(".means").each((i, elem) => {
        sum_points += parseInt(elem.value)
    })
    if (sum_points > start_means)
        consumed_points += (sum_points - start_means) * means_ap_cost

    // Breath
    const breath = $("#breath")
    let max_breath = slider_max(breath[0])
    if ($("#heart").hasClass("bonus-applied")) { // +1 due to heart value
        max_breath -= 1
    }
    consumed_points += (max_breath - start_breath) * breath_ap_cost

    // Psychic balance
    const psychic = $("#psychic")
    let max_psychic = slider_max(psychic[0])
    if ($("#mind").hasClass("bonus-applied")) { // +1 due to mind value
        max_psychic -= 1
    }
    consumed_points += (max_psychic - start_psychic_balance) * psychic_balance_ap_cost

    // Realm & energies
    let energy_point_increased = 0
    const energies_repartition_level = [0, 0, 0, 0] // Level ranges from 0 to 3
    $(".realm, .energy").each((i, elem) => {
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
        const start_energies_2 = parseInt($("#energies-started-level-2").val())
        const start_energies_1 = start_energies - start_energies_2 * 2
        consumed_points -= (energy_cost_by_level[2] * start_energies_2 + energy_cost_by_level[1] * start_energies_1)
    }

    // Talents
    let job_talent_found = false
    $(".talent").each((i, elem) => {
        // Current talent level
        const current_value = talent_level(elem)
        if (current_value === "1")
            job_talent_found = true

        // Initial talent level
        const old_value = talent_base_level(elem)
        consumed_points += talent_increment_cost[old_value][current_value]
    })
    // Initial talents of the job were raised to 0
    consumed_points -= talent_increment_cost["x"]["0"] * parseInt($("#job-talents-x").val())
    consumed_points -= talent_increment_cost["-4"]["0"] * parseInt($("#job-talents-4").val())
    consumed_points -= talent_increment_cost["-2"]["0"] * parseInt($("#job-talents-2").val())
    // Main talent of the job was raised to 1
    if (job_talent_found)
        consumed_points -= talent_increment_cost["0"]["1"]
    // Advised talents for the job reduces their cost by 1 PA
    consumed_points -= parseInt($("#advised-talents").val())

    // Spells
    $(".spell-list").each((i, elem) => {
        const value = elem.value.trim()
        if (value === priest_energy)
            consumed_points += ki_divine_spell_ap_cost // Priest and monk have level 0 spell directly
        else if (value.length > 0)
            consumed_points += mage_spell_ap_cost // Mages have -4 level spells at start
    })
    // Spell increased above level 0 at start of the campaign
    const diff_level_2 = talent_increment_cost["x"]["-2"] - talent_increment_cost["x"]["-4"]
    consumed_points += diff_level_2 * parseInt($("#spells-started-level-2").val())
    const diff_level_0 = talent_increment_cost["x"]["0"] - talent_increment_cost["x"]["-4"]
    consumed_points += diff_level_0 * parseInt($("#spells-started-level-0").val())
    // Spells of same realm for the job reduces their cost by 1 PA
    consumed_points -= parseInt($("#same-spells-different-realms").val())

    // Monk powers
    $(".ki-level").each((i, elem) => {
        const value = parseInt(elem.value)
        if (!isNaN(value) && value > 0 && value <= 3) {
            consumed_points += (value - 1) * power_level_ap_cost
        }
    })

    // Show difference with total points
    const total_points = parseInt($("#adventure-points").val()) + parseInt($("#adventure-points-discount").val())
    $("#remaining-adventure-points").text(total_points - consumed_points)
}

$(".component,.means,.realm,.energy,.adventure-points-setting,.ki-level").on("change", compute_remaining_ap)
