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
        /* Recover image if any */
        let base_image = $(elem).parent().find(".input-prefix")
        if (base_image.length === 0) {
            base_image = $("input[id=\"" + elem.id + "-label\"").parent().find(".input-prefix")
        }
        const new_image = base_image.clone(true, false)
        new_image.removeClass("input-prefix")
        new_image.attr("width", "1em")
        new_image.attr("height", "1em")

        /* Find energy name, either in a tooltip, in the label, in a side input
         * or in the id without other alternative
         */
        const div = $(elem).parents("[title]").first()
        let name = div.attr("title")
        if (!name || name.length === 0)
            name = div.attr("data-original-title")
        if (!name || name.length === 0) {
            name = $("label[for=\"" + elem.id + "\"").text()
            if (name)
                name = name.trim()
        }
        if (!name || name.length === 0) {
            name = $("input[id=\"" + elem.id + "-label\"").val()
            if (name)
                name = name.trim()
        }
        if (!name || name.length === 0)
            name = elem.id

        /* Have content */
        let content = ""
        if (new_image.length > 0)
            content += new_image[0].outerHTML + "&nbsp;"
        content += name
        return {name: name, content: content, value: elem.id}
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
    let include_spell_lists = select.getAttribute("data-filter-list")
    if (include_spell_lists != null)
        include_spell_lists = include_spell_lists.split(',')
    let no_realm = select.getAttribute("data-no-realm-id")
    const elements = $(".spell-name").filter((i, elem) => {
        const spell_list = SpellRow.of(elem).get("list").val()
        return elem.value && elem.value.length > 0
            && (exclude_spell_lists == null || spell_list == null || !exclude_spell_lists.includes(spell_list))
            && (include_spell_lists == null || spell_list == null || include_spell_lists.includes(spell_list))
    }).map((i, elem) => {
        // Get spell difficulties of each realm
        const spell = SpellRow.of(elem)
        if (!no_realm) {
            const realm_list = spell.data.find("input[name*=-realm]:checked")
            return realm_list.map((j, checkbox) => {
                const realm = spell.realm(checkbox)
                const realm_svg = $("label[for=\"" + checkbox.id + "\"] svg").first().clone(false, false).removeClass("input-prefix").get(0)
                const spell_level = spell.get("difficulty", checkbox).text()
                if (only_at_levels == null || only_at_levels.includes(spell_level)) {
                    let content = sanitize(elem.value)
                    if (realm_list.length > 1) { // Show realm symbol because there are several realms for the same spell
                        content += "&nbsp;" + realm_svg.outerHTML
                    }
                    return {name: elem.value, content: content, value: spell.id + "-" + realm}
                } else {
                    return []
                }
            }).toArray()
        }
        return {name: elem.value, content: null, value: spell.id}
    })
    update_select($(select), $(elements.toArray().flat()))
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
