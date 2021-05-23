/* This file handles the talent lists */

regex_talent_from_id = /talent_(x|(?:-4)|(?:-2)|0|1)(\d*)/

function talent_from_name(name, from_elem = $("#talent-tab")) {
    if (name == null)
        return $()
    return from_elem.find("input[value='" + name.replace("'", "\\'") + "']")
}

function talent_index(talent) {
    return parseInt(talent.id.match(regex_talent_from_id)[2])
}

function talent_level(talent, target_list = null) {
    const list = (target_list) ? target_list : $(talent).parents(".talent-list")[0]
    if (list == null)
        return "0"
    return list.id.replace("talents_", "")
}

function talent_base_level(talent) {
    talent = $(talent)
    if (!talent.hasClass("talent"))
        talent = talent.parents(".talent").first()
    return talent.length > 0 ? talent[0].id.match(regex_talent_from_id)[1] : "0"
}

function talent_cost(talent, list = null) {
    const current_value = talent_level(talent, list)
    let old_value = talent_base_level(talent)

    const talent_name = $(talent).find("input").val()
    if (work_talents().includes(talent_name)) {
        // Check that it is not a work talent
        old_value = "0" // Compute PA cost from level 0
    }
    if (main_work_talents().includes(talent_name)) {
        // Check that it is not the main work talent
        old_value = "1" // Compute PA cost from level 1
    }

    let cost = talent_increment_cost[old_value][current_value]

    if (talent_x_inefficient_raise().includes(talent_name) && parseInt(current_value) >= 0) {
        // 6 PA were consumed to raise this talent from X to 0 instead of 5
        cost += indirect_x_to_0_raise_cost
    }

    if (advised_talent().includes(talent_name))
        cost = Math.max(0, cost - advised_talent_save)
    return cost
}

function get_selected_options(select, new_value, old_value) {
    const is_template = select[0].id.includes("-x-")

    // Find the selected option
    let selected_options = !is_template ? select.selectpicker('val') : []
    if (!Array.isArray(selected_options))
        selected_options = [selected_options]
    selected_options = $(selected_options).map((i, elem) => {
        if (elem === old_value) { // Update selection based on the changed value
            elem = new_value
        }
        return elem
    }).toArray().flat()
    return selected_options
}

function update_select(select, elements, new_value, old_value) {
    const is_template = select[0].id.includes("-x-")

    // Find the selected option
    let selected_options = get_selected_options(select, new_value, old_value)
    select.empty()

    // Sort it
    elements.sort((a, b) => {
        return a.name.localeCompare(b.name) // Sort correctly accents
    }).each((i, elem) => {
        const value = (elem.hasOwnProperty("value") ? elem.value : elem.name)
        let new_option = "<option value=\"" + value + "\""
        if (elem.content) {// Custom data-content (like images)
            new_option += " data-content='" + elem.content.replaceAll("'", "&apos;") + "'"
        }
        if (selected_options.includes(value)) // Keep selection
            new_option += " selected='selected'"
        new_option += ">" + elem.name + "</option>"
        select.append(new_option)
    })

    if (!is_template) {// Ignore template lines
        select.selectpicker("refresh")
    }
    changed_page = true
}

/**
 * Update the select options based on a talent list
 */
function update_talent_select(select, new_value, old_value) {
    // Recover talent list, potentially filtered
    const only_from = select[0].getAttribute("data-talent-filter-origin-level")
    let only_at_levels = select[0].getAttribute("data-talent-filter-current-level")
    if (only_at_levels != null)
        only_at_levels = only_at_levels.split(",")
    const talent_list = $(talent_list_selector).filter((i, e) => {
        const talent = $(e).parents(".talent")[0]
        return e.value && e.value.length > 0
            && (only_from == null || talent_base_level(talent) === only_from)
            && (only_at_levels == null || only_at_levels.includes(talent_level(talent)))
    }).map((i, e) => {
        return {name: e.value, content: null}
    })
    talent_list.push({name: "", content: null})
    update_select(select, talent_list, new_value, old_value)
}

function add_talent(list, fixed_id = null, bulk = false) {
    if (list.length === 0)
        return $()
    const initial_level = list[0].id.replace("talents_", "")

    // Find new id
    let new_id_idx = 0
    if (fixed_id === null) {
        while ($("#talent_" + initial_level + new_id_idx).length > 0)
            new_id_idx++
    } else {
        new_id_idx = fixed_id
    }

    // Clone and set ids
    const new_talent = $("#talent_" + initial_level).clone(true, true)
    new_talent[0].id = "talent_" + initial_level + new_id_idx
    const input = $(new_talent).find("input")
    input[0].id = initial_level + new_id_idx + "-name"
    input[0].value = ""
    input[0].setAttribute("value", "")
    const label = $(new_talent).find("label")[0]
    label.for = initial_level + new_id_idx + "-name"
    $(new_talent).removeAttr("hidden")
    $(new_talent).tooltip()

    list.children().last().before(new_talent)
    // Update talent tooltip if needed
    update_talent_tooltip(new_talent[0])

    // Update all list selections of talents
    if (!bulk) {
        $("select.talent-select").each((i, elem) => {
            update_talent_select($(elem))
        })
    }
    // Update armor penalty
    recompute_armor_penalty()
    return new_talent
}

