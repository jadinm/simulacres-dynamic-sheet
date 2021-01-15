$(".component,.means,.realm,.energy,.special-energy,.adventure-points-setting").on("change", compute_remaining_ap)

function work_talents() {
    let val = $("#work-talents").val()
    if (!Array.isArray(val))
        val = [val]
    return val
}

function main_work_talents() {
    let val = $("#work-main-talent").val()
    if (!Array.isArray(val))
        val = [val]
    return val
}

function advised_talent() {
    let val = $("#advised-talents").val()
    if (!Array.isArray(val))
        val = [val]
    return val
}

function talent_x_inefficient_raise() {
    let val = $("#talents-inefficient-raise").val()
    if (!Array.isArray(val))
        val = [val]
    return val
}

$(".talent-select.adventure-points-select").on("changed.bs.select", (e, clickedIndex, isSelected, previousValue) => {
    // Retrieve all talents that were selected or removed
    let talents_to_update = $(e.target).selectpicker("val")
    if (!Array.isArray(talents_to_update))
        talents_to_update = [talents_to_update]
    if (previousValue) {
        if (!Array.isArray(previousValue))
            previousValue = [previousValue]
        for (let i = 0; i < previousValue.length; i++) {
            if (!talents_to_update.includes(previousValue[i]))
                talents_to_update.push(previousValue[i])
        }
    }

    const talents = $(".talent").filter((_, elem) => {
        for (let i = 0; i < talents_to_update.length; i++) {
            if (talent_from_name(talents_to_update[i], $(elem)).length > 0)
                return true
        }
        return false
    })
    if (talents.length > 0) {
        for (let i = 0; i < talents_to_update.length; i++) {
            update_talent_tooltip(talents[i])
        }
    }
    compute_remaining_ap()
})

$("#investment-table td[data-toggle='tooltip']").each((i, elem) => {
    $(elem).tooltip()
})
