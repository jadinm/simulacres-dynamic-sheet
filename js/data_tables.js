/* Update the spell difficulty */

const row_id_regex = /(\w+-(x|\d+))-?(.*)/

function row(base_elem) {
    const base_id = base_elem.id.match(row_id_regex)[1]
    return $("#" + base_id)
}

function row_elem(base_elem, element_id_suffix) {
    const base_id = base_elem.id.match(row_id_regex)[1]
    return $("#" + base_id + "-" + element_id_suffix)
}

/* Add new rows to tables */

function add_row(table, new_elem, fixed_idx = null) {
    let new_id
    if (fixed_idx === null) {
        // Increment the spell id
        let max_tr_id = -1
        table.children().each((i, elem) => {
            let old_value = elem.id.split("-").pop()
            if (old_value === "x")
                old_value = "-1"
            max_tr_id = Math.max(parseInt(old_value) || 0, max_tr_id)
        })
        new_id = max_tr_id + 1
    } else {
        // Use requested idx
        new_id = fixed_idx
    }

    // Replace all '-x-' in the attributes of the new row
    $.each(["id", "name", "for", "data-slider-id", "aria-labelledby", "data-target", "aria-controls"], (i, attr) => {
        new_elem.find("*[" + attr + "*=-x-]").each((i, elem) => {
            elem.setAttribute(attr, elem.getAttribute(attr).replace("-x-", "-" + new_id + "-"))
        })
    })
    new_elem[0].id = new_elem[0].id.replace("-x", "-" + new_id)
    table.append(new_elem)
    new_elem.removeAttr("hidden")

    return new_id
}

/* Add new equipment, spell and roll rows */

$("#add-focus").on("click", (event, idx = null) => { // Add parameter for forced index
    add_row($("#focus-table"), $("#focus-x").clone(true, true), idx)
})

$("#add-magical-equipment").on("click", (event, idx = null) => { // Add parameter for forced index
    add_row($("#magical-equipment-table"), $("#magical-equipment-x").clone(true, true), idx)
})

$("#add-limitedUse-equipment").on("click", (event, idx = null) => { // Add parameter for forced index
    add_row($("#limitedUse-equipment-table"), $("#limitedUse-equipment-x").clone(true, true), idx)
})

$("#add-equipment").on("click", (event, idx = null) => { // Add parameter for forced index
    add_row($("#equipment-table"), $("#equipment-x").clone(true, true), idx)
})

$("#add-ki").on("click", (event, idx = null) => { // Add parameter for forced index
    const new_row = $("#ki-x").clone(true, false)
    add_row($("#ki-table"), new_row, idx)
    const select = row_elem(new_row[0], "name")
    select.selectpicker()
    add_save_to_dom_listeners(new_row)
    new_row.find(".ki-level").on("change", compute_remaining_ap)
})

/* Sortable handling */

$('#roll-table,#spell-table,#focus-table,#magical-equipment-table,#limitedUse-equipment-table,#equipment-table,#ki-table,#note-table,#dual_wielding-table').each((i, elem) => {
    $(elem).sortable({
        handle: '.fa-arrows-alt',
        dragoverBubble: true,
        group: elem.id,
        onEnd: _ => {
            changed_page = true
        }
    })
})

/* Remove */

$('#roll-table-remove,#spell-table-remove,#focus-table-remove,#limitedUse-equipment-table-remove,#magical-equipment-table-remove,#equipment-table-remove,#ki-table-remove,#note-table-remove,#dual_wielding-table-remove').each((i, elem) => {
    $(elem).sortable({
        group: elem.id.replace("-remove", ""), // So that it can delete the appropriate table items
        ghostClass: "remove-drop",
        onAdd: event => {
            // Remove the element
            $(event.item).remove()

            changed_page = true
        }
    })
})
