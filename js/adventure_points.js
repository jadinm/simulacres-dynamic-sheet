$(".component,.means,.realm,.energy,.special-energy,.adventure-points-setting").on("change", compute_remaining_ap)
$("select.adventure-points-select").on("changed.bs.select", compute_remaining_ap)

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

$("select.talent-select.adventure-points-select").on("changed.bs.select", (e, clickedIndex, isSelected, previousValue) => {
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
})

function update_numeric_input_select(select, input_selector) {
    let only_at_levels = select.getAttribute("data-filter-current-level")
    if (only_at_levels != null)
        only_at_levels = only_at_levels.split(",")
    const elements = input_selector.filter((i, elem) => {
        return only_at_levels == null || only_at_levels.includes(elem.value)
    }).map((i, elem) => {
        const new_image = $(elem).parent().find(".input-prefix").clone(true, false)
        const div = $(elem).parents("[title]").first()
        let name = div.attr("title")
        if (!name || name.length === 0)
            name = div.attr("data-original-title")
        new_image.removeClass("input-prefix")
        new_image.attr("width", "1em")
        new_image.attr("height", "1em")
        return {name: name, content: new_image[0].outerHTML + "&nbsp;" + name}
    })
    update_select($(select), elements)
}

function update_realm_energy_select(select) {
    update_numeric_input_select(select, $(".energy,.realm"))
}

function update_special_energy_select(select) {
    update_numeric_input_select(select, $(".special-energy"))
}

function update_component_select(select) {
    update_numeric_input_select(select, $(".component"))
}

function update_spell_select(select) {
    let only_at_levels = select.getAttribute("data-filter-current-level")
    if (only_at_levels != null)
        only_at_levels = only_at_levels.split(",")
    let exclude_spell_lists = select.getAttribute("data-filter-out-list")
    if (exclude_spell_lists != null)
        exclude_spell_lists = exclude_spell_lists.split(',')
    const elements = $(".spell-name").filter((i, elem) => {
        const spell_level = row_elem(elem, "difficulty").text()
        const spell_list = row_elem(elem, "list").val()
        return elem.value && elem.value.length > 0 && (only_at_levels == null || only_at_levels.includes(spell_level))
            && (exclude_spell_lists == null || spell_list == null || !exclude_spell_lists.includes(spell_list))
    }).map((i, elem) => {
        return {name: elem.value, content: null, value: elem.id}
    })
    update_select($(select), elements)
}

$(".energy,.realm").on("change", _ => {
    $("select.realm-energy-select").each((i, elem) => {
        update_realm_energy_select(elem)
    })
})
$(".special-energy").on("change", _ => {
    $("select.special-energy-select").each((i, elem) => {
        update_special_energy_select(elem)
    })
})
$(".component").on("change", _ => {
    $("select.component-select").each((i, elem) => {
        update_component_select(elem)
    })
})

$("#investment-table td[data-toggle='tooltip']").each((i, elem) => {
    $(elem).tooltip()
})
