/* This file handles the talent lists */

regex_talent_from_id = /talent_(x|(?:-4)|(?:-2)|0)\d*/

function talent_level(talent, target_list = null) {
    const list = (target_list) ? target_list : $(talent).parents(".talent-list")[0]
    if (list == null)
        return "x"
    return list.id.replace("talents_", "")
}

function talent_base_level(talent) {
    return talent.id.match(regex_talent_from_id)[1]
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
        return Math.max(0, cost - advised_talent_save)
    return cost
}

function update_select(select, elements) {
    const is_template = select[0].id.includes("-x-")

    // Find the selected option
    let selected_options = !is_template ? select.selectpicker('val') : []
    if (!Array.isArray(selected_options))
        selected_options = [selected_options]
    select.empty()

    // Sort it
    elements.sort((a, b) => {
        return a.localeCompare(b) // Sort correctly accents
    }).each((i, elem) => {
        let new_option = "<option value='" + elem + "'"
        if (selected_options.includes(elem)) // Keep selection
            new_option += " selected='selected'"
        new_option += ">" + elem + "</option>"
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
function update_talent_select(select) {
    const is_template = select[0].id.includes("-x-")
    // Find the selected option
    let selected_options = !is_template ? select.selectpicker('val') : []
    if (!Array.isArray(selected_options))
        selected_options = [selected_options]

    // Recover talent list, potentially filtered
    const only_from = select[0].getAttribute("data-talent-filter-origin-level")
    const talent_list = $(talent_list_selector).filter((i, e) => {
        return e.value && e.value.length > 0
            && (only_from == null || talent_base_level($(e).parents(".talent")[0]) === only_from)
    }).map((i, e) => e.value)
    update_select(select, talent_list)
}

function add_talent(list, fixed_id = null) {
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

    // Update all list selections of talents
    $("select.talent-select").each((i, elem) => {
        update_talent_select($(elem))
    })
    // Update rolls
    $(".roll-value").each((i, elem) => {
        update_roll_value($(elem))
    })
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

function add_missing_talents(talents) {
    // Insert missing default talent if they do not exist
    for (const [level, level_talents] of Object.entries(talents)) {
        for (const talent of level_talents) {
            if ($("input[value=\"" + talent + "\"]").length === 0) {
                const elem = add_talent($("#talents_" + level)).find("input")
                elem.val(talent)
                elem.trigger("change")
            }
        }
    }
}

add_missing_talents(default_talents)

function update_talent_tooltip(talent, target_list = null) {
    const current_level = talent_level(talent, target_list)
    const old_level = talent_base_level(talent)
    if (current_level !== old_level) {
        const old_level = talent_base_level(talent)
        const cost = talent_cost(talent)
        if (!isNaN(cost)) {
            talent.setAttribute("data-original-title",
                "Talent " + old_level.toUpperCase() + " à la base <br />" + "Coût: " + talent_cost(talent) + " PA")
            $(talent).find(".talent-origin").text("< " + old_level.toUpperCase())
        } else {
            talent.setAttribute("data-original-title",
                "Talent " + old_level.toUpperCase() + " à la base <br />" + "Mouvement invalide")
            $(talent).find(".talent-origin").text("< " + old_level.toUpperCase() + " (Mouvement invalide)")
        }
        $(talent).addClass("increased-talent").tooltip({disabled: false})
    } else {
        talent.setAttribute("data-original-title", "")
        $(talent).removeClass("increased-talent").tooltip({disabled: true})
        $(talent).find(".talent-origin").text("")
    }
}

function update_talent(event) {
    update_talent_tooltip(event.item, event.to)

    // Update rolls
    $(".roll-value").each((i, elem) => {
        update_roll_value($(elem))
    })

    // Update armor penalty
    recompute_armor_penalty()

    // Update Adventure points
    compute_remaining_ap()

    changed_page = true
}

$(".talent input[id*='-name']").on("change", _ => {
    // Update all list selections of talents
    $("select.talent-select").each((i, elem) => {
        update_talent_select($(elem))
    })
})

$('.talent-list').each((i, elem) => {
    $(elem).sortable({
        handle: '.fa-arrows-alt',
        group: 'talent-lists',
        dragoverBubble: true,
        onEnd: update_talent,
        onMove: (e, _) => {
            // Prevent moves that have an invalid PA cost
            if (isNaN(talent_cost(e.dragged, e.to))) {
                return false
            }
            return e.willInsertAfter ? 1 : -1
        }
    })
})

$("select.talent-select").each((i, elem) => {
    update_talent_select($(elem))
    changed_page = false // Because this is not changed by the user
})

$('.remove-talent').sortable({
    group: 'talent-lists', // So that it can delete those items
    ghostClass: "remove-drop",
    onAdd: event => {
        // Remove the element
        $(event.item).remove()

        // Update rolls
        $(".roll-value").each((i, elem) => {
            update_roll_value($(elem))
        })

        changed_page = true
    }
})
