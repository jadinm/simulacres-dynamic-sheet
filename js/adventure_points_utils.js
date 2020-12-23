/* Remaining adventure point computation */

function compute_component_means_cost() {
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
    return consumed_points
}

function compute_status_cost() {
    let consumed_points = 0
    // Breath
    const breath = $("#breath")
    let max_breath = slider_max(breath[0])
    if ($("#heart").hasClass("bonus-applied")) { // +1 due to heart value
        max_breath -= 1
    }
    if ($("#instincts").hasClass("bonus-applied")) { // +1 due to instincts value
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
    return consumed_points
}

function talents_cost() {
    let consumed_points = 0
    $(".talent").each((i, elem) => {
        consumed_points += talent_cost(elem)
    })
    return consumed_points
}

function monk_power_cost() {
    let consumed_points = 0
    $(".ki-level").each((i, elem) => {
        const value = parseInt(elem.value)
        if (!isNaN(value) && value > 0 && value <= 3) {
            consumed_points += (value - 1) * power_level_ap_cost
        }
    })
    return consumed_points
}