$("#add-talent-x").on("click", (event, idx = null) => { // Add parameter to fix the id
    add_talent($("#talents_x"), idx)
})
$("#add-talent--4").on("click", (event, idx = null) => { // Add parameter to fix the id
    add_talent($("#talents_-4"), idx)
})
$("#add-talent--2").on("click", (event, idx = null) => { // Add parameter to fix the id
    add_talent($("#talents_-2"), idx)
})
$("#add-talent-0").on("click", (event, idx = null) => { // Add parameter to fix the id
    add_talent($("#talents_0"), idx)
})
$("#add-talent-1").on("click", (event, idx = null) => { // Add parameter to fix the id
    add_talent($("#talents_1"), idx)
})

function add_missing_talents(talents) {
    // Insert missing default talent if they do not exist
    for (const [level, level_talents] of Object.entries(talents)) {
        for (const talent of level_talents) {
            if (talent_from_name(talent).length === 0) {
                const elem = add_talent($("#talents_" + level), null, true).find("input")
                elem.val(talent)
                elem.trigger("change")
            }
        }
    }
    // Update all list selections of talents
    $("select.talent-select").each((i, elem) => {
        update_talent_select($(elem))
    })
}

function update_talent_tooltip(talent, target_list = null) {
    const current_level = talent_level(talent, target_list)
    const old_level = talent_base_level(talent)
    if (current_level !== old_level) {
        const cost = talent_cost(talent, target_list)
        if (!isNaN(cost)) {
            if (!intermediate_discovery) {
                talent.setAttribute("data-original-title",
                    "Talent " + old_level.toUpperCase() + " à la base <br />" + "Coût: " + cost + " PA")
                $(talent).find(".talent-origin").text("< " + old_level.toUpperCase())
                $(talent).addClass("increased-talent")
            }
        } else {
            talent.setAttribute("data-original-title",
                "Talent " + old_level.toUpperCase() + " à la base <br />" + "Mouvement invalide")
            $(talent).find(".talent-origin").text("< " + old_level.toUpperCase() + " (Mouvement invalide)")
        }
        $(talent).tooltip({disabled: false})
    } else {
        talent.setAttribute("data-original-title", "")
        if (!intermediate_discovery) {
            $(talent).removeClass("increased-talent").tooltip({disabled: true})
        }
        $(talent).find(".talent-origin").text("")
    }
}
add_missing_talents(default_talents)
$(".talent").each((i, elem) => {
    if (elem.getAttribute("hidden") == null)
        update_talent_tooltip(elem)
})

function update_talent(event) {
    update_talent_tooltip(event.item, event.to)

    // Update all list selections of talents that are changed when a talent level is changed
    $("select.talent-select[data-talent-filter-current-level]").each((i, elem) => {
        update_talent_select($(elem))
    })

    // Update rolls
    $(".row-roll-trigger").each((i, elem) => {
        row_of(elem).update_roll_value(elem)
    })

    // Update armor penalty
    recompute_armor_penalty()

    // Update Adventure points
    compute_remaining_ap()

    changed_page = true
}

$(".talent input[id*='-name']").on("change", e => {
    // Update all list selections of talents while changing the selection value if the changed talent was selected
    $("select.talent-select").each((i, elem) => {
        update_talent_select($(elem), e.target.value, e.target.oldvalue)
    })
    e.target.oldvalue = null
}).on("focus", e => {
    e.target.oldvalue = e.target.value
})

$('.talent-list').each((i, elem) => {
    $(elem).sortable({
        handle: '.fa-arrows-alt',
        group: 'talent-lists',
        dragoverBubble: true,
        onEnd: update_talent,
        onMove: (e, _) => {
            // Prevent moves that have an invalid PA cost
            if (!$(e.to).hasClass("remove-talent") && isNaN(talent_cost(e.dragged, e.to))) {
                return false
            }
            return e.willInsertAfter ? 1 : -1
        }
    })
})

$("select.talent-select").each((i, elem) => {
    update_talent_select($(elem))
})

$('.remove-talent').sortable({
    group: 'talent-lists', // So that it can delete those items
    ghostClass: "remove-drop",
    onAdd: event => {
        // Remove the element
        $(event.item).tooltip("dispose")
        $(event.item).remove()

        // Update rolls
        $(".row-roll-trigger").each((i, elem) => {
            row_of(elem).update_roll_value(elem)
        })

        // Update all list selections of talents
        $("select.talent-select").each((i, elem) => {
            update_talent_select($(elem))
        })

        changed_page = true
    }
})

$("#talent-search").on("change", event => {
    let value = $(event.target).val().toLowerCase()
    $(".talent input").each((i, elem) => {
        if (!elem.getAttribute("hidden")) {
            const content = $(elem).val().toLowerCase()
            if (content.includes(value)) {
                $(elem).parents(".talent").removeClass("d-none")
            } else {
                $(elem).parents(".talent").addClass("d-none")
            }
        }
    })
})
