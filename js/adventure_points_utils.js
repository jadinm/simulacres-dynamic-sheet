/* Remaining adventure point computation */

function compute_component_means_cost() {
    let consumed_points = 0

    // Components
    let sum_points = 0
    let raised_to_6 = 0
    $(".component").each((i, elem) => {
        sum_points += (parseInt(elem.value) || 0)
        if (parseInt(elem.value) === 6)
            raised_to_6 += 1
    })
    if (sum_points > start_components)
        consumed_points += (sum_points - start_components) * component_ap_cost

    // V8-only: Add costs for components raised to 6 (but not at the start of the campaign)
    raised_to_6 -= ($("#components-started-level-6").val() || []).length
    if (!is_v7 && raised_to_6 > 0)
        consumed_points += raised_to_6 * (component_5_to_6_ap_cost - component_ap_cost)

    let title = $("#component-title")
    if (title.length > 0 && !intermediate_discovery) {
        title[0].setAttribute("title", "Coût des composantes: " + consumed_points + " PA")
        title.tooltip("dispose")
        title.tooltip()
    }

    // Means
    sum_points = 0
    let means_cost = 0
    $(".means").each((i, elem) => {
        sum_points += (parseInt(elem.value) || 0)
    })
    if (sum_points > start_means)
        means_cost += (sum_points - start_means) * means_ap_cost
    consumed_points += means_cost
    title = $("#means-title")
    if (title.length > 0 && !intermediate_discovery) {
        title[0].setAttribute("title", "Coût des moyens: " + means_cost + " PA")
        title.tooltip("dispose")
        title.tooltip()
    }
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
    let diff = (max_breath - start_breath) * breath_ap_cost
    consumed_points += diff
    let title = $("#breath-title")
    if (title.length > 0 && !intermediate_discovery) {
        title[0].setAttribute("title", "Coût: " + diff + " PA")
        title.tooltip("dispose")
        title.tooltip()
    }

    // Psychic balance
    const psychic = $("#psychic")
    let max_psychic = slider_max(psychic[0])
    if ($("#mind").hasClass("bonus-applied")) { // +1 due to mind value
        max_psychic -= 1
    }
    diff = (max_psychic - start_psychic_balance) * psychic_balance_ap_cost
    consumed_points += diff
    title = $("#psychic-title")
    if (title.length > 0 && !intermediate_discovery) {
        title[0].setAttribute("title", "Coût: " + diff + " PA")
        title.tooltip("dispose")
        title.tooltip()
    }
    return consumed_points
}

function talents_cost() {
    let consumed_points = 0
    $(".talent").each((i, elem) => {
        if (!elem.hasAttribute("hidden"))
            consumed_points += talent_cost(elem)
    })
    return consumed_points
}

function monk_power_cost() {
    let consumed_points = 0
    $("#ki-table .spell-level").each((i, elem) => {
        let diff = 0
        const value = parseInt(elem.value)
        if (!isNaN(value) && value > 1 && value <= 3) {
            diff = power_level_ap_cost
            consumed_points += diff
        }

        const row = DataRow.of(elem)
        let title = row.data.children().first()
        if (title.length > 0 && row.id !== "ki-x" && !intermediate_discovery) {
            title.each((i, elem) => elem.setAttribute("title", "Coût: " + diff + " PA"))
            title.tooltip("dispose")
            title.tooltip()
        }
    })
    return consumed_points
}
